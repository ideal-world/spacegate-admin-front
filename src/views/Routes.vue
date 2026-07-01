<script setup lang="ts">
import { Model, Api } from 'spacegate-admin-client'
import { Delete, Edit, Plus, Refresh, Check, Close } from '@element-plus/icons-vue'

import { computed, ref, onMounted, watch } from 'vue';
import { catchAdminServerError, unwrapResponse } from '../utils';
import { ElMessage, ElMessageBox } from 'element-plus';
import RouteForm from '../components/RouteForm.vue';
import McpRouteForm from '../components/McpRouteForm.vue';
import { useI18n } from 'vue-i18n'
const { t } = useI18n();

const props = defineProps<{
    gatewayName: string
}>()

const routeNames = ref<string[]>([])
const routes = ref<Record<string, Model.SgRoute>>({})
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
const isMcpRoute = (route: Model.SgRoute): route is Model.SgMcpRoute => {
    return (route as Model.SgMcpRoute).kind === 'MCPRoute'
}
const newBackend = (): Model.SgBackendRef => ({
    host: {
        kind: 'Host',
        host: 'example.com',
    },
    port: 80,
    timeout_ms: null,
    timeout_mode: null,
    protocol: 'http',
    downgrade_http2: null,
    weight: 1,
    plugins: [],
})
const newHttpRoute = (name: string): Model.SgHttpRoute => ({
    route_name: name,
    hostnames: null,
    plugins: [],
    rules: [],
    priority: 1,
})
const newMcpRoute = (name: string): Model.SgMcpRoute => ({
    kind: 'MCPRoute',
    route_name: name,
    hostnames: null,
    transport: 'streamable_http',
    path: '/mcp',
    legacy_sse: null,
    backends: [newBackend()],
    plugins: [],
    timeout_mode: 'disabled',
    session_affinity: 'mcp_session',
})
const dialogModel = ref<Model.SgRoute>(newHttpRoute('new route'))
const dialogRouteType = ref<'http' | 'mcp'>('http')
const httpDialogModel = computed<Model.SgHttpRoute>({
    get: () => dialogModel.value as Model.SgHttpRoute,
    set: (value) => dialogModel.value = value,
})
const mcpDialogModel = computed<Model.SgMcpRoute>({
    get: () => dialogModel.value as Model.SgMcpRoute,
    set: (value) => dialogModel.value = value,
})
const resetDialogModel = () => {
    dialogModel.value = dialogRouteType.value === 'mcp' ? newMcpRoute('new route') : newHttpRoute('new route')
}
const routeTypeLabel = (routeName: string) => {
    const route = routes.value[routeName];
    if (route === undefined) {
        return 'HTTPRoute'
    }
    return isMcpRoute(route) ? 'MCPRoute' : 'HTTPRoute'
}
const setDialogRouteType = (type: 'http' | 'mcp') => {
    dialogRouteType.value = type;
    const routeName = dialogModel.value.route_name;
    dialogModel.value = type === 'mcp' ? newMcpRoute(routeName) : newHttpRoute(routeName);
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
            dialogRouteType.value = isMcpRoute(resp) ? 'mcp' : 'http';
            resp.plugins = resp.plugins ?? [];
            if (isMcpRoute(resp)) {
                resp.backends = resp.backends ?? [];
                resp.backends.forEach(backend => {
                    backend.plugins = backend.plugins ?? [];
                    backend.timeout_mode = backend.timeout_mode ?? resp.timeout_mode;
                })
            } else {
                resp.rules = resp.rules ?? [];
                resp.rules.forEach(rule => {
                    rule.plugins = rule.plugins ?? [];
                    rule.backends = rule.backends ?? [];
                    rule.matches = rule.matches ?? [];
                })
            }
            dialogModel.value = resp;
            console.debug(dialogModel.value)
        }
    } else if (mode === 'create') {
        dialogRouteType.value = 'http';
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
        const resp = await Api.getConfigItemAllRoutes(props.gatewayName).then(unwrapResponse);
        routes.value = resp;
        routeNames.value = Object.keys(resp);
    } finally {
        routeNamesPending.value = false;
    }
}
const putRoute = async (name: string, route: Model.SgRoute) => {
    await Api.putConfigItemRoute(props.gatewayName, name, route).catch(catchAdminServerError)
    await getRouteNames();
}
class UserCancel extends Error {
    constructor() {
        super('user cancel');
    }
}
const postRoute = async (name: string, route: Model.SgRoute) => {
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
            <el-form-item v-if="dialogMode === 'create'" label="Route Type" label-suffix=":">
                <el-radio-group :model-value="dialogRouteType" @change="(value) => setDialogRouteType(value as 'http' | 'mcp')">
                    <el-radio-button label="http">HTTPRoute</el-radio-button>
                    <el-radio-button label="mcp">MCPRoute</el-radio-button>
                </el-radio-group>
            </el-form-item>
            <RouteForm v-if="dialogRouteType === 'http'" v-model="httpDialogModel" :name="dialogModel.route_name" :mode="dialogMode"></RouteForm>
            <McpRouteForm v-else v-model="mcpDialogModel" :name="dialogModel.route_name"></McpRouteForm>
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
                    <div class="flex-grow mx-2 flex items-center space-x-2">
                        <span>{{ routeName }}</span>
                        <el-tag size="small" :type="routeTypeLabel(routeName) === 'MCPRoute' ? 'success' : 'info'">
                            {{ routeTypeLabel(routeName) }}
                        </el-tag>
                    </div>
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
