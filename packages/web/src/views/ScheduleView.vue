<template>
  <div class="schedule-view">
    <header class="page-header">
      <h1>服药计划</h1>
    </header>

    <div v-if="!selectedMedId" class="select-prompt">
      <p class="prompt-text">请选择药品查看/设置计划</p>
      <ul class="med-selector">
        <li v-for="med in medsStore.medications" :key="med.id">
          <button class="med-select-btn" @click="selectMed(med.id)">
            <span class="med-btn-name">{{ med.name }}</span>
            <span class="med-btn-dose">{{ med.dosage }}{{ med.unit }}</span>
          </button>
        </li>
      </ul>
      <div v-if="medsStore.medications.length === 0" class="empty-hint">
        暂无药品，请先在「药品」页添加
      </div>
    </div>

    <div v-else class="schedule-detail">
      <button class="back-btn" @click="selectedMedId = null">← 返回</button>
      <h2 class="current-med">{{ currentMedName }}</h2>

      <ul v-if="currentSchedules.length > 0" class="schedule-list">
        <li v-for="sch in currentSchedules" :key="sch.id" class="schedule-item">
          <span class="sch-time">{{ sch.time }}</span>
          <span class="sch-days">{{ formatDays(sch.days_of_week) }}</span>
          <div class="sch-controls">
            <button
              v-if="auth.isAdmin"
              class="toggle-btn"
              :class="{ active: sch.active }"
              @click="schedulesStore.toggle(sch.id)"
            >
              {{ sch.active ? '启用中' : '已停用' }}
            </button>
            <span v-else class="status-dot" :class="{ active: sch.active }" />
            <button
              v-if="auth.isAdmin"
              class="remove-btn"
              @click="schedulesStore.remove(sch.id)"
              aria-label="删除"
            >🗑️</button>
          </div>
        </li>
      </ul>
      <div v-else class="empty-hint">暂无提醒时间，点击下方添加</div>

      <button v-if="auth.isAdmin" class="add-sch-btn" @click="showAddForm = true">
        ＋ 添加提醒时间
      </button>

      <Teleport to="body">
        <div v-if="showAddForm" class="modal-overlay" @click.self="showAddForm = false">
          <form class="modal-form" @submit.prevent="submitSchedule">
            <h2>添加提醒时间</h2>
            <label>时间 <input v-model="newTime" type="time" required /></label>
            <label>
              每周哪几天
              <div class="day-picker">
                <label v-for="d in dayOptions" :key="d.value" class="day-checkbox">
                  <input type="checkbox" :value="d.value" v-model="newDays" />
                  {{ d.label }}
                </label>
              </div>
            </label>
            <div class="form-actions">
              <button type="button" @click="showAddForm = false">取消</button>
              <button type="submit" :disabled="newDays.length === 0">添加</button>
            </div>
          </form>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSchedulesStore } from '../stores/schedules'
import { useMedsStore }      from '../stores/meds'
import { useAuthStore }      from '../stores/auth'

const schedulesStore = useSchedulesStore()
const medsStore      = useMedsStore()
const auth           = useAuthStore()

const selectedMedId = ref<string | null>(null)
const showAddForm   = ref(false)
const newTime = ref('08:00')
const newDays = ref<number[]>([1,2,3,4,5])

const dayOptions = [
  { value: 0, label: '日' }, { value: 1, label: '一' }, { value: 2, label: '二' },
  { value: 3, label: '三' }, { value: 4, label: '四' }, { value: 5, label: '五' },
  { value: 6, label: '六' }
]

const currentSchedules = computed(() =>
  selectedMedId.value ? schedulesStore.byMedication(selectedMedId.value) : []
)

const currentMedName = computed(() =>
  medsStore.medications.find(m => m.id === selectedMedId.value)?.name ?? ''
)

function formatDays(days: number[]): string {
  const map: Record<number, string> = { 0:'日',1:'一',2:'二',3:'三',4:'四',5:'五',6:'六' }
  if (days.length === 7) return '每天'
  return days.map(d => `周${map[d]}`).join(' ')
}

async function selectMed(id: string) {
  selectedMedId.value = id
  await schedulesStore.fetchByMedication(id)
}

async function submitSchedule() {
  if (!selectedMedId.value || newDays.value.length === 0) return
  await schedulesStore.add({
    medication_id: selectedMedId.value,
    time: newTime.value,
    days_of_week: [...newDays.value].sort(),
    active: true
  })
  showAddForm.value = false
  newTime.value = '08:00'
  newDays.value = [1,2,3,4,5]
}

onMounted(() => medsStore.fetchAll())
</script>

<style scoped>
.schedule-view { padding: 20px 16px; }
.page-header h1 { font-size: 26px; font-weight: 700; color: var(--color-primary); margin-bottom: 20px; }
.select-prompt { text-align: center; padding: 10px 0; }
.prompt-text { font-size: 18px; color: var(--color-muted); margin-bottom: 16px; }
.med-selector { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.med-select-btn {
  width: 100%; min-height: 52px; display: flex; align-items: center; justify-content: space-between;
  background: #fff; border: 2px solid var(--color-primary);
  border-radius: var(--radius-md); padding: 0 16px; cursor: pointer;
}
.med-btn-name { font-size: 18px; color: var(--color-primary); font-weight: 600; }
.med-btn-dose { font-size: 14px; color: var(--color-muted); }
.empty-hint { font-size: 16px; color: var(--color-muted); margin-top: 20px; }
.back-btn { background: none; border: none; font-size: 18px; color: var(--color-primary); cursor: pointer; margin-bottom: 12px; }
.current-med { font-size: 22px; font-weight: 700; margin-bottom: 16px; }
.schedule-list { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.schedule-item {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border-radius: var(--radius-md); padding: 14px 16px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}
.sch-time { font-size: 24px; font-weight: 700; min-width: 64px; }
.sch-days { flex: 1; font-size: 14px; color: var(--color-muted); }
.sch-controls { display: flex; align-items: center; gap: 8px; }
.toggle-btn {
  min-height: 36px; padding: 0 14px; border-radius: 20px;
  border: 2px solid var(--color-primary); background: #fff;
  color: var(--color-primary); font-size: 14px; cursor: pointer;
}
.toggle-btn.active { background: var(--color-primary); color: #fff; }
.status-dot { width: 12px; height: 12px; border-radius: 50%; background: #ddd; }
.status-dot.active { background: #4CAF50; }
.remove-btn { min-height: 40px; min-width: 40px; border: none; background: none; font-size: 18px; cursor: pointer; }
.add-sch-btn {
  width: 100%; min-height: 52px; background: var(--color-primary); color: #fff;
  border: none; border-radius: var(--radius-md); font-size: 18px; cursor: pointer; margin-top: 8px;
}
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: flex-end; z-index: 200;
}
.modal-form {
  background: #fff; border-radius: 20px 20px 0 0;
  padding: 24px; width: 100%; display: flex; flex-direction: column; gap: 14px;
}
.modal-form h2 { font-size: 22px; font-weight: 700; }
.modal-form label { font-size: 16px; display: flex; flex-direction: column; gap: 6px; }
.modal-form input[type=time] {
  height: 52px; border: 1px solid #ddd;
  border-radius: var(--radius-md); padding: 0 14px; font-size: 18px;
}
.day-picker { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
.day-checkbox { display: flex; align-items: center; gap: 4px; font-size: 16px; }
.form-actions { display: flex; gap: 12px; }
.form-actions button {
  flex: 1; height: 52px; border: none;
  border-radius: var(--radius-md); font-size: 18px; cursor: pointer;
}
.form-actions button[type=submit] { background: var(--color-primary); color: #fff; }
.form-actions button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
