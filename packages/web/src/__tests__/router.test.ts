import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'

// Stub views
const Stub = { template: '<div />' }
vi.mock('../views/LoginView.vue',    () => ({ default: Stub }))
vi.mock('../views/TodayView.vue',    () => ({ default: Stub }))
vi.mock('../views/MedsView.vue',     () => ({ default: Stub }))
vi.mock('../views/ScheduleView.vue', () => ({ default: Stub }))
vi.mock('../views/HistoryView.vue',  () => ({ default: Stub }))
vi.mock('../views/StockView.vue',    () => ({ default: Stub }))
vi.mock('../views/ProfileView.vue',  () => ({ default: Stub }))

// Mock auth store
let mockUser: any = null
vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({
    get currentUser() { return mockUser },
    get isAdmin() { return mockUser?.role === 'admin' }
  })
}))

import { routes, setupGuards } from '../router/index'

describe('router guards', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockUser = null
    router = createRouter({ history: createWebHashHistory(), routes })
    setupGuards(router)
  })

  it('unauthenticated user is redirected to /login', async () => {
    await router.push('/today')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('authenticated viewer accessing /meds is redirected to /today', async () => {
    mockUser = { id: 'x', role: 'viewer' }
    await router.push('/meds')
    expect(router.currentRoute.value.path).toBe('/today')
  })

  it('authenticated admin can access /meds', async () => {
    mockUser = { id: 'x', role: 'admin' }
    await router.push('/meds')
    expect(router.currentRoute.value.path).toBe('/meds')
  })

  it('all 6 main routes are defined', () => {
    const paths = routes.map(r => r.path)
    expect(paths).toContain('/today')
    expect(paths).toContain('/meds')
    expect(paths).toContain('/schedule')
    expect(paths).toContain('/history')
    expect(paths).toContain('/stock')
    expect(paths).toContain('/profile')
  })
})
