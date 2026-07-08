<template>
  <div class="med-card" :class="`status-${log.status}`">
    <div class="med-info">
      <h3 class="med-name" data-testid="med-name">{{ medication.name }}</h3>
      <p class="med-detail">{{ medication.dosage }}{{ medication.unit }} · {{ formattedTime }}</p>
      <p v-if="medication.usage_suggestion" class="med-suggestion">{{ medication.usage_suggestion }}</p>
    </div>

    <div class="med-action">
      <button
        v-if="log.status === 'pending'"
        class="action-btn action-btn--primary"
        data-testid="action-btn"
        @click="$emit('mark-taken', log.id)"
      >
        ✓ 服用
      </button>
      <span v-else class="status-badge" :class="`badge-${log.status}`" data-testid="status-badge">
        {{ statusLabel }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MedicationLog, Medication } from '../types'

const props = defineProps<{ log: MedicationLog; medication: Medication }>()
defineEmits<{ 'mark-taken': [logId: string] }>()

const formattedTime = computed(() => {
  const d = new Date(props.log.scheduled_at)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
})

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    taken:   '✓ 已服用',
    missed:  '✗ 已漏服',
    future:  '⏰ 未到时间',
    pending: '等待服用'
  }
  return map[props.log.status] ?? props.log.status
})
</script>

<style scoped>
.med-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: var(--radius-md);
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #eee;
  transition: border-color 0.2s;
}
.status-pending { border-left-color: var(--color-primary); }
.status-taken   { border-left-color: #4CAF50; opacity: 0.7; }
.status-missed  { border-left-color: #F44336; }
.status-future  { border-left-color: #9E9E9E; }

.med-name   { font-size: 20px; font-weight: 600; color: #333; }
.med-detail { font-size: 16px; color: #666; margin-top: 4px; }
.med-suggestion { font-size: 14px; color: #999; margin-top: 2px; }

.action-btn {
  min-height: 52px;
  min-width: 80px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s, opacity 0.2s;
}
.action-btn:active { transform: scale(0.96); }
.action-btn--primary {
  background: var(--color-primary);
  color: #fff;
}

.status-badge {
  font-size: 15px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 20px;
}
.badge-taken  { background: #E8F5E9; color: #388E3C; }
.badge-missed { background: #FFEBEE; color: #C62828; }
.badge-future { background: #F5F5F5; color: #757575; }
</style>
