import { describe, it, expect } from 'vitest'
import type { User, Medication, Schedule, MedicationLog, PushSubscription } from '../types/index'

describe('TypeScript types', () => {
  it('User type has required fields', () => {
    const user: User = {
      id: 'uuid-001',
      email: 'child@example.com',
      role: 'admin',
      display_name: '小明',
      created_at: '2026-01-01T00:00:00Z'
    }
    expect(user.role).toBe('admin')
  })

  it('Medication type has required fields', () => {
    const med: Medication = {
      id: 'uuid-med-001',
      user_id: 'uuid-001',
      name: '阿莫西林',
      dosage: 500,
      unit: 'mg',
      stock: 30,
      image_url: null,
      usage_suggestion: '饭后服用',
      created_at: '2026-01-01T00:00:00Z'
    }
    expect(med.name).toBe('阿莫西林')
  })

  it('Schedule type has required fields', () => {
    const schedule: Schedule = {
      id: 'uuid-sch-001',
      medication_id: 'uuid-med-001',
      time: '08:00',
      days_of_week: [1, 2, 3, 4, 5],
      active: true,
      created_at: '2026-01-01T00:00:00Z'
    }
    expect(schedule.days_of_week).toContain(1)
  })

  it('MedicationLog type has required fields', () => {
    const log: MedicationLog = {
      id: 'uuid-log-001',
      schedule_id: 'uuid-sch-001',
      medication_id: 'uuid-med-001',
      scheduled_at: '2026-01-01T08:00:00Z',
      taken_at: null,
      status: 'pending',
      created_at: '2026-01-01T00:00:00Z'
    }
    expect(log.status).toBe('pending')
  })

  it('PushSubscription type has required fields', () => {
    const sub: PushSubscription = {
      id: 'uuid-sub-001',
      user_id: 'uuid-001',
      endpoint: 'https://fcm.googleapis.com/...',
      p256dh: 'base64key',
      auth: 'base64auth',
      created_at: '2026-01-01T00:00:00Z'
    }
    expect(sub.endpoint).toContain('https://')
  })
})
