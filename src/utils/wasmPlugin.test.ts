import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildBoundWasmPluginConfig,
  buildThirdPartyWasmPluginConfig,
  hasPluginInstanceRef,
  isWasmPluginBindingConfig,
  isWasmPluginCenterConfig,
  normalizeWasmPluginId,
  parseYamlConfigText,
  pluginInstanceDisplayName,
  setPluginInstanceRefEnabled,
  sortWasmPluginCenterConfigs,
  stableWasmBindingId,
  validateWasmPluginId,
} from './wasmPlugin.ts'

test('normalizes custom wasm plugin id without dots', () => {
  assert.equal(normalizeWasmPluginId('Custom.Auth Plugin'), 'custom-auth-plugin')
})

test('rejects ids that cannot round-trip through wasm.{name}.json', () => {
  assert.throws(() => validateWasmPluginId('custom.auth'), /lowercase letters, numbers, and hyphens/)
})

test('generates short stable wasm binding ids from association dimensions', () => {
  const id = stableWasmBindingId('route', 'Route: catch-all / HAI', 'hai-mix-process')
  assert.match(id, /^bind-[a-f0-9]{8}$/)
  assert.equal(id, stableWasmBindingId('route', 'route: catch-all / hai', 'HAI-MIX-PROCESS'))
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
    schemaPath: '',
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
  assert.equal(result.config.display_name, 'Custom Auth')
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
    schemaPath: 'schema/plugin.schema.json',
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
    bindingName: stableWasmBindingId('route', 'Route: catch-all / HAI', 'hai-mix-process'),
    bindingOwner: 'Route: catch-all / HAI',
    bindingDisplayName: 'route / Route: catch-all / HAI / hai-mix-process',
    bindingScope: 'route',
    configMode: 'schema',
    schemaConfig: { tenant: 'route-a' },
    yamlConfig: '',
  })

  assert.equal(result.config.code, 'wasm')
  assert.equal(result.config.kind, 'named')
  assert.equal(result.config.name, stableWasmBindingId('route', 'Route: catch-all / HAI', 'hai-mix-process'))
  assert.equal(result.config.display_name, 'route / Route: catch-all / HAI / hai-mix-process')
  assert.equal(result.config.spec.url, defaults.spec.url)
  assert.deepEqual(result.config.spec.default_config, { tenant: 'route-a' })
  assert.deepEqual(result.config.spec.plugin_config, { tenant: 'route-a' })
  assert.equal(result.config.spec.binding_config_mode, 'schema')
  assert.equal(result.config.spec.binding_scope, 'route')
  assert.equal(result.config.spec.binding_owner, 'Route: catch-all / HAI')
  assert.equal(result.config.spec.binding_display_name, 'route / Route: catch-all / HAI / hai-mix-process')
  assert.equal(defaults.spec.plugin_config.defaultTenant, 'base')
})

test('parses yaml config text as a JSON-compatible object', () => {
  assert.deepEqual(parseYamlConfigText('enabled: true\nlimit: 10\n'), {
    enabled: true,
    limit: 10,
  })
  assert.deepEqual(parseYamlConfigText(''), {})
  assert.throws(() => parseYamlConfigText('- item'), /YAML config must be an object/)
})

test('builds a bound wasm plugin config with yaml text config', () => {
  const baseConfig = {
    code: 'wasm',
    kind: 'named',
    name: 'yaml-auth',
    spec: {
      url: 'file:///plugins/yaml-auth.wasm',
      plugin_name: 'yaml-auth',
      plugin_root_id: 'yaml-auth-root',
      plugin_vm_id: 'yaml-auth-vm',
      plugin_config: { enabled: true },
    },
  } as const

  const result = buildBoundWasmPluginConfig({
    baseConfig,
    bindingName: stableWasmBindingId('rule', 'Rule #1', 'yaml-auth'),
    bindingOwner: 'Rule #1',
    bindingDisplayName: 'rule / Rule #1 / yaml-auth',
    bindingScope: 'rule',
    configMode: 'yaml',
    schemaConfig: {},
    yamlConfig: 'enabled: true\nmode: strict\n',
  })

  assert.equal(result.config.name, stableWasmBindingId('rule', 'Rule #1', 'yaml-auth'))
  assert.equal(result.config.spec.binding_config_mode, 'yaml')
  assert.equal(result.config.spec.binding_owner, 'Rule #1')
  assert.equal(result.config.spec.binding_display_name, 'rule / Rule #1 / yaml-auth')
  assert.deepEqual(result.config.spec.plugin_config, { enabled: true, mode: 'strict' })
  assert.deepEqual(result.config.spec.default_config, { enabled: true, mode: 'strict' })
})

test('keeps legacy xml binding mode compatible while storing new writes as raw text', () => {
  const baseConfig = {
    code: 'wasm',
    kind: 'named',
    name: 'legacy-xml-auth',
    spec: {
      url: 'file:///plugins/legacy-xml-auth.wasm',
      plugin_name: 'legacy-xml-auth',
      plugin_config: { enabled: true },
    },
  } as const

  const result = buildBoundWasmPluginConfig({
    baseConfig,
    bindingName: 'Legacy XML Auth',
    bindingScope: 'rule',
    configMode: 'xml',
    schemaConfig: {},
    yamlConfig: '<config><enabled>true</enabled></config>',
  })

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
    yamlConfig: '',
  })

  assert.deepEqual(result.config.spec.plugin_config, { issuer: 'runtime', _rules_: [{ _match_route_: ['api-route'] }] })
  assert.deepEqual(result.config.spec.default_config, { issuer: 'runtime', _rules_: [{ _match_route_: ['api-route'] }] })
})

test('distinguishes plugin center wasm configs from resource binding configs', () => {
  const centerConfig = {
    code: 'wasm',
    kind: 'named',
    name: 'hai-mix-process',
    spec: {
      plugin_name: 'hai-mix-process',
      image_url: 'oci://registry.example.com/plugins/hai:v1',
    },
  } as const
  const bindingConfig = {
    code: 'wasm',
    kind: 'named',
    name: 'route-hai-mix-process',
    spec: {
      plugin_name: 'hai-mix-process',
      binding_scope: 'route',
      binding_base_plugin: 'hai-mix-process',
    },
  } as const
  const queueConfig = {
    code: 'wasm',
    kind: 'named',
    name: 'ai-gateway-queue',
    spec: {
      plugin_name: 'ai-gateway-queue',
    },
  } as const

  assert.equal(isWasmPluginCenterConfig(centerConfig), true)
  assert.equal(isWasmPluginBindingConfig(centerConfig), false)
  assert.equal(isWasmPluginCenterConfig(bindingConfig), false)
  assert.equal(isWasmPluginBindingConfig(bindingConfig), true)
  assert.equal(isWasmPluginCenterConfig(queueConfig), false)
})

test('displays a bound wasm plugin by its base plugin name instead of the binding id', () => {
  const configs = [
    {
      code: 'wasm',
      kind: 'named',
      name: 'hai-mix-process',
      spec: {
        display_name: 'HAI Mix Process',
        plugin_name: 'hai-mix-process',
      },
    },
    {
      code: 'wasm',
      kind: 'named',
      name: 'bind-85513be3',
      spec: {
        binding_scope: 'route',
        binding_base_plugin: 'hai-mix-process',
        binding_display_name: 'route / route-a / hai-mix-process',
      },
    },
  ] as const

  assert.equal(pluginInstanceDisplayName({ code: 'wasm', kind: 'named', name: 'bind-85513be3' }, configs), 'HAI Mix Process')
})

test('prefers the managed display name over legacy wasm spec fields', () => {
  const config = {
    code: 'wasm',
    kind: 'named',
    name: 'custom-auth',
    display_name: 'Production Auth',
    spec: {
      display_name: 'Legacy Auth',
      plugin_name: 'auth',
    },
  } as const

  assert.equal(pluginInstanceDisplayName(config, [config]), 'Production Auth')
})

test('toggles a gateway-level plugin instance reference without duplicating it', () => {
  const ref = { code: 'wasm', kind: 'named', name: 'hai-mix-process' } as const
  const existing = [
    { code: 'request-id', kind: 'mono' },
  ] as const

  const enabled = setPluginInstanceRefEnabled(existing, ref, true)
  assert.equal(hasPluginInstanceRef(enabled, ref), true)
  assert.equal(enabled.length, 2)
  assert.equal(enabled.find((item) => item.code === 'wasm')?.priority, 0)

  const enabledAgain = setPluginInstanceRefEnabled(enabled, ref, true)
  assert.equal(enabledAgain.length, 2)

  const disabled = setPluginInstanceRefEnabled(enabledAgain, ref, false)
  assert.equal(hasPluginInstanceRef(disabled, ref), false)
  assert.deepEqual(disabled, [{ code: 'request-id', kind: 'mono', priority: 0 }])
})

test('sorts plugin center wasm configs by priority and stable display identity', () => {
  const configs = [
    {
      code: 'wasm',
      kind: 'named',
      name: 'z-plugin',
      spec: {
        display_name: 'Z Plugin',
        priority: 10,
      },
    },
    {
      code: 'wasm',
      kind: 'named',
      name: 'a-plugin',
      spec: {
        display_name: 'A Plugin',
        priority: 10,
      },
    },
    {
      code: 'wasm',
      kind: 'named',
      name: 'top-plugin',
      spec: {
        display_name: 'Top Plugin',
        priority: 100,
      },
    },
  ] as const

  assert.deepEqual(sortWasmPluginCenterConfigs(configs).map((item) => item.name), [
    'top-plugin',
    'a-plugin',
    'z-plugin',
  ])
  assert.deepEqual(configs.map((item) => item.name), ['z-plugin', 'a-plugin', 'top-plugin'])
})
