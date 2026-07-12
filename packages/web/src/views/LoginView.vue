<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo">💊</div>
      <h1 class="title">服药提醒</h1>
      <p class="subtitle">健康管理，从按时服药开始</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field">
          <label>邮箱</label>
          <input
            v-model="email"
            type="email"
            placeholder="请输入邮箱"
            autocomplete="email"
            required
          />
        </div>

        <div class="field">
          <label>密码</label>
          <input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router   = useRouter()
const auth     = useAuthStore()

const email    = ref('')
const password = ref('')
const loading  = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  loading.value  = true
  try {
    await auth.login(email.value, password.value)
    router.push('/today')
  } catch (e: any) {
    errorMsg.value = e?.message ?? '登录失败，请检查邮箱和密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff8f0 0%, #fff0f6 100%);
  padding: 24px;
}

.login-card {
  background: #fff;
  border-radius: 24px;
  padding: 40px 32px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(255, 140, 66, 0.15);
  text-align: center;
}

.logo {
  font-size: 56px;
  margin-bottom: 12px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #ff8c42;
  margin-bottom: 6px;
}

.subtitle {
  font-size: 15px;
  color: #999;
  margin-bottom: 32px;
}

.login-form {
  text-align: left;
}

.field {
  margin-bottom: 20px;
}

.field label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
}

.field input {
  width: 100%;
  height: 52px;
  border: 1.5px solid #ffe0cc;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 16px;
  color: #333;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.field input:focus {
  border-color: #ff8c42;
}

.error {
  color: #ef4444;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
}

.login-btn {
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, #ff8c42, #ff6b9d);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 8px;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
