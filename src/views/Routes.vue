<script setup lang="ts">
import { Model, Api } from 'spacegate-admin-client'
import { Delete, Edit, Plus, Refresh, Check, Close } from '@element-plus/icons-vue'

import { computed, ref, onMounted, watch } from 'vue';
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
    route_name: 'new route',
    hostnames: null,
    plugins: [],
    rules: [],
    priority: 1,
})
const resetDialogModel = () => {
    dialogModel.value = {
        route_name: 'new route',
        hostnames: null,
        plugins: [],
        rules: [],
        priority: 1,
    }
}
const dialogMode = ref<'create' | 'edit'>('create');
const openDialog = async (name: string, mode: 'create' | 'edit') => {
    dialogModel.value.route_name = name;
    dialogMode.value = mode;
    if (mode === 'edit') {
        const resp = await Api.getConfigItemRoute(props.gatewayName, name).then(unwrapResponse);
        if (resp === null) {
            ElMessage.error('route not found');
        } else {
            resp.plugins = resp.plugins ?? [];
            resp.rules = resp.rules ?? [];
            resp.rules.forEach(rule => {
                rule.plugins = rule.plugins ?? [];
                rule.backends = rule.backends ?? [];
                rule.matches = rule.matches ?? [];
                rule.backends.plugins = rule.backends.plugins ?? [];
            })
            dialogModel.value = resp;
            console.debug(dialogModel.value)
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
        const resp = await Api.getConfigItemRouteNames(props.gatewayName).then(unwrapResponse);
        routeNames.value = resp;
    } finally {
        routeNamesPending.value = false;
    }
}
const putRoute = async (name: string, route: Model.SgHttpRoute) => {
    await Api.putConfigItemRoute(props.gatewayName, name, route).catch(catchAdminServerError)
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
    await Api.postConfigItemRoute(props.gatewayName, name, route).catch(catchAdminServerError);
    await getRouteNames();
}
const deleteRoute = async (name: string) => {
    await ElMessageBox.confirm('Are you sure to delete this route?', {
        confirmButtonClass: 'el-button--danger',
    });
    routeNamesPending.value = true
    try {
        await Api.deleteConfigItemRoute(props.gatewayName, name).catch(catchAdminServerError);
        await getRouteNames();
    } finally {
        routeNamesPending.value = false;
    }
}

onMounted(() => {
    getRouteNames()
})

watch(() => props.gatewayName, refresh)
</script>

<template>
    <div class="flex flex-col space-y-2">
        <el-dialog width="90%" :title="dialogMode === 'create' ? t('title.createRoute') : t('title.editRoute')" v-model="dialogOpen" destroy-on-close>
            <RouteForm v-model="dialogModel" :name="dialogModel.route_name" :mode="dialogMode"></RouteForm>
            <template #footer>
                <el-button :icon="Close" @click="closeDialog">
                    {{ t('button.cancel') }}
                </el-button>
                <el-button type="primary" :icon="Check" @click="async () => {
            try {
                if (dialogMode === 'create') {
                    await postRoute(dialogModel.route_name, dialogModel)
                } else if (dialogMode === 'edit') {
                    await putRoute(dialogModel.route_name, dialogModel)
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