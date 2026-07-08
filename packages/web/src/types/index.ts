export type UserRole = 'admin' | 'viewer'

export interface User {
  id: string
  email: string
  role: UserRole
  display_name: string
  created_at: string
}

export interface Medication {
  id: string
  user_id: string
  name: string
  dosage: number
  unit: string          // mg / ml / 片 / 粒
  stock: number
  image_url: string | null
  usage_suggestion: string | null
  created_at: string
}

export interface Schedule {
  id: string
  medication_id: string
  time: string          // HH:MM
  days_of_week: number[] // 0=Sunday … 6=Saturday
  active: boolean
  created_at: string
}

export type LogStatus = 'pending' | 'taken' | 'missed' | 'future'

export interface MedicationLog {
  id: string
  schedule_id: string
  medication_id: string
  scheduled_at: string
  taken_at: string | null
  status: LogStatus
  created_at: string
}

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export interface VisionResult {
  name: string
  dosage: number
  unit: string
  usage_suggestion: string
}
