<script setup lang="ts">
import { ElDrawer, ElInput, ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

import { addPluginApi, deletePluginApi, getPluginApi, updatePluginApi } from '../requset/api/plugin';
import { useI18n } from '../i18n/usei18n';
import { GetPluginParams } from '../requset/api/plugin/type';
import { SgPlugin } from 'types/plugin';

const t = await useI18n()

const currentRow = reactive({ data: [] as SgPlugin[] })
const searchDto = reactive<GetPluginParams>({})
const initPluginVO = (): SgPlugin => {
  return {
    id: '',
    name: '',
    code: '',
    spec: '',
  }
}
const opDialog = reactive({ isOpen: false, isEdit: false, data: initPluginVO() })
const tableLoading = ref(false)

onMounted(async () => {
  await onSearch()
})

const onSearch = async () => {
  tableLoading.value = true
  let res = await getPluginApi(searchDto)
    .catch((a) => { console.log('catch=====' + a) })
    .finally(() => {
      tableLoading.value = false
    })

  if (res) {
    currentRow.data = res.data
  }
}

const handleEdit = (_index: number, row: SgPlugin) => {
  opDialog.isOpen = true;
  opDialog.isEdit = true;
  opDialog.data = row;
}

const handleDelete = async (_index: number, row: SgPlugin) => {
  await deletePluginApi(row.id,)
    .then(() => { ElMessage.success(t('common.status.success')) })
    .catch((a) => { console.log('catch=====' + a) })
    .finally(async () => {
      await onSearch()
    })
}



const onSumbit = async () => {
  let result = opDialog.isEdit ? await updatePluginApi(opDialog.data) : await addPluginApi(opDialog.data)
  if (result) {
    ElMessage.success(t('common.status.success'))
    await onSearch()
  }
  closeDialog()
}
const closeDialog = () => {
  opDialog.data = initPluginVO()
  opDialog.isOpen = false
}
</script>
<template>
  <div class="sp-view-header">
    <el-row>
      <el-col :span="23">
        <h1>Plugin</h1>
      </el-col>
    </el-row>
    <el-row>
      <el-divider style="margin-top: 24px;margin-bottom: 10px;" />
    </el-row>
    <el-row>
      <el-col :span="23"><span class="sp-view-header__sub-title">Set you plugin</span></el-col>
    </el-row>
  </div>

  <div class="pt-4">
    <el-space fill direction="vertical" style="width: 100%">
      <el-card shadow="never" class=" justify-center">
        <el-form :inline="true" :model="searchDto">
          <el-form-item :label="t('plugin.id')">
            <el-input placeholder="name of service" v-model="searchDto.names" />
          </el-form-item>
          <el-form-item class="float-right"><el-button @click="opDialog.isOpen = true">{{ t('common.operation.add')
          }}</el-button>
            <el-button @click="onSearch">{{ t('common.operation.search') }}</el-button></el-form-item>

        </el-form>
      </el-card>
      <el-table v-loading="tableLoading" :data="currentRow.data" border stripe height="250" max-height="250"
        style="width: 100% ">
        <el-table-column prop="id" label="Id" width="180" />
        <el-table-column prop="code" label="Code">
          <template #default="scope">
            <el-tag>{{ scope.row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="Name" />
        <el-table-column :label="t('common.operations')">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.$index, scope.row)">Edit</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">{{
              t('common.operation.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-space>
    <el-dialog v-model="opDialog.isOpen" :title="opDialog.isEdit ? 'edit plugin' : 'add plugin'" class="sp-service-drawer"
      :before-close="closeDialog">
      <div class="sp-service-drawer__content">
        <el-form :inline="true" :model="opDialog.data">
          <el-row>
            <el-col>
              <el-form-item label="Id">
                <el-input v-model="opDialog.data.id" autocomplete="off" :disabled="opDialog.isEdit" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col>
              <el-form-item label="Code">
                <el-input v-model="opDialog.data.code" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col>
              <el-form-item label="Name">
                <el-input v-model="opDialog.data.name" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col>
              <el-form-item label="PluginConfig">
                <el-input autosize type="textarea" v-model="opDialog.data.spec" />
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