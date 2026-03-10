<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <transition name="slide" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './stores/user.js'

const userStore = useUserStore()
onMounted(() => userStore.init())
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  background: #FFFDF9;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
