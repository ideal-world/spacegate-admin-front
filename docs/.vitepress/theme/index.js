import DefaultTheme from 'vitepress/theme'
import DemoContainer from '../components/DemoContainer.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import SpacegateAdmin, { SpacegateService, MESSAGES } from 'spacegate-admin'
import { createI18n } from 'vue-i18n'
import './custom.css'
export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    let i18n = createI18n({
      legacy: false,
      locale: 'zh-CN',
      messages: MESSAGES
    })
    app.use(i18n);
    app.use(ElementPlus)
    app.use(SpacegateAdmin)
    app.use(SpacegateService, {
      backend: "default"
    })
    app.component('DemoContainer', DemoContainer)
  }
}
