function safeJsonArray(str) {
  if (!str) return []
  try {
    const v = JSON.parse(str)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export function getMealSlot(now = new Date()) {
  const hour = now.getHours()
  if (hour < 10) return '早餐'
  if (hour < 14) return '午餐'
  return '晚餐'
}

/**
 * 非首次进入或「吃点其他的」：按当前时间段推荐一种食物 + 食用小提示，约 80 字。
 */
export function buildMealRecommendPrompt(user, mealSlot) {
  const habits = Array.isArray(user?.habits) ? user.habits : safeJsonArray(user?.habits)
  const goals = Array.isArray(user?.goals) ? user.goals : safeJsonArray(user?.goals)

  const system = `你是饮食助手"小橙"。只推荐一种具体食物（或一份套餐），并给一句食用小提示。控制在80字以内，口语化，用emoji。不要使用 **、## 等 markdown。必须结合用户所在地区和饮食习惯。`

  const userBlock = `当前是${mealSlot}时间。用户：${user?.region ?? ''}，饮食习惯${habits.join('、')}，饮食目的${goals.join('、')}。请只推荐一种食物并附一句小提示。`

  return {
    system,
    userContent: userBlock
  }
}
