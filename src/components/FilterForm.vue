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
        const editor = monaco.editor.create(editorRef.value, {
            language: 'json',
            value: specJson.value,
            minimap: {
                enabled: false,
            },
        })
        editor.layout()
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
            <div ref="editorRef" class="w-100 h-[30vh]  flex flex-grow "></div>
        </el-form-item>
    </el-form>
</template>