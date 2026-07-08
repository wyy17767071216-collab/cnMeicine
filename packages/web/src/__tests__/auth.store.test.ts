import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../stores/auth'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    })
  }
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initial state: currentUser is null', () => {
    const auth = useAuthStore()
    expect(auth.currentUser).toBeNull()
  })

  it('login sets currentUser on success', async () => {
    const { supabase } = await import('../lib/supabase')
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: {
        user: { id: 'uuid-001', email: 'child@example.com' },
        session: { access_token: 'tok' }
      },
      error: null
    } as any)
    vi.mocked(supabase.from('users').select('*').eq('id', 'uuid-001').single).mockResolvedValueOnce({
      data: { id: 'uuid-001', email: 'child@example.com', role: 'admin', display_name: '小明', created_at: '' },
      error: null
    } as any)

    const auth = useAuthStore()
    await auth.login('child@example.com', 'password123')
    expect(auth.currentUser).not.toBeNull()
    expect(auth.currentUser?.role).toBe('admin')
  })

  it('role computed returns null when not logged in', () => {
    const auth = useAuthStore()
    expect(auth.role).toBeNull()
  })

  it('isAdmin returns false when viewer', async () => {
    const auth = useAuthStore()
    auth.currentUser = { id: 'x', email: 'old@example.com', role: 'viewer', display_name: '爷爷', created_at: '' }
    expect(auth.isAdmin).toBe(false)
  })

  it('logout clears currentUser', async () => {
    const { supabase } = await import('../lib/supabase')
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null } as any)

    const auth = useAuthStore()
    auth.currentUser = { id: 'x', email: 'child@example.com', role: 'admin', display_name: '小明', created_at: '' }
    await auth.logout()
    expect(auth.currentUser).toBeNull()
  })
})
