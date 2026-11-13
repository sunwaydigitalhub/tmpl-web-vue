import { createRouter, createWebHistory } from 'vue-router'
import { House } from '@lucide/vue'
import HomeView from '../views/HomeView.vue'
import exampleRoutes from './example/index.ts'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        sidebar: { section: 'workspace', labelKey: 'common.sidebar.home', icon: House, order: 10 },
      },
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    ...exampleRoutes,
  ],
})

export default router
