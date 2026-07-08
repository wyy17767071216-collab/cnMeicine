import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSchedulesStore } from '../stores/schedules'

const mockSchedule = {
  id: 'sch-1', medication_id: 'med-1',
  time: '08:00', days_of_week: [1,2,3,4,5],
  active: true, created_at: ''
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockSchedule], error: null }),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockSchedule, error: null }),
      update: vi.fn().mockReturnThis(),
    }))
  }
}))

describe('useSchedulesStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('byMedication returns filtered schedules', async () => {
    const store = useSchedulesStore()
    await store.fetchByMedication('med-1')
    const result = store.byMedication('med-1')
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].medication_id).toBe('med-1')
  })

  it('add() calls supabase insert and returns new schedule', async () => {
    const { supabase } = await import('../lib/supabase')
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockSchedule, error: null })
      })
    })
    vi.mocked(supabase.from).mockReturnValueOnce({ insert: mockInsert } as any)

    const store = useSchedulesStore()
    const result = await store.add({ medication_id: 'med-1', time: '08:00', days_of_week: [1,2,3,4,5], active: true })
    expect(result.id).toBe('sch-1')
  })

  it('toggle() flips the active field', async () => {
    const { supabase } = await import('../lib/supabase')
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    })
    vi.mocked(supabase.from).mockReturnValueOnce({ update: mockUpdate } as any)

    const store = useSchedulesStore()
    store.schedules = [{ ...mockSchedule }]
    await store.toggle('sch-1')
    expect(store.schedules[0].active).toBe(false)
  })
})
