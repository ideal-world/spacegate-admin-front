<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Api, Model } from 'spacegate-admin-client'
import { ElMessage } from 'element-plus'
import {
  getAiGatewayPluginReadme,
  getAiGatewayPluginSchema,
  type JsonSchema,
} from '../api/aiGateway'
import PluginMarkdown from './PluginMarkdown.vue'
import SchemaForm from './SchemaForm.vue'
import TenantRateLimitTable from './TenantRateLimitTable.vue'

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
const pluginConfig = ref<Record<string, any>>({})

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
  try {
    const [schemaValue, readmeValue] = await Promise.all([
      getAiGatewayPluginSchema(),
      getAiGatewayPluginReadme(),
    ])
    schema.value = schemaValue
    readme.value = readmeValue
    loadInstance(existingInstance.value, schemaValue)
  } finally {
    loading.value = false
  }
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
    ElMessage.success('AI 网关排队限流配置已保存')
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
        <span>AI 网关排队限流</span>
        <el-tag v-if="existingInstance" type="success">已部署</el-tag>
      </div>
    </template>

    <div v-loading="loading" class="ai-gateway-drawer">
      <el-alert
        type="info"
        :closable="false"
        title="AI 网关排队限流"
        description="入口处对超额 AI 请求做准入判断，命中后按租户配额把请求分流到 Redis 多优先级队列；支持 queue（异步处理 + 回调）与 wait（入队同步等待）两种交付模式，配合回调重试与对象存储 offload 实现无损交付。"
        class="ai-gateway-drawer__intro"
      />

      <el-tabs>
        <el-tab-pane label="基础配置">
          <el-form label-position="top" class="ai-gateway-drawer__form">
            <el-card shadow="never">
              <template #header>
                <div class="ai-gateway-drawer__card-title">
                  <span>基础接入</span>
                  <small>SpaceGate WasmPlugin 宿主层参数，决定插件如何被加载以及如何连到队列后端。</small>
                </div>
              </template>
              <el-form-item label="Wasm URL">
                <el-input v-model="host.url" placeholder="plugins/wasm/target/wasm32-wasip1/release/spacegate_plugin_ai_gateway_queue.wasm" />
                <div class="ai-gateway-drawer__hint">
                  插件 wasm 制品的访问地址，支持 file://、http(s)://、oci:// 等 SpaceGate WasmPlugin 支持的协议。
                </div>
              </el-form-item>
              <el-form-item label="插件名称">
                <el-input v-model="host.plugin_name" />
                <div class="ai-gateway-drawer__hint">
                  写入 WasmPlugin 配置的 plugin_name 字段，建议保持为 ai-gateway-queue。
                </div>
              </el-form-item>
              <el-form-item label="失败策略">
                <el-select v-model="host.fail_strategy">
                  <el-option label="fail_close" value="fail_close" />
                  <el-option label="fail_open" value="fail_open" />
                </el-select>
                <div class="ai-gateway-drawer__hint">
                  插件运行异常时的处理方式：fail_close 拒绝请求（更安全），fail_open 放行（可用性优先）。
                </div>
              </el-form-item>
              <el-form-item label="队列后端地址">
                <el-input v-model="host.service_url" placeholder="http://127.0.0.1:18080" />
                <div class="ai-gateway-drawer__hint">
                  SpaceGate cluster ai-gateway-service 实际指向的队列后端地址，准入判定、入队、入队等待都会发送到此处。
                </div>
              </el-form-item>
              <el-form-item label="普通 VM 池大小">
                <el-input-number v-model="host.vm_pool_size" :min="1" />
                <div class="ai-gateway-drawer__hint">
                  处理 abandon / queue 等短请求的 Wasm VM 实例数，决定并发上限，建议 ≥ 4。
                </div>
              </el-form-item>
              <el-form-item label="Wait VM 池大小">
                <el-input-number v-model="host.wait_vm_pool_size" :min="0" />
                <div class="ai-gateway-drawer__hint">
                  独立服务 wait 长等待请求的 VM 池，避免拖慢普通请求；不使用 wait 模式时可设为 0。
                </div>
              </el-form-item>
            </el-card>

            <SchemaForm v-if="Object.keys(schema).length" :schema="schema" v-model="pluginConfig" />
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="队列配额">
          <TenantRateLimitTable />
        </el-tab-pane>
        <el-tab-pane label="文档">
          <PluginMarkdown :content="readme" />
        </el-tab-pane>
        <el-tab-pane label="队列观测">
          <el-empty description="V1 先预留观测页，后续接入队列长度、消费速率、回调失败等指标。" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
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
