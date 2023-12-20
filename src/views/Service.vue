<script setup lang="ts">
import { ElInput, ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { addGatewaysApi, deleteGatewaysApi, getGatewaysApi, updateGatewaysApi } from '../requset/api/service'
import { convertServiceToVO, converVOToService, ServiceVO, Listener } from '../types/service';

import { GetGatewayParamsVO } from '../requset/api/service/type';
import { useSelectedInstanceStore } from '../stores/select_instance';
import { ArraySelect } from '../components/index';

import { useI18n } from 'vue-i18n';

const { t }= useI18n()

const selectedStore = useSelectedInstanceStore()

const currentRow = reactive({ data: [] as ServiceVO[] })
const searchDto = reactive<GetGatewayParamsVO>({})
const initServiceVO = (): ServiceVO => { return { name: '', namespace: '', ip: [], port: [], protocol: [], hostname: [], tls: '', filters: [], parameters: {} } }
const opDialog = reactive({ isOpen: false, isEdit: false, data: initServiceVO() })
const tableLoading = ref(false)

onMounted(async () => {
  await onSearch()
})

const onSearch = async () => {
  tableLoading.value = true
  let res = await getGatewaysApi(searchDto)

  if (res) {
    currentRow.data = res.data.map((resData) => convertServiceToVO(resData))
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

const handleAdd = () => {
  opDialog.isOpen = true;
  opDialog.isEdit = false;
  opDialog.data = { parameters: {}, port: [80], protocol: ["Http"] } as ServiceVO
}

const handleEdit = (_index: number, row: ServiceVO) => {
  opDialog.isOpen = true;
  opDialog.isEdit = true;
  opDialog.data = row;
}

const handleDelete = async (_index: number, row: ServiceVO) => {
  let a = await deleteGatewaysApi(row.name)
  if (a) {
    ElMessage.success(t('common.status.success'))
  }
  await onSearch()
}


const pluginArraySelect = ref()
const onSumbit = async () => {
  opDialog.data.filters = pluginArraySelect.value.selectedValues
  let res = opDialog.isEdit ? await updateGatewaysApi(converVOToService(opDialog.data)) :
    await addGatewaysApi(converVOToService(opDialog.data))

  if (res) {
    ElMessage.success(t('common.status.success'))
    await onSearch()
  }
  closeDialog()
}

const closeDialog = () => {
  opDialog.data = initServiceVO()
  opDialog.isOpen = false
}

const addIp = () => {
  if (!opDialog.data.ip) { opDialog.data.ip = [] }
  opDialog.data.ip.push("")
}
const deleteIp = (index: number) => {
  if (opDialog.data.ip) {
    opDialog.data.ip.splice(index, 1)
  }
}
const addPort = () => {
  if (!opDialog.data.port) { opDialog.data.port = [] }
  opDialog.data.port.push(0)
}
const deletePort = (index: number) => {
  opDialog.data.port.splice(index, 1)
}
const addHostname = () => {
  if (!opDialog.data.hostname) { opDialog.data.hostname = [] }
  opDialog.data.hostname.push("")
}
const deleteHostname = (index: number) => {
  if (opDialog.data.hostname) {
    opDialog.data.hostname.splice(index, 1)
  }
}

const addProtocol = () => {
  if (!opDialog.data.protocol) { opDialog.data.protocol = [] }
  opDialog.data.protocol.push("Http")
}
const deleteProtocol = (index: number) => {
  opDialog.data.protocol.splice(index, 1)
}

const addFilter = () => {
  if (!opDialog.data.filters) { opDialog.data.filters = [] }
  opDialog.data.filters.push("")
}
const deleteFilter = (index: number) => {
  if (opDialog.data.filters) {
    opDialog.data.filters.splice(index, 1)
  }
}

</script>
<template>
  <div class="sp-view-header">
    <el-row>
      <el-col :span="23">
        <h1>Service</h1>
      </el-col>
    </el-row>
    <el-row>
      <el-divider style="margin-top: 24px;margin-bottom: 10px;" />
    </el-row>
    <el-row>
      <el-col :span="23"><span class="sp-view-header__sub-title">Set you service</span></el-col>
    </el-row>
  </div>
  <div class="pt-4">
    <el-space fill direction="vertical">
      <el-card shadow="never">
        <el-form :inline="true" :model="searchDto">
          <el-row>
            <el-col :span="6">
              <el-form-item :label="t('route.name')">
                <el-input placeholder="name of service" v-model="searchDto.names" />
              </el-form-item>
            </el-col>
            <el-col v-if="selectedStore.is_k8s()" :span="6">
              <el-form-item label="namespace">
                <el-input placeholder="namespace of service" v-model="searchDto.namespace" />
              </el-form-item></el-col>
            <el-col :span="6">
              <el-form-item label="port">
                <el-input placeholder="port of service" v-model="searchDto.port" />
              </el-form-item></el-col>
            <el-col :span="6">
              <el-form-item label="hostname">
                <el-input placeholder="namespace of service" v-model="searchDto.hostname" />
              </el-form-item></el-col>
            <el-form-item><el-button @click="handleAdd">{{ t('common.operation.add') }}</el-button> <el-button
                @click="onSearch">{{ t('common.operation.search') }}</el-button>
            </el-form-item>
          </el-row>
        </el-form>
      </el-card>
      <el-table v-loading="tableLoading" :data="currentRow.data" border stripe height="250" max-height="250"
        style="width: 100% ">
        <el-table-column prop="name" label="Name" width="180" />
        <el-table-column prop="namespace" label="Namespace" v-if="selectedStore.is_k8s()" />
        <el-table-column :label="t('service.listener')">
          <el-table-column prop="ip" label="ip" :formatter="formatStrings" />
          <el-table-column prop="hostname" label="hostname" :formatter="formatStrings" />
          <el-table-column prop="port" label="port" :formatter="formatPort" width="180" />
        </el-table-column>
        <el-table-column :label="t('common.operations')">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.$index, scope.row)">Edit</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">{{
              t('common.operation.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-space>
    <el-dialog v-model="opDialog.isOpen" :title="opDialog.isEdit ? 'edit service' : 'add service'"
      class="sp-service-drawer" :before-close="closeDialog">
      <div class="sp-service-drawer__content">
        <el-form :inline="true" :model="opDialog.data">
          <el-row>
            <el-col :span="18">
              <el-form-item label="Name" :rules="[
                { required: true, message: 'name is required', trigger: 'blur' },
              ]">
                <el-input v-model="opDialog.data.name" autocomplete="off" :disabled="opDialog.isEdit" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row><el-col>
              <el-form-item label="Namespace" v-if="selectedStore.is_k8s()" :rules="[
                { required: selectedStore.is_k8s(), message: 'namespace is required', trigger: 'blur' },
              ]">
                <el-input v-model="opDialog.data.namespace" autocomplete="off" :disabled="opDialog.isEdit" />
              </el-form-item>
            </el-col></el-row>

          <el-row>
            <el-col :span="18">
              <el-form-item :label="'protocol:'" :rules="[
                { required: true, message: 'protocol is required', trigger: 'blur' },
              ]">
                <div v-for="( _, index ) in    opDialog.data.protocol  " :key="index">
                  <el-select name="protocol" v-model="opDialog.data.protocol[index]">
                    <el-option label="HTTP" value="Http" />
                    <el-option label="HTTPS" value="Https" />
                  </el-select>
                  <el-button class="ml-2" v-if="index > 0" @click.prevent="deleteProtocol(index)">-</el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-button @click="addProtocol">+</el-button>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="18">
              <el-form-item :label="'port:'" :rules="[
                { required: true, message: 'port is required', trigger: 'blur' },
                { type: 'number', message: 'port must be a number', trigger: 'blur' },
              ]">
                <div v-for=" ( _, index ) in opDialog.data.port " :key="index">
                  <el-input-number class=" inline" :controls="false" v-model="opDialog.data.port[index]" />
                  <el-button class="ml-2" v-if="index > 0" @click.prevent="deletePort(index)">-</el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-button @click="addPort">+</el-button>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="18">
              <el-form-item :label="'ip:'">
                <div v-for="( _, index ) in opDialog.data.ip  " :key="index">
                  <el-input class=" inline" v-model="opDialog.data.ip[index]" />
                  <el-button class="ml-2" @click.prevent="deleteIp(index)">-</el-button>
                </div>
                <!-- <el-form-item label="port" :prop="'listeners.' + index + '.port'" :rules="[
              { required: true, message: 'port is required', trigger: 'blur' },
              { type: 'number', message: 'port must be a number', trigger: 'blur' },
            ]
              ">-->
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-button @click="addIp">+</el-button>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="18">
              <el-form-item :label="'hostname:'">
                <div v-for="( _, index ) in    opDialog.data.hostname  " :key="index">
                  <el-input class=" inline" v-model="opDialog.data.hostname[index]" />
                  <el-button class="ml-2" @click.prevent="deleteHostname(index)">-</el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-button @click="addHostname">+</el-button>
            </el-col>
          </el-row>
          <el-row>
            <el-col>
              <el-form-item :label="'filter:'">
                <ArraySelect ref="pluginArraySelect" :selectedValues="opDialog.data.filters" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <el-collapse accordion>
          <el-collapse-item>
            <template #title>
              {{ t('common.advanced') }}<el-icon class="header-icon">
              </el-icon>
            </template>
            <div>
              <el-form-item label="disable_tls">
                <div>
                  <el-select name="tls" v-model="opDialog.data.parameters.ignore_tls_verification">
                    <el-option label="disable" :value="false" />
                    <el-option label="able" :value="true" />
                  </el-select>
                </div>
              </el-form-item>
              <el-form-item label="lang">
                <el-input v-model="opDialog.data.parameters.lang" />
              </el-form-item>
              <el-form-item label="log_level">
                <el-input v-model="opDialog.data.parameters.log_level" />
              </el-form-item>
              <el-form-item label="redis_url">
                <el-input v-model="opDialog.data.parameters.redis_url" />
              </el-form-item>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
      <template #footer>
        <span>
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
@import '../assets/main.scss';

@include b('service-drawer') {
  margin: 50px;

  .el-form-item__content {
    margin: {
      bottom: 16px;
    }
  }
}

:deep(.sp-service-drawer) {
  size: 80px;
}
</style>