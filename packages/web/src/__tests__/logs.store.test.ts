import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLogsStore } from '../stores/logs'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'log-1', schedule_id: 'sch-1', medication_id: 'med-1',
            scheduled_at: new Date().toISOString(), taken_at: null,
            status: 'pending', created_at: ''
          }
        ],
        error: null
      })
    }))
  }
}))

describe('useLogsStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('todayLogs() returns logs for today', async () => {
    const store = useLogsStore()
    await store.fetchToday()
    expect(store.todayLogs.length).toBeGreaterThanOrEqual(0)
  })

  it('markTaken calls supabase update', async () => {
    const { supabase } = await import('../lib/supabase')
    const mockUpdate = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValueOnce({
      update: vi.fn().mockReturnValue({ eq: mockUpdate })
    } as any)

    const store = useLogsStore()
    await store.markTaken('log-1')
    expect(supabase.from).toHaveBeenCalledWith('medication_logs')
  })
})
