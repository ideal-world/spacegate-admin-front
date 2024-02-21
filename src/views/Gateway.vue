<script setup lang="ts" >
import GatewayForm from '../components/GatewayForm.vue';
import { Check } from '@element-plus/icons-vue'
import { useGateway } from '../hooks'
const props = defineProps<{
    gatewayName: string
}>()

const { gateway, loading, update } = useGateway(props.gatewayName)

</script>

<template>
    <div v-loading="loading">
        <GatewayForm v-if="gateway !== null && gateway !== undefined" v-model="gateway" mode="edit" />
        <div class="flex justify-end">

            <el-button  :icon="Check" type="primary" @click="update"> {{ 'Save' }}</el-button>
        </div>
    </div>
</template>