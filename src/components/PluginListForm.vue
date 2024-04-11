<script setup lang="ts">
import { Model } from 'spacegate-admin-client';
import { Plus, Minus, Close, ArrowDown, ArrowRight, Check, Operation } from '@element-plus/icons-vue'
import { cloneDeep } from 'lodash';
import { ref } from 'vue';
import { hashColor, labelPluginId, keyPluginId } from '../utils';
import PluginSelect from './PluginSelect.vue';
import { useI18n } from 'vue-i18n'
import Draggable from 'vuedraggable'
import { PluginInstanceId } from 'spacegate-admin-client/dist/model';
const { t } = useI18n();
const modelValue = defineModel<Model.PluginInstanceId[]>({
    default: []
})
const isOpen = ref(false)
const mode = ref<'add' | 'edit' | undefined>('add')
const formData = ref<Model.PluginInstanceId | undefined>(undefined)
const plugins = ref<Model.PluginInstanceId[]>(modelValue.value)
const selectRef = ref<InstanceType<typeof PluginSelect>>(null)
const editIndex = ref(0);
const open = (m: 'add' | 'edit', plugin?: Model.PluginInstanceId) => {
    mode.value = m;
    formData.value = plugin ? cloneDeep(plugin) : undefined;
    isOpen.value = true;
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
        modelValue.value.push(getFormData())
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
        <el-tag v-for="(plugin, index) in plugins" :key="keyPluginId(plugin)" closable
            @close="modelValue.splice(index, 1)" :color="hashColor(plugin.code, 'light')"
            @click="() => open('edit', plugin)"
            class="hover:cursor-pointer hover:brightness-110"
            >
            <span class="mx-1 text-gray-900"  draggable="true" @dragstart="dragstart(index)" @dragover.prevent
                @drop="drop(index)">:::</span>
            <code class="rounded bg-black text-white bg-opacity-60 px-1">{{ plugin.code }}</code>
            {{ labelPluginId(plugin) }}
        </el-tag>
        <el-button :icon="Plus" size="small" @click="() => open('add')">{{ t('button.addPlugin') }}
        </el-button>
    </div>
    <el-dialog v-model="isOpen" :title="mode === 'add' ? t('title.newPlugin') : t('title.editPlugin')">
        <plugin-select ref="selectRef" v-model="formData"></plugin-select>
        <template #footer>
            <el-button type="primary" :icon="Check" @click="() => {
                close()
            }">
                {{ t('button.cancel') }}
            </el-button>
            <el-button type="primary" :icon="Check" @click="async () => {
                await selectRef.save()
                addPlugin()
                close()
            }">
                {{ t('button.save') }}
            </el-button>
        </template>
    </el-dialog>
</template>