<script setup lang="ts">
import { Model } from 'spacegate-admin-client'
import { ref, watch } from 'vue';
import { updatePluginCodes, useMonacoJsonEditor } from '../hooks';
import { useI18n } from 'vue-i18n'
const { t } = useI18n();

const modelValue = defineModel<Model.SgRouteFilter>({
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



</script>

<template>
    <el-form label-width="auto" label-suffix=":" class="space-y-1">
        <el-form-item :label="t('label.name')" prop="name">
            <el-input v-model="modelValue.name" placeholder="Name"></el-input>
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