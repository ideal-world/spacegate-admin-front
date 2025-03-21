<script setup lang="ts">
import { Model, Api } from 'spacegate-admin-client'
import { Delete, Plus, Close, Download, Upload, Check } from '@element-plus/icons-vue'

import { ref, onMounted, defineProps } from 'vue';
import { ValidError, downloadConfigItem, unwrapResponse, uploadConfigItem } from '../utils';
import { ElMessageBox, ElMessage, } from 'element-plus';
import { cloneDeep } from 'lodash';
import GatewayForm from './GatewayForm.vue';
import { useI18n } from 'vue-i18n'
const { t } = useI18n();

const modelValue = defineModel<string>()
const options = ref<string[]>([])
const optionsPending = ref(true)
const newGatewayDialog = ref(false)
const DEFAULT_NEW_GATEWAY: Model.SgGateway = {
    name: 'New-Gateway',
    parameters: {
        redis_url: null,
        log_level: null,
        lang: null,
        enable_x_request_id: false,
        ignore_tls_verification: null,
    },
    listeners: [],
    plugins: [],
}
const newGateway = ref<Model.SgGateway>(cloneDeep(DEFAULT_NEW_GATEWAY))
const getOptions = async () => {
    optionsPending.value = true
    try {
        const resp = await Api.getConfigNames().then(unwrapResponse<string[]>);
        options.value = resp;
        if (options.value.length > 0 && modelValue.value === undefined) {
            modelValue.value = options.value[0]
        }
    } finally {
        optionsPending.value = false;
    }
}

const deleteOptions = async (name: string) => {
    await ElMessageBox.confirm(t('hint.confirmDeleteGateway'), {
        confirmButtonClass: 'el-button--danger',
    });
    optionsPending.value = true
    try {
        await Api.deleteConfigItemGateway(name);
        await getOptions();
        modelValue.value = options.value[0]
    } finally {
        optionsPending.value = false;
    }
}

const openDialog = () => {
    newGateway.value = cloneDeep(DEFAULT_NEW_GATEWAY)
    newGatewayDialog.value = true
}

const createNewRoute = async () => {
    if (newGateway.value.name === '') {
        ElMessage.error(t('hint.missingGatewayName'));
        throw new ValidError()
    }
    if (options.value.includes(newGateway.value.name)) {
        ElMessage.error(t('hint.duplicatedGatewayName'));
        throw new ValidError()
    }
    await Api.postConfigItemGateway(newGateway.value.name, newGateway.value).then(unwrapResponse);
    await getOptions();
}



const closeDialog = () => {
    newGatewayDialog.value = false
}

const uploadConfigWithConfirm = async (name: string) => {
    let result = await ElMessageBox.confirm(
        t('hint.confirmOverwriteConfig'),
        {
            confirmButtonClass: 'el-button--danger'
        }
    )
    if (result === 'confirm') {
        await uploadConfigItem(name)
    }
}
onMounted(() => {
    getOptions()
})

</script>

<template>
    <el-select v-loading="optionsPending" v-model="modelValue" placeholder="Select a gateway">
        <template #header>
            <el-dialog v-model="newGatewayDialog" width="70%" align-center :close-on-click-modal="false" append-to-body>
                <GatewayForm v-model="newGateway" mode="create" class="flex-grow space-y-2"></GatewayForm>
                <template #footer>
                    <el-button :icon="Close" @click="closeDialog">
                        {{ t('button.cancel') }}
                    </el-button>
                    <el-button :icon="Check" type="primary" @click="async () => {
                        try {
                            await createNewRoute()
                            closeDialog()
                        } catch (e) {
                            console.error(e)
                        }
                    }">
                        {{ t('button.create') }}
                    </el-button>
                </template>
            </el-dialog>
            <el-button :icon="Plus" type="primary" class="flex-grow w-full" @click="openDialog">
                {{ t('button.add') }}
            </el-button>
        </template>
        <el-option v-for="item in options" :key="item" :label="item" :value="item"
            class="flex items-center justify-between">
            <span class="flex-grow">{{ item }}</span>
            <el-button-group>
                <el-button size="small" :icon="Upload" @click="() => uploadConfigWithConfirm(item)">
                    {{ t('button.upload') }}
                </el-button>
                <el-button size="small" :icon="Download" @click="() => downloadConfigItem(item)">
                    {{ t('button.download') }}
                </el-button>
                <el-button type="danger" size="small" :icon="Delete" @click="() => deleteOptions(item)">
                    {{ t('button.delete') }}
                </el-button>
            </el-button-group>
        </el-option>
    </el-select>
</template>