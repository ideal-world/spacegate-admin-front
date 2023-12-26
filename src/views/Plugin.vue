<script setup lang="ts">
import { ElDrawer, ElInput, ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { Search, Edit, Plus, Minus, Check, Close, ArrowRight, ArrowDown, Filter } from '@element-plus/icons-vue'

import { GetPluginParams } from '../requset/api/plugin/type';
import { SgPlugin, SgPluginVO, convertPluginToVO, convertVOToPlugin } from '../types/plugin';
import { ConfigPanel } from '../components'

import { useI18n } from 'vue-i18n';
import { useSpacegateService } from '../service';
const { plugin } = useSpacegateService();
const { t } = useI18n()


const currentRow = reactive({ data: [] as SgPluginVO[] })
const searchDto = reactive<GetPluginParams>({})
const initPluginVO = (): SgPluginVO => {
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
  let res = await plugin.getPlugin(searchDto)

  if (res) {
    currentRow.data = res.data.map((resData) => convertPluginToVO(resData))
  }
  tableLoading.value = false
}

const handleEdit = (_index: number, row: SgPlugin) => {
  opDialog.isOpen = true;
  opDialog.isEdit = true;
  opDialog.data = row;
}

const handleDelete = async (_index: number, row: SgPlugin) => {
  let res = await plugin.deletePlugin(row.id,)
  if (res) {
    ElMessage.success(t('common.status.success'))
    await onSearch()
  }
}



const onSumbit = async () => {
  let result = opDialog.isEdit ? await plugin.updatePlugin(convertVOToPlugin(opDialog.data)) : await plugin.addPlugin(convertVOToPlugin(opDialog.data))
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
  <ConfigPanel>
    <template #search>
      <el-input placeholder="name of service" v-model="searchDto.ids">
        <template #append>
          <el-button @click="onSearch" :icon="Search">{{ t('common.operation.search') }}</el-button>
        </template>
      </el-input>
    </template>
    <template #operation>
      <el-button text type="primary" @click="opDialog.isEdit = false; opDialog.isOpen = true" :icon="Plus">{{
        t('common.operation.add')
      }}</el-button>
    </template>
    <el-table v-loading="tableLoading" :data="currentRow.data" border stripe height="250" max-height="250"
      style="width: 100% ">
      <el-table-column prop="id" label="Id" width="180" />
      <el-table-column prop="name" label="Name" />
      <el-table-column prop="code" label="Code">
        <template #default="scope">
          <el-tag>{{ scope.row.code }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('common.operations')">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.$index, scope.row)">Edit</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">{{
            t('common.operation.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </ConfigPanel>
  <el-dialog v-model="opDialog.isOpen" :title="opDialog.isEdit ? 'edit plugin' : 'add plugin'" class="sp-service-drawer"
    :before-close="closeDialog">
    <div class="sp-service-drawer__content">
      <el-form :inline="false" :model="opDialog.data" label-width="auto" label-suffix=":">
        <el-row>
          <el-col>
            <el-form-item label="Id">
              <el-input v-model="opDialog.data.id" autocomplete="off" disabled />
            </el-form-item>
          </el-col>

          <el-col>
            <el-form-item label="Code">
              <el-input v-model="opDialog.data.code" />
            </el-form-item>
          </el-col>
          <el-col>
            <el-form-item label="Name">
              <el-input v-model="opDialog.data.name" />
            </el-form-item>
          </el-col>
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
</template>
<style lang="scss" scoped>
:deep() {}
</style>