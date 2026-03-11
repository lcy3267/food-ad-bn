<template>
  <div class="chat-screen">
    <!-- Header -->
    <div class="chat-header">
      <div class="ai-avatar">🍜</div>
      <div class="ai-info">
        <div class="ai-name">饮食助手小橙</div>
        <div class="ai-status">
          <span class="status-dot"></span>在线 · 随时为你服务
        </div>
      </div>
      <button class="header-btn" @click="goBack">⚙️</button>
    </div>

    <!-- Messages area -->
    <div class="messages-area" ref="messagesEl">
      <div class="time-divider">刚刚</div>

      <template v-for="(item, i) in displayItems" :key="i">
        <!-- Time divider -->
        <div v-if="item.type === 'divider'" class="time-divider">{{ item.text }}</div>

        <!-- AI bubble -->
        <div v-else-if="item.type === 'ai'" class="msg-row msg-enter-active">
          <div class="msg-avatar">🍜</div>
          <div class="bubble ai-bubble" v-html="stripMarkdownBold(item.text)"></div>
        </div>

        <!-- User bubble -->
        <div v-else-if="item.type === 'user'" class="msg-row user msg-enter-active">
          <div class="msg-avatar user-av">{{ userAvatar }}</div>
          <div class="bubble user-bubble">{{ item.text }}</div>
        </div>

        <!-- Typing indicator -->
        <div v-else-if="item.type === 'typing'" class="msg-row">
          <div class="msg-avatar">🍜</div>
          <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>

        <!-- Suggestions (e.g. 吃点其他的) -->
        <div v-else-if="item.type === 'suggestions'" class="suggestion-row msg-enter-active">
          <div v-for="sug in item.items" :key="sug" class="sug-chip"
            @click="onSuggestion(item, sug)">{{ sug }}</div>
        </div>
      </template>
    </div>

    <!-- Input area：与 AI 回复流程对接，请求中禁用，回复后重新聚焦 -->
    <div class="input-area">
      <div class="chat-input-wrap">
        <textarea class="chat-input" ref="inputEl"
          v-model="inputText"
          placeholder="问问小橙今天吃什么..."
          rows="1"
          :disabled="loading"
          @keydown.enter.exact.prevent="sendMessage"
          @input="autoResize"
        ></textarea>
      </div>
      <button class="send-btn" @click="sendMessage" :disabled="loading">➤</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { getMessages, postChat } from '../api/index.js'

const router = useRouter()
const userStore = useUserStore()
const messagesEl = ref(null)
const inputEl = ref(null)
const inputText = ref('')
const loading = ref(false)
const displayItems = ref([])
const initDone = ref(false)

const userAvatar = computed(() => {
  const age = userStore.age
  const g = userStore.gender
  if (g === '男') {
    if (age < 18) return '👦'
    if (age < 40) return '👨'
    if (age < 60) return '🧑'
    return '👴'
  } else if (g === '女') {
    if (age < 18) return '👧'
    if (age < 40) return '👩'
    if (age < 60) return '🧑'
    return '👵'
  }
  return '🧑'
})

function stripMarkdownBold(text) {
  if (!text || typeof text !== 'string') return ''
  return text.replace(/\*\*([^*]*)\*\*/g, '$1')
}

function addItem(item) {
  displayItems.value.push(item)
  scrollBottom()
}

function removeTyping() {
  const idx = displayItems.value.findLastIndex(i => i.type === 'typing')
  if (idx >= 0) displayItems.value.splice(idx, 1)
}

function scrollBottom() {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

function historyToItems(history) {
  return (history || []).map(m => ({
    type: m.role === 'assistant' ? 'ai' : 'user',
    text: m.content
  }))
}

async function loadChat() {
  if (!userStore.id) return
  const history = await getMessages(userStore.id)
  displayItems.value = [
    { type: 'divider', text: '刚刚' },
    ...historyToItems(history)
  ]
  scrollBottom()

  if (history.length === 0) {
    addItem({ type: 'typing' })
    try {
      const { reply } = await postChat({ userId: userStore.id, action: 'welcome' })
      removeTyping()
      addItem({ type: 'ai', text: reply })
    } catch {
      removeTyping()
      addItem({ type: 'ai', text: '欢迎使用小橙饮食助手～' })
    }
  } else {
    addItem({ type: 'typing' })
    try {
      const { reply } = await postChat({ userId: userStore.id, action: 'mealRecommend' })
      removeTyping()
      addItem({ type: 'ai', text: reply })
      addItem({ type: 'suggestions', items: ['吃点其他的'] })
    } catch {
      removeTyping()
      addItem({ type: 'ai', text: '来点当季时令菜吧～' })
      addItem({ type: 'suggestions', items: ['吃点其他的'] })
    }
  }
  initDone.value = true
}

async function requestOtherMeal() {
  const sugIdx = displayItems.value.findLastIndex(i => i.type === 'suggestions')
  if (sugIdx >= 0) displayItems.value.splice(sugIdx, 1)
  addItem({ type: 'typing' })
  try {
    const { reply } = await postChat({ userId: userStore.id, action: 'mealRecommend' })
    removeTyping()
    addItem({ type: 'ai', text: reply })
    addItem({ type: 'suggestions', items: ['吃点其他的'] })
  } catch {
    removeTyping()
    addItem({ type: 'ai', text: '来点当季时令菜吧～' })
    addItem({ type: 'suggestions', items: ['吃点其他的'] })
  }
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value) return
  inputText.value = ''
  if (inputEl.value) inputEl.value.style.height = ''

  const sugIdx = displayItems.value.findLastIndex(i => i.type === 'suggestions')
  if (sugIdx >= 0) displayItems.value.splice(sugIdx, 1)

  addItem({ type: 'user', text })
  loading.value = true
  addItem({ type: 'typing' })

  try {
    const res = await postChat({ userId: userStore.id, message: text })
    removeTyping()
    addItem({ type: 'ai', text: res.reply })
    if (res.showOtherButton) addItem({ type: 'suggestions', items: ['吃点其他的'] })
  } catch {
    removeTyping()
    addItem({ type: 'ai', text: '哎呀，小橙的网络有点小问题，稍后再试试吧～ 🙏' })
  } finally {
    loading.value = false
  }
  nextTick(() => inputEl.value?.focus())
}

function onSuggestion(sugItem, sug) {
  const idx = displayItems.value.indexOf(sugItem)
  if (idx >= 0) displayItems.value.splice(idx, 1)
  if (sug === '吃点其他的') requestOtherMeal()
}

function autoResize() {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 80) + 'px'
}

function goBack() {
  userStore.setFromChat()
  router.push('/')
}

watch(() => userStore.loaded, (v) => {
  if (v && !initDone.value) loadChat()
}, { immediate: true })

onMounted(() => scrollBottom())
</script>

<style scoped>
.chat-screen {
  position: absolute;
  inset: 0;
  background: #F7F3EF;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.chat-header {
  background: white;
  padding: 24px 24px 16px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  flex-shrink: 0;
}
.ai-avatar {
  width: 46px; height: 46px;
  background: linear-gradient(135deg, #FF6B35, #FFB347);
  border-radius: 15px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; flex-shrink: 0;
}
.ai-info { flex: 1; }
.ai-name { font-size: 16px; font-weight: 700; color: var(--brown); }
.ai-status {
  font-size: 12px; color: var(--green);
  display: flex; align-items: center; gap: 5px; margin-top: 2px;
}
.status-dot {
  width: 6px; height: 6px; background: var(--green);
  border-radius: 50%; animation: pulse 2s infinite;
}
@keyframes pulse {
  0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.75)}
}
.header-btn {
  width: 36px; height: 36px; background: var(--cream);
  border-radius: 10px; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; transition: background 0.2s;
}
.header-btn:hover { background: rgba(255,107,53,0.1); }

/* Messages */
.messages-area {
  flex: 1; overflow-y: auto; padding: 20px 24px;
  display: flex; flex-direction: column; gap: 12px;
  scrollbar-width: none;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}
.messages-area::-webkit-scrollbar { display: none; }

.msg-row {
  display: flex; gap: 8px; align-items: flex-end;
}
.msg-row.user { flex-direction: row-reverse; }

.msg-avatar {
  width: 32px; height: 32px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
  background: linear-gradient(135deg, #FF6B35, #FFB347);
}
.msg-avatar.user-av { background: linear-gradient(135deg, #667eea, #764ba2); }

.bubble {
  max-width: 72%; padding: 12px 16px; border-radius: 18px;
  font-size: 14px; line-height: 1.6; color: var(--brown);
}
.bubble.ai-bubble {
  background: white; border-bottom-left-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
}
.bubble.user-bubble {
  background: linear-gradient(135deg, #FF6B35, #FF8C42);
  color: white; border-bottom-right-radius: 4px;
  box-shadow: 0 4px 14px rgba(255,107,53,0.35);
}

.typing-indicator {
  display: flex; gap: 4px; padding: 14px 16px;
  background: white; border-radius: 18px; border-bottom-left-radius: 4px;
  width: fit-content; box-shadow: 0 2px 10px rgba(0,0,0,0.06);
}
.typing-dot {
  width: 7px; height: 7px; background: rgba(255,107,53,0.4);
  border-radius: 50%; animation: typingBounce 1.2s infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingBounce {
  0%,60%,100% { transform:translateY(0); background:rgba(255,107,53,0.4); }
  30%          { transform:translateY(-6px); background:var(--orange); }
}

.time-divider {
  text-align: center; font-size: 11px;
  color: rgba(61,31,0,0.3); font-weight: 500; padding: 4px 0;
}

.suggestion-row {
  display: flex; gap: 8px; flex-wrap: wrap; padding: 4px 0;
}
.sug-chip {
  padding: 8px 14px; border-radius: 50px;
  background: white; border: 1.5px solid rgba(255,107,53,0.25);
  font-size: 12px; color: var(--orange); cursor: pointer;
  font-family: 'Noto Sans SC', sans-serif; font-weight: 500;
  transition: all 0.2s;
}
.sug-chip:hover { background: rgba(255,107,53,0.08); border-color: var(--orange); transform: scale(1.03); }

/* Cards */
.card-list {
  display: flex; flex-direction: column; gap: 8px;
  max-width: 86%;
}

/* Card collapse animation */
.card-collapse-leave-active {
  overflow: hidden;
  transition: max-height 0.25s ease, opacity 0.25s ease, transform 0.25s ease;
}
.card-collapse-leave-from {
  max-height: 600px;
  opacity: 1;
  transform: translateY(0);
}
.card-collapse-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-8px);
}

/* Confirmed pill */
.confirmed-pill {
  display: inline-flex; align-items: center; gap: 6px;
  background: white; border-radius: 50px;
  padding: 7px 14px;
  font-size: 12px; font-weight: 600; color: var(--brown);
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  max-width: 86%;
}
.pill-icon {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; flex-shrink: 0;
}
.food-pill .pill-icon { background: linear-gradient(135deg,#FF6B35,#FFB347); }
.exercise-pill .pill-icon { background: linear-gradient(135deg,#52C07A,#34A85A); }

/* Note bubble */
.note-bubble {
  background: #FFFBF0;
  border-left: 3px solid var(--peach);
  border-radius: 0 12px 12px 0;
  padding: 10px 13px;
  font-size: 13px; color: var(--soft-brown); line-height: 1.6;
  max-width: 86%;
}
.note-bubble :deep(strong) { color: var(--orange); }

/* Input area */
.input-area {
  background: white; padding: 12px 24px 24px;
  border-top: 1px solid rgba(0,0,0,0.04);
  display: flex; gap: 10px; align-items: flex-end; flex-shrink: 0;
}
.chat-input-wrap {
  flex: 1; background: #F7F3EF; border-radius: 22px; padding: 10px 16px;
  max-width: calc(900px - 60px);
  margin: 0 auto;
  width: 100%;
}
.chat-input {
  width: 100%; background: transparent; border: none; outline: none;
  font-size: 15px; color: var(--brown);
  font-family: 'Noto Sans SC', sans-serif; resize: none;
  max-height: 80px; line-height: 1.5;
}
.chat-input::placeholder { color: rgba(61,31,0,0.3); }
.chat-input:disabled { opacity: 0.7; cursor: not-allowed; }
.send-btn {
  width: 44px; height: 44px; border-radius: 14px;
  background: linear-gradient(135deg, #FF6B35, #FF8C42);
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: white;
  box-shadow: 0 4px 14px rgba(255,107,53,0.4);
  transition: all 0.2s ease; flex-shrink: 0;
}
.send-btn:hover { transform: scale(1.08); }
.send-btn:active { transform: scale(0.95); }
.send-btn:disabled { opacity: 0.6; transform: none; cursor: not-allowed; }

/* Enter animation */
.msg-enter-active {
  animation: msgIn 0.35s cubic-bezier(0.4,0,0.2,1) both;
}
@keyframes msgIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
