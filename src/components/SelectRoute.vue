<script setup lang="ts">
import { Model, Api } from 'spacegate-admin-client'
import { computed, ref, onMounted } from 'vue';
import { unwrapResponse } from '../utils';

const modelValue = defineModel<string>()
const options = ref<string[]>([])
const optionsPending = ref(true)
const getOptions = () => {
    optionsPending.value = true
    return Api.get_config_names().then(unwrapResponse).then((resp) => {
        options.value = resp
    }).finally(() => {
        optionsPending.value = false
    })
}
onMounted(() => {
    getOptions()
})

</script>

<template>
    <el-select v-loading="optionsPending" v-model="modelValue" placeholder="Select a route">
        <el-option v-for="item in options" :key="item" :label="item" :value="item">
        </el-option>
    </el-select>
</template>