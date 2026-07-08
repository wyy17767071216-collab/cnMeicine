import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia } from 'pinia'
import BottomNav from '../components/BottomNav.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/today', component: { template: '<div />' } },
    { path: '/history', component: { template: '<div />' } },
    { path: '/stock', component: { template: '<div />' } },
    { path: '/profile', component: { template: '<div />' } },
  ]
})

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({ isAdmin: true })
}))

describe('BottomNav', () => {
  it('renders 6 nav items', async () => {
    const wrapper = mount(BottomNav, {
      global: { plugins: [router, createPinia()] }
    })
    await router.isReady()
    const items = wrapper.findAll('[data-testid="nav-item"]')
    expect(items).toHaveLength(6)
  })

  it('each nav item has min-height 52px via CSS class', () => {
    const wrapper = mount(BottomNav, {
      global: { plugins: [router, createPinia()] }
    })
    const items = wrapper.findAll('[data-testid="nav-item"]')
    items.forEach(item => {
      expect(item.classes()).toContain('nav-item')
    })
  })

  it('active route gets active class', async () => {
    await router.push('/today')
    await router.isReady()
    const wrapper = mount(BottomNav, {
      global: { plugins: [router, createPinia()] }
    })
    const activeItem = wrapper.find('.nav-item.active')
    expect(activeItem.exists()).toBe(true)
  })
})
