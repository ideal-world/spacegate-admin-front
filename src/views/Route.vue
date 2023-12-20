<script setup lang="ts">
import { Ref, onMounted, reactive, ref } from 'vue'
import { Search, Edit } from '@element-plus/icons-vue'

import { GetHttpRouteParamsVO } from '../requset/api/route/type'
import { SgHttpRouteVO, convertRouteToVO, SgHttpHeaderMatchType, SgHttpPathMatchType, SgHttpQueryMatchType, convertVOToRoute } from '../types/route'
import { addHttpRouteApi, deleteHttpRouteApi, getHttpRouteApi, updateHttpRouteApi } from '../requset/api/route'
import { ElMessage } from 'element-plus'
import { useSelectedInstanceStore } from '../stores/select_instance'
import { getBackendApi } from '../requset/api/backend'
import { Backend, BackendVO, convertBackendToVO } from '../types/backend'
import { getGatewaysApi } from '../requset/api/service'
import { Service, ServiceVO, convertServiceToVO } from '../types/service'
import { ArraySelect } from '../components/index';
import { useI18n } from 'vue-i18n';

const { t }= useI18n()

const selectedStore = useSelectedInstanceStore()
const currentRow = reactive({ data: [] as SgHttpRouteVO[] })
const searchDto = reactive<GetHttpRouteParamsVO>({})
const initRouteVO = (): SgHttpRouteVO => {
  return convertRouteToVO({ name: selectedStore.is_k8s() ? '.' : '', gateway_name: '', priority: 0, filters: [], rules: [] })
}
const opDialog = reactive({ isOpen: false, isEdit: false, data: initRouteVO() })
const tableLoading = ref(false)

const gatewayList: Ref<Service[]> = ref([])

onMounted(async () => {
  await getGatewayList()
  await getBackendMap()
  await onSearch()
})

const onSearch = async () => {
  tableLoading.value = true
  let res = await getHttpRouteApi(searchDto)
    .finally(() => {
      tableLoading.value = false
    })

  if (res) {
    currentRow.data = res.data.map((resData) => convertRouteToVO(resData))
  }
}
const banckendMap: Map<string, BackendVO> = new Map()
const getBackendMap = async () => {
  let res = await getBackendApi()
  if (res) {
    res.data.map((item: Backend) => {
      return convertBackendToVO(item)
    }).forEach((item: BackendVO) => banckendMap.set(item.id, item))
  }
}

const getGatewayList = async () => {
  let res = await getGatewaysApi()
  if (res) {
    res.data.forEach((item: Service) => gatewayList.value.push(item))
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

const pluginArraySelect = ref()
const backendArraySelect = ref()
const onSumbit = async () => {
  opDialog.data.backends = backendArraySelect.value.selectedValues
  opDialog.data.filters = pluginArraySelect.value.selectedValues
  let res = opDialog.isEdit ? await updateHttpRouteApi(convertVOToRoute(opDialog.data)) : await addHttpRouteApi(convertVOToRoute(opDialog.data))
  if (res) {
    ElMessage.success(t('common.status.success'))
    onSearch()
  }
  closeDialog()
}
const closeDialog = () => {
  opDialog.data = initRouteVO()
  opDialog.isOpen = false
}

const getBackendInfo = (_row: any, _column: any, beckends: string[]) => {
  let result = beckends.map((item: string) => { let backend = banckendMap.get(item); if (backend) return backend.name_or_host }
  ).join(',')
  return result
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
          <el-row>
            <el-form-item :label="t('route.name')">
              <el-input placeholder="name of service" v-model="searchDto.names" />
            </el-form-item>
            <el-col v-if="selectedStore.is_k8s()" :span="6">
              <el-form-item label="namespace">
                <el-input placeholder="namespace of service" v-model="searchDto.namespace" />
              </el-form-item></el-col>
            <el-form-item class="float-right"><el-button @click="opDialog.isEdit = false; opDialog.isOpen = true">{{
              t('common.operation.add')
            }}</el-button>
              <el-button @click="onSearch">{{ t('common.operation.search') }}</el-button></el-form-item>
          </el-row>
        </el-form>
      </el-card>
      <el-table v-loading="tableLoading" :data="currentRow.data" border stripe height="250" max-height="250"
        style="width: 100% ">
        <el-table-column prop="name" label="Name" width="180" />
        <el-table-column prop="namespace" label="Namespace" v-if="selectedStore.is_k8s()" />
        <el-table-column prop="gateway_name" label="GatewayName" />
        <el-table-column prop=" hostname" label="hostname" :formatter="formatStrings" />
        <el-table-column prop="backends" label="Backend" :formatter="getBackendInfo" />

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
              <h4>Common</h4>
            </el-col>
          </el-row>
          <el-row>
            <el-divider class="mt-1" />
          </el-row>

          <el-row>
            <el-col>
              <el-form-item label="Name">
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

          <el-row><el-col>
              <el-form-item label="GatewayName" :rules="[
                { required: true, message: 'gatewayName is required', trigger: 'blur' },
              ]">
                <!-- <el-input v-model="opDialog.data.gateway_name" :disabled="opDialog.isEdit" /> -->
                <el-select v-model="opDialog.data.gateway_name" placeholder="Select gateway">
                  <el-option v-for="item in gatewayList" :key="item.name" :label="item.name" :value="item.name" />
                </el-select>
              </el-form-item>
            </el-col></el-row>

          <el-row>
            <el-col :span="18">
              <el-form-item :label="'Hostnames:'">
                <div v-for="( _, index ) in opDialog.data.hostnames  " :key="index">
                  <el-input class=" inline" v-model="opDialog.data.hostnames[index]" />
                  <el-button class="ml-2" @click.prevent="opDialog.data.hostnames.splice(index, 1)">-</el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-button @click="opDialog.data.hostnames.push('')">+</el-button>
            </el-col>
          </el-row>

          <el-row>
            <el-col>
              <h4>Match</h4>
            </el-col>
          </el-row>
          <el-row>
            <el-divider class="mt-1" />
          </el-row>
          <el-row>
            <el-col>
              <div v-for="( _, index ) in opDialog.data.matches  " :key="index">
                <!-- <el-input class=" inline" v-model="opDialog.data.matches[index]" /> -->
                <el-form-item :label="'Method:'" v-if="opDialog.data.matches[index].method">
                  <el-row v-if="opDialog.data.matches[index].method">
                    <el-input class=" inline" v-for="( _, index2 ) in opDialog.data.matches[index].method"
                      v-model="opDialog.data.matches[index].method![index2]" />
                  </el-row>
                </el-form-item>
                <el-form-item :label="'Header:'" v-if="opDialog.data.matches[index].header">
                  <el-row v-for="( _, index2 ) in opDialog.data.matches[index].header">
                    <div class="flex items-center">
                      <el-select v-model="opDialog.data.matches[index].header![index2].kind" placeholder="Select Kind">
                        <el-option v-for="option in Object.values(SgHttpHeaderMatchType)" :key="option" :label="option"
                          :value="option"></el-option>
                      </el-select>
                      <el-input v-model="opDialog.data.matches[index].header![index2].name" placeholder="Name"></el-input>
                      <el-input v-model="opDialog.data.matches[index].header![index2].value"
                        placeholder="Value"></el-input>
                    </div>
                  </el-row>
                </el-form-item>
                <el-form-item :label="'Path:'" v-if="opDialog.data.matches[index].path">
                  <el-row>
                    <div class="flex items-center">
                      <el-select v-model="opDialog.data.matches[index].path!.kind" placeholder="Select Kind">
                        <el-option v-for="option in Object.values(SgHttpPathMatchType)" :key="option" :label="option"
                          :value="option"></el-option>
                      </el-select>
                      <el-input v-model="opDialog.data.matches[index].path!.value" placeholder="Value"></el-input>
                    </div>
                  </el-row>
                </el-form-item>
                <el-form-item :label="'Query:'" v-if="opDialog.data.matches[index].query">
                  <el-row v-for="( _, index2 ) in opDialog.data.matches[index].query">
                    <div class="flex items-center">
                      <el-select v-model="opDialog.data.matches[index].query![index2].kind" placeholder="Select Kind">
                        <el-option v-for="option in Object.values(SgHttpQueryMatchType)" :key="option" :label="option"
                          :value="option"></el-option>
                      </el-select>
                      <el-input v-model="opDialog.data.matches[index].query![index2].name" placeholder="Name"></el-input>
                      <el-input v-model="opDialog.data.matches[index].query![index2].value"
                        placeholder="Value"></el-input>
                    </div>
                  </el-row>
                </el-form-item>
                <el-row>
                  <el-col :span="18">
                    <el-button-group>
                      <el-button :type="opDialog.data.matches[index].method ? 'primary' : undefined"
                        :plain="!opDialog.data.matches[index].method" class="ml-2"
                        @click.prevent="opDialog.data.matches[index].method ? opDialog.data.matches[index].method = undefined : opDialog.data.matches[index].method = ['']">method</el-button>
                      <el-button :type="opDialog.data.matches[index].header ? 'primary' : undefined"
                        :plain="!opDialog.data.matches[index].header" class="ml-2"
                        @click.prevent="opDialog.data.matches[index].header ? opDialog.data.matches[index].header = undefined : opDialog.data.matches[index].header = [{ kind: SgHttpHeaderMatchType.Exact, name: '', value: '' }]">header</el-button>
                      <el-button :type="opDialog.data.matches[index].path ? 'primary' : undefined"
                        :plain="!opDialog.data.matches[index].path" class="ml-2"
                        @click.prevent="opDialog.data.matches[index].path ? opDialog.data.matches[index].path = undefined : opDialog.data.matches[index].path = { kind: SgHttpPathMatchType.Exact, value: '' }">path</el-button>
                      <el-button :type="opDialog.data.matches[index].query ? 'primary' : undefined"
                        :plain="!opDialog.data.matches[index].query" class="ml-2"
                        @click.prevent="opDialog.data.matches[index].query ? opDialog.data.matches[index].query = undefined : opDialog.data.matches[index].query = [{ kind: SgHttpQueryMatchType.Exact, name: '', value: '' }]">query</el-button>
                    </el-button-group>
                  </el-col>
                  <el-col :span="4">
                    <el-button class="ml-2" @click.prevent="opDialog.data.matches.splice(index, 1)">-</el-button>
                  </el-col>
                </el-row>
              </div>
            </el-col>
            <el-col :span="4">
              <el-button @click="opDialog.data.matches.push({})">+</el-button>
            </el-col>
          </el-row>

          <el-row>
            <el-col>
              <h4>Other</h4>
            </el-col>
          </el-row>
          <el-row>
            <el-divider class="mt-1" />
          </el-row>

          <el-row>
            <el-col>
              <el-form-item :label="'backend:'">
                <ArraySelect ref="backendArraySelect" :selectedValues="opDialog.data.backends" apiType="backend" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col>
              <el-form-item :label="'filter:'">
                <ArraySelect ref="pluginArraySelect" :selectedValues="opDialog.data.filters" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- <el-collapse accordion>
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
          </el-collapse> -->
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