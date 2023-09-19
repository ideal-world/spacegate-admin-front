import DefaultTheme from 'vitepress/theme'
import DemoContainer from '../components/DemoContainer.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import SpacegateAdmin from 'spacegate-admin'

import './custom.css'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.use(ElementPlus)
    app.use(SpacegateAdmin)
    app.component('DemoContainer', DemoContainer)
  }
}
