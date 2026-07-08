<script setup lang="ts">
import { Model } from 'spacegate-admin-client';
import PluginListForm from './PluginListForm.vue';
import ListenerForm from './ListenerForm.vue';
import { Plus, Close, Download, Upload } from '@element-plus/icons-vue'
import { computed, ref } from 'vue';
import { fetchJson, saveJson } from '../utils'

import { useI18n } from 'vue-i18n'
import OptionalField from './OptionalField.vue';
const { t, locale } = useI18n();

const modelValue = defineModel<Model.SgGateway>({
    required: true,
})


const props = defineProps<{
    mode: "create" | "edit"
}>()

const addListener = () => {
    modelValue.value.listeners.push({
        name: "new listener",
        ip: null,
        port: 8080,
        protocol: {
            type: "http",
        },
        hostname: null,
    })
}

const removeListener = (idx: number) => {
    modelValue.value.listeners.splice(idx, 1)
}

const downloadConfig = (target: 'file' | 'clipboard') => {
    saveJson(modelValue.value, modelValue.value.name, target)
}

const uploadConfig = (target: 'file' | 'clipboard') => {
    fetchJson(target).then((json) => {
        if (props.mode === 'edit') {
            modelValue.value = {
                ...json as Model.SgGateway,
                name: modelValue.value.name,
            }
        } else {
            modelValue.value = json as Model.SgGateway
        }
    })
}

const downloadVisible = ref(false)
const uploadVisible = ref(false)

const texts = computed(() => locale.value.startsWith('zh') ? {
    introTitle: '网关配置',
    introDesc: '配置入口监听、运行参数和网关级插件。保存后由后台写入当前网关配置。',
    basicTitle: '基础信息',
    basicDesc: '网关名称用于路由和实例重载引用，编辑已有网关时不可修改。',
    parametersTitle: '运行参数',
    parametersDesc: '只填写需要覆盖默认值的参数；未启用的可选项会保存为空值。',
    listenersTitle: '监听器',
    listenersDesc: '定义网关对外暴露的 IP、端口、协议和可选主机名。',
    pluginsTitle: '网关插件',
    pluginsDesc: '插件会在网关级别生效，路由和后端仍可继续绑定自己的插件。',
    advancedTitle: '高级操作',
    advancedDesc: '导入会覆盖当前表单内容；编辑已有网关时会保留当前网关名称。',
    noListeners: '还没有监听器，请至少添加一个 HTTP 或 HTTPS 监听器。',
    optional: '可选',
    enabled: '启用',
    disabled: '未启用',
    listener: '监听器',
    endpoint: '入口',
} : {
    introTitle: 'Gateway Configuration',
    introDesc: 'Configure listeners, runtime parameters, and gateway-level plugins. Saving writes the current gateway config through admin-server.',
    basicTitle: 'Basic Information',
    basicDesc: 'The gateway name is referenced by routes and instance reload operations. Existing gateway names are read-only.',
    parametersTitle: 'Runtime Parameters',
    parametersDesc: 'Only set values that should override defaults. Disabled optional fields are saved as null.',
    listenersTitle: 'Listeners',
    listenersDesc: 'Define the exposed IP, port, protocol, and optional hostname for this gateway.',
    pluginsTitle: 'Gateway Plugins',
    pluginsDesc: 'Plugins here run at gateway level. Routes and backends can still bind their own plugins.',
    advancedTitle: 'Advanced Actions',
    advancedDesc: 'Import overwrites the current form. Existing gateway names are preserved in edit mode.',
    noListeners: 'No listeners yet. Add at least one HTTP or HTTPS listener.',
    optional: 'Optional',
    enabled: 'Enabled',
    disabled: 'Disabled',
    listener: 'Listener',
    endpoint: 'Endpoint',
})

const listenerEndpoint = (listener: Model.SgListener) => {
    const ip = listener.ip || '[::]'
    const port = listener.port ?? '-'
    return `${ip}:${port}`
}
</script>



<template>
    <div class="gateway-editor">
        <div class="gateway-editor__intro">
            <div>
                <strong>{{ texts.introTitle }}</strong>
                <span>{{ texts.introDesc }}</span>
            </div>
        </div>

        <el-form label-position="top" class="gateway-editor__form">
            <section class="gateway-section">
                <div class="gateway-section__header">
                    <div>
                        <h3>{{ texts.basicTitle }}</h3>
                        <p>{{ texts.basicDesc }}</p>
                    </div>
                </div>
                <el-form-item :label="t('label.name')" prop="name">
                    <el-input v-model="modelValue.name" placeholder="spacegate-admin" :readonly="props.mode === 'edit'" />
                </el-form-item>
            </section>

            <section class="gateway-section">
                <div class="gateway-section__header">
                    <div>
                        <h3>{{ texts.parametersTitle }}</h3>
                        <p>{{ texts.parametersDesc }}</p>
                    </div>
                </div>
                <div class="gateway-param-grid">
                    <el-form-item :label="t('label.redisUrl')">
                        <OptionalField v-model="modelValue.parameters.redis_url" :default="''" class="gateway-optional-field">
                            <template #none>
                                <el-tag type="info" effect="plain">{{ texts.optional }}</el-tag>
                            </template>
                            <template #some>
                                <el-input v-model="modelValue.parameters.redis_url" placeholder="redis://127.0.0.1/" />
                            </template>
                        </OptionalField>
                    </el-form-item>
                    <el-form-item :label="t('label.logLevel')">
                        <OptionalField v-model="modelValue.parameters.log_level" :default="'info'" class="gateway-optional-field">
                            <template #none>
                                <el-tag type="info" effect="plain">{{ texts.optional }}</el-tag>
                            </template>
                            <template #some>
                                <el-select v-model="modelValue.parameters.log_level" placeholder="info">
                                    <el-option label="trace" value="trace" />
                                    <el-option label="debug" value="debug" />
                                    <el-option label="info" value="info" />
                                    <el-option label="warn" value="warn" />
                                    <el-option label="error" value="error" />
                                </el-select>
                            </template>
                        </OptionalField>
                    </el-form-item>
                    <el-form-item :label="t('label.lang')">
                        <OptionalField v-model="modelValue.parameters.lang" :default="'zh-CN'" class="gateway-optional-field">
                            <template #none>
                                <el-tag type="info" effect="plain">{{ texts.optional }}</el-tag>
                            </template>
                            <template #some>
                                <el-select v-model="modelValue.parameters.lang" placeholder="zh-CN">
                                    <el-option label="zh-CN" value="zh-CN" />
                                    <el-option label="en" value="en" />
                                </el-select>
                            </template>
                        </OptionalField>
                    </el-form-item>
                    <el-form-item :label="t('label.enableXRequestId')">
                        <div class="gateway-switch-row">
                            <el-switch v-model="modelValue.parameters.enable_x_request_id" />
                            <span>{{ modelValue.parameters.enable_x_request_id ? texts.enabled : texts.disabled }}</span>
                        </div>
                    </el-form-item>
                    <el-form-item :label="t('label.ignoreTlsVerification')">
                        <div class="gateway-switch-row">
                            <el-switch v-model="modelValue.parameters.ignore_tls_verification" />
                            <span>{{ modelValue.parameters.ignore_tls_verification ? texts.enabled : texts.disabled }}</span>
                        </div>
                    </el-form-item>
                </div>
            </section>

            <section class="gateway-section">
                <div class="gateway-section__header">
                    <div>
                        <h3>{{ texts.listenersTitle }}</h3>
                        <p>{{ texts.listenersDesc }}</p>
                    </div>
                    <el-button type="primary" :icon="Plus" @click="addListener">{{ t('button.addListener') }}</el-button>
                </div>

                <el-empty v-if="modelValue.listeners.length === 0" :description="texts.noListeners" />
                <div v-else class="gateway-listener-list">
                    <div v-for="(listener, idx) in modelValue.listeners" :key="idx" class="gateway-listener-card">
                        <div class="gateway-listener-card__header">
                            <div>
                                <strong>{{ listener.name || `${texts.listener} ${idx + 1}` }}</strong>
                                <span>{{ texts.endpoint }} {{ listenerEndpoint(listener) }}</span>
                            </div>
                            <el-button text circle :icon="Close" @click="removeListener(idx)" />
                        </div>
                        <ListenerForm v-model="modelValue.listeners[idx]" />
                    </div>
                </div>
            </section>

            <section class="gateway-section">
                <div class="gateway-section__header">
                    <div>
                        <h3>{{ texts.pluginsTitle }}</h3>
                        <p>{{ texts.pluginsDesc }}</p>
                    </div>
                </div>
                <PluginListForm
                    v-model="modelValue.plugins"
                    binding-scope="gateway"
                    :binding-name="`${modelValue.name || 'gateway'}-gateway`"
                />
            </section>

            <section class="gateway-section gateway-section--muted">
                <div class="gateway-section__header">
                    <div>
                        <h3>{{ texts.advancedTitle }}</h3>
                        <p>{{ texts.advancedDesc }}</p>
                    </div>
                    <div class="gateway-editor__actions">
                        <el-popover :visible="uploadVisible" placement="top" :width="220">
                            <p class="gateway-popover-title">{{ t('hint.chooseASource') }}</p>
                            <div class="gateway-popover-actions">
                                <el-button size="small" @click="() => {
                                    uploadConfig('clipboard')
                                    uploadVisible = false
                                }">{{ t('button.clipboard') }}</el-button>
                                <el-button size="small" @click="() => {
                                    uploadConfig('file')
                                    uploadVisible = false
                                }">{{ t('button.file') }}</el-button>
                            </div>
                            <template #reference>
                                <el-button :icon="Upload" @click="uploadVisible = !uploadVisible">{{ t('button.upload') }}</el-button>
                            </template>
                        </el-popover>
                        <el-popover :visible="downloadVisible" placement="top" :width="220">
                            <p class="gateway-popover-title">{{ t('hint.chooseATarget') }}</p>
                            <div class="gateway-popover-actions">
                                <el-button size="small" @click="() => {
                                    downloadConfig('clipboard')
                                    downloadVisible = false
                                }">{{ t('button.clipboard') }}</el-button>
                                <el-button size="small" @click="() => {
                                    downloadConfig('file')
                                    downloadVisible = false
                                }">{{ t('button.file') }}</el-button>
                            </div>
                            <template #reference>
                                <el-button :icon="Download" @click="downloadVisible = !downloadVisible">{{ t('button.download') }}</el-button>
                            </template>
                        </el-popover>
                    </div>
                </div>
            </section>
        </el-form>
    </div>
</template>

<style scoped>
.gateway-editor {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.gateway-editor__intro {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid #dbeafe;
    border-radius: 8px;
    background: #eff6ff;
}

.gateway-editor__intro div {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.gateway-editor__intro strong,
.gateway-section__header h3 {
    color: #111827;
    font-size: 16px;
    font-weight: 700;
}

.gateway-editor__intro span,
.gateway-section__header p,
.gateway-listener-card__header span {
    color: #64748b;
    font-size: 13px;
}

.gateway-editor__form {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.gateway-section {
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
}

.gateway-section--muted {
    background: #f8fafc;
}

.gateway-section__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
}

.gateway-section__header h3,
.gateway-section__header p {
    margin: 0;
}

.gateway-section__header p {
    margin-top: 4px;
}

.gateway-param-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 16px;
}

.gateway-optional-field,
.gateway-switch-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
}

.gateway-optional-field :deep(.el-input),
.gateway-optional-field :deep(.el-select) {
    flex: 1;
}

.gateway-switch-row span {
    color: #64748b;
    font-size: 13px;
}

.gateway-listener-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.gateway-listener-card {
    padding: 14px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f8fafc;
}

.gateway-listener-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.gateway-listener-card__header div {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.gateway-listener-card__header strong {
    color: #111827;
    font-weight: 700;
}

.gateway-editor__actions,
.gateway-popover-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.gateway-popover-title {
    margin: 0 0 10px;
    color: #334155;
    font-size: 13px;
}

.gateway-editor :deep(.el-form-item) {
    margin-bottom: 0;
}

.gateway-editor :deep(.el-form-item__label) {
    color: #334155;
    font-weight: 600;
}

@media (max-width: 900px) {
    .gateway-param-grid {
        grid-template-columns: 1fr;
    }

    .gateway-section__header {
        flex-direction: column;
    }
}
</style>
