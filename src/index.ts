import './index.css'
import './assets/preflight.css'
import { App } from 'vue'
import * as monaco from 'monaco-editor';
import * as components from './components'
import * as views from './views'

import { Api } from 'spacegate-admin-client'
import { ElCollapseTransition } from 'element-plus'
function install(app: App) {
  Api.Client.axiosInstance.interceptors.response.use(undefined, (error) => {
    if (error.response) {
      if (error.status == 409) {
        ElMessage({
          message: 'Version conflict, please refresh the page and try again.',
          type: 'error',
        })
      } else {
        ElMessage({
          message: error.response.data.message,
          type: 'error',
        })
      }
    }
    return Promise.reject(error)
  })
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
export { LOCALES } from './locales'
export * from './components'
export * from './constants'
export * from './utils'
export * from './views'
