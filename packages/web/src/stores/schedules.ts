import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { Schedule } from '../types'

type SchedulePayload = Omit<Schedule, 'id' | 'created_at'>

export const useSchedulesStore = defineStore('schedules', () => {
  const schedules = ref<Schedule[]>([])

  function byMedication(medId: string): Schedule[] {
    return schedules.value.filter(s => s.medication_id === medId)
  }

  async function fetchByMedication(medId: string): Promise<void> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('medication_id', medId)
      .order('time')
    if (!error && data) {
      const incoming = data as Schedule[]
      incoming.forEach(s => {
        if (!schedules.value.find(x => x.id === s.id)) schedules.value.push(s)
      })
    }
  }

  async function add(payload: SchedulePayload): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    schedules.value.push(data as Schedule)
    return data as Schedule
  }

  async function toggle(id: string): Promise<void> {
    const sch = schedules.value.find(s => s.id === id)
    if (!sch) return
    const newActive = !sch.active
    const { error } = await supabase
      .from('schedules')
      .update({ active: newActive })
      .eq('id', id)
    if (!error) sch.active = newActive
  }

  async function remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
    if (error) throw error
    schedules.value = schedules.value.filter(s => s.id !== id)
  }

  return { schedules, byMedication, fetchByMedication, add, toggle, remove }
})
