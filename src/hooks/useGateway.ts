import { Ref, onMounted, ref } from 'vue';
import { Api, Model } from 'spacegate-admin-client'
import { unwrapResponse, catchAdminServerError } from '..';
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
            await Api.putConfigItemGateway(name, gateway.value)
            ElMessage({
                message: 'Gateway updated',
                type: 'success'
            })
            const newGateway = await Api.getConfigItemGateway(name).then(unwrapResponse)
            if (newGateway) {
                gateway.value = newGateway
            }
        } catch (e) {
            catchAdminServerError(e)
        } finally {
            loading.value = false
        }
    }
    onMounted(async () => {
        try {
            const response = await Api.getConfigItemGateway(name)
            gateway.value = unwrapResponse(response)
        } catch (e) {
            catchAdminServerError(e)
        } finally {
            loading.value = false
        }
    })
    return {
        gateway, loading, update
    }
}