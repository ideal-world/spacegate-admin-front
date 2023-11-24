const path = require('path')

export default {
  title: 'spacegate admin',
  description: 'A relatively complete formula editor',
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
                {text: 'gateway',link: '/spacegateadmin/gateway' }
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
    }
  }
}
