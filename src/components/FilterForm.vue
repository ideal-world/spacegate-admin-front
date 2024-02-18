<script setup lang="ts">
import { Model } from 'spacegate-admin-client'
import { VNode, VNodeRef, computed, onMounted, ref } from 'vue';
import { Plus, Minus, Close, ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import RouterMatchForm from './RouterMatchForm.vue';
import * as monaco from 'monaco-editor';
const modelValue = defineModel<Model.SgRouteFilter>({
    default: {
        code: "redirect",
        name: null,
        spec: {

        }
    },
})
const specJson = ref("{}")
const editorRef = ref(null)

onMounted(() => {

    if (editorRef.value) {
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
        })
        monaco.editor.create(editorRef.value, {
            language: 'json',
            value: specJson.value,
            minimap: {
                enabled: false,
            },
        })
        monaco.editor.colorizeElement(editorRef.value, {
            mimeType: 'json'
        })
    }
})
</script>

<template>
    <el-form>
        <el-form-item label="Name" prop="name">
            <el-input v-model="modelValue.name" placeholder="Name"></el-input>
        </el-form-item>
        <el-form-item label="Code" prop="code">
            <el-input v-model="modelValue.code" placeholder="Code"></el-input>
        </el-form-item>
        <el-form-item label="Spec" prop="spec">
            <div ref="editorRef" class="w-[500px] h-[300px]"></div>
        </el-form-item>
    </el-form>
</template>