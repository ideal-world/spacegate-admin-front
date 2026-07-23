/** 插件展示所需的最小动态元数据结构。 */
export type PluginAttributeLike = {
  code: string
  meta: object
}

/** 优先展示插件注册时提供的类型标题，缺失时回退插件代码。 */
export function nativePluginDisplayName(plugin: PluginAttributeLike): string {
  const title = (plugin.meta as { title?: unknown }).title
  return typeof title === 'string' && title.trim() ? title.trim() : plugin.code
}
