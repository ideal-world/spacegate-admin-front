/** Schema 表单最多展开的嵌套对象层数；根配置对象不计入。 */
export const MAX_SCHEMA_FORM_DEPTH = 3

/** JSON Schema 中用于驱动表单展示的最小字段形状。 */
export type JsonSchema = Record<string, unknown>

/** Schema 字段在配置表单中的编辑方式。 */
export type SchemaFieldEditorMode = 'form' | 'json'

/** 判断值是否为可作为 JSON 对象处理的普通对象。 */
export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/** 解析本地 JSON Pointer，仅支持当前插件 Schema 使用的内部引用。 */
function resolveReference(reference: string, root: JsonSchema): JsonSchema | undefined {
  if (!reference.startsWith('#/')) return undefined
  let current: unknown = root
  for (const part of reference.slice(2).split('/')) {
    current = isJsonObject(current) ? current[part.replace(/~1/g, '/').replace(/~0/g, '~')] : undefined
  }
  return isJsonObject(current) ? current : undefined
}

/** 合并组合 Schema 的分支，并保留外层字段的标题和描述等展示元数据。 */
function mergeSchemas(base: JsonSchema, override: JsonSchema): JsonSchema {
  return { ...base, ...override }
}

/**
 * 展开 JSON Schema 的内部引用和常用组合关键字，供表单按实际字段类型选择控件。
 *
 * Rust schemars 会把引用包在 `allOf` 中，并将 Option<T> 编码成 `anyOf` 的 T/null
 * 组合；未展开时这些字段缺少直接 `type`，会被错误地交给 JSON 编辑器。
 */
export function resolveSchema(schema: JsonSchema, root: JsonSchema): JsonSchema {
  let resolved: JsonSchema = schema
  const reference = typeof resolved.$ref === 'string' ? resolveReference(resolved.$ref, root) : undefined
  if (reference) {
    const { $ref: _reference, ...wrapper } = resolved
    resolved = mergeSchemas(resolveSchema(reference, root), wrapper)
  }

  if (Array.isArray(resolved.allOf)) {
    const { allOf: branches, ...wrapper } = resolved
    const combined = branches.reduce<JsonSchema>((merged, branch) => (
      isJsonObject(branch) ? mergeSchemas(merged, resolveSchema(branch, root)) : merged
    ), {})
    resolved = mergeSchemas(combined, wrapper)
  }

  if (Array.isArray(resolved.anyOf)) {
    const { anyOf: branches, ...wrapper } = resolved
    const nonNullBranch = branches.find((branch) => isJsonObject(branch) && branch.type !== 'null')
    if (isJsonObject(nonNullBranch)) {
      resolved = mergeSchemas(resolveSchema(nonNullBranch, root), wrapper)
    }
  }

  if (Array.isArray(resolved.oneOf)) {
    const { oneOf: branches, ...wrapper } = resolved
    const variants = branches.filter(isJsonObject).map((branch) => resolveSchema(branch, root))
    const scalarType = variants[0]?.type
    if (typeof scalarType === 'string' && variants.length > 0 && variants.every((variant) => variant.type === scalarType && Array.isArray(variant.enum))) {
      resolved = mergeSchemas({ type: scalarType, enum: variants.flatMap((variant) => variant.enum ?? []) }, wrapper)
    }
  }

  return resolved
}

/**
 * 决定对象字段使用递归表单还是 JSON 编辑器。
 *
 * 仅展开拥有明确 `properties` 的对象，避免任意 JSON、对象数组等结构无限递归；
 * 超过深度上限时统一回退到 JSON 编辑。
 */
export function schemaFieldEditorMode(schema: JsonSchema, depth: number): SchemaFieldEditorMode {
  const properties = schema.properties
  const hasProperties = isJsonObject(properties) && Object.keys(properties).length > 0
  return depth <= MAX_SCHEMA_FORM_DEPTH && hasProperties ? 'form' : 'json'
}

/**
 * 判断字段是否必须保留为 JSON 结构编辑。
 *
 * 部分原生插件使用 `serde_json::Value` 声明透传配置，Schema 不会带 `type`；
 * 此时只要当前值已经是对象或数组，就不能交给字符串输入框，否则会显示 `[object Object]`。
 */
export function isSchemaJsonValue(schema: JsonSchema, value: unknown): boolean {
  const hasScalarConstraint = schema.type !== undefined
    || Array.isArray(schema.enum)
    || Object.hasOwn(schema, 'const')

  return schema.type === 'object'
    || schema.type === 'array'
    || isJsonObject(schema.properties)
    || Object.hasOwn(schema, 'additionalProperties')
    || !hasScalarConstraint
    || Object.keys(schema).length === 0
    || isJsonObject(value)
    || Array.isArray(value)
}

/** 将任意 JSON 值格式化为可编辑文本。 */
export function formatSchemaJson(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2)
}

/** 解析用户填写的 JSON 文本，保留对象和数组的原始结构。 */
export function parseSchemaJson(value: string): unknown {
  return JSON.parse(value) as unknown
}
