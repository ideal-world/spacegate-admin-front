
<script setup lang="ts">
import { Model } from 'spacegate-admin-client';
import { useDialogForm } from '../types/forms';
import { Plus, Minus, Close, ArrowDown, ArrowRight, Check } from '@element-plus/icons-vue'
import { cloneDeep } from 'lodash';
import { ref } from 'vue';
import { hashColor } from '../utils';
import FilterForm from './FilterForm.vue'

const modelValue = defineModel<Model.SgRouteFilter[]>({
    default: []
})
const defaultFilter: Model.SgRouteFilter = {
    name: 'new filter',
    code: 'redirect',
    spec: {

    }
}
const isOpen = ref(false)
const mode = ref<'add' | 'edit' | undefined>('add')

const formData = ref<Model.SgRouteFilter>({
    ...defaultFilter
})
const open = (m: 'add' | 'edit', filter?: Model.SgRouteFilter) => {
    mode.value = m
    formData.value = filter ? filter : cloneDeep(defaultFilter)
    isOpen.value = true
}
const close = () => {
    isOpen.value = false
    mode.value = undefined
}
</script>
<template>
    <div class="flex space-x-1">
        <el-tag v-for="filter in modelValue" :key="filter.code" closable
            @close="modelValue.splice(modelValue.indexOf(filter), 1)" @click="() => open('edit', filter)"
            :color="hashColor(filter.code, 'light')">

            {{ filter.name }}
            <code>{{ filter.code }}</code>
        </el-tag>
        <el-button :icon="Plus" size="small" @click="() => open('add')">Add
            Filter
        </el-button>
    </div>
    <el-dialog v-model="isOpen" :title="mode === 'add' ? 'New Filter' : 'Edit Filter'">
        <filter-form v-model="formData" :before-close="close"></filter-form>
        <template #footer>
            <el-button type="primary" :icon="Check" @click="() => {
                if (mode === 'add' && formData) {
                    modelValue.push(formData)
                } else if (mode === 'edit') {
                    // do nothing
                }
                close()
            }">
                Save
            </el-button>
        </template>
    </el-dialog>
</template>