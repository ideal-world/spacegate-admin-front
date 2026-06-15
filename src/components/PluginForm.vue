<script setup lang="ts">
import { Model, Api } from 'spacegate-admin-client'
import { Ref, computed, onMounted, ref, watch } from 'vue';
import { updatePluginCodes, useMonacoJsonEditor } from '../hooks';
import { useI18n } from 'vue-i18n'
import { unwrapResponse } from '../utils';
const { locale, t } = useI18n();
const props = defineProps<{
    attr: Model.PluginAttributes
}>()
const modelValue = defineModel<Model.PluginConfig>({
    required: true,
})
const editorRef = ref(null)
const editorHint = computed(() => locale.value.startsWith('zh')
    ? '填写插件配置 JSON。字段结构保持原有插件 schema，不会改写挂载语义。'
    : 'Edit the plugin configuration JSON. The schema and plugin mounting semantics are preserved.')

const { setValue, getValue, setSchema } = useMonacoJsonEditor(editorRef, modelValue.value.spec, {
    schema: modelValue.value.code
})
watch(() => modelValue.value.code, () => {
    setSchema(modelValue.value.code)
}, { immediate: true })

watch(() => modelValue.value.spec, () => {
    setValue(modelValue.value.spec)
}, { deep: true })

defineExpose({
    getJson() {
        return getValue()
    }
})

const codeOptions = updatePluginCodes()
const name = ref('')
watch(() => modelValue.value.code, async (code) => {
    if (code === null) {
        return
    }
    if (props.attr && props.attr.mono) {
        modelValue.value.kind = 'mono'
    }
}, { immediate: true })

</script>

<template>
    <el-form-item v-if="modelValue.kind === 'named'" :label="t('label.name')" prop="name">
        <el-input v-model="modelValue.name" placeholder="Name"></el-input>
    </el-form-item>
    <el-form-item v-if="modelValue.kind === 'anon'" :label="t('label.anonUid')" prop="name">
        <el-input v-model="modelValue.uid" placeholder="Uid" disabled></el-input>
    </el-form-item>
    <!-- <el-form-item :label="t('label.code')" prop="code">
        <el-select v-model="modelValue.code" filterable allow-create default-first-option>
            <el-option v-for="item in codeOptions" :key="item" :label="item" :value="item" />
        </el-select>
    </el-form-item> -->
    <div class="plugin-form-editor">
        <div class="plugin-form-editor__header">
            <strong>{{ t('label.spec') }}</strong>
            <span>{{ editorHint }}</span>
        </div>
        <div ref="editorRef" class="plugin-form-editor__body"></div>
    </div>
    <!-- <el-form-item :label="t('label.spec')" prop="spec" class="flex">
        </el-form-item> -->
</template>

<style scoped>
.plugin-form-editor {
    overflow: hidden;
    border: 1px solid #dbe3ef;
    border-radius: 8px;
    background: #fff;
}

.plugin-form-editor__header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    border-bottom: 1px solid #e5e7eb;
    background: #f8fafc;
}

.plugin-form-editor__header strong {
    color: #0f172a;
    font-size: 13px;
}

.plugin-form-editor__header span {
    color: #64748b;
    font-size: 12px;
    line-height: 1.4;
}

.plugin-form-editor__body {
    display: flex;
    min-height: 320px;
}
</style>
