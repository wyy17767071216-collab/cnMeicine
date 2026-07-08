<template>
  <div class="history-container page-container">
    <h1 class="page-title">历史记录</h1>

    <div v-if="logsStore.loading" class="loading">加载中...</div>

    <div v-else>
      <div v-for="day in pastDays" :key="day.date" class="day-group">
        <div class="day-header">{{ day.label }}</div>
        <div v-if="day.logs.length === 0" class="empty-day">暂无记录</div>
        <div
          v-for="log in day.logs"
          :key="log.id"
          class="history-card"
          :class="log.status"
        >
          <span class="med-name">{{ log.medication_name ?? log.medication_id }}</span>
          <span class="log-time">{{ log.time_label ?? '--' }}</span>
          <span class="status-badge" :class="log.status">
            {{ log.status === 'taken' ? '✓ 已服' : log.status === 'missed' ? '✗ 漏服' : '待服' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useLogsStore } from '../stores/logs'

const logsStore = useLogsStore()

onMounted(() => logsStore.fetchHistory(7))

const pastDays = computed(() => {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const label = i === 0 ? '今天' : i === 1 ? '昨天'
      : `${d.getMonth() + 1}月${d.getDate()}日`
    days.push({
      date: dateStr,
      label,
      logs: logsStore.logsByDate(dateStr)
    })
  }
  return days
})
</script>

<style scoped>
.page-container { padding: 16px; }
.page-title { font-size: 22px; font-weight: 700; margin-bottom: 20px; color: var(--color-primary); }
.day-group { margin-bottom: 20px; }
.day-header {
  font-size: 16px; color: #64748b; font-weight: 600;
  padding: 8px 0 4px; border-bottom: 1px solid #e2e8f0; margin-bottom: 8px;
}
.history-card {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff7ed; border-left: 4px solid #f97316;
  border-radius: 10px; padding: 12px 14px; margin-bottom: 8px;
}
.history-card.missed { background: #fef2f2; border-left-color: #ef4444; }
.history-card.taken  { background: #f0fdf4; border-left-color: #22c55e; }
.med-name  { font-size: 18px; font-weight: 700; color: #1e293b; flex: 1; }
.log-time  { font-size: 14px; color: #64748b; margin: 0 12px; }
.status-badge { font-size: 14px; font-weight: 600; padding: 4px 10px; border-radius: 6px; background: #e2e8f0; }
.status-badge.taken  { background: #dcfce7; color: #15803d; }
.status-badge.missed { background: #fee2e2; color: #dc2626; }
.empty-day { font-size: 16px; color: #94a3b8; padding: 8px 0 12px; }
.loading { text-align: center; padding: 40px; color: var(--color-muted); font-size: 18px; }
</style>
