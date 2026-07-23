import type { Model } from 'spacegate-admin-client'
import { parse as parseYaml } from 'yaml'
import type { ManagedPluginConfig } from './pluginInstance'

export type OciAuthInput = {
  registry?: string
  username?: string
  password?: string
  bearer_token?: string
  identity_token?: string
}

export type BuildThirdPartyWasmPluginConfigInput = {
  instance?: Model.PluginConfig
  instanceName: string
  imageUrl: string
  displayName: string
  description: string
  phase: string
  priority: number
  imagePullPolicy: string
  imagePullSecret: string
  pluginName: string
  failStrategy: string
  sha256: string
  schemaPath: string
  defaultConfigDisable: boolean
  defaultConfig: unknown
  matchRules: unknown[]
  pluginRootId: string
  pluginVmId: string
  moduleCacheKey: string
  useCache: boolean
  vmPoolSize: number
  waitVmPoolSize: number
  ociAuth: OciAuthInput
  clusters: Record<string, unknown>
  limits: Record<string, unknown>
}

export type ThirdPartyWasmPluginConfigBuildResult = {
  config: Model.PluginConfig
  requiresGlobalReload: boolean
}

export type BoundWasmConfigMode = 'default' | 'schema' | 'yaml' | 'xml'

export type BuildBoundWasmPluginConfigInput = {
  baseConfig: Model.PluginConfig
  existingConfig?: Model.PluginConfig
  bindingName: string
  bindingOwner?: string
  bindingDisplayName?: string
  bindingScope: 'gateway' | 'route' | 'rule' | 'backend'
  configMode: BoundWasmConfigMode
  schemaConfig: unknown
  yamlConfig: string
}

export type PluginConfigLike = {
  code: string
  kind: 'anon' | 'named' | 'mono'
  uid?: string
  name?: string
  display_name?: string | null
  spec?: Record<string, unknown>
}

export type PluginInstanceRefLike = {
  code: string
  kind: 'anon' | 'named' | 'mono'
  uid?: string
  name?: string
}

export function isWasmPluginCode(pluginCode: string) {
  const c = pluginCode.toLowerCase()
  return c === 'wasm' || c.startsWith('wasm.') || c.startsWith('wasm-')
}

export function isWasmPluginBindingConfig(config: PluginConfigLike) {
  return isWasmPluginCode(config.code) && config.spec?.binding_scope !== undefined
}

export function isWasmPluginCenterConfig(config: PluginConfigLike) {
  if (!isWasmPluginCode(config.code)) return false
  if (config.kind !== 'named') return false
  if (isWasmPluginBindingConfig(config)) return false
  if (config.spec?.plugin_name === 'ai-gateway-queue') return false
  return true
}

function wasmPluginSortPriority(config: PluginConfigLike) {
  const priority = config.spec?.priority
  return typeof priority === 'number' && Number.isFinite(priority) ? priority : 0
}

function wasmPluginSortName(config: PluginConfigLike) {
  const spec = config.spec ?? {}
  if (typeof spec.display_name === 'string' && spec.display_name.trim()) return spec.display_name.trim()
  if (typeof spec.title === 'string' && spec.title.trim()) return spec.title.trim()
  if (typeof spec.plugin_name === 'string' && spec.plugin_name.trim()) return spec.plugin_name.trim()
  return config.name ?? config.code
}

export function sortWasmPluginCenterConfigs<T extends PluginConfigLike>(configs: readonly T[]): T[] {
  return [...configs].sort((left, right) => {
    const priorityDelta = wasmPluginSortPriority(right) - wasmPluginSortPriority(left)
    if (priorityDelta !== 0) return priorityDelta
    return wasmPluginSortName(left).localeCompare(wasmPluginSortName(right), undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  })
}

export function pluginConfigToInstanceRef(config: PluginConfigLike): Model.PluginInstanceId {
  if (config.kind === 'named') {
    return { code: config.code, kind: config.kind, name: config.name ?? '' }
  }
  if (config.kind === 'anon') {
    return { code: config.code, kind: config.kind, uid: config.uid ?? '' }
  }
  return { code: config.code, kind: config.kind }
}

function findPluginConfigByRef(configs: readonly PluginConfigLike[], ref: PluginInstanceRefLike) {
  return configs.find((config) => isSamePluginInstanceRef(config, ref))
}

function readablePluginConfigName(config: PluginConfigLike) {
  const managedDisplayName = config.display_name?.trim()
  if (managedDisplayName) return managedDisplayName
  return wasmPluginSortName(config)
}

export function pluginInstanceDisplayName(ref: PluginInstanceRefLike, configs: readonly PluginConfigLike[] = []) {
  const config = findPluginConfigByRef(configs, ref)
  if (config && isWasmPluginBindingConfig(config)) {
    const basePlugin = config.spec?.binding_base_plugin
    if (typeof basePlugin === 'string' && basePlugin.trim()) {
      const baseConfig = configs.find((item) => item.code === config.code && item.kind === 'named' && item.name === basePlugin)
      return baseConfig ? readablePluginConfigName(baseConfig) : basePlugin.trim()
    }
    const pluginName = config.spec?.plugin_name
    if (typeof pluginName === 'string' && pluginName.trim()) return pluginName.trim()
  }
  if (config) return readablePluginConfigName(config)
  if (ref.kind === 'named') return ref.name ?? ref.code
  if (ref.kind === 'anon') return ref.uid ? `${ref.code}.${ref.uid}` : ref.code
  return ref.code
}

export function isSamePluginInstanceRef(left: PluginInstanceRefLike, right: PluginInstanceRefLike) {
  if (left.code !== right.code || left.kind !== right.kind) return false
  if (left.kind === 'named') return left.name === right.name
  if (left.kind === 'anon') return left.uid === right.uid
  return true
}

export function hasPluginInstanceRef(list: readonly PluginInstanceRefLike[] | undefined, ref: PluginInstanceRefLike) {
  return Array.isArray(list) && list.some((item) => isSamePluginInstanceRef(item, ref))
}

export function setPluginInstanceRefEnabled(
  list: readonly PluginInstanceRefLike[] | undefined,
  ref: Model.PluginInstanceId,
  enabled: boolean,
): Model.PluginBinding[] {
  const current = (Array.isArray(list) ? list : []).map((item) => {
    const priority = (item as PluginInstanceRefLike & { priority?: unknown }).priority
    return {
      ...item,
      priority: typeof priority === 'number' && Number.isFinite(priority) ? priority : 0,
    } as Model.PluginBinding
  })
  const withoutRef = current.filter((item) => !isSamePluginInstanceRef(item, ref))
  if (!enabled) return withoutRef
  return [...withoutRef, { ...ref, priority: 0 } as Model.PluginBinding]
}

export function normalizeWasmPluginId(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || 'custom-wasm-plugin'
}

function fnv1a32Hex(value: string) {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function stableWasmBindingId(scope: string, owner: string, plugin: string) {
  const normalizedInput = [
    scope.trim().toLowerCase(),
    owner.trim().toLowerCase(),
    plugin.trim().toLowerCase(),
  ].join(':')
  return `bind-${fnv1a32Hex(normalizedInput)}`
}

export function validateWasmPluginId(value: string) {
  if (!value) {
    throw new Error('Plugin name is required')
  }
  if (!/^[a-z0-9-]+$/.test(value)) {
    throw new Error('Plugin name only supports lowercase letters, numbers, and hyphens')
  }
}

export function parseImageReference(imageUrl: string) {
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

function optionalString(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function setOptional(target: Record<string, unknown>, key: string, value: string) {
  const next = optionalString(value)
  if (next) {
    target[key] = next
  } else {
    delete target[key]
  }
}

function valueToObject(value: unknown) {
  if (value && !Array.isArray(value) && typeof value === 'object') return { ...(value as Record<string, unknown>) }
  if (value == null) return {}
  return { _config_: value }
}

function buildRuntimePluginConfig(defaultConfigDisable: boolean, defaultConfig: unknown, matchRules: unknown[]): Record<string, unknown> {
  const config: Record<string, unknown> = defaultConfigDisable ? {} : valueToObject(defaultConfig)
  if (matchRules.length > 0) {
    config._rules_ = matchRules
  }
  return config
}

function cloneSpec(value: unknown): Record<string, unknown> {
  if (value && !Array.isArray(value) && typeof value === 'object') {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
  }
  return {}
}

function defaultConfigFromSpec(spec: Record<string, unknown>) {
  if (spec.plugin_config !== undefined) return spec.plugin_config
  if (spec.default_config !== undefined) return spec.default_config
  return {}
}

export function parseYamlConfigText(text: string) {
  const raw = text.trim()
  if (!raw) return {}
  const parsed = parseYaml(raw)
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('YAML config must be an object')
  }
  return parsed as Record<string, unknown>
}

function runtimeConfigForMode(input: BuildBoundWasmPluginConfigInput, baseSpec: Record<string, unknown>) {
  if (input.configMode === 'yaml') {
    return parseYamlConfigText(input.yamlConfig)
  }
  if (input.configMode === 'xml') {
    return input.yamlConfig.trim()
  }
  if (input.configMode === 'schema') {
    return valueToObject(input.schemaConfig)
  }
  return defaultConfigFromSpec(baseSpec)
}

export function buildBoundWasmPluginConfig(input: BuildBoundWasmPluginConfigInput): ThirdPartyWasmPluginConfigBuildResult {
  const baseSpec = cloneSpec(input.baseConfig.spec)
  const existingSpec = cloneSpec(input.existingConfig?.spec)
  const baseName = input.baseConfig.kind === 'named' ? input.baseConfig.name : 'wasm'
  const instanceName = input.existingConfig?.kind === 'named'
    ? input.existingConfig.name
    : normalizeWasmPluginId(input.bindingName || `${input.bindingScope}-${baseName}-binding`)
  validateWasmPluginId(instanceName)
  const existingDisplayName = (input.existingConfig as ManagedPluginConfig | undefined)?.display_name?.trim()
  const baseDisplayName = (input.baseConfig as ManagedPluginConfig).display_name?.trim()
  const displayName = input.bindingDisplayName?.trim()
    || existingDisplayName
    || baseDisplayName
    || input.bindingOwner?.trim()
    || instanceName

  const runtimeConfig = runtimeConfigForMode(input, baseSpec)
  const spec: Record<string, unknown> = {
    ...baseSpec,
    ...existingSpec,
    default_config_disable: false,
    default_config: runtimeConfig,
    plugin_config: runtimeConfig,
    binding_config_mode: input.configMode,
    binding_scope: input.bindingScope,
    binding_base_plugin: input.baseConfig.kind === 'named'
      ? input.baseConfig.name
      : input.baseConfig.kind === 'anon'
        ? input.baseConfig.uid
        : input.baseConfig.code,
    binding_owner: input.bindingOwner?.trim() || undefined,
    binding_display_name: input.bindingDisplayName?.trim() || input.bindingOwner?.trim() || instanceName,
  }

  return {
    requiresGlobalReload: true,
    config: {
      code: input.baseConfig.code || 'wasm',
      kind: 'named',
      name: instanceName,
      display_name: displayName,
      spec,
    } as Model.PluginConfig,
  }
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, next]) => next !== undefined && next !== ''))
}

export function buildThirdPartyWasmPluginConfig(input: BuildThirdPartyWasmPluginConfigInput): ThirdPartyWasmPluginConfigBuildResult {
  const instanceName = normalizeWasmPluginId(input.instanceName)
  const imageUrl = input.imageUrl.trim()
  validateWasmPluginId(instanceName)
  if (!imageUrl) {
    throw new Error('Image URL is required')
  }

  const imageRef = parseImageReference(imageUrl)
  const spec: Record<string, unknown> = {
    ...((input.instance?.spec ?? {}) as Record<string, unknown>),
    version: 0,
    category: 'custom',
    built_in: false,
    title: input.displayName.trim() || instanceName,
    url: imageUrl,
    image_url: imageUrl,
    image_repository: imageRef.image_repository,
    image_version: imageRef.image_version,
    phase: input.phase,
    priority: Number(input.priority ?? 0),
    image_pull_policy: input.imagePullPolicy,
    default_config_disable: input.defaultConfigDisable,
    default_config: input.defaultConfig,
    match_rules: input.matchRules,
    plugin_config: buildRuntimePluginConfig(input.defaultConfigDisable, input.defaultConfig, input.matchRules),
    plugin_name: input.pluginName.trim() || instanceName,
    plugin_root_id: input.pluginRootId.trim() || `${instanceName}-root`,
    plugin_vm_id: input.pluginVmId.trim() || `${instanceName}-vm`,
    fail_strategy: input.failStrategy,
    use_cache: input.useCache,
    vm_pool_size: input.vmPoolSize,
    wait_vm_pool_size: input.waitVmPoolSize,
    clusters: input.clusters,
    limits: input.limits,
  }

  setOptional(spec, 'display_name', input.displayName)
  setOptional(spec, 'description', input.description)
  setOptional(spec, 'sha256', input.sha256)
  setOptional(spec, 'schema_path', input.schemaPath)
  setOptional(spec, 'image_pull_secret', input.imagePullSecret)
  setOptional(spec, 'module_cache_key', input.moduleCacheKey)

  const ociAuth = compactObject(input.ociAuth)
  if (Object.keys(ociAuth).length > 0) {
    spec.oci_auth = ociAuth
  } else {
    delete spec.oci_auth
  }

  return {
    requiresGlobalReload: true,
    config: {
      code: 'wasm',
      kind: 'named',
      name: instanceName,
      display_name: input.displayName.trim() || null,
      spec,
    } as Model.PluginConfig,
  }
}
