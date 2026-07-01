<script setup lang="ts">
import { Model } from 'spacegate-admin-client'
import { Plus, Minus, Close, Download, Upload } from '@element-plus/icons-vue'
import { ref, watch } from 'vue';
import BackendForm from './BackendForm.vue';
import PluginListForm from './PluginListForm.vue';
import OptionalField from './OptionalField.vue';
import { fetchJson, saveJson } from '../utils';
import { useI18n } from 'vue-i18n'

const { t } = useI18n();
const props = defineProps<{
    name: string
}>()

const defaultBackend = (): Model.SgBackendRef => ({
    host: {
        kind: "Host",
        host: "example.com",
    },
    port: 80,
    timeout_ms: null,
    timeout_mode: "disabled",
    protocol: "http",
    downgrade_http2: null,
    weight: 1,
    plugins: [],
})

const modelValue = defineModel<Model.SgMcpRoute>({
    default: (): Model.SgMcpRoute => ({
        kind: "MCPRoute",
        route_name: "",
        hostnames: null,
        transport: "streamable_http",
        path: "/mcp",
        legacy_sse: null,
        backends: [{
            host: {
                kind: "Host",
                host: "example.com",
            },
            port: 80,
            timeout_ms: null,
            timeout_mode: "disabled",
            protocol: "http",
            downgrade_http2: null,
            weight: 1,
            plugins: [],
        }],
        plugins: [],
        timeout_mode: "disabled",
        session_affinity: "mcp_session",
    }),
});

watch(() => modelValue.value.transport, (transport) => {
    if (transport === 'legacy_sse' && modelValue.value.legacy_sse === null) {
        modelValue.value.legacy_sse = {
            sse_path: '/sse',
            message_path: '/message',
        }
    }
    if (transport === 'streamable_http') {
        modelValue.value.legacy_sse = null;
    }
}, { immediate: true })

const addBackend = () => {
    modelValue.value.backends.push(defaultBackend())
}

const removeBackend = (idx: number) => {
    modelValue.value.backends.splice(idx, 1)
}

const downloadConfig = (target: 'file' | 'clipboard') => {
    saveJson(modelValue.value, `${props.name}`, target)
}

const uploadConfig = (target: 'file' | 'clipboard') => {
    fetchJson(target).then((json) => {
        modelValue.value = {
            ...json as Model.SgMcpRoute,
        }
    })
}

const downloadVisible = ref(false)
const uploadVisible = ref(false)
</script>

<template>
    <el-form label-width="auto" label-suffix=":">
        <el-button-group class="mb-4">
            <el-popover :visible="uploadVisible" placement="top" :width="160">
                <p>{{ t('hint.chooseASource') }}</p>
                <div>
                    <el-button size="small" type="primary" @click="() => {
                uploadConfig('clipboard')
                uploadVisible = false
            }">{{ t('button.clipboard') }}</el-button>
                    <el-button size="small" type="primary" @click="() => {
                uploadConfig('file')
                uploadVisible = false
            }">{{ t('button.file') }}</el-button>
                </div>
                <template #reference>
                    <el-button :icon="Upload" @click="uploadVisible = !uploadVisible">{{ t('button.upload')
                        }}</el-button>
                </template>
            </el-popover>
            <el-popover :visible="downloadVisible" placement="top" :width="160">
                <p>{{ t('hint.chooseATarget') }}</p>
                <div>
                    <el-button size="small" type="primary" @click="() => {
                downloadConfig('clipboard')
                downloadVisible = false
            }">{{ t('button.clipboard') }}</el-button>
                    <el-button size="small" type="primary" @click="() => {
                downloadConfig('file')
                downloadVisible = false
            }">{{ t('button.file') }}</el-button>
                </div>

                <template #reference>
                    <el-button :icon="Download" @click="downloadVisible = !downloadVisible">{{ t('button.download')
                        }}</el-button>
                </template>
            </el-popover>
        </el-button-group>
        <el-form-item :label="t('label.routeName')" prop="route_name">
            <el-input v-model="modelValue.route_name" placeholder="Route Name"></el-input>
        </el-form-item>
        <el-form-item :label="t('label.hostname')" prop="hostnames">
            <OptionalField v-model="modelValue.hostnames" :default="[]" class="flex flex-col flex-grow space-y-1">
                <template #some>
                    <div v-for="hostname, idx in modelValue.hostnames!" class="flex flex-row">
                        <el-input v-model="modelValue.hostnames![idx]" placeholder="Hostnames">
                        </el-input>
                        <el-button :icon="Minus" @click="() => modelValue.hostnames!.splice(idx, 1)"></el-button>
                    </div>
                    <el-button type="primary" @click="() => modelValue.hostnames!.push('')" :icon="Plus">
                        {{ t('button.addHost') }}
                    </el-button>
                </template>
            </OptionalField>
        </el-form-item>
        <el-form-item label="Transport" prop="transport">
            <el-segmented v-model="modelValue.transport" :options="[
                { label: 'Streamable HTTP', value: 'streamable_http' },
                { label: 'Legacy SSE', value: 'legacy_sse' },
            ]"></el-segmented>
        </el-form-item>
        <el-form-item v-if="modelValue.transport === 'streamable_http'" label="Path" prop="path">
            <el-input v-model="modelValue.path" placeholder="/mcp"></el-input>
        </el-form-item>
        <template v-if="modelValue.transport === 'legacy_sse' && modelValue.legacy_sse !== null">
            <el-form-item label="SSE Path" prop="legacy_sse.sse_path">
                <el-input v-model="modelValue.legacy_sse.sse_path" placeholder="/sse"></el-input>
            </el-form-item>
            <el-form-item label="Message Path" prop="legacy_sse.message_path">
                <el-input v-model="modelValue.legacy_sse.message_path" placeholder="/message"></el-input>
            </el-form-item>
        </template>
        <el-row>
            <el-col :span="12">
                <el-form-item label="Timeout Mode" prop="timeout_mode">
                    <el-select v-model="modelValue.timeout_mode">
                        <el-option label="disabled" value="disabled"></el-option>
                        <el-option label="request" value="request"></el-option>
                    </el-select>
                </el-form-item>
            </el-col>
            <el-col :span="12">
                <el-form-item label="Session Affinity" prop="session_affinity">
                    <el-select v-model="modelValue.session_affinity">
                        <el-option label="mcp_session" value="mcp_session"></el-option>
                        <el-option label="none" value="none"></el-option>
                    </el-select>
                </el-form-item>
            </el-col>
        </el-row>
        <el-form-item :label="t('label.plugins')" prop="plugins">
            <plugin-list-form v-model="modelValue.plugins" binding-scope="route" binding-name="mcp-route"></plugin-list-form>
        </el-form-item>
        <el-form-item :label="t('label.backends')" prop="backends">
            <div class="space-y-2 flex-grow overflow-auto">
                <el-card v-for="(backend, idx) in modelValue.backends" :name="idx" :key="idx" class="relative pt-6 flex-grow"
                    shadow="hover">
                    <el-button text circle @click="removeBackend(idx)" :icon="Close" class="absolute top-0 right-0 m-2">
                    </el-button>
                    <span class="absolute top-0 left-4 m-2 text-gray-500"> #{{ idx }}</span>
                    <backend-form v-model="modelValue.backends[idx]"></backend-form>
                </el-card>
                <el-button type="primary" @click="addBackend" :icon="Plus" class="w-full">
                    <span>{{ t('button.addBackend') }}</span>
                </el-button>
            </div>
        </el-form-item>
    </el-form>
</template>
