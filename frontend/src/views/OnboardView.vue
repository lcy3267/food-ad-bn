<template>
  <div class="onboard-screen">
    <!-- Scrollable content -->
    <div class="onboard-scroll" ref="scrollEl">
      <!-- Header -->
      <div class="onboard-header">
        <div class="app-logo">🍜</div>
        <div class="app-title">AI 饮食伴侣</div>
        <div class="app-subtitle">让每一餐都充满幸福感 ✨</div>
      </div>

      <!-- Progress bar -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
      </div>

      <div class="form-container">

        <!-- 年龄 -->
        <div class="step-card" style="animation-delay:0.05s">
          <div class="step-label">基本信息</div>
          <div class="step-question">你今年多大啦？🎂</div>
          <div class="slider-row">
            <input type="range" :min="16" :max="80" v-model.number="form.age"
              @input="onSlider" :style="sliderStyle(form.age, 16, 80)" />
            <div class="slider-val">{{ form.age }}岁</div>
          </div>
        </div>

        <!-- 性别 -->
        <div class="step-card" style="animation-delay:0.1s">
          <div class="step-label">性别</div>
          <div class="step-question">你是哪位小可爱？👀</div>
          <div class="gender-row">
            <div class="gender-btn" :class="{ selected: form.gender === '男' }" @click="form.gender = '男'">
              <span class="icon">👦</span><span class="label">男生</span>
            </div>
            <div class="gender-btn" :class="{ selected: form.gender === '女' }" @click="form.gender = '女'">
              <span class="icon">👧</span><span class="label">女生</span>
            </div>
            <div class="gender-btn" :class="{ selected: form.gender === '其他' }" @click="form.gender = '其他'">
              <span class="icon">🌈</span><span class="label">其他</span>
            </div>
          </div>
        </div>

        <!-- 身高体重 -->
        <div class="step-card" style="animation-delay:0.15s">
          <div class="step-label">身体数据</div>
          <div class="step-question">身高体重各是多少呢？📏</div>
          <div class="sub-label">身高</div>
          <div class="slider-row">
            <input type="range" :min="140" :max="210" v-model.number="form.height"
              @input="onSlider" :style="sliderStyle(form.height, 140, 210)" />
            <div class="slider-val">{{ form.height }}cm</div>
          </div>
          <div class="sub-label" style="margin-top:14px">体重</div>
          <div class="slider-row">
            <input type="range" :min="35" :max="150" v-model.number="form.weight"
              @input="onSlider" :style="sliderStyle(form.weight, 35, 150)" />
            <div class="slider-val">{{ form.weight }}kg</div>
          </div>
        </div>

        <!-- 地区 -->
        <div class="step-card" style="animation-delay:0.2s">
          <div class="step-label">所在地区</div>
          <div class="step-question">你在哪座城市生活？🏙️</div>
          <input class="region-input" type="text" v-model="form.region"
            placeholder="例如：上海、北京、成都..." maxlength="20" />
          <div class="chips" style="margin-top:10px">
            <div v-for="c in cities" :key="c" class="chip"
              :class="{ selected: form.region === c }"
              @click="form.region = c">{{ c }}</div>
          </div>
        </div>

        <!-- 饮食习惯 -->
        <div class="step-card" style="animation-delay:0.25s">
          <div class="step-label">饮食习惯</div>
          <div class="step-question">平时怎么解决一日三餐？🍳</div>
          <div class="chips">
            <div v-for="h in habitOptions" :key="h" class="chip"
              :class="{ selected: form.habits.includes(h) }"
              @click="toggleHabit(h)">{{ h }}</div>
          </div>
        </div>

        <!-- 饮食目的 -->
        <div class="step-card" style="animation-delay:0.3s">
          <div class="step-label">饮食目的</div>
          <div class="step-question">你最想通过饮食实现什么？🎯</div>
          <div class="multi-hint">可多选</div>
          <div class="chips">
            <div v-for="g in goalOptions" :key="g" class="chip"
              :class="{ selected: form.goals.includes(g) }"
              @click="toggleGoal(g)">{{ g }}</div>
          </div>
        </div>

      </div>
    </div>

    <!-- Floating CTA -->
    <div class="ob-float-bar">
      <button class="btn-start" @click="startApp" :disabled="saving">
        {{ saving ? '保存中...' : '开始我的饮食之旅 🚀' }}
      </button>
    </div>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'

const router = useRouter()
const userStore = useUserStore()
const scrollEl = ref(null)
const toast = ref('')
const saving = ref(false)
const checking = ref(true)

const cities = ['北京','上海','广州','深圳','成都','杭州','武汉','西安','重庆']
const habitOptions = ['🏠 自己在家做','🍽️ 餐厅堂食','📦 外卖']
const goalOptions  = ['🔥 减脂塑形','🥗 健康饮食','🩺 控糖管理','🌟 美食推荐']

const form = ref({
  age: 25, gender: '', height: 170, weight: 65,
  region: '', habits: [], goals: []
})

// Sync from store after it loads
watch(() => userStore.loaded, (v) => {
  if (!v) return
  checking.value = false
  
  // 如果用户信息已完整且不是从聊天页过来，自动跳转到聊天界面
  if (userStore.isProfileComplete && !userStore.fromChat) {
    router.push('/chat')
    return
  }
  
  form.value = {
    age: userStore.age,
    gender: userStore.gender,
    height: userStore.height,
    weight: userStore.weight,
    region: userStore.region,
    habits: [...userStore.habits],
    goals: [...userStore.goals]
  }
})

const progressPct = computed(() => {
  let s = 25
  if (form.value.gender) s += 15
  if (form.value.region) s += 20
  if (form.value.habits.length) s += 20
  if (form.value.goals.length)  s += 20
  return Math.min(s, 100)
})

function sliderStyle(val, min, max) {
  const pct = ((val - min) / (max - min) * 100).toFixed(1)
  return `--pct: ${pct}%`
}

function onSlider() { /* reactive via v-model */ }

function toggleHabit(h) {
  // single select
  form.value.habits = form.value.habits.includes(h) ? [] : [h]
}
function toggleGoal(g) {
  const idx = form.value.goals.indexOf(g)
  if (idx >= 0) form.value.goals.splice(idx, 1)
  else form.value.goals.push(g)
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => toast.value = '', 2200)
}

async function startApp() {
  if (!form.value.gender)        { showToast('请选择你的性别 😊');     return }
  if (!form.value.region)        { showToast('请填写你所在的城市 🏙️'); return }
  if (!form.value.habits.length) { showToast('请选择你的饮食习惯 🍳'); return }
  if (!form.value.goals.length)  { showToast('请选择你的饮食目的 🎯'); return }

  saving.value = true
  try {
    await userStore.save({ ...form.value })
    router.push('/chat')
  } catch (e) {
    showToast('保存失败，请重试')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.onboard-screen {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #FFF3E0 0%, #FFF8F0 50%, #FFF0E6 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.onboard-scroll {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
}
.onboard-scroll::-webkit-scrollbar { display: none; }

.onboard-header {
  padding: 44px 28px 24px;
  text-align: center;
}

.app-logo {
  width: 80px; height: 80px;
  background: linear-gradient(135deg, #FF6B35, #FFB347);
  border-radius: 24px;
  margin: 0 auto 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 40px;
  box-shadow: 0 12px 30px rgba(255,107,53,0.4);
  animation: logoFloat 3s ease-in-out infinite;
}
@keyframes logoFloat {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}

.app-title {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 28px; color: var(--brown); margin-bottom: 6px;
}
.app-subtitle { font-size: 13px; color: var(--soft-brown); opacity: 0.8; }

.progress-bar {
  margin: 8px 28px 0;
  height: 4px; background: rgba(255,107,53,0.15);
  border-radius: 2px; overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B35, #FFB347);
  border-radius: 2px;
  transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
}

.form-container { 
  padding: 20px 28px 110px;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.step-card {
  background: white; border-radius: var(--radius);
  padding: 24px; margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(255,107,53,0.08);
  animation: cardIn 0.4s ease both;
  opacity: 0; transform: translateY(20px);
}
@keyframes cardIn { to { opacity: 1; transform: translateY(0); } }

.step-label {
  font-size: 11px; font-weight: 700; color: var(--orange);
  text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;
}
.step-question {
  font-size: 17px; font-weight: 500; color: var(--brown);
  margin-bottom: 16px; line-height: 1.4;
}
.sub-label { font-size: 12px; color: var(--soft-brown); margin-bottom: 8px; font-weight: 500; }

/* Sliders */
.slider-row { display: flex; align-items: center; gap: 12px; }
.slider-val { font-size: 22px; font-weight: 700; color: var(--orange); min-width: 60px; text-align: right; }

input[type="range"] {
  -webkit-appearance: none; flex: 1; height: 6px;
  background: linear-gradient(90deg, var(--orange) var(--pct, 30%), rgba(255,107,53,0.15) var(--pct, 30%));
  border-radius: 3px; outline: none; cursor: pointer;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px; height: 22px;
  background: white; border: 3px solid var(--orange);
  border-radius: 50%; cursor: pointer;
  box-shadow: 0 2px 8px rgba(255,107,53,0.3);
}

/* Chips */
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  padding: 8px 16px; border-radius: 50px;
  border: 2px solid rgba(255,107,53,0.2);
  background: white; font-size: 13px; color: var(--soft-brown);
  cursor: pointer; transition: all 0.2s ease;
  font-family: 'Noto Sans SC', sans-serif;
  user-select: none;
}
.chip:hover { border-color: var(--orange); color: var(--orange); }
.chip.selected {
  background: linear-gradient(135deg, #FF6B35, #FFB347);
  color: white; border-color: transparent;
  box-shadow: 0 4px 12px rgba(255,107,53,0.35);
  transform: scale(1.03);
}

/* Gender */
.gender-row { display: flex; gap: 12px; }
.gender-btn {
  flex: 1; padding: 14px 8px;
  border-radius: 14px; border: 2px solid rgba(255,107,53,0.2);
  background: white; text-align: center; cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}
.gender-btn .icon { font-size: 28px; display: block; margin-bottom: 4px; }
.gender-btn .label { font-size: 13px; color: var(--soft-brown); }
.gender-btn.selected {
  border-color: var(--orange);
  background: linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,179,71,0.08));
  box-shadow: 0 4px 16px rgba(255,107,53,0.2);
}
.gender-btn.selected .label { color: var(--orange); font-weight: 600; }

/* Region */
.region-input {
  width: 100%; padding: 12px 16px; border-radius: 12px;
  border: 2px solid rgba(255,107,53,0.2); background: white;
  font-size: 15px; color: var(--brown); outline: none;
  font-family: 'Noto Sans SC', sans-serif; transition: border-color 0.2s;
}
.region-input:focus { border-color: var(--orange); }

.multi-hint { font-size: 11px; color: var(--soft-brown); opacity: 0.6; margin-bottom: 10px; }

/* Floating button */
.ob-float-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  z-index: 20;
  padding: 12px 24px 28px;
  background: linear-gradient(to top, #FFF8F0 60%, transparent);
  pointer-events: none;
}
.btn-start {
  width: 100%; max-width: 600px; margin: 0 auto;
  display: block;
  padding: 18px; border-radius: 18px;
  background: linear-gradient(135deg, #FF6B35, #FF8C42);
  color: white; font-size: 17px; font-weight: 700;
  border: none; cursor: pointer;
  box-shadow: 0 8px 24px rgba(255,107,53,0.45);
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', sans-serif;
  letter-spacing: 1px;
  pointer-events: all;
}
.btn-start:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(255,107,53,0.5); }
.btn-start:active { transform: scale(0.98); }
.btn-start:disabled { opacity: 0.7; transform: none; cursor: not-allowed; }

/* Toast */
.toast {
  position: absolute;
  bottom: 108px; left: 50%;
  transform: translateX(-50%);
  background: rgba(61,31,0,0.88);
  color: white; padding: 10px 22px;
  border-radius: 50px; font-size: 13px;
  white-space: nowrap; z-index: 999;
  backdrop-filter: blur(8px);
}
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; }
</style>
