<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import SchemaJsonField from './SchemaJsonField.vue'
import SchemaForm from './SchemaForm.vue'
import {
  isJsonObject,
  schemaFieldEditorMode,
  type JsonSchema,
} from '../utils/schemaEditor'

const { locale } = useI18n()
const texts = computed(() => locale.value.startsWith('zh') ? {
  add: '添加',
  delete: '删除',
} : {
  add: 'Add',
  delete: 'Delete',
})

const props = withDefaults(defineProps<{
  itemSchema?: JsonSchema
  /** 当前数组所在对象的嵌套层数，数组对象项会在此基础上增加一层。 */
  depth?: number
}>(), {
  itemSchema: () => ({}),
  depth: 0,
})

const modelValue = defineModel<unknown[]>({
  required: true,
})

const itemType = computed(() => props.itemSchema.type)
const usesNestedForm = computed(() => (
  (itemType.value === 'object' || isJsonObject(props.itemSchema.properties))
  && schemaFieldEditorMode(props.itemSchema, props.depth + 1) === 'form'
))
const usesJsonEditor = computed(() => (
  !usesNestedForm.value
  && (itemType.value === 'object'
  || itemType.value === 'array'
  || isJsonObject(props.itemSchema.additionalProperties)
  || !itemType.value)
))

/** 以不可变方式更新数组项，避免将复杂 JSON 强制转换成字符串。 */
function updateItem(index: number, value: unknown) {
  modelValue.value = modelValue.value.map((item, itemIndex) => itemIndex === index ? value : item)
}

function textValue(index: number): string {
  const value = modelValue.value[index]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function numberValue(index: number): number {
  const value = modelValue.value[index]
  return typeof value === 'number' ? value : 0
}

/** 保证已存在的对象数组项能进入递归表单编辑。 */
function objectValue(index: number): Record<string, unknown> {
  const value = modelValue.value[index]
  if (isJsonObject(value)) return value
  const replacement = {}
  updateItem(index, replacement)
  return replacement
}

const addItem = () => {
  const initialValue = usesJsonEditor.value
    ? itemType.value === 'array' ? [] : {}
    : itemType.value === 'boolean' ? false : itemType.value === 'integer' || itemType.value === 'number' ? null : ''
  modelValue.value = [...modelValue.value, initialValue]
}

const removeItem = (index: number) => {
  modelValue.value = modelValue.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="schema-array-field">
    <div v-for="(_, index) in modelValue" :key="index" :class="['schema-array-field__row', (usesJsonEditor || usesNestedForm) && 'schema-array-field__row--json']">
      <SchemaForm
        v-if="usesNestedForm"
        :schema="itemSchema"
        :depth="depth + 1"
        :model-value="objectValue(index)"
        @update:model-value="(value) => updateItem(index, value)"
      />
      <SchemaJsonField v-else-if="usesJsonEditor" v-model="modelValue[index]" />
      <el-switch
        v-else-if="itemType === 'boolean'"
        :model-value="Boolean(modelValue[index])"
        @update:model-value="(value: boolean) => updateItem(index, value)"
      />
      <el-input-number
        v-else-if="itemType === 'integer' || itemType === 'number'"
        :model-value="numberValue(index)"
        controls-position="right"
        @update:model-value="(value: number) => updateItem(index, value)"
      />
      <el-input
        v-else
        :model-value="textValue(index)"
        @update:model-value="(value: string) => updateItem(index, value)"
      />
      <el-button type="danger" text @click="removeItem(index)">{{ texts.delete }}</el-button>
    </div>
    <el-button type="primary" plain size="small" @click="addItem">{{ texts.add }}</el-button>
  </div>
</template>

<style scoped>
.schema-array-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.schema-array-field__row {
  display: flex;
  gap: 8px;
}

.schema-array-field__row--json { align-items: flex-start; }
.schema-array-field__row--json :deep(.schema-json-field) { flex: 1; min-width: 0; }
</style>
