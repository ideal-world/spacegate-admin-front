import './index.css'
import './assets/preflight.css'
import { App } from 'vue'
import { createPinia } from 'pinia'
import * as components from './components'


const pinia = createPinia()

function install(app: App) {
  app.use(pinia)
  for (const key in components) {
    // @ts-expect-error
    app.component(key, components[key])
  }
}

import './assets/main.scss'

export default { install }

export { setupI18n } from './i18n/usei18n'
export { setApiClient } from './requset'
export * from './components'
export * from './constants'
export * from './utils'
export * from './views'
