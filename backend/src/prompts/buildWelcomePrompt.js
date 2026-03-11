function safeJsonArray(str) {
  if (!str) return []
  try {
    const v = JSON.parse(str)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function calcBodyFat(user) {
  const h = (user?.height ?? 170) / 100
  const bmi = (user?.weight ?? 65) / (h * h)
  const age = user?.age ?? 25
  const isMale = user?.gender === '男'
  return (1.2 * bmi + 0.23 * age - (isMale ? 10.8 : 0) - 5.4).toFixed(1)
}

/**
 * 首次进入聊天：整体饮食建议，约 150 字以内。
 * 基于地区、饮食习惯、饮食目的、性别、体脂。
 */
export function buildWelcomePrompt(user) {
  const habits = Array.isArray(user?.habits) ? user.habits : safeJsonArray(user?.habits)
  const goals = Array.isArray(user?.goals) ? user.goals : safeJsonArray(user?.goals)
  const bodyFat = calcBodyFat(user)

  const system = `你是温暖活泼的AI饮食助手"小橙"。根据用户信息给出一段整体饮食建议，亲切口语化，控制在150字以内，适当用emoji。不要使用 **、## 等 markdown。`

  const userBlock = `用户信息：${user?.age ?? ''}岁 ${user?.gender ?? ''}生，身高${user?.height ?? ''}cm 体重${user?.weight ?? ''}kg，体脂约${bodyFat}%，所在地区${user?.region ?? ''}，饮食习惯：${habits.join('、')}，饮食目的：${goals.join('、')}。请给出一段整体饮食建议。`

  return {
    system,
    userContent: userBlock
  }
}
