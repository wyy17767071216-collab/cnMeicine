import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export const routes: RouteRecordRaw[] = [
  { path: '/login',    name: 'login',    component: () => import('../views/LoginView.vue'),    meta: { public: true } },
  { path: '/today',    name: 'today',    component: () => import('../views/TodayView.vue') },
  { path: '/meds',     name: 'meds',     component: () => import('../views/MedsView.vue'),     meta: { requireAdmin: true } },
  { path: '/schedule', name: 'schedule', component: () => import('../views/ScheduleView.vue'), meta: { requireAdmin: true } },
  { path: '/history',  name: 'history',  component: () => import('../views/HistoryView.vue') },
  { path: '/stock',    name: 'stock',    component: () => import('../views/StockView.vue') },
  { path: '/profile',  name: 'profile',  component: () => import('../views/ProfileView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/today' }
]

export function setupGuards(r: ReturnType<typeof createRouter>) {
  r.beforeEach((to) => {
    const auth = useAuthStore()

    if (!to.meta?.public && !auth.currentUser) {
      return { path: '/login' }
    }
    if (to.meta?.requireAdmin && !auth.isAdmin) {
      return { path: '/today' }
    }
  })
}

const router = createRouter({
  history: createWebHistory(),
  routes
})

setupGuards(router)

export default router
