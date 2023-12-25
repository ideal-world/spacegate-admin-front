<script setup lang="ts">
import { ElInput, ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { Service, Listener } from '../types/service';
import { ServiceForm, ListenerForm, DialogForm, useDialogForm } from '../types/forms';
import { PORT_MAX, PORT_MIN } from '../constants';
import {
  GetGatewayParamsVO,
} from '../requset/api/service/type';
import {
  SERVICE_PROTOCOLS,
  ServiceProtocol
} from '../types/service';
import { useSelectedInstanceStore } from '../stores/select_instance';
import { ArraySelect, PluginSelector } from '../components/index';
import { Minus, Plus, ArrowRight, ArrowDown, Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useSpacegateService } from '../service';
import { useOptions } from '../hooks';
const { service } = useSpacegateService()
const { options: pluginOptions } = useOptions('plugin');
const { t } = useI18n()

const selectedStore = useSelectedInstanceStore()

const currentRow = reactive({ data: [] as ServiceForm[] })
const searchDto = reactive<GetGatewayParamsVO>({})

const listenerColSize = {
  xs: 24,
  sm: 24,
  md: 12,
  lg: 12,
  xl: 12
}

const searchColSize = {
  xs: 24,
  sm: 12,
  md: 8,
  lg: 8,
  xl: 6
}


const { dialogForm, open: openDialog, close: closeDialog } = useDialogForm<ServiceForm, 'add' | 'edit'>()
const { dialogForm: searchDialogForm, open: openSearchDialog, close: closeSearchDialog } = useDialogForm<GetGatewayParamsVO>()

const tableLoading = ref(false)

onMounted(async () => {
  await onSearch()
})

const onSearch = async () => {
  tableLoading.value = true
  let res = await service.getGateways(searchDto)

  if (res) {
    currentRow.data = res.data.map(ServiceForm.fromService)
  }
  tableLoading.value = false
}


const formatStrings = (_row: any, _column: any, cellValue: string[]) => {
  let result = ''
  if (cellValue) {
    cellValue.forEach((item) => {
      if (item != null && item != undefined) {
        result = result + item + ','
      }
    }
    )
  }
  return result.length > 0 ? result.substring(0, result.length - 1) : '-'
}

const formatPort = (_row: any, _column: any, cellValue: number[]) => {
  let port = ''
  if (cellValue) {
    cellValue.forEach((item) => {
      if (item) {
        port = port + item + ','
      }
    })
  }

  return port.length > 0 ? port.substring(0, port.length - 1) : '-'
}

const handleDelete = async (_index: number, row: ServiceForm) => {
  let a = await service.deleteGateways(row.name)
  if (a) {
    ElMessage.success(t('common.status.success'))
  }
  await onSearch()
}


const pluginArraySelect = ref()
const onSumbit = async () => {
  if (dialogForm.data === undefined) {
    return
  }
  dialogForm.data.filters = pluginArraySelect.value.selectedValues
  let res = dialogForm.mode === 'edit' ?
    await service.updateGateways(dialogForm.data.intoService()) :
    await service.addGateways(dialogForm.data.intoService())

  if (res) {
    ElMessage.success(t('common.status.success'))
    await onSearch()
  }
  closeDialog()
}
</script>
<template>
  <el-card shadow="never" :body-style="{ padding: '0px' }">
    <template #header>
      <div class="flex ">
        <span class="flex-grow">
          Service Config
        </span>
        <el-button @click="() => openDialog(new ServiceForm(), 'add')" :icon="Plus" type="primary">
          {{ t('common.operation.add')
          }}
        </el-button>
        <el-button @click="() => openSearchDialog({})" :icon="Search" type="primary">{{ t('common.operation.search')
        }}</el-button>
      </div>
    </template>

    <el-table v-loading="tableLoading" :data="currentRow.data">
      <el-table-column prop="name" label="Name" width="180" />
      <el-table-column prop="namespace" label="Namespace" v-if="selectedStore.is_k8s()" />
      <el-table-column :label="t('service.listener')">
        <el-table-column prop="ip" label="ip" :formatter="formatStrings" />
        <el-table-column prop="hostname" label="hostname" :formatter="formatStrings" />
        <el-table-column prop="port" label="port" :formatter="formatPort" width="180" />
      </el-table-column>
      <el-table-column :label="t('common.operations')">
        <template #default="scope">
          <el-button size="small" @click="() => openDialog(scope.row, 'edit')">Edit</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">{{
            t('common.operation.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>


  <el-dialog v-model="dialogForm.isOpen" :title="dialogForm.mode + ' service'" class="sp-service-drawer"
    :before-close="closeDialog">
    <el-form v-if="dialogForm.data !== undefined" :model="dialogForm.data" label-width="auto">
      <el-row class="flex-grow">
        <el-col>
          <el-form-item label="Name" :rules="[
            { required: true, message: 'name is required', trigger: 'blur' },
          ]
            ">
            <el-input v-model="dialogForm.data.name" autocomplete="off" :disabled="dialogForm.mode == 'edit'" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row class="flex-grow">
        <el-col>
          <el-form-item label="Namespace" v-if="selectedStore.is_k8s()" :rules="[
            { required: selectedStore.is_k8s(), message: 'namespace is required', trigger: 'blur' },
          ]
            ">
            <el-input v-model="dialogForm.data.namespace" autocomplete="off" :disabled="dialogForm.mode == 'edit'" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col>
          <el-form-item label="Filters">
            <el-select v-model="dialogForm.data.filters" placeholder="protocol" class="flex-grow">
              <el-option v-for=" option  in  pluginOptions " v-bind="option" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="listener" class="flex">
        <el-col v-for="( listener, index ) in  dialogForm.data.listeners " class="flex-grow mb-2">
          <div class="flex space-x-2 mb-1">
            <el-button circle text :icon="listener.collapsed ? ArrowRight : ArrowDown" @click="() => {
              listener.collapsed = !listener.collapsed
            }
              ">
            </el-button>
            <span class="flex-grow"> {{ listener.name ?? '' }} </span>
            <el-button text :icon="Minus" @click.prevent="dialogForm.data.listeners.splice(index, 1)" class="justify-end">
            </el-button>
          </div>
          <el-collapse-transition>
            <el-card shadow="hover" v-show="!listener.collapsed" class="flex-grow">
              <el-form label-width="auto" >
                <el-row :gutter="24">
                  <el-col class="mb-2" v-bind="listenerColSize">
                    <el-form-item label="name" required>
                      <el-input v-model="listener.name" autocomplete="off" />
                    </el-form-item>
                  </el-col>
                  <el-col class="mb-2" v-bind="listenerColSize" v-if="selectedStore.is_k8s()">
                    <el-form-item label="Namespace" :rules="[
                      { required: selectedStore.is_k8s(), message: 'namespace is required', trigger: 'blur' },
                    ]
                      ">
                      <el-input v-model="listener.namespace" autocomplete="off" :disabled="dialogForm.mode == 'edit'" />
                    </el-form-item>
                  </el-col>
                  <el-col class="mb-2" v-bind="listenerColSize">
                    <el-form-item label="port" required>
                      <el-input-number v-model="listener.port" :max="PORT_MAX" :min="PORT_MIN" />
                    </el-form-item>
                  </el-col>
                  <el-col class="mb-2" v-bind="listenerColSize">
                    <el-form-item label="protocol" required>
                      <el-select v-model="listener.protocol" placeholder="protocol" class="flex-grow">
                        <el-option v-for=" option  in  SERVICE_PROTOCOLS " :label="option" :value="option" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="mb-2" v-bind="listenerColSize">
                    <el-form-item label="ip">
                      <el-input v-model="listener.ip" autocomplete="off" />
                    </el-form-item>
                  </el-col>
                  <el-col class="mb-2" v-bind="listenerColSize">
                    <el-form-item label="tls">
                      <el-input v-model="listener.tls" autocomplete="off" />
                    </el-form-item>
                  </el-col>
                  <el-col class="mb-2" v-bind="listenerColSize">
                    <el-form-item label="hostname">
                      <el-input v-model="listener.hostname" autocomplete="off" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-card>
          </el-collapse-transition>
        </el-col>
        <el-col class="flex justify-end">
          <el-button @click="() => dialogForm.data!.listeners.push(new ListenerForm())" :icon="Plus" type="primary" text>
          </el-button>
        </el-col>
      </el-form-item>

      <el-collapse accordion>
        <el-collapse-item>
          <template #title>
            {{ t('common.advanced') }}<el-icon class="header-icon">
            </el-icon>
          </template>
          <el-row>
            <el-col v-bind="listenerColSize">
              <el-form-item label="ignore_tls">
                <el-switch v-model="dialogForm.data.parameters.ignore_tls_verification" />
              </el-form-item>
            </el-col>
            <el-col v-bind="listenerColSize">
              <el-form-item label="lang" v-bind="listenerColSize">
                <el-input v-model="dialogForm.data.parameters.lang" />
              </el-form-item>
            </el-col>
            <el-col v-bind="listenerColSize">
              <el-form-item label="log_level" v-bind="listenerColSize">
                <el-input v-model="dialogForm.data.parameters.log_level" />
              </el-form-item>
            </el-col>
            <el-col v-bind="listenerColSize">
              <el-form-item label="redis_url" v-bind="listenerColSize">
                <el-input v-model="dialogForm.data.parameters.redis_url" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-collapse-item>
      </el-collapse>
    </el-form>
    <template #footer>
      <span>
        <el-button @click="closeDialog">{{ t('common.operation.cancel') }}</el-button>
        <el-button type="primary" :loading="tableLoading" @click="onSumbit">{{
          tableLoading ? t('common.status.submitting') : t('common.operation.submit')
        }}</el-button>
      </span>
    </template>
  </el-dialog>

  <el-dialog v-model="searchDialogForm.isOpen" title="Search">
    <el-form v-if="searchDialogForm.data !== undefined" v-model="searchDialogForm.data"  label-width="auto">
      <el-row :gutter="24">
        <el-col :v-bind="searchColSize">
          <el-form-item :label="t('route.name')">
            <el-input placeholder="name of service" v-model="searchDto.names" />
          </el-form-item>
        </el-col>
        <el-col v-if="selectedStore.is_k8s()" :v-bind="searchColSize">
          <el-form-item label="namespace">
            <el-input placeholder="namespace of service" v-model="searchDto.namespace" />
          </el-form-item>
        </el-col>
        <el-col :v-bind="searchColSize">
          <el-form-item label="port">
            <el-input-number placeholder="port of service" v-model="searchDto.port" :max="PORT_MAX" :min="PORT_MIN" />
          </el-form-item>
        </el-col>
        <el-col :v-bind="searchColSize">
          <el-form-item label="hostname">
            <el-input placeholder="namespace of service" v-model="searchDto.hostname" />
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>
    <template #footer>
      <el-button @click="closeSearchDialog">{{ t('common.operation.cancel') }}</el-button>
      <el-button type="primary" :loading="tableLoading" @click="onSumbit">{{
        tableLoading ? t('common.status.submitting') : t('common.operation.submit')
      }}</el-button>
    </template>
  </el-dialog>
</template>
<style lang="scss" scoped></style>