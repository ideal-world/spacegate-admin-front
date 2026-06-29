<script setup lang="ts">
import { Model } from 'spacegate-admin-client';
import { Plus, Check } from '@element-plus/icons-vue'
import { cloneDeep } from 'lodash';
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { hashColor, labelPluginId, keyPluginId } from '../utils';
import PluginSelect from './PluginSelect.vue';
import { PluginInstanceId } from 'spacegate-admin-client/dist/model';
import { useI18n } from 'vue-i18n'
const { locale, t } = useI18n();
const props = withDefaults(defineProps<{
    bindingScope?: 'gateway' | 'route' | 'rule' | 'backend'
    bindingName?: string
}>(), {
    bindingScope: 'route',
    bindingName: '',
})
const modelValue = defineModel<Model.PluginInstanceId[]>({
    required: true,
})
const isOpen = ref(false)
const mode = ref<'add' | 'edit' | undefined>('add')
const formData = ref<Model.PluginInstanceId | undefined>(undefined)
const selectRef = ref<InstanceType<typeof PluginSelect> | null>(null)
const editIndex = ref(0);
const texts = computed(() => locale.value.startsWith('zh') ? {
    intro: '选择插件类型后，可以引用已有插件配置，也可以创建一份自定义配置并立即绑定到当前资源。',
} : {
    intro: 'After selecting a plugin type, you can reference an existing plugin configuration or create a custom configuration and bind it immediately.',
})
const open = (m: 'add' | 'edit', plugin?: Model.PluginInstanceId) => {
    mode.value = m;
    formData.value = plugin ? cloneDeep(plugin) : undefined;
    isOpen.value = true;
}
const openEdit = (plugin: Model.PluginInstanceId, index: number) => {
    editIndex.value = index
    open('edit', plugin)
}
const getFormData = (): PluginInstanceId => {
    switch (formData.value.kind) {
        case 'anon': return {
            code: formData.value.code,
            kind: formData.value.kind,
            uid: formData.value.uid,
        }
        case 'named': return {
            code: formData.value.code,
            kind: formData.value.kind,
            name: formData.value.name,
        }
        case 'mono': return {
            code: formData.value.code,
            kind: formData.value.kind,
        }
    }
}
const addPlugin = () => {
    if (formData.value) {
        const next = getFormData()
        if (mode.value === 'edit') {
            modelValue.value.splice(editIndex.value, 1, next)
        } else {
            modelValue.value.push(next)
        }
    }
}
const draggedIndex = ref(null);

const dragstart = (index) => {
    draggedIndex.value = index;
};

const drop = (index) => {
    const draggedItem = modelValue.value.splice(draggedIndex.value!, 1)[0];
    modelValue.value.splice(index, 0, draggedItem);
    draggedIndex.value = null;
};
const close = () => {
    isOpen.value = false
    mode.value = undefined
    formData.value = undefined
}
</script>
<template>
    <div class="flex space-x-1">
        <el-tag v-for="(plugin, index) in modelValue" :key="`${keyPluginId(plugin)}-${index}`" closable
            @close="modelValue.splice(index, 1)" :color="hashColor(plugin.code, 'light')"
            @click="() => openEdit(plugin, index)" class="hover:cursor-pointer hover:brightness-110">
            <span class="mx-1 text-gray-900" draggable="true" @dragstart="dragstart(index)" @dragover.prevent
                @drop="drop(index)">:::</span>
            <code class="rounded bg-black text-white bg-opacity-60 px-1">{{ plugin.code }}</code>
            {{ labelPluginId(plugin) }}
        </el-tag>
        <el-button :icon="Plus" size="small" @click="() => open('add')">{{ t('button.addPlugin') }}
        </el-button>
    </div>
    <el-drawer
        v-model="isOpen"
        :title="mode === 'add' ? t('title.newPlugin') : t('title.editPlugin')"
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
        ></plugin-select>
        <template #footer>
            <el-button @click="() => {
                close()
            }">
                {{ t('button.cancel') }}
            </el-button>
            <el-button type="primary" :icon="Check" @click="async () => {
                try {
                    await selectRef?.save()
                    addPlugin()
                    close()
                } catch (e) {
                    ElMessage.error(e instanceof Error ? e.message : String(e))
                }
            }">
                {{ t('button.save') }}
            </el-button>
        </template>
    </el-drawer>
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
