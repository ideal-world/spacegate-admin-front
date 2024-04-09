<script setup lang="ts">
import { Model } from 'spacegate-admin-client'
import { computed, ref, watch } from 'vue';
import PluginListForm from './PluginListForm.vue';
import OptionalField from "./OptionalField.vue";
import { PORT_INPUT_ATTR } from '../constants';
import { useI18n } from 'vue-i18n'
const { t } = useI18n();

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
        <el-form-item :label="t('label.name')" prop="name">
            <el-input v-model="modelValue.name" ></el-input>
        </el-form-item>
        <el-form-item label="IP" prop="ip">
            <optional-field :default="'0.0.0.0'" v-model="modelValue.ip">
                <template #some>
                    <el-input v-model="modelValue.ip" ></el-input>
                </template>
                <template #none>
                    <span>{{ '[::]' }}</span>
                </template>
            </optional-field>
        </el-form-item>
        <el-form-item :label="t('label.port')" prop="port">
            <el-input-number v-model="modelValue.port"  v-bind="PORT_INPUT_ATTR" class="port-input"></el-input-number>
        </el-form-item>
        <el-form-item :label="t('label.protocolType')" prop="protocol">
            <el-select v-model="modelValue.protocol.type" placeholder="Protocol">
                <el-option label="http" value="http"></el-option>
                <el-option label="https" value="https"></el-option>
            </el-select>
        </el-form-item>
        <el-form-item :label="t('label.hostname')" prop="hostname">
            <optional-field :default="'localhost'" v-model="modelValue.hostname">
                <template #some>
                    <el-input v-model="modelValue.hostname"  ></el-input>
                </template>
            </optional-field>
        </el-form-item>
        <el-form-item :label="t('label.tlsConfig')" v-if="modelValue.protocol.type === 'https'">
            <el-select v-model="modelValue.protocol.tls.mode" placeholder="Tls Mode">
                <el-option label="Terminate" value="Terminate"></el-option>
                <el-option label="Passthrough" value="Passthrough"></el-option>
            </el-select>
            <el-input type='textarea' v-model="modelValue.protocol.tls.key" placeholder="Key"></el-input>
            <el-input type='textarea' v-model="modelValue.protocol.tls.cert" placeholder="Cert"></el-input>
        </el-form-item>

    </el-form>
</template>

<style scoped>

</style>