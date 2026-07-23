import assert from 'node:assert/strict'
import test from 'node:test'

import { nativePluginDisplayName } from './pluginDisplay.ts'

test('uses the plugin-provided type title', () => {
  assert.equal(
    nativePluginDisplayName({
      code: 'hai-auth',
      meta: { title: '  HAI API Key Authentication  ' },
    }),
    'HAI API Key Authentication',
  )
})

test('falls back to plugin code when the dynamic title is absent', () => {
  assert.equal(nativePluginDisplayName({ code: 'third-party', meta: { title: null } }), 'third-party')
  assert.equal(nativePluginDisplayName({ code: 'blank-title', meta: { title: '   ' } }), 'blank-title')
})
