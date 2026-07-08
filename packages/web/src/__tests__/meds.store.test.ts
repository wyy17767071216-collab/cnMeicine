import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMedsStore } from '../stores/meds'

const mockMed = {
  id: 'med-1', user_id: 'u-1', name: '阿莫西林',
  dosage: 500, unit: 'mg', stock: 30,
  image_url: null, usage_suggestion: '饭后服用', created_at: ''
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockMed], error: null }),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockMed, error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockReturnThis(),
    }))
  }
}))

describe('useMedsStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('fetchAll populates medications list', async () => {
    const store = useMedsStore()
    await store.fetchAll()
    expect(store.medications.length).toBeGreaterThanOrEqual(1)
    expect(store.medications[0].name).toBe('阿莫西林')
  })

  it('add() calls supabase insert', async () => {
    const { supabase } = await import('../lib/supabase')
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockMed, error: null })
      })
    })
    vi.mocked(supabase.from).mockReturnValueOnce({ insert: mockInsert } as any)

    const store = useMedsStore()
    const payload = { name: '布洛芬', dosage: 400, unit: 'mg', stock: 20, usage_suggestion: '', image_url: null }
    await store.add(payload)
    expect(mockInsert).toHaveBeenCalled()
  })

  it('remove() calls supabase delete', async () => {
    const { supabase } = await import('../lib/supabase')
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    })
    vi.mocked(supabase.from).mockReturnValueOnce({ delete: mockDelete } as any)

    const store = useMedsStore()
    store.medications = [mockMed]
    await store.remove('med-1')
    expect(mockDelete).toHaveBeenCalled()
    expect(store.medications.find(m => m.id === 'med-1')).toBeUndefined()
  })
})
