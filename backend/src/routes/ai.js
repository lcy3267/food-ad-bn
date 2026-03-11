import { sendUserMessageAndGetReply } from '../services/chatService.js'
import { logAiCall } from '../services/aiLogService.js'
import { deepseekChat } from '../clients/deepseek.js'

export default async function aiRoutes(app) {
  app.post('/api/chat', async (req, reply) => {
    const { userId, message } = req.body || {}

    if (!userId || !message) {
      return reply.status(400).send({ error: 'userId and message are required' })
    }

    try {
      return await sendUserMessageAndGetReply({ userId, message })
    } catch (err) {
      const status = err?.statusCode || 500
      const payload = { error: err?.message || 'Internal Server Error' }
      if (err?.details) payload.details = err.details
      return reply.status(status).send(payload)
    }
  })

  app.post('/api/extract', async (req, reply) => {
    const { prompt } = req.body || {}
    const apiKey = process.env.DEEPSEEK_API_KEY || ''

    if (!apiKey) {
      return reply.status(400).send({ error: 'DEEPSEEK_API_KEY not configured' })
    }
    if (!prompt || typeof prompt !== 'string') {
      return reply.status(400).send({ error: 'prompt is required' })
    }

    try {
      const data = await deepseekChat({
        apiKey,
        systemPrompt: '你是一个助手。根据用户要求从原文中提取信息，严格只返回要求的 JSON 或文本，不要使用 markdown 符号。',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 700
      })
      const text = data?.choices?.[0]?.message?.content ?? ''

      await logAiCall({
        user: null,
        userId: null,
        model: 'deepseek',
        endpoint: '/api/extract',
        prompt: { prompt },
        reply: text,
        meta: null
      })

      return { text }
    } catch (err) {
      const status = err?.statusCode || 500
      return reply.status(status).send({ error: err?.message || 'DeepSeek request failed' })
    }
  })

  app.post('/api/tips', async (req, reply) => {
    const { prompt } = req.body || {}
    const apiKey = process.env.DEEPSEEK_API_KEY || ''

    if (!apiKey) {
      return reply.status(400).send({ error: 'DEEPSEEK_API_KEY not configured' })
    }
    if (!prompt || typeof prompt !== 'string') {
      return reply.status(400).send({ error: 'prompt is required' })
    }

    try {
      const data = await deepseekChat({
        apiKey,
        systemPrompt: '你是一个助手。用简洁的纯文本回复用户，不要使用 ** 或 ## 等 markdown 符号。',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400
      })
      const text = data?.choices?.[0]?.message?.content ?? ''

      await logAiCall({
        user: null,
        userId: null,
        model: 'deepseek',
        endpoint: '/api/tips',
        prompt: { prompt },
        reply: text,
        meta: null
      })

      return { text }
    } catch (err) {
      const status = err?.statusCode || 500
      return reply.status(status).send({ error: err?.message || 'DeepSeek request failed' })
    }
  })
}

