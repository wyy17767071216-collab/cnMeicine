import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MedCard from '../components/MedCard.vue'
import type { MedicationLog, Medication } from '../types'

const baseMed: Medication = {
  id: 'med-1', user_id: 'u-1', name: '阿莫西林',
  dosage: 500, unit: 'mg', stock: 30,
  image_url: null, usage_suggestion: '饭后服用', created_at: ''
}

const baseLog: MedicationLog = {
  id: 'log-1', schedule_id: 'sch-1', medication_id: 'med-1',
  scheduled_at: '2026-07-08T08:00:00Z', taken_at: null,
  status: 'pending', created_at: ''
}

describe('MedCard', () => {
  it('renders drug name with font-size >= 18px class', () => {
    const wrapper = mount(MedCard, {
      props: { log: baseLog, medication: baseMed }
    })
    const name = wrapper.find('[data-testid="med-name"]')
    expect(name.exists()).toBe(true)
    expect(name.text()).toBe('阿莫西林')
  })

  it('shows "服用" button when status is pending', () => {
    const wrapper = mount(MedCard, {
      props: { log: baseLog, medication: baseMed }
    })
    const btn = wrapper.find('[data-testid="action-btn"]')
    expect(btn.text()).toContain('服用')
  })

  it('shows "已服用" badge when status is taken', () => {
    const wrapper = mount(MedCard, {
      props: { log: { ...baseLog, status: 'taken', taken_at: '2026-07-08T08:05:00Z' }, medication: baseMed }
    })
    expect(wrapper.find('[data-testid="status-badge"]').text()).toContain('已服用')
  })

  it('shows "未到时间" badge when status is future', () => {
    const wrapper = mount(MedCard, {
      props: { log: { ...baseLog, status: 'future' }, medication: baseMed }
    })
    expect(wrapper.find('[data-testid="status-badge"]').text()).toContain('未到时间')
  })

  it('emits mark-taken when action button clicked', async () => {
    const wrapper = mount(MedCard, {
      props: { log: baseLog, medication: baseMed }
    })
    await wrapper.find('[data-testid="action-btn"]').trigger('click')
    expect(wrapper.emitted('mark-taken')).toBeTruthy()
    expect(wrapper.emitted('mark-taken')![0]).toEqual(['log-1'])
  })
})
