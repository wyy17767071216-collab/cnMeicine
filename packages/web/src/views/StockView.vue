<template>
  <div class="stock-view">
    <header class="page-header">
      <h1>库存管理</h1>
    </header>

    <ul class="stock-list">
      <li v-for="med in medsStore.medications" :key="med.id" class="stock-item">
        <div class="stock-body">
          <p class="stock-name">{{ med.name }}</p>
          <p class="stock-sub">{{ med.dosage }}{{ med.unit }}</p>
        </div>
        <div class="stock-count" :class="{ low: med.stock <= 7 }">
          <span class="count-num">{{ med.stock }}</span>
          <span class="count-label">剩余</span>
        </div>
      </li>
    </ul>

    <div v-if="medsStore.medications.length === 0" class="empty">
      暂无药品记录
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMedsStore } from '../stores/meds'

const medsStore = useMedsStore()
onMounted(() => medsStore.fetchAll())
</script>

<style scoped>
.stock-view { padding: 16px; }
.page-header h1 { font-size: 22px; font-weight: 700; color: var(--color-primary); margin-bottom: 20px; }
.stock-list { list-style: none; }
.stock-item {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border-radius: 12px; padding: 16px;
  margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.stock-name { font-size: 18px; font-weight: 700; color: #1e293b; }
.stock-sub  { font-size: 14px; color: #94a3b8; margin-top: 4px; }
.stock-count { text-align: center; }
.count-num  { display: block; font-size: 28px; font-weight: 700; color: #22c55e; }
.count-label { font-size: 12px; color: #94a3b8; }
.stock-count.low .count-num { color: #ef4444; }
.empty { text-align: center; color: #94a3b8; font-size: 16px; padding: 60px 0; }
</style>
