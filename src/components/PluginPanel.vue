<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { Api, Model } from 'spacegate-admin-client'
import { unwrapResponse, hashColor } from '../utils'
import { nativePluginDisplayName } from '../utils/pluginDisplay'
import { pluginInstanceDisplayName } from '../utils/pluginInstance'
import { Plus, Delete, Check, Edit, ArrowLeft, MoreFilled, Grid, Sunny } from '@element-plus/icons-vue'
import { PluginForm, ThirdPartyWasmDrawer } from '.';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n'
import {
    hasPluginInstanceRef,
    isWasmPluginCenterConfig,
    isWasmPluginCode,
    pluginConfigToInstanceRef,
    setPluginInstanceRefEnabled,
    sortWasmPluginCenterConfigs,
} from '../utils/wasmPlugin'

const { locale, t } = useI18n();

const emit = defineEmits<{
    changed: []
}>()

const props = defineProps<{
    gatewayName?: string
}>()

type PluginTab = 'native' | 'ai'

/** Wasm 扩展卡片：插件中心默认配置 + 当前网关启用状态 */
type AiPluginCard = {
    key: string
    title: string
    description: string
    instance: WasmPluginView
}

const WASM_PLUGIN_CODE = 'wasm'
type PluginSpecRecord = Record<string, unknown>
type PluginConfigLite = {
    code: string
    kind: 'anon' | 'named' | 'mono'
    uid?: string
    name?: string
    display_name?: string | null
    spec: PluginSpecRecord
}
type WasmPluginView = {
    code: string
    kind: 'anon' | 'named' | 'mono'
    uid?: string
    name?: string
    spec: PluginSpecRecord
    pluginName: string
    title: string
    description: string
    key: string
}

const activeTab = ref<PluginTab>('native')
const pluginAttrs = ref<Model.PluginAttributes[]>([]);
const wasmInstances = shallowRef<PluginConfigLite[]>([]);
const wasmInstanceViews = shallowRef<WasmPluginView[]>([]);
const wasmInstanceRawByKey = new Map<string, PluginConfigLite>();
const currentGateway = ref<Model.SgGateway | undefined>();
const gatewayLoading = ref(false);
const pluginsLoading = ref(true);
const pluginSearchText = ref('');

const code = ref<string | undefined>();
const attr = ref<Model.PluginAttributes | undefined>();
const instances = shallowRef<PluginConfigLite[] | undefined>();
const searchText = ref<string>('');
const formPluginConfig = ref<PluginConfigLite>({
    code: '',
    kind: 'named',
    name: '',
    spec: {},
});
const dialogVisible = ref(false);
const dialogTitle = ref('');
const dialogMode = ref<'create' | 'edit'>('create');
const formRef = ref<InstanceType<typeof PluginForm> | null>(null);
const texts = computed(() => locale.value.startsWith('zh') ? {
    homepage: '主页',
    repository: '仓库',
    pluginType: '插件类型',
    version: '版本',
    mono: '单例',
    yes: '是',
    no: '否',
    authors: '作者',
    description: '说明',
    searchConfigName: '搜索插件配置名称',
    emptyConfig: '暂无插件配置',
    pluginInstanceListTitle: '插件实例',
    pluginInstanceListDesc: '插件实例是一份可复用的插件配置。创建后可在 Gateway、Route、Rule 或 Backend 上绑定引用。',
    createPluginInstance: '创建插件实例',
    editPluginInstance: '编辑插件实例',
    pluginDrawerIntroTitle: '配置原生插件实例',
    pluginDrawerIntroDesc: '这里保存的是插件配置数据，不会立即改变流量处理链路。需要在资源上绑定该实例，并按需执行网关重载后生效。',
    aiGatewayOps: '管理自定义 Wasm 插件定义。开启后会绑定到当前网关，对经过该网关的请求全局生效。',
    addCustomWasm: '添加自定义插件',
    customWasmEmpty: '暂无自定义 Wasm 插件配置',
    globalEnabled: '当前网关启用',
    globalDisabled: '当前网关未启用',
    gatewayMissing: '请先在顶部选择网关，才能切换全局启用状态。',
    gatewayLoadFailed: '当前网关配置加载失败，无法切换全局插件。',
    gatewayUpdated: '网关插件绑定已更新，请执行全局重载后生效。',
    reloadRequired: 'Wasm 插件配置已更新。运行中的网关需要执行全局重载后才会重新创建插件实例。',
    goInstances: '前往实例运维',
    deleteConfirm: '确认删除这个插件配置？删除后已引用该配置的资源可能无法正常加载插件。',
    deleteTitle: '删除插件配置',
    deleteFailed: (message: string) => `插件配置删除失败：${message}`,
} : {
    homepage: 'Homepage',
    repository: 'Repository',
    pluginType: 'Plugin Type',
    version: 'Version',
    mono: 'Mono',
    yes: 'Yes',
    no: 'No',
    authors: 'Authors',
    description: 'Description',
    searchConfigName: 'Search configuration name',
    emptyConfig: 'No plugin configurations',
    pluginInstanceListTitle: 'Plugin Instances',
    pluginInstanceListDesc: 'A plugin instance is a reusable plugin configuration. After creation, bind it to Gateway, Route, Rule, or Backend.',
    createPluginInstance: 'Create Plugin Instance',
    editPluginInstance: 'Edit Plugin Instance',
    pluginDrawerIntroTitle: 'Configure Native Plugin Instance',
    pluginDrawerIntroDesc: 'This saves plugin configuration data only. Bind the instance to a resource and reload the gateway when needed.',
    aiGatewayOps: 'Manage custom Wasm plugin definitions. When enabled, the plugin is bound to the current gateway and applies globally.',
    addCustomWasm: 'Add Custom Plugin',
    customWasmEmpty: 'No custom Wasm plugin configurations',
    globalEnabled: 'Enabled on current gateway',
    globalDisabled: 'Disabled on current gateway',
    gatewayMissing: 'Select a gateway in the top bar before toggling global enablement.',
    gatewayLoadFailed: 'Failed to load current gateway config. Cannot toggle the global plugin.',
    gatewayUpdated: 'Gateway plugin binding updated. Run Global Reload to apply it.',
    reloadRequired: 'Wasm plugin configuration changed. Running gateways need Global Reload before plugin instances are recreated.',
    goInstances: 'Go to Instances',
    deleteConfirm: 'Delete this plugin configuration? Resources referencing it may fail to load the plugin.',
    deleteTitle: 'Delete Plugin Configuration',
    deleteFailed: (message: string) => `Plugin configuration delete failed: ${message}`,
})
const thirdPartyWasmVisible = ref(false);
const thirdPartyWasmInstance = ref<Model.PluginConfig | undefined>();
const wasmReloadNoticeVisible = ref(false);

const nativePluginAttrs = computed(() =>
    pluginAttrs.value.filter((item) => !isWasmPluginCode(item.code))
)
/** 从 spec 读取 Wasm 插件逻辑名（与 plugin/wasm.{name}.json 对应） */
function pluginNameFromSpec(spec: PluginSpecRecord): string {
    return typeof spec.plugin_name === 'string' ? spec.plugin_name.trim() : ''
}

function titleFromConfig(inst: PluginConfigLite, spec: PluginSpecRecord, pluginName: string): string {
    if (typeof inst.display_name === 'string' && inst.display_name.trim()) return inst.display_name.trim()
    if (typeof spec.display_name === 'string' && spec.display_name.trim()) return spec.display_name.trim()
    if (pluginName) return pluginName
    if (inst.kind === 'named') return inst.name
    return WASM_PLUGIN_CODE
}

function descriptionFromSpec(spec: PluginSpecRecord): string {
    if (typeof spec.description === 'string' && spec.description.trim()) return spec.description
    if (typeof spec.url === 'string' && spec.url.trim()) return spec.url
    return ''
}

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

function asPluginConfig(config: PluginConfigLite): Model.PluginConfig {
    return config as unknown as Model.PluginConfig
}

function toWasmPluginView(inst: PluginConfigLite): WasmPluginView {
    const spec = toSpecRecord(inst.spec)
    const pluginName = pluginNameFromSpec(spec)
    const title = titleFromConfig(inst, spec, pluginName)
    const description = descriptionFromSpec(spec)
    const name = inst.kind === 'named' ? inst.name : undefined
    const uid = inst.kind === 'anon' ? inst.uid : undefined
    const key = name ? `${inst.code}:${name}` : `${inst.code}:${inst.kind}:${uid ?? ''}:${JSON.stringify(spec)}`
    return {
        code: inst.code,
        kind: inst.kind,
        name,
        uid,
        spec,
        pluginName,
        title,
        description,
        key,
    }
}

function syncWasmInstanceViews(list: PluginConfigLite[]) {
    wasmInstanceRawByKey.clear()
    wasmInstanceViews.value = list.map((inst) => {
        const view = toWasmPluginView(inst)
        wasmInstanceRawByKey.set(view.key, inst)
        return view
    })
}

function rawWasmInstance(view: WasmPluginView): PluginConfigLite | undefined {
    return wasmInstanceRawByKey.get(view.key)
}

/** 只展示插件中心定义；路由/网关/后端绑定生成的 binding config 不进入卡片列表。 */
const aiPluginCards = computed((): AiPluginCard[] => {
    return sortWasmPluginCenterConfigs(
        wasmInstances.value.filter((inst) => isWasmPluginCenterConfig(inst))
    ).map((inst) => {
        const view = toWasmPluginView(inst)
        return {
            key: view.key,
            title: view.title,
            description: view.description || t('hint.wasmInstance'),
            instance: view,
        }
    })
})

const filteredNativePlugins = computed(() => filterBySearch(nativePluginAttrs.value))
const filteredAiCards = computed(() => {
    const q = pluginSearchText.value.trim().toLowerCase()
    if (!q) return aiPluginCards.value
    return aiPluginCards.value.filter(
        (c) =>
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
    )
})

function filterBySearch(list: Model.PluginAttributes[]) {
    const q = pluginSearchText.value.trim().toLowerCase()
    if (!q) return list
    return list.filter((item) => {
        const desc = item.meta.description?.toLowerCase() ?? ''
        return item.code.toLowerCase().includes(q) || desc.includes(q)
    })
}

function pluginDescription(item: Model.PluginAttributes): string {
    if (item.meta.description?.trim()) {
        return item.meta.description
    }
    if (item.mono) {
        return t('hint.pluginMono')
    }
    return item.code
}

function pluginDisplayName(item: Model.PluginAttributes): string {
    return nativePluginDisplayName(item)
}

function iconStyle(pluginCode: string) {
    return { backgroundColor: hashColor(pluginCode, 'light') }
}

function aiIconStyle(title: string) {
    return { backgroundColor: hashColor(title, 'light') }
}

async function loadWasmInstances() {
    try {
        wasmInstances.value = toPluginConfigLiteList(unwrapResponse<unknown>(
            await Api.getConfigPluginsByCode(WASM_PLUGIN_CODE)
        ))
    } catch {
        wasmInstances.value = []
    }
    syncWasmInstanceViews(wasmInstances.value)
}

async function loadCurrentGateway() {
    const gatewayName = props.gatewayName?.trim()
    currentGateway.value = undefined
    if (!gatewayName) return
    gatewayLoading.value = true
    try {
        currentGateway.value = unwrapResponse<Model.SgGateway>(await Api.getConfigItemGateway(gatewayName))
    } catch {
        currentGateway.value = undefined
    } finally {
        gatewayLoading.value = false
    }
}

onMounted(async () => {
    try {
        const response = await Api.pluginAttrAll();
        pluginAttrs.value = unwrapResponse<Model.PluginAttributes[]>(response);
    } catch {
        const list = unwrapResponse<string[]>(await Api.pluginList());
        const attrs = await Promise.all(
            list.map(async (pluginCode) => {
                const resp = await Api.pluginAttr(pluginCode);
                return unwrapResponse<Model.PluginAttributes | null>(resp);
            })
        );
        pluginAttrs.value = attrs.filter((a): a is Model.PluginAttributes => a != null);
    } finally {
        await loadWasmInstances()
        await loadCurrentGateway()
        pluginsLoading.value = false;
    }
});

watch(() => props.gatewayName, () => {
    void loadCurrentGateway()
})

async function selectNativePlugin(pluginCode: string) {
    code.value = pluginCode;
}

/** 配置 Wasm 扩展：进入插件定义编辑抽屉 */
async function configureAiCard(card: AiPluginCard) {
    editCustomWasmView(card.instance)
}

function cardPluginRef(card: AiPluginCard): Model.PluginInstanceId | undefined {
    const raw = rawWasmInstance(card.instance)
    return raw ? pluginConfigToInstanceRef(raw) : undefined
}

function isCardEnabledOnGateway(card: AiPluginCard) {
    const ref = cardPluginRef(card)
    if (!ref) return false
    return hasPluginInstanceRef(currentGateway.value?.plugins, ref)
}

async function setCardEnabledOnGateway(card: AiPluginCard, enabled: boolean) {
    const gatewayName = props.gatewayName?.trim()
    if (!gatewayName) {
        ElMessage.warning(texts.value.gatewayMissing)
        return
    }
    const ref = cardPluginRef(card)
    if (!ref) return
    if (!currentGateway.value) {
        await loadCurrentGateway()
    }
    if (!currentGateway.value) {
        ElMessage.error(texts.value.gatewayLoadFailed)
        return
    }
    const nextGateway = {
        ...currentGateway.value,
        plugins: setPluginInstanceRefEnabled(currentGateway.value.plugins, ref, enabled),
    }
    try {
        await Api.putConfigItemGateway(gatewayName, nextGateway)
        currentGateway.value = nextGateway
        wasmReloadNoticeVisible.value = true
        ElMessage.success(texts.value.gatewayUpdated)
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e)
        ElMessage.error(message)
    }
}

function openCreateCustomWasm() {
    thirdPartyWasmInstance.value = undefined
    thirdPartyWasmVisible.value = true
}

function editCustomWasm(instance: Model.PluginConfig) {
    thirdPartyWasmInstance.value = instance
    thirdPartyWasmVisible.value = true
}

function editCustomWasmView(instance: WasmPluginView) {
    const raw = rawWasmInstance(instance)
    if (raw) editCustomWasm(asPluginConfig(raw))
}

function deleteCustomWasmView(instance: WasmPluginView) {
    const raw = rawWasmInstance(instance)
    if (raw) deleteCustomWasmInstance(asPluginConfig(raw))
}

function backToPluginList() {
    code.value = undefined;
    attr.value = undefined;
    instances.value = undefined;
}

const refreshPluginInstancesList = async (pluginCode: string) => {
    instances.value = toPluginConfigLiteList(unwrapResponse<unknown>(await Api.getConfigPluginsByCode(pluginCode)))
    if (pluginCode === WASM_PLUGIN_CODE) {
        await loadWasmInstances()
    }
}

function matchesInstanceSearch(instance: PluginConfigLite): boolean {
    if (instance.kind !== 'named') return false
    if (!searchText.value) return true
    return instance.name.includes(searchText.value)
        || pluginInstanceDisplayName(asPluginConfig(instance)).includes(searchText.value)
}

watch(code, async (pluginCode) => {
    if (!pluginCode) return;
    attr.value = undefined;
    const cached = pluginAttrs.value.find((p) => p.code === pluginCode);
    if (cached) {
        attr.value = cached;
    } else {
        const response = await Api.pluginAttr(pluginCode);
        attr.value = unwrapResponse<Model.PluginAttributes>(response);
    }
    await refreshPluginInstancesList(pluginCode)
})

watch(activeTab, () => {
    pluginSearchText.value = ''
})

const openCreateDialog = () => {
    if (attr.value !== undefined) {
        if (attr.value.mono) {
            formPluginConfig.value = {
                code: attr.value.code,
                kind: 'mono',
                display_name: null,
                spec: {},
            }
        } else {
            formPluginConfig.value = {
                code: attr.value.code,
                kind: 'named',
                name: 'new-instance',
                display_name: null,
                spec: {},
            }
        }
    }
    dialogMode.value = 'create';
    dialogTitle.value = texts.value.createPluginInstance;
    dialogVisible.value = true;
}
const closeDialog = async (action: 'save' | 'cancel') => {
    if (action === 'save') {
        try {
            if (formRef.value) {
                const errors = formRef.value.validate?.() ?? []
                if (errors.length) {
                    ElMessage.warning(t('hint.requiredFieldsMissing'))
                    return
                }
            }
            await savePlugin();
            dialogVisible.value = false;
            await refreshPluginInstancesList(code.value!);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            ElMessage.error(message);
        }
    } else {
        dialogVisible.value = false;
    }
}

const savePlugin = async () => {
    if (dialogMode.value === 'create') {
        await createPlugin();
    } else {
        await updatePlugin();
    }
}
const editInstance = async (instance: PluginConfigLite) => {
    dialogMode.value = 'edit';
    dialogTitle.value = texts.value.editPluginInstance;
    formPluginConfig.value = { ...instance, spec: { ...instance.spec } };
    dialogVisible.value = true;
}
const deleteInstance = async (instance: PluginConfigLite) => {
    try {
        await ElMessageBox.confirm(texts.value.deleteConfirm, texts.value.deleteTitle, {
            confirmButtonText: t('button.delete'),
            cancelButtonText: t('button.cancel'),
            type: 'warning',
        });
    } catch {
        return
    }
    try {
        await Api.deleteConfigPlugin(asPluginConfig(instance));
        await refreshPluginInstancesList(code.value!);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e)
        ElMessage.error(texts.value.deleteFailed(message))
    }
}

const deleteCustomWasmInstance = async (instance: Model.PluginConfig) => {
    try {
        await ElMessageBox.confirm(texts.value.deleteConfirm, texts.value.deleteTitle, {
            confirmButtonText: t('button.delete'),
            cancelButtonText: t('button.cancel'),
            type: 'warning',
        });
    } catch {
        return
    }
    try {
        await Api.deleteConfigPlugin(instance);
        wasmReloadNoticeVisible.value = true
        await loadWasmInstances();
        emit('changed')
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e)
        ElMessage.error(texts.value.deleteFailed(message))
    }
}
const createPlugin = async () => {
    if (formRef.value === null) {
        return;
    }
    const config = <PluginConfigLite>{
        ...formPluginConfig.value,
        spec: formRef.value.getJson(),
    }
    await Api.postConfigPlugin(asPluginConfig(config));
    emit('changed')
}
const updatePlugin = async () => {
    if (formRef.value === null) {
        return;
    }
    const config = <PluginConfigLite>{
        ...formPluginConfig.value,
        spec: formRef.value.getJson(),
    }
    await Api.putConfigPlugin(asPluginConfig(config));
    emit('changed')
}

async function onCardMenu(command: string, item: Model.PluginAttributes) {
    if (command === 'homepage' && item.meta.homepage) {
        window.open(item.meta.homepage, '_blank');
    } else if (command === 'repository' && item.meta.repository) {
        window.open(item.meta.repository, '_blank');
    }
}

async function onThirdPartyWasmSaved() {
    wasmReloadNoticeVisible.value = true
    await loadWasmInstances()
    emit('changed')
}

function goInstances() {
    window.location.assign('/instances')
}
</script>

<template>
    <!-- 插件卡片列表（Tab） -->
    <div v-if="!code" class="plugin-panel">
        <el-tabs v-model="activeTab" class="plugin-panel__tabs">
            <el-tab-pane :label="t('tab.nativePlugin')" name="native" />
            <el-tab-pane :label="t('tab.aiPlugin')" name="ai" />
        </el-tabs>

        <el-input
            v-model="pluginSearchText"
            class="plugin-panel__search"
            clearable
            :placeholder="t('hint.searchPlugin')"
        />

        <!-- 原生插件 -->
        <div
            v-if="activeTab === 'native'"
            v-loading="pluginsLoading"
            class="plugin-panel__grid"
        >
            <div
                v-for="item in filteredNativePlugins"
                :key="item.code"
                class="plugin-card"
            >
                <div class="plugin-card__header">
                    <div class="plugin-card__icon" :style="iconStyle(item.code)">
                        <el-icon :size="22" color="#e67e22">
                            <Grid />
                        </el-icon>
                    </div>
                    <div class="plugin-card__title-wrap">
                        <div class="plugin-card__title">{{ pluginDisplayName(item) }}</div>
                        <div class="plugin-card__code">{{ item.code }}</div>
                        <div v-if="item.meta.version" class="plugin-card__version">
                            v{{ item.meta.version }}
                        </div>
                    </div>
                    <el-dropdown
                        v-if="item.meta.homepage || item.meta.repository"
                        trigger="click"
                        @command="(cmd: string) => onCardMenu(cmd, item)"
                    >
                        <el-button class="plugin-card__more" :icon="MoreFilled" text circle />
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item v-if="item.meta.homepage" command="homepage">
                                    {{ texts.homepage }}
                                </el-dropdown-item>
                                <el-dropdown-item v-if="item.meta.repository" command="repository">
                                    {{ texts.repository }}
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
                <div class="plugin-card__body">
                    {{ pluginDescription(item) }}
                </div>
                <button type="button" class="plugin-card__footer" @click="selectNativePlugin(item.code)">
                    {{ t('title.setting') }}
                </button>
            </div>
            <el-empty v-if="!pluginsLoading && filteredNativePlugins.length === 0" />
        </div>

        <!-- Wasm 扩展 -->
        <div
            v-else
            v-loading="pluginsLoading"
            class="plugin-panel__ai"
        >
            <el-alert
                v-if="wasmReloadNoticeVisible"
                type="warning"
                show-icon
                :closable="true"
                :title="texts.reloadRequired"
                class="plugin-panel__reload-alert"
                @close="wasmReloadNoticeVisible = false"
            >
                <template #default>
                    <el-button size="small" type="warning" plain @click="goInstances">
                        {{ texts.goInstances }}
                    </el-button>
                </template>
            </el-alert>

            <section class="plugin-panel__section">
                <div class="plugin-panel__section-header">
                    <div>
                        <h3>Wasm 扩展</h3>
                        <p>{{ texts.aiGatewayOps }}</p>
                    </div>
                    <el-button :icon="Plus" type="primary" @click="openCreateCustomWasm">
                        {{ texts.addCustomWasm }}
                    </el-button>
                </div>
                <div class="plugin-panel__grid">
                    <div
                        v-for="card in filteredAiCards"
                        :key="card.key"
                        class="plugin-card plugin-card--ai"
                    >
                        <div class="plugin-card__header">
                            <div class="plugin-card__icon" :style="aiIconStyle(card.title)">
                                <el-icon :size="22" color="#f5a623">
                                    <Sunny />
                                </el-icon>
                            </div>
                            <div class="plugin-card__title-wrap">
                                <div class="plugin-card__title">{{ card.title }}</div>
                                <div class="plugin-card__badge">{{ t('hint.deployed') }}</div>
                            </div>
                        </div>
                        <div class="plugin-card__body">
                            {{ card.description }}
                        </div>
                        <div class="plugin-card__actions">
                            <div class="plugin-card__switch">
                                <el-switch
                                    :model-value="isCardEnabledOnGateway(card)"
                                    :loading="gatewayLoading"
                                    @change="(value: boolean | string | number) => setCardEnabledOnGateway(card, Boolean(value))"
                                />
                                <span>{{ isCardEnabledOnGateway(card) ? texts.globalEnabled : texts.globalDisabled }}</span>
                            </div>
                            <div>
                                <el-button size="small" :icon="Edit" link type="primary" @click="configureAiCard(card)">
                                    {{ t('button.edit') }}
                                </el-button>
                                <el-button size="small" :icon="Delete" link type="danger" @click="deleteCustomWasmView(card.instance)">
                                    {{ t('button.delete') }}
                                </el-button>
                            </div>
                        </div>
                    </div>
                    <el-empty v-if="!pluginsLoading && filteredAiCards.length === 0" :description="texts.customWasmEmpty" />
                </div>
            </section>
        </div>
        <third-party-wasm-drawer
            v-model="thirdPartyWasmVisible"
            :instance="thirdPartyWasmInstance"
            @saved="onThirdPartyWasmSaved"
        />
    </div>

    <!-- 选中插件后的配置详情 -->
    <div v-else class="plugin-detail">
        <div class="plugin-detail__toolbar">
            <el-button :icon="ArrowLeft" @click="backToPluginList">{{ t('button.back') }}</el-button>
            <span class="plugin-detail__code">{{ code }}</span>
        </div>
        <el-descriptions v-if="attr" border class="plugin-detail__meta">
            <el-descriptions-item :label="texts.pluginType">{{ attr.code }}</el-descriptions-item>
            <el-descriptions-item :label="texts.version">{{ attr.meta.version }}</el-descriptions-item>
            <el-descriptions-item :label="texts.mono">
                {{ attr.mono ? texts.yes : texts.no }}
            </el-descriptions-item>
            <el-descriptions-item :label="texts.authors">{{ attr.meta.authors }}</el-descriptions-item>
            <el-descriptions-item :label="texts.homepage">
                <el-link v-if="attr.meta.homepage" :href="attr.meta.homepage" target="_blank">{{ attr.meta.homepage
                    }}</el-link>
            </el-descriptions-item>
            <el-descriptions-item :label="texts.repository">
                <el-link v-if="attr.meta.repository" :href="attr.meta.repository" target="_blank">{{ attr.meta.repository
                    }}</el-link>
            </el-descriptions-item>
            <el-descriptions-item :label="texts.description">{{ attr.meta.description }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="attr !== undefined && attr.mono" />

        <div v-if="attr !== undefined && !attr.mono && instances !== undefined">
            <div class="plugin-detail__actions">
                <el-input v-model="searchText" :placeholder="texts.searchConfigName"></el-input>
                <el-button :icon="Plus" type="primary" @click="openCreateDialog">{{ texts.createPluginInstance }}</el-button>
            </div>
            <div class="plugin-detail__instance-intro">
                <strong>{{ texts.pluginInstanceListTitle }}</strong>
                <span>{{ texts.pluginInstanceListDesc }}</span>
            </div>
            <div class="plugin-instance-list">
                <div v-for="instance in instances.filter(matchesInstanceSearch)" :key="instance.kind === 'named' ? instance.name : ''"
                    class="plugin-instance-row">
                    <div>
                        <strong>{{ pluginInstanceDisplayName(asPluginConfig(instance)) }}</strong>
                        <span>{{ instance.code }} / {{ instance.kind }}</span>
                    </div>
                    <div class="plugin-instance-row__actions">
                        <el-button size="small" :icon="Edit" link type="primary"
                            @click="() => editInstance(instance)">{{ t('button.edit') }}</el-button>
                        <el-button size="small" :icon="Delete" link type="danger"
                            @click="() => deleteInstance(instance)">{{ t('button.delete') }}</el-button>
                    </div>
                </div>
                <el-empty v-if="instances.filter(matchesInstanceSearch).length === 0" :description="texts.emptyConfig" />
            </div>
            <el-drawer v-model="dialogVisible" size="72%" class="plugin-config-drawer" destroy-on-close>
                <template #header>
                    <div class="plugin-config-drawer__title">
                        <code>{{ attr.code }}</code>
                        <span>{{ dialogTitle }}</span>
                    </div>
                </template>

                <div class="plugin-config-drawer__body">
                    <el-alert
                        type="info"
                        :closable="false"
                        :title="texts.pluginDrawerIntroTitle"
                        :description="texts.pluginDrawerIntroDesc"
                        class="plugin-config-drawer__intro"
                    />
                    <el-card shadow="never" class="plugin-config-drawer__card">
                        <plugin-form ref="formRef" :attr="attr" v-model="formPluginConfig"></plugin-form>
                    </el-card>
                </div>

                <template #footer>
                    <el-button @click="() => closeDialog('cancel')">{{ t('button.cancel') }}</el-button>
                    <el-button :icon="Check" type="primary" @click="() => closeDialog('save')">{{ t('button.save') }}</el-button>
                </template>
            </el-drawer>
        </div>
    </div>
</template>

<style scoped lang="scss">
.plugin-panel__tabs {
    margin-bottom: 12px;
}

.plugin-panel__search {
    max-width: 360px;
    margin-bottom: 16px;
}

.plugin-panel__ai,
.plugin-panel__section {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.plugin-panel__reload-alert {
    margin-bottom: 2px;
}

.plugin-panel__section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
}

.plugin-panel__section-header h3 {
    margin: 0;
    color: #0f172a;
    font-size: 15px;
    font-weight: 650;
}

.plugin-panel__section-header p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
}

.plugin-panel__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    min-height: 120px;
}

@media (max-width: 1400px) {
    .plugin-panel__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 1024px) {
    .plugin-panel__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .plugin-panel__grid {
        grid-template-columns: 1fr;
    }

    .plugin-panel__section-header {
        flex-direction: column;
    }
}

.plugin-card {
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    overflow: hidden;
    transition: box-shadow 0.2s ease;

    &:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }
}

.plugin-card__header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 14px 8px;
}

.plugin-card__icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.plugin-card__title-wrap {
    flex: 1;
    min-width: 0;
}

.plugin-card__title {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
    word-break: break-all;
}

.plugin-card__code {
    margin-top: 2px;
    color: #64748b;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
}

.plugin-card__version {
    margin-top: 2px;
    font-size: 12px;
    color: #999;
}

.plugin-card__badge {
    margin-top: 4px;
    display: inline-block;
    font-size: 11px;
    color: #67c23a;
    background: #f0f9eb;
    padding: 0 6px;
    border-radius: 4px;
}

.plugin-card__more {
    flex-shrink: 0;
}

.plugin-card__body {
    flex: 1;
    padding: 0 14px 12px;
    font-size: 13px;
    line-height: 1.5;
    color: #666;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 58px;
}

.plugin-card__footer {
    width: 100%;
    padding: 10px;
    border: none;
    border-top: 1px solid #e5e5e5;
    background-color: #fafafa;
    font-size: 14px;
    color: #1a1a1a;
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
        background-color: #f0f0f0;
    }
}

.plugin-card__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    border-top: 1px solid #e5e5e5;
    background: #fafafa;
}

.plugin-card__switch {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: #64748b;
    font-size: 12px;
}

.plugin-detail__toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.plugin-detail__code {
    font-size: 16px;
    font-weight: 600;
}

.plugin-detail__meta {
    margin-bottom: 16px;
}

.plugin-detail__actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;

    .el-input {
        max-width: 320px;
    }
}

.plugin-detail__instance-intro {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 12px;
    padding: 12px 14px;
    border: 1px solid #dbe3ef;
    border-radius: 8px;
    background: #f8fafc;
}

.plugin-detail__instance-intro strong {
    color: #0f172a;
    font-size: 14px;
}

.plugin-detail__instance-intro span {
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
}

.plugin-instance-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.plugin-instance-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
}

.plugin-instance-row strong {
    display: block;
    color: #0f172a;
    font-size: 14px;
}

.plugin-instance-row span {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 12px;
}

.plugin-instance-row__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
}

.plugin-config-drawer__title {
    display: inline-flex;
    align-items: center;
    gap: 10px;
}

.plugin-config-drawer__title code {
    padding: 3px 8px;
    border: 1px solid #dbe3ef;
    border-radius: 6px;
    color: #0f766e;
    background: #ecfdf5;
    font-size: 12px;
}

.plugin-config-drawer__title span {
    display: block;
    color: #0f172a;
    font-size: 16px;
    font-weight: 650;
}

.plugin-config-drawer__body {
    min-height: 420px;
}

.plugin-config-drawer__intro {
    margin-bottom: 12px;
}

.plugin-config-drawer__card {
    border-radius: 8px;
}

:deep(.plugin-config-drawer .el-drawer__footer) {
    border-top: 1px solid #e5e7eb;
}
</style>
