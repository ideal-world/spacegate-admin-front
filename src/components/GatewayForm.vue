<script setup lang="ts">
import { Model } from 'spacegate-admin-client';
import FilterListForm from './FilterListForm.vue';
import ListenerForm from './ListenerForm.vue';
import { Plus, Close, Download, Upload, Document, CopyDocument, DocumentCopy } from '@element-plus/icons-vue'
import * as monaco from 'monaco-editor';
import { Ref, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue';
import { fetchJson, saveJson } from '../utils'
import { useMonacoJsonEditor } from '../hooks'
const editorRef = ref<HTMLElement | null>(null)
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

const { value: paramValue } = useMonacoJsonEditor<Model.SgParameters>(editorRef, modelValue.value.parameters)
watch(modelValue.value.parameters, (newParam) => {
    paramValue.value = newParam
}, { deep: true })
watch(paramValue, (newParam) => {
    modelValue.value.parameters = newParam
}, { deep: true })
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
</script>



<template>
    <el-form label-width="auto" label-suffix=":">
        <el-button-group class="mb-4">
            <el-popover :visible="uploadVisible" placement="top" :width="160">
                <p>{{ 'Choose a source.' }}</p>
                <div>
                    <el-button size="small" type="primary" @click="() => {
                        uploadConfig('clipboard')
                        uploadVisible = false
                    }">{{ 'clipboard' }}</el-button>
                    <el-button size="small" type="primary" @click="() => {
                        uploadConfig('file')
                        uploadVisible = false
                    }">{{ 'file' }}</el-button>
                </div>
                <template #reference>
                    <el-button :icon="Upload" @click="uploadVisible = !uploadVisible">{{ 'Upload Config' }}</el-button>
                </template>
            </el-popover>
            <el-popover :visible="downloadVisible" placement="top" :width="160">
                <p>{{ 'Choose a target.' }}</p>
                <div>
                    <el-button size="small" type="primary" @click="() => {
                        downloadConfig('clipboard')
                        downloadVisible = false
                    }">{{ 'clipboard' }}</el-button>
                    <el-button size="small" type="primary" @click="() => {
                        downloadConfig('file')
                        downloadVisible = false
                    }">{{ 'file' }}</el-button>
                </div>
                <template #reference>
                    <el-button :icon="Download" @click="downloadVisible = !downloadVisible">{{ 'Download Config'
                    }}</el-button>
                </template>
            </el-popover>
        </el-button-group>
        <el-form-item label="Name" prop="name">
            <el-input v-model="modelValue.name" placeholder="Name" :readonly="props.mode === 'edit'"></el-input>
        </el-form-item>
        <el-form-item label="Parameters" prop="parameters" class="flex">
            <div ref="editorRef" class="w-full h-[30vh] flex flex-grow "></div>
        </el-form-item>
        <el-form-item label="Listeners" prop="listeners">
            <div class="space-y-2 flex-grow overflow-auto">
                <el-card v-for="(listener, idx) in modelValue.listeners" :name="idx" :key="idx"
                    class="relative pt-6 flex-grow" shadow="hover">
                    <el-button text circle @click="removeListener(idx)" :icon="Close" class="absolute top-0 right-0 m-2">

                    </el-button>
                    <span class="absolute top-0 left-4 m-2 text-gray-500"> #{{ idx }}</span>
                    <ListenerForm v-model="modelValue.listeners[idx]"></ListenerForm>
                </el-card>
                <el-button type="primary" @click="addListener" :icon="Plus" class="w-full">
                    <span>Add Listener</span>
                </el-button>
            </div>

        </el-form-item>
        <el-form-item label="Filters" prop="filters">
            <FilterListForm v-model="modelValue.filters"></FilterListForm>
        </el-form-item>
    </el-form>
</template>