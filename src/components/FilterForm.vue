<script setup lang="ts">
import { Model } from 'spacegate-admin-client'
import { ref, watch } from 'vue';
import { useMonacoJsonEditor } from '../hooks';
const modelValue = defineModel<Model.SgRouteFilter>({
    required: true,
})
const editorRef = ref(null)
const { setValue: setJson, getValue: getJson } = useMonacoJsonEditor(editorRef, modelValue.value.spec)

watch(modelValue, () => {
    setJson(modelValue.value.spec)
}, { deep: true })

defineExpose({
    getJson() {
        return getJson()
    }
})

</script>

<template>
    <el-form label-width="auto" label-suffix=":" class="space-y-1">
        <el-form-item label="Name" prop="name">
            <el-input v-model="modelValue.name" placeholder="Name"></el-input>
        </el-form-item>
        <el-form-item label="Code" prop="code">
            <el-input v-model="modelValue.code" placeholder="Code"></el-input>
        </el-form-item>
        <el-form-item label="Spec" prop="spec" class="flex">
            <div ref="editorRef" class="w-100 h-[30vh]  flex flex-grow"></div>
        </el-form-item>
    </el-form>
</template>