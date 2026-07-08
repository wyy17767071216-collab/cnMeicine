<template>
  <div class="today-view">
    <header class="page-header">
      <h1>今日服药</h1>
      <span class="date">{{ todayStr }}</span>
    </header>

    <div v-if="logsStore.loading" class="loading">加载中...</div>

    <div v-else-if="groupedLogs.length === 0" class="empty">
      <p>今天没有服药计划 🎉</p>
    </div>

    <div v-else class="log-list">
      <MedCard
        v-for="item in groupedLogs"
        :key="item.log.id"
        :log="item.log"
        :medication="item.medication"
        @mark-taken="handleMarkTaken"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useLogsStore }  from '../stores/logs'
import { useMedsStore }  from '../stores/meds'
import MedCard from '../components/MedCard.vue'

const logsStore = useLogsStore()
const medsStore = useMedsStore()

const todayStr = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
})

const groupedLogs = computed(() =>
  logsStore.todayLogs.map(log => ({
    log,
    medication: medsStore.medications.find(m => m.id === log.medication_id)!
  })).filter(item => !!item.medication)
)

async function handleMarkTaken(logId: string) {
  await logsStore.markTaken(logId)
}

onMounted(async () => {
  await Promise.all([logsStore.fetchToday(), medsStore.fetchAll()])
})
</script>

<style scoped>
.today-view { padding: 20px 16px; }
.page-header { margin-bottom: 20px; }
.page-header h1 { font-size: 26px; font-weight: 700; color: var(--color-primary); }
.date { font-size: 14px; color: var(--color-muted); }
.loading, .empty { text-align: center; padding: 60px 20px; color: var(--color-muted); font-size: 18px; }
</style>
