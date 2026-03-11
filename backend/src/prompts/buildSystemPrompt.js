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
  if (hour < 10) return '早餐'
  if (hour < 14) return '午餐'
  return '晚餐'
}

function isLateNight(hour) {
  return hour >= 19
}

export function buildSystemPrompt({ user, now = new Date(), tone = 'default', currentRequest = '' }) {
  const hour = now.getHours()
  const meal = calcMeal(hour)
  const late = isLateNight(hour)

  const habits = Array.isArray(user?.habits) ? user.habits : safeJsonArray(user?.habits)
  const goals = Array.isArray(user?.goals) ? user.goals : safeJsonArray(user?.goals)

  const hasFatLossGoal = goals.some(g =>
    typeof g === 'string' && (g.includes('减脂') || g.toLowerCase().includes('fat'))
  )
  const dineInKeywords = ['餐厅堂食', '外出就餐', '在外吃', '外食', '堂食']
  const isDineInHabit = habits.some(h =>
    typeof h === 'string' && dineInKeywords.some(k => h.includes(k))
  )

  // Frontend previously computed BMI/bodyFat; backend doesn't have those formulas now.
  // Keep the prompt shape stable but omit derived metrics until/unless we add them server-side.
  const userBlock = `用户信息：
- ${user?.age ?? ''}岁 ${user?.gender ?? ''}生，${user?.height ?? ''}cm / ${user?.weight ?? ''}kg
- 所在城市：${user?.region ?? ''}
- 饮食习惯：${habits.join('、')}
- 饮食目标：${goals.join('、')}`

  const timeCtx = late
    ? `【重要】现在是晚上${hour}点，已过19:00。严禁推荐任何正餐或高热量食物。如果用户问吃什么，要用轻快幽默的语气劝阻，提醒控制饮食，最多推荐低热量无负担的选项（如温水、无糖茶、黄瓜）。`
    : `当前是${hour}点。【餐次必须正确】用户说推荐早餐就只推荐早餐，说推荐午餐就只推荐午餐，说推荐晚餐就只推荐晚餐；若用户未指定餐次，再按当前时间默认推荐${meal}。不要搞错餐次。`

  let dietStrategy = ''
  if (hasFatLossGoal && isDineInHabit) {
    dietStrategy = `饮食策略（重要）：
- 用户的主要目标是减脂，且经常在餐厅堂食。
- 请特别结合用户所在城市（${user?.region || '未知城市'}），优先推荐在当地餐厅常见、相对低脂的菜品或点餐组合（例如本地常见的家常菜、常见连锁餐厅能点到的搭配）。
- 尽量给出具体菜名或菜品组合，而不是抽象的“多吃蔬菜、少油少盐”这类泛泛建议。
- 如果对当地菜品不够确定，可以给出通用低脂菜品示例，并说明是通用参考，不要虚构不存在的店名。`
  }

  const persona =
    tone === 'default'
      ? '你是温暖活泼的AI饮食助手"小橙"，说话像朋友，亲切有趣，偶尔俏皮。'
      : '你是AI饮食助手"小橙"。'

  const rules = `回复规则：
1. 口语化，一定不超过100字
2. 回复使用纯文本，不要使用 **、## 等 markdown 符号，用 emoji 和自然语气即可
3. 推荐餐食时给出2-3个选项+热量参考
4. 晚上19点后拒绝推荐正餐，改为鼓励控制饮食或推荐低负担选项
5. 在涉及餐厅堂食且减脂目标时，优先优雅地给出适合当地的菜品或点餐组合建议
6. 结尾加一句鼓励，适当用emoji`

  const currentRequestBlock =
    currentRequest && typeof currentRequest === 'string' && currentRequest.trim()
      ? `\n【本次用户需求】请针对用户本轮的这句话进行回复。用户本轮说：「${currentRequest.trim()}」`
      : ''

  const systemPrompt = `${persona}

${userBlock}

${timeCtx}

${dietStrategy}

${rules}${currentRequestBlock}`

  return {
    systemPrompt,
    context: {
      hour,
      meal,
      late,
      tone,
      hasFatLossGoal,
      isDineInHabit
    }
  }
}

