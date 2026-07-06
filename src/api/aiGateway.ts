import type { Model } from 'spacegate-admin-client'

export type JsonSchema = Record<string, any>

export interface WasmImageSchemaRequest {
  image_url: string
  schema_path?: string
  oci_auth?: Record<string, any>
}

export interface TenantRateLimitRule {
  tenant: string
  model?: string
  path?: string
  policy?: 'abandon' | 'queue' | 'wait' | ''
  rps: number
  burst: number
  cost: number
  ttl_secs?: number
}

export interface TenantRateLimitRuleView extends TenantRateLimitRule {
  key: string
  ttl_remaining_secs?: number
}

export interface TenantRateLimitResolution {
  tenant: string
  model: string
  path: string
  policy: 'abandon' | 'queue' | 'wait'
  rps: number
  burst: number
  cost: number
  matched_key?: string
  fallback_global: boolean
  candidate_keys: string[]
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, '')
}

const aiGatewayBaseUrl = (() => {
  const env = (import.meta as any).env?.VITE_AI_GATEWAY_BASE_URL
  if (typeof env === 'string' && env.length > 0) {
    return normalizeBaseUrl(env)
  }
  return '/ai-gateway'
})()

const adminApiBaseUrl = (() => {
  const env = (import.meta as any).env?.VITE_ADMIN_API_BASE_URL ?? (import.meta as any).env?.VITE_API_BASE_PATH
  if (typeof env === 'string' && env.length > 0) {
    return normalizeBaseUrl(env)
  }
  return '/api'
})()

async function request<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || response.statusText)
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return await response.json()
  }
  return await response.text() as T
}

export function getAiGatewayPluginSchema(plugin = 'ai-gateway-queue') {
  return request<JsonSchema>(aiGatewayBaseUrl, `/v1/admin/plugins/${plugin}/schema`)
}

function pluginInstanceIdQuery(id: Model.PluginInstanceId) {
  const params = new URLSearchParams()
  params.set('code', id.code)
  params.set('kind', id.kind)
  if (id.kind === 'named') params.set('name', id.name)
  if (id.kind === 'anon') params.set('uid', id.uid)
  return params.toString()
}

export function getSavedWasmPluginImageSchema(id: Model.PluginInstanceId) {
  return request<JsonSchema>(adminApiBaseUrl, `/plugin/wasm/schema?${pluginInstanceIdQuery(id)}`)
}

export function previewWasmPluginImageSchema(payload: WasmImageSchemaRequest) {
  return request<JsonSchema>(adminApiBaseUrl, '/plugin/wasm/schema/preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getAiGatewayPluginReadme(plugin = 'ai-gateway-queue') {
  return request<string>(aiGatewayBaseUrl, `/v1/admin/plugins/${plugin}/readme`, {
    headers: {
      accept: 'text/markdown',
    },
  })
}

export function listTenantRateLimits(filters: Partial<TenantRateLimitRule> = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value))
    }
  }
  const query = params.toString()
  return request<TenantRateLimitRuleView[]>(aiGatewayBaseUrl, `/v1/admin/tenant-rate-limits${query ? `?${query}` : ''}`)
}

export function resolveTenantRateLimit(rule: Pick<TenantRateLimitRule, 'tenant' | 'model' | 'path' | 'policy'>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(rule)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value))
    }
  }
  return request<TenantRateLimitResolution>(aiGatewayBaseUrl, `/v1/admin/tenant-rate-limits/resolve?${params.toString()}`)
}

export function upsertTenantRateLimit(rule: TenantRateLimitRule) {
  return request<TenantRateLimitRuleView>(aiGatewayBaseUrl, '/v1/admin/tenant-rate-limits', {
    method: 'PUT',
    body: JSON.stringify(rule),
  })
}

export function deleteTenantRateLimit(rule: TenantRateLimitRule) {
  return request<{ deleted: number }>(aiGatewayBaseUrl, '/v1/admin/tenant-rate-limits', {
    method: 'DELETE',
    body: JSON.stringify(rule),
  })
}
