<script setup lang="ts">
import { Model } from "spacegate-admin-client"
import OptionalField from "./OptionalField.vue";
import PluginListForm from './PluginListForm.vue';
import { PORT_INPUT_ATTR } from '../constants';
import { useI18n } from 'vue-i18n'

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


</script>

<template>
    <el-form label-width="auto" label-suffix=":" class="space-y-1">

        <el-form-item :label="t('label.backends')">
            <div class="flex space-x-2">
                <el-select v-model="modelValue.host.kind" class="w-36">
                    <el-option :label="t('label.host')" value="Host"></el-option>
                    <el-option :label="t('label.k8sService')" value="K8sService"></el-option>
                </el-select>
                <div v-if="modelValue.host.kind === 'Host'" class="flex-grow">
                    <el-input v-model="modelValue.host.host"></el-input>
                </div>
                <div v-if="modelValue.host.kind === 'K8sService'" class="flex-grow flex space-x-1">
                    <el-input v-model="modelValue.host.name" class="flex-grow"
                        :placeholder="t('placeholder.name')"></el-input>
                    <span>.</span>
                    <el-input v-model="modelValue.host.namespace" class="flex-grow"
                        :placeholder="t('placeholder.namespace')"></el-input>
                </div>
                <span>:</span>
                <el-input-number class="text-left" v-model="modelValue.port" placeholder="port"
                    v-bind="PORT_INPUT_ATTR"></el-input-number>
            </div>
        </el-form-item>
        <el-row>
            <el-col :span="8">
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
            <el-col :span="8">
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
            <el-col :span="8">
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