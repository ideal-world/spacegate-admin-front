import type { Model } from 'spacegate-admin-client'

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

export type BoundWasmConfigMode = 'default' | 'schema' | 'xml'

export type BuildBoundWasmPluginConfigInput = {
  baseConfig: Model.PluginConfig
  existingConfig?: Model.PluginConfig
  bindingName: string
  bindingScope: 'gateway' | 'route' | 'rule' | 'backend'
  configMode: BoundWasmConfigMode
  schemaConfig: unknown
  xmlConfig: string
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

function runtimeConfigForMode(input: BuildBoundWasmPluginConfigInput, baseSpec: Record<string, unknown>) {
  if (input.configMode === 'xml') {
    return input.xmlConfig.trim()
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
    binding_display_name: input.bindingName.trim() || instanceName,
  }

  return {
    requiresGlobalReload: true,
    config: {
      code: input.baseConfig.code || 'wasm',
      kind: 'named',
      name: instanceName,
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
      spec,
    } as Model.PluginConfig,
  }
}
