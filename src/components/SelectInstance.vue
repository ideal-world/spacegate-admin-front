<script setup lang="ts">
import { getInstName } from '../types/instance'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n';


// import { getInstanceListApi, getSelectedInstanceApi } from '../requset/api/instance'
// import { useSelectedInstanceStore } from '../stores/select_instance';

const { t } = useI18n()

// const selectedStore = useSelectedInstanceStore()

const selectInstance = ref("")
const selectInstanceOptions = ref(["default"])

// onMounted(async () => {
//     let res = await getSelectedInstanceApi()
//     if (res) {
//         selectedStore.selectedInstance = res.data
//         selectInstance.value = res.data.name
//     }
//     await getInstances()
// })

// const getInstances = async () => {
//     let res = await getInstanceListApi()
//     if (res) {
//         res.data.map((item) => {
//             let name = getInstName(item);
//             if (name) {
//                 selectInstanceOptions.value.push(name)
//             }
//         })
//     }
// }

const selectedChange = async (_value: string) => {
    // let _res = await selectInstanceApi(value)
}
</script>
<template>
    <div>
        <el-select v-model="selectInstance" :placeholder="t('selectInstance')" @change="selectedChange">

            <el-option v-for="item in selectInstanceOptions" :key="item" :label="item" :value="item" />
        </el-select>
    </div>
</template>