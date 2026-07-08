import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const SERVER_URL = import.meta.env.VITE_SERVER_URL as string

export function usePush() {
  const isSubscribed    = ref(false)
  const vapidPublicKey  = ref('')

  async function fetchVapidKey(): Promise<string> {
    const res  = await fetch(`${SERVER_URL}/api/push/vapid-public-key`)
    const data = await res.json()
    return data.key as string
  }

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
  }

  async function requestPermission(): Promise<boolean> {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  async function subscribe(): Promise<void> {
    const key = vapidPublicKey.value || await fetchVapidKey()
    vapidPublicKey.value = key

    const registration = await navigator.serviceWorker.ready
    const existing     = await registration.pushManager.getSubscription()
    if (existing) { isSubscribed.value = true; return }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(key)
    })

    const subJson = subscription.toJSON()
    const session  = await supabase.auth.getSession()
    const token    = session.data.session?.access_token

    await fetch(`${SERVER_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        p256dh:   subJson.keys?.p256dh,
        auth:     subJson.keys?.auth
      })
    })

    isSubscribed.value = true
  }

  async function unsubscribe(): Promise<void> {
    const registration = await navigator.serviceWorker.ready
    const existing     = await registration.pushManager.getSubscription()
    if (!existing) { isSubscribed.value = false; return }

    const session = await supabase.auth.getSession()
    const token   = session.data.session?.access_token

    await fetch(`${SERVER_URL}/api/push/subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ endpoint: existing.endpoint })
    })

    await existing.unsubscribe()
    isSubscribed.value = false
  }

  return { isSubscribed, requestPermission, subscribe, unsubscribe }
}
