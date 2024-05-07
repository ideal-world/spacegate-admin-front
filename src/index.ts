import './index.css'
import './assets/preflight.css'
import { App } from 'vue'
import * as monaco from 'monaco-editor';
import * as components from './components'
import * as views from './views'

import { Api } from 'spacegate-admin-client'
import { ElCollapseTransition } from 'element-plus'
function install(app: App) {
  for (const key in components) {
    app.component(key, components[key])
  }
  for (const key in components) {
    app.component(key, views[key])
  }
  app.component(ElCollapseTransition.name, ElCollapseTransition)
}
import './assets/main.scss'
import { ElMessage } from 'element-plus'
export default { install }
export { SpacegateService } from './service'
export * from './components'
export * from './constants'
export * from './utils'
export * from './views'
