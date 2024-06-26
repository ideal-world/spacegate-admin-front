<script setup lang="ts">
import { Model } from 'spacegate-admin-client';
import PluginListForm from './PluginListForm.vue';
import ListenerForm from './ListenerForm.vue';
import { Plus, Close, Download, Upload, Document, CopyDocument, DocumentCopy } from '@element-plus/icons-vue'
import * as monaco from 'monaco-editor';
import { Ref, computed, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue';
import { fetchJson, saveJson } from '../utils'
import { useMonacoJsonEditor } from '../hooks'

import { useI18n } from 'vue-i18n'
import OptionalField from './OptionalField.vue';
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

const { setValue: setJson, getValue: getJson, setSchema } = useMonacoJsonEditor(editorRef, modelValue.value.parameters)

watch(() => modelValue.value.parameters, () => {
    setJson(modelValue.value.parameters)
}, { deep: true })


watch(getJson, (newValue) => {
    modelValue.value.parameters = newValue
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
                <p>{{ t('hint.chooseASource') }}</p>
                <div>
                    <el-button size="small" type="primary" @click="() => {
                uploadConfig('clipboard')
                uploadVisible = false
            }">{{ t('button.clipboard') }}</el-button>
                    <el-button size="small" type="primary" @click="() => {
                uploadConfig('file')
                uploadVisible = false
            }">{{ t('button.file') }}</el-button>
                </div>
                <template #reference>
                    <el-button :icon="Upload" @click="uploadVisible = !uploadVisible">{{ t('button.upload')
                        }}</el-button>
                </template>
            </el-popover>
            <el-popover :visible="downloadVisible" placement="top" :width="160">
                <p>{{ t('hint.chooseATarget') }}</p>
                <div>
                    <el-button size="small" type="primary" @click="() => {
                downloadConfig('clipboard')
                downloadVisible = false
            }">{{ t('button.clipboard') }}</el-button>
                    <el-button size="small" type="primary" @click="() => {
                downloadConfig('file')
                downloadVisible = false
            }">{{ t('button.file') }}</el-button>
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
            <el-card shadow="never" class="w-full">
                <el-form label-width="auto" label-suffix=":" >
                    <el-form-item :label="t('label.redisUrl')" >
                        <OptionalField v-model="modelValue.parameters.redis_url" :default="''" class="flex-grow">
                            <template #some>
                                <el-input v-model="modelValue.parameters.redis_url" placeholder="redis_url" ></el-input>
                            </template>
                        </OptionalField>
                    </el-form-item>
                    <el-form-item :label="t('label.enableXRequestId')">
                        <el-switch v-model="modelValue.parameters.enable_x_request_id"></el-switch>
                    </el-form-item>
                    <el-form-item :label="t('label.logLevel')" >
                        <OptionalField v-model="modelValue.parameters.log_level" :default="''"  class="flex-grow">
                            <template #some>
                                <el-input v-model="modelValue.parameters.log_level" placeholder="log_level" ></el-input>
                            </template>
                        </OptionalField>
                    </el-form-item>
                    <el-form-item :label="t('label.lang')">
                        <OptionalField v-model="modelValue.parameters.lang" :default="''" class="flex-grow">
                            <template #some>
                                <el-input v-model="modelValue.parameters.lang" placeholder="lang"></el-input>
                            </template>
                        </OptionalField>
                    </el-form-item>
                    <el-form-item :label="t('label.ignoreTlsVerification')">
                        <el-switch v-model="modelValue.parameters.ignore_tls_verification"
                            placeholder="ignore tls verification"></el-switch>
                    </el-form-item>
                </el-form>
            </el-card>
        </el-form-item>
        <el-form-item :label="t('label.listeners')" prop="listeners">
            <div class="space-y-2 flex-grow overflow-auto">
                <el-card v-for="(listener, idx) in modelValue.listeners" :name="idx" :key="idx"
                    class="relative pt-6 flex-grow" shadow="hover">
                    <el-button text circle @click="removeListener(idx)" :icon="Close"
                        class="absolute top-0 right-0 m-2">

                    </el-button>
                    <span class="absolute top-0 left-4 m-2 text-gray-500"> #{{ idx }}</span>
                    <ListenerForm v-model="modelValue.listeners[idx]"></ListenerForm>
                </el-card>
                <el-button type="primary" @click="addListener" :icon="Plus" class="w-full">
                    <span>{{ t('button.addListener') }}</span>
                </el-button>
            </div>

        </el-form-item>
        <el-form-item :label="t('label.plugins')" prop="filters">
            <PluginListForm v-model="modelValue.plugins"></PluginListForm>
        </el-form-item>
    </el-form>
</template>
