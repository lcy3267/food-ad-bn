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
          <div class="bubble ai-bubble" v-html="item.text"></div>
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

        <!-- Card list (food or exercise) -->
        <transition
          name="card-collapse"
          v-else-if="item.type === 'cards' && !item.collapsed"
        >
          <div class="card-list msg-enter-active">
            <RecCard
              v-for="(card, ci) in item.cards"
              :key="ci"
              :card="card"
              :confirmed="item.confirmedIdx === ci"
              :faded="item.confirmedIdx !== null && item.confirmedIdx !== ci"
              @confirm="onConfirmCard(item, ci)"
            />
          </div>
        </transition>

        <!-- Confirmed pill -->
        <div v-else-if="item.type === 'pill'" class="msg-enter-active"
          :class="`confirmed-pill ${item.kind}-pill`">
          <div class="pill-icon">{{ item.icon }}</div>
          <span>已选：<strong>{{ item.name }}</strong></span>
        </div>

        <!-- Note bubble -->
        <div v-else-if="item.type === 'note'" class="note-bubble msg-enter-active"
          v-html="item.html"></div>

        <!-- Suggestions -->
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
import { sendChat, extractStructured, getTips, saveSelection } from '../api/index.js'
import RecCard from '../components/RecCard.vue'

const router = useRouter()
const userStore = useUserStore()
const messagesEl = ref(null)
const inputEl = ref(null)
const inputText = ref('')
const loading = ref(false)
const displayItems = ref([])

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

function isLateNight() { return new Date().getHours() >= 19 }

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

async function initChat() {
  const hour = new Date().getHours()
  const late = isLateNight()
  const meal = hour < 14 ? '午餐' : '晚餐'
  const bf = userStore.bodyFat

  // Message 1
  await delay(400)
  addItem({ type: 'ai', text: '嗨～你好！我是你的专属饮食助手小橙 🍊' })

  await delay(600)
  addItem({ type: 'typing' })

  await delay(1200)
  removeTyping()
  if (late) {
    addItem({ type: 'ai', text: `🌙 现在都 ${hour} 点啦，肠胃已经快要下班了哦～` })
  } else {
    addItem({ type: 'ai', text: `${hour < 14 ? '🌞' : '🌆'} 现在是 ${hour} 点，你是不是在纠结${meal}吃什么？` })
  }

  await delay(500)
  addItem({ type: 'typing' })

  await delay(1800)
  removeTyping()
  if (late) {
    addItem({ type: 'ai', text: '晚上这个点再吃东西，热量可不好消耗哦！嘴馋的话喝杯温水或来片黄瓜解解馋吧 🥒✨' })
  } else {
    addItem({ type: 'ai', text: `我已经了解了你的信息：${userStore.age}岁${userStore.gender}生、身处${userStore.region}，目标是「${userStore.goals.join(' + ')}」～让我来帮你规划今天的${meal}！` })
  }

  await delay(500)
  addItem({ type: 'typing' })

  await delay(1800)
  removeTyping()

  if (late) {
    const bfNum = parseFloat(bf)
    const isMale = userStore.gender === '男'
    const bfHigh = isMale ? bfNum > 20 : bfNum > 28
    if (bfHigh) {
      addItem({ type: 'ai', text: `顺便说一下，根据你的身高体重估算，体脂率大约是 ${bf}%，稍微偏高一丢丢 😅 要不要小橙帮你推荐几个适合你的运动方式？` })
    } else {
      addItem({ type: 'ai', text: `根据你的身高体重估算，体脂率大约是 ${bf}%，状态不错哦 💪 想趁晚上动一动吗？要不要推荐几个适合的运动？` })
    }
    addItem({ type: 'suggestions', items: ['推荐运动方式 🏃', '明天的饮食计划', '我就随便看看 👀'] })
  } else {
    addItem({ type: 'suggestions', items: [`帮我推荐${meal}`, '查看饮食注意事项', '今天的营养搭配'] })
  }
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value) return
  inputText.value = ''
  if (inputEl.value) inputEl.value.style.height = ''
  await sendUserMsg(text)
}

async function sendUserMsg(text) {
  // Remove any existing suggestion row
  const sugIdx = displayItems.value.findLastIndex(i => i.type === 'suggestions')
  if (sugIdx >= 0) displayItems.value.splice(sugIdx, 1)

  addItem({ type: 'user', text })

  const hour = new Date().getHours()
  const late = isLateNight()
  const meal = hour < 14 ? '午餐' : '晚餐'

  const wantsExercise = ['运动','健身','锻炼','跑步','减肥','燃脂','瑜伽','步行','有氧'].some(k => text.includes(k))
  const wantsFoodLate = !wantsExercise && late &&
    ['吃','推荐','晚餐','饿','夜宵','宵夜'].some(k => text.includes(k))

  if (wantsFoodLate) {
    const refusals = [
      '哎呀，都这么晚了还想着吃？肠胃要罢工啦 😂 喝杯温水，撑过去就胜利了！',
      '晚上吃东西热量存储效率超高哦，脂肪细胞正在摩拳擦掌等你呢 😅 忍住忍住～',
      '嘴馋的感觉我懂，但现在离睡觉没多久了！来片黄瓜或喝杯白开水，一样满足 🥒',
    ]
    await delay(200)
    addItem({ type: 'typing' })
    await delay(1000)
    removeTyping()
    addItem({ type: 'ai', text: refusals[Math.floor(Math.random() * refusals.length)] })
    await delay(400)
    addItem({ type: 'suggestions', items: ['推荐运动方式 🏃', '明天早餐计划 🌅', '喝什么比较好？'] })
    nextTick(() => inputEl.value?.focus())
    return
  }

  loading.value = true
  addItem({ type: 'typing' })

  try {
    const { reply } = await sendChat({
      userId: userStore.id,
      message: text
    })

    removeTyping()

    // 暂时取消卡片/结构化抽取，直接展示 AI 文本回复
    addItem({ type: 'ai', text: reply })

    // Suggestions
    let sugs
    if (text.includes('运动')) {
      sugs = ['运动计划详情 📋', '运动后吃什么？', '我有点懒怎么办 😂']
    } else if (late) {
      sugs = ['推荐运动方式 🏃', '明天早餐计划 🌅', '今天喝什么好？']
    } else if (text.includes('推荐') || text.includes('吃什么')) {
      sugs = ['详细营养分析', '换一个推荐', '购物清单']
    } else if (text.includes('注意') || text.includes('建议')) {
      sugs = [`今天的${meal}推荐`, '一周饮食计划', '食材搭配']
    } else {
      sugs = late ? ['推荐运动方式 🏃', '明天饮食计划'] : [`${meal}推荐`, '营养搭配建议']
    }
    await delay(600)
    addItem({ type: 'suggestions', items: sugs })

    // 回复展示完后聚焦输入框，方便继续输入
    nextTick(() => inputEl.value?.focus())
  } catch (e) {
    removeTyping()
    addItem({ type: 'ai', text: '哎呀，小橙的网络有点小问题，稍后再试试吧～ 🙏' })
    nextTick(() => inputEl.value?.focus())
  } finally {
    loading.value = false
  }
}

async function renderReply(rawReply, context) {
  if (context === 'plain') {
    addItem({ type: 'ai', text: rawReply })
    return
  }

  const isExercise = context === 'exercise'
  const extractPrompt = isExercise
    ? `请从以下运动建议文字中提取结构化数据，最多3项，严格只返回JSON不含其他文字：
{"intro":"一句开场白","items":[{"name":"运动名","icon":"emoji","duration":"时长","burn":"消耗热量","desc":"一句说明"}],"tip":"一句鼓励"}
原文：${rawReply}`
    : `请从以下餐食推荐文字中提取结构化数据，最多3项，严格只返回JSON不含其他文字：
{"intro":"一句开场白","items":[{"name":"食物名","icon":"emoji","calories":"热量","desc":"一句说明","tags":["标签"]}],"tip":"一句注意事项"}
原文：${rawReply}`

  addItem({ type: 'typing' })
  try {
    const { text } = await extractStructured(extractPrompt)
    const json = JSON.parse(text.replace(/```json|```/g, '').trim())
    const items = (json.items || []).slice(0, 3)
    removeTyping()

    if (json.intro) addItem({ type: 'ai', text: json.intro })

    if (items.length) {
      const cardItem = {
        type: 'cards',
        cards: items.map(i => ({ ...i, cardType: isExercise ? 'exercise' : 'food' })),
        confirmedIdx: null
      }
      await delay(300)
      addItem(cardItem)
    }
  } catch {
    removeTyping()
    addItem({ type: 'ai', text: rawReply })
  }
}

async function onConfirmCard(cardListItem, ci) {
  if (cardListItem.confirmedIdx !== null) return // already confirmed
  cardListItem.confirmedIdx = ci
  const card = cardListItem.cards[ci]
  const isExercise = card.cardType === 'exercise'

  // Save to DB
  if (userStore.id) {
    await saveSelection(userStore.id, {
      type: isExercise ? 'exercise' : 'food',
      name: card.name,
      icon: card.icon || '',
      calories: card.calories || '',
      duration: card.duration || '',
      burn: card.burn || '',
      chosenAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }).catch(() => {})
  }

  await delay(400)
  addItem({
    type: 'pill',
    kind: isExercise ? 'exercise' : 'food',
    icon: card.icon || (isExercise ? '🏃' : '🍽️'),
    name: card.name
  })

  await delay(800)
  await fetchTips(card, isExercise)

  // Collapse card list after we have shown follow-up content
  cardListItem.collapsed = true
}

async function fetchTips(card, isExercise) {
  const tipPrompt = isExercise
    ? `用户选择了「${card.name}」作为今天的运动，时长${card.duration || '未知'}。
${userStore.age}岁${userStore.gender}生，饮食目标：${userStore.goals.join('、')}。
请用温暖活泼的语气给出3条具体注意事项，每条一行，加相关emoji，总字数不超过120字。`
    : `用户选择了「${card.name}」（约${card.calories || '未知热量'}）作为今天的餐食。
${userStore.age}岁${userStore.gender}生，所在城市${userStore.region}，饮食目标：${userStore.goals.join('、')}。
请用温暖活泼的语气给出3条具体注意事项（如进食时机、搭配建议、禁忌），每条一行，加相关emoji，总字数不超过120字。`

  addItem({ type: 'typing' })
  try {
    const { text } = await getTips(tipPrompt)
    removeTyping()
    addItem({
      type: 'note',
      html: '<strong>小橙提醒你 💡</strong><br>' + text.replace(/\n/g, '<br>')
    })
  } catch {
    removeTyping()
  }
}

function onSuggestion(sugItem, sug) {
  const idx = displayItems.value.indexOf(sugItem)
  if (idx >= 0) displayItems.value.splice(idx, 1)
  sendUserMsg(sug)
}

function autoResize() {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 80) + 'px'
}

function goBack() {
  // 标记是从聊天页跳转过来的，避免在 OnboardView 自动跳回
  userStore.setFromChat()
  router.push('/')
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// Init when user store is ready
watch(() => userStore.loaded, async (v) => {
  if (v) await initChat()
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
