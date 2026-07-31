/// <reference types="node" />

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isSchemaJsonValue,
  MAX_SCHEMA_FORM_DEPTH,
  parseSchemaJson,
  schemaFieldEditorMode,
} from './schemaEditor.js'

test('uses a form editor through three nested object levels', () => {
  assert.equal(schemaFieldEditorMode({ type: 'object', properties: { enabled: { type: 'boolean' } } }, 3), 'form')
})

test('uses a JSON editor beyond the supported schema depth', () => {
  assert.equal(schemaFieldEditorMode({ type: 'object', properties: { enabled: { type: 'boolean' } } }, MAX_SCHEMA_FORM_DEPTH + 1), 'json')
})

test('uses a JSON editor for arbitrary object values', () => {
  assert.equal(schemaFieldEditorMode({ type: 'object', additionalProperties: true }, 1), 'json')
})

test('routes an unconstrained object value to the JSON editor', () => {
  assert.equal(isSchemaJsonValue({}, { tenant: { roles: ['admin'] } }), true)
  assert.equal(isSchemaJsonValue({}, undefined), true)
})

test('routes a description-only schema field to the JSON editor', () => {
  assert.equal(isSchemaJsonValue({ description: '由外部系统解析的任意 JSON 配置' }, undefined), true)
})

test('parses a nested JSON object without stringifying it', () => {
  assert.deepEqual(parseSchemaJson('{"retry":{"backoff":{"ms":500}}}'), {
    retry: { backoff: { ms: 500 } },
  })
})
