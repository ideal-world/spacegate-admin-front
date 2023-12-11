import { useI18n } from "../i18n/usei18n"

const t = await useI18n()

export const constantRouterMap: any = {
  Route: {
    meta: {
      title: t('router.meu.title'),
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