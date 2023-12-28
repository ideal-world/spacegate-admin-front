<script setup lang="ts">
import { ElDrawer, ElInput, ElMessage } from 'element-plus'
import { ComponentPublicInstance, onMounted, reactive, ref } from 'vue'
import { Search, Edit, Plus, Minus, Check, Close, ArrowRight, ArrowDown, Filter } from '@element-plus/icons-vue'

// import { addBackendApi, deleteBackendApi, getBackendApi, updateBackendApi } from '../requset/api/backend';
import { Backend, BackendVO, Protocol, convertBackendToVO } from '../types/backend';
import { GetBackendParams } from '../requset/api/backend/type';
import { useSelectedInstanceStore } from '../stores/select_instance';
import { ArraySelect } from '../components/index';
import { ExtractPropType } from 'element-plus/es/utils';
import { useSpacegateService } from '../service';

import { useI18n } from 'vue-i18n';
import { BackendForm, useDialogForm } from '../types/forms';
const { backend } = useSpacegateService()
const { t } = useI18n()

const selectedStore = useSelectedInstanceStore()

const currentRow = reactive({ data: [] as BackendForm[] })
const searchDto = reactive<GetBackendParams>({})

const { dialogForm: backendForm, open: openBackendForm, close: closeBackendForm } = useDialogForm<BackendForm, 'edit' | 'add'>(new BackendForm())
const { dialogForm: searchForm, open: openSearchForm, close: closeSearchForm } = useDialogForm<GetBackendParams>({})

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
    currentRow.data = res.data.map(BackendForm.fromBackend)
  }
}

const handleDelete = async (_index: number, row: BackendForm) => {
  let result = await backend.deleteBackend(row.id,)
  if (result) {
    ElMessage.success(t('common.status.success'))
  }
  await onSearch()
}

const onSumbit = async () => {
  if (backendForm.data === undefined) {
    return
  }
  if (backendForm.mode === 'edit') {
    let updateResult = await backend.updateBackend(backendForm.data)
    if (updateResult) {
      ElMessage.success(t('common.status.success'))
      await onSearch()
    }
  } else {
    let addResult = await backend.addBackend(backendForm.data)
    if (addResult) {
      ElMessage.success(t('common.status.success'))
      await onSearch()
    }
  }
  backendForm.close()
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
  <div class="flex space-x-4 mb-2">
    <el-input v-model="searchForm.data!.names" :placeholder="t('upstream.name')">
      <template #append>
        <el-button-group>
          <el-button text @click="() => openSearchForm()" :icon="Filter" type="primary"></el-button>
          <el-button text @click="onSearch" :icon="Search" type="primary"></el-button>
        </el-button-group>
      </template>
    </el-input>
    <el-button-group class="flex justify-end">
      <el-button text @click="() => openBackendForm(new BackendForm(), 'add')" :icon="Plus" type="primary">
        {{ t('common.operation.add')
        }}
      </el-button>
    </el-button-group>
  </div>
  <el-table v-loading="tableLoading" :data="currentRow.data" border stripe height="250" max-height="250"
    style="width: 100% ">
    <el-table-column prop="id" label="Name" width="180" />
    <el-table-column v-if="selectedStore.is_k8s()" prop="namespace" label="Namespace" />
    <el-table-column prop="protocol" label="Protocol">
      <template #default="scope">
        <el-tag v-if="scope.row.protocol">{{ scope.row.protocol }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="name_or_host" :label="selectedStore.is_k8s() ? 'ServiceName' : 'Host'" />
    <el-table-column prop="port" label="Port" />
    <el-table-column :label="t('common.operations')">
      <template #default="scope">
        <el-button-group>
          <el-button size="small" @click="openBackendForm(scope.row, 'edit')">{{ t('common.operation.edit') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">{{
            t('common.operation.delete') }}</el-button>
        </el-button-group>
      </template>
    </el-table-column>
  </el-table>
  <el-dialog v-model="backendForm.isOpen" :title="backendForm.mode === 'edit' ? 'edit instance' : 'add instance'"
    class="sp-service-drawer" :before-close="closeBackendForm">
    <div class="sp-service-drawer__content">
      <el-form :inline="false" v-if="backendForm.data !== undefined" :model="backendForm.data" label-width="auto">
        <el-row :gutter="8">
          <el-col v-bind="colSizeAttr">
            <el-form-item label="Name">
              <el-input v-model="backendForm.data.id" autocomplete="off" :disabled="backendForm.mode === 'edit'" />
            </el-form-item>
          </el-col>
          <el-col v-bind="colSizeAttr">
            <el-form-item label="Protocol">
              <el-select v-model="backendForm.data.protocol">
                <el-option v-for="item in Protocol" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-bind="colSizeAttr">
            <el-form-item :label="selectedStore.is_k8s() ? 'ServiceName' : 'Host'">
              <el-input v-model="backendForm.data.name_or_host" />
            </el-form-item>
          </el-col>
          <el-col v-bind="colSizeAttr">
            <el-form-item label="Namespace">
              <el-input v-model="backendForm.data.namespace" />
            </el-form-item>
          </el-col>
          <el-col v-bind="colSizeAttr">
            <el-form-item label="Port" max="">
              <el-input-number v-model="backendForm.data.port" :controls="false" :max="65536" :min="0" />
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
                    <el-input-number :controls="false" v-model="backendForm.data.timeout_ms" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="18">
                  <el-form-item label="Weight">
                    <el-input-number :controls="false" v-model="backendForm.data.weight" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="18">
                  <el-form-item label="Filters">
                    <ArraySelect ref="upstreamArraySelect" :selectedValues="backendForm.data.filters" />
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
        <el-button @click="closeBackendForm">{{ t('common.operation.cancel') }}</el-button>
        <el-button type="primary" :loading="tableLoading" @click="onSumbit">{{
          tableLoading ? t('common.status.submitting') : t('common.operation.submit')
        }}</el-button>
      </span>
    </template>
  </el-dialog>
  <el-dialog v-model="searchForm.isOpen" :title="t('common.operation.search')">
    <el-form v-if="searchForm.data !== undefined" :model="searchForm.data" class="flex-grow">
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item :label="t('route.name')">
            <el-input placeholder="name of service" v-model="searchForm.data.names" />
          </el-form-item>
        </el-col>
        <el-col v-if="selectedStore.is_k8s()" :span="12">
          <el-form-item label="namespace">
            <el-input placeholder="namespace of service" v-model="searchForm.data.namespace" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="closeSearchForm">{{ t('common.operation.cancel') }}</el-button>
      <el-button type="primary" :loading="tableLoading" @click="onSearch">{{
        tableLoading ? t('common.status.searching') : t('common.operation.search')
      }}</el-button>
    </template>
  </el-dialog>
</template>