<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteTenantRateLimit,
  listTenantRateLimits,
  type TenantRateLimitRule,
  type TenantRateLimitRuleView,
  upsertTenantRateLimit,
} from '../api/aiGateway'

const loading = ref(false)
const drawerVisible = ref(false)
const rows = ref<TenantRateLimitRuleView[]>([])
const filters = reactive({
  tenant: '',
  model: '',
  path: '',
  policy: '',
})

const editing = reactive<TenantRateLimitRule>({
  tenant: '',
  model: '',
  path: '',
  policy: '',
  rps: 10,
  burst: 20,
  cost: 1,
})

const keyPreview = computed(() => {
  if (!editing.tenant.trim()) return 'ai:tenant:ratelimit:{tenant}'
  let key = `ai:tenant:ratelimit:${sanitizeKey(editing.tenant)}`
  if (editing.model?.trim()) key += `:model:${sanitizeKey(editing.model)}`
  if (editing.path?.trim()) key += `:path:${sanitizeKey(editing.path)}`
  if (editing.policy?.trim()) key += `:policy:${sanitizeKey(editing.policy)}`
  return key
})

function sanitizeKey(value: string) {
  return value.replace(/[^a-zA-Z0-9:_\-.]/g, '_')
}

function resetEditing(rule?: TenantRateLimitRule) {
  Object.assign(editing, {
    tenant: rule?.tenant ?? '',
    model: rule?.model ?? '',
    path: rule?.path ?? '',
    policy: rule?.policy ?? '',
    rps: rule?.rps ?? 10,
    burst: rule?.burst ?? 20,
    cost: rule?.cost ?? 1,
    // TODO(v2): keep ttl_secs in the data model but hide it until temporary rules are supported.
    ttl_secs: rule?.ttl_secs,
  })
}

async function refresh() {
  loading.value = true
  try {
    rows.value = await listTenantRateLimits(filters)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  resetEditing()
  drawerVisible.value = true
}

function openEdit(row: TenantRateLimitRuleView) {
  resetEditing(row)
  drawerVisible.value = true
}

async function saveRule() {
  if (!editing.tenant.trim()) {
    ElMessage.error('租户不能为空')
    return
  }
  if (editing.rps <= 0 || editing.burst <= 0 || editing.cost <= 0) {
    ElMessage.error('每秒入队上限、突发容量和单次消耗必须大于 0')
    return
  }
  await upsertTenantRateLimit({ ...editing })
  ElMessage.success('队列配额已保存')
  drawerVisible.value = false
  await refresh()
}

async function removeRule(row: TenantRateLimitRuleView) {
  await ElMessageBox.confirm(`确认删除队列配额 ${row.key}？`, '删除队列配额', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  })
  await deleteTenantRateLimit(row)
  ElMessage.success('队列配额已删除')
  await refresh()
}

onMounted(refresh)
</script>

<template>
  <div class="tenant-rate-limit">
    <el-alert
      type="info"
      :closable="false"
      class="tenant-rate-limit__intro"
      title="按 (租户 / 模型 / 路径 / 队列模式) 配置队列配额"
      description="每条配额定义一个租户维度的入队节流闸门：每秒入队上限决定平均放行速率，突发容量决定瞬时放行峰值；超过部分根据 abandon / queue / wait 三种队列模式被拒绝、入队异步处理或入队同步等待。越具体的配额优先生效，缺省字段表示该维度通配。"
    />

    <div class="tenant-rate-limit__toolbar">
      <el-input v-model="filters.tenant" clearable placeholder="租户" />
      <el-input v-model="filters.model" clearable placeholder="模型" />
      <el-input v-model="filters.path" clearable placeholder="路径" />
      <el-select v-model="filters.policy" clearable placeholder="队列模式">
        <el-option label="abandon（超额拒绝）" value="abandon" />
        <el-option label="queue（异步入队）" value="queue" />
        <el-option label="wait（入队等待）" value="wait" />
      </el-select>
      <el-button @click="refresh">查询</el-button>
      <el-button type="primary" @click="openCreate">新增队列配额</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="tenant" label="租户" min-width="120" />
      <el-table-column prop="model" label="模型" min-width="120" />
      <el-table-column prop="path" label="路径" min-width="160" />
      <el-table-column prop="policy" label="队列模式" min-width="110" />
      <el-table-column prop="rps" label="每秒入队上限" width="120" />
      <el-table-column prop="burst" label="突发容量" width="110" />
      <el-table-column prop="cost" label="单次消耗" width="110" />
      <el-table-column prop="key" label="队列配额键" min-width="260" show-overflow-tooltip />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="removeRule(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="drawerVisible" title="队列配额" size="460px">
      <el-form label-position="top">
        <el-form-item label="租户">
          <el-input v-model="editing.tenant" placeholder="例如 acme" />
          <div class="tenant-rate-limit__hint">租户标识（必填），用于隔离不同业务方的队列配额。</div>
        </el-form-item>
        <el-form-item label="模型">
          <el-input v-model="editing.model" placeholder="可选，例如 gpt-4o" />
          <div class="tenant-rate-limit__hint">可选；指定后该配额只对该模型生效，留空表示对租户所有模型生效。</div>
        </el-form-item>
        <el-form-item label="路径">
          <el-input v-model="editing.path" placeholder="可选，例如 /v1/chat/completions" />
          <div class="tenant-rate-limit__hint">可选；指定后该配额只对该路径生效，留空表示对租户全部路径生效。</div>
        </el-form-item>
        <el-form-item label="队列模式">
          <el-select v-model="editing.policy" clearable placeholder="可选">
            <el-option label="abandon（超额拒绝）" value="abandon" />
            <el-option label="queue（异步入队）" value="queue" />
            <el-option label="wait（入队等待）" value="wait" />
          </el-select>
          <div class="tenant-rate-limit__hint">可选；只对该队列模式的请求生效，留空表示所有模式共用此配额。</div>
        </el-form-item>
        <el-form-item label="每秒入队上限（RPS）">
          <el-input-number v-model="editing.rps" :min="1" />
          <div class="tenant-rate-limit__hint">平均放行速率：每秒可直通的请求数；超出部分按队列模式入队或拒绝。</div>
        </el-form-item>
        <el-form-item label="突发容量（Burst）">
          <el-input-number v-model="editing.burst" :min="1" />
          <div class="tenant-rate-limit__hint">允许的瞬时突发请求数，等同于令牌桶容量；建议 ≥ 每秒入队上限。</div>
        </el-form-item>
        <el-form-item label="单次消耗（Cost）">
          <el-input-number v-model="editing.cost" :min="1" />
          <div class="tenant-rate-limit__hint">单条请求占用的令牌数，重负载请求（如 long-context）可设为 ≥ 2。</div>
        </el-form-item>
        <el-alert type="info" :closable="false">
          <template #title>
            <div class="tenant-rate-limit__preview">{{ keyPreview }}</div>
          </template>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.tenant-rate-limit {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tenant-rate-limit__toolbar {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr)) auto auto;
  gap: 8px;
  align-items: center;
}

.tenant-rate-limit__intro {
  margin-bottom: 4px;
}

.tenant-rate-limit__hint {
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
  margin-top: 4px;
}

.tenant-rate-limit__preview {
  word-break: break-all;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
