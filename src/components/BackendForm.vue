<script setup lang="ts">
import { Model, Api } from "spacegate-admin-client"
import { Search } from '@element-plus/icons-vue'
import OptionalField from "./OptionalField.vue";
import PluginListForm from './PluginListForm.vue';
import { PORT_INPUT_ATTR } from '../constants';
import { useI18n } from 'vue-i18n'
import { onMounted, ref } from "vue";
import { unwrapResponse } from "../utils";

const { t } = useI18n();
const modelValue = defineModel<Model.SgBackendRef>({
    default: {
        host: {
            kind: "Host",
            host: "example.com",
        },
        port: 80,
        timeout_ms: null,
        protocol: "http",
        weight: 1,
        filters: [],
    }
})

const discoveredBackends = ref<Array<Model.BackendHost>>([]);

onMounted(async () => {
    const backendHosts = unwrapResponse(await Api.instanceBackends())
    discoveredBackends.value = backendHosts
    discoveredBackends.value.forEach(e => {
        e.label = labelHost(e)
    });
    if (backendHosts[0] !== undefined) {
        selectedDiscoveredBackends.value = backendHosts[0]
    }
})
const hostCategory: Model.BackendHost['kind'][] = ['File', 'Host', 'K8sService'];
const labelHostCategory = {
    'File': t('label.file'),
    'Host': t('label.host'),
    'K8sService': t('label.k8sService')
}
const labelHost = (host: Model.BackendHost) => {
    switch (host.kind) {
        case 'Host':
            return host.host;
        case 'K8sService':
            return `${host.name}.${host.namespace}`;
        case 'File':
            return host.path;
    }
}
const backendDialogVisible = ref(false);
const selectedDiscoveredBackends = ref<Model.BackendHost | undefined>(undefined);
const doSelectDiscoveredBackend = () => {
    const backend = selectedDiscoveredBackends.value;
    if (backend) {
        modelValue.value.host = backend;
    }
    backendDialogVisible.value = false;
}
</script>

<template>

    <el-dialog v-model="backendDialogVisible" :title="t('hint.selectBackend')">
        <el-select filterable v-model="selectedDiscoveredBackends" value-key="label">
            <el-option-group v-for="group in hostCategory" :key="group" :label="labelHostCategory[group]">
                <el-option v-for="(host, _) in discoveredBackends.filter((b) => b.kind === group)" :label="host.label"
                    :value=host></el-option>
            </el-option-group>
        </el-select>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="backendDialogVisible = false">{{ t('button.cancel') }}</el-button>
                <el-button type="primary" @click="doSelectDiscoveredBackend">
                    {{ t('button.confirm') }}
                </el-button>
            </div>
        </template>
    </el-dialog>
    <el-form label-width="auto" label-suffix=":" class="space-y-1">

        <el-form-item :label="t('label.backends')">
            <div class="flex space-x-2 w-full">
                <el-button @click="backendDialogVisible = true" :icon="Search">{{ t('button.discover') }}</el-button>
                <el-select v-model="modelValue.host.kind" class="w-36">
                    <el-option :label="t('label.host')" value="Host"></el-option>
                    <el-option :label="t('label.k8sService')" value="K8sService"></el-option>
                    <el-option :label="t('label.file')" value="File"></el-option>
                </el-select>
                <div v-if="modelValue.host.kind === 'Host'" class="flex-grow flex space-x-1">
                    <el-input v-model="modelValue.host.host"></el-input>
                    <span>:</span>
                    <el-input-number class="text-left w-[18rem]" v-model="modelValue.port" placeholder="port"
                        v-bind="PORT_INPUT_ATTR"></el-input-number>
                </div>
                <div v-if="modelValue.host.kind === 'K8sService'" class="flex-grow flex space-x-1">
                    <el-input v-model="modelValue.host.name" class="flex-grow"
                        :placeholder="t('placeholder.serviceName')"></el-input>
                    <span>.</span>
                    <el-input v-model="modelValue.host.namespace" class="flex-grow"
                        :placeholder="t('placeholder.serviceNamespace')"></el-input>
                    <span>:</span>
                    <el-input-number class="text-left w-[18rem]" v-model="modelValue.port" placeholder="port"
                        v-bind="PORT_INPUT_ATTR"></el-input-number>
                </div>
                <div v-if="modelValue.host.kind === 'File'" class="flex-grow flex space-x-1">
                    <el-input v-model="modelValue.host.path" class="flex-grow "
                        :placeholder="t('placeholder.path')"></el-input>
                </div>
            </div>
        </el-form-item>
        <el-row>
            <el-col :span="6">
                <el-form-item :label="t('label.timeout')" prop="timeout_ms">
                    <optional-field :default="5000" v-model="modelValue.timeout_ms">
                        <template #some>
                            <el-input-number v-model="(modelValue.timeout_ms as number)"
                                :placeholder="t('placeholder.timeout')"></el-input-number>
                            <span>ms</span>
                        </template>
                    </optional-field>
                </el-form-item>
            </el-col>
            <el-col :span="6">
                <el-form-item :label="t('label.protocol')" prop="protocol">
                    <optional-field :default="('http' as Model.SgBackendProtocol)" v-model="modelValue.protocol">
                        <template #some>
                            <el-select v-model="(modelValue.protocol as string)" placeholder="Protocol" class="w-24">
                                <el-option label="http" value="http"></el-option>
                                <el-option label="https" value="https"></el-option>
                            </el-select>
                        </template>
                    </optional-field>
                </el-form-item>
            </el-col>
            <el-col :span="6">
                <el-form-item :label="t('label.http2Downgrade')" prop="http2_downgrade">

                    <el-switch v-model="(modelValue.downgrade_http2 as boolean)" placeholder="Protocol" class="w-24">

                    </el-switch>

                </el-form-item>
            </el-col>
            <el-col :span="6">
                <el-form-item :label="t('label.weight')" prop="weight">
                    <el-input-number v-model="modelValue.weight" placeholder="Weight" :min="0"></el-input-number>
                </el-form-item>
            </el-col>
        </el-row>
        <el-form-item :label="t('label.plugins')" prop="filters">
            <PluginListForm v-model="modelValue.plugins"></PluginListForm>
        </el-form-item>
    </el-form>
</template>
