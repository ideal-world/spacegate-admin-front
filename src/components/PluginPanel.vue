<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Api, Model } from 'spacegate-admin-client'
import { unwrapResponse, hashColor } from '../utils'
import { Plus, Delete, Check, Edit, ArrowLeft, MoreFilled, Grid, Sunny } from '@element-plus/icons-vue'
import { AiGatewayQueueDrawer, PluginForm } from '.';
import { PluginConfig } from 'spacegate-admin-client/dist/model';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n'
import { AI_WASM_CATALOG, type AiWasmCatalogItem } from '../constants/aiWasmCatalog'

const { t } = useI18n();

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

    for (const catalog of AI_WASM_CATALOG) {
        const instance = wasmInstances.value.find((inst) => instanceMatchesCatalog(inst, catalog))
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

function iconStyle(pluginCode: string) {
    return { backgroundColor: hashColor(pluginCode, 'light') }
}

function aiIconStyle(title: string) {
    return { backgroundColor: hashColor(title, 'light') }
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
    code.value = WASM_PLUGIN_CODE
    await ensureWasmAttr()
    if (card.instance) {
        await refreshPluginInstancesList(WASM_PLUGIN_CODE)
        await editInstance(card.instance)
        return
    }
  openCreateWasmFromCatalog(card)
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
    dialogTitle.value = `Create Instance`;
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
    dialogTitle.value = `Edit Instance`;
    formPluginConfig.value = instance;
    dialogVisible.value = true;
}
const deleteInstance = async (instance: Model.PluginConfig) => {
    const action = await ElMessageBox.confirm('Are you sure to delete this plugin instance?', 'Warning', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning',
    });
    if (action === 'confirm') {
        await Api.deleteConfigPlugin(instance);
        await refreshPluginInstancesList(code.value!);
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
                                    Homepage
                                </el-dropdown-item>
                                <el-dropdown-item v-if="item.meta.repository" command="repository">
                                    Repository
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
            class="plugin-panel__grid"
        >
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
        <ai-gateway-queue-drawer
            v-model="aiGatewayQueueVisible"
            :instance="aiGatewayQueueInstance"
            @saved="onAiGatewayQueueSaved"
        />
    </div>

    <!-- 选中插件后的配置详情 -->
    <div v-else class="plugin-detail">
        <div class="plugin-detail__toolbar">
            <el-button :icon="ArrowLeft" @click="backToPluginList">{{ t('button.back') }}</el-button>
            <span class="plugin-detail__code">{{ code }}</span>
        </div>
        <el-descriptions v-if="attr" border class="plugin-detail__meta">
            <el-descriptions-item label="Code">{{ attr.code }}</el-descriptions-item>
            <el-descriptions-item label="Version">{{ attr.meta.version }}</el-descriptions-item>
            <el-descriptions-item label="Mono">
                {{ attr.mono ? '✔️' : '❌' }}
            </el-descriptions-item>
            <el-descriptions-item label="Authors">{{ attr.meta.authors }}</el-descriptions-item>
            <el-descriptions-item label="Homepage">
                <el-link v-if="attr.meta.homepage" :href="attr.meta.homepage" target="_blank">{{ attr.meta.homepage
                    }}</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="Repository">
                <el-link v-if="attr.meta.repository" :href="attr.meta.repository" target="_blank">{{ attr.meta.repository
                    }}</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="Description">{{ attr.meta.description }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="attr !== undefined && attr.mono" />

        <div v-if="attr !== undefined && !attr.mono && instances !== undefined">
            <div class="flex items-start space-x-2">
                <el-input v-model="searchText" placeholder="Search Instance Name"></el-input>
                <el-button :icon="Plus" type="primary" @click="openCreateDialog">{{ t('button.create') }}</el-button>
            </div>
            <div class="flex flex-wrap items-start space-y-2 space-x-2">
                <el-card v-for="instance in instances.filter((c) => {
                    return c.kind === 'named' && (searchText === '' ? true : c.name.includes(searchText))
                })" :key="instance.kind === 'named' ? instance.name : ''"
                    class="inline-block flex justify-between border-b border-gray-300 p-2 my-2" shadow="hover">
                    <span class="flex-grow mx-2">{{ instance.kind === 'named' ? instance.name : undefined }}</span>
                    <el-button-group>
                        <el-button size="small" :icon="Edit" type="primary"
                            @click="() => editInstance(instance)">{{ t('button.edit') }}</el-button>
                        <el-button size="small" :icon="Delete" type="danger"
                            @click="() => deleteInstance(instance)">{{ t('button.delete') }}</el-button>
                    </el-button-group>
                </el-card>
            </div>
            <el-dialog v-model="dialogVisible" :title="dialogTitle">
                <template #title>
                    <code class="border rounded px-2 mx-2">{{ attr.code }}</code>
                    <span>{{ dialogTitle }}</span>
                </template>
                <plugin-form ref="formRef" :attr="attr" v-model="formPluginConfig"></plugin-form>
                <template #footer>
                    <el-button :icon="Delete" @click="() => closeDialog('cancel')">{{ t('button.cancel') }}</el-button>
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
</style>
