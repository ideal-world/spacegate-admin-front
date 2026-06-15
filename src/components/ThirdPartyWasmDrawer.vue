<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Api, Model } from 'spacegate-admin-client'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  instance?: Model.PluginConfig
}>()

const emit = defineEmits<{
  saved: []
}>()

const visible = defineModel<boolean>({
  required: true,
})

const saving = ref(false)

const PHASE_OPTIONS = [
  { label: 'UNSPECIFIED_PHASE', value: 'UNSPECIFIED_PHASE' },
  { label: 'AUTHN', value: 'AUTHN' },
  { label: 'AUTHZ', value: 'AUTHZ' },
  { label: 'STATS', value: 'STATS' },
]

const IMAGE_PULL_POLICY_OPTIONS = [
  { label: 'UNSPECIFIED_POLICY', value: 'UNSPECIFIED_POLICY' },
  { label: 'IfNotPresent', value: 'IfNotPresent' },
  { label: 'Always', value: 'Always' },
]

const form = reactive({
  instance_name: 'custom-wasm-plugin',
  display_name: '',
  description: '',
  image_url: '',
  phase: 'UNSPECIFIED_PHASE',
  priority: 0,
  image_pull_policy: 'IfNotPresent',
  image_pull_secret: '',
  plugin_name: '',
  fail_strategy: 'fail_open',
  sha256: '',
  default_config_disable: false,
  default_config_text: '{}',
  match_rules_text: '[]',
  plugin_root_id: '',
  plugin_vm_id: '',
  module_cache_key: '',
  use_cache: true,
  vm_pool_size: 1,
  wait_vm_pool_size: 0,
  oci_registry: '',
  oci_username: '',
  oci_password: '',
  oci_bearer_token: '',
  oci_identity_token: '',
  clusters_text: '{}',
  limits_text: '{}',
})

const existingInstance = computed(() => props.instance)
const isEdit = computed(() => !!existingInstance.value)

const imageHelpText = computed(() => {
  const parsed = parseImageReference(form.image_url)
  if (!parsed.image_repository) return '支持 oci://registry/repo:tag、registry/repo:tag、http(s)://、file:// 或本地路径。'
  if (!parsed.image_version) return `Repository: ${parsed.image_repository}`
  return `Repository: ${parsed.image_repository}，Version: ${parsed.image_version}`
})

watch(visible, (next) => {
  if (!next) return
  loadInstance(existingInstance.value)
})

watch(() => props.instance, () => {
  if (visible.value) {
    loadInstance(existingInstance.value)
  }
})

watch(() => form.instance_name, (next) => {
  if (isEdit.value) return
  const id = normalizeId(next)
  if (!form.display_name) {
    form.display_name = id
  }
  if (!form.plugin_name || form.plugin_name === form.display_name) {
    form.plugin_name = id
  }
  if (!form.plugin_root_id || form.plugin_root_id.endsWith('-root')) {
    form.plugin_root_id = `${id}-root`
  }
  if (!form.plugin_vm_id || form.plugin_vm_id.endsWith('-vm')) {
    form.plugin_vm_id = `${id}-vm`
  }
})

watch(() => form.image_pull_policy, (next) => {
  form.use_cache = next !== 'Always'
})

function loadInstance(instance: Model.PluginConfig | undefined) {
  const spec = (instance?.spec ?? {}) as Record<string, any>
  const instanceName = instance?.kind === 'named' ? instance.name : 'custom-wasm-plugin'
  const pluginName = String(spec.plugin_name ?? instanceName)
  form.instance_name = instanceName
  form.display_name = String(spec.display_name ?? spec.title ?? pluginName)
  form.description = String(spec.description ?? '')
  form.image_url = String(spec.image_url ?? buildImageUrlFromSpec(spec) ?? spec.url ?? '')
  form.phase = String(spec.phase ?? 'UNSPECIFIED_PHASE')
  form.priority = Number(spec.priority ?? 0)
  form.image_pull_policy = String(spec.image_pull_policy ?? 'IfNotPresent')
  form.image_pull_secret = String(spec.image_pull_secret ?? '')
  form.plugin_name = pluginName
  form.fail_strategy = String(spec.fail_strategy ?? 'fail_open')
  form.sha256 = String(spec.sha256 ?? '')
  form.default_config_disable = Boolean(spec.default_config_disable ?? false)
  form.default_config_text = stringifyJson(spec.default_config ?? spec.plugin_config ?? {})
  form.match_rules_text = stringifyJson(spec.match_rules ?? [])
  form.plugin_root_id = String(spec.plugin_root_id ?? `${instanceName}-root`)
  form.plugin_vm_id = String(spec.plugin_vm_id ?? `${instanceName}-vm`)
  form.module_cache_key = String(spec.module_cache_key ?? '')
  form.use_cache = spec.use_cache !== false
  form.vm_pool_size = Number(spec.vm_pool_size ?? 1)
  form.wait_vm_pool_size = Number(spec.wait_vm_pool_size ?? 0)

  const ociAuth = (spec.oci_auth ?? {}) as Record<string, any>
  form.oci_registry = String(ociAuth.registry ?? '')
  form.oci_username = String(ociAuth.username ?? '')
  form.oci_password = String(ociAuth.password ?? '')
  form.oci_bearer_token = String(ociAuth.bearer_token ?? '')
  form.oci_identity_token = String(ociAuth.identity_token ?? '')

  form.clusters_text = stringifyJson(spec.clusters ?? {})
  form.limits_text = stringifyJson(spec.limits ?? {})
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2)
}

function normalizeId(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || 'custom-wasm-plugin'
}

function parseJson(text: string, field: string, options: { objectOnly?: boolean; arrayOnly?: boolean } = {}) {
  const raw = text.trim()
  if (!raw) return options.arrayOnly ? [] : {}
  try {
    const value = JSON.parse(raw)
    if (options.objectOnly && (value === null || Array.isArray(value) || typeof value !== 'object')) {
      throw new Error(`${field} 必须是 JSON object`)
    }
    if (options.arrayOnly && !Array.isArray(value)) {
      throw new Error(`${field} 必须是 JSON array`)
    }
    return value
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e)
    throw new Error(`${field} JSON 格式错误：${reason}`)
  }
}

function optionalString(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function buildImageUrlFromSpec(spec: Record<string, any>) {
  const repository = optionalString(String(spec.image_repository ?? ''))
  if (!repository) return ''
  const version = optionalString(String(spec.image_version ?? ''))
  return version ? `${repository}:${version}` : repository
}

function parseImageReference(imageUrl: string) {
  const value = imageUrl.trim()
  if (!value) {
    return { image_repository: '', image_version: '' }
  }

  const schemeIndex = value.indexOf('://')
  const lastColon = value.lastIndexOf(':')
  const versionCandidate = value.slice(lastColon + 1)
  const hasTagLikeSuffix = Boolean(versionCandidate) && !versionCandidate.includes('/')
  if (hasTagLikeSuffix && lastColon > schemeIndex + 2 && (schemeIndex < 0 || value.startsWith('oci://'))) {
    return {
      image_repository: value.slice(0, lastColon),
      image_version: value.slice(lastColon + 1),
    }
  }
  return {
    image_repository: value,
    image_version: '',
  }
}

function valueToObject(value: any) {
  if (value && !Array.isArray(value) && typeof value === 'object') return { ...value }
  if (value == null) return {}
  return { _config_: value }
}

function buildRuntimePluginConfig(defaultConfig: any, matchRules: any[]) {
  const config = form.default_config_disable ? {} : valueToObject(defaultConfig)
  if (matchRules.length > 0) {
    config._rules_ = matchRules
  }
  return config
}

function buildOciAuth() {
  const auth = {
    registry: optionalString(form.oci_registry),
    username: optionalString(form.oci_username),
    password: optionalString(form.oci_password),
    bearer_token: optionalString(form.oci_bearer_token),
    identity_token: optionalString(form.oci_identity_token),
  }
  return Object.fromEntries(Object.entries(auth).filter(([, value]) => value !== undefined))
}

function setOptional(target: Record<string, any>, key: string, value: string) {
  const next = optionalString(value)
  if (next) {
    target[key] = next
  } else {
    delete target[key]
  }
}

function validateForm(instanceName: string, imageUrl: string) {
  if (!instanceName) {
    throw new Error('插件名称不能为空')
  }
  if (!imageUrl) {
    throw new Error('Image URL 不能为空')
  }
}

function buildPluginConfig(): Model.PluginConfig {
  const instance = existingInstance.value
  const instanceName = isEdit.value && instance?.kind === 'named'
    ? instance.name
    : normalizeId(form.instance_name)
  const imageUrl = form.image_url.trim()
  validateForm(instanceName, imageUrl)

  const defaultConfig = parseJson(form.default_config_text, 'Default Config')
  const matchRules = parseJson(form.match_rules_text, 'Match Rules', { arrayOnly: true })
  const imageRef = parseImageReference(imageUrl)

  const spec: Record<string, any> = {
    ...((instance?.spec ?? {}) as Record<string, any>),
    version: 0,
    category: 'custom',
    built_in: false,
    title: form.display_name.trim() || instanceName,
    url: imageUrl,
    image_url: imageUrl,
    image_repository: imageRef.image_repository,
    image_version: imageRef.image_version,
    phase: form.phase,
    priority: Number(form.priority ?? 0),
    image_pull_policy: form.image_pull_policy,
    default_config_disable: form.default_config_disable,
    default_config: defaultConfig,
    match_rules: matchRules,
    plugin_config: buildRuntimePluginConfig(defaultConfig, matchRules),
    plugin_name: form.plugin_name.trim() || instanceName,
    plugin_root_id: form.plugin_root_id.trim() || `${instanceName}-root`,
    plugin_vm_id: form.plugin_vm_id.trim() || `${instanceName}-vm`,
    fail_strategy: form.fail_strategy,
    use_cache: form.use_cache,
    vm_pool_size: form.vm_pool_size,
    wait_vm_pool_size: form.wait_vm_pool_size,
    clusters: parseJson(form.clusters_text, 'Cluster 映射', { objectOnly: true }),
    limits: parseJson(form.limits_text, '资源限制', { objectOnly: true }),
  }

  setOptional(spec, 'display_name', form.display_name)
  setOptional(spec, 'description', form.description)
  setOptional(spec, 'sha256', form.sha256)
  setOptional(spec, 'image_pull_secret', form.image_pull_secret)
  setOptional(spec, 'module_cache_key', form.module_cache_key)

  const ociAuth = buildOciAuth()
  if (Object.keys(ociAuth).length > 0) {
    spec.oci_auth = ociAuth
  } else {
    delete spec.oci_auth
  }

  return {
    code: 'wasm',
    kind: 'named',
    name: instanceName,
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
    ElMessage.success('Wasm 插件已保存')
    emit('saved')
    visible.value = false
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    ElMessage.error(message)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-drawer v-model="visible" size="76%" destroy-on-close>
    <template #header>
      <div class="third-party-wasm__header">
        <span>{{ isEdit ? '编辑自定义 Wasm 插件' : '添加自定义 Wasm 插件' }}</span>
        <el-tag v-if="existingInstance" type="success">已部署</el-tag>
        <el-tag v-else>Higress WasmPlugin</el-tag>
      </div>
    </template>

    <div class="third-party-wasm">
      <el-alert
        type="info"
        :closable="false"
        title="按 Higress 自定义 Wasm 插件模型保存"
        description="主字段与 Higress WasmPlugin 对齐；保存后会生成 SpaceGate 可挂载的 wasm 插件实例，后续可在 Gateway、Route 或 Backend 上启用。"
        class="third-party-wasm__intro"
      />

      <el-tabs>
        <el-tab-pane label="插件定义">
          <el-form label-position="top" class="third-party-wasm__form">
            <el-card shadow="never">
              <template #header>
                <div class="third-party-wasm__card-title">
                  <span>基础信息</span>
                  <small>对应 Higress 自定义插件的 name、description、imageUrl。</small>
                </div>
              </template>
              <div class="third-party-wasm__grid">
                <el-form-item label="插件名称 name">
                  <el-input v-model="form.instance_name" :disabled="isEdit" placeholder="custom-authz" />
                  <div class="third-party-wasm__hint">保存为 wasm.{name}.json，创建后不可修改。</div>
                </el-form-item>
                <el-form-item label="显示名称">
                  <el-input v-model="form.display_name" placeholder="自定义鉴权插件" />
                </el-form-item>
              </div>
              <el-form-item label="描述 description">
                <el-input v-model="form.description" type="textarea" :rows="2" />
              </el-form-item>
              <el-form-item label="Image URL">
                <el-input v-model="form.image_url" placeholder="oci://registry.example.com/plugins/authz:v1" />
                <div class="third-party-wasm__hint">{{ imageHelpText }}</div>
              </el-form-item>
            </el-card>

            <el-card shadow="never">
              <template #header>
                <div class="third-party-wasm__card-title">
                  <span>调度与拉取</span>
                  <small>对应 Higress WasmPlugin 的 phase、priority、imagePullPolicy、imagePullSecret。</small>
                </div>
              </template>
              <div class="third-party-wasm__grid third-party-wasm__grid--three">
                <el-form-item label="Phase">
                  <el-select v-model="form.phase">
                    <el-option
                      v-for="item in PHASE_OPTIONS"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="Priority">
                  <el-input-number v-model="form.priority" :min="-100000" :max="100000" />
                </el-form-item>
                <el-form-item label="Image Pull Policy">
                  <el-select v-model="form.image_pull_policy">
                    <el-option
                      v-for="item in IMAGE_PULL_POLICY_OPTIONS"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </div>
              <div class="third-party-wasm__grid">
                <el-form-item label="Image Pull Secret">
                  <el-input v-model="form.image_pull_secret" placeholder="private-registry-secret" />
                </el-form-item>
                <el-form-item label="SHA-256">
                  <el-input v-model="form.sha256" placeholder="sha256:<hex>" />
                </el-form-item>
              </div>
              <div class="third-party-wasm__grid">
                <el-form-item label="插件名称 pluginName">
                  <el-input v-model="form.plugin_name" placeholder="authz" />
                </el-form-item>
                <el-form-item label="失败策略">
                  <el-select v-model="form.fail_strategy">
                    <el-option label="fail_open" value="fail_open" />
                    <el-option label="fail_close" value="fail_close" />
                  </el-select>
                </el-form-item>
              </div>
            </el-card>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="默认配置">
          <el-form label-position="top" class="third-party-wasm__form">
            <el-card shadow="never">
              <template #header>
                <div class="third-party-wasm__card-title">
                  <span>Default Config</span>
                  <small>默认传给 proxy_on_configure；禁用后仅保留 matchRules 和插件定义。</small>
                </div>
              </template>
              <el-form-item label="禁用默认配置">
                <el-switch v-model="form.default_config_disable" />
              </el-form-item>
              <el-form-item label="Default Config JSON">
                <el-input
                  v-model="form.default_config_text"
                  type="textarea"
                  :rows="16"
                  :disabled="form.default_config_disable"
                  placeholder="{ &quot;key&quot;: &quot;value&quot; }"
                />
              </el-form-item>
            </el-card>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="匹配规则">
          <el-form label-position="top" class="third-party-wasm__form">
            <el-card shadow="never">
              <template #header>
                <div class="third-party-wasm__card-title">
                  <span>Match Rules</span>
                  <small>保持 Higress matchRules 结构：ingress、domain、service、configDisable、config。</small>
                </div>
              </template>
              <el-form-item label="Match Rules JSON">
                <el-input
                  v-model="form.match_rules_text"
                  type="textarea"
                  :rows="18"
                  placeholder="[{ &quot;domain&quot;: [&quot;*.example.com&quot;], &quot;config&quot;: {} }]"
                />
              </el-form-item>
            </el-card>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="高级参数">
          <el-form label-position="top" class="third-party-wasm__form">
            <el-card shadow="never">
              <template #header>
                <div class="third-party-wasm__card-title">
                  <span>SpaceGate Runtime</span>
                  <small>保留运行时 VM、缓存、Cluster 和资源限制参数。</small>
                </div>
              </template>
              <div class="third-party-wasm__grid">
                <el-form-item label="Plugin Root ID">
                  <el-input v-model="form.plugin_root_id" />
                </el-form-item>
                <el-form-item label="Plugin VM ID">
                  <el-input v-model="form.plugin_vm_id" />
                </el-form-item>
              </div>
              <div class="third-party-wasm__grid third-party-wasm__grid--three">
                <el-form-item label="模块缓存键">
                  <el-input v-model="form.module_cache_key" placeholder="authz:v1 或资源版本号" />
                </el-form-item>
                <el-form-item label="复用模块缓存">
                  <el-switch v-model="form.use_cache" />
                </el-form-item>
                <el-form-item label="普通 VM 池大小">
                  <el-input-number v-model="form.vm_pool_size" :min="1" :max="64" />
                </el-form-item>
              </div>
              <el-form-item label="Wait VM 池大小">
                <el-input-number v-model="form.wait_vm_pool_size" :min="0" :max="64" />
              </el-form-item>
              <el-form-item label="Clusters JSON">
                <el-input v-model="form.clusters_text" type="textarea" :rows="8" />
              </el-form-item>
              <el-form-item label="资源限制 JSON">
                <el-input v-model="form.limits_text" type="textarea" :rows="8" />
              </el-form-item>
            </el-card>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="OCI 认证">
          <el-form label-position="top" class="third-party-wasm__form">
            <el-card shadow="never">
              <template #header>
                <div class="third-party-wasm__card-title">
                  <span>私有仓库认证</span>
                  <small>用于 oci:// 插件制品；公开仓库可留空。</small>
                </div>
              </template>
              <div class="third-party-wasm__grid">
                <el-form-item label="Registry">
                  <el-input v-model="form.oci_registry" placeholder="registry.example.com" />
                </el-form-item>
                <el-form-item label="Username">
                  <el-input v-model="form.oci_username" />
                </el-form-item>
              </div>
              <el-form-item label="Password">
                <el-input v-model="form.oci_password" type="password" show-password />
              </el-form-item>
              <el-form-item label="Bearer Token">
                <el-input v-model="form.oci_bearer_token" type="password" show-password />
              </el-form-item>
              <el-form-item label="Identity Token">
                <el-input v-model="form.oci_identity_token" type="password" show-password />
              </el-form-item>
            </el-card>
          </el-form>
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
.third-party-wasm {
  min-height: 420px;
}

.third-party-wasm__header {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;
}

.third-party-wasm__intro {
  margin-bottom: 12px;
}

.third-party-wasm__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.third-party-wasm__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.third-party-wasm__grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.third-party-wasm__card-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.third-party-wasm__card-title small,
.third-party-wasm__hint {
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}

@media (max-width: 900px) {
  .third-party-wasm__grid,
  .third-party-wasm__grid--three {
    grid-template-columns: 1fr;
  }
}
</style>
