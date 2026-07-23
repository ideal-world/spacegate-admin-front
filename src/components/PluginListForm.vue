<script setup lang="ts">
import { Api, Model } from 'spacegate-admin-client'
import { Check, Plus, Rank } from '@element-plus/icons-vue'
import { computed, onMounted, ref, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

import { hashColor, keyPluginId, unwrapResponse } from '../utils'
import {
    isWasmPluginCode,
    type ManagedPluginConfig,
} from '../utils/pluginInstance'
import {
    isSamePluginInstanceRef,
    pluginInstanceDisplayName,
    type PluginConfigLike,
} from '../utils/wasmPlugin'
import PluginBindingDetail from './PluginBindingDetail.vue'
import PluginSelect from './PluginSelect.vue'

const { locale, t } = useI18n()
const props = withDefaults(defineProps<{
    bindingScope?: 'gateway' | 'route' | 'rule' | 'backend'
    bindingName?: string
}>(), {
    bindingScope: 'route',
    bindingName: '',
})
const modelValue = defineModel<Model.PluginBinding[]>({
    required: true,
})
const texts = computed(() => locale.value.startsWith('zh') ? {
    intro: '选择插件类型后，可以引用已有插件配置，也可以创建一份自定义配置并立即绑定到当前资源。',
} : {
    intro: 'After selecting a plugin type, you can reference an existing plugin configuration or create a custom configuration and bind it immediately.',
})

const isOpen = ref(false)
const formData = ref<Model.PluginInstanceId | undefined>()
const priority = ref(0)
const selectRef = ref<InstanceType<typeof PluginSelect> | null>(null)
const pluginConfigs = shallowRef<Model.PluginConfig[]>([])
const configsLoading = ref(false)
const configError = ref<string>()
const detailVisible = ref(false)
const selectedBinding = ref<Model.PluginBinding>()

/** 读取完整实例配置，失败时仍保留现有挂载编辑能力。 */
async function refreshPluginConfigs() {
    configsLoading.value = true
    try {
        pluginConfigs.value = unwrapResponse<Model.PluginConfig[]>(await Api.getConfigPluginAll())
        configError.value = undefined
    } catch (error: unknown) {
        configError.value = error instanceof Error ? error.message : String(error)
    } finally {
        configsLoading.value = false
    }
}

function findPluginConfig(binding: Model.PluginInstanceId): Model.PluginConfig | undefined {
    return pluginConfigs.value.find((config) => isSamePluginInstanceRef(config, binding))
}

function displayPluginName(binding: Model.PluginBinding): string {
    return pluginInstanceDisplayName(binding, pluginConfigs.value as PluginConfigLike[])
}

function tagType(binding: Model.PluginBinding): string {
    return isWasmPluginCode(binding.code) ? t('label.wasm') : t('label.native')
}

function openAdd() {
    formData.value = undefined
    priority.value = 0
    isOpen.value = true
}

function closeAdd() {
    isOpen.value = false
    formData.value = undefined
}

function pluginBindingFromForm(): Model.PluginBinding | undefined {
    const plugin = formData.value
    if (!plugin) return undefined
    return {
        ...plugin,
        priority: priority.value,
    } as Model.PluginBinding
}

async function savePlugin() {
    await selectRef.value?.save()
    const binding = pluginBindingFromForm()
    if (!binding) return
    modelValue.value.push(binding)
    await refreshPluginConfigs()
    closeAdd()
}

const draggedIndex = ref<number>()

function dragstart(index: number) {
    draggedIndex.value = index
}

function drop(index: number) {
    if (draggedIndex.value === undefined) return
    const [draggedItem] = modelValue.value.splice(draggedIndex.value, 1)
    modelValue.value.splice(index, 0, draggedItem)
    draggedIndex.value = undefined
}

function openDetail(binding: Model.PluginBinding) {
    selectedBinding.value = binding
    detailVisible.value = true
    if (!findPluginConfig(binding) && !configsLoading.value) {
        void refreshPluginConfigs()
    }
}

const selectedConfig = computed(() =>
    selectedBinding.value ? findPluginConfig(selectedBinding.value) : undefined
)

/** 优先级只更新挂载关系；展示名称通过实例配置 API 单独保存。 */
async function saveDetail(value: { priority: number; config?: ManagedPluginConfig }) {
    const binding = selectedBinding.value
    if (!binding) return
    try {
        if (value.config) {
            await Api.putConfigPlugin(value.config)
            const index = pluginConfigs.value.findIndex((config) => isSamePluginInstanceRef(config, value.config!))
            if (index >= 0) {
                const next = [...pluginConfigs.value]
                next[index] = value.config
                pluginConfigs.value = next
            }
        }
        binding.priority = value.priority
        detailVisible.value = false
    } catch (error: unknown) {
        ElMessage.error(error instanceof Error ? error.message : String(error))
    }
}

onMounted(() => {
    void refreshPluginConfigs()
})
</script>

<template>
    <div class="flex space-x-1">
        <el-tag
            v-for="(plugin, index) in modelValue"
            :key="`${keyPluginId(plugin)}-${index}`"
            closable
            :color="hashColor(plugin.code, 'light')"
            class="hover:cursor-pointer hover:brightness-110"
            @close.stop="modelValue.splice(index, 1)"
            @click="openDetail(plugin)"
        >
            <el-tooltip :content="t('hint.priorityTieOrder')">
                <el-icon
                    class="mx-1 text-gray-900"
                    draggable="true"
                    @click.stop
                    @dragstart="dragstart(index)"
                    @dragover.prevent
                    @drop="drop(index)"
                >
                    <Rank />
                </el-icon>
            </el-tooltip>
            <code class="rounded bg-black text-white bg-opacity-60 px-1">{{ tagType(plugin) }}</code>
            {{ displayPluginName(plugin) }}
        </el-tag>
        <el-button :icon="Plus" size="small" @click="openAdd">
            {{ t('button.addPlugin') }}
        </el-button>
    </div>

    <el-drawer
        v-model="isOpen"
        :title="t('title.newPlugin')"
        size="640px"
        class="plugin-bind-dialog"
        destroy-on-close
    >
        <div class="plugin-bind-dialog__intro">
            <strong>{{ t('title.newPlugin') }}</strong>
            <span>{{ texts.intro }}</span>
        </div>
        <plugin-select
            ref="selectRef"
            v-model="formData"
            :binding-scope="props.bindingScope"
            :binding-name="props.bindingName"
        />
        <el-form label-width="auto" label-suffix=":">
            <el-form-item :label="t('label.priority')">
                <el-input-number v-model="priority" :step="100" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="closeAdd">{{ t('button.cancel') }}</el-button>
            <el-button type="primary" :icon="Check" @click="savePlugin">
                {{ t('button.save') }}
            </el-button>
        </template>
    </el-drawer>

    <plugin-binding-detail
        v-if="selectedBinding"
        v-model="detailVisible"
        :binding="selectedBinding"
        :config="selectedConfig"
        :loading="configsLoading"
        :error="configError"
        @save="saveDetail"
    />
</template>

<style scoped>
.plugin-bind-dialog__intro {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 16px;
    padding: 12px;
    border: 1px solid #dbe3ef;
    border-radius: 8px;
    background: #f8fafc;
}

.plugin-bind-dialog__intro strong {
    color: #0f172a;
    font-size: 14px;
}

.plugin-bind-dialog__intro span {
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
}
</style>
