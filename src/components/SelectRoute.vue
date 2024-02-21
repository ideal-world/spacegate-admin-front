<script setup lang="ts">
import { Model, Api } from 'spacegate-admin-client'
import { Delete, Plus, Close } from '@element-plus/icons-vue'
import RouteForm from './RouteForm.vue'

import { computed, ref, onMounted } from 'vue';
import { ValidError, unwrapResponse } from '../utils';
import { ElMessageBox, ElMessage } from 'element-plus';
import { cloneDeep } from 'lodash';
import GatewayForm from './GatewayForm.vue';

const modelValue = defineModel<string>()
const options = ref<string[]>([])
const optionsPending = ref(true)
const newGatewayDialog = ref(false)
const DEFAULT_NEW_GATEWAY = {
    name: 'New Gateway',
    parameters: {
        redis_url: null,
        log_level: null,
        lang: null,
        ignore_tls_verification: null,
    },
    listeners: [],
    filters: [],
}
const newGateway = ref<Model.SgGateway>(cloneDeep(DEFAULT_NEW_GATEWAY))
const getOptions = async () => {
    optionsPending.value = true
    try {
        const resp = await Api.get_config_names().then(unwrapResponse);
        options.value = resp;
    } finally {
        optionsPending.value = false;
    }
}

const deleteOptions = async (name: string) => {
    await ElMessageBox.confirm('Are you sure to delete this gateway?', {
        confirmButtonClass: 'el-button--danger',
    });
    optionsPending.value = true
    try {
        await Api.delete_config_item_gateway(name);
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
        ElMessage.error('name is required');
        throw new ValidError()
    }
    if (options.value.includes(newGateway.value.name)) {
        ElMessage.error('name already exists');
        throw new ValidError()
    }
    await Api.post_config_item_gateway(newGateway.value.name, newGateway.value).then(unwrapResponse);
    await getOptions();
}



const closeDialog = () => {
    newGatewayDialog.value = false
}


onMounted(() => {
    getOptions()
})

</script>

<template>
    <el-select v-loading="optionsPending" v-model="modelValue" placeholder="Select a route">
        <template #header>
            <el-dialog v-model="newGatewayDialog">
                <GatewayForm v-model="newGateway" mode="create"></GatewayForm>
                <template #footer>
                    <el-button :icon="Close" @click="closeDialog">
                        {{ 'cancel' }}
                    </el-button>
                    <el-button :icon="Plus" type="primary" @click="async () => {
                        try {
                            await createNewRoute()
                            closeDialog()
                        } catch (e) {

                        }
                    }">
                        {{ 'create' }}
                    </el-button>
                </template>
            </el-dialog>
            <el-button :icon="Plus" type="primary" class="flex-grow w-full" @click="openDialog">
                {{ 'add' }}
            </el-button>
        </template>
        <el-option v-for="item in options" :key="item" :label="item" :value="item"
            class="flex items-center justify-between">
            <span>{{ item }}</span>
            <el-button type="danger" size="small" :icon="Delete" @click="() => deleteOptions(item)">
                {{ 'delete' }}
            </el-button>
        </el-option>
    </el-select>
</template>