import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)

  const role    = computed(() => currentUser.value?.role ?? null)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  async function fetchUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) return null
    return data as User
  }

  async function login(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) {
      currentUser.value = await fetchUserProfile(data.user.id)
    }
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut()
    currentUser.value = null
  }

  async function init(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      currentUser.value = await fetchUserProfile(session.user.id)
    }
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        currentUser.value = await fetchUserProfile(session.user.id)
      } else {
        currentUser.value = null
      }
    })
  }

  async function refreshUser(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      currentUser.value = await fetchUserProfile(session.user.id)
    }
  }

  return { currentUser, role, isAdmin, login, logout, init, refreshUser }
})
