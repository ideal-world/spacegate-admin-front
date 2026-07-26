<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Model } from 'spacegate-admin-client'
import { useI18n } from 'vue-i18n'

import {
  pluginBindingDetailState,
  pluginConfigOptionName,
  type ManagedPluginConfig,
} from '../utils/pluginInstance'
import { pluginBindingPluginName, type PluginConfigLike } from '../utils/wasmPlugin'
import PluginRuntimeConfigEditor from './PluginRuntimeConfigEditor.vue'

const props = defineProps<{
  binding: Model.PluginBinding
  config?: Model.PluginConfig | null
  allConfigs: Model.PluginConfig[]
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  save: [value: { priority: number; config?: ManagedPluginConfig }]
}>()

const visible = defineModel<boolean>({ required: true })
const { locale, t } = useI18n()
const priority = ref(props.binding.priority ?? 0)
const displayName = ref('')
const initialDisplayName = ref('')
const runtimeEditorRef = ref<InstanceType<typeof PluginRuntimeConfigEditor> | null>(null)

const state = computed(() => pluginBindingDetailState(props.config ?? undefined, props.error))
const pluginType = computed(() => state.value.kind === 'resolved'
  ? state.value.pluginType
  : (props.binding.code.toLowerCase().startsWith('wasm') ? 'wasm' : 'native'))
const spec = computed(() => (props.config?.spec ?? {}) as Record<string, unknown>)
const pluginName = computed(() => pluginBindingPluginName(props.binding, props.allConfigs as PluginConfigLike[]))
const instanceName = computed(() => props.config ? pluginConfigOptionName(props.config) : '-')
const priorityHint = computed(() => locale.value.startsWith('zh')
  ? '整数范围 -2,147,483,648 至 2,147,483,647；数值越大越先执行，默认 0。'
  : 'Integer range -2,147,483,648 to 2,147,483,647. Higher values run first; default is 0.')

watch(
  () => [props.binding, props.config] as const,
  () => {
    priority.value = props.binding.priority ?? 0
    displayName.value = props.config ? pluginConfigOptionName(props.config) : ''
    initialDisplayName.value = displayName.value
  },
  { immediate: true },
)

/** 提交挂载优先级，并在实例存在时携带更新后的管理展示名称。 */
function save() {
  const displayNameChanged = displayName.value.trim() !== initialDisplayName.value.trim()
  let config: ManagedPluginConfig | undefined
  if (props.config && state.value.kind === 'resolved') {
    config = runtimeEditorRef.value?.buildUpdatedConfig() as ManagedPluginConfig | undefined
    if (config && displayNameChanged) {
      config = { ...config, display_name: displayName.value.trim() || null }
    }
  } else if (props.config && displayNameChanged) {
    config = { ...props.config, display_name: displayName.value.trim() || null } as ManagedPluginConfig
  }
  emit('save', { priority: priority.value, config })
}
</script>

<template>
  <el-drawer v-model="visible" :title="t('title.pluginBindingDetail')" direction="ltr" size="720px">
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
      <el-descriptions-item :label="t('label.pluginName')">
        {{ pluginName }}
      </el-descriptions-item>
      <el-descriptions-item v-if="config" :label="t('label.pluginInstanceName')">
        <el-input v-model="displayName" />
        <div class="plugin-binding-detail__field-hint">当前实例：{{ instanceName }}</div>
      </el-descriptions-item>
      <el-descriptions-item :label="t('label.priority')">
        <div class="plugin-binding-detail__priority">
          <el-input-number
            v-model="priority"
            :min="-2147483648"
            :max="2147483647"
            :step="1"
            :precision="0"
            controls-position="right"
          />
          <span>{{ priorityHint }}</span>
        </div>
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
      </el-descriptions>
      <PluginRuntimeConfigEditor
        ref="runtimeEditorRef"
        :config="config"
        :all-configs="allConfigs"
      />
    </template>

    <template #footer>
      <el-button @click="visible = false">{{ t('button.cancel') }}</el-button>
      <el-button type="primary" @click="save">{{ t('button.save') }}</el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.plugin-binding-detail__summary {
  margin: 12px 0;
}

.plugin-binding-detail__priority {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plugin-binding-detail__priority :deep(.el-input-number) {
  width: 100%;
}

.plugin-binding-detail__priority span {
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
}

.plugin-binding-detail__field-hint {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
}
</style>
