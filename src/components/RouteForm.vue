<script setup lang="ts">
import { Model } from 'spacegate-admin-client'
import { computed, onMounted, ref } from 'vue';
import { Plus, Minus, Close, Download, Upload } from '@element-plus/icons-vue'
import RouterMatchForm from './RouterMatchForm.vue';
import BackendForm from './BackendForm.vue';
import PluginListForm from './PluginListForm.vue';
import RouteRuleForm from './RouteRuleForm.vue';
import OptionalField from './OptionalField.vue';
import { fetchJson, saveJson } from '../utils';
import { useI18n } from 'vue-i18n'
const { t } = useI18n();
const props = defineProps<{
    mode: "create" | "edit",
    name: string
}>()

const modelValue = defineModel<Model.SgHttpRoute>({
    default: {
        route_name: "",
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
            plugins: [],
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
    saveJson(modelValue.value, `${props.name}`, target)
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
        <el-form-item :label="t('label.routeName')" prop="route_name">
            <el-input v-model="modelValue.route_name" placeholder="Route Name"></el-input>
        </el-form-item>
        <el-form-item :label="t('label.hostname')" prop="hostnames">
            <OptionalField v-model="modelValue.hostnames" :default="[]" class="flex flex-col flex-grow space-y-1">

                <template #some>
                    <div v-for="hostname, idx in modelValue.hostnames!" class="flex flex-row">
                        <el-input v-model="modelValue.hostnames![idx]" placeholder="Hostnames">
                        </el-input>
                        <el-button :icon="Minus" @click="() => modelValue.hostnames!.splice(idx, 1)"></el-button>
                    </div>
                    <el-button type="primary" @click="() => modelValue.hostnames!.push('')" :icon="Plus">
                        {{ t('button.addHost') }}
                    </el-button>
                </template>
            </OptionalField>
        </el-form-item>
        <el-form-item :label="t('label.priority')" prop="priority">
            <el-input-number v-model="modelValue.priority" placeholder="Priority" :min="-5000"
                :max="5000"></el-input-number>
        </el-form-item>
        <el-form-item :label="t('label.plugins')" prop="plugins">
            <plugin-list-form v-model="modelValue.plugins"></plugin-list-form>
        </el-form-item>
        <el-form-item :label="t('label.rules')" prop="rules">

            <div class="space-y-2 flex-grow overflow-auto">
                <el-card v-for="(rule, idx) in modelValue.rules" :name="idx" :key="idx" class="relative pt-6 flex-grow"
                    shadow="hover">
                    <el-button text circle @click="removeRule(idx)" :icon="Close" class="absolute top-0 right-0 m-2">

                    </el-button>
                    <span class="absolute top-0 left-4 m-2 text-gray-500"> #{{ idx }}</span>
                    <route-rule-form v-model="modelValue.rules[idx]"></route-rule-form>
                </el-card>
                <el-button type="primary" @click="addRule" :icon="Plus" class="w-full">
                    <span>{{t('button.addRule')}}</span>
                </el-button>
            </div>
        </el-form-item>
    </el-form>
</template>