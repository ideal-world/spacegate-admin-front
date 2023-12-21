import DefaultTheme from 'vitepress/theme'
import DemoContainer from '../components/DemoContainer.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import SpacegateAdmin, { SpacegateService } from 'spacegate-admin'
import { createI18n } from 'vue-i18n'
import './custom.css'
export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    let i18n = createI18n({
      legacy: false,
      locale: 'zh-CN',
      messages: {
        ['zh-CN']: {
          common: {
            operations: '操作',
            operation: { add: '新增', search: '搜索', delete: '删除', cancel: '取消', submit: '提交' },
            status: {
              success: '成功',
              fail: '失败',
              disable: '禁用',
              enable: '启用',
              normal: '正常',
              abnormal: '异常',
              loading: '加载中',
              submitting: '提交中',
            },
            advanced: "高级选项",
          },
          service: {
            listener: '监听',
            filters: '过滤器',
            plugin: '插件',
          },
          route: {
            name: '名称'
          }
        }
      }
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
