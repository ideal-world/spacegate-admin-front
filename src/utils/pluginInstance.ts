import type { Model } from 'spacegate-admin-client'

/** 带可选管理展示名称的插件配置，兼容尚未包含该字段的旧版 Admin Client 类型。 */
export type ManagedPluginConfig = Model.PluginConfig & {
  display_name?: string | null
}

/** 挂载实例详情的解析状态。 */
export type PluginBindingDetailState =
  | { kind: 'resolved'; pluginType: 'native' | 'wasm' }
  | { kind: 'missing' }
  | { kind: 'error'; reason: string }

/** 判断插件 code 是否属于 Wasm 实例。 */
export function isWasmPluginCode(code: string): boolean {
  const normalized = code.toLowerCase()
  return normalized === 'wasm' || normalized.startsWith('wasm.') || normalized.startsWith('wasm-')
}

/** 将可能为空白的配置字段规范化为可展示文本。 */
function displayText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  return text || undefined
}

/** 按管理名称、旧 Wasm 字段、插件 code 的顺序解析实例展示名称。 */
export function pluginInstanceDisplayName(config: Model.PluginConfig): string {
  const managed = config as ManagedPluginConfig
  const topLevel = displayText(managed.display_name)
  if (topLevel) return topLevel

  if (isWasmPluginCode(config.code)) {
    const spec = config.spec as Record<string, unknown> | null
    for (const key of ['display_name', 'title', 'plugin_name']) {
      const legacy = displayText(spec?.[key])
      if (legacy) return legacy
    }
  }

  return config.code
}

/** 为配置下拉框生成用户可识别的实例名称，不暴露内部实例 ID。 */
export function pluginConfigOptionName(config: Model.PluginConfig): string {
  const managed = config as ManagedPluginConfig
  const displayName = displayText(managed.display_name)
  if (displayName) return displayName

  if (config.kind === 'named') {
    const name = displayText(config.name)
    if (name) return name
  }

  return pluginInstanceDisplayName(config)
}

/** 从完整配置中提取稳定实例 ID，避免把 spec 或展示名称写入挂载引用。 */
export function pluginConfigInstanceId(config: Model.PluginConfig): Model.PluginInstanceId {
  switch (config.kind) {
    case 'anon':
      return { code: config.code, kind: config.kind, uid: config.uid }
    case 'named':
      return { code: config.code, kind: config.kind, name: config.name }
    case 'mono':
      return { code: config.code, kind: config.kind }
  }
}

/** 生成选择器标签，展示名称重复时仍可通过真实 ID 区分。 */
export function pluginInstanceOptionLabel(config: Model.PluginConfig): string {
  const id = pluginConfigInstanceId(config)
  let key: string
  switch (id.kind) {
    case 'anon':
      key = `${id.code}-a-${id.uid}`
      break
    case 'named':
      key = `${id.code}-n-${id.name}`
      break
    case 'mono':
      key = `${id.code}-m`
      break
  }
  return `${pluginInstanceDisplayName(config)} (${key})`
}

/** 根据实例查询结果生成详情状态，查询异常与实例不存在分开呈现。 */
export function pluginBindingDetailState(config?: Model.PluginConfig, error?: string): PluginBindingDetailState {
  if (error) return { kind: 'error', reason: error }
  if (!config) return { kind: 'missing' }
  return {
    kind: 'resolved',
    pluginType: isWasmPluginCode(config.code) ? 'wasm' : 'native',
  }
}
