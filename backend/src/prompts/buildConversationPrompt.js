function safeJsonArray(str) {
  if (!str) return []
  try {
    const v = JSON.parse(str)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/**
 * 用户输入框发送且非饮食推荐意图：通用连续对话，回复 50 字以内。
 * recentMessages 已包含刚写入的当前用户消息（由调用方先写 DB 再取最近 10 条）。
 */
export function buildConversationPrompt(user, recentMessages) {
  const habits = Array.isArray(user?.habits) ? user.habits : safeJsonArray(user?.habits)
  const goals = Array.isArray(user?.goals) ? user.goals : safeJsonArray(user?.goals)

  const system = `你是饮食助手"小橙"，亲切简短。回复控制在50字以内，口语化，用emoji。不要使用 **、## 等 markdown。用户信息：${user?.region ?? ''}，习惯${habits.join('、')}，目的${goals.join('、')}。`

  const messages = [
    { role: 'system', content: system },
    ...recentMessages.map(m => ({ role: m.role, content: m.content }))
  ]

  return { messages }
}
