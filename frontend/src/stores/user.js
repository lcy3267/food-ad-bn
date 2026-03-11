import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createUser, getUser, updateUser } from '../api/index.js'

const STORAGE_KEY = 'diet_companion_uid'
const USER_DATA_KEY = 'diet_companion_user_data'
const FROM_CHAT_KEY = 'diet_companion_from_chat'

export const useUserStore = defineStore('user', () => {
  const id = ref(null)
  const age = ref(25)
  const gender = ref('')
  const height = ref(170)
  const weight = ref(65)
  const region = ref('')
  const habits = ref([])
  const goals = ref([])
  const loaded = ref(false)
  const fromChat = ref(false)

  const bmi = computed(() => {
    const h = height.value / 100
    return (weight.value / (h * h))
  })

  const bodyFat = computed(() => {
    const b = bmi.value
    const isMale = gender.value === '男'
    return (1.2 * b + 0.23 * age.value - (isMale ? 10.8 : 0) - 5.4).toFixed(1)
  })

  async function init() {
    // 仅清除上次遗留的标记，不把 fromChat 设为 true，避免新开页/刷新时误判
    // fromChat 只在本会话内通过 setFromChat() 设为 true（用户点击设置从聊天页过来）
    if (localStorage.getItem(FROM_CHAT_KEY) === 'true') {
      localStorage.removeItem(FROM_CHAT_KEY)
    }

    let uid = localStorage.getItem(STORAGE_KEY)
    if (uid) {
      try {
        const user = await getUser(uid)
        id.value = user.id
        age.value = user.age
        gender.value = user.gender
        height.value = user.height
        weight.value = user.weight
        region.value = user.region
        habits.value = user.habits || []
        goals.value = user.goals || []
        loaded.value = true
        return
      } catch { /* user not found, create new */ }
    }
    const user = await createUser()
    localStorage.setItem(STORAGE_KEY, user.id)
    id.value = user.id
    loaded.value = true
  }

  function setFromChat() {
    fromChat.value = true
    localStorage.setItem(FROM_CHAT_KEY, 'true')
  }

  async function save(fields = {}) {
    if (!id.value) return
    const data = {}
    if (fields.age !== undefined)    { age.value = fields.age;       data.age = fields.age }
    if (fields.gender !== undefined) { gender.value = fields.gender; data.gender = fields.gender }
    if (fields.height !== undefined) { height.value = fields.height; data.height = fields.height }
    if (fields.weight !== undefined) { weight.value = fields.weight; data.weight = fields.weight }
    if (fields.region !== undefined) { region.value = fields.region; data.region = fields.region }
    if (fields.habits !== undefined) { habits.value = fields.habits; data.habits = fields.habits }
    if (fields.goals !== undefined)  { goals.value = fields.goals;   data.goals = fields.goals }
    await updateUser(id.value, data)
  }

  const isProfileComplete = computed(() =>
    !!gender.value && !!region.value && habits.value.length > 0 && goals.value.length > 0
  )

  return { id, age, gender, height, weight, region, habits, goals, loaded, fromChat, bmi, bodyFat, isProfileComplete, init, save, setFromChat }
})
