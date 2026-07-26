<script setup lang="ts">
import { Api, Model } from 'spacegate-admin-client'
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

import { getSavedWasmPluginImageSchema, type JsonSchema } from '../api/aiGateway'
import { pluginConfigInstanceId } from '../utils/pluginInstance'
import {
  updateNativePluginRuntimeConfig,
  updateWasmPluginRuntimeConfig,
} from '../utils/pluginRuntimeConfig'
import { isWasmPluginCode, type BoundWasmConfigMode } from '../utils/wasmPlugin'
import SchemaForm from './SchemaForm.vue'

const props = defineProps<{
  config: Model.PluginConfig
  allConfigs: Model.PluginConfig[]
}>()

type EditorMode = 'schema' | 'json' | 'yaml' | 'xml'

const mode = ref<EditorMode>('json')
const schema = ref<JsonSchema | null>(null)
const schemaLoading = ref(false)
const schemaError = ref('')
const runtimeObject = ref<Record<string, any>>({})
const rawText = ref('{}')
const schemaFormRef = ref<InstanceType<typeof SchemaForm> | null>(null)
const isWasm = computed(() => isWasmPluginCode(props.config.code))
const hasSchema = computed(() => Boolean(schema.value && Object.keys(schema.value).length > 0))
const rawPlaceholder = computed(() => {
  if (mode.value === 'xml') return '<config />'
  if (mode.value === 'yaml') return 'enabled: true'
  return '{\n  "enabled": true\n}'
})
const availableModes = computed<EditorMode[]>(() => (
  isWasm.value ? ['schema', 'json', 'yaml', 'xml'] : ['schema', 'json']
))

/** 获取绑定配置实际生效的运行时配置，兼容早期 default_config 字段。 */
function currentRuntimeConfig(config: Model.PluginConfig): Record<string, any> | string {
  const spec = config.spec as Record<string, unknown> | null
  const value = isWasmPluginCode(config.code)
    ? spec?.plugin_config ?? spec?.default_config ?? {}
    : spec ?? {}
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && !Array.isArray(value)) return JSON.parse(JSON.stringify(value))
  return {}
}

function resetEditor(config: Model.PluginConfig) {
  const value = currentRuntimeConfig(config)
  const configuredMode = (config.spec as Record<string, unknown> | null)?.binding_config_mode
  mode.value = isWasmPluginCode(config.code) && (configuredMode === 'yaml' || configuredMode === 'xml')
    ? configuredMode
    : 'schema'
  runtimeObject.value = typeof value === 'string' ? {} : value
  rawText.value = typeof value === 'string'
    ? value
    : mode.value === 'yaml'
      ? stringifyYaml(value)
      : JSON.stringify(value, null, 2)
}

/** 读取原生插件或绑定 Wasm 基础插件的表单 Schema。 */
async function loadSchema(config: Model.PluginConfig) {
  schemaLoading.value = true
  schemaError.value = ''
  try {
    if (isWasmPluginCode(config.code)) {
      const basePlugin = (config.spec as Record<string, unknown> | null)?.binding_base_plugin
      const baseConfig = typeof basePlugin === 'string'
        ? props.allConfigs.find((candidate) => candidate.code === config.code && candidate.kind === 'named' && candidate.name === basePlugin)
        : undefined
      schema.value = baseConfig ? await getSavedWasmPluginImageSchema(pluginConfigInstanceId(baseConfig)) : null
      if (!baseConfig) schemaError.value = '未找到该 Wasm 绑定对应的基础插件配置。'
    } else {
      const response = await Api.pluginSchema(config.code)
      schema.value = response.data ?? null
    }
  } catch (error: unknown) {
    schema.value = null
    schemaError.value = error instanceof Error ? error.message : String(error)
  } finally {
    schemaLoading.value = false
    if (!hasSchema.value && mode.value === 'schema') {
      mode.value = 'json'
      rawText.value = JSON.stringify(runtimeObject.value, null, 2)
    } else if (hasSchema.value && Object.keys(runtimeObject.value).length === 0) {
      void nextTick(() => schemaFormRef.value?.initDefaults(schema.value!, runtimeObject.value))
    }
  }
}

watch(
  () => props.config,
  (config) => {
    resetEditor(config)
    void loadSchema(config)
  },
  { immediate: true, deep: true },
)

function switchMode(next: EditorMode) {
  if (next === 'schema') {
    try {
      const parsed = parseRawConfig(mode.value)
      if (typeof parsed !== 'string') runtimeObject.value = parsed
    } catch {
      // 保留原文本，用户可切回文本模式修正格式。
    }
  } else if (next === 'json') {
    rawText.value = JSON.stringify(runtimeObject.value, null, 2)
  } else if (next === 'yaml') {
    rawText.value = stringifyYaml(runtimeObject.value)
  } else if (next === 'xml' && typeof currentRuntimeConfig(props.config) !== 'string') {
    rawText.value = ''
  }
  mode.value = next
}

/** 解析 JSON/YAML 文本模式；XML 作为原始文本保留。 */
function parseRawConfig(sourceMode: EditorMode): Record<string, any> | string {
  if (sourceMode === 'xml') return rawText.value.trim()
  const parsed = sourceMode === 'yaml' ? parseYaml(rawText.value) : JSON.parse(rawText.value)
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error(sourceMode === 'yaml' ? 'YAML 配置必须是对象。' : 'JSON 配置必须是对象。')
  }
  return parsed as Record<string, any>
}

/** 返回可直接持久化的完整配置，Wasm 仅更新运行时字段。 */
function buildUpdatedConfig(): Model.PluginConfig {
  let runtimeConfig: Record<string, any> | string
  try {
    runtimeConfig = mode.value === 'schema' ? runtimeObject.value : parseRawConfig(mode.value)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    ElMessage.error(message)
    throw error
  }

  if (!isWasm.value) {
    if (typeof runtimeConfig === 'string') throw new Error('原生插件配置必须是对象。')
    return updateNativePluginRuntimeConfig(props.config, runtimeConfig)
  }
  return updateWasmPluginRuntimeConfig(props.config, runtimeConfig, mode.value as BoundWasmConfigMode)
}

defineExpose({ buildUpdatedConfig })
</script>

<template>
  <section class="plugin-runtime-config">
    <div class="plugin-runtime-config__heading">
      <div>
        <strong>运行时配置</strong>
        <span>修改后仅更新插件的运行时参数，不会覆盖绑定范围、镜像或基础插件信息。</span>
      </div>
    </div>

    <div class="plugin-runtime-config__tabs">
      <button
        v-for="item in availableModes"
        :key="item"
        type="button"
        :class="['plugin-runtime-config__tab', mode === item && 'plugin-runtime-config__tab--active']"
        :disabled="item === 'schema' && !hasSchema"
        @click="switchMode(item)"
      >
        {{ item === 'schema' ? '表单' : item.toUpperCase() }}
      </button>
    </div>

    <el-alert
      v-if="schemaError"
      type="warning"
      :closable="false"
      :title="schemaError"
      description="可改用 JSON 编辑运行时配置。"
      show-icon
      class="plugin-runtime-config__alert"
    />

    <div v-loading="schemaLoading" class="plugin-runtime-config__content">
      <SchemaForm ref="schemaFormRef" v-if="mode === 'schema' && hasSchema" :schema="schema!" v-model="runtimeObject" />
      <el-input
        v-else
        v-model="rawText"
        type="textarea"
        :rows="14"
        :placeholder="rawPlaceholder"
        class="plugin-runtime-config__text"
      />
    </div>
  </section>
</template>

<style scoped>
.plugin-runtime-config { margin-top: 16px; }
.plugin-runtime-config__heading { margin-bottom: 10px; }
.plugin-runtime-config__heading strong { display: block; color: #0f172a; font-size: 14px; }
.plugin-runtime-config__heading span { display: block; margin-top: 4px; color: #64748b; font-size: 12px; line-height: 1.5; }
.plugin-runtime-config__tabs { display: flex; gap: 0; padding: 4px 4px 0; border-bottom: 1px solid #e2e8f0; border-radius: 8px 8px 0 0; background: #f8fafc; }
.plugin-runtime-config__tab { padding: 8px 14px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #64748b; cursor: pointer; font-size: 13px; }
.plugin-runtime-config__tab--active { border-bottom-color: #409eff; color: #2563eb; font-weight: 600; }
.plugin-runtime-config__tab:disabled { color: #cbd5e1; cursor: not-allowed; }
.plugin-runtime-config__alert { margin-top: 12px; }
.plugin-runtime-config__content { padding-top: 14px; }
.plugin-runtime-config__text :deep(textarea) { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; line-height: 1.55; }
</style>
