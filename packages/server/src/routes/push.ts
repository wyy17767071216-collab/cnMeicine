import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'
import { authMiddleware } from '../middleware/auth'

type Variables = { userId: string }

const push = new Hono<{ Variables: Variables }>()
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Public endpoint — no auth
push.get('/vapid-public-key', (c) => {
  return c.json({ key: process.env.VAPID_PUBLIC_KEY ?? '' })
})

// Protected endpoints
push.use('/subscribe', authMiddleware)

push.post('/subscribe', async (c) => {
  const userId = c.get('userId')
  const { endpoint, p256dh, auth } = await c.req.json<{
    endpoint: string; p256dh: string; auth: string
  }>()

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: userId, endpoint, p256dh, auth }, { onConflict: 'endpoint' })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

push.delete('/subscribe', async (c) => {
  const userId = c.get('userId')
  const { endpoint } = await c.req.json<{ endpoint: string }>()

  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)

  return c.json({ success: true })
})

export default push
