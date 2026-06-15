<script setup lang="ts">
import { Model } from 'spacegate-admin-client'
import { computed, watch } from 'vue';
import OptionalField from "./OptionalField.vue";
import { PORT_INPUT_ATTR } from '../constants';
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n();

const texts = computed(() => locale.value.startsWith('zh') ? {
    defaultIp: '默认 IPv6',
    anyHost: '任意主机',
} : {
    defaultIp: 'Default IPv6',
    anyHost: 'Any Host',
})

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
    <el-form label-position="top" class="listener-form">
        <el-form-item :label="t('label.name')" prop="name">
            <el-input v-model="modelValue.name"></el-input>
        </el-form-item>
        <el-form-item label="IP" prop="ip">
            <optional-field :default="'0.0.0.0'" v-model="modelValue.ip">
                <template #some>
                    <el-input v-model="modelValue.ip"></el-input>
                </template>
                <template #none>
                    <el-tag type="info" effect="plain">{{ texts.defaultIp }}</el-tag>
                </template>
            </optional-field>
        </el-form-item>
        <el-form-item :label="t('label.port')" prop="port">
            <el-input-number v-model="modelValue.port" v-bind="PORT_INPUT_ATTR" class="port-input"></el-input-number>
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
                    <el-input v-model="modelValue.hostname"></el-input>
                </template>
                <template #none>
                    <el-tag type="info" effect="plain">{{ texts.anyHost }}</el-tag>
                </template>
            </optional-field>
        </el-form-item>
        <el-form-item :label="t('label.tlsConfig')" v-if="modelValue.protocol.type === 'https'" class="listener-form__tls">
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
.listener-form {
    display: grid;
    grid-template-columns: minmax(160px, 1.2fr) minmax(140px, 1fr) 140px minmax(150px, 1fr) minmax(180px, 1.2fr);
    gap: 12px;
}

.listener-form :deep(.el-form-item) {
    margin-bottom: 0;
}

.listener-form :deep(.el-form-item__label) {
    color: #334155;
    font-weight: 600;
}

.listener-form :deep(.el-select),
.listener-form :deep(.el-input),
.listener-form :deep(.el-input-number) {
    width: 100%;
}

.listener-form__tls {
    grid-column: 1 / -1;
}

@media (max-width: 1100px) {
    .listener-form {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 700px) {
    .listener-form {
        grid-template-columns: 1fr;
    }
}
</style>
