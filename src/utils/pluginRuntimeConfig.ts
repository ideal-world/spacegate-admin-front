import type { ManagedPluginConfig } from './pluginInstance'
import type { BoundWasmConfigMode } from './wasmPlugin'

type RuntimeConfig = Record<string, unknown> | string

/** 复制运行时配置，避免编辑器中的对象引用回写到原始配置。 */
function cloneRuntimeConfig<T extends RuntimeConfig>(value: T): T {
  if (typeof value === 'string') return value
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * 使用编辑后的对象整体替换原生插件运行时配置。
 * 原生插件的 spec 就是插件运行时配置，因此不需要保留额外绑定元数据。
 */
export function updateNativePluginRuntimeConfig<T extends ManagedPluginConfig>(
  config: T,
  runtimeConfig: Record<string, unknown>,
): T {
  return {
    ...config,
    spec: cloneRuntimeConfig(runtimeConfig),
  }
}

/**
 * 更新 Wasm 插件绑定的运行时配置，同时保留镜像、绑定范围和基础插件等元数据。
 * `plugin_config` 和 `default_config` 是运行时实际消费的配置副本。
 */
export function updateWasmPluginRuntimeConfig<T extends ManagedPluginConfig>(
  config: T,
  runtimeConfig: RuntimeConfig,
  mode: BoundWasmConfigMode,
): T {
  const spec = (config.spec && typeof config.spec === 'object' && !Array.isArray(config.spec))
    ? { ...(config.spec as Record<string, unknown>) }
    : {}
  const value = cloneRuntimeConfig(runtimeConfig)
  return {
    ...config,
    spec: {
      ...spec,
      binding_config_mode: mode,
      plugin_config: value,
      default_config: cloneRuntimeConfig(value),
    },
  }
}
