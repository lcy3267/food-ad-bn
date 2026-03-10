import { prisma } from '../lib/prisma.js'
import { buildSystemPrompt } from '../prompts/buildSystemPrompt.js'
import { deepseekChat } from '../clients/deepseek.js'
import { logAiCall } from './aiLogService.js'

function toDeepSeekMessages(dbMessages) {
  return (dbMessages || [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content }))
}

export async function getChatHistory(userId, limit = 16) {
  const items = await prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: limit
  })
  return items
}

export async function sendUserMessageAndGetReply({
  userId,
  message,
  now = new Date(),
  tone = 'default'
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    const err = new Error('User not found')
    err.statusCode = 404
    throw err
  }

  // Persist user message first (so DB is source of truth)
  await prisma.message.create({
    data: { userId, role: 'user', content: message }
  })

  // Build system prompt (core logic lives on backend)
  const { systemPrompt } = buildSystemPrompt({ user, now, tone })

  // Load history from DB (include the message we just wrote)
  const history = await prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: 24
  })

  const messages = toDeepSeekMessages(history)

  const apiKey = process.env.DEEPSEEK_API_KEY || ''
  const contextPrompt = {
    system: systemPrompt,
    lastUserMessage: message
  }
  console.log('DeepSeek chat prompt:', {
    userId,
    ...contextPrompt
  })

  const data = await deepseekChat({
    apiKey,
    systemPrompt,
    messages,
    max_tokens: 1000
  })

  const replyText =
    data?.choices?.[0]?.message?.content || '抱歉，小橙走神了，再说一遍吧～'

  console.log('DeepSeek chat reply:', {
    userId,
    reply: replyText
  })

  await logAiCall({
    user,
    userId,
    model: 'deepseek',
    endpoint: '/api/chat',
    prompt: contextPrompt,
    reply: replyText,
    meta: null
  })

  await prisma.message.create({
    data: { userId, role: 'assistant', content: replyText }
  })

  return { reply: replyText }
}

