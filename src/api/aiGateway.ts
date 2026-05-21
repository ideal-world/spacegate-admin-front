export type JsonSchema = Record<string, any>

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

const baseUrl = (() => {
  const env = (import.meta as any).env?.VITE_AI_GATEWAY_BASE_URL
  return typeof env === 'string' && env.length > 0 ? env.replace(/\/$/, '') : ''
})()

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
  return request<JsonSchema>(`/v1/admin/plugins/${plugin}/schema`)
}

export function getAiGatewayPluginReadme(plugin = 'ai-gateway-queue') {
  return request<string>(`/v1/admin/plugins/${plugin}/readme`, {
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
  return request<TenantRateLimitRuleView[]>(`/v1/admin/tenant-rate-limits${query ? `?${query}` : ''}`)
}

export function upsertTenantRateLimit(rule: TenantRateLimitRule) {
  return request<TenantRateLimitRuleView>('/v1/admin/tenant-rate-limits', {
    method: 'PUT',
    body: JSON.stringify(rule),
  })
}

export function deleteTenantRateLimit(rule: TenantRateLimitRule) {
  return request<{ deleted: number }>('/v1/admin/tenant-rate-limits', {
    method: 'DELETE',
    body: JSON.stringify(rule),
  })
}
