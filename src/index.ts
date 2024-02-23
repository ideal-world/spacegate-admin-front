import './index.css'
import './assets/preflight.css'
import { App } from 'vue'
import { createPinia } from 'pinia'
import * as monaco from 'monaco-editor';
import * as components from './components'
import * as views from './views'

import { Api } from 'spacegate-admin-client'
import { ElCollapseTransition } from 'element-plus'
const pinia = createPinia()
function install(app: App) {
  app.use(pinia)
  for (const key in components) {
    // @ts-expect-error
    app.component(key, components[key])
  }
  for (const key in components) {
    // @ts-expect-error
    app.component(key, views[key])
  }
  app.component(ElCollapseTransition.name, ElCollapseTransition)
}

import './assets/main.scss'
import { ElMessage } from 'element-plus'
export default { install }
export { SpacegateService } from './service'
export { MESSAGES } from './locales'
export * from './components'
export * from './constants'
export * from './utils'
export * from './views'
