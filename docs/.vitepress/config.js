// const path = require('path')
import  path from "path";

export default {
  title: 'spacegate admin',
  description: 'A relatively complete formula editor',
  ignoreDeadLinks: true,
  themeConfig: {
    repo: 'https://github.com/idealworld/spacegate-admin',
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/guide/' }
        ]
      },
      {
        text: 'Components',
        items: [
          { text: 'placeholder', link: '/components/1' },
        ]
      },
      {
        text: 'spacegate-admin-view',
        items: [
          { text: 'read me', link: '/spacegateadmin/index' },
          {text: 'dashboard',link: '/spacegateadmin/dashboard' },
          { text: 'route-view',link: '/spacegateadmin/index', 
              items: [
                {text: 'route',link: '/spacegateadmin/route' },
                {text: 'route-edit',link: '/spacegateadmin/route/routeedit' },
                {text: 'service',link: '/spacegateadmin/service' },
                {text: 'upstream',link: '/spacegateadmin/upstream' },
                {text: 'certificate',link: '/spacegateadmin/certificate' },
                {text: 'plugin',link: '/spacegateadmin/plugin' },
                {text: 'gateway',link: '/spacegateadmin/gateway' },
                {text: 'selectInstace',link: '/spacegateadmin/selectInstance' }
              ]
          },
        ]
      }
    ],
    search: {
      provider: 'local'
    }
  },
  vite: {
    resolve: {
      alias: {
        'spacegate-admin': path.resolve(__dirname, '../../src')
      },
      dedupe: ['vue', /element-plus\/.+/]
    },
    server: {
      host: true,
      port: 3000,
      proxy: {
        '/admin': {
          // target: 'http://192.168.31.164:9080/',
          target: 'http://localhost:9081/',
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
  }
}
