<script setup lang="ts">
import { ElDrawer, ElInput, ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

import { addTlsCertApi, deleteTlsCertApi, getTlsCertApi, updateTlsCertApi } from '../requset/api/certificate';
import { useI18n } from '../i18n/usei18n';
import { TlsCert } from '../types/certificate';
import { GetTlsCertParams } from '../requset/api/certificate/type';

const t = await useI18n()

const currentRow = reactive({ data: [] as TlsCert[] })
const searchDto = reactive<GetTlsCertParams>({})
const initTlsCert = (): TlsCert => {
  return {
    name: '',
    cert: '',
    key: '',
  }
}
const opDialog = reactive({ isOpen: false, isEdit: false, data: initTlsCert() })
const tableLoading = ref(false)

onMounted(async () => {
  await onSearch()
})

const onSearch = async () => {
  tableLoading.value = true
  let res = await getTlsCertApi(searchDto)

  if (res) {
    currentRow.data = res.data
  }
  tableLoading.value = false
}

const handleEdit = (_index: number, row: TlsCert) => {
  opDialog.isOpen = true;
  opDialog.isEdit = true;
  opDialog.data = row;
}

const handleDelete = async (_index: number, row: TlsCert) => {
  let res = await deleteTlsCertApi(row.name)
  if (res) {
    ElMessage.success(t('common.status.success'))
    await onSearch()
  }
}



const onSumbit = async () => {
  let res = opDialog.isEdit ? await updateTlsCertApi(opDialog.data) : await addTlsCertApi(opDialog.data)
  if (res) {
    ElMessage.success(t('common.status.success'))
    await onSearch()
  }

  closeDialog()
}

const closeDialog = () => {
  opDialog.data = initTlsCert()
  opDialog.isOpen = false
}

const formatKey = (_row: any, _column: any, cellValue: string) => {
  const stars = "*".repeat(cellValue.length - 4);
  return cellValue.substring(0, 2) + stars + cellValue.substring(cellValue.length - 2, cellValue.length)
}

</script>
<template>
  <div class="sp-view-header">
    <el-row>
      <el-col :span="23">
        <h1>Certificate</h1>
      </el-col>
    </el-row>
    <el-row>
      <el-divider style="margin-top: 24px;margin-bottom: 10px;" />
    </el-row>
    <el-row>
      <el-col :span="23"><span class="sp-view-header__sub-title">Set you certificate</span></el-col>
    </el-row>
  </div>

  <div class="pt-4">
    <el-space fill direction="vertical" style="width: 100%">
      <el-card shadow="never" class=" justify-center">
        <el-form :inline="true" :model="searchDto">
          <el-form-item :label="t('route.name')">
            <el-input placeholder="name of certificate" v-model="searchDto.names" />
          </el-form-item>
          <el-form-item class="float-right"><el-button @click="opDialog.isEdit = false; opDialog.isOpen = true">{{
            t('common.operation.add')
          }}</el-button>
            <el-button @click="onSearch">{{ t('common.operation.search') }}</el-button></el-form-item>

        </el-form>
      </el-card>
      <el-table v-loading="tableLoading" :data="currentRow.data" border stripe height="250" max-height="250"
        style="width: 100% ">
        <el-table-column prop="name" label="Name" width="180" />
        <el-table-column prop="key" label="Key" :formatter="formatKey" />
        <el-table-column prop="cert" label="Cert" :formatter="formatKey" />
        <el-table-column :label="t('common.operations')">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.$index, scope.row)">Edit</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">{{
              t('common.operation.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-space>
    <el-dialog v-model="opDialog.isOpen" :title="opDialog.isEdit ? 'edit instance' : 'add instance'"
      class="sp-service-drawer" :before-close="closeDialog">
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
              <el-form-item label="Key">
                <el-input type="password" v-model="opDialog.data.key" :show-password="opDialog.isEdit ? false : true" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="18">
              <el-form-item label="Cert">
                <el-input type="password" v-model="opDialog.data.cert" :show-password="opDialog.isEdit ? false : true" />
              </el-form-item>
            </el-col>
          </el-row>

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