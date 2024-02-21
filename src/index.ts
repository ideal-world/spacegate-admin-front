import './index.css'
import './assets/preflight.css'
import { App } from 'vue'
import { createPinia } from 'pinia'
import * as monaco from 'monaco-editor';
import * as components from './components'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import { Api } from 'spacegate-admin-client'
const pinia = createPinia()
function install(app: App) {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
  })
  self.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'json') {
        let worker = new jsonWorker();
        console.debug('json worker created', worker)
        return worker;
      } else {
        console.debug(`could not found worker with label ${label}, fallback to editor worker`)
        return new editorWorker();
      }
    },
  };
  app.use(pinia)
  for (const key in components) {
    // @ts-expect-error
    app.component(key, components[key])
  }
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
