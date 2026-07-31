<script setup lang="ts">
import { Model, Api } from 'spacegate-admin-client'
import { computed, nextTick, ref, watch } from 'vue';
import { updatePluginCodes, useMonacoJsonEditor } from '../hooks';
import { useI18n } from 'vue-i18n'
import SchemaForm from './SchemaForm.vue';
import { ElMessage } from 'element-plus';
const { locale, t } = useI18n();
const props = defineProps<{
    attr: Model.PluginAttributes
}>()

type PluginFormModel = {
    code: string
    kind: 'anon' | 'named' | 'mono'
    uid?: string
    name?: string
    display_name?: string | null
    spec: Record<string, unknown>
}

const modelValue = defineModel<PluginFormModel>({
    required: true,
})
const displayName = computed({
    get: () => modelValue.value.display_name ?? '',
    set: (value: string) => {
        modelValue.value.display_name = value
    },
})

// --- Schema-driven form ---
const pluginSchema = ref<Record<string, any> | null>(null)
const schemaLoading = ref(false)
const schemaFormRef = ref<InstanceType<typeof SchemaForm> | null>(null)
const specModel = ref<Record<string, any>>({})
const hasSchema = computed(() => pluginSchema.value && Object.keys(pluginSchema.value).length > 0)
const texts = computed(() => locale.value.startsWith('zh') ? {
    instanceNameHint: '用于 Gateway、Route、Rule 或 Backend 挂载时引用。建议使用能表达用途的名称，例如 auth-timeout 或 route-inject-header。',
    monoHint: '这是单例插件，配置会以插件类型为唯一实例保存。',
    formModeDesc: '根据插件 Schema 生成表单，适合常规配置。',
    jsonModeDesc: '直接编辑插件 spec JSON，适合复制、导入或配置高级字段。',
    jsonExampleTitle: 'JSON 配置示例',
    jsonEditorTitle: 'JSON 配置编辑',
    fillExample: '填入示例',
    copyExample: '复制示例',
    exampleCopied: '示例已复制',
    exampleApplied: '示例已填入 JSON 编辑器',
} : {
    instanceNameHint: 'Referenced when binding this configuration to Gateway, Route, Rule, or Backend. Use a purpose-driven name, for example auth-timeout or route-inject-header.',
    monoHint: 'This is a mono plugin. The configuration is saved as the only instance of this plugin type.',
    formModeDesc: 'Generated from the plugin schema. Use it for regular configuration.',
    jsonModeDesc: 'Edit plugin spec JSON directly for copy, import, or advanced fields.',
    jsonExampleTitle: 'JSON Configuration Example',
    jsonEditorTitle: 'JSON Configuration Editor',
    fillExample: 'Use Example',
    copyExample: 'Copy Example',
    exampleCopied: 'Example copied',
    exampleApplied: 'Example applied to JSON editor',
})

// --- Edit mode: form vs json ---
const editMode = ref<'form' | 'json'>('form')

watch(() => modelValue.value.code, async (code) => {
    if (!code) { pluginSchema.value = null; return }
    schemaLoading.value = true
    try {
        const resp = await Api.pluginSchema(code)
        pluginSchema.value = resp.data ?? null
    } catch {
        pluginSchema.value = null
    } finally {
        schemaLoading.value = false
    }
}, { immediate: true })

watch(pluginSchema, (schema) => {
    if (!schema) {
        editMode.value = 'json'
        return
    }
    const spec = (modelValue.value.spec as Record<string, any>) ?? {}
    specModel.value = { ...spec }
    if (Object.keys(schema).length === 0) {
        editMode.value = 'json'
    }
    nextTick(() => {
        if (schemaFormRef.value && Object.keys(specModel.value).length === 0) {
            schemaFormRef.value.initDefaults(schema, specModel.value)
        }
    })
})

// --- Monaco editor ---
const editorRef = ref(null)

const { setValue, getValue, setSchema } = useMonacoJsonEditor(editorRef, modelValue.value.spec, {
    schema: modelValue.value.code
})
watch(() => modelValue.value.code, () => {
    setSchema(modelValue.value.code)
}, { immediate: true })

// 在 JSON 容器挂载后初始化 Monaco，再同步表单和 JSON 两种编辑模式。
watch(editMode, async (mode) => {
    if (mode === 'json') {
        await nextTick()
        setSchema(modelValue.value.code)
        setValue(specModel.value)
    } else if (hasSchema.value) {
        try {
            const val = getValue()
            if (val !== undefined) {
                specModel.value = val
            }
        } catch (error) {
            editMode.value = 'json'
            ElMessage.error(`JSON 配置无效，无法切换到表单：${error instanceof Error ? error.message : String(error)}`)
        }
    }
})

watch(() => modelValue.value.spec, (v) => {
    if (editMode.value === 'json') {
        setValue(v)
    }
}, { deep: true })

defineExpose({
    getJson() {
        if (editMode.value === 'form' && hasSchema.value) {
            return specModel.value
        }
        return getValue()
    },
    validate() {
        if (editMode.value === 'form' && hasSchema.value && schemaFormRef.value) {
            return schemaFormRef.value.validate()
        }
        return []
    }
})

const codeOptions = updatePluginCodes()
watch(() => modelValue.value.code, async (code) => {
    if (code === null) {
        return
    }
    if (props.attr && props.attr.mono) {
        modelValue.value.kind = 'mono'
    }
}, { immediate: true })

function jsonExampleFromSchema(schema: Record<string, any> | null): Record<string, unknown> {
    if (!schema) return {}
    return exampleValue(schema, 0) as Record<string, unknown>
}

function exampleValue(schema: Record<string, any>, depth: number): unknown {
    if (depth > 4) return {}
    if (schema.default !== undefined) return schema.default
    if (schema.example !== undefined) return schema.example
    if (Array.isArray(schema.examples) && schema.examples.length > 0) return schema.examples[0]

    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type
    if (type === 'object' || schema.properties) {
        const result: Record<string, unknown> = {}
        const properties = schema.properties && typeof schema.properties === 'object'
            ? schema.properties as Record<string, Record<string, any>>
            : {}
        for (const [key, prop] of Object.entries(properties)) {
            result[key] = exampleValue(prop, depth + 1)
        }
        return result
    }
    if (type === 'array') return schema.items ? [exampleValue(schema.items, depth + 1)] : []
    if (type === 'number' || type === 'integer') return 0
    if (type === 'boolean') return false
    if (type === 'string') return ''
    return {}
}

const jsonExample = computed(() => {
    const example = hasSchema.value ? jsonExampleFromSchema(pluginSchema.value) : {}
    return JSON.stringify(example, null, 2)
})

function applyJsonExample() {
    const parsed = JSON.parse(jsonExample.value)
    specModel.value = parsed
    modelValue.value.spec = parsed
    editMode.value = 'json'
    nextTick(() => {
        ElMessage.success(texts.value.exampleApplied)
    })
}

async function copyJsonExample() {
    await navigator.clipboard.writeText(jsonExample.value)
    ElMessage.success(texts.value.exampleCopied)
}

</script>

<template>
    <el-form-item :label="t('label.displayName')" prop="display_name">
        <el-input v-model="displayName"></el-input>
    </el-form-item>
    <el-form-item v-if="modelValue.kind === 'named'" :label="t('label.pluginInstanceName')" prop="name">
        <el-input v-model="modelValue.name" placeholder="auth-timeout"></el-input>
        <div class="plugin-form__hint">{{ texts.instanceNameHint }}</div>
    </el-form-item>
    <el-form-item v-if="modelValue.kind === 'anon'" :label="t('label.anonUid')" prop="name">
        <el-input v-model="modelValue.uid" placeholder="Uid" disabled></el-input>
    </el-form-item>
    <el-alert
        v-if="modelValue.kind === 'mono'"
        type="info"
        :closable="false"
        :title="texts.monoHint"
        class="plugin-form__mono-alert"
    />

    <div class="plugin-form">
        <div class="plugin-form__heading">
            <div>
                <strong>{{ t('label.spec') }}</strong>
                <span>{{ editMode === 'json' || !hasSchema ? texts.jsonModeDesc : texts.formModeDesc }}</span>
            </div>
            <div class="plugin-form__heading-actions">
                <el-button size="small" @click="copyJsonExample">{{ texts.copyExample }}</el-button>
                <el-button size="small" type="primary" plain @click="applyJsonExample">{{ texts.fillExample }}</el-button>
            </div>
        </div>

        <!-- JSON 始终可用；Schema 表单仅在服务端提供结构定义时作为快捷编辑方式。 -->
        <div class="plugin-form__tabs">
            <button
                v-if="hasSchema"
                type="button"
                :class="['plugin-form__tab', editMode === 'form' && 'plugin-form__tab--active']"
                @click="editMode = 'form'"
            >
                {{ locale.startsWith('zh') ? '表单' : 'Form' }}
            </button>
            <button
                type="button"
                :class="['plugin-form__tab', editMode === 'json' && 'plugin-form__tab--active']"
                @click="editMode = 'json'"
            >
                JSON
            </button>
        </div>

        <!-- Schema-driven form -->
        <div v-if="hasSchema && editMode === 'form'" class="plugin-form__content">
            <SchemaForm ref="schemaFormRef" :schema="pluginSchema!" v-model="specModel" />
        </div>

        <!-- Monaco JSON editor -->
        <div v-show="editMode === 'json' || !hasSchema" class="plugin-form__content">
            <div class="plugin-form__example">
                <strong>{{ texts.jsonExampleTitle }}</strong>
                <pre>{{ jsonExample }}</pre>
            </div>
            <div class="plugin-form__editor-panel">
                <div class="plugin-form__editor-header">
                    <strong>{{ texts.jsonEditorTitle }}</strong>
                </div>
                <div ref="editorRef" class="plugin-form-editor__body"></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.plugin-form {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.plugin-form__hint {
    margin-top: 6px;
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
}

.plugin-form__mono-alert {
    margin-bottom: 14px;
}

.plugin-form__heading {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 10px;
}

.plugin-form__heading strong,
.plugin-form__example strong,
.plugin-form__editor-header strong {
    display: block;
    color: #0f172a;
    font-size: 14px;
}

.plugin-form__heading span {
    display: block;
    margin-top: 4px;
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
}

.plugin-form__heading-actions {
    display: inline-flex;
    gap: 8px;
    flex-shrink: 0;
}

.plugin-form__tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 8px 8px 0 0;
    padding: 4px 4px 0;
}

.plugin-form__tab {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    color: #64748b;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    border-radius: 6px 6px 0 0;
}

.plugin-form__tab:hover {
    color: #334155;
    background: #f1f5f9;
}

.plugin-form__tab--active {
    color: #2563eb;
    border-bottom-color: #2563eb;
    background: #fff;
    font-weight: 500;
}

.plugin-form__tab--active .el-icon {
    color: #2563eb;
}

.plugin-form__content {
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-top: none;
    border-radius: 0 0 8px 8px;
    background: #fff;
}

.plugin-form__example {
    margin-bottom: 12px;
    padding: 12px;
    border: 1px solid #dbe3ef;
    border-radius: 8px;
    background: #f8fafc;
}

.plugin-form__example pre {
    max-height: 160px;
    margin: 8px 0 0;
    overflow: auto;
    color: #334155;
    font-size: 12px;
    line-height: 1.5;
}

.plugin-form__editor-panel {
    overflow: hidden;
    border: 1px solid #dbe3ef;
    border-radius: 8px;
    background: #f8fafc;
}

.plugin-form__editor-header {
    padding: 12px;
    border-bottom: 1px solid #dbe3ef;
}

.plugin-form-editor__body {
    min-height: 360px;
    background: #fff;
}

@media (max-width: 720px) {
    .plugin-form__heading {
        flex-direction: column;
    }
}
</style>
