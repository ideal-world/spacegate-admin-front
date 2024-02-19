<script setup lang="ts">
import { Model } from 'spacegate-admin-client'
import { computed, ref, watch } from 'vue';
import FilterListForm from './FilterListForm.vue';
import OptionalField from "./OptionalField.vue";

const modelValue = defineModel<Model.SgListener>({
    default: {
        name: null,
        ip: null,
        port: 8080,
        protocol: {
            type: "http",
        },
        hostname: null,
    },
})

watch(() => modelValue.value.protocol.type, (type, prevType) => {
    if (type === prevType) {
        return
    }
    if (type === 'http') {
        modelValue.value.protocol = {
            type: "http",
        }
    } else if (type === 'https') {
        modelValue.value.protocol = {
            type: "https",
            tls: {
                mode: "Terminate",
                key: "",
                cert: "",
            }
        }
    }
})
</script>

<template>
    <el-form label-width="auto" label-suffix=":" class="space-y-2">
        <el-form-item label="Name" prop="name">
            <el-input v-model="modelValue.name" placeholder="Name"></el-input>
        </el-form-item>
        <el-form-item label="IP" prop="ip">
            <optional-field :default="'0.0.0.0'" v-model="modelValue.ip">
                <template #some>
                    <el-input v-model="modelValue.ip" placeholder="IP"></el-input>
                </template>
            </optional-field>
        </el-form-item>
        <el-form-item label="Port" prop="port">
            <el-input v-model="modelValue.port" placeholder="Port"></el-input>
        </el-form-item>
        <el-form-item label="Hostname" prop="hostname">
            <optional-field :default="'localhost'" v-model="modelValue.hostname">
                <template #some>
                    <el-input v-model="modelValue.hostname" placeholder="Hostname"></el-input>
                </template>
            </optional-field>
        </el-form-item>
        <el-form-item label="Protocol Type" prop="protocol">
            <el-select v-model="modelValue.protocol.type" placeholder="Protocol">
                <el-option label="http" value="http"></el-option>
                <el-option label="https" value="https"></el-option>
            </el-select>
        </el-form-item>
        <el-form-item label="Tls Config" v-if="modelValue.protocol.type === 'https'">
            <el-select v-model="modelValue.protocol.tls.mode" placeholder="Tls Mode">
                <el-option label="Terminate" value="Terminate"></el-option>
                <el-option label="Passthrough" value="Passthrough"></el-option>
            </el-select>
            <el-input type='textarea' v-model="modelValue.protocol.tls.key" placeholder="Key"></el-input>
            <el-input type='textarea' v-model="modelValue.protocol.tls.cert" placeholder="Cert"></el-input>
        </el-form-item>

    </el-form>
</template>
