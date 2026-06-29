import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildBoundWasmPluginConfig,
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

test('builds a bound wasm plugin config from a default config and schema values', () => {
  const defaults = buildThirdPartyWasmPluginConfig({
    instanceName: 'hai-mix-process',
    imageUrl: 'oci://registry.example.com/plugins/hai:dev',
    displayName: 'HAI Mix',
    description: 'default config',
    phase: 'AUTHN',
    priority: 100,
    imagePullPolicy: 'IfNotPresent',
    imagePullSecret: '',
    pluginName: 'hai',
    failStrategy: 'fail_open',
    sha256: '',
    defaultConfigDisable: false,
    defaultConfig: { defaultTenant: 'base' },
    matchRules: [],
    pluginRootId: 'hai-root',
    pluginVmId: 'hai-vm',
    moduleCacheKey: '',
    useCache: true,
    vmPoolSize: 1,
    waitVmPoolSize: 0,
    ociAuth: {},
    clusters: {},
    limits: {},
  }).config

  const result = buildBoundWasmPluginConfig({
    baseConfig: defaults,
    bindingName: 'Route: catch-all / HAI',
    bindingScope: 'route',
    configMode: 'schema',
    schemaConfig: { tenant: 'route-a' },
    xmlConfig: '',
  })

  assert.equal(result.config.code, 'wasm')
  assert.equal(result.config.kind, 'named')
  assert.equal(result.config.name, 'route-catch-all-hai')
  assert.equal(result.config.spec.url, defaults.spec.url)
  assert.deepEqual(result.config.spec.default_config, { tenant: 'route-a' })
  assert.deepEqual(result.config.spec.plugin_config, { tenant: 'route-a' })
  assert.equal(result.config.spec.binding_config_mode, 'schema')
  assert.equal(result.config.spec.binding_scope, 'route')
  assert.equal(defaults.spec.plugin_config.defaultTenant, 'base')
})

test('builds a bound wasm plugin config with xml text config', () => {
  const baseConfig = {
    code: 'wasm',
    kind: 'named',
    name: 'xml-auth',
    spec: {
      url: 'file:///plugins/xml-auth.wasm',
      plugin_name: 'xml-auth',
      plugin_root_id: 'xml-auth-root',
      plugin_vm_id: 'xml-auth-vm',
      plugin_config: { enabled: true },
    },
  } as const

  const result = buildBoundWasmPluginConfig({
    baseConfig,
    bindingName: 'Rule #1 XML Auth',
    bindingScope: 'rule',
    configMode: 'xml',
    schemaConfig: {},
    xmlConfig: '<config><enabled>true</enabled></config>',
  })

  assert.equal(result.config.name, 'rule-1-xml-auth')
  assert.equal(result.config.spec.binding_config_mode, 'xml')
  assert.equal(result.config.spec.plugin_config, '<config><enabled>true</enabled></config>')
  assert.equal(result.config.spec.default_config, '<config><enabled>true</enabled></config>')
})

test('default bound wasm config copies runtime plugin_config before editor default_config', () => {
  const baseConfig = {
    code: 'wasm',
    kind: 'named',
    name: 'with-runtime-config',
    spec: {
      url: 'file:///plugins/runtime.wasm',
      default_config: { issuer: 'default-only' },
      plugin_config: { issuer: 'runtime', _rules_: [{ _match_route_: ['api-route'] }] },
    },
  } as const

  const result = buildBoundWasmPluginConfig({
    baseConfig,
    bindingName: 'Gateway Runtime Config',
    bindingScope: 'gateway',
    configMode: 'default',
    schemaConfig: {},
    xmlConfig: '',
  })

  assert.deepEqual(result.config.spec.plugin_config, { issuer: 'runtime', _rules_: [{ _match_route_: ['api-route'] }] })
  assert.deepEqual(result.config.spec.default_config, { issuer: 'runtime', _rules_: [{ _match_route_: ['api-route'] }] })
})
