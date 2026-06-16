<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Api, Model } from 'spacegate-admin-client'
import { unwrapResponse, hashColor } from '../utils'
import { Plus, Delete, Check, Edit, ArrowLeft, MoreFilled, Grid, Sunny } from '@element-plus/icons-vue'
import { AiGatewayQueueDrawer, PluginForm, ThirdPartyWasmDrawer } from '.';
import { PluginConfig } from 'spacegate-admin-client/dist/model';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n'
import { AI_WASM_CATALOG, type AiWasmCatalogItem } from '../constants/aiWasmCatalog'

const { locale, t } = useI18n();

type PluginTab = 'native' | 'ai'

/** AI 卡片：目录项 + 可选已部署实例 */
type AiPluginCard = {
    key: string
    title: string
    description: string
    catalog?: AiWasmCatalogItem
    instance?: Model.PluginConfig
}

const WASM_PLUGIN_CODE = 'wasm'

const activeTab = ref<PluginTab>('native')
const pluginAttrs = ref<Model.PluginAttributes[]>([]);
const wasmInstances = ref<Model.PluginConfig[]>([]);
const pluginsLoading = ref(true);
const pluginSearchText = ref('');

const code = ref<string | undefined>();
const attr = ref<Model.PluginAttributes | undefined>();
const instances = ref<Model.PluginConfig[]>();
const searchText = ref<string>('');
const formPluginConfig = ref<PluginConfig>({
    code: '',
    kind: 'named',
    name: '',
    spec: {},
});
const dialogVisible = ref(false);
const dialogTitle = ref('');
const dialogMode = ref<'create' | 'edit'>('create');
const formRef = ref<InstanceType<typeof PluginForm>>(null);
const aiGatewayQueueVisible = ref(false);
const aiGatewayQueueInstance = ref<Model.PluginConfig | undefined>();
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
    customWasmTitle: '自定义 Wasm 插件',
    customWasmDesc: '按 Higress WasmPlugin 模型添加外部 proxy-wasm 插件。保存后需要在资源上绑定插件，并执行全局重载后生效。',
    aiGatewayOps: '围绕 AI 请求的治理能力，包括排队限流、模型代理、安全和观测扩展。',
    addCustomWasm: '添加自定义插件',
    customWasmEmpty: '暂无自定义 Wasm 插件配置',
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
    customWasmTitle: 'Custom Wasm Plugins',
    customWasmDesc: 'Add external proxy-wasm plugins using the Higress WasmPlugin model. Bind the plugin to a resource and run Global Reload to apply it.',
    aiGatewayOps: 'Governance capabilities for AI traffic, including queueing, rate limiting, model proxy, security, and observability extensions.',
    addCustomWasm: 'Add Custom Plugin',
    customWasmEmpty: 'No custom Wasm plugin configurations',
    reloadRequired: 'Wasm plugin configuration changed. Running gateways need Global Reload before plugin instances are recreated.',
    goInstances: 'Go to Instances',
    deleteConfirm: 'Delete this plugin configuration? Resources referencing it may fail to load the plugin.',
    deleteTitle: 'Delete Plugin Configuration',
    deleteFailed: (message: string) => `Plugin configuration delete failed: ${message}`,
})
const thirdPartyWasmVisible = ref(false);
const thirdPartyWasmInstance = ref<Model.PluginConfig | undefined>();
const wasmReloadNoticeVisible = ref(false);

/** 是否为 Wasm 类插件 code（归入 AI Tab） */
function isWasmPluginCode(pluginCode: string): boolean {
    const c = pluginCode.toLowerCase()
    return c === WASM_PLUGIN_CODE || c.startsWith('wasm.') || c.startsWith('wasm-')
}

const nativePluginAttrs = computed(() =>
    pluginAttrs.value.filter((item) => !isWasmPluginCode(item.code))
)

/** 从 spec 读取 Wasm 插件逻辑名（与 plugin/wasm.{name}.json 对应） */
function instancePluginName(inst: Model.PluginConfig): string {
    const spec = inst.spec as Record<string, unknown> | null
    return typeof spec?.plugin_name === 'string' ? spec.plugin_name.trim() : ''
}

function instanceTitle(inst: Model.PluginConfig): string {
    const spec = inst.spec as Record<string, unknown> | null
    if (typeof spec?.display_name === 'string' && spec.display_name.trim()) return spec.display_name.trim()
    const fromSpec = instancePluginName(inst)
    if (fromSpec) return fromSpec
    if (inst.kind === 'named') return inst.name
    return WASM_PLUGIN_CODE
}

/** 目录项与已部署 wasm 实例是否同一插件 */
function instanceMatchesCatalog(inst: Model.PluginConfig, catalog: AiWasmCatalogItem): boolean {
    const pluginName = instancePluginName(inst)
    if (pluginName && pluginName === catalog.id) return true
    if (inst.kind === 'named' && inst.name === catalog.id) return true
    const title = instanceTitle(inst)
    return title === catalog.title || title === catalog.id
}

function isAiGatewayQueueCard(card: AiPluginCard): boolean {
    if (card.catalog?.id === 'ai-gateway-queue' || card.key === 'ai-gateway-queue') return true
    const inst = card.instance
    return !!inst && instancePluginName(inst) === 'ai-gateway-queue'
}

/** 合并目录与已配置的 wasm 实例为 AI 卡片列表 */
const aiPluginCards = computed((): AiPluginCard[] => {
    const usedInstanceKeys = new Set<string>()
    const cards: AiPluginCard[] = []

    for (const catalog of AI_WASM_CATALOG.filter((item) => item.kind !== 'generic')) {
        const instance = catalog.kind === 'generic'
            ? undefined
            : wasmInstances.value.find((inst) => instanceMatchesCatalog(inst, catalog))
        if (instance) {
            usedInstanceKeys.add(instance.kind === 'named' ? instKey(instance) : JSON.stringify(instance))
        }
        cards.push({
            key: catalog.id,
            title: catalog.title,
            description: catalog.description,
            catalog,
            instance,
        })
    }

    for (const inst of wasmInstances.value) {
        const key = inst.kind === 'named' ? instKey(inst) : JSON.stringify(inst)
        if (usedInstanceKeys.has(key)) continue
        // 已在目录中的 plugin_name 不再重复展示（避免 wasm.json 等错误文件名导致双卡片）
        const pluginName = instancePluginName(inst)
        if (pluginName && AI_WASM_CATALOG.some((c) => c.id === pluginName)) continue
        const spec = inst.spec as Record<string, unknown> | null
        const title = instanceTitle(inst)
        const desc =
            typeof spec?.description === 'string' && spec.description
                ? spec.description
                : typeof spec?.url === 'string' && spec.url
                  ? String(spec.url)
                  : t('hint.wasmInstance')
        cards.push({
            key,
            title,
            description: desc,
            instance: inst,
        })
    }

    return cards
})

function instKey(inst: Model.PluginConfig & { kind: 'named' }) {
    return `${inst.code}:${inst.name}`
}

const filteredNativePlugins = computed(() => filterBySearch(nativePluginAttrs.value))
const customWasmInstances = computed(() =>
    wasmInstances.value.filter((inst) => {
        return !AI_WASM_CATALOG.some((catalog) => catalog.kind !== 'generic' && instanceMatchesCatalog(inst, catalog))
    })
)
const filteredAiCards = computed(() => {
    const q = pluginSearchText.value.trim().toLowerCase()
    if (!q) return aiPluginCards.value
    return aiPluginCards.value.filter(
        (c) =>
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
    )
})
const filteredCustomWasmInstances = computed(() => {
    const q = pluginSearchText.value.trim().toLowerCase()
    if (!q) return customWasmInstances.value
    return customWasmInstances.value.filter((inst) => {
        const spec = inst.spec as Record<string, unknown> | null
        const description = typeof spec?.description === 'string' ? spec.description : ''
        return instanceTitle(inst).toLowerCase().includes(q) || description.toLowerCase().includes(q)
    })
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

function iconStyle(pluginCode: string) {
    return { backgroundColor: hashColor(pluginCode, 'light') }
}

function aiIconStyle(title: string) {
    return { backgroundColor: hashColor(title, 'light') }
}

function customWasmDescription(instance: Model.PluginConfig) {
    const spec = instance.spec as Record<string, unknown> | null
    if (typeof spec?.description === 'string' && spec.description.trim()) return spec.description
    if (typeof spec?.url === 'string' && spec.url.trim()) return spec.url
    return texts.value.customWasmEmpty
}

async function loadWasmInstances() {
    try {
        wasmInstances.value = unwrapResponse<Model.PluginConfig[]>(
            await Api.getConfigPluginsByCode(WASM_PLUGIN_CODE)
        )
    } catch {
        wasmInstances.value = []
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
        pluginsLoading.value = false;
    }
});

async function selectNativePlugin(pluginCode: string) {
    code.value = pluginCode;
}

/** 配置 AI Wasm：有实例则进入编辑，否则按目录创建新实例 */
async function configureAiCard(card: AiPluginCard) {
    if (isAiGatewayQueueCard(card)) {
        aiGatewayQueueInstance.value = card.instance;
        aiGatewayQueueVisible.value = true;
        return;
    }
    if (card.instance) return
    code.value = WASM_PLUGIN_CODE
    await ensureWasmAttr()
    if (card.instance) {
        await refreshPluginInstancesList(WASM_PLUGIN_CODE)
        await editInstance(card.instance)
        return
    }
  openCreateWasmFromCatalog(card)
}

function openCreateCustomWasm() {
    thirdPartyWasmInstance.value = undefined
    thirdPartyWasmVisible.value = true
}

function editCustomWasm(instance: Model.PluginConfig) {
    thirdPartyWasmInstance.value = instance
    thirdPartyWasmVisible.value = true
}

async function ensureWasmAttr() {
    if (attr.value?.code === WASM_PLUGIN_CODE) return
    const cached = pluginAttrs.value.find((p) => p.code === WASM_PLUGIN_CODE)
    if (cached) {
        attr.value = cached
        return
    }
    const response = await Api.pluginAttr(WASM_PLUGIN_CODE)
    attr.value = unwrapResponse<Model.PluginAttributes>(response)
}

function openCreateWasmFromCatalog(card: AiPluginCard) {
    if (!attr.value) return
    const catalogId = card.catalog?.id ?? card.key
    formPluginConfig.value = {
        code: WASM_PLUGIN_CODE,
        kind: 'named',
        name: catalogId,
        spec: {
            url: '',
            plugin_name: card.title,
            plugin_root_id: `${catalogId}-root`,
            plugin_vm_id: `${catalogId}-vm`,
            plugin_config: {},
            clusters: {},
            fail_strategy: 'fail_open',
        },
    }
    dialogMode.value = 'create'
    dialogTitle.value = t('title.createWasmPlugin')
    dialogVisible.value = true
}

function backToPluginList() {
    code.value = undefined;
    attr.value = undefined;
    instances.value = undefined;
}

const refreshPluginInstancesList = async (pluginCode: string) => {
    instances.value = unwrapResponse<Model.PluginConfig[]>(await Api.getConfigPluginsByCode(pluginCode))
    if (pluginCode === WASM_PLUGIN_CODE) {
        await loadWasmInstances()
    }
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
                spec: {},
            }
        } else {
            formPluginConfig.value = {
                code: attr.value.code,
                kind: 'named',
                name: 'new-instance',
                spec: {},
            }
        }
    }
    dialogMode.value = 'create';
    dialogTitle.value = t('title.newPlugin');
    dialogVisible.value = true;
}
const closeDialog = async (action: 'save' | 'cancel') => {
    if (action === 'save') {
        try {
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
const editInstance = async (instance: Model.PluginConfig) => {
    dialogMode.value = 'edit';
    dialogTitle.value = t('title.editPlugin');
    formPluginConfig.value = instance;
    dialogVisible.value = true;
}
const deleteInstance = async (instance: Model.PluginConfig) => {
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
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e)
        ElMessage.error(texts.value.deleteFailed(message))
    }
}
const createPlugin = async () => {
    if (formRef.value === null) {
        return;
    }
    const config = <Model.PluginConfig>{
        ...formPluginConfig.value,
        spec: formRef.value.getJson(),
    }
    await Api.postConfigPlugin(config);
}
const updatePlugin = async () => {
    if (formRef.value === null) {
        return;
    }
    const config = <Model.PluginConfig>{
        ...formPluginConfig.value,
        spec: formRef.value.getJson(),
    }
    await Api.putConfigPlugin(config);
}

async function onCardMenu(command: string, item: Model.PluginAttributes) {
    if (command === 'homepage' && item.meta.homepage) {
        window.open(item.meta.homepage, '_blank');
    } else if (command === 'repository' && item.meta.repository) {
        window.open(item.meta.repository, '_blank');
    }
}

async function onAiGatewayQueueSaved() {
    await loadWasmInstances()
}

async function onThirdPartyWasmSaved() {
    wasmReloadNoticeVisible.value = true
    await loadWasmInstances()
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
                        <div class="plugin-card__title">{{ item.code }}</div>
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

        <!-- AI / Wasm 插件 -->
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
                        <h3>AI Gateway</h3>
                        <p>{{ texts.aiGatewayOps }}</p>
                    </div>
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
                                <div v-if="card.instance" class="plugin-card__badge">{{ t('hint.deployed') }}</div>
                            </div>
                        </div>
                        <div class="plugin-card__body">
                            {{ card.description }}
                        </div>
                        <button type="button" class="plugin-card__footer" @click="configureAiCard(card)">
                            {{ t('title.setting') }}
                        </button>
                    </div>
                    <el-empty v-if="!pluginsLoading && filteredAiCards.length === 0" />
                </div>
            </section>

            <section class="custom-wasm-panel">
                <div class="custom-wasm-panel__header">
                    <div>
                        <h3>{{ texts.customWasmTitle }}</h3>
                        <p>{{ texts.customWasmDesc }}</p>
                    </div>
                    <el-button :icon="Plus" type="primary" @click="openCreateCustomWasm">
                        {{ texts.addCustomWasm }}
                    </el-button>
                </div>
                <div class="custom-wasm-list">
                    <div
                        v-for="instance in filteredCustomWasmInstances"
                        :key="instance.kind === 'named' ? instance.name : JSON.stringify(instance)"
                        class="custom-wasm-row"
                    >
                        <div class="custom-wasm-row__main">
                            <strong>{{ instanceTitle(instance) }}</strong>
                            <span>{{ instance.kind === 'named' ? `wasm.${instance.name}` : instance.code }}</span>
                        </div>
                        <div class="custom-wasm-row__desc">
                            {{ customWasmDescription(instance) }}
                        </div>
                        <div class="custom-wasm-row__actions">
                            <el-button size="small" :icon="Edit" link type="primary" @click="editCustomWasm(instance)">
                                {{ t('button.edit') }}
                            </el-button>
                            <el-button size="small" :icon="Delete" link type="danger" @click="deleteCustomWasmInstance(instance)">
                                {{ t('button.delete') }}
                            </el-button>
                        </div>
                    </div>
                    <el-empty v-if="!pluginsLoading && filteredCustomWasmInstances.length === 0" :description="texts.customWasmEmpty" />
                </div>
            </section>
        </div>
        <ai-gateway-queue-drawer
            v-model="aiGatewayQueueVisible"
            :instance="aiGatewayQueueInstance"
            @saved="onAiGatewayQueueSaved"
        />
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
                <el-button :icon="Plus" type="primary" @click="openCreateDialog">{{ t('button.create') }}</el-button>
            </div>
            <div class="plugin-instance-list">
                <div v-for="instance in instances.filter((c) => {
                    return c.kind === 'named' && (searchText === '' ? true : c.name.includes(searchText))
                })" :key="instance.kind === 'named' ? instance.name : ''"
                    class="plugin-instance-row">
                    <div>
                        <strong>{{ instance.kind === 'named' ? instance.name : undefined }}</strong>
                        <span>{{ instance.code }} / {{ instance.kind }}</span>
                    </div>
                    <div class="plugin-instance-row__actions">
                        <el-button size="small" :icon="Edit" link type="primary"
                            @click="() => editInstance(instance)">{{ t('button.edit') }}</el-button>
                        <el-button size="small" :icon="Delete" link type="danger"
                            @click="() => deleteInstance(instance)">{{ t('button.delete') }}</el-button>
                    </div>
                </div>
                <el-empty v-if="instances.filter((c) => c.kind === 'named' && (searchText === '' ? true : c.name.includes(searchText))).length === 0" :description="texts.emptyConfig" />
            </div>
            <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" class="plugin-config-dialog" destroy-on-close>
                <template #title>
                    <div class="plugin-config-dialog__title">
                        <code>{{ attr.code }}</code>
                        <span>{{ dialogTitle }}</span>
                    </div>
                </template>
                <plugin-form ref="formRef" :attr="attr" v-model="formPluginConfig"></plugin-form>
                <template #footer>
                    <el-button @click="() => closeDialog('cancel')">{{ t('button.cancel') }}</el-button>
                    <el-button :icon="Check" type="primary" @click="() => closeDialog('save')">{{ t('button.save') }}</el-button>
                </template>
            </el-dialog>
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
.plugin-panel__section,
.custom-wasm-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.plugin-panel__reload-alert {
    margin-bottom: 2px;
}

.plugin-panel__section-header,
.custom-wasm-panel__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
}

.plugin-panel__section-header h3,
.custom-wasm-panel__header h3 {
    margin: 0;
    color: #0f172a;
    font-size: 15px;
    font-weight: 650;
}

.plugin-panel__section-header p,
.custom-wasm-panel__header p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
}

.custom-wasm-panel {
    margin-top: 4px;
    padding: 16px;
    border: 1px solid #dbe3ef;
    border-radius: 8px;
    background: #f8fafc;
}

.custom-wasm-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.custom-wasm-row {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) minmax(220px, 1.6fr) auto;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
}

.custom-wasm-row__main strong {
    display: block;
    color: #0f172a;
    font-size: 14px;
}

.custom-wasm-row__main span,
.custom-wasm-row__desc {
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
}

.custom-wasm-row__main span {
    display: block;
    margin-top: 3px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.custom-wasm-row__desc {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.custom-wasm-row__actions {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    justify-content: flex-end;
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

    .custom-wasm-row {
        grid-template-columns: 1fr;
        align-items: flex-start;
    }

    .custom-wasm-row__desc {
        white-space: normal;
    }
}

@media (max-width: 640px) {
    .plugin-panel__grid {
        grid-template-columns: 1fr;
    }

    .plugin-panel__section-header,
    .custom-wasm-panel__header {
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
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 58px;
}

.plugin-card__footer {
    width: 100%;
    padding: 10px;
    border: none;
    border-top: 1px solid #e5e5e5;
    background: #fafafa;
    font-size: 14px;
    color: #1a1a1a;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
        background: #f0f0f0;
    }
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

.plugin-config-dialog__title {
    display: inline-flex;
    align-items: center;
    gap: 10px;
}

.plugin-config-dialog__title code {
    padding: 3px 8px;
    border: 1px solid #dbe3ef;
    border-radius: 6px;
    color: #0f766e;
    background: #ecfdf5;
    font-size: 12px;
}
</style>
