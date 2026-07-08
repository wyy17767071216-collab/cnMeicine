<template>
  <div class="profile-container page-container">
    <h1 class="page-title">个人档案</h1>

    <div class="avatar-section">
      <img
        :src="user?.avatar_url || defaultAvatar"
        class="avatar"
        alt="头像"
      />
      <button class="avatar-upload-btn" @click="triggerAvatarUpload">
        更换头像
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        hidden
        @change="onAvatarChange"
      />
    </div>

    <div class="field-row">
      <span class="field-label">姓名</span>
      <span v-if="!editingName" class="field-value">{{ user?.display_name }}</span>
      <input v-else v-model="newName" class="field-input" type="text" />
      <button
        v-if="auth.isAdmin"
        data-testid="edit-name-btn"
        class="edit-btn"
        @click="toggleEditName"
      >
        {{ editingName ? '保存' : '编辑' }}
      </button>
    </div>

    <div class="field-row">
      <span class="field-label">邮箱</span>
      <span class="field-value email">{{ user?.email }}</span>
    </div>

    <div class="field-row">
      <span class="field-label">角色</span>
      <span class="field-value role-badge" :class="user?.role">
        {{ user?.role === 'admin' ? '管理员（子女）' : '查看者（老人）' }}
      </span>
    </div>

    <button class="logout-btn" @click="auth.logout()">退出登录</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase }     from '../lib/supabase'

const auth = useAuthStore()

const user        = computed(() => auth.currentUser)
const editingName = ref(false)
const newName     = ref(user.value?.display_name ?? '')
const fileInput   = ref<HTMLInputElement | null>(null)

const defaultAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4OCIgaGVpZ2h0PSI4OCIgdmlld0JveD0iMCAwIDg4IDg4Ij48Y2lyY2xlIGN4PSI0NCIgY3k9IjQ0IiByPSI0NCIgZmlsbD0iI2ZmZTBjYyIvPjxjaXJjbGUgY3g9IjQ0IiBjeT0iMzQiIHI9IjE2IiBmaWxsPSIjZmY4YzQyIi8+PHBhdGggZD0iTTEyIDc4YzAtMTggMTQtMzIgMzItMzJzMzIgMTQgMzIgMzIiIGZpbGw9IiNmZjhjNDIiLz48L3N2Zz4=`

function triggerAvatarUpload() {
  fileInput.value?.click()
}

async function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !user.value) return

  const path = `avatars/${user.value.id}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (!error) {
    const { data: url } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)
    await supabase
      .from('users')
      .update({ avatar_url: url.publicUrl })
      .eq('id', user.value.id)
    await auth.refreshUser()
  }
}

async function toggleEditName() {
  if (!editingName.value) {
    newName.value = user.value?.display_name ?? ''
    editingName.value = true
    return
  }
  if (!user.value || !newName.value.trim()) return
  await supabase
    .from('users')
    .update({ display_name: newName.value.trim() })
    .eq('id', user.value.id)
  await auth.refreshUser()
  editingName.value = false
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-title { font-size: 22px; font-weight: 700; margin-bottom: 24px; color: var(--color-primary); }

.avatar-section {
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 28px; gap: 12px;
}
.avatar {
  width: 88px; height: 88px; border-radius: 50%; object-fit: cover;
  border: 3px solid var(--color-primary);
}
.avatar-upload-btn {
  font-size: 15px; color: var(--color-primary); background: none;
  border: 1px solid var(--color-primary); border-radius: 8px;
  padding: 8px 16px; cursor: pointer; min-height: 40px;
}

.field-row {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 0; border-bottom: 1px solid #e2e8f0;
}
.field-label { font-size: 16px; color: #64748b; min-width: 48px; }
.field-value { font-size: 18px; font-weight: 600; color: #1e293b; flex: 1; }
.field-value.email { font-size: 16px; font-weight: 400; word-break: break-all; }
.field-input {
  font-size: 18px; flex: 1; padding: 6px 10px;
  border: 1px solid var(--color-primary); border-radius: 8px;
}
.edit-btn {
  font-size: 14px; color: var(--color-primary); background: none;
  border: 1px solid var(--color-primary); border-radius: 6px;
  padding: 6px 14px; min-height: 36px; cursor: pointer;
}

.role-badge { padding: 4px 12px; border-radius: 20px; font-size: 14px; }
.role-badge.admin  { background: #fef3c7; color: #92400e; }
.role-badge.viewer { background: #dbeafe; color: #1d4ed8; }

.logout-btn {
  width: 100%; margin-top: 32px; padding: 16px;
  font-size: 18px; font-weight: 600; color: #dc2626;
  background: #fef2f2; border: 1px solid #fecaca;
  border-radius: 12px; min-height: 52px; cursor: pointer;
}
</style>
