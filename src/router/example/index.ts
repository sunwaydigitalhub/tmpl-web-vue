import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/example-module',
    children: [
      { path: '', redirect: { name: 'example-module-datatable' } },
      {
        path: 'datatable',
        name: 'example-module-datatable',
        component: () => import('@/views/example/DatatableView.vue'),
        // A sidebar entry goes on a named page route without params. Pages under its path
        // (datatable/new, datatable/42) keep it highlighted, so they need no entry of their own,
        // and follow it in the breadcrumb once their route sets a `meta.breadcrumb` label.
        meta: {
          sidebar: {
            group: 'example',
            labelKey: 'example.title',
            order: 10,
            badge: 'exampleDrafts',
          },
        },
      },
    ],
  },
]

export default routes
