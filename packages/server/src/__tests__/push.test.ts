import { describe, it, expect, vi } from 'vitest'
import { WebPushService } from '../services/WebPush'

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 })
  }
}))

const mockSubscription = {
  endpoint: 'https://fcm.googleapis.com/test-endpoint',
  p256dh: 'test-p256dh-key',
  auth: 'test-auth-key'
}

describe('WebPushService', () => {
  it('send() calls webpush.sendNotification with correct args', async () => {
    const webpush = (await import('web-push')).default
    const payload = { title: '服药提醒', body: '该服阿莫西林了', icon: '/icons/icon-192.png' }

    await WebPushService.send(mockSubscription, payload)

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      {
        endpoint: mockSubscription.endpoint,
        keys: { p256dh: mockSubscription.p256dh, auth: mockSubscription.auth }
      },
      JSON.stringify(payload)
    )
  })

  it('send() returns success when statusCode is 201', async () => {
    const result = await WebPushService.send(mockSubscription, { title: 'Test', body: 'Body', icon: '' })
    expect(result).toBe(true)
  })
})
