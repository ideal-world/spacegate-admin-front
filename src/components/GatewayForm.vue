<script setup lang="ts">
import { Model } from 'spacegate-admin-client';
import FilterListForm from './FilterListForm.vue';
import ListenerForm from './ListenerForm.vue';
import { Plus, Close, Download, Upload, Document, CopyDocument, DocumentCopy } from '@element-plus/icons-vue'
import * as monaco from 'monaco-editor';
import { Ref, computed, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue';
import { fetchJson, saveJson } from '../utils'
import { useMonacoJsonEditor } from '../hooks'

import { useI18n } from 'vue-i18n'
const { t } = useI18n();

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

const { setValue: setJson, getValue: getJson, innerVersion } = useMonacoJsonEditor(editorRef, modelValue.value.parameters)

watch(modelValue, () => {
    setJson(modelValue.value.parameters)
}, { deep: true })


watch(innerVersion, () => {
    console.log('innerVersion', innerVersion.value)
    modelValue.value.parameters = getJson()
})
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
    <el-form label-width="auto" label-suffix=":" class="space-y-2">
        <el-button-group class="mb-4">
            <el-popover :visible="uploadVisible" placement="top" :width="160">
                <p>{{ t('lint.chooseASource') }}</p>
                <div>
                    <el-button size="small" type="primary" @click="() => {
                        uploadConfig('clipboard')
                        uploadVisible = false
                    }">{{  t('button.clipboard') }}</el-button>
                    <el-button size="small" type="primary" @click="() => {
                        uploadConfig('file')
                        uploadVisible = false
                    }">{{ t('button.file') }}</el-button>
                </div>
                <template #reference>
                    <el-button :icon="Upload" @click="uploadVisible = !uploadVisible">{{ t('button.upload') }}</el-button>
                </template>
            </el-popover>
            <el-popover :visible="downloadVisible" placement="top" :width="160">
                <p>{{ t('lint.chooseATarget') }}</p>
                <div>
                    <el-button size="small" type="primary" @click="() => {
                        downloadConfig('clipboard')
                        downloadVisible = false
                    }">{{ t('button.clipboard') }}</el-button>
                    <el-button size="small" type="primary" @click="() => {
                        downloadConfig('file')
                        downloadVisible = false
                    }">{{  t('button.file') }}</el-button>
                </div>
                <template #reference>
                    <el-button :icon="Download" @click="downloadVisible = !downloadVisible">{{ t('button.download')
                    }}</el-button>
                </template>
            </el-popover>
        </el-button-group>
        <el-form-item :label="t('label.name')" prop="name">
            <el-input v-model="modelValue.name" placeholder="Name" :readonly="props.mode === 'edit'"></el-input>
        </el-form-item>
        <el-form-item :label="t('label.parameters')" prop="parameters">
            <div ref="editorRef" class="w-full flex flex-grow h-72"></div>
        </el-form-item>
        <el-form-item :label="t('label.listeners')" prop="listeners">
            <div class="space-y-2 flex-grow overflow-auto">
                <el-card v-for="(listener, idx) in modelValue.listeners" :name="idx" :key="idx"
                    class="relative pt-6 flex-grow" shadow="hover">
                    <el-button text circle @click="removeListener(idx)" :icon="Close" class="absolute top-0 right-0 m-2">

                    </el-button>
                    <span class="absolute top-0 left-4 m-2 text-gray-500"> #{{ idx }}</span>
                    <ListenerForm v-model="modelValue.listeners[idx]"></ListenerForm>
                </el-card>
                <el-button type="primary" @click="addListener" :icon="Plus" class="w-full">
                    <span>{{t('button.addListener')}}</span>
                </el-button>
            </div>

        </el-form-item>
        <el-form-item :label="t('label.plugins')" prop="filters">
            <FilterListForm v-model="modelValue.filters"></FilterListForm>
        </el-form-item>
    </el-form>
</template>