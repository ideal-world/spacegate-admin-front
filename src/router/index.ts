import { useI18n } from 'vue-i18n';


const { t } = useI18n()

export const constantRouterMap: any = {
  Route: {
    meta: {
      // title: i18n.t('router.meu.title'),
      noCache: true,
      affix: true
    },
    children: [
      // {
      //   path: '/route/:path(.*)',
      //   name: 'RouteEdit',
      //   component: () => import('../views/Route/RouteEdit.vue'),
      //   meta: {}
      // }
    ]
  }
}