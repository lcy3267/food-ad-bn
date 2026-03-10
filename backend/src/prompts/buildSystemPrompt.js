function safeJsonArray(str) {
  if (!str) return []
  try {
    const v = JSON.parse(str)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function calcMeal(hour) {
  return hour < 14 ? '午餐' : '晚餐'
}

function isLateNight(hour) {
  return hour >= 19
}

export function buildSystemPrompt({ user, now = new Date(), tone = 'default' }) {
  const hour = now.getHours()
  const meal = calcMeal(hour)
  const late = isLateNight(hour)

  const habits = Array.isArray(user?.habits) ? user.habits : safeJsonArray(user?.habits)
  const goals = Array.isArray(user?.goals) ? user.goals : safeJsonArray(user?.goals)

  // Frontend previously computed BMI/bodyFat; backend doesn't have those formulas now.
  // Keep the prompt shape stable but omit derived metrics until/unless we add them server-side.
  const userBlock = `用户信息：
- ${user?.age ?? ''}岁 ${user?.gender ?? ''}生，${user?.height ?? ''}cm / ${user?.weight ?? ''}kg
- 所在城市：${user?.region ?? ''}
- 饮食习惯：${habits.join('、')}
- 饮食目标：${goals.join('、')}`

  const timeCtx = late
    ? `【重要】现在是晚上${hour}点，已过19:00。严禁推荐任何正餐或高热量食物。如果用户问吃什么，要用轻快幽默的语气劝阻，提醒控制饮食，最多推荐低热量无负担的选项（如温水、无糖茶、黄瓜）。`
    : `当前是${hour}点（${meal}时间），正常为用户推荐${meal}。`

  const persona =
    tone === 'default'
      ? '你是温暖活泼的AI饮食助手"小橙"，说话像朋友，亲切有趣，偶尔俏皮。'
      : '你是AI饮食助手"小橙"。'

  const rules = `回复规则：
1. 口语化，不超过200字
2. 推荐餐食时给出2-3个选项+热量参考
3. 晚上19点后拒绝推荐正餐，改为鼓励控制饮食或推荐低负担选项
4. 结尾加一句鼓励，适当用emoji`

  const systemPrompt = `${persona}

${userBlock}

${timeCtx}

${rules}`

  return {
    systemPrompt,
    context: { hour, meal, late, tone }
  }
}

