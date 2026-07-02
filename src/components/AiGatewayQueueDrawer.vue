<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Api, Model } from 'spacegate-admin-client'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  getAiGatewayPluginReadme,
  getAiGatewayPluginSchema,
  type JsonSchema,
} from '../api/aiGateway'
import PluginMarkdown from './PluginMarkdown.vue'
import SchemaForm from './SchemaForm.vue'
import TenantRateLimitTable from './TenantRateLimitTable.vue'

const { locale } = useI18n()

const props = defineProps<{
  instance?: Model.PluginConfig
}>()

const emit = defineEmits<{
  saved: []
}>()

const visible = defineModel<boolean>({
  required: true,
})

const loading = ref(false)
const saving = ref(false)
const schema = ref<JsonSchema>({})
const readme = ref('')
const schemaError = ref('')
const readmeError = ref('')
const pluginConfig = ref<Record<string, any>>({})
const texts = computed(() => locale.value.startsWith('zh') ? {
  saved: 'AI 网关排队限流配置已保存',
  title: 'AI 网关排队限流',
  deployed: '已部署',
  intro: '入口处对超额 AI 请求做准入判断，命中后按租户配额把请求分流到 Redis 多优先级队列；支持 queue（异步处理 + 回调）与 wait（入队同步等待）两种交付模式，配合回调重试与对象存储 offload 实现无损交付。',
  backendDown: 'AI Gateway 后端不可用',
  backendDownDesc: (error: string) => `请检查 ai-gateway-service :18080 是否已启动，并确认 /ai-gateway/v1/admin 代理可访问。错误：${error}`,
  tabBasic: '基础配置',
  tabQuota: '队列配额',
  tabDocs: '文档',
  tabObserve: '队列观测',
  basicTitle: '基础接入',
  basicDesc: 'SpaceGate WasmPlugin 宿主层参数，决定插件如何被加载以及如何连到队列后端。',
  wasmUrl: 'Wasm URL',
  wasmUrlHint: '插件 wasm 制品的访问地址，支持 file://、http(s)://、oci:// 等 SpaceGate WasmPlugin 支持的协议。',
  pluginName: '插件名称',
  pluginNameHint: '写入 WasmPlugin 配置的 plugin_name 字段，建议保持为 ai-gateway-queue。',
  failStrategy: '失败策略',
  failStrategyHint: '插件运行异常时的处理方式：fail_close 拒绝请求（更安全），fail_open 放行（可用性优先）。',
  serviceUrl: '队列后端地址',
  serviceUrlHint: 'SpaceGate cluster ai-gateway-service 实际指向的队列后端地址，准入判定、入队、入队等待都会发送到此处。',
  vmPool: '普通 VM 池大小',
  vmPoolHint: '处理 abandon / queue 等短请求的 Wasm VM 实例数，决定并发上限，建议 ≥ 4。',
  waitVmPool: 'Wait VM 池大小',
  waitVmPoolHint: '独立服务 wait 长等待请求的 VM 池，避免拖慢普通请求；不使用 wait 模式时可设为 0。',
  schemaUnavailable: '高级插件参数暂不可用',
  schemaUnavailableDesc: '未能加载 ai-gateway-queue 的 JSON Schema。你仍可保存基础宿主配置；插件内部参数需要等 ai-gateway-service 恢复后再编辑。',
  docsFailed: '文档加载失败',
  docsFailedDesc: (error: string) => `请检查 ai-gateway-service :18080。错误：${error}`,
  observeEmpty: 'V1 先预留观测页，后续接入队列长度、消费速率、回调失败等指标。',
  cancel: '取消',
  save: '保存',
} : {
  saved: 'AI Gateway queue configuration saved.',
  title: 'AI Gateway Queue',
  deployed: 'Deployed',
  intro: 'Performs admission control for excess AI requests and routes them into Redis priority queues by tenant quota. It supports queue (async + callback) and wait (synchronous waiting) delivery modes, with callback retry and object-store offload for reliable delivery.',
  backendDown: 'AI Gateway backend unavailable',
  backendDownDesc: (error: string) => `Check that ai-gateway-service :18080 is running and /ai-gateway/v1/admin is proxied correctly. Error: ${error}`,
  tabBasic: 'Basic',
  tabQuota: 'Queue Quotas',
  tabDocs: 'Docs',
  tabObserve: 'Queue Observability',
  basicTitle: 'Basic Access',
  basicDesc: 'SpaceGate WasmPlugin host parameters that decide how the plugin loads and connects to the queue backend.',
  wasmUrl: 'Wasm URL',
  wasmUrlHint: 'The plugin wasm artifact URL. Supports file://, http(s)://, oci://, and other protocols supported by SpaceGate WasmPlugin.',
  pluginName: 'Plugin Name',
  pluginNameHint: 'The plugin_name field written to WasmPlugin config. Keep ai-gateway-queue unless you know the runtime name changed.',
  failStrategy: 'Failure Strategy',
  failStrategyHint: 'How to handle plugin runtime errors: fail_close rejects requests, fail_open lets them pass through.',
  serviceUrl: 'Queue Backend URL',
  serviceUrlHint: 'The SpaceGate cluster ai-gateway-service target. Admission checks, enqueue, and wait requests are sent here.',
  vmPool: 'VM Pool Size',
  vmPoolHint: 'Wasm VM instances for short abandon / queue requests. This controls concurrency; 4 or more is recommended.',
  waitVmPool: 'Wait VM Pool Size',
  waitVmPoolHint: 'Dedicated VM pool for long wait requests so normal traffic is not slowed down. Set to 0 if wait mode is unused.',
  schemaUnavailable: 'Advanced plugin parameters unavailable',
  schemaUnavailableDesc: 'Failed to load the ai-gateway-queue JSON Schema. You can still save host-level settings; plugin internals can be edited after ai-gateway-service recovers.',
  docsFailed: 'Docs failed to load',
  docsFailedDesc: (error: string) => `Check ai-gateway-service :18080. Error: ${error}`,
  observeEmpty: 'Reserved for queue length, consume rate, callback failures, and related metrics in a later version.',
  cancel: 'Cancel',
  save: 'Save',
})

const host = reactive({
  url: '',
  plugin_name: 'ai-gateway-queue',
  fail_strategy: 'fail_close',
  service_url: 'http://127.0.0.1:18080',
  vm_pool_size: 4,
  wait_vm_pool_size: 4,
})

const existingInstance = computed(() => props.instance)

watch(visible, async (next) => {
  if (!next) return
  await load()
})

watch(() => props.instance, () => {
  if (visible.value) {
    load()
  }
})

async function load() {
  loading.value = true
  schemaError.value = ''
  readmeError.value = ''
  try {
    const [schemaResult, readmeResult] = await Promise.allSettled([
      getAiGatewayPluginSchema(),
      getAiGatewayPluginReadme(),
    ])
    if (schemaResult.status === 'fulfilled') {
      schema.value = schemaResult.value
    } else {
      schema.value = {}
      schemaError.value = errorMessage(schemaResult.reason)
    }
    if (readmeResult.status === 'fulfilled') {
      readme.value = readmeResult.value
    } else {
      readme.value = ''
      readmeError.value = errorMessage(readmeResult.reason)
    }
    loadInstance(existingInstance.value, schema.value)
  } finally {
    loading.value = false
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return String(error || 'unknown error')
}

function loadInstance(instance: Model.PluginConfig | undefined, schemaValue: JsonSchema) {
  const spec = (instance?.spec ?? {}) as Record<string, any>
  host.url = String(spec.url ?? '')
  host.plugin_name = String(spec.plugin_name ?? 'ai-gateway-queue')
  host.fail_strategy = String(spec.fail_strategy ?? 'fail_close')
  host.service_url = String((spec.clusters as Record<string, string> | undefined)?.['ai-gateway-service'] ?? 'http://127.0.0.1:18080')
  host.vm_pool_size = Number(spec.vm_pool_size ?? 4)
  host.wait_vm_pool_size = Number(spec.wait_vm_pool_size ?? 4)
  pluginConfig.value = cloneObject(spec.plugin_config ?? defaultPluginConfig(schemaValue))
}

function defaultPluginConfig(schemaValue: JsonSchema) {
  const raw = schemaValue?.['x-example-raw']
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
  return {}
}

function cloneObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? {}))
}

function buildPluginConfig(): Model.PluginConfig {
  const instance = existingInstance.value
  const spec = {
    ...((instance?.spec ?? {}) as Record<string, any>),
    url: host.url,
    plugin_name: host.plugin_name,
    fail_strategy: host.fail_strategy,
    vm_pool_size: host.vm_pool_size,
    wait_vm_pool_size: host.wait_vm_pool_size,
    plugin_config: cloneObject(pluginConfig.value),
    clusters: {
      ...(((instance?.spec as Record<string, any> | undefined)?.clusters ?? {}) as Record<string, string>),
      'ai-gateway-service': host.service_url,
    },
  }
  if (instance) {
    return {
      ...instance,
      spec,
    }
  }
  return {
    code: 'wasm',
    kind: 'named',
    name: 'ai-gateway-queue',
    spec,
  } as Model.PluginConfig
}

async function save() {
  saving.value = true
  try {
    const config = buildPluginConfig()
    if (existingInstance.value) {
      await Api.putConfigPlugin(config)
    } else {
      await Api.postConfigPlugin(config)
    }
    ElMessage.success(texts.value.saved)
    emit('saved')
    visible.value = false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-drawer v-model="visible" size="72%" destroy-on-close>
    <template #header>
      <div class="ai-gateway-drawer__header">
        <span>{{ texts.title }}</span>
        <el-tag v-if="existingInstance" type="success">{{ texts.deployed }}</el-tag>
      </div>
    </template>

    <div v-loading="loading" class="ai-gateway-drawer">
      <el-alert
        type="info"
        :closable="false"
        :title="texts.title"
        :description="texts.intro"
        class="ai-gateway-drawer__intro"
      />

      <el-alert
        v-if="schemaError"
        type="error"
        :closable="false"
        class="ai-gateway-drawer__intro"
        :title="texts.backendDown"
        :description="texts.backendDownDesc(schemaError)"
      />

      <el-tabs>
        <el-tab-pane :label="texts.tabBasic">
          <el-form label-position="top" class="ai-gateway-drawer__form">
            <el-card shadow="never">
              <template #header>
                <div class="ai-gateway-drawer__card-title">
                  <span>{{ texts.basicTitle }}</span>
                  <small>{{ texts.basicDesc }}</small>
                </div>
              </template>
              <el-form-item :label="texts.wasmUrl">
                <el-input v-model="host.url" placeholder="plugins/wasm/target/wasm32-wasip1/release/spacegate_plugin_ai_gateway_queue.wasm" />
                <div class="ai-gateway-drawer__hint">
                  {{ texts.wasmUrlHint }}
                </div>
              </el-form-item>
              <el-form-item :label="texts.pluginName">
                <el-input v-model="host.plugin_name" />
                <div class="ai-gateway-drawer__hint">
                  {{ texts.pluginNameHint }}
                </div>
              </el-form-item>
              <el-form-item :label="texts.failStrategy">
                <el-select v-model="host.fail_strategy">
                  <el-option label="fail_close" value="fail_close" />
                  <el-option label="fail_open" value="fail_open" />
                </el-select>
                <div class="ai-gateway-drawer__hint">
                  {{ texts.failStrategyHint }}
                </div>
              </el-form-item>
              <el-form-item :label="texts.serviceUrl">
                <el-input v-model="host.service_url" placeholder="http://127.0.0.1:18080" />
                <div class="ai-gateway-drawer__hint">
                  {{ texts.serviceUrlHint }}
                </div>
              </el-form-item>
              <el-form-item :label="texts.vmPool">
                <el-input-number v-model="host.vm_pool_size" :min="1" />
                <div class="ai-gateway-drawer__hint">
                  {{ texts.vmPoolHint }}
                </div>
              </el-form-item>
              <el-form-item :label="texts.waitVmPool">
                <el-input-number v-model="host.wait_vm_pool_size" :min="0" />
                <div class="ai-gateway-drawer__hint">
                  {{ texts.waitVmPoolHint }}
                </div>
              </el-form-item>
            </el-card>

            <SchemaForm v-if="Object.keys(schema).length" :schema="schema" v-model="pluginConfig" />
            <el-alert
              v-else
              type="warning"
              :closable="false"
              :title="texts.schemaUnavailable"
              :description="texts.schemaUnavailableDesc"
            />
          </el-form>
        </el-tab-pane>
        <el-tab-pane :label="texts.tabQuota">
          <TenantRateLimitTable />
        </el-tab-pane>
        <el-tab-pane :label="texts.tabDocs">
          <el-alert
            v-if="readmeError"
            type="warning"
            :closable="false"
            :title="texts.docsFailed"
            :description="texts.docsFailedDesc(readmeError)"
            class="ai-gateway-drawer__intro"
          />
          <PluginMarkdown v-else :content="readme" />
        </el-tab-pane>
        <el-tab-pane :label="texts.tabObserve">
          <el-empty :description="texts.observeEmpty" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="visible = false">{{ texts.cancel }}</el-button>
      <el-button type="primary" :loading="saving" @click="save">{{ texts.save }}</el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.ai-gateway-drawer {
  min-height: 420px;
}

.ai-gateway-drawer__header {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;
}

.ai-gateway-drawer__intro {
  margin-bottom: 12px;
}

.ai-gateway-drawer__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-gateway-drawer__card-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ai-gateway-drawer__card-title small,
.ai-gateway-drawer__hint {
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}
</style>
