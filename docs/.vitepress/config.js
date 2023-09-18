const path = require('path')

export default {
  title: 'spacegate admin',
  description: 'A relatively complete formula editor',
  themeConfig: {
    repo: 'https://github.com/idealworld/formula-editor',
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
          { text: 'home', link: '/spacegateadmin/home' },
          { text: 'route', link: '/spacegateadmin/route' },
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
        'formula-editor': path.resolve(__dirname, '../../src')
      },
      dedupe: ['vue', /element-plus\/.+/]
    }
  }
}
