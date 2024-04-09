<script setup lang="ts">
import { Api, Model } from 'spacegate-admin-client'
import { unwrapResponse } from '../utils';
import { onMounted, ref } from 'vue';
const pluginOptions = ref<Array<string>>([])
const pluginIds = ref<Array<Model.PluginInstanceId>>([])
const code = ref()
const modelValue = defineModel<Model.PluginInstanceId | undefined>({})
onMounted(async () => {
    pluginOptions.value = unwrapResponse<string[]>(await Api.pluginList());
    const plugins = unwrapResponse<Model.PluginConfig[]>(await Api.getConfigPluginAll());
    const getId = (config: Model.PluginConfig) => {
        let cloned = {
            ...config
        }
        delete cloned['spec'];
        return <Model.PluginInstanceId>{
            ...cloned
        }
    }
    pluginIds.value = plugins.map(getId);
})
function key(item: Model.PluginInstanceId) {
    switch (item.kind) {
        case 'named':
            return `${item.code}-n-${item.name}`
        case 'anon':
            return `${item.code}-a-${item.uid}`
        case 'mono':
            return `${item.code}-m`
    }
}
function label(item: Model.PluginInstanceId) {
    switch (item.kind) {
        case 'named':
            return item.name
        case 'anon':
            return item.uid.toString().padStart(16, '0')
        case 'mono':
            return item.code
    }
}
</script>

<template>
    <el-select v-model="code">
        <el-option v-for="item in pluginOptions" :key="item" :label="item" :value="item" />
    </el-select>
    <el-select v-model="modelValue">
        <el-option v-for="(item) in pluginIds.filter((id) => id.code === code)" :key="key(item)" :label="label(item)"
            :value="item" />
    </el-select>
</template>