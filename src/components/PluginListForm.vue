<script setup lang="ts">
import { Model } from 'spacegate-admin-client';
import { Plus, Minus, Close, ArrowDown, ArrowRight, Check } from '@element-plus/icons-vue'
import { cloneDeep } from 'lodash';
import { ref } from 'vue';
import { hashColor, labelPluginId, keyPluginId } from '../utils';
import PluginSelect from './PluginSelect.vue';
import { useI18n } from 'vue-i18n'
import Draggable from 'vuedraggable'
const { t } = useI18n();
const modelValue = defineModel<Model.PluginInstanceId[]>({
    default: []
})
const isOpen = ref(false)
const mode = ref<'add' | 'edit' | undefined>('add')
const formData = ref<Model.PluginInstanceId | undefined>(undefined)
const selectRef = ref<InstanceType<typeof PluginSelect>>(null)
const editIndex = ref(0);
const open = (m: 'add' | 'edit', plugins?: Model.PluginInstanceId) => {
    mode.value = m;
    formData.value = plugins ? cloneDeep(plugins) : undefined;
    isOpen.value = true;
}
const addPlugin = () => {
    if (formData.value) {
        modelValue.value = [...modelValue.value, formData.value]
    }
}
const close = () => {
    isOpen.value = false
    mode.value = undefined
    formData.value = undefined
}
</script>
<template>
    <div class="flex space-x-1">
        <draggable 
        v-model="modelValue" 
        tag="transition-group"
        >
            <template #item="{element: plugin , index}" item-key="code">
                <el-tag  :key="index"closable @close="modelValue.splice(index, 1)"
                        class="hover:cursor-pointer hover:brightness-110 focus:bg-blue-500">
                    <span class="pr-2">: :</span>
                    <code class="rounded bg-black text-white bg-opacity-60 px-1"  :color="hashColor(plugin.code, 'light')">{{ plugin.code }}</code>
                    {{ labelPluginId(plugin) }}
                </el-tag>
            </template>
        </draggable>
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