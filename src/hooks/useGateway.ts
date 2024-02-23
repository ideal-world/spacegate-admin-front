import { Ref, onMounted, ref } from 'vue';
import { Api, Model } from 'spacegate-admin-client'
import { unwrapResponse } from '..';
import { ElMessage } from 'element-plus';

export function useGateway(name: string): {
    gateway: Ref<Model.SgGateway | null>;
    loading: Ref<boolean>;
    update: () => Promise<void>;
} {
    const gateway = ref<Model.SgGateway | null>(null)
    const loading = ref(true)
    const update = async () => {
        if (!gateway.value) return
        try {
            loading.value = true
            await Api.put_config_item_gateway(name, gateway.value)
            ElMessage({
                message: 'Gateway updated',
                type: 'success'
            })
            const newGateway = await Api.get_config_item_gateway(name).then(unwrapResponse)
            gateway.value = newGateway
        } catch (e) {
            ElMessage({
                message: 'Failed to update gateway',
                type: 'error'
            })
        } finally {
            loading.value = false
        }
    }
    onMounted(async () => {
        try {
            const response = await Api.get_config_item_gateway(name)
            gateway.value = unwrapResponse(response)
        } catch (e) {
            ElMessage({
                message: 'Failed to fetch gateway',
                type: 'error'
            })
        } finally {
            loading.value = false
        }
    })
    return {
        gateway, loading, update
    }
}