<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Model } from 'spacegate-admin-client'
import { useI18n } from 'vue-i18n'

import { keyPluginId } from '../utils'
import {
  pluginBindingDetailState,
  pluginInstanceDisplayName,
  type ManagedPluginConfig,
} from '../utils/pluginInstance'

const props = defineProps<{
  binding: Model.PluginBinding
  config?: Model.PluginConfig | null
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  save: [value: { priority: number; config?: ManagedPluginConfig }]
}>()

const visible = defineModel<boolean>({ required: true })
const { t } = useI18n()
const priority = ref(props.binding.priority ?? 0)
const displayName = ref('')
const initialDisplayName = ref('')

const state = computed(() => pluginBindingDetailState(props.config ?? undefined, props.error))
const pluginType = computed(() => state.value.kind === 'resolved'
  ? state.value.pluginType
  : (props.binding.code.toLowerCase().startsWith('wasm') ? 'wasm' : 'native'))
const instanceId = computed(() => keyPluginId(props.binding))
const spec = computed(() => (props.config?.spec ?? {}) as Record<string, unknown>)
const rawSpec = computed(() => JSON.stringify(props.config?.spec ?? {}, null, 2))
const pluginConfig = computed(() => JSON.stringify(spec.value.plugin_config ?? {}, null, 2))

watch(
  () => [props.binding, props.config] as const,
  () => {
    priority.value = props.binding.priority ?? 0
    displayName.value = props.config ? pluginInstanceDisplayName(props.config) : ''
    initialDisplayName.value = displayName.value
  },
  { immediate: true },
)

/** 提交挂载优先级，并在实例存在时携带更新后的管理展示名称。 */
function save() {
  const displayNameChanged = displayName.value.trim() !== initialDisplayName.value.trim()
  const config = props.config && displayNameChanged
    ? {
        ...props.config,
        display_name: displayName.value.trim() || null,
      } as ManagedPluginConfig
    : undefined
  emit('save', { priority: priority.value, config })
}
</script>

<template>
  <el-dialog v-model="visible" :title="t('title.pluginBindingDetail')" width="720px">
    <el-alert
      v-if="error"
      type="warning"
      :closable="false"
      :title="t('hint.pluginInstanceLoadFailed')"
      :description="error"
      show-icon
    />
    <el-alert
      v-else-if="!loading && state.kind === 'missing'"
      type="warning"
      :closable="false"
      :title="t('hint.pluginInstanceMissing')"
      show-icon
    />

    <el-descriptions v-loading="loading" :column="1" border class="plugin-binding-detail__summary">
      <el-descriptions-item :label="t('label.pluginType')">
        {{ pluginType === 'wasm' ? t('label.wasm') : t('label.native') }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('label.instanceId')">
        <code>{{ instanceId }}</code>
      </el-descriptions-item>
      <el-descriptions-item v-if="config" :label="t('label.displayName')">
        <el-input v-model="displayName" />
      </el-descriptions-item>
      <el-descriptions-item :label="t('label.priority')">
        <el-input-number v-model="priority" :step="100" />
      </el-descriptions-item>
    </el-descriptions>

    <template v-if="config && state.kind === 'resolved'">
      <el-descriptions v-if="state.pluginType === 'wasm'" :column="1" border>
        <el-descriptions-item :label="t('label.imageUrl')">
          {{ spec.image_url ?? spec.url ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('label.pluginName')">
          {{ spec.plugin_name ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('label.failStrategy')">
          {{ spec.fail_strategy ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('label.pluginConfig')">
          <pre>{{ pluginConfig }}</pre>
        </el-descriptions-item>
      </el-descriptions>

      <el-collapse class="plugin-binding-detail__raw">
        <el-collapse-item :title="t('label.runtimeConfig')" name="raw">
          <pre>{{ rawSpec }}</pre>
        </el-collapse-item>
      </el-collapse>
    </template>

    <template #footer>
      <el-button @click="visible = false">{{ t('button.cancel') }}</el-button>
      <el-button type="primary" @click="save">{{ t('button.save') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.plugin-binding-detail__summary {
  margin: 12px 0;
}

.plugin-binding-detail__raw {
  margin-top: 12px;
}

pre {
  max-height: 280px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.5;
}
</style>
