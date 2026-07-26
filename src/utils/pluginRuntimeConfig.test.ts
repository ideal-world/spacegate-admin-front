/// <reference types="node" />

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  updateNativePluginRuntimeConfig,
  updateWasmPluginRuntimeConfig,
} from './pluginRuntimeConfig.ts'

test('replaces a native plugin runtime spec with the edited object', () => {
  const config = {
    code: 'limit',
    kind: 'named',
    name: 'route-limit',
    spec: { max_request_number: 10 },
  } as const

  const updated = updateNativePluginRuntimeConfig(config, { max_request_number: 20 })

  assert.deepEqual(updated.spec, { max_request_number: 20 })
})

test('updates a wasm runtime config without overwriting binding metadata', () => {
  const config = {
    code: 'wasm',
    kind: 'named',
    name: 'bind-route-auth',
    spec: {
      image_url: 'oci://registry.example/auth:v1',
      binding_scope: 'route',
      binding_owner: 'orders',
      binding_base_plugin: 'auth',
      binding_config_mode: 'schema',
      plugin_config: { enabled: false },
      default_config: { enabled: false },
    },
  } as const

  const updated = updateWasmPluginRuntimeConfig(config, { enabled: true }, 'yaml')

  assert.deepEqual(updated.spec.plugin_config, { enabled: true })
  assert.deepEqual(updated.spec.default_config, { enabled: true })
  assert.equal(updated.spec.binding_config_mode, 'yaml')
  assert.equal(updated.spec.binding_scope, 'route')
  assert.equal(updated.spec.binding_owner, 'orders')
  assert.equal(updated.spec.binding_base_plugin, 'auth')
  assert.equal(updated.spec.image_url, 'oci://registry.example/auth:v1')
})

test('keeps legacy XML runtime config as raw text', () => {
  const config = {
    code: 'wasm',
    kind: 'named',
    name: 'bind-route-auth',
    spec: { binding_config_mode: 'xml', binding_base_plugin: 'auth' },
  } as const

  const updated = updateWasmPluginRuntimeConfig(config, '<config enabled="true" />', 'xml')

  assert.equal(updated.spec.plugin_config, '<config enabled="true" />')
  assert.equal(updated.spec.default_config, '<config enabled="true" />')
  assert.equal(updated.spec.binding_config_mode, 'xml')
  assert.equal(updated.spec.binding_base_plugin, 'auth')
})
