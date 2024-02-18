<script setup lang="ts">
import { Model } from "spacegate-admin-client"
import OptionalField from "./OptionalField.vue";
import FilterListForm from './FilterListForm.vue';


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
        <el-form-item label="Host" prop="host">
            <div class="flex space-x-2">
                <el-select v-model="modelValue.host.kind">
                    <el-option label="Host" value="Host"></el-option>
                    <el-option label="K8sService" value="K8sService"></el-option>
                </el-select>
                <div v-if="modelValue.host.kind === 'Host'" class="flex-grow">
                    <el-input v-model="modelValue.host.host"></el-input>
                </div>
                <div v-if="modelValue.host.kind === 'K8sService'" class="flex-grow flex  space-x-1">
                    <el-input v-model="modelValue.host.name" class="flex-grow"></el-input>
                    <span>.</span>
                    <el-input v-model="modelValue.host.namespace" class="flex-grow"></el-input>
                </div>
            </div>
        </el-form-item>
        <el-form-item label="Port" prop="port">
            <el-input v-model="modelValue.port" placeholder="Port"></el-input>
        </el-form-item>
        <el-form-item label="Timeout" prop="timeout_ms">
            <optional-field :default="5000" v-model="modelValue.timeout_ms">
                <template #some>
                    <el-input-number v-model="(modelValue.timeout_ms as number)" placeholder="timeout"></el-input-number>
                    <span>ms</span>
                </template>
            </optional-field>
        </el-form-item>
        <el-form-item label="Protocol" prop="protocol">
            <optional-field :default="('http' as Model.SgBackendProtocol)" v-model="modelValue.protocol">
                <template #some>
                    <el-select v-model="(modelValue.protocol as string)" placeholder="Protocol">
                        <el-option label="http" value="http"></el-option>
                        <el-option label="https" value="https"></el-option>
                    </el-select>
                </template>
            </optional-field>
        </el-form-item>
        <el-form-item label="Weight" prop="weight">
            <el-input-number v-model="modelValue.weight" placeholder="Weight" :min="0"></el-input-number>
        </el-form-item>
        <el-form-item label="Filters" prop="filters">
            <FilterListForm v-model="modelValue.filters"></FilterListForm>
        </el-form-item>
    </el-form>
</template>