import './index.css'
import './assets/preflight.css'
import { App } from 'vue'
import { createPinia } from 'pinia'
import * as components from './components'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

const pinia = createPinia()
function install(app: App) {
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
export default { install }
export { SpacegateService } from './service'
export { MESSAGES } from './locales'
export { setApiClient } from './requset'
export * from './components'
export * from './constants'
export * from './utils'
export * from './views'
