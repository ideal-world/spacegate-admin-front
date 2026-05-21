<script setup lang="ts">
import { computed } from 'vue'
import SchemaArrayField from './SchemaArrayField.vue'

type JsonSchema = Record<string, any>

const props = defineProps<{
  schema: JsonSchema
}>()

const modelValue = defineModel<Record<string, any>>({
  required: true,
})

const rootSchema = computed(() => props.schema ?? {})
const effectiveSchema = computed(() => resolveSchema(rootSchema.value, rootSchema.value))

function resolveSchema(schema: JsonSchema, root: JsonSchema): JsonSchema {
  if (!schema?.$ref) {
    return schema
  }
  const path = String(schema.$ref).replace(/^#\//, '').split('/')
  let current: any = root
  for (const part of path) {
    current = current?.[part]
  }
  return current ? { ...current, ...schema, $ref: undefined } : schema
}

function fieldSchema(schema: JsonSchema): JsonSchema {
  return resolveSchema(schema, rootSchema.value)
}

function titleOf(key: string, schema: JsonSchema) {
  const i18n = schema?.['x-title-i18n']
  const lang = typeof navigator !== 'undefined' && navigator.language.startsWith('zh') ? 'zh-CN' : 'en'
  return i18n?.[lang] ?? schema?.title ?? key
}

function descriptionOf(schema: JsonSchema) {
  const i18n = schema?.['x-description-i18n']
  const lang = typeof navigator !== 'undefined' && navigator.language.startsWith('zh') ? 'zh-CN' : 'en'
  return i18n?.[lang] ?? schema?.description ?? ''
}

function ensureObject(key: string) {
  if (!modelValue.value[key] || typeof modelValue.value[key] !== 'object' || Array.isArray(modelValue.value[key])) {
    modelValue.value[key] = {}
  }
  return modelValue.value[key]
}

function ensureArray(key: string) {
  if (!Array.isArray(modelValue.value[key])) {
    modelValue.value[key] = []
  }
  return modelValue.value[key]
}

</script>

<template>
  <div class="schema-form">
    <template v-for="(rawField, key) in effectiveSchema.properties ?? {}" :key="key">
      <template v-if="fieldSchema(rawField).type === 'object' || fieldSchema(rawField).properties">
        <el-card class="schema-form__card" shadow="never">
          <template #header>
            <div class="schema-form__card-title">
              <span>{{ titleOf(String(key), fieldSchema(rawField)) }}</span>
              <small v-if="descriptionOf(fieldSchema(rawField))">{{ descriptionOf(fieldSchema(rawField)) }}</small>
            </div>
          </template>
          <SchemaForm
            :schema="fieldSchema(rawField)"
            :model-value="ensureObject(String(key))"
            @update:model-value="(value) => { modelValue[String(key)] = value }"
          />
        </el-card>
      </template>
      <el-form-item v-else :label="titleOf(String(key), fieldSchema(rawField))">
        <template v-if="fieldSchema(rawField).type === 'boolean'">
          <el-switch v-model="modelValue[String(key)]" />
        </template>
        <template v-else-if="fieldSchema(rawField).type === 'integer' || fieldSchema(rawField).type === 'number'">
          <el-input-number v-model="modelValue[String(key)]" :min="0" />
        </template>
        <template v-else-if="fieldSchema(rawField).type === 'array'">
          <SchemaArrayField
            :model-value="ensureArray(String(key))"
            @update:model-value="(value) => { modelValue[String(key)] = value }"
          />
        </template>
        <template v-else>
          <el-input v-model="modelValue[String(key)]" :placeholder="descriptionOf(fieldSchema(rawField))" />
        </template>
        <div v-if="descriptionOf(fieldSchema(rawField))" class="schema-form__hint">
          {{ descriptionOf(fieldSchema(rawField)) }}
        </div>
      </el-form-item>
    </template>
  </div>
</template>

<style scoped>
.schema-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schema-form__card {
  margin-bottom: 8px;
}

.schema-form__card-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.schema-form__card-title small,
.schema-form__hint {
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}
</style>
