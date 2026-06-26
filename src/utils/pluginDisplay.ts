export const NATIVE_PLUGIN_NAMES: Record<string, { zh: string; en: string }> = {
  inject: { zh: '请求/响应注入', en: 'Request/Response Injection' },
  rewrite: { zh: '请求重写', en: 'Request Rewrite' },
  limit: { zh: '基础限流', en: 'Basic Rate Limit' },
  redirect: { zh: '重定向', en: 'Redirect' },
  'header-modifier': { zh: 'Header 修改', en: 'Header Modifier' },
  'static-resource': { zh: '静态资源', en: 'Static Resource' },
  maintenance: { zh: '维护页', en: 'Maintenance Page' },
  'set-version': { zh: '协议版本设置', en: 'Protocol Version Setter' },
  'set-scheme': { zh: 'Scheme 设置', en: 'Scheme Setter' },
  'redis-count': { zh: 'Redis 计数', en: 'Redis Counter' },
  'redis-limit': { zh: 'Redis 限流', en: 'Redis Rate Limit' },
  'redis-time-range': { zh: 'Redis 时间窗口', en: 'Redis Time Range' },
  'redis-dynamic-route': { zh: 'Redis 动态路由', en: 'Redis Dynamic Route' },
  'east-west-traffic-white-list': { zh: '白名单', en: 'East-West Allowlist' },
}

export function nativePluginDisplayName(pluginCode: string, locale: string) {
  const item = NATIVE_PLUGIN_NAMES[pluginCode]
  if (!item) return pluginCode
  return locale.startsWith('zh') ? item.zh : item.en
}
