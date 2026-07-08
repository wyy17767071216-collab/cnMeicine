<template>
  <nav class="bottom-nav" aria-label="主导航">
    <RouterLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :class="{ active: route.path === item.to }"
      data-testid="nav-item"
      :aria-label="item.label"
    >
      <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
      <span class="nav-label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route   = useRoute()
const auth    = useAuthStore()

const navItems = computed(() => [
  { to: '/today',    icon: '💊', label: '今日' },
  { to: '/meds',     icon: '🏥', label: '药品' },
  { to: '/schedule', icon: '⏰', label: '计划' },
  { to: '/history',  icon: '📋', label: '历史' },
  { to: '/stock',    icon: '📦', label: '库存' },
  { to: '/profile',  icon: '👤', label: '我的' },
])
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #fff;
  border-top: 1px solid #FFE0CC;
  box-shadow: 0 -2px 8px rgba(255, 140, 66, 0.15);
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 52px;          /* elderly-friendly touch target */
  padding: 6px 0;
  text-decoration: none;
  color: #999;
  font-size: 10px;
  transition: color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.nav-item.active {
  color: #FF8C42;
}

.nav-icon {
  font-size: 22px;
  line-height: 1;
  margin-bottom: 2px;
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
}
</style>
