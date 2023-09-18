import DefaultTheme from 'vitepress/theme'
import DemoContainer from '../components/DemoContainer.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import FormulaEditor from 'formula-editor'

import './custom.css'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.use(ElementPlus)
    app.use(FormulaEditor)
    app.component('DemoContainer', DemoContainer)
  }
}
