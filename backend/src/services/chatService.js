import { prisma } from '../lib/prisma.js'
import { deepseekChat } from '../clients/deepseek.js'
import { buildWelcomePrompt } from '../prompts/buildWelcomePrompt.js'
import { buildMealRecommendPrompt, getMealSlot } from '../prompts/buildMealRecommendPrompt.js'
import { buildConversationPrompt } from '../prompts/buildConversationPrompt.js'

const FOOD_INTENT_KEYWORDS = ['推荐', '吃什么', '早餐', '午餐', '晚餐', '早饭', '午饭', '晚饭', '吃啥']

function isFoodRecommendIntent(text) {
  if (!text || typeof text !== 'string') return false
  const t = text.trim()
  return FOOD_INTENT_KEYWORDS.some(kw => t.includes(kw))
}

function extractReply(data) {
  return data?.choices?.[0]?.message?.content?.trim() || '抱歉，小橙走神了，再说一遍吧～'
}

/**
 * 查询该用户最近 limit 条消息，按 createdAt 升序（用于进入聊天页加载历史）。
 */
export async function getRecentMessages(userId, limit = 10) {
  const list = await prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true, role: true, content: true, createdAt: true }
  })
  return list
}

/**
 * 唯一对话入口。action: 'welcome' | 'mealRecommend'，或传 message 为用户输入。
 */
export async function sendChat({ userId, message, action }) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    const err = new Error('User not found')
    err.statusCode = 404
    throw err
  }

  const apiKey = process.env.DEEPSEEK_API_KEY || ''
  const now = new Date()

  // 首次欢迎
  if (action === 'welcome') {
    const { system, userContent } = buildWelcomePrompt(user)
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: userContent }
    ]
    const data = await deepseekChat({
      apiKey,
      messages,
      max_tokens: 300,
      temperature: 0.8
    })
    const reply = extractReply(data)
    await prisma.message.create({
      data: { userId, role: 'assistant', content: reply }
    })
    return { reply, isFirstTime: true }
  }

  // 餐食推荐（非首次进入 / 吃点其他的）
  if (action === 'mealRecommend') {
    const mealSlot = getMealSlot(now)
    const { system, userContent } = buildMealRecommendPrompt(user, mealSlot)
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: userContent }
    ]
    const data = await deepseekChat({
      apiKey,
      messages,
      max_tokens: 200,
      temperature: 0.8
    })
    const reply = extractReply(data)
    await prisma.message.create({
      data: { userId, role: 'assistant', content: reply }
    })
    return { reply, showOtherButton: true }
  }

  // 用户输入框发送
  if (message != null && message !== '') {
    const wantFood = isFoodRecommendIntent(message)

    if (wantFood) {
      const mealSlot = getMealSlot(now)
      const { system, userContent } = buildMealRecommendPrompt(user, mealSlot)
      const messages = [
        { role: 'system', content: system },
        { role: 'user', content: userContent }
      ]
      const data = await deepseekChat({
        apiKey,
        messages,
        max_tokens: 200,
        temperature: 0.8
      })
      const reply = extractReply(data)
      await prisma.message.create({
        data: { userId, role: 'assistant', content: reply }
      })
      return { reply, showOtherButton: true }
    }

    // 通用连续对话
    await prisma.message.create({
      data: { userId, role: 'user', content: String(message).trim() }
    })
    const recent = await prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 10,
      select: { role: true, content: true }
    })
    const { messages: fullMessages } = buildConversationPrompt(user, recent)
    const data = await deepseekChat({
      apiKey,
      messages: fullMessages,
      max_tokens: 150,
      temperature: 0.8
    })
    const reply = extractReply(data)
    await prisma.message.create({
      data: { userId, role: 'assistant', content: reply }
    })
    return { reply }
  }

  const err = new Error('Either message or action (welcome | mealRecommend) is required')
  err.statusCode = 400
  throw err
}
