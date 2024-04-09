<script setup lang="ts">
import { Model } from 'spacegate-admin-client';
import { Plus, Minus, Close, ArrowDown, ArrowRight, Check } from '@element-plus/icons-vue'
import { cloneDeep } from 'lodash';
import { ref } from 'vue';
import { hashColor, labelPluginId, keyPluginId } from '../utils';
import PluginSelect from './PluginSelect.vue';
import { useI18n } from 'vue-i18n'
const { t } = useI18n();
const modelValue = defineModel<Model.PluginInstanceId[]>({
    default: []
})
const isOpen = ref(false)
const mode = ref<'add' | 'edit' | undefined>('add')
const formData = ref<Model.PluginInstanceId | undefined>(undefined)
const editIndex = ref(0);
const open = (m: 'add' | 'edit', filter?: Model.PluginInstanceId) => {
    mode.value = m;
    formData.value = filter ? cloneDeep(filter) : undefined;
    isOpen.value = true;
}
const close = () => {
    isOpen.value = false
    mode.value = undefined
    formData.value = undefined
}
</script>
<template>
    <div class="flex space-x-1">
        <el-tag v-for="(plugin, index) in modelValue" :key="plugin.code" closable @close="modelValue.splice(index, 1)"
            @click="() => {
                editIndex = index
                open('edit', plugin)
            }" :color="hashColor(plugin.code, 'light')" class="hover:cursor-pointer hover:brightness-110">

            <code class="rounded bg-black text-white bg-opacity-60 px-1">{{ plugin.code }}</code>
            {{ labelPluginId(plugin) }}
        </el-tag>
        <el-button :icon="Plus" size="small" @click="() => open('add')">{{ t('button.addPlugin') }}
        </el-button>
    </div>
    <el-dialog v-model="isOpen" :title="mode === 'add' ? t('title.newPlugin') : t('title.editPlugin')">
        <plugin-select v-model="formData"></plugin-select>
        <template #footer>
            <el-button type="primary" :icon="Check" @click="() => {
                close()
            }">
                {{ t('button.save') }}
            </el-button>
        </template>
    </el-dialog>
</template>