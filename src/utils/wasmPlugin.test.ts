import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildThirdPartyWasmPluginConfig,
  normalizeWasmPluginId,
  validateWasmPluginId,
} from './wasmPlugin.ts'

test('normalizes custom wasm plugin id without dots', () => {
  assert.equal(normalizeWasmPluginId('Custom.Auth Plugin'), 'custom-auth-plugin')
})

test('rejects ids that cannot round-trip through wasm.{name}.json', () => {
  assert.throws(() => validateWasmPluginId('custom.auth'), /lowercase letters, numbers, and hyphens/)
})

test('builds wasm named plugin config and reports reload requirement outside spec', () => {
  const result = buildThirdPartyWasmPluginConfig({
    instanceName: 'custom-auth',
    imageUrl: 'oci://registry.example.com/plugins/auth:v1',
    displayName: 'Custom Auth',
    description: '',
    phase: 'AUTHN',
    priority: 10,
    imagePullPolicy: 'IfNotPresent',
    imagePullSecret: '',
    pluginName: 'auth',
    failStrategy: 'fail_open',
    sha256: '',
    defaultConfigDisable: false,
    defaultConfig: { enabled: true },
    matchRules: [],
    pluginRootId: 'custom-auth-root',
    pluginVmId: 'custom-auth-vm',
    moduleCacheKey: '',
    useCache: true,
    vmPoolSize: 1,
    waitVmPoolSize: 0,
    ociAuth: {},
    clusters: {},
    limits: {},
  })

  assert.equal(result.requiresGlobalReload, true)
  assert.equal(result.config.code, 'wasm')
  assert.equal(result.config.kind, 'named')
  assert.equal(result.config.name, 'custom-auth')
  assert.equal(result.config.spec.url, 'oci://registry.example.com/plugins/auth:v1')
  assert.equal(result.config.spec.image_repository, 'oci://registry.example.com/plugins/auth')
  assert.equal(result.config.spec.image_version, 'v1')
  assert.equal('x_spacegate_reload_required' in result.config.spec, false)
})
