
<script setup lang="ts">
import { Model, Api } from 'spacegate-admin-client';
import { onMounted, ref } from 'vue';
import { catchAdminServerError, unwrapResponse } from '../utils';
import { ElMessage } from 'element-plus';
import SelectedGateway from './SelectGateway.vue'

import { useI18n } from 'vue-i18n'
const { t } = useI18n();

const instanceList = ref<{
    id: string,
    healthy?: boolean
} []>(
   
[]);
const gatewayReloadDialogVisible = ref(false);
const selectedInstance = ref<string>();
const selectedGateway = ref('');
const gatewayList = ref([])
onMounted(async () => {
        try {
            (async () => {
                gatewayList.value = await Api.getConfigNames().then(unwrapResponse<string[]>)
            })();
            const resp =  await Api.discoveryInstanceList().then(unwrapResponse)
            const newList = [];
            for (const id of resp) {
                newList.push({
                    id
                })
            }
            instanceList.value = newList
            const healthyStatus = await Api.discoveryInstanceHealth().then(unwrapResponse);
            const newInstanceList = [...instanceList.value]
            for (const instance of newInstanceList) {
                instance.healthy = healthyStatus[instance.id] ?? undefined
            }
            instanceList.value = newInstanceList
            
        } catch(e) {
            catchAdminServerError(e)
        }
});

function getStatusType(status) {
    if (status === true) return 'success';
    if (status === false) return 'danger';
    return 'info';
}

function getStatusText(status) {
    if (status === true) return '✅';
    if (status === false) return '⛔';
    return '🚧';
}

function handleGlobalReload(instance) {
    // Logic for global reload will be implemented here
    ElMessage.info(`Global reload triggered for instance: ${instance.id}`);
}

function openGatewayReloadDialog(instance) {
    selectedInstance.value = instance.id;
    gatewayReloadDialogVisible.value = true;
}

function handleGatewayReload(instance: string) {
    if (!selectedGateway.value) {
        ElMessage.warning('Please select a gateway');
        return;
    }
    
    ElMessage.success(`Reloading gateway ${selectedGateway.value} for instance ${instance}`);
    Api.discoveryInstanceReloadGateway(instance, selectedGateway.value).then(unwrapResponse).catch(catchAdminServerError);
    gatewayReloadDialogVisible.value = false;
    selectedGateway.value = '';
}
</script>

<template>
    <div class="">
        <el-table :data="instanceList" style="width: 100%">
            <el-table-column prop="id" label="ID">
                <template #default="scope">
                    <div class="flex align-center space-x-10">
                        {{ scope.row.id }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="healthy" :label="t('label.health')">
                <template #default="scope">
                    <div class="flex align-center space-x-10">
                        <el-tag :type="getStatusType(scope.row.healthy)" size="small">
                            {{getStatusText(scope.row.healthy)}}
                        </el-tag>
                    </div>
                </template>
            </el-table-column>
            <!-- <el-table-column prop="ip" label="IP"></el-table-column> -->
            <el-table-column :label="t('label.operation')" >
                <template #default="scope">
                    <el-button-group>
                        <el-button size="small" class="" type="danger" @click="handleGlobalReload(scope.row)">
                            {{t('button.globalReload')}}
                        </el-button>
                        <el-button size="small" class="" type="warning" @click="openGatewayReloadDialog(scope.row)">
                            {{t('button.gatewayReload')}}
                        </el-button>
                    </el-button-group>
                </template>
            </el-table-column>
        </el-table>

        <el-dialog
            :title="t('title.gatewayReload')"
            v-model="gatewayReloadDialogVisible"
            width="30%"
            
            >
            <p>{{t('hint.currentInstance')}}: {{ selectedInstance?.id }}</p>
            <el-select v-model="selectedGateway" :placeholder="t('hint.selectGateway')" style="width: 100%">
                <el-option
                    v-for="item in gatewayList"
                    :key="item"
                    :label="item"
                    :value="item">
                </el-option>
            </el-select>
            <template #footer>
                <span class="flex justify-end">
                    <el-button @click="gatewayReloadDialogVisible = false">{{t('button.cancel')}}</el-button>
                    <el-button type="primary" @click="() => handleGatewayReload(selectedInstance)">{{t('button.confirm')}}</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>