import path from "path";

export default {
  title: 'spacegate admin',
  description: 'A relatively complete formula editor',
  ignoreDeadLinks: true,
  themeConfig: {
    repo: 'https://github.com/idealworld/spacegate-admin-front',
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/guide/' }
        ]
      },
      {
        text: 'spacegate-admin-view',
        items: [
          { text: 'read me', link: '/spacegateadmin/index' },
          {
            text: 'component', link: '/spacegateadmin/index',
            items: [
              { text: 'selectInstace', link: '/spacegateadmin/selectInstance' }
            ]
          },
          {
            text: 'route-view', link: '/spacegateadmin/index',
            items: [
              { text: 'dashboard', link: '/spacegateadmin/dashboard' },
              { text: 'route', link: '/spacegateadmin/route' },
              { text: 'service', link: '/spacegateadmin/service' },
              { text: 'upstream', link: '/spacegateadmin/upstream' },
              { text: 'certificate', link: '/spacegateadmin/certificate' },
              { text: 'plugin', link: '/spacegateadmin/plugin' },
              { text: 'gateway', link: '/spacegateadmin/gateway' }
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
          target: 'http://localhost:9081/',
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
  }
}
