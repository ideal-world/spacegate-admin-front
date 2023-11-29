<script setup lang="ts">
import { ElInput, ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { deleteGatewaysApi, getGatewaysApi } from '../requset/api/gateway'
import { Gateway, GatewayVO, Listener, Tls } from 'types/gateway';

import { useI18n } from '../i18n/usei18n'
import { GetGatewayParams } from 'requset/api/gateway/type';

const t = await useI18n()

const currentRow = reactive({ data: [] as GatewayVO[] })
const searchDto = reactive<GetGatewayParams>({})
const opDialog = reactive({ isOpen: false, isEdit: false, data: { parameters: {} } as GatewayVO })
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
const formatIp = (_row: any, _column: any, cellValue: Listener[]) => {
  let ip = ''
  cellValue.forEach((item) => {
    if (item.ip) {
      ip = item.ip + ','
    }
  }

  )
  return ip.length > 0 ? ip.substring(0, ip.length - 1) : '-'
}
const formatHostname = (_row: any, _column: any, cellValue: Listener[]) => {
  let hostname = ''
  cellValue.forEach((item) => {
    if (item.hostname) {
      hostname = item.hostname + ','
    }
  }

  )
  return hostname.length > 0 ? hostname.substring(0, hostname.length - 1) : '-'
}
const formatPort = (_row: any, _column: any, cellValue: Listener[]) => {
  let port = ''
  cellValue.forEach((item) => {
    if (item.port) {
      port = item.port + ','
    }
  }

  )
  return port.length > 0 ? port.substring(0, port.length - 1) : '-'
}

const handleEdit = (_index: number, row: GatewayVO) => {
  opDialog.isOpen = true;
  opDialog.isEdit = true;
  opDialog.data = row;
}

const handleDelete = async (_index: number, row: GatewayVO) => {
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
  opDialog.data = { parameters: {} } as GatewayVO
  opDialog.isOpen = false
}

const addIp = () => {
  if (!opDialog.data.ip) { opDialog.data.ip = [] }
  opDialog.data.ip.push("")
}

// const addListener = () => {
//   if (!opDialog.data.listeners) { opDialog.data.listeners = [] }
//   opDialog.data.listeners.push({} as Listener)
// }
// const deleteListener = (index: number) => {
//   opDialog.data.listeners.splice(index, 1)
// }

const tls_options = ref([
  { id: 1, label: 'disable', data: '' },
  { id: 2, label: 'able', data: { mode: '', key: '', cert: '' } },
])
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
    <el-space fill direction="vertical" style="width: 100%">
      <el-card shadow="never">
        <el-form :inline="true" :model="searchDto">
          <el-form-item :label="t('route.name')">
            <el-input placeholder="name of service" v-model="searchDto.name" />
          </el-form-item>
          <el-form-item label="namespace">
            <el-input placeholder="namespace of service" v-model="searchDto.namespace" />
          </el-form-item>
          <el-form-item label="port">
            <el-input placeholder="port of service" v-model="searchDto.port" />
          </el-form-item>
          <el-form-item label="hostname">
            <el-input placeholder="namespace of service" v-model="searchDto.hostname" />
          </el-form-item>
          <el-form-item><el-button @click="opDialog.isOpen = true">{{ t('common.operation.add') }}</el-button> <el-button
              @click="onSearch">{{ t('common.operation.search') }}</el-button></el-form-item>

        </el-form>
      </el-card>
      <el-table $loading="tableLoading" :data="currentRow.data" border stripe height="250" max-height="250"
        style="width: 100% ">
        <el-table-column prop="name" label="Name" width="180" />
        <el-table-column :label="t('service.listener')">
          <el-table-column prop="listeners" label="ip" :formatter="formatIp" />
          <el-table-column prop="listeners" label="hostname" :formatter="formatHostname" />
          <el-table-column prop="listeners" label="port" :formatter="formatPort" width="180" />
        </el-table-column>
        <!-- <el-table-column prop="filters" :label="t('service.plugin')">
          {{ filters }}
          <el-tag v-for="item in currentRow.data.filters" class="mx-1" round>
            {{ item }}
          </el-tag>
        </el-table-column> -->
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
          <el-form-item label="Name">
            <el-input v-model="opDialog.data.name" autocomplete="off" />
          </el-form-item>
          <el-form-item v-for="( ip, index ) in    opDialog.data.ip  " :key="index" :label="'ip:'">
            <el-form-item>
              <el-input v-model="opDialog.data.ip[index]">
                <template #prepend>
                  ip
                </template>
              </el-input>
            </el-form-item>
            <!-- <el-form-item label="port" :prop="'listeners.' + index + '.port'" :rules="[
              { required: true, message: 'port is required', trigger: 'blur' },
              { type: 'number', message: 'port must be a number', trigger: 'blur' },
            ]
              ">
              <el-input type="text" v-model.number="listener.port">
              </el-input>
            </el-form-item>
            <el-form-item>
              <div class="el-input el-input-group el-input-group--prepend">
                <div class="el-input-group__prepend">protocol</div>
                <el-select name="protocol" v-model="listener.protocol">
                  <el-option label="HTTP" value="http" />
                  <el-option label="HTTPS" value="https" />
                </el-select>
              </div>
            </el-form-item>
            <el-form-item>
              <div class="el-input el-input-group el-input-group--prepend">
                <div class="el-input-group__prepend">disable_tls</div>
                <el-select name="tls" v-model="listener.tls" value-key="key">
                  <el-option v-for="item in tls_options" :key="item.id" :label="item.label" :value="item.data" />
                </el-select>
              </div>
            </el-form-item>

            <div v-if="listener.tls">
              <el-form-item>
                <el-input v-model="listener.tls.mode">
                  <template #prepend>
                    tls.mode
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-input v-model="listener.tls.key" type="password">
                  <template #prepend>
                    tls.key
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-input v-model="listener.tls.cert" type="password">
                  <template #prepend>
                    tls.cert
                  </template>
                </el-input>
              </el-form-item>
            </div>
            <el-button class="mt-2" @click.prevent="deleteListener(index)">Delete</el-button>-->
          </el-form-item>
          <el-button @click="addIp">+</el-button>
        </el-form>
        <el-collapse accordion>
          <el-collapse-item>
            <template #title>
              {{ t('common.advanced') }}<el-icon class="header-icon">
                <info-filled />
              </el-icon>
            </template>
            <div>
              <el-form-item label="parameters">
                <el-form-item>
                  <div class="el-input el-input-group el-input-group--prepend">
                    <div class="el-input-group__prepend">disable_tls</div>
                    <el-select name="tls" v-model="opDialog.data.parameters.ignore_tls_verification">
                      <el-option label="disable" :value="false" />
                      <el-option label="able" :value="true" />
                    </el-select>
                  </div>
                </el-form-item>
              </el-form-item>
              <el-form-item>
                <el-input v-model="opDialog.data.parameters.lang">
                  <template #prepend>
                    lang
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-input v-model="opDialog.data.parameters.log_level">
                  <template #prepend>
                    log_level
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-input v-model="opDialog.data.parameters.redis_url">
                  <template #prepend>
                    redis_url
                  </template>
                </el-input>
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