<script setup lang="ts">
import { ElDrawer, ElInput, ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

import { useI18n } from '../i18n/usei18n'
import { addInstanceListApi, updateInstanceListApi, deleteInstanceApi, getInstanceListApi } from '../requset/api/instance';
import { GetInstanceParams } from '../requset/api/instance/type';
import { InstConfigType, InstConfig, getInstName, InstConfigVO, convertInstanceToVO, convertVOToInstance } from '../types/instance';

const t = await useI18n()

const currentRow = reactive({ data: [] as InstConfigVO[] })
const searchDto = reactive<GetInstanceParams>({})
const initInstConfigVO = () => { return { name: '', type_: InstConfigType.RedisConfig, redis_url: '', k8s_cluster_config: { server_url: '', username: '', token: '' } } }
const opDialog = reactive({ isOpen: false, isEdit: false, data: initInstConfigVO() })
const tableLoading = ref(false)

onMounted(async () => {
  await onSearch()
})

const onSearch = async () => {
  tableLoading.value = true
  let res = await getInstanceListApi(searchDto)
    .catch((a) => { console.log('catch=====' + a) })
    .finally(() => {
      tableLoading.value = false
    })

  if (res) {
    currentRow.data = res.data.map((resData) => convertInstanceToVO(resData))
  }
}

const handleEdit = (_index: number, row: InstConfigVO) => {
  opDialog.isOpen = true;
  opDialog.isEdit = true;
  opDialog.data = row;
}

const handleDelete = async (_index: number, row: InstConfigVO) => {
  await deleteInstanceApi(row.name,)
    .then(() => { ElMessage.success(t('common.status.success')) })
    .catch((a) => { console.log('catch=====' + a) })
    .finally(async () => {
      await onSearch()
    })
}



const onSumbit = async () => {
  let data = convertVOToInstance(opDialog.data)
  let result = opDialog.isEdit ? await updateInstanceListApi(data) : await addInstanceListApi(data)
  if (result) {
    ElMessage.success(t('common.status.success'))
    await onSearch()
  }
  closeDialog()
}

const closeDialog = () => {
  opDialog.data = initInstConfigVO()
  opDialog.isOpen = false
}

</script>
<template>
  <div class="sp-view-header">
    <el-row>
      <el-col :span="23">
        <h1>Gateway Instance</h1>
      </el-col>
    </el-row>
    <el-row>
      <el-divider style="margin-top: 24px;margin-bottom: 10px;" />
    </el-row>
    <el-row>
      <el-col :span="23"><span class="sp-view-header__sub-title">Manage you gateway instances</span></el-col>
    </el-row>
  </div>
  <div class="pt-4">
    <el-space fill direction="vertical" style="width: 100%">
      <el-card shadow="never" class=" justify-center">
        <el-form :inline="true" :model="searchDto">
          <el-form-item :label="t('route.name')">
            <el-input placeholder="name of service" v-model="searchDto.names" />
          </el-form-item>
          <el-form-item class="float-right"><el-button @click="opDialog.isOpen = true">{{ t('common.operation.add')
          }}</el-button>
            <el-button @click="onSearch">{{ t('common.operation.search') }}</el-button></el-form-item>

        </el-form>
      </el-card>
      <el-table v-loading="tableLoading" :data="currentRow.data" border stripe height="250" max-height="250"
        style="width: 100% ">
        <el-table-column prop="name" label="Name" width="180" />
        <el-table-column prop="type_" label="Type">
          <template #default="scope">
            <el-tag>{{ scope.row.type_ == "K8sClusterConfig" ? "Kubernetes" : "Redis" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="redis_url" label="RedisConfig"></el-table-column>
        <el-table-column label="KubeConfig">
          <el-table-column prop="server_url" label="Url" />
          <el-table-column prop="username" label="Username" />
        </el-table-column>
        <el-table-column :label="t('common.operations')">
          <template #default="scope">
            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">{{
              t('common.operation.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-space>
    <el-dialog v-model="opDialog.isOpen" :title="opDialog.isEdit ? 'edit instance' : 'add instance'"
      class="sp-service-drawer" :before-close="closeDialog">
      <div class="sp-service-drawer__content">
        <el-form :inline="true" :model="opDialog.data">
          <el-row>
            <el-col>
              <el-form-item label="Name">
                <el-input v-model="opDialog.data.name" autocomplete="off" :disabled="opDialog.isEdit" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="18">
              <el-form-item label="Type">
                <el-select v-model="opDialog.data.type_">
                  <el-option label="Redis" value="RedisConfig" />
                  <el-option label="Kubernetes" value="K8sClusterConfig" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row v-if="opDialog.data.type_ == 'RedisConfig'">
            <el-col :span="18">
              <el-form-item label="URL">
                <el-input v-model="opDialog.data.redis_url"></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row v-if="opDialog.data.type_ == 'K8sClusterConfig'">
            <el-col :span="18">
              <el-form-item label="URL">
                <el-input v-model="opDialog.data.k8s_cluster_config.server_url"></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row v-if="opDialog.data.type_ == 'K8sClusterConfig'">
            <el-col :span="18">
              <el-form-item label="Username">
                <el-input v-model="opDialog.data.k8s_cluster_config.username"></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row v-if="opDialog.data.type_ == 'K8sClusterConfig'">
            <el-col :span="18">
              <el-form-item label="Token">
                <el-input v-model="opDialog.data.k8s_cluster_config.token"></el-input>
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