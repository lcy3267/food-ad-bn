import { sendUserMessageAndGetReply } from '../services/chatService.js'

export default async function aiRoutes(app) {
  app.post('/api/chat', async (req, reply) => {
    // compatibility: ignore legacy systemPrompt/history from frontend
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
    const { prompt } = req.body
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

    if (!DEEPSEEK_API_KEY) {
      return reply.status(400).send({ error: 'DEEPSEEK_API_KEY not configured' })
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    return { text }
  })

  app.post('/api/tips', async (req, reply) => {
    const { prompt } = req.body
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

    if (!DEEPSEEK_API_KEY) {
      return reply.status(400).send({ error: 'DEEPSEEK_API_KEY not configured' })
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    return { text }
  })
}

