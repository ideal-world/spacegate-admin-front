<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  deleteTenantRateLimit,
  listTenantRateLimits,
  type TenantRateLimitRule,
  type TenantRateLimitRuleView,
  upsertTenantRateLimit,
} from '../api/aiGateway'

const { locale } = useI18n()
const loading = ref(false)
const error = ref('')
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
const texts = computed(() => locale.value.startsWith('zh') ? {
  tenantRequired: '租户不能为空',
  positiveNumbers: '每秒入队上限、突发容量和单次消耗必须大于 0',
  ttlPositive: 'TTL 必须大于 0 秒，或留空表示永久生效',
  saved: '队列配额已保存',
  saveFailed: (error: string) => `队列配额保存失败：${error}`,
  confirmDelete: (key: string) => `确认删除队列配额 ${key}？`,
  deleteTitle: '删除队列配额',
  delete: '删除',
  cancel: '取消',
  deleted: '队列配额已删除',
  deleteFailed: (error: string) => `队列配额删除失败：${error}`,
  introTitle: '按租户 / 模型 / 路径 / 队列模式配置队列配额',
  introDesc: '每条配额定义一个租户维度的入队节流闸门：每秒入队上限决定平均放行速率，突发容量决定瞬时放行峰值；超过部分根据 abandon / queue / wait 三种队列模式被拒绝、入队异步处理或入队同步等待。越具体的配额优先生效，缺省字段表示该维度通配。',
  apiDown: '队列配额接口不可用',
  apiDownDesc: (error: string) => `请检查 ai-gateway-service :18080 和 /v1/admin/tenant-rate-limits 代理。错误：${error}`,
  retry: '重试',
  tenant: '租户',
  model: '模型',
  path: '路径',
  policy: '队列模式',
  search: '查询',
  create: '新增队列配额',
  rps: '每秒入队上限',
  burst: '突发容量',
  cost: '单次消耗',
  ttl: 'TTL(秒)',
  ttlRemaining: '剩余 TTL',
  key: '队列配额键',
  operation: '操作',
  edit: '编辑',
  drawerTitle: '队列配额',
  tenantHint: '租户标识（必填），用于隔离不同业务方的队列配额。',
  modelHint: '可选；指定后该配额只对该模型生效，留空表示对租户所有模型生效。',
  pathHint: '可选；指定后该配额只对该路径生效，留空表示对租户全部路径生效。',
  policyHint: '可选；只对该队列模式的请求生效，留空表示所有模式共用此配额。',
  rpsHint: '平均放行速率：每秒可直通的请求数；超出部分按队列模式入队或拒绝。',
  burstHint: '允许的瞬时突发请求数，等同于令牌桶容量；建议 ≥ 每秒入队上限。',
  costHint: '单条请求占用的令牌数，重负载请求（如 long-context）可设为 ≥ 2。',
  ttlHint: '临时配额过期时间；留空表示永久生效，到期后 Redis key 自动删除。',
  optional: '可选',
  example: '例如',
  save: '保存',
} : {
  tenantRequired: 'Tenant is required.',
  positiveNumbers: 'RPS, burst, and cost must be greater than 0.',
  ttlPositive: 'TTL must be greater than 0 seconds, or empty for no expiry.',
  saved: 'Queue quota saved.',
  saveFailed: (error: string) => `Queue quota save failed: ${error}`,
  confirmDelete: (key: string) => `Delete queue quota ${key}?`,
  deleteTitle: 'Delete Queue Quota',
  delete: 'Delete',
  cancel: 'Cancel',
  deleted: 'Queue quota deleted.',
  deleteFailed: (error: string) => `Queue quota delete failed: ${error}`,
  introTitle: 'Configure queue quotas by tenant / model / path / queue mode',
  introDesc: 'Each quota defines an admission throttle for a tenant. RPS controls the average pass-through rate, burst controls short spikes, and excess traffic is rejected, queued, or waits based on abandon / queue / wait. More specific quotas take precedence; empty fields mean wildcard.',
  apiDown: 'Queue quota API unavailable',
  apiDownDesc: (error: string) => `Check ai-gateway-service :18080 and the /v1/admin/tenant-rate-limits proxy. Error: ${error}`,
  retry: 'Retry',
  tenant: 'Tenant',
  model: 'Model',
  path: 'Path',
  policy: 'Queue Mode',
  search: 'Search',
  create: 'Create Queue Quota',
  rps: 'RPS',
  burst: 'Burst',
  cost: 'Cost',
  ttl: 'TTL(s)',
  ttlRemaining: 'TTL Remaining',
  key: 'Quota Key',
  operation: 'Actions',
  edit: 'Edit',
  drawerTitle: 'Queue Quota',
  tenantHint: 'Tenant identifier, required. Used to isolate quota by business party.',
  modelHint: 'Optional. When set, this quota only applies to the specified model. Empty means all models for the tenant.',
  pathHint: 'Optional. When set, this quota only applies to the specified path. Empty means all paths for the tenant.',
  policyHint: 'Optional. When set, this quota only applies to the selected queue mode. Empty means all modes share this quota.',
  rpsHint: 'Average pass-through rate: requests allowed per second. Excess traffic is queued or rejected based on mode.',
  burstHint: 'Allowed short spike capacity, equivalent to token bucket size. Usually greater than or equal to RPS.',
  costHint: 'Tokens consumed by one request. Heavy requests such as long-context calls can use 2 or more.',
  ttlHint: 'Temporary quota expiry. Empty means permanent; Redis deletes the key after expiry.',
  optional: 'Optional',
  example: 'for example',
  save: 'Save',
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
    ttl_secs: rule?.ttl_secs,
  })
}

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    rows.value = await listTenantRateLimits(filters)
  } catch (e) {
    rows.value = []
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

function errorMessage(e: unknown) {
  if (e instanceof Error && e.message) return e.message
  return String(e || 'unknown error')
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
    ElMessage.error(texts.value.tenantRequired)
    return
  }
  if (editing.rps <= 0 || editing.burst <= 0 || editing.cost <= 0) {
    ElMessage.error(texts.value.positiveNumbers)
    return
  }
  if (editing.ttl_secs != null && editing.ttl_secs <= 0) {
    ElMessage.error(texts.value.ttlPositive)
    return
  }
  try {
    await upsertTenantRateLimit({ ...editing })
    ElMessage.success(texts.value.saved)
    drawerVisible.value = false
    await refresh()
  } catch (e) {
    ElMessage.error(texts.value.saveFailed(errorMessage(e)))
  }
}

async function removeRule(row: TenantRateLimitRuleView) {
  try {
    await ElMessageBox.confirm(texts.value.confirmDelete(row.key), texts.value.deleteTitle, {
      type: 'warning',
      confirmButtonText: texts.value.delete,
      cancelButtonText: texts.value.cancel,
    })
  } catch {
    return
  }
  try {
    await deleteTenantRateLimit(row)
    ElMessage.success(texts.value.deleted)
    await refresh()
  } catch (e) {
    ElMessage.error(texts.value.deleteFailed(errorMessage(e)))
  }
}

onMounted(refresh)
</script>

<template>
  <div class="tenant-rate-limit">
    <el-alert
      type="info"
      :closable="false"
      class="tenant-rate-limit__intro"
      :title="texts.introTitle"
      :description="texts.introDesc"
    />

    <el-alert
      v-if="error"
      type="error"
      :closable="false"
      class="tenant-rate-limit__intro"
      :title="texts.apiDown"
      :description="texts.apiDownDesc(error)"
    >
      <template #default>
        <el-button size="small" @click="refresh">{{ texts.retry }}</el-button>
      </template>
    </el-alert>

    <div class="tenant-rate-limit__toolbar">
      <el-input v-model="filters.tenant" clearable :placeholder="texts.tenant" />
      <el-input v-model="filters.model" clearable :placeholder="texts.model" />
      <el-input v-model="filters.path" clearable :placeholder="texts.path" />
      <el-select v-model="filters.policy" clearable :placeholder="texts.policy">
        <el-option label="abandon（超额拒绝）" value="abandon" />
        <el-option label="queue（异步入队）" value="queue" />
        <el-option label="wait（入队等待）" value="wait" />
      </el-select>
      <el-button @click="refresh">{{ texts.search }}</el-button>
      <el-button type="primary" @click="openCreate">{{ texts.create }}</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="tenant" :label="texts.tenant" min-width="120" />
      <el-table-column prop="model" :label="texts.model" min-width="120" />
      <el-table-column prop="path" :label="texts.path" min-width="160" />
      <el-table-column prop="policy" :label="texts.policy" min-width="110" />
      <el-table-column prop="rps" :label="texts.rps" width="120" />
      <el-table-column prop="burst" :label="texts.burst" width="110" />
      <el-table-column prop="cost" :label="texts.cost" width="110" />
      <el-table-column prop="ttl_secs" :label="texts.ttl" width="100" />
      <el-table-column prop="ttl_remaining_secs" :label="texts.ttlRemaining" width="100" />
      <el-table-column prop="key" :label="texts.key" min-width="260" show-overflow-tooltip />
      <el-table-column :label="texts.operation" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">{{ texts.edit }}</el-button>
          <el-button type="danger" link @click="removeRule(row)">{{ texts.delete }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="drawerVisible" :title="texts.drawerTitle" size="460px">
      <el-form label-position="top">
        <el-form-item :label="texts.tenant">
          <el-input v-model="editing.tenant" placeholder="例如 acme" />
          <div class="tenant-rate-limit__hint">{{ texts.tenantHint }}</div>
        </el-form-item>
        <el-form-item :label="texts.model">
          <el-input v-model="editing.model" :placeholder="`${texts.optional}, ${texts.example} gpt-4o`" />
          <div class="tenant-rate-limit__hint">{{ texts.modelHint }}</div>
        </el-form-item>
        <el-form-item :label="texts.path">
          <el-input v-model="editing.path" :placeholder="`${texts.optional}, ${texts.example} /v1/chat/completions`" />
          <div class="tenant-rate-limit__hint">{{ texts.pathHint }}</div>
        </el-form-item>
        <el-form-item :label="texts.policy">
          <el-select v-model="editing.policy" clearable :placeholder="texts.optional">
            <el-option label="abandon（超额拒绝）" value="abandon" />
            <el-option label="queue（异步入队）" value="queue" />
            <el-option label="wait（入队等待）" value="wait" />
          </el-select>
          <div class="tenant-rate-limit__hint">{{ texts.policyHint }}</div>
        </el-form-item>
        <el-form-item :label="texts.rps">
          <el-input-number v-model="editing.rps" :min="1" />
          <div class="tenant-rate-limit__hint">{{ texts.rpsHint }}</div>
        </el-form-item>
        <el-form-item :label="texts.burst">
          <el-input-number v-model="editing.burst" :min="1" />
          <div class="tenant-rate-limit__hint">{{ texts.burstHint }}</div>
        </el-form-item>
        <el-form-item :label="texts.cost">
          <el-input-number v-model="editing.cost" :min="1" />
          <div class="tenant-rate-limit__hint">{{ texts.costHint }}</div>
        </el-form-item>
        <el-form-item :label="texts.ttl">
          <el-input-number v-model="editing.ttl_secs" :min="1" clearable />
          <div class="tenant-rate-limit__hint">{{ texts.ttlHint }}</div>
        </el-form-item>
        <el-alert type="info" :closable="false">
          <template #title>
            <div class="tenant-rate-limit__preview">{{ keyPreview }}</div>
          </template>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">{{ texts.cancel }}</el-button>
        <el-button type="primary" @click="saveRule">{{ texts.save }}</el-button>
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
