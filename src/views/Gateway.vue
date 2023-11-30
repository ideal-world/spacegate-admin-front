<script setup lang="ts">
import { ElDrawer, ElInput, ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { deleteGatewaysApi, getGatewaysApi } from '../requset/api/service'
import { Gateway, Listener, Tls } from 'types/service';

import { useI18n } from '../i18n/usei18n'
import { GetGatewayParams } from 'requset/api/service/type';

const t = await useI18n()

const currentRow = reactive({ data: [] as Gateway[] })
const searchDto = reactive<GetGatewayParams>({})
const opDialog = reactive({ isOpen: false, isEdit: false, data: { parameters: {} } as Gateway })
const tableLoading = ref(false)

onMounted(async () => {
  await onSearch()
})

const onSearch = async () => {
  tableLoading.value = true
  let res = await getGatewaysApi(searchDto)
    .catch((a) => { console.log('catch=====' + a) })
    .finally(() => {
      tableLoading.value = false
    })

  if (res) {
    currentRow.data = res.data
  }
}

const handleEdit = (_index: number, row: Gateway) => {
  opDialog.isOpen = true;
  opDialog.isEdit = true;
  opDialog.data = row;
}

const handleDelete = async (_index: number, row: Gateway) => {
  await deleteGatewaysApi({ name: row.name, namespace: searchDto.namespace || undefined })
    .then(() => { ElMessage.success(t('common.status.success')) })
    .catch((a) => { console.log('catch=====' + a) })
    .finally(async () => {
      await onSearch()
    })
}



const onSumbit = () => {
  console.log(JSON.stringify(opDialog.data))
  closeDialog()
}
const closeDialog = () => {
  opDialog.data = { parameters: {} } as Gateway
  opDialog.isOpen = false
}

</script>
<template>
  <div class="sp-view-header">
    <el-row>
      <el-col :span="23">
        <h1>Gateway Instance</h1>
      </el-col>
    </el-row>
    <el-row>
      <el-divider style="margin-top: 24px;margin-bottom: 10px;" />
    </el-row>
    <el-row>
      <el-col :span="23"><span class="sp-view-header__sub-title">Manage you gateway instances</span></el-col>
    </el-row>
  </div>
  <div class="pt-4">
    <el-space fill direction="vertical" style="width: 100%">
      <el-card shadow="never" class=" justify-center">
        <el-form :inline="true" :model="searchDto">
          <el-form-item :label="t('route.name')">
            <el-input placeholder="name of service" v-model="searchDto.name" />
          </el-form-item>
          <el-form-item class="float-right"><el-button @click="opDialog.isOpen = true">{{ t('common.operation.add')
          }}</el-button>
            <el-button @click="onSearch">{{ t('common.operation.search') }}</el-button></el-form-item>

        </el-form>
      </el-card>
      <el-table v-loading="tableLoading" :data="currentRow.data" border stripe height="250" max-height="250"
        style="width: 100% ">
        <!-- <el-table-column prop="name" label="Name" width="180" />
        <el-table-column :label="t('service.listener')">
          <el-table-column prop="listeners" label="ip" :formatter="formatIp" />
          <el-table-column prop="listeners" label="hostname" :formatter="formatHostname" />
          <el-table-column prop="listeners" label="port" :formatter="formatPort" width="180" />
        </el-table-column>
        <el-table-column prop="filters" :label="t('service.plugin')">
          {{ filters }}
          <el-tag v-for="item in currentRow.data.filters" class="mx-1" round>
            {{ item }}
          </el-tag>
        </el-table-column> -->
        <el-table-column :label="t('common.operations')">
          <!-- <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.$index, scope.row)">Edit</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">{{
              t('common.operation.delete') }}</el-button>
          </template> -->
        </el-table-column>
      </el-table>
    </el-space>
    <el-dialog v-model="opDialog.isOpen" :title="opDialog.isEdit ? 'edit service' : 'add service'"
      class="sp-service-drawer" :before-close="closeDialog">
      <div class="sp-service-drawer__content">

        <el-collapse accordion>
          <el-collapse-item>
            <template #title>
              {{ t('common.advanced') }}<el-icon class="header-icon">
              </el-icon>
            </template>
          </el-collapse-item></el-collapse>


      </div>
      <!-- <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">{{ t('common.operation.cancel') }}</el-button>
          <el-button type="primary" :loading="tableLoading" @click="onSumbit">{{
            tableLoading ? t('common.status.submitting') : t('common.operation.submit')
          }}</el-button>
        </span>
      </template> -->
    </el-dialog>
  </div>
</template>
<style lang="scss" scoped>
:deep() {}
</style>../requset/api/servicerequset/api/service/typetypes/service