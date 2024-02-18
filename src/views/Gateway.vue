<script setup lang="ts">
import { ElInput, ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

import { GetInstanceParams } from '../requset/api/instance/type';
import { InstConfigType, InstConfig, RedisConfig, K8sClusterConfig, } from '../types/instance';
import { useI18n } from 'vue-i18n';
import { useSpacegateService } from '../service';
import { useDialogForm } from '../types/forms'
import { Search, Plus } from '@element-plus/icons-vue'
import { InstConfigForm } from '../types/forms';
import { ConfigPanel } from '../components';
const { t } = useI18n()
const { instance } = useSpacegateService()

const currentRow = reactive({ data: [] as InstConfigForm[] })
const searchDto = reactive<GetInstanceParams>({})
const tableLoading = ref(false)

const newInstConfig = () => <InstConfig>{
  type_: InstConfigType.K8sClusterConfig,
  k8s_cluster_config: {
    name: '',
    config: {
      clusters: {
        cluster: {

        },
        name: '',
      },
      users: {
        auth_info: {
          token: '',
        },
        name: '',
      },
    }
  }
}
const { dialogForm: instConfigForm, open: openInstConfigForm, close: closeInstConfigForm } = useDialogForm<InstConfigForm, 'add' | 'edit'>(InstConfigForm.fromInstConfig(newInstConfig()))



onMounted(async () => {
  await onSearch()
})

const onSearch = async () => {
  tableLoading.value = true
  let res = await instance.getInstanceList(searchDto)

  if (res) {
    currentRow.data = res.data.map(InstConfigForm.fromInstConfig)
  }
  tableLoading.value = false
}

const handleDelete = async (_index: number, row: InstConfigForm) => {
  let res = await instance.deleteInstance(row.name,)
  if (res) {
    ElMessage.success(t('common.status.success'))
    await onSearch()
  }
}



const onSumbit = async () => {
  if (instConfigForm._data === undefined) {
    return
  }
  let data = instConfigForm._data.intoInstConfig()
  let result = instConfigForm.mode === 'edit' ? await instance.updateInstanceList(data) : await instance.addInstanceList(data)
  if (result) {
    ElMessage.success(t('common.status.success'))
    await onSearch()
  }
  closeInstConfigForm()
}


</script>
<template>
  <ConfigPanel>
    <template #search>
      <el-input v-model="searchDto.names" :placeholder="t('gateway.name')">
        <template #append>
          <el-button-group>
            <el-button text @click="onSearch" :icon="Search" type="primary"></el-button>
          </el-button-group>
        </template>
      </el-input>
    </template>
    <template #operation>
      <el-button-group class="flex justify-end">
        <el-button text @click="openInstConfigForm(InstConfigForm.fromInstConfig(newInstConfig()), 'add')" :icon="Plus"
          type="primary">
          {{ t('common.operation.add')
          }}
        </el-button>
      </el-button-group>
    </template>
    <el-table v-loading="tableLoading" :data="currentRow.data" border stripe style="width: 100% ">
      <el-table-column prop="name" :label="t('gateway.name')" width="180" />
      <el-table-column prop="type_" :label="t('gateway.type')">
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
  </ConfigPanel>

  <el-dialog v-model="instConfigForm.isOpen"
    :title="instConfigForm.mode === 'edit' ? t('gateway.editInstance') : t('gateway.addInstance')"
    class="sp-service-drawer" :before-close="closeInstConfigForm">
    <el-form v-if="instConfigForm.data !== undefined" :model="instConfigForm.data" label-width="auto" label-suffix=":">
      <el-row>
        <el-col>
          <el-form-item :label="t('gateway.name')">
            <el-input v-model="instConfigForm.data.name" autocomplete="off" :disabled="instConfigForm.mode === 'edit'" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col>
          <el-form-item :label="t('gateway.type')">
            <el-select v-model="instConfigForm.data.type">
              <el-option label="Redis" value="RedisConfig" />
              <el-option label="Kubernetes" value="K8sClusterConfig" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="instConfigForm.data.type == 'RedisConfig'">
        <el-col>
          <el-form-item label="URL">
            <el-input v-model="(instConfigForm.data.config as RedisConfig).url"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="instConfigForm.data.type == 'K8sClusterConfig'">
        <el-col>
          <el-form-item label="URL">
            <el-input
              v-model="(instConfigForm.data.config as K8sClusterConfig).config.clusters.cluster!.server"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="instConfigForm.data.type == 'K8sClusterConfig'">
        <el-col>
          <el-form-item :label="t('gateway.username')">
            <el-input v-model="(instConfigForm.data.config as K8sClusterConfig).config.users.name"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="instConfigForm.data.type == 'K8sClusterConfig'">
        <el-col>
          <el-form-item label="Token">
            <el-input v-model="(instConfigForm.data.config as K8sClusterConfig).config.users.auth_info!.token"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeInstConfigForm">{{ t('common.operation.cancel') }}</el-button>
        <el-button type="primary" :loading="tableLoading" @click="onSumbit">{{
          tableLoading ? t('common.status.submitting') : t('common.operation.submit')
        }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>