<script setup lang="ts">
import { Ref, onMounted, reactive, ref } from 'vue'
import { Search, Plus, Minus, ArrowRight, ArrowDown, Filter } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'

import { GetHttpRouteParamsVO } from '../requset/api/route/type'
import { SgHttpRouteVO, convertRouteToVO, SgHttpHeaderMatchType, SgHttpPathMatchType, SgHttpQueryMatchType, convertVOToRoute, SG_HTTP_METHODS, SgHttpHeaderMatch, SgHttpQueryMatch } from '../types/route'
import { addHttpRouteApi, deleteHttpRouteApi, getHttpRouteApi, updateHttpRouteApi } from '../requset/api/route'
import { ElMessage } from 'element-plus'
import { useSelectedInstanceStore } from '../stores/select_instance'
import { Backend, BackendVO, convertBackendToVO } from '../types/backend'
import { Service, } from '../types/service'
import { useI18n } from 'vue-i18n';
import { useSpacegateService } from '../service'
import { useOptions } from '../hooks'
import { useDialogForm } from '../types/forms'

import { ConfigPanel } from '../components'
import { getVOId } from '../types'
const { t } = useI18n()
const { service, backend } = useSpacegateService()
const { options: pluginOptions } = useOptions('plugin');
const { options: backendOptions } = useOptions('backend');
const selectedStore = useSelectedInstanceStore()
const currentRow = reactive({ data: [] as SgHttpRouteVO[] })
const initRouteVO = (): SgHttpRouteVO => {
  return convertRouteToVO({ name: selectedStore.is_k8s() ? '.' : '', gateway_name: '', priority: 0, filters: [], rules: [] })
}
const opDialog = reactive({ isOpen: false, isEdit: false, data: initRouteVO() })
const tableLoading = ref(false)

const gatewayList: Ref<Service[]> = ref([])

const { dialogForm: searchDialogForm, open: openSearchDialog, close: closeSearchDialog } = useDialogForm<GetHttpRouteParamsVO, 'edit' | 'add'>({})
onMounted(async () => {
  await getGatewayList()
  await getBackendMap()
  await onSearch()
})

const onSearch = async () => {
  tableLoading.value = true
  let res = await getHttpRouteApi(searchDialogForm.data)
    .finally(() => {
      tableLoading.value = false
    })

  if (res) {
    currentRow.data = res.data.map((resData) => convertRouteToVO(resData))
  }
}
const banckendMap: Map<string, BackendVO> = new Map()
const formRef = ref<FormInstance>()

const getBackendMap = async () => {
  let res = await backend.getBackend({})
  if (res) {
    res.data.map((item: Backend) => {
      return convertBackendToVO(item)
    }).forEach((item: BackendVO) => banckendMap.set(item.id, item))
  }
}

const getGatewayList = async () => {
  let res = await service.getGateways({})
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
  let result = await deleteHttpRouteApi(getVOId(row))
  if (result) {
    ElMessage.success(t('common.status.success'))
  }
  await onSearch()
}

const onSumbit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    console.log('onSumbit====', valid)
    if (!valid) {
      ElMessage.error(t('common.status.fail'))
      return false
    }
    let res = opDialog.isEdit ? await updateHttpRouteApi(convertVOToRoute(opDialog.data)) : await addHttpRouteApi(convertVOToRoute(opDialog.data))
    if (res) {
      ElMessage.success(t('common.status.success'))
      onSearch()
    }
    closeDialog()
  })
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

const colSizeAttr = {
  xs: 24,
  sm: 24,
  md: 12,
  lg: 12,
  xl: 12
}

</script>
<template>
  <ConfigPanel>
    <template #search>
      <el-input v-model="searchDialogForm.data!.names" :placeholder="t('route.name')">
        <template #append>
          <el-button-group>
            <el-button text @click="() => openSearchDialog()" :icon="Filter" type="primary"></el-button>
            <el-button text @click="onSearch" :icon="Search" type="primary"></el-button>
          </el-button-group>
        </template>
      </el-input>
    </template>
    <template #operation>
      <el-button-group class="flex justify-end">
        <el-button text @click="opDialog.isEdit = false; opDialog.isOpen = true" :icon="Plus" type="primary">
          {{ t('common.operation.add') }}
        </el-button>
      </el-button-group>
    </template>
    <el-table v-loading="tableLoading" :data="currentRow.data" border stripe>
      <el-table-column fixed prop="name" :label="t('route.name')" />
      <el-table-column prop="namespace" :label="t('route.namespace')" v-if="selectedStore.is_k8s()" />
      <el-table-column prop="gateway_name" :label="t('route.gatewayName')" />
      <el-table-column prop="hostnames" :label="t('route.hostname')" :formatter="formatStrings" />
      <el-table-column prop="backends" :label="t('route.backend')" :formatter="getBackendInfo" />

      <el-table-column fixed="right" :label="t('common.operations')">
        <template #default="scope">
          <el-button-group>
            <el-button size="small" @click="handleEdit(scope.$index, scope.row)">
              {{ t('common.operation.edit') }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">{{
              t('common.operation.delete') }}</el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
  </ConfigPanel>

  <el-dialog v-model="opDialog.isOpen" :before-close="closeDialog">
    <template #header>
      <span>{{ opDialog.isEdit ? t('route.editRoute') : t('route.addRoute') }}</span>
    </template>
    <el-form ref="formRef" :inline="false" :model="opDialog.data" label-width="auto">
      <h4>Common</h4>
      <el-divider class="mt-1" />
      <el-row :gutter="24">
        <el-col v-bind="colSizeAttr">
          <el-form-item :label="t('route.name')" prop="name" :rules="[
            { required: true, message: 'name is required', trigger: ['blur', 'change'] }
          ]">
            <el-input v-model="opDialog.data.name" autocomplete="off" :disabled="opDialog.isEdit" />
          </el-form-item>
        </el-col>
        <el-col v-bind="colSizeAttr" v-if="selectedStore.is_k8s()">
          <el-form-item :label="t('route.namespace')" prop="namespace" :rules="[
            { required: selectedStore.is_k8s(), message: 'namespace is required', trigger: 'change' },
          ]">
            <el-input v-model="opDialog.data.namespace" autocomplete="off" :disabled="opDialog.isEdit" />
          </el-form-item>
        </el-col>
        <el-col v-bind="colSizeAttr">
          <el-form-item :label="t('route.gatewayName')" prop="gateway_name" :rules="[
            { required: true, message: 'gatewayName is required', trigger: 'blur' },
          ]">
            <el-select v-model="opDialog.data.gateway_name" placeholder="Select gateway">
              <el-option v-for="item in gatewayList" :key="item.name" :label="item.name" :value="item.name" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-form-item :label="t('route.hostname')" class="flex-grow">
          <el-col v-for="(_item, index) in opDialog.data.hostnames" :key="index" :span="24" class="mb-1">
            <el-input v-model="opDialog.data.hostnames[index]">
              <template #append>
                <el-button class="ml-2" @click.prevent="opDialog.data.hostnames.splice(index, 1)" :icon="Minus">
                </el-button>
              </template>
            </el-input>
          </el-col>
          <el-col :span="24" class="flex justify-end">
            <el-button type="primary" @click="opDialog.data.hostnames.push('')" text :icon="Plus"></el-button>
          </el-col>
        </el-form-item>
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
        <el-col v-for="( match, index ) in opDialog.data.matches" :key="index" class="mb-4">
          <div class="match-item-header flex">
            <el-button circle text :icon="match.collapsed ? ArrowRight : ArrowDown" @click="() => {
              match.collapsed = !match.collapsed
            }">
            </el-button>
            <el-button-group class="flex-grow mb-2 ml-2">
              <el-button :type="match.path ? 'primary' : undefined" :plain="!match.path"
                @click.prevent="match.path ? match.path = undefined : match.path = { kind: SgHttpPathMatchType.Exact, value: '' }">path</el-button>
              <el-button :type="match.method ? 'primary' : undefined" :plain="!match.method"
                @click.prevent="match.method ? match.method = undefined : match.method = []">method</el-button>
              <el-button :type="match.header ? 'primary' : undefined" :plain="!match.header"
                @click.prevent="match.header ? match.header = undefined : match.header = [{ kind: SgHttpHeaderMatchType.Exact, name: '', value: '' }]">header</el-button>
              <el-button :type="match.query ? 'primary' : undefined" :plain="!match.query"
                @click.prevent="match.query ? match.query = undefined : match.query = [{ kind: SgHttpQueryMatchType.Exact, name: '', value: '' }]">query</el-button>
            </el-button-group>
            <el-button text :icon="Minus" @click.prevent="opDialog.data.matches.splice(index, 1)">
            </el-button>
          </div>
          <el-collapse-transition>
            <el-card shadow="hover" v-show="!match.collapsed">
              <el-row v-if="!match.path && !match.header && !match.query && !match.method" :image="undefined">
                <el-button disabled type="text" class="flex-grow">No Rule</el-button>
              </el-row>
              <el-row>
                <el-form-item :label="t('route.path')" v-if="match.path" class="flex-grow">
                  <el-input v-model="match.path!.value" placeholder="Value" class="flex-grow">
                    <template #prepend>
                      <el-select v-model="match.path!.kind" placeholder="Select Kind">
                        <el-option v-for="option in Object.values(SgHttpPathMatchType)" :key="option" :label="option"
                          :value="option"></el-option>
                      </el-select>
                    </template>
                  </el-input>
                </el-form-item>
              </el-row>
              <el-row>
                <el-form-item :label="t('route.method')" v-if="match.method" class="flex-grow">
                  <el-select v-model="(match.method as string[])" multiple placeholder="Http Methods" class="flex-grow">
                    <el-option v-for="M in SG_HTTP_METHODS" :key="M" :label="M" :value="M" />
                  </el-select>
                </el-form-item>
              </el-row>
              <el-row>
                <el-form-item :label="t('route.header')" v-if="match.header" class="flex-grow">
                  <el-col v-for="( header, _ ) in match.header" class="flex">
                    <el-select v-model="header.kind" placeholder="Select Kind">
                      <el-option v-for="option in Object.values(SgHttpHeaderMatchType)" :key="option" :label="option"
                        :value="option"></el-option>
                    </el-select>
                    <el-input v-model="header.name" placeholder="Name">
                    </el-input>
                    <el-input v-model="header.value" placeholder="Value"></el-input>
                    <el-button text class="ml-2" @click.prevent="match.header?.splice(index, 1)" :icon="Minus">
                    </el-button>
                  </el-col>
                  <el-col class="flex justify-end">
                    <el-button text type="primary" @click="match.header?.push(<SgHttpHeaderMatch>{
                      kind: SgHttpHeaderMatchType.Exact,
                      name: '',
                      value: ''
                    })" :icon="Plus"></el-button>
                  </el-col>
                </el-form-item>
              </el-row>
              <el-row>
                <el-form-item :label="t('route.query')" v-if="match.query" class="flex-grow">
                  <el-col v-for="( query, _ ) in match.query" class="flex">
                    <el-select v-model="query.kind" placeholder="Select Kind">
                      <el-option text v-for="option in Object.values(SgHttpQueryMatchType)" :key="option" :label="option"
                        :value="option"></el-option>
                    </el-select>
                    <el-input v-model="query.name" placeholder="Name">
                    </el-input>
                    <el-input v-model="query.value" placeholder="Value"></el-input>
                    <el-button text class="ml-2" @click.prevent="match.query?.splice(index, 1)" :icon="Minus">
                    </el-button>
                  </el-col>
                  <el-col class="flex justify-end">
                    <el-button type="primary" @click="match.query?.push(<SgHttpQueryMatch>{
                      kind: SgHttpQueryMatchType.Exact,
                      name: '',
                      value: ''
                    })" text :icon="Plus"></el-button>
                  </el-col>
                </el-form-item>
              </el-row>
            </el-card>
          </el-collapse-transition>
        </el-col>

        <el-col class="flex justify-end">
          <el-button @click="opDialog.data.matches.push({
            collapsed: false,
          })" text :icon="Plus" type="primary"></el-button>
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
        <el-form-item :label="t('route.backend')" class="flex flex-grow">
          <el-select v-model="opDialog.data.backends" placeholder="backends" multiple class="flex-grow">
            <el-option v-for="option in backendOptions" v-bind="option"><span class="mr-1">{{ option.label
            }}</span><el-tag v-if="option.tag">{{ option.tag }}</el-tag></el-option>
          </el-select>
        </el-form-item>
      </el-row>

      <el-row>
        <el-form-item :label="t('route.filter')" class="flex flex-grow">
          <el-select v-model="opDialog.data.filters" placeholder="Filters" multiple class="flex-grow">
            <el-option v-for="option in pluginOptions" v-bind="option"><span class="mr-1">{{ option.label
            }}</span><el-tag v-if="option.tag">{{ option.tag }}</el-tag></el-option>
          </el-select>
        </el-form-item>
      </el-row>

      <el-row>
        <el-form-item :label="t('route.priority')" class="flex flex-grow">
          <el-input-number :controls="false" v-model="opDialog.data.priority" />
        </el-form-item>
      </el-row>

      <el-row>
        <el-form-item :label="t('route.timeoutMs')" class="flex flex-grow">
          <el-input-number :controls="false" v-model="opDialog.data.timeout_ms" />
        </el-form-item>
      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">{{ t('common.operation.cancel') }}</el-button>
        <el-button type="primary" :loading="tableLoading" @click="onSumbit(formRef)">{{
          tableLoading ? t('common.status.submitting') : t('common.operation.submit')
        }}</el-button>
      </span>
    </template>
  </el-dialog>

  <el-dialog v-model="searchDialogForm.isOpen">
    <el-form v-if="searchDialogForm.data !== undefined" :model="searchDialogForm.data" class="flex-grow">
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item :label="t('route.name')">
            <el-input placeholder="name of service" v-model="searchDialogForm.data.names" />
          </el-form-item>
        </el-col>
        <el-col v-if="selectedStore.is_k8s()" :span="12">
          <el-form-item :label="t('route.namespace')">
            <el-input placeholder="namespace of service" v-model="searchDialogForm.data.namespace" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="closeSearchDialog">{{ t('common.operation.cancel') }}</el-button>
      <el-button type="primary" :loading="tableLoading" @click="onSearch">{{
        tableLoading ? t('common.status.searching') : t('common.operation.search')
      }}</el-button>
    </template>
  </el-dialog>
</template>