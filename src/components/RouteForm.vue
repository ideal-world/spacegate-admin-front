<script setup lang="ts">
import { Model } from 'spacegate-admin-client'
import { computed, onMounted, ref } from 'vue';
import { Plus, Minus, Close, Download, Upload } from '@element-plus/icons-vue'
import RouterMatchForm from './RouterMatchForm.vue';
import BackendForm from './BackendForm.vue';
import FilterListForm from './FilterListForm.vue';
import RouteRuleForm from './RouteRuleForm.vue';
import OptionalField from './OptionalField.vue';
import { fetchJson, saveJson } from '../utils';

const props = defineProps<{
    mode: "create" | "edit",
    name: string,
}>()

const modelValue = defineModel<Model.SgHttpRoute>({
    default: {
        gateway_name: "",
        hostnames: null,
        filters: [],
        rules: [],
        priority: 1,
    },
});

const addRule = () => {
    if (modelValue.value.rules !== null) {
        modelValue.value.rules.push({
            matches: null,
            filters: [],
            backends: [],
            timeout_ms: null,
        })
    }
}

const removeRule = (idx: number) => {
    if (modelValue.value.rules !== null) {
        modelValue.value.rules.splice(idx, 1)
    }
}

const downloadConfig = (target: 'file' | 'clipboard') => {
    saveJson(modelValue.value, props.name, target)
}

const uploadConfig = (target: 'file' | 'clipboard') => {
    fetchJson(target).then((json) => {
        modelValue.value = {
            ...json as Model.SgHttpRoute,
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
        <el-form-item label="Gateway Name" prop="gateway_name">
            <el-input v-model="modelValue.gateway_name" placeholder="Gateway Name"></el-input>
        </el-form-item>
        <el-form-item label="Hostnames" prop="hostnames">
            <OptionalField v-model="modelValue.hostnames" :default="[]" class="flex flex-col flex-grow space-y-1">
                <template #some>
                    <div v-for="hostname, idx in modelValue.hostnames!" class="flex flex-row">
                        <el-input v-model="modelValue.hostnames![idx]" placeholder="Hostnames">
                        </el-input>
                        <el-button :icon="Minus" @click="() => modelValue.hostnames!.splice(idx, 1)"></el-button>
                    </div>
                    <el-button type="primary" @click="() => modelValue.hostnames!.push('')" :icon="Plus">
                        Add Hostname
                    </el-button>
                </template>
            </OptionalField>
        </el-form-item>
        <el-form-item label="Priority" prop="priority">
            <el-input v-model="modelValue.priority" placeholder="Priority"></el-input>
        </el-form-item>
        <el-form-item label="Filters" prop="filters">
            <filter-list-form v-model="modelValue.filters"></filter-list-form>
        </el-form-item>
        <el-form-item label="Rules" prop="rules">

            <div class="space-y-2 flex-grow overflow-auto">
                <el-card v-for="(rule, idx) in modelValue.rules" :name="idx" :key="idx" class="relative pt-6 flex-grow"
                    shadow="hover">
                    <el-button text circle @click="removeRule(idx)" :icon="Close" class="absolute top-0 right-0 m-2">

                    </el-button>
                    <span class="absolute top-0 left-4 m-2 text-gray-500"> #{{ idx }}</span>
                    <route-rule-form v-model="modelValue.rules[idx]"></route-rule-form>
                </el-card>
                <el-button type="primary" @click="addRule" :icon="Plus" class="w-full">
                    <span>Add Rule</span>
                </el-button>
            </div>
        </el-form-item>
    </el-form>
</template>