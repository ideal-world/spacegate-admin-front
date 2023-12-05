<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Search, Edit } from '@element-plus/icons-vue'

import { useI18n } from '../i18n/usei18n'
import { GetHttpRouteParams } from '../requset/api/route/type'
import { SgHttpRouteVO, convertServiceToVO } from '../types/route'
import { deleteHttpRouteApi, getHttpRouteApi } from '../requset/api/route'
import { ElMessage } from 'element-plus'

const t = await useI18n()

const currentRow = reactive({ data: [] as SgHttpRouteVO[] })
const searchDto = reactive<GetHttpRouteParams>({})
const opDialog = reactive({ isOpen: false, isEdit: false, data: { name: '' } as SgHttpRouteVO })
const tableLoading = ref(false)

onMounted(async () => {
  await onSearch()
})

const onSearch = async () => {
  tableLoading.value = true
  let res = await getHttpRouteApi(searchDto)
    .finally(() => {
      tableLoading.value = false
    })

  if (res) {
    currentRow.data = res.data.map((resData) => convertServiceToVO(resData))
  }
}

const handleEdit = (_index: number, row: SgHttpRouteVO) => {
  opDialog.isOpen = true;
  opDialog.isEdit = true;
  opDialog.data = row;
}

const handleDelete = async (_index: number, row: SgHttpRouteVO) => {
  let result = await deleteHttpRouteApi(row.name,)
  if (result) {
    ElMessage.success(t('common.status.success'))
  }
  await onSearch()
}


const onSumbit = () => {
  console.log(JSON.stringify(opDialog.data))
  closeDialog()
}
const closeDialog = () => {
  opDialog.data = {} as SgHttpRouteVO
  opDialog.isOpen = false
}
</script>
<template>
  <div class="sp-view-header">
    <el-row>
      <el-col :span="23">
        <h1>Route</h1>
      </el-col>
    </el-row>
    <el-row>
      <el-divider style="margin-top: 24px;margin-bottom: 10px;" />
    </el-row>
    <el-row>
      <el-col :span="23"><span class="sp-view-header__sub-title">Set you route</span></el-col>
    </el-row>
  </div>
  <div class="pt-4">
    <el-space fill direction="vertical" style="width: 100%">
      <el-card shadow="never" class=" justify-center">
        <el-form :inline="true" :model="searchDto">
          <el-form-item :label="t('route.name')">
            <el-input placeholder="name of service" v-model="searchDto.names" />
          </el-form-item>
          <el-form-item class="float-right"><el-button @click="opDialog.isOpen = true">{{ t('common.operation.add')
          }}</el-button>
            <el-button @click="onSearch">{{ t('common.operation.search') }}</el-button></el-form-item>

        </el-form>
      </el-card>
      <el-table v-loading="tableLoading" :data="currentRow.data" border stripe height="250" max-height="250"
        style="width: 100% ">
        <el-table-column prop="name" label="Name" width="180" />

        <el-table-column :label="t('common.operations')">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.$index, scope.row)">Edit</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">{{
              t('common.operation.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-space>
    <el-dialog v-model="opDialog.isOpen" :title="opDialog.isEdit ? 'edit route' : 'add route'" class="sp-service-drawer"
      :before-close="closeDialog">
      <div class="sp-service-drawer__content">
        <el-form :inline="true" :model="opDialog.data">
          <el-row>
            <el-col>
              <el-form-item label="Name">
                <el-input v-model="opDialog.data.name" autocomplete="off" :disabled="opDialog.isEdit" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="18">
              <el-form-item label="Hostnames">
                <el-input v-model="opDialog.data.hostnames"></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-collapse accordion>
            <el-collapse-item>
              <template #title>
                {{ t('common.advanced') }}<el-icon class="header-icon">
                </el-icon>
              </template>
              <div>
                <el-row>
                  <el-col :span="18">
                    <el-form-item label="TimeoutMs">
                      <el-input v-model="opDialog.data.timeout_ms"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">{{ t('common.operation.cancel') }}</el-button>
          <el-button type="primary" :loading="tableLoading" @click="onSumbit">{{
            tableLoading ? t('common.status.submitting') : t('common.operation.submit')
          }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<style lang="scss" scoped>
:deep() {}
</style>