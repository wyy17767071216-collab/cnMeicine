import cron from 'node-cron'
import { createClient } from '@supabase/supabase-js'
import { WebPushService, type PushTarget } from './WebPush'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAllSubscriptions(): Promise<PushTarget[]> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
  if (error || !data) return []
  return data as PushTarget[]
}

export const CronService = {
  /**
   * checkReminders — runs every minute.
   * Finds pending logs scheduled within ±2 minutes of now and sends push.
   */
  async checkReminders(): Promise<void> {
    const now   = new Date()
    const start = new Date(now.getTime() - 2 * 60 * 1000).toISOString()
    const end   = new Date(now.getTime() + 2 * 60 * 1000).toISOString()

    const { data: logs, error } = await supabase
      .from('medication_logs')
      .select('id, schedule_id, medication_id, scheduled_at')
      .eq('status', 'pending')
      .gte('scheduled_at', start)
      .lte('scheduled_at', end)
      .order('scheduled_at')

    if (error || !logs || logs.length === 0) return

    const subscriptions = await getAllSubscriptions()
    if (subscriptions.length === 0) return

    for (const log of logs) {
      const payload = {
        title: '💊 服药提醒',
        body:  `该服药了！请查看今日服药计划。`,
        icon:  '/icons/icon-192.png',
        data:  { logId: log.id, medicationId: log.medication_id }
      }
      for (const sub of subscriptions) {
        await WebPushService.send(sub, payload)
      }
    }
  },

  /**
   * checkMissedDoses — runs daily at 22:00.
   * Marks all still-pending logs from today as missed and notifies all subscribers.
   */
  async checkMissedDoses(): Promise<void> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString() // > 30 min ago

    const { data: overdue, error } = await supabase
      .from('medication_logs')
      .select('id, medication_id, scheduled_at')
      .eq('status', 'pending')
      .gte('scheduled_at', today.toISOString())
      .lte('scheduled_at', cutoff)
      .order('scheduled_at')

    if (error || !overdue || overdue.length === 0) return

    const ids = overdue.map((l: any) => l.id)

    await supabase
      .from('medication_logs')
      .update({ status: 'missed' })
      .in('id', ids)

    const subscriptions = await getAllSubscriptions()
    for (const sub of subscriptions) {
      await WebPushService.send(sub, {
        title: '⚠️ 漏服提醒',
        body:  `今日有 ${ids.length} 次服药记录被标记为漏服，请关注。`,
        icon:  '/icons/icon-192.png',
        data:  { missedCount: ids.length }
      })
    }
  },

  start(): void {
    // Every minute: check reminders
    cron.schedule('* * * * *', async () => {
      try { await CronService.checkReminders() }
      catch (e) { console.error('[Cron] checkReminders error:', e) }
    })

    // Daily at 22:00: check missed doses
    cron.schedule('0 22 * * *', async () => {
      try { await CronService.checkMissedDoses() }
      catch (e) { console.error('[Cron] checkMissedDoses error:', e) }
    })

    console.log('[Cron] Jobs registered: checkReminders (*/1) + checkMissedDoses (22:00)')
  }
}
