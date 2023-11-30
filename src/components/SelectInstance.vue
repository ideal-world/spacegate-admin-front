<script setup lang="ts">
import { getInstName } from '../types/instance'
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from '../i18n/usei18n'
import { getInstanceListApi, getSelectedInstanceApi, selectInstanceApi } from '../requset/api/instance'

const t = await useI18n()

const selectInstance = ref("")
const selectInstanceOptions = ref(["default"])

onMounted(async () => {
  let res = await getSelectedInstanceApi()
    .catch((a) => { console.log('catch=====' + a) })
    .finally(() => {

    })
  if (res) {
    selectInstance.value = res.data.name
  }
  await getInstances()
})

const getInstances = async () => {

  let res = await getInstanceListApi()
    .catch((a) => { console.log('catch=====' + a) })
    .finally(() => {
    })
  if (res) {
    res.data.map((item) => {
      let name = getInstName(item);
      if (name) {
        selectInstanceOptions.value.push(name)
      }
    })
  }
}

const selectedChange = async (value: string) => {
  let res = await selectInstanceApi(value)
    .catch((a) => { console.log('catch=====' + a) })
    .finally(() => {
    })
  console.log('value=====' + value)
}
</script>
<template>
  <div>
    <el-select v-model="selectInstance" :placeholder="t('selectInstance')" @change="selectedChange">
      <el-option v-for="item in selectInstanceOptions" :key="item" :label="item" :value="item" />
    </el-select>
  </div>
</template>
<style lang="scss" scoped>
:deep() {}
</style>