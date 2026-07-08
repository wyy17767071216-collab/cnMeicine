import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Supabase ─────────────────────────────────────────────────────────
const mockLogs = [
  {
    id: 'log-pending-1',
    schedule_id: 'sch-1',
    medication_id: 'med-1',
    scheduled_at: new Date().toISOString(),
    status: 'pending'
  }
]

const mockSubscriptions = [
  { endpoint: 'https://fcm.test/1', p256dh: 'key1', auth: 'auth1' }
]

const mockSelect = vi.fn().mockReturnThis()
const mockEq     = vi.fn().mockReturnThis()
const mockIn     = vi.fn().mockReturnThis()
const mockUpdate = vi.fn().mockReturnThis()
const mockGte    = vi.fn().mockReturnThis()
const mockLte    = vi.fn().mockReturnThis()
const mockOrder  = vi.fn().mockResolvedValue({ data: mockLogs, error: null })

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'push_subscriptions') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ endpoint: 'https://fcm.test/1', p256dh: 'key1', auth: 'auth1' }],
            error: null
          })
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        in:     vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        gte:    vi.fn().mockReturnThis(),
        lte:    vi.fn().mockReturnThis(),
        order:  vi.fn().mockResolvedValue({
          data: [{
            id: 'log-pending-1',
            schedule_id: 'sch-1',
            medication_id: 'med-1',
            scheduled_at: new Date().toISOString(),
            status: 'pending'
          }],
          error: null
        })
      }
    })
  }))
}))

// ── Mock WebPush ──────────────────────────────────────────────────────────
vi.mock('../services/WebPush', () => ({
  WebPushService: { send: vi.fn().mockResolvedValue(true) }
}))

// ── Mock node-cron ────────────────────────────────────────────────────────
vi.mock('node-cron', () => ({
  default: { schedule: vi.fn() }
}))

import { CronService } from '../services/CronService'
import { WebPushService } from '../services/WebPush'

describe('CronService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('checkReminders() sends push for due pending logs', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    // reset order mock to return pending logs
    vi.mocked(createClient)().from = vi.fn((table: string) => {
      if (table === 'push_subscriptions') {
        return {
          select: vi.fn().mockResolvedValue({ data: mockSubscriptions, error: null })
        } as any
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        gte:    vi.fn().mockReturnThis(),
        lte:    vi.fn().mockReturnThis(),
        order:  vi.fn().mockResolvedValue({ data: mockLogs, error: null })
      } as any
    })

    // reset send mock
    vi.mocked(WebPushService.send).mockResolvedValue(true)

    await CronService.checkReminders()
    expect(WebPushService.send).toHaveBeenCalledWith(
      mockSubscriptions[0],
      expect.objectContaining({ title: expect.stringContaining('服药') })
    )
  })

  it('checkMissedDoses() updates pending→missed for overdue logs', async () => {
    const overdueLogs = [{
      id: 'log-overdue-1',
      medication_id: 'med-1',
      scheduled_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
      status: 'pending'
    }]

    const mockUpdateChain = { in: vi.fn().mockResolvedValue({ error: null }) }
    const mockUpdateFn    = vi.fn().mockReturnValue(mockUpdateChain)

    const { createClient } = await import('@supabase/supabase-js')
    vi.mocked(createClient)().from = vi.fn((table: string) => {
      if (table === 'push_subscriptions') {
        return { select: vi.fn().mockResolvedValue({ data: mockSubscriptions, error: null }) } as any
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        gte:    vi.fn().mockReturnThis(),
        lte:    vi.fn().mockReturnThis(),
        order:  vi.fn().mockResolvedValue({ data: overdueLogs, error: null }),
        update: mockUpdateFn,
        in:     vi.fn().mockReturnThis()
      } as any
    })

    vi.mocked(WebPushService.send).mockResolvedValue(true)

    await CronService.checkMissedDoses()
    expect(WebPushService.send).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ title: expect.stringContaining('漏服') })
    )
  })

  it('start() registers two cron jobs', async () => {
    const cronModule = await import('node-cron')
    const cron = cronModule.default
    CronService.start()
    expect(vi.mocked(cron.schedule)).toHaveBeenCalledTimes(2)
  })
})
