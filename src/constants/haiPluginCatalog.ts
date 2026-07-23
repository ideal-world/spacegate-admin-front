/** HAI 原生插件在管理端展示的用途与配置示例。 */
export type HaiPluginGuide = {
  title: string
  description: string
  note?: string
  example: Record<string, unknown>
}

const REDIS_URL = 'redis://:password@redis.example:6379/0'

/** 动态库插件加载前无法提供 Schema，因此由前端维护可查询的配置说明。 */
export const HAI_PLUGIN_GUIDES: Record<string, HaiPluginGuide> = {
  auth: {
    title: 'HAI Hub legacy authentication',
    description: 'Handles legacy authentication and request crypto. Configure a private cache_url when this plugin is loaded from a dynamic library.',
    note: 'cache_url must point to the Redis instance used by the authentication service.',
    example: {
      cache_url: REDIS_URL,
      cache_same_req_timeout_sec: 10,
      cors_allow_origin: '*',
      cors_allow_methods: '*',
      cors_allow_headers: '*',
    },
  },
  'hai-auth': {
    title: 'HAI API Key authentication',
    description: 'Validates API Key subscriptions and client IP or MAC restrictions for the target asset.',
    note: 'redis_url is required for dynamic HAI plugins and should use the same Redis DB as HAI API Key records.',
    example: {
      redis_url: REDIS_URL,
      trusted_proxy_cidrs: ['10.0.0.0/8'],
    },
  },
  'hai-asset': {
    title: 'HAI asset loader',
    description: 'Loads the requested asset from Redis and rejects unpublished assets.',
    note: 'Keep allow_asset_self_lookup enabled only when this plugin may run without hai-auth before it.',
    example: {
      redis_url: REDIS_URL,
      allow_asset_self_lookup: true,
    },
  },
  'hai-quota': {
    title: 'HAI quota enforcement',
    description: 'Applies the asset QPS and concurrency limits with Redis Lua scripts.',
    note: 'missing_asset_policy accepts error or skip. Use error unless the route intentionally omits hai-asset.',
    example: {
      redis_url: REDIS_URL,
      missing_asset_policy: 'error',
      allow_asset_self_lookup: true,
    },
  },
  'hai-dispatch': {
    title: 'HAI runtime dispatch',
    description: 'Resolves an asset runtime endpoint and forwards the request to its upstream service.',
    note: 'gateway_hosts is reserved and does not currently participate in dispatch selection.',
    example: {
      redis_url: REDIS_URL,
      gateway_hosts: [],
      allow_asset_self_lookup: true,
    },
  },
  'hai-observe': {
    title: 'HAI observability',
    description: 'Emits structured HAI audit logs and LLM metrics after request processing.',
    note: 'output_guard_enabled and allowed_output_targets are reserved fields; they do not currently block responses.',
    example: {
      audit_log_enabled: true,
      llm_metrics_enabled: true,
      output_guard_enabled: false,
      allowed_output_targets: [],
      model_error_keywords: ['error', 'ERR_', 'FAILED'],
    },
  },
}
