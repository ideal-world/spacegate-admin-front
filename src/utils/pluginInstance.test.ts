import type { Model } from 'spacegate-admin-client'

import {
  isWasmPluginCode,
  pluginBindingDetailState,
  pluginConfigOptionName,
  pluginConfigInstanceId,
  pluginInstanceDisplayName,
  pluginInstanceOptionLabel,
} from './pluginInstance.ts'

function equal(actual: unknown, expected: unknown): void {
  if (actual !== expected) throw new Error(`expected ${String(expected)}, got ${String(actual)}`)
}

function notEqual(actual: unknown, expected: unknown): void {
  if (actual === expected) throw new Error(`expected different values, got ${String(actual)}`)
}

function deepEqual(actual: unknown, expected: unknown): void {
  equal(JSON.stringify(actual), JSON.stringify(expected))
}

function match(actual: string, expected: RegExp): void {
  if (!expected.test(actual)) throw new Error(`expected ${actual} to match ${expected}`)
}

function named(code: string, name: string, extra: Record<string, unknown> = {}): Model.PluginConfig {
  return {
    code,
    kind: 'named',
    name,
    spec: {},
    ...extra,
  } as Model.PluginConfig
}

equal(isWasmPluginCode('wasm'), true)
equal(isWasmPluginCode('wasm-auth'), true)
equal(isWasmPluginCode('hai-auth'), false)

equal(pluginInstanceDisplayName(named('hai-auth', 'auth-a1', { display_name: '  生产鉴权  ' })), '生产鉴权')
equal(pluginInstanceDisplayName(named('wasm', 'risk-a1', { spec: { display_name: '风控', title: '标题', plugin_name: 'risk' } })), '风控')
equal(pluginInstanceDisplayName(named('wasm', 'risk-a1', { spec: { display_name: ' ', title: '内容安全', plugin_name: 'risk' } })), '内容安全')
equal(pluginInstanceDisplayName(named('hai-auth', 'auth-a1')), 'hai-auth')
equal(pluginConfigOptionName(named('hai-auth', 'auth-a1', { display_name: '生产鉴权' })), '生产鉴权')
equal(pluginConfigOptionName(named('hai-auth', 'auth-a1')), 'auth-a1')

const first = named('hai-auth', 'auth-a1', { display_name: '生产鉴权' })
const second = named('hai-auth', 'auth-a2', { display_name: '生产鉴权' })
notEqual(pluginInstanceOptionLabel(first), pluginInstanceOptionLabel(second))
match(pluginInstanceOptionLabel(first), /hai-auth-n-auth-a1/)
deepEqual(pluginConfigInstanceId(first), { code: 'hai-auth', kind: 'named', name: 'auth-a1' })

deepEqual(pluginBindingDetailState(first), { kind: 'resolved', pluginType: 'native' })
deepEqual(pluginBindingDetailState(named('wasm', 'risk-a1')), { kind: 'resolved', pluginType: 'wasm' })
deepEqual(pluginBindingDetailState(undefined), { kind: 'missing' })
deepEqual(pluginBindingDetailState(undefined, 'request failed'), { kind: 'error', reason: 'request failed' })
