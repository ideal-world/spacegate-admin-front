<script setup lang="ts">
import { Model } from 'spacegate-admin-client';
import { Plus, Minus, Close, ArrowDown, ArrowRight, Check } from '@element-plus/icons-vue'
import { cloneDeep } from 'lodash';
import { ref } from 'vue';
import { hashColor } from '../utils';
import FilterForm from './FilterForm.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n();
const modelValue = defineModel<Model.SgRouteFilter[]>({
    default: []
})
const formRef = ref<InstanceType<typeof FilterForm> | null>(null)
const defaultFilter: Model.SgRouteFilter = {
    name: 'new filter',
    code: 'redirect',
    spec: {

    }
}
const isOpen = ref(false)
const mode = ref<'add' | 'edit' | undefined>('add')
const pickNewFilterName = (): string => {
    const name = `new filter ${modelValue.value.length + 1}`
    return modelValue.value.find((f) => f.name === name) ? pickNewFilterName() : name
}
const formData = ref<Model.SgRouteFilter>(cloneDeep(defaultFilter))
const editIndex = ref(0);
const open = (m: 'add' | 'edit', filter?: Model.SgRouteFilter) => {
    mode.value = m;
    formData.value = filter ? cloneDeep(filter) : cloneDeep(defaultFilter);
    isOpen.value = true;
}
const close = () => {
    isOpen.value = false
    mode.value = undefined
    formData.value = cloneDeep(defaultFilter)
}
</script>
<template>
    <div class="flex space-x-1">
        <el-tag v-for="(filter, index) in modelValue" :key="filter.code" closable @close="modelValue.splice(index, 1)"
            @click="() => {
            editIndex = index
            open('edit', filter)
        }" :color="hashColor(filter.code, 'light')" class="hover:cursor-pointer hover:brightness-110">

            <code class="rounded bg-black text-white bg-opacity-60 px-1">{{ filter.code }}</code>
            {{ filter.name }}
        </el-tag>
        <el-button :icon="Plus" size="small" @click="() => open('add', {
            name: pickNewFilterName(),
            code: 'redirect',
            spec: {}
        })">{{ t('button.addPlugin') }}
        </el-button>
    </div>
    <el-dialog v-model="isOpen" :title="mode === 'add' ? t('title.newPlugin') : t('title.editPlugin')">
        <filter-form v-model="formData" :before-close="close" ref="formRef"></filter-form>
        <template #footer>
            <el-button type="primary" :icon="Check" @click="() => {
            if (mode === 'add' && formData) {
                formData.spec = formRef!.getJson() as Model.SgRouteFilter['spec']
                modelValue.push(cloneDeep(formData))
            } else if (mode === 'edit') {
                formData.spec = formRef!.getJson() as Model.SgRouteFilter['spec']
                modelValue[editIndex] = cloneDeep(formData)
            }
            close()
        }">
                {{ t('button.save') }}
            </el-button>
        </template>
    </el-dialog>
</template>