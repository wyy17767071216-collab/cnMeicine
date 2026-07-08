import webpush from 'web-push'

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? 'admin@example.com'}`,
  process.env.VAPID_PUBLIC_KEY  ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
)

export interface PushPayload {
  title: string
  body:  string
  icon:  string
  data?: Record<string, unknown>
}

export interface PushTarget {
  endpoint: string
  p256dh:   string
  auth:     string
}

export const WebPushService = {
  async send(target: PushTarget, payload: PushPayload): Promise<boolean> {
    try {
      const res = await webpush.sendNotification(
        { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
        JSON.stringify(payload)
      )
      return res.statusCode === 201
    } catch (err) {
      console.error('[WebPush] send error:', err)
      return false
    }
  }
}
