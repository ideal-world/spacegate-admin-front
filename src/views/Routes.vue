<script setup lang="ts">
import { Model, Api } from 'spacegate-admin-client'
import { Delete, Edit, Plus, Refresh, Check, Close } from '@element-plus/icons-vue'

import { computed, ref, onMounted } from 'vue';
import { catchAdminServerError, unwrapResponse } from '../utils';
import { ElMessage, ElMessageBox } from 'element-plus';
import RouteForm from '../components/RouteForm.vue';
import { useI18n } from 'vue-i18n'
const { t } = useI18n();

const props = defineProps<{
    gatewayName: string
}>()

const routeNames = ref<string[]>([])
const search = ref<string>()
const showRouteNames = computed(() => {
    if (search.value === undefined) {
        return routeNames.value
    } else {
        const trimmed = search.value.trim();
        if (trimmed === '') {
            return routeNames.value
        } else {
            return routeNames.value.filter((name) => name.includes(trimmed))
        }
    }
})
const routeNamesPending = ref(true)
const dialogOpen = ref(false);
const dialogModel = ref<Model.SgHttpRoute>({
    gateway_name: props.gatewayName,
    hostnames: null,
    filters: [],
    rules: [],
    priority: 1,
})
const dialogRouteName = ref('new route');
const resetDialogModel = () => {
    dialogModel.value = {
        gateway_name: props.gatewayName,
        hostnames: null,
        filters: [],
        rules: [],
        priority: 1,
    }
}
const dialogMode = ref<'create' | 'edit'>('create');
const openDialog = async (name: string, mode: 'create' | 'edit') => {
    dialogRouteName.value = name;
    dialogMode.value = mode;
    if (mode === 'edit') {
        const resp = await Api.get_config_item_route(props.gatewayName, name).then(unwrapResponse);
        if (resp === null) {
            ElMessage.error('route not found');
        } else {
            dialogModel.value = resp;
        }
    } else if (mode === 'create') {
        resetDialogModel()
    }
    dialogOpen.value = true;
}
const closeDialog = () => {
    dialogOpen.value = false;
    resetDialogModel()
}
const refresh = () => {
    getRouteNames()
}
const getRouteNames = async () => {
    routeNamesPending.value = true
    try {
        const resp = await Api.get_config_item_route_names(props.gatewayName).then(unwrapResponse);
        routeNames.value = resp;
    } finally {
        routeNamesPending.value = false;
    }
}
const putRoute = async (name: string, route: Model.SgHttpRoute) => {
    await Api.put_config_item_route(props.gatewayName, name, route).catch(catchAdminServerError)
    await getRouteNames();
}
class UserCancel extends Error {
    constructor() {
        super('user cancel');
    }
}
const postRoute = async (name: string, route: Model.SgHttpRoute) => {
    if (routeNames.value.includes(name)) {
        const action = await ElMessageBox.confirm(`route name \`${name}\` already exists`, {
            confirmButtonText: 'Overwrite',
            confirmButtonClass: 'el-button--danger',
        });
        if (action !== 'confirm') {
            throw new UserCancel();
        }
    }
    await Api.post_config_item_route(props.gatewayName, name, route).catch(catchAdminServerError);
    await getRouteNames();
}
const deleteRoute = async (name: string) => {
    await ElMessageBox.confirm('Are you sure to delete this route?', {
        confirmButtonClass: 'el-button--danger',
    });
    routeNamesPending.value = true
    try {
        await Api.delete_config_item_route(props.gatewayName, name).catch(catchAdminServerError);
        await getRouteNames();
    } finally {
        routeNamesPending.value = false;
    }
}

onMounted(() => {
    getRouteNames()
})
</script>

<template>
    <div class="flex flex-col space-y-2">
        <el-dialog width="90%" :title="dialogMode === 'create' ? t('title.createRoute') : t('title.editRoute')" v-model="dialogOpen">
            <el-input v-model="dialogRouteName" class="flex-grow my-3" placeholder="route name"
                :disabled="dialogMode === 'edit'"></el-input>
            <RouteForm v-model="dialogModel" :name="dialogRouteName" :mode="dialogMode"></RouteForm>
            <template #footer>
                <el-button :icon="Close" @click="closeDialog">
                    {{ t('button.cancel') }}
                </el-button>
                <el-button type="primary" :icon="Check" @click="async () => {
            try {
                if (dialogMode === 'create') {
                    await postRoute(dialogRouteName, dialogModel)
                } else if (dialogMode === 'edit') {
                    await putRoute(dialogRouteName, dialogModel)
                }
                closeDialog()
            } catch (e) {
                if (e === undefined || e instanceof UserCancel) {
                    // do nothing
                } else {
                    throw e
                }
            }
        }">
                    {{ t('button.save') }}
                </el-button>
            </template>
        </el-dialog>
        <div class="flex align-center space-x-2">
            <div class="flex-grow">
                <el-input v-model="search" class="" placeholder="search route">

                </el-input>
            </div>
            <el-button-group class="flex">
                <el-button :icon="Plus" type="primary" @click="() => openDialog('new route', 'create')">
                    {{ t('button.new') }}
                </el-button>
                <el-button :icon="Refresh" @click="refresh">
                    {{ t('button.refresh') }}
                </el-button>
            </el-button-group>
        </div>
        <el-card v-loading="routeNamesPending" shadow="never">
            <div class="flex flex-wrap items-start space-y-2 space-x-2">
                <el-card shadow="hover" v-for="routeName, idx in showRouteNames"
                    class="inline-block flex justify-between border-b border-gray-300 p-2 my-2">
                    <span class="flex-grow mx-2">{{ routeName }}</span>
                    <el-button-group>
                        <el-button :icon="Edit" size="small" @click="() => openDialog(routeName, 'edit')">
                            {{ t('button.edit') }}
                        </el-button>
                        <el-button type="danger" size="small" :icon="Delete" @click="() => deleteRoute(routeName)">
                            {{ t('button.delete') }}
                        </el-button>
                    </el-button-group>
                </el-card>
            </div>
        </el-card>
    </div>
</template>