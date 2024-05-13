import { Ref, onMounted, ref, watch } from 'vue';
import { Api, Model } from 'spacegate-admin-client'
import { unwrapResponse, catchAdminServerError } from '..';
import { ElMessage } from 'element-plus';

export function useGateway(name: Ref<string>): {
    gateway: Ref<Model.SgGateway | null>;
    loading: Ref<boolean>;
    update: () => Promise<void>;
    refresh: () => Promise<void>;
} {
    const gateway = ref<Model.SgGateway | null>(null)
    const loading = ref(true)
    const update = async () => {
        if (!gateway.value) return
        try {
            loading.value = true
            await Api.putConfigItemGateway(name.value, gateway.value)
            ElMessage({
                message: 'Gateway updated',
                type: 'success'
            })
            const newGateway = await Api.getConfigItemGateway(name.value).then(unwrapResponse)
            if (newGateway) {
                newGateway.plugins = newGateway.plugins??[]
                newGateway.listener = newGateway.listeners??[]
                gateway.value = newGateway
            }
        } catch (e) {
            catchAdminServerError(e)
        } finally {
            loading.value = false
        }
    }
    const refresh = async () => {
        try {
            const response = await Api.getConfigItemGateway(name.value)
            response.plugins = response.plugins??[]
            response.listener = response.listeners??[]
            gateway.value = unwrapResponse(response)
        } catch (e) {
            catchAdminServerError(e)
        } finally {
            loading.value = false
        }
    }
    onMounted(refresh)

    return {
        gateway, loading, update, refresh
    }
}