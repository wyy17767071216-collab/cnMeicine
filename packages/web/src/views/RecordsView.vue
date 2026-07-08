<template>
  <div class="records-container page-container">
    <h1 class="page-title">服药记录</h1>

    <div class="filter-row">
      <label class="filter-label">
        筛选状态：
        <select v-model="filterStatus" class="filter-select">
          <option value="">全部</option>
          <option value="taken">已服</option>
          <option value="missed">漏服</option>
          <option value="pending">待服</option>
        </select>
      </label>
    </div>

    <div v-if="filteredLogs.length === 0" class="empty-state">暂无记录</div>

    <div v-for="log in filteredLogs" :key="log.id" class="record-row">
      <span class="record-date">{{ log.scheduled_date ?? log.scheduled_at?.slice(0, 10) }}</span>
      <span class="record-med">{{ log.medication_name ?? log.medication_id }}</span>
      <span class="record-status" :class="log.status">
        {{ log.status === 'taken' ? '已服' : log.status === 'missed' ? '漏服' : '待服' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLogsStore } from '../stores/logs'

const logsStore    = useLogsStore()
const filterStatus = ref('')

onMounted(() => logsStore.fetchHistory(30))

const filteredLogs = computed(() =>
  filterStatus.value
    ? logsStore.allLogs.filter(l => l.status === filterStatus.value)
    : logsStore.allLogs
)
</script>

<style scoped>
.page-container { padding: 16px; }
.page-title { font-size: 22px; font-weight: 700; margin-bottom: 16px; color: var(--color-primary); }
.filter-row  { margin-bottom: 16px; }
.filter-label { font-size: 16px; color: #475569; }
.filter-select { font-size: 16px; margin-left: 8px; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 8px; }
.record-row  {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; margin-bottom: 8px;
  background: #fff7ed; border-radius: 10px; border-left: 4px solid #f97316;
}
.record-date { font-size: 14px; color: #64748b; min-width: 90px; }
.record-med  { font-size: 18px; font-weight: 700; color: #1e293b; flex: 1; padding: 0 8px; }
.record-status { font-size: 14px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
.record-status.taken  { background: #dcfce7; color: #15803d; }
.record-status.missed { background: #fee2e2; color: #dc2626; }
.record-status.pending{ background: #fef9c3; color: #92400e; }
.empty-state { font-size: 18px; color: #94a3b8; text-align: center; padding: 40px 0; }
</style>
