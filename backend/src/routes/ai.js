import { prisma } from '../lib/prisma.js'

export default async function aiRoutes(app) {
  app.post('/api/chat', async (req, reply) => {
    const { userId, message, systemPrompt, history } = req.body

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
    if (!DEEPSEEK_API_KEY) {
      return reply.status(400).send({ error: 'DEEPSEEK_API_KEY not configured' })
    }

    await prisma.message.create({
      data: { userId, role: 'user', content: message }
    })

    const messages = [...(history || []), { role: 'user', content: message }]

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 1000,
        system: systemPrompt,
        messages
      })
    })

    const data = await response.json()
    const reply_text =
      data.choices?.[0]?.message?.content || '抱歉，小橙走神了，再说一遍吧～'

    await prisma.message.create({
      data: { userId, role: 'assistant', content: reply_text }
    })

    return { reply: reply_text }
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

