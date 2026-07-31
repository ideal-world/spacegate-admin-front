<script setup lang="ts">
import { ref, watch } from 'vue'

import { formatSchemaJson, parseSchemaJson } from '../utils/schemaEditor'

const modelValue = defineModel<unknown>({
  required: true,
})

const rawText = ref(formatSchemaJson(modelValue.value))
const errorMessage = ref('')

/** 用户输入合法 JSON 后才同步回 Schema 表单模型，非法文本保持在输入框中供修正。 */
function updateValue(value: string) {
  rawText.value = value
  try {
    modelValue.value = parseSchemaJson(value)
    errorMessage.value = ''
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'JSON 格式无效。'
  }
}

watch(
  () => modelValue.value,
  (value) => {
    if (!errorMessage.value) rawText.value = formatSchemaJson(value)
  },
  { deep: true },
)
</script>

<template>
  <div class="schema-json-field">
    <el-input
      :model-value="rawText"
      type="textarea"
      :rows="8"
      class="schema-json-field__input"
      @update:model-value="updateValue"
    />
    <div v-if="errorMessage" class="schema-json-field__error">{{ errorMessage }}</div>
    <div v-else class="schema-json-field__hint">嵌套配置可在此编辑 JSON；层级过深时建议使用插件整体 JSON 模式。</div>
  </div>
</template>

<style scoped>
.schema-json-field__input :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.55;
}

.schema-json-field__error { margin-top: 6px; color: #dc2626; font-size: 12px; }
.schema-json-field__hint { margin-top: 6px; color: #94a3b8; font-size: 12px; line-height: 1.5; }
</style>
