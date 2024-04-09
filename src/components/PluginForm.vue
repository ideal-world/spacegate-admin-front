<script setup lang="ts">
import { Model, Api } from 'spacegate-admin-client'
import { Ref, computed, onMounted, ref, watch } from 'vue';
import { updatePluginCodes, useMonacoJsonEditor } from '../hooks';
import { useI18n } from 'vue-i18n'
import { unwrapResponse } from '../utils';
const { t } = useI18n();

const modelValue = defineModel<Model.PluginConfig>({
    required: true,
})
const editorRef = ref(null)

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
const uid = ref(BigInt(0))
const attr = ref<Model.PluginAttributes | null>(null)
watch(() => modelValue.value.code, async (code) => {
    if (code === null) {
        return
    }
    attr.value = await Api.pluginAttr(code).then(unwrapResponse)
    if (attr.value.mono) {
        modelValue.value.kind = 'mono'
    }
}, { immediate: true })

const uidDisplay = computed(() => uid.value.toString(16).padStart(16, '0'));
</script>

<template>
    <el-form label-width="auto" label-suffix=":" class="space-y-1">
        <el-select v-if="!attr.mono" v-model="modelValue.kind">
            <el-option key="named" label="named" value="named" />
            <el-option key="anon" label="named" value="named" />
        </el-select>
        <el-form-item v-if="modelValue.kind === 'named'" :label="t('label.name')" prop="name">
            <el-input v-model="modelValue.name" placeholder="Name"></el-input>
        </el-form-item>
        <el-form-item v-if="modelValue.kind === 'anon'" :label="t('label.anonUid')" prop="name">
            <el-input v-model="uidDisplay" placeholder="Uid" disabled></el-input>
        </el-form-item>
        <el-form-item :label="t('label.code')" prop="code">
            <el-select v-model="modelValue.code" filterable allow-create default-first-option>
                <el-option v-for="item in codeOptions" :key="item" :label="item" :value="item" />
            </el-select>
        </el-form-item>
        <div ref="editorRef" class="w-100 h-[30vh]  flex flex-grow"></div>
        <!-- <el-form-item :label="t('label.spec')" prop="spec" class="flex">
        </el-form-item> -->
    </el-form>
</template>