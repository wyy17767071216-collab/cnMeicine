import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { usePush } from '../composables/usePush'

// Mock service worker + PushManager
const mockSubscribe  = vi.fn().mockResolvedValue({
  endpoint: 'https://test.endpoint',
  toJSON: () => ({ endpoint: 'https://test.endpoint', keys: { p256dh: 'p256', auth: 'auth' } })
})
const mockGetSub = vi.fn().mockResolvedValue(null)

Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: {
      ready: Promise.resolve({
        pushManager: { subscribe: mockSubscribe, getSubscription: mockGetSub }
      })
    },
    permissions: { query: vi.fn().mockResolvedValue({ state: 'granted' }) }
  },
  writable: true
})

Object.defineProperty(global, 'Notification', {
  value: { permission: 'granted', requestPermission: vi.fn().mockResolvedValue('granted') },
  writable: true
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } }
      })
    }
  }
}))

describe('usePush composable', () => {
  it('isSubscribed starts as false', () => {
    const TestComponent = defineComponent({
      setup() { return usePush() },
      template: '<div />'
    })
    const wrapper = mount(TestComponent)
    expect(wrapper.vm.isSubscribed).toBe(false)
  })

  it('subscribe() calls pushManager.subscribe', async () => {
    const TestComponent = defineComponent({
      setup() { return usePush() },
      template: '<div />'
    })
    const wrapper = mount(TestComponent)
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true } as any)
    // Also mock fetch for vapid key
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({ key: 'BTestVapidKey123' }) } as any)
      .mockResolvedValueOnce({ ok: true } as any)
    await wrapper.vm.subscribe()
    expect(mockSubscribe).toHaveBeenCalled()
  })
})
