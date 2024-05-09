<script setup lang="ts">
import GatewayForm from '../components/GatewayForm.vue';
import { Check } from '@element-plus/icons-vue'
import { useGateway } from '../hooks'
import { ref, watch } from 'vue'
const props = defineProps<{
    gatewayName: string
}>()

const gatewayName = ref(props.gatewayName);
const { gateway, loading, update, refresh } = useGateway(gatewayName)
watch(() => props.gatewayName, (newVal) => {
    
    gatewayName.value = newVal
    refresh()
})
</script>

<template>
    <div v-loading="loading">
        <GatewayForm v-if="gateway !== null && gateway !== undefined" v-model="gateway" mode="edit" />
        <div class="flex justify-end">

            <el-button :icon="Check" type="primary" @click="update"> {{ 'Save' }}</el-button>
        </div>
    </div>
</template>