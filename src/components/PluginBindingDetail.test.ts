import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('renders bound plugin details in a centered dialog', async () => {
  const source = await readFile(new URL('./PluginBindingDetail.vue', import.meta.url), 'utf8')

  assert.match(source, /<el-dialog\b[\s\S]*?v-model="visible"/)
  assert.doesNotMatch(source, /<el-drawer\b/)
})
