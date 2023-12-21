<script setup lang="ts">
import { ElDrawer, ElInput, ElMessage } from 'element-plus'
import { ComponentPublicInstance, onMounted, reactive, ref } from 'vue'

// import { addBackendApi, deleteBackendApi, getBackendApi, updateBackendApi } from '../requset/api/backend';
import { Backend, BackendVO, Protocol, convertBackendToVO } from '../types/backend';
import { GetBackendParams } from '../requset/api/backend/type';
import { useSelectedInstanceStore } from '../stores/select_instance';
import { ArraySelect } from '../components/index';
import { ExtractPropType } from 'element-plus/es/utils';
import { useSpacegateService } from '../service';

import { useI18n } from 'vue-i18n';
const { backend } = useSpacegateService()
const { t } = useI18n()

const selectedStore = useSelectedInstanceStore()

const currentRow = reactive({ data: [] as BackendVO[] })
const searchDto = reactive<GetBackendParams>({})
const initBackendVO = (): BackendVO => {
  return convertBackendToVO({ id: "", name_or_host: '', port: 0, protocol: Protocol.Http })
}
const opDialog = reactive({ isOpen: false, isEdit: false, data: initBackendVO() })
const tableLoading = ref(false)

onMounted(async () => {
  await onSearch()
})

const onSearch = async () => {
  tableLoading.value = true
  let res = await backend.getBackend(searchDto)
    .finally(() => {
      tableLoading.value = false
    })

  if (res) {
    currentRow.data = res.data.map((item: Backend) => convertBackendToVO(item))
  }
}

const handleEdit = (_index: number, row: BackendVO) => {
  opDialog.isOpen = true;
  opDialog.isEdit = true;
  opDialog.data = row;
}

const handleDelete = async (_index: number, row: BackendVO) => {
  let result = await backend.deleteBackend(row.id,)
  if (result) {
    ElMessage.success(t('common.status.success'))
  }
  await onSearch()
}

const upstreamArraySelect = ref()
const onSumbit = async () => {
  opDialog.data.filters = upstreamArraySelect.value.selectedValues
  if (opDialog.isEdit) {
    let updateResult = await backend.updateBackend(opDialog.data)
    if (updateResult) {
      ElMessage.success(t('common.status.success'))
      await onSearch()
    }
  } else {
    let addResult = await backend.addBackend(opDialog.data)
    if (addResult) {
      ElMessage.success(t('common.status.success'))
      await onSearch()
    }
  }
  closeDialog()
}

const closeDialog = () => {
  opDialog.data = initBackendVO()
  opDialog.isOpen = false
}

const colSizeAttr = {
  xs: 24,
  sm: 24,
  md: 12,
  lg: 8,
  xl: 6
}
</script>
<template>
  <div class="sp-view-header">
    <el-row>
      <el-col :span="23">
        <h1>Upstream</h1>
      </el-col>
    </el-row>
    <el-row>
      <el-divider style="margin-top: 24px;margin-bottom: 10px;" />
    </el-row>
    <el-row>
      <el-col :span="23"><span class="sp-view-header__sub-title">Set you upstream</span></el-col>
    </el-row>
  </div>

  <div class="pt-4">
    <el-space fill direction="vertical" style="width: 100%">
      <el-card shadow="never" class=" justify-center">
        <el-form :inline="true" :model="searchDto">
          <el-form-item :label="t('route.name')">
            <el-input placeholder="name of upstream" v-model="searchDto.names" />
          </el-form-item>
          <el-form-item :label="t('upstream.namespace')" v-if="selectedStore.is_k8s()">
            <el-input placeholder="namespace of upstream" v-model="searchDto.namespace" />
          </el-form-item>
          <el-form-item class="float-right"><el-button @click="opDialog.isEdit = false; opDialog.isOpen = true">{{
            t('common.operation.add')
          }}</el-button>
            <el-button @click="onSearch">{{ t('common.operation.search') }}</el-button></el-form-item>

        </el-form>
      </el-card>
      <el-table v-loading="tableLoading" :data="currentRow.data" border stripe height="250" max-height="250"
        style="width: 100% ">
        <el-table-column prop="id" label="Name" width="180" />
        <el-table-column v-if="selectedStore.is_k8s()" prop="namespace" label="Namespace" />
        <el-table-column prop="protocol" label="Protocol">
          <template #default="scope">
            <el-tag>{{ scope.row.protocol }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name_or_host" :label="selectedStore.is_k8s() ? 'ServiceName' : 'Host'" />
        <el-table-column prop="port" label="Port" />
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
        <el-form :inline="false" :model="opDialog.data" label-width="auto">
          <el-row :gutter="8">
            <el-col v-bind="colSizeAttr">
              <el-form-item label="Name">
                <el-input v-model="opDialog.data.id" autocomplete="off" :disabled="opDialog.isEdit" />
              </el-form-item>
            </el-col>
            <el-col v-bind="colSizeAttr">
              <el-form-item label="Protocol">
                <el-select v-model="opDialog.data.protocol">
                  <el-option v-for="item in Protocol" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col v-bind="colSizeAttr">
              <el-form-item :label="selectedStore.is_k8s() ? 'ServiceName' : 'Host'">
                <el-input v-model="opDialog.data.name_or_host" />
              </el-form-item>
            </el-col>
            <el-col v-bind="colSizeAttr">
              <el-form-item label="Namespace">
                <el-input v-model="opDialog.data.namespace" />
              </el-form-item>
            </el-col>
            <el-col v-bind="colSizeAttr">
              <el-form-item label="Port" max="">
                <el-input-number v-model="opDialog.data.port" :controls="false" :max="65536" :min="0" />
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
                      <el-input-number :controls="false" v-model="opDialog.data.timeout_ms" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="18">
                    <el-form-item label="Weight">
                      <el-input-number :controls="false" v-model="opDialog.data.weight" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="18">
                    <el-form-item label="Filters">
                      <ArraySelect ref="upstreamArraySelect" :selectedValues="opDialog.data.filters" />
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