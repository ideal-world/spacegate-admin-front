<script setup lang="ts">
import { Api, Model } from 'spacegate-admin-client'
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
import { unwrapResponse, keyPluginId, randomUid } from '../utils';
import { AI_WASM_CATALOG } from '../constants/aiWasmCatalog'
import { nativePluginDisplayName } from '../utils/pluginDisplay'
import { buildBoundWasmPluginConfig, stableWasmBindingId, type BoundWasmConfigMode } from '../utils/wasmPlugin'
import { getSavedWasmPluginImageSchema, type JsonSchema } from '../api/aiGateway'
import PluginForm from './PluginForm.vue';
import SchemaForm from './SchemaForm.vue';
import { useI18n } from 'vue-i18n'
import { pluginInstanceOptionLabel } from '../utils/pluginInstance'

const { locale, t } = useI18n();

const props = withDefaults(defineProps<{
    bindingScope?: 'gateway' | 'route' | 'rule' | 'backend'
    bindingName?: string
}>(), {
    bindingScope: 'route',
    bindingName: '',
})

type PluginCategory = 'native' | 'ai'
type PluginSpecRecord = Record<string, unknown>
type PluginConfigLite = {
    code: string
    kind: 'anon' | 'named' | 'mono'
    uid?: string
    name?: string
    display_name?: string | null
    spec: PluginSpecRecord
}
type NativePluginOption = {
    code: string
    name: string
    description: string
}
type AiPluginOption = {
    key: string
    code: string
    name: string
    description: string
    configName: string
}

const modelValue = defineModel<Model.PluginInstanceId | undefined>({})
const category = ref<PluginCategory>('native')
const code = ref<string | undefined>(modelValue.value?.code)
const aiSelectedKey = ref<string | undefined>()
const configMode = ref<'reference' | 'custom'>('reference')
const pluginAttrs = shallowRef<Model.PluginAttributes[]>([])
const pluginConfigs = shallowRef<PluginConfigLite[]>([])
const wasmPluginConfigs = shallowRef<PluginConfigLite[]>([])
const instances = shallowRef<PluginConfigLite[]>([])
const attr = ref<Model.PluginAttributes | undefined>()
const formRef = ref<InstanceType<typeof PluginForm> | null>(null)
const loading = ref(false)
const wasmConfigMode = ref<BoundWasmConfigMode>('default')
const wasmSchemaConfig = ref<Record<string, any>>({})
const wasmYamlConfigText = ref('')
const wasmImageSchema = shallowRef<JsonSchema | undefined>()
const wasmSchemaLoading = ref(false)
const wasmSchemaError = ref('')
const schemaFormRef = ref<InstanceType<typeof SchemaForm> | null>(null)
const existingWasmBinding = ref<PluginConfigLite | undefined>()
const suppressCategoryReset = ref(false)

const texts = computed(() => locale.value.startsWith('zh') ? {
    native: '原生插件',
    ai: 'Wasm 扩展',
    pluginCategory: '插件分类',
    pluginType: '具体插件',
    pluginConfig: '插件配置',
    configMode: '配置方式',
    code: '插件代码',
    referenceConfig: '引用已有配置',
    customConfig: '新建原生插件配置',
    nativeHint: '原生插件由网关内置，支持直接新建配置或引用已有配置。',
    aiHint: 'Wasm 扩展从插件中心选择默认配置，绑定时会为当前资源新增或更新一份专属配置。',
    referenceHint: '选择一份已经保存的插件配置，绑定到当前资源。',
    customHint: '创建一份新的 named 原生插件配置，保存后立即绑定到当前资源。',
    selectPluginType: '请选择原生插件',
    selectPluginTypeDesc: '选择插件后会加载 schema，并显示配置表单。',
    emptyConfig: '当前插件还没有可引用的 named 配置。',
    emptyAiConfig: '暂无可绑定的 Wasm 扩展配置，请先到插件中心创建。',
    loadFailed: '插件列表加载失败，请确认 admin-server 和网关实例已启动。',
    wasmBinding: '绑定配置',
    wasmBindingName: '调试标识',
    wasmBindingNameHint: '系统按绑定位置自动生成内部标识；同一位置重复绑定同一插件时会更新这份配置。',
    wasmDefaultMode: '使用默认配置',
    wasmSchemaMode: '镜像 Schema 表单',
    wasmYamlMode: 'YAML 配置',
    wasmDefaultHint: '复制插件中心默认配置，后续可独立编辑当前绑定。',
    wasmSchemaHint: '从插件 OCI 镜像读取 schema 文件，并按 schema 生成当前绑定实例的配置表单。',
    wasmYamlHint: '填写 YAML object，保存后会解析为当前绑定实例的 plugin_config。',
    wasmYamlPlaceholder: 'enabled: true\nkey: value',
    schemaPathHint: '默认读取镜像内的 schema.json；可在插件中心配置 schema_path 覆盖。',
    schemaLoadFailed: '镜像 Schema 加载失败',
    schemaEmpty: '镜像中不存在 schema 配置；可以切换到 YAML 配置继续填写。',
    selectWasmBase: '请选择插件中心默认配置',
} : {
    native: 'Native Plugin',
    ai: 'Wasm Extension',
    pluginCategory: 'Plugin Category',
    pluginType: 'Plugin',
    pluginConfig: 'Plugin Configuration',
    configMode: 'Configuration Mode',
    code: 'Plugin Code',
    referenceConfig: 'Reference Existing Configuration',
    customConfig: 'Create Native Plugin Configuration',
    nativeHint: 'Native plugins are built into the gateway. You can create a new configuration or reference an existing one.',
    aiHint: 'Select the default Wasm extension config from Plugin Center. Binding creates or updates a config dedicated to this resource.',
    referenceHint: 'Select an existing plugin configuration and bind it to this resource.',
    customHint: 'Create a new named native plugin configuration and bind it to this resource immediately.',
    selectPluginType: 'Select a native plugin',
    selectPluginTypeDesc: 'After selecting a plugin, the schema loads and the configuration form appears.',
    emptyConfig: 'This plugin has no named configuration to reference.',
    emptyAiConfig: 'No Wasm extension configuration is available. Create one in Plugin Center first.',
    loadFailed: 'Failed to load plugins. Make sure admin-server and gateway instance are running.',
    wasmBinding: 'Binding Configuration',
    wasmBindingName: 'Debug ID',
    wasmBindingNameHint: 'The internal ID is generated from the binding location. Rebinding the same plugin at the same location updates this config.',
    wasmDefaultMode: 'Use Default Config',
    wasmSchemaMode: 'Image Schema Form',
    wasmYamlMode: 'YAML Config',
    wasmDefaultHint: 'Copy the Plugin Center default config. This binding can be edited independently later.',
    wasmSchemaHint: 'Read the schema file from the plugin OCI image and generate this binding config form from it.',
    wasmYamlHint: 'Enter a YAML object. It will be parsed into this binding instance plugin_config.',
    wasmYamlPlaceholder: 'enabled: true\nkey: value',
    schemaPathHint: 'Defaults to schema.json inside the image. Override schema_path in Plugin Center if needed.',
    schemaLoadFailed: 'Failed to load image schema',
    schemaEmpty: 'No schema config exists in the image. Switch to YAML config to continue.',
    selectWasmBase: 'Select a Plugin Center default config.',
})

defineExpose({
    save(): Promise<void> {
        if (category.value === 'native' && configMode.value === 'custom') {
            return save()
        }
        if (category.value === 'ai') {
            return saveWasmBinding()
        }
        return Promise.resolve()
    }
})

function toSpecRecord(value: unknown): PluginSpecRecord {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as PluginSpecRecord
    }
    return {}
}

function toPluginConfigLite(value: unknown): PluginConfigLite | null {
    if (!value || typeof value !== 'object') return null
    const item = value as Record<string, unknown>
    if (typeof item.code !== 'string') return null
    if (item.kind !== 'anon' && item.kind !== 'named' && item.kind !== 'mono') return null
    const config: PluginConfigLite = {
        code: item.code,
        kind: item.kind,
        display_name: typeof item.display_name === 'string'
            ? item.display_name
            : item.display_name === null ? null : undefined,
        spec: toSpecRecord(item.spec),
    }
    if (item.kind === 'named') {
        if (typeof item.name !== 'string') return null
        config.name = item.name
    }
    if (item.kind === 'anon') {
        if (typeof item.uid !== 'string') return null
        config.uid = item.uid
    }
    return config
}

function toPluginConfigLiteList(value: unknown): PluginConfigLite[] {
    if (!Array.isArray(value)) return []
    return value.map(toPluginConfigLite).filter((item): item is PluginConfigLite => item !== null)
}

function pluginIdFromConfig(config: PluginConfigLite): Model.PluginInstanceId {
    if (config.kind === 'named') {
        return { code: config.code, kind: config.kind, name: config.name ?? '' }
    }
    if (config.kind === 'anon') {
        return { code: config.code, kind: config.kind, uid: config.uid ?? '' }
    }
    return { code: config.code, kind: config.kind }
}

function isWasmCode(pluginCode: string) {
    const c = pluginCode.toLowerCase()
    return c === 'wasm' || c.startsWith('wasm.') || c.startsWith('wasm-')
}

function displayNativeName(plugin: Model.PluginAttributes) {
    return nativePluginDisplayName(plugin)
}

function configPluginName(config: PluginConfigLite) {
    if (typeof config.display_name === 'string' && config.display_name.trim()) return config.display_name.trim()
    const spec = config.spec
    if (typeof spec.display_name === 'string' && spec.display_name.trim()) return spec.display_name.trim()
    if (typeof spec.plugin_name === 'string' && spec.plugin_name.trim()) {
        const catalog = AI_WASM_CATALOG.find((item) => item.id === spec.plugin_name)
        return catalog?.title ?? spec.plugin_name
    }
    return config.kind === 'named' ? config.name ?? config.code : config.code
}

function configDescription(config: PluginConfigLite) {
    if (typeof config.spec.description === 'string' && config.spec.description.trim()) return config.spec.description
    if (typeof config.spec.url === 'string' && config.spec.url.trim()) return config.spec.url
    return config.kind === 'named' ? `${config.code}.${config.name}` : config.code
}

const nativePluginOptions = computed<NativePluginOption[]>(() =>
    pluginAttrs.value
        .filter((item) => !isWasmCode(item.code))
        .map((item) => ({
            code: item.code,
            name: displayNativeName(item),
            description: item.meta.description ?? '',
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
)

const aiPluginOptions = computed<AiPluginOption[]>(() =>
    wasmPluginConfigs.value
        .filter((item) => item.kind === 'named' && isWasmCode(item.code) && item.spec.binding_scope === undefined)
        .map((item) => ({
            key: `${item.code}:${item.name ?? ''}`,
            code: item.code,
            configName: item.name ?? '',
            name: configPluginName(item),
            description: configDescription(item),
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
)

const selectedWasmBaseConfig = computed(() => {
    const option = aiPluginOptions.value.find((item) => item.key === aiSelectedKey.value)
    if (!option) return undefined
    return wasmPluginConfigs.value.find((item) => item.code === option.code && item.kind === 'named' && item.name === option.configName)
})
const hasWasmSchemaForm = computed(() => {
    const schema = wasmImageSchema.value
    return !!schema && Object.keys(schema.properties ?? {}).length > 0
})

const currentPluginHint = computed(() => category.value === 'native' ? texts.value.nativeHint : texts.value.aiHint)
const referenceIds = computed(() => {
    if (!code.value) return []
    return instances.value
        .map(pluginIdFromConfig)
        .filter((id) => id.kind === 'named')
})

const referenceConfigs = computed(() =>
    instances.value.filter((config) => config.kind === 'named')
)

function referenceConfigLabel(config: PluginConfigLite) {
    return pluginInstanceOptionLabel(config as Model.PluginConfig)
}

function pickNewName() {
    return code.value ? (code.value + '-' + randomUid()) : randomUid()
}

const newConfig = ref<PluginConfigLite>({
    code: '',
    kind: 'named',
    name: pickNewName(),
    display_name: null,
    spec: {},
})

async function refreshPluginInstancesList(pluginCode: string) {
    instances.value = toPluginConfigLiteList(unwrapResponse<unknown>(await Api.getConfigPluginsByCode(pluginCode)))
    if (isWasmCode(pluginCode)) {
        wasmPluginConfigs.value = instances.value
    }
}

async function refreshWasmPluginInstances() {
    const list = toPluginConfigLiteList(unwrapResponse<unknown>(await Api.getConfigPluginsByCode('wasm')))
    wasmPluginConfigs.value = list
    if (category.value === 'ai' && code.value === 'wasm') {
        instances.value = list
    }
}

function configByPluginId(id: Model.PluginInstanceId | undefined) {
    if (!id) return undefined
    return wasmPluginConfigs.value.find((item) => {
        if (item.code !== id.code || item.kind !== id.kind) return false
        if (id.kind === 'named') return item.name === id.name
        if (id.kind === 'anon') return item.uid === id.uid
        return true
    })
}

function defaultWasmBindingOwner() {
    return props.bindingName.trim() || props.bindingScope
}

function defaultWasmBindingName(option: AiPluginOption) {
    const owner = defaultWasmBindingOwner()
    const plugin = option.configName || option.name
    return stableWasmBindingId(props.bindingScope, owner, plugin)
}

function defaultWasmBindingDisplayName(option: AiPluginOption) {
    const owner = props.bindingName.trim() || props.bindingScope
    const plugin = option.configName || option.name
    return `${props.bindingScope} / ${owner} / ${plugin}`
}

const generatedWasmBindingName = computed(() => {
    const option = aiPluginOptions.value.find((item) => item.key === aiSelectedKey.value)
    if (!option) return ''
    if (existingWasmBinding.value?.kind === 'named') return existingWasmBinding.value.name ?? ''
    return defaultWasmBindingName(option)
})

const generatedWasmBindingDisplayName = computed(() => {
    const option = aiPluginOptions.value.find((item) => item.key === aiSelectedKey.value)
    if (!option) return ''
    const existingDisplayName = existingWasmBinding.value?.spec.binding_display_name
    if (typeof existingDisplayName === 'string' && existingDisplayName.trim()) return existingDisplayName.trim()
    return defaultWasmBindingDisplayName(option)
})

function hydrateWasmBinding(config: PluginConfigLite | undefined) {
    existingWasmBinding.value = config
    const spec = config?.spec ?? {}
    wasmConfigMode.value = (spec.binding_config_mode === 'xml' || spec.binding_config_mode === 'yaml' || spec.binding_config_mode === 'schema' || spec.binding_config_mode === 'default')
        ? spec.binding_config_mode
        : 'default'
    const pluginConfig = spec.plugin_config ?? spec.default_config
    if (wasmConfigMode.value === 'xml') {
        wasmYamlConfigText.value = typeof pluginConfig === 'string' ? pluginConfig : ''
        wasmSchemaConfig.value = {}
    } else if (wasmConfigMode.value === 'yaml') {
        wasmYamlConfigText.value = typeof pluginConfig === 'string'
            ? pluginConfig
            : stringifyYamlLike(pluginConfig ?? {})
        wasmSchemaConfig.value = {}
    } else if (wasmConfigMode.value === 'schema') {
        wasmSchemaConfig.value = toPlainObject(pluginConfig)
        wasmYamlConfigText.value = ''
    } else {
        wasmSchemaConfig.value = toPlainObject(pluginConfig)
        wasmYamlConfigText.value = ''
    }
}

function toPlainObject(value: unknown): Record<string, any> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return JSON.parse(JSON.stringify(value))
    }
    return {}
}

function stringifyYamlLike(value: unknown) {
    const object = toPlainObject(value)
    return Object.entries(object)
        .map(([key, next]) => `${key}: ${typeof next === 'string' ? next : JSON.stringify(next)}`)
        .join('\n')
}

async function loadSelectedWasmSchema() {
    const baseConfig = selectedWasmBaseConfig.value
    wasmImageSchema.value = undefined
    wasmSchemaError.value = ''
    if (!baseConfig || wasmConfigMode.value !== 'schema') return
    wasmSchemaLoading.value = true
    try {
        wasmImageSchema.value = await getSavedWasmPluginImageSchema(pluginIdFromConfig(baseConfig))
    } catch (e) {
        wasmSchemaError.value = e instanceof Error ? e.message : String(e)
    } finally {
        wasmSchemaLoading.value = false
    }
    if (wasmImageSchema.value) {
        await nextTick()
        schemaFormRef.value?.initDefaults(wasmImageSchema.value, wasmSchemaConfig.value)
    }
}

async function loadNativeAttr(pluginCode: string) {
    attr.value = undefined
    try {
        const response = await Api.pluginAttr(pluginCode);
        attr.value = unwrapResponse<Model.PluginAttributes | null>(response) ?? undefined;
    } catch {
        attr.value = undefined
    }
}

async function setCode(pluginCode: string | undefined, options: { resetModelValue?: boolean } = {}) {
    code.value = pluginCode
    if (options.resetModelValue !== false) {
        modelValue.value = undefined
    }
    instances.value = []
    attr.value = undefined
    if (!pluginCode) return
    newConfig.value.code = pluginCode
    newConfig.value.name = pickNewName()
    if (category.value === 'native') {
        await loadNativeAttr(pluginCode)
    }
    await refreshPluginInstancesList(pluginCode)
}

async function setAiPlugin(key: string | undefined, options: { keepExisting?: boolean } = {}) {
    if (wasmPluginConfigs.value.length === 0) {
        await refreshWasmPluginInstances()
    }
    aiSelectedKey.value = key
    const option = aiPluginOptions.value.find((item) => item.key === key)
    if (!option) {
        await setCode(undefined)
        return
    }
    await setCode(option.code, { resetModelValue: !options.keepExisting })
    if (!options.keepExisting) {
        existingWasmBinding.value = undefined
        wasmConfigMode.value = 'default'
        wasmSchemaConfig.value = toPlainObject(selectedWasmBaseConfig.value?.spec.plugin_config ?? selectedWasmBaseConfig.value?.spec.default_config ?? {})
        wasmYamlConfigText.value = stringifyYamlLike(selectedWasmBaseConfig.value?.spec.plugin_config ?? selectedWasmBaseConfig.value?.spec.default_config ?? {})
    }
    modelValue.value = {
        code: option.code,
        kind: 'named',
        name: option.configName,
    }
}

async function save() {
    if (code.value === undefined || formRef.value === null) return
    const spec = formRef.value.getJson();
    const id: Model.PluginInstanceId = {
        code: newConfig.value.code,
        kind: 'named',
        name: newConfig.value.name ?? pickNewName(),
    }
    await Api.postConfigPlugin({
        ...id,
        display_name: newConfig.value.display_name ?? null,
        spec
    } as Model.PluginConfig);
    await refreshPluginInstancesList(id.code);
    modelValue.value = id
    newConfig.value = {
        code: id.code,
        kind: 'named',
        name: pickNewName(),
        display_name: null,
        spec: {},
    }
}

async function saveWasmBinding() {
    const baseConfig = selectedWasmBaseConfig.value
    if (!baseConfig) {
        throw new Error(texts.value.selectWasmBase)
    }
    const configMode = wasmConfigMode.value
    const result = buildBoundWasmPluginConfig({
        baseConfig: baseConfig as Model.PluginConfig,
        existingConfig: existingWasmBinding.value as Model.PluginConfig | undefined,
        bindingName: generatedWasmBindingName.value,
        bindingOwner: defaultWasmBindingOwner(),
        bindingDisplayName: generatedWasmBindingDisplayName.value,
        bindingScope: props.bindingScope,
        configMode,
        schemaConfig: configMode === 'schema' ? wasmSchemaConfig.value : {},
        yamlConfig: configMode === 'yaml' || configMode === 'xml' ? wasmYamlConfigText.value : '',
    })
    const resultConfig = result.config as PluginConfigLite
    const existingConfig = existingWasmBinding.value ?? configByPluginId(pluginIdFromConfig(resultConfig))
    if (existingConfig) {
        await Api.putConfigPlugin(result.config)
    } else {
        await Api.postConfigPlugin(result.config)
    }
    await refreshWasmPluginInstances()
    existingWasmBinding.value = resultConfig
    modelValue.value = {
        code: result.config.code,
        kind: 'named',
        name: result.config.kind === 'named' ? result.config.name : '',
    }
}

watch(category, async () => {
    if (suppressCategoryReset.value) return
    const next = category.value === 'native'
        ? nativePluginOptions.value[0]?.code
        : undefined
    configMode.value = category.value === 'native' ? 'reference' : 'reference'
    if (category.value === 'ai') {
        await refreshWasmPluginInstances()
        await setAiPlugin(aiPluginOptions.value[0]?.key)
    } else {
        await setCode(next)
    }
})

watch([wasmConfigMode, selectedWasmBaseConfig], () => {
    void loadSelectedWasmSchema()
})

watch(modelValue, async (newValue) => {
    if (!newValue) return
    const nextCategory: PluginCategory = isWasmCode(newValue.code) ? 'ai' : 'native'
    if (nextCategory === 'ai') {
        if (wasmPluginConfigs.value.length === 0) {
            await refreshWasmPluginInstances()
        }
        const current = configByPluginId(newValue)
        const baseName = current?.spec.binding_base_plugin
        if (typeof baseName === 'string' && baseName.trim()) {
            aiSelectedKey.value = `${newValue.code}:${baseName}`
            hydrateWasmBinding(current)
        } else {
            aiSelectedKey.value = `${newValue.code}:${newValue.kind === 'named' ? newValue.name : ''}`
        }
    }
    if (category.value !== nextCategory) {
        suppressCategoryReset.value = true
        category.value = nextCategory
        await nextTick()
        suppressCategoryReset.value = false
    }
    if (code.value !== newValue.code) {
        code.value = newValue.code
        if (nextCategory === 'native') await loadNativeAttr(newValue.code)
        await refreshPluginInstancesList(newValue.code)
    }
})

async function hydrateInitialWasmValue() {
    const current = configByPluginId(modelValue.value)
    if (!current) return false
    const baseName = current.spec.binding_base_plugin
    if (typeof baseName === 'string' && baseName.trim()) {
        const baseKey = `${current.code}:${baseName}`
        await setAiPlugin(baseKey, { keepExisting: true })
        hydrateWasmBinding(current)
        return true
    }
    await setAiPlugin(`${current.code}:${current.kind === 'named' ? current.name ?? '' : ''}`)
    return true
}

onMounted(async () => {
    loading.value = true
    try {
        const [attrsResponse, configsResponse] = await Promise.all([
            Api.pluginAttrAll(),
            Api.getConfigPluginAll(),
        ])
        pluginAttrs.value = unwrapResponse<Model.PluginAttributes[]>(attrsResponse)
        pluginConfigs.value = toPluginConfigLiteList(unwrapResponse<unknown>(configsResponse))
        wasmPluginConfigs.value = pluginConfigs.value.filter((item) => isWasmCode(item.code))
    } catch {
        pluginAttrs.value = []
        pluginConfigs.value = []
    } finally {
        loading.value = false
    }
    const initialCode = modelValue.value?.code
    if (initialCode) {
        suppressCategoryReset.value = true
        category.value = isWasmCode(initialCode) ? 'ai' : 'native'
        await nextTick()
        suppressCategoryReset.value = false
        if (category.value === 'ai') {
            const hydrated = await hydrateInitialWasmValue()
            if (!hydrated) {
                await setAiPlugin(`${initialCode}:${modelValue.value?.kind === 'named' ? modelValue.value.name : ''}`)
            }
            return
        }
        await setCode(initialCode)
    } else {
        await setCode(nativePluginOptions.value[0]?.code)
    }
})
</script>

<template>
    <div class="plugin-select" v-loading="loading">
        <div class="plugin-select__section">
            <div class="plugin-select__section-title">{{ texts.pluginCategory }}</div>
            <el-segmented
                v-model="category"
                class="plugin-select__category"
                :options="[
                    { label: texts.native, value: 'native' },
                    { label: texts.ai, value: 'ai' },
                ]"
            />
            <div class="plugin-select__mode-hint">{{ currentPluginHint }}</div>
        </div>

        <el-form label-position="top" class="plugin-select__form">
            <el-form-item :label="texts.pluginType">
                <el-select
                    v-if="category === 'native'"
                    filterable
                    :model-value="code"
                    @update:model-value="(value: string) => setCode(value)"
                >
                    <el-option v-for="item in nativePluginOptions" :key="item.code" :label="item.name" :value="item.code">
                        <div class="plugin-select-option">
                            <strong>{{ item.name }}</strong>
                            <code>{{ item.code }}</code>
                        </div>
                    </el-option>
                </el-select>
                <el-select
                    v-else
                    filterable
                    :model-value="aiSelectedKey"
                    @update:model-value="(value: string) => setAiPlugin(value)"
                >
                    <el-option v-for="item in aiPluginOptions" :key="item.key" :label="item.name" :value="item.key">
                        <div class="plugin-select-option">
                            <strong>{{ item.name }}</strong>
                            <code>{{ item.code }}.{{ item.configName }}</code>
                        </div>
                    </el-option>
                </el-select>
            </el-form-item>

            <div v-if="category === 'native'" class="plugin-select__section">
                <div class="plugin-select__section-title">{{ texts.configMode }}</div>
                <el-segmented
                    v-model="configMode"
                    class="plugin-select__mode"
                    :options="[
                        { label: texts.referenceConfig, value: 'reference' },
                        { label: texts.customConfig, value: 'custom' },
                    ]"
                />
                <div class="plugin-select__mode-hint">
                    {{ configMode === 'reference' ? texts.referenceHint : texts.customHint }}
                </div>
            </div>

            <plugin-form ref="formRef" v-if="category === 'native' && configMode === 'custom' && attr" :attr="attr" v-model="newConfig" />
            <el-alert
                v-else-if="category === 'native' && configMode === 'custom'"
                type="info"
                :closable="false"
                :title="texts.selectPluginType"
                :description="texts.selectPluginTypeDesc"
            />
            <el-form-item v-else-if="category === 'native'" :label="texts.pluginConfig">
                <el-select filterable v-model="modelValue">
                    <el-option
                        v-for="item in referenceConfigs"
                        :key="keyPluginId(pluginIdFromConfig(item))"
                        :label="referenceConfigLabel(item)"
                        :value="pluginIdFromConfig(item)"
                    />
                </el-select>
                <div class="plugin-select__empty-hint" v-if="code && referenceIds.length === 0">
                    {{ texts.emptyConfig }}
                </div>
            </el-form-item>

            <section v-else class="plugin-select__section plugin-select__section--binding">
                <div class="plugin-select__section-title">{{ texts.wasmBinding }}</div>
                <el-form-item :label="texts.wasmBindingName">
                    <div class="plugin-select__readonly-name">
                        <code>wasm.{{ generatedWasmBindingName || '-' }}.json</code>
                    </div>
                    <div class="plugin-select__empty-hint">{{ texts.wasmBindingNameHint }}</div>
                </el-form-item>
                <div class="plugin-select__section-title">{{ texts.configMode }}</div>
                <el-segmented
                    v-model="wasmConfigMode"
                    class="plugin-select__mode"
                    :options="[
                        { label: texts.wasmDefaultMode, value: 'default' },
                        { label: texts.wasmSchemaMode, value: 'schema' },
                        { label: texts.wasmYamlMode, value: 'yaml' },
                    ]"
                />
                <div class="plugin-select__mode-hint">
                    {{ wasmConfigMode === 'yaml' || wasmConfigMode === 'xml' ? texts.wasmYamlHint : wasmConfigMode === 'schema' ? texts.wasmSchemaHint : texts.wasmDefaultHint }}
                </div>
                <div v-if="wasmConfigMode === 'schema'" class="plugin-select__schema">
                    <div class="plugin-select__empty-hint">{{ texts.schemaPathHint }}</div>
                    <el-skeleton v-if="wasmSchemaLoading" :rows="4" animated />
                    <SchemaForm
                        v-else-if="hasWasmSchemaForm"
                        ref="schemaFormRef"
                        :schema="wasmImageSchema!"
                        v-model="wasmSchemaConfig"
                    />
                    <el-alert
                        v-else-if="wasmImageSchema"
                        type="info"
                        :closable="false"
                        :title="texts.schemaEmpty"
                    />
                    <el-alert
                        v-else
                        type="warning"
                        :closable="false"
                        :title="texts.schemaLoadFailed"
                        :description="wasmSchemaError"
                    />
                </div>
                <el-input
                    v-else-if="wasmConfigMode === 'yaml' || wasmConfigMode === 'xml'"
                    v-model="wasmYamlConfigText"
                    type="textarea"
                    :rows="8"
                    :placeholder="texts.wasmYamlPlaceholder"
                    class="plugin-select__textarea"
                />
                <pre v-else class="plugin-select__preview">{{ JSON.stringify(selectedWasmBaseConfig?.spec.plugin_config ?? selectedWasmBaseConfig?.spec.default_config ?? {}, null, 2) }}</pre>
                <div class="plugin-select__empty-hint" v-if="category === 'ai' && aiPluginOptions.length === 0">
                    {{ texts.emptyAiConfig }}
                </div>
            </section>

            <el-alert
                v-if="!loading && nativePluginOptions.length === 0 && aiPluginOptions.length === 0"
                type="warning"
                :closable="false"
                :title="texts.loadFailed"
            />
        </el-form>
    </div>
</template>

<style scoped>
.plugin-select {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.plugin-select__section {
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f8fafc;
}

.plugin-select__section--binding {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.plugin-select__section-title {
    margin-bottom: 8px;
    color: #0f172a;
    font-size: 13px;
    font-weight: 650;
}

.plugin-select__category,
.plugin-select__mode {
    width: 100%;
}

.plugin-select__mode-hint,
.plugin-select__empty-hint {
    margin-top: 8px;
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
}

.plugin-select__readonly-name {
    min-height: 32px;
    display: flex;
    align-items: center;
    padding: 6px 10px;
    border: 1px solid #dbe3ef;
    border-radius: 6px;
    background: #fff;
}

.plugin-select__readonly-name code {
    color: #475569;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    word-break: break-all;
}

.plugin-select__form {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.plugin-select-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
}

.plugin-select-option strong {
    overflow: hidden;
    color: #111827;
    font-weight: 600;
    text-overflow: ellipsis;
}

.plugin-select-option code {
    flex-shrink: 0;
    padding: 1px 6px;
    border-radius: 5px;
    background: #eef2ff;
    color: #475569;
    font-size: 12px;
}

.plugin-select__textarea {
    width: 100%;
}

.plugin-select__schema {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.plugin-select__preview {
    max-height: 220px;
    margin: 0;
    padding: 12px;
    overflow: auto;
    border: 1px solid #dbe3ef;
    border-radius: 8px;
    background: #0f172a;
    color: #e2e8f0;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
}
</style>
