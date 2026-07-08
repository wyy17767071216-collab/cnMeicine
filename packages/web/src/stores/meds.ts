import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { Medication } from '../types'

type MedPayload = Omit<Medication, 'id' | 'user_id' | 'created_at'>

export const useMedsStore = defineStore('meds', () => {
  const medications = ref<Medication[]>([])
  const loading     = ref(false)

  async function fetchAll(): Promise<void> {
    loading.value = true
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .order('name')
    if (!error && data) medications.value = data as Medication[]
    loading.value = false
  }

  async function add(payload: MedPayload): Promise<Medication> {
    const { data, error } = await supabase
      .from('medications')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    medications.value.push(data as Medication)
    return data as Medication
  }

  async function update(id: string, payload: Partial<MedPayload>): Promise<void> {
    const { error } = await supabase
      .from('medications')
      .update(payload)
      .eq('id', id)
    if (error) throw error
    const idx = medications.value.findIndex(m => m.id === id)
    if (idx !== -1) medications.value[idx] = { ...medications.value[idx], ...payload }
  }

  async function remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', id)
    if (error) throw error
    medications.value = medications.value.filter(m => m.id !== id)
  }

  return { medications, loading, fetchAll, add, update, remove }
})
