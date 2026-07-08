<template>
  <div id="app" :class="{ 'with-nav': showNav }">
    <RouterView />
    <BottomNav v-if="showNav" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const auth  = useAuthStore()

const showNav = computed(() =>
  !!auth.currentUser && route.path !== '/login'
)
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 18px;          /* elderly-friendly base */
  background: #FFF8F0;
  color: #333;
  -webkit-font-smoothing: antialiased;
}

#app {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100dvh;
}

#app.with-nav {
  padding-bottom: 56px;
}

:root {
  --color-primary:   #FF8C42;
  --color-secondary: #FF6B9D;
  --color-bg:        #FFF8F0;
  --color-surface:   #FFFFFF;
  --color-text:      #333333;
  --color-muted:     #999999;
  --radius-md:       12px;
  --radius-lg:       20px;
}
</style>
