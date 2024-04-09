<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Api } from 'spacegate-admin-client'
import { unwrapResponse } from '../utils'
import { PluginAttributes } from 'spacegate-admin-client/dist/model';
const codeOptions = ref([]);
const code = ref<string | undefined>();
const attr = ref<PluginAttributes | undefined>();
onMounted(async () => {
    const response = await Api.pluginList();
    codeOptions.value = unwrapResponse<string[]>(response);
})
watch(code, async (code) => {
    attr.value = undefined;
    const response = await Api.pluginAttr(code);
    attr.value = unwrapResponse<PluginAttributes>(response);
})
</script>
<template>
    <el-select v-model="code">
        <el-option v-for="pluginCode in codeOptions" :label="pluginCode" :value=pluginCode></el-option>
    </el-select>
    {{
        attr
    }}
</template>