<template>
  <div class="meds-view">
    <header class="page-header">
      <h1>药品管理</h1>
      <button v-if="auth.isAdmin" class="add-btn" @click="showForm = true">
        ＋ 添加药品
      </button>
    </header>

    <div v-if="medsStore.loading" class="loading">加载中...</div>

    <ul v-else class="med-list">
      <li v-for="med in medsStore.medications" :key="med.id" class="med-item">
        <div class="med-body">
          <p class="med-title">{{ med.name }}</p>
          <p class="med-sub">{{ med.dosage }}{{ med.unit }} · 库存 {{ med.stock }}</p>
          <p v-if="med.usage_suggestion" class="med-sub">{{ med.usage_suggestion }}</p>
        </div>
        <div v-if="auth.isAdmin" class="med-actions">
          <button class="icon-btn" @click="startEdit(med)" aria-label="编辑">✏️</button>
          <button class="icon-btn" @click="confirmDelete(med.id)" aria-label="删除">🗑️</button>
        </div>
      </li>
    </ul>

    <Teleport to="body">
      <div v-if="showForm" class="modal-overlay" @click.self="resetForm">
        <form class="modal-form" @submit.prevent="submitForm">
          <h2>{{ editTarget ? '编辑药品' : '添加药品' }}</h2>
          <label>药品名称 <input v-model="form.name" required /></label>
          <label>剂量 <input v-model.number="form.dosage" type="number" step="0.01" required /></label>
          <label>单位 <input v-model="form.unit" placeholder="mg / ml / 片 / 粒" /></label>
          <label>库存数量 <input v-model.number="form.stock" type="number" /></label>
          <label>用法建议 <input v-model="form.usage_suggestion" /></label>
          <div class="form-actions">
            <button type="button" @click="resetForm">取消</button>
            <button type="submit">{{ editTarget ? '保存' : '添加' }}</button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useMedsStore } from '../stores/meds'
import { useAuthStore } from '../stores/auth'
import type { Medication } from '../types'

const medsStore = useMedsStore()
const auth      = useAuthStore()

const showForm   = ref(false)
const editTarget = ref<Medication | null>(null)
const form = reactive({
  name: '', dosage: 0, unit: 'mg', stock: 0,
  usage_suggestion: '', image_url: null as string | null
})

function startEdit(med: Medication) {
  editTarget.value = med
  Object.assign(form, { ...med })
  showForm.value = true
}

function resetForm() {
  Object.assign(form, { name: '', dosage: 0, unit: 'mg', stock: 0, usage_suggestion: '', image_url: null })
  editTarget.value = null
  showForm.value = false
}

async function submitForm() {
  if (editTarget.value) {
    await medsStore.update(editTarget.value.id, form)
  } else {
    await medsStore.add(form)
  }
  resetForm()
}

async function confirmDelete(id: string) {
  if (confirm('确认删除该药品？相关的服药计划也会被删除。')) {
    await medsStore.remove(id)
  }
}

onMounted(() => medsStore.fetchAll())
</script>

<style scoped>
.meds-view { padding: 20px 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h1 { font-size: 26px; font-weight: 700; color: var(--color-primary); }
.add-btn {
  min-height: 52px; padding: 0 20px;
  background: var(--color-primary); color: #fff;
  border: none; border-radius: var(--radius-md);
  font-size: 18px; cursor: pointer;
}
.med-list { list-style: none; }
.med-item {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border-radius: var(--radius-md);
  padding: 16px 20px; margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-left: 4px solid var(--color-primary);
}
.med-title { font-size: 20px; font-weight: 600; }
.med-sub { font-size: 15px; color: var(--color-muted); margin-top: 4px; }
.med-actions { display: flex; gap: 8px; }
.icon-btn {
  min-height: 52px; min-width: 52px;
  border: none; background: none;
  font-size: 22px; cursor: pointer;
  border-radius: var(--radius-md);
}
.icon-btn:hover { background: #f5f5f5; }
.loading { text-align: center; padding: 40px; color: var(--color-muted); font-size: 18px; }
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: flex-end; z-index: 200;
}
.modal-form {
  background: #fff; border-radius: 20px 20px 0 0;
  padding: 24px; width: 100%;
  display: flex; flex-direction: column; gap: 14px;
}
.modal-form h2 { font-size: 22px; font-weight: 700; }
.modal-form label { display: flex; flex-direction: column; gap: 6px; font-size: 16px; }
.modal-form input {
  height: 52px; border: 1px solid #ddd;
  border-radius: var(--radius-md); padding: 0 14px; font-size: 18px;
}
.form-actions { display: flex; gap: 12px; }
.form-actions button {
  flex: 1; height: 52px; border: none;
  border-radius: var(--radius-md); font-size: 18px; cursor: pointer;
}
.form-actions button[type="submit"] { background: var(--color-primary); color: #fff; }
</style>
