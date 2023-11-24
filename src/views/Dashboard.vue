<script setup lang="ts">
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
              <el-steps :space="100" direction="vertical" finish-status="success">
                <el-step :active="true" title="Step 1" />
                <el-step title="Step 2" />
                <el-step title="Step 3" />
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
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="box-card">
            <h3>Gateway</h3>
            <el-divider />
            <span>
              Total Gateway number: 1
            </span>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="box-card">
            <h3>Route</h3>
            <el-divider />
            <span>
              Total Route number: 0
            </span>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="box-card">
            <h3>Plugin</h3>
            <el-divider />
            <span>
              Total Plugin number: 0
            </span>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="box-card">
            <h3>Upstream</h3>
            <el-divider />
            <span>
              Total Upstream number: 0
            </span>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="box-card">
            <h3>TLS</h3>
            <el-divider />
            <span>
              Total TLS number: 0
            </span>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="box-card">
            <h3>Instance</h3>
            <el-divider />
            <span>
              Total Instance number: 1
            </span>
          </el-card>
        </el-col>
      </el-row>
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
