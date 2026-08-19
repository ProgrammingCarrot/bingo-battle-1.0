<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initAuth()
})
</script>

<template>
  <div class="app-layout">
    <router-view v-slot="{ Component }">
      <transition name="pixel-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Page Transition */
.pixel-fade-enter-active,
.pixel-fade-leave-active {
  transition: opacity 0.15s steps(3);
}

.pixel-fade-enter-from,
.pixel-fade-leave-to {
  opacity: 0;
}
</style>
