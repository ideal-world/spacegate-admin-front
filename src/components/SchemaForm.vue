<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SchemaArrayField from './SchemaArrayField.vue'

type JsonSchema = Record<string, any>

const props = defineProps<{
  schema: JsonSchema
}>()
const { locale } = useI18n()

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
  const lang = locale.value.startsWith('zh') ? 'zh-CN' : 'en'
  if (i18n?.[lang]) return i18n[lang]
  if (schema?.title) return schema.title
  // snake_case / camelCase → Title Case
  return String(key)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function descriptionOf(schema: JsonSchema) {
  const i18n = schema?.['x-description-i18n']
  const lang = locale.value.startsWith('zh') ? 'zh-CN' : 'en'
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

const requiredKeys = computed(() => new Set(effectiveSchema.value.required ?? []))

function defaultValueFor(rawField: any): any {
  const field = fieldSchema(rawField)
  if (field.default !== undefined) return field.default
  if (field.type === 'boolean') return false
  if (field.type === 'integer' || field.type === 'number') return undefined
  if (field.type === 'array') return []
  if (field.type === 'object' || field.properties) return {}
  return ''
}

function initDefaults(schema: JsonSchema, target: Record<string, any>) {
  const resolved = resolveSchema(schema, rootSchema.value)
  const props = resolved.properties ?? {}
  for (const [key, raw] of Object.entries(props)) {
    if (target[key] !== undefined) continue
    const field = resolveSchema(raw as JsonSchema, rootSchema.value)
    if (field.default !== undefined) {
      target[key] = typeof field.default === 'object' ? JSON.parse(JSON.stringify(field.default)) : field.default
    } else if (field.type === 'object' || field.properties) {
      target[key] = {}
      initDefaults(field, target[key])
    }
  }
}

function validate(): string[] {
  const errors: string[] = []
  const resolved = effectiveSchema.value
  const reqKeys = resolved.required ?? []
  for (const key of reqKeys) {
    const val = modelValue.value[key]
    if (val === undefined || val === null || val === '') {
      errors.push(key)
    }
  }
  return errors
}

defineExpose({ validate, initDefaults })

</script>

<template>
  <div class="schema-form">
    <template v-for="(rawField, key) in effectiveSchema.properties ?? {}" :key="key">
      <template v-if="fieldSchema(rawField).type === 'object' || fieldSchema(rawField).properties">
        <el-card class="schema-form__card schema-form__wide" shadow="never">
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
      <div
        v-else
        :class="[
          'schema-form__field',
          fieldSchema(rawField).type === 'array' && 'schema-form__wide',
        ]"
      >
        <div class="schema-form__field-label">
          <span>{{ titleOf(String(key), fieldSchema(rawField)) }}</span>
          <em v-if="requiredKeys.has(String(key))">*</em>
        </div>
        <div class="schema-form__control">
          <template v-if="fieldSchema(rawField).type === 'boolean'">
            <el-switch v-model="modelValue[String(key)]" />
          </template>
          <template v-else-if="fieldSchema(rawField).type === 'integer' || fieldSchema(rawField).type === 'number'">
            <el-input-number v-model="modelValue[String(key)]" :min="0" controls-position="right" />
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
        </div>
        <div v-if="descriptionOf(fieldSchema(rawField))" class="schema-form__hint">
          {{ descriptionOf(fieldSchema(rawField)) }}
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.schema-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.schema-form__wide {
  grid-column: 1 / -1;
}

.schema-form__field {
  min-width: 0;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.schema-form__field-label {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 20px;
  margin-bottom: 8px;
}

.schema-form__field-label span {
  min-width: 0;
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schema-form__field-label em {
  color: #ef4444;
  font-style: normal;
}

.schema-form__control :deep(.el-input),
.schema-form__control :deep(.el-input-number) {
  width: 100%;
}

.schema-form__card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.schema-form__card :deep(.el-card__header) {
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.schema-form__card :deep(.el-card__body) {
  padding: 16px;
}

.schema-form__card-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.schema-form__card-title span {
  font-weight: 600;
  font-size: 14px;
  color: #0f172a;
}

.schema-form__card-title small,
.schema-form__hint {
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
}

.schema-form__hint {
  margin-top: 8px;
  word-break: break-word;
}

</style>
