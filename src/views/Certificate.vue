<script setup lang="ts">
import { ElInput, ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { TlsCert } from '../types/certificate';
import { GetTlsCertParams } from '../requset/api/certificate/type';
import { useI18n } from 'vue-i18n';
import { useSpacegateService } from '../service';
import { ConfigPanel } from '../components'
import { Search, Plus } from '@element-plus/icons-vue'

const { t } = useI18n()
const { certificate } = useSpacegateService();

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
  let res = await certificate.getTlsCert(searchDto)

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
  let res = await certificate.deleteTlsCert(row.name)
  if (res) {
    ElMessage.success(t('common.status.success'))
    await onSearch()
  }
}



const onSubmit = async () => {
  let res = opDialog.isEdit ? await certificate.updateTlsCert(opDialog.data) : await certificate.addTlsCert(opDialog.data)
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
  <ConfigPanel>
    <template #search>
      <el-input placeholder="name of certificate" v-model="searchDto.names">
        <template #append>
          <el-button @click="onSearch" :icon="Search">{{ t('common.operation.search') }}</el-button>
        </template>
      </el-input>
    </template>
    <template #operation>
      <el-button @click="() => { opDialog.isEdit = false; opDialog.isOpen = true }" text type="primary" :icon="Plus">{{
        t('common.operation.add') }}</el-button>
    </template>
    <el-table v-loading="tableLoading" :data="currentRow.data" border stripe 
      style="width: 100% ">
      <el-table-column prop="name" :label="t('certificate.name')" width="180" />
      <el-table-column prop="key" :label="t('certificate.key')" :formatter="formatKey" />
      <el-table-column prop="cert" :label="t('certificate.cert')" :formatter="formatKey" />
      <el-table-column :label="t('common.operations')">
        <template #default="scope">
          <el-button-group>
            <el-button size="small" @click="handleEdit(scope.$index, scope.row)">{{
              t('common.operation.edit') }}</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">{{
              t('common.operation.delete') }}</el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
  </ConfigPanel>
  <el-dialog v-model="opDialog.isOpen"
    :title="opDialog.isEdit ? t('certificate.editCertificate') : t('certificate.addCertificate')"
    :before-close="closeDialog">
    <el-form :inline="false" :model="opDialog.data" label-position="left" label-width="auto" label-suffix=":">
      <el-form-item :label="t('certificate.name')">
        <el-input v-model="opDialog.data.name" autocomplete="off" :disabled="opDialog.isEdit" />
      </el-form-item>
      <el-form-item :label="t('certificate.key')">
        <el-input type="password" v-model="opDialog.data.key" :show-password="opDialog.isEdit ? false : true" />
      </el-form-item>
      <el-form-item :label="t('certificate.cert')">
        <el-input type="password" v-model="opDialog.data.cert" :show-password="opDialog.isEdit ? false : true" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">{{ t('common.operation.cancel') }}</el-button>
        <el-button type="primary" :loading="tableLoading" @click="onSubmit">{{
          tableLoading ? t('common.status.submitting') : t('common.operation.submit')
        }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>