<script setup lang="ts">
import { ElInput, ElMessage } from 'element-plus'
import { Edit, Promotion } from '@element-plus/icons-vue'
import { Statistics } from '../types/common';
import { onMounted, reactive, ref } from 'vue'

import { useI18n } from '../i18n/usei18n';
import { getStatisticsApi } from '../requset/api/common';

const t = await useI18n()

const currentDashbord = reactive({ data: {} as Statistics })

onMounted(async () => {
  await onSearch()
})

const onSearch = async () => {
  let res = await getStatisticsApi()

  if (res) {
    currentDashbord.data = res.data
  }
}

const stepActive = () => {
  if (currentDashbord.data.gateway_count == 0) {
    return 0
  }
  else if (currentDashbord.data.gateway_count > 0 && currentDashbord.data.route_count == 0) {
    return 1
  }
  else if (currentDashbord.data.gateway_count > 0 && currentDashbord.data.route_count > 0) {
    return 2
  }
  return 3
}
</script>
<template>
  <div class="sp-view-header">
    <el-row>
      <el-col :span="23">
        <h1>Dashboard</h1>
      </el-col>
    </el-row>
    <el-row>
      <el-divider style="margin-top: 24px;margin-bottom: 10px;" />
    </el-row>
    <el-row>
      <el-col :span="23"><span class="sp-view-header__sub-title">Welcome back</span></el-col>
    </el-row>
  </div>
  <el-row>
    <el-col :span="24">
      <el-row>
        <el-card class="box-card" style="width: 100%">
          <el-row>
            <h3>QuickStart</h3>
            <el-divider style="margin-top:10px;" />
          </el-row>
          <el-row>
            <el-col :span="1"></el-col>
            <el-col :span="6">
              <el-steps :space="100" direction="vertical" finish-status="success" :active="stepActive()">
                <el-step :icon="Edit" title="Step 1" />
                <el-step :icon="Edit" title="Step 2" />
                <el-step :icon="Promotion" title="Step 3" />
              </el-steps>
            </el-col>
            <el-col :span="6">
              <div style="display: grid;height: 100%;" class="step-content">
                <el-row>
                  <h4>Create Gateway</h4>
                </el-row>
                <el-row>
                  <h4>Create Httproute</h4>
                </el-row>
                <el-row>
                  <h4>Enjoy it!</h4>
                </el-row>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-row>
      <div style="text-align: center;">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="box-card">
              <el-statistic title="Total Gateway number" :value="currentDashbord.data.gateway_count" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="box-card">
              <el-statistic title="Total Route number" :value="currentDashbord.data.route_count" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="box-card">
              <el-statistic title="Total Plugin number" :value="currentDashbord.data.plugin_count" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="box-card">
              <el-statistic title="Total Upstream number" :value="currentDashbord.data.backend_count" />
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="box-card">
              <el-statistic title="Total TLS number" :value="currentDashbord.data.tls_count" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="box-card">
              <el-statistic title="Total Instance number" :value="currentDashbord.data.instance_count" />
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-col>
  </el-row>
</template>
<style lang="scss" scoped>
.box-card {
  margin: 10px;
}

:deep(.el-divider) {
  margin-top: 10px;
}
</style>
