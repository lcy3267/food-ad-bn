<template>
  <div class="phone">
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
.phone {
  width: 390px;
  height: 844px;
  background: #FFFDF9;
  border-radius: 48px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.2), inset 0 0 0 2px rgba(255,255,255,0.8);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  transform: scale(0.82);
  transform-origin: center center;
  margin: calc((844px * (0.82 - 1)) / 2) 0;
}
</style>
