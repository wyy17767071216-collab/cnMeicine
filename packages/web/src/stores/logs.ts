import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { MedicationLog } from '../types'

// Extended log type with display fields (joined from related tables)
export interface LogWithDisplay extends MedicationLog {
  medication_name?: string
  time_label?: string
  scheduled_date?: string
}

export const useLogsStore = defineStore('logs', () => {
  const todayLogs = ref<MedicationLog[]>([])
  const allLogs   = ref<LogWithDisplay[]>([])
  const loading   = ref(false)

  async function fetchToday(): Promise<void> {
    loading.value = true
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .order('scheduled_at')

    if (!error && data) todayLogs.value = data as MedicationLog[]
    loading.value = false
  }

  async function markTaken(logId: string): Promise<void> {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('medication_logs')
      .update({ status: 'taken', taken_at: now })
      .eq('id', logId)

    if (!error) {
      const log = todayLogs.value.find(l => l.id === logId)
      if (log) { log.status = 'taken'; log.taken_at = now }
      const allLog = allLogs.value.find(l => l.id === logId)
      if (allLog) { allLog.status = 'taken'; allLog.taken_at = now }
    }
  }

  async function fetchHistory(days: number): Promise<void> {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data, error } = await supabase
      .from('medication_logs')
      .select('*, schedules(medications(name))')
      .gte('scheduled_at', since.toISOString())
      .order('scheduled_at', { ascending: false })

    if (!error && data) {
      allLogs.value = (data as any[]).map(r => ({
        ...r,
        medication_name: r.schedules?.medications?.name ?? '未知药品',
        time_label: r.taken_at
          ? new Date(r.taken_at).toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' })
          : '--',
        scheduled_date: r.scheduled_at?.slice(0, 10) ?? ''
      })) as LogWithDisplay[]
    }
  }

  function logsByDate(date: string): LogWithDisplay[] {
    return allLogs.value.filter(l => l.scheduled_date === date)
  }

  return { todayLogs, allLogs, loading, fetchToday, markTaken, fetchHistory, logsByDate }
})
