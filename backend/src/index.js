import Fastify from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = Fastify({ logger: true })

await app.register(cors, {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
})

// ── USER ROUTES ──────────────────────────────────────────
// Create or get user
app.post('/api/users', async (req, reply) => {
  const user = await prisma.user.create({ data: {} })
  return user
})

app.get('/api/users/:id', async (req, reply) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) return reply.status(404).send({ error: 'User not found' })
  return {
    ...user,
    habits: user.habits ? JSON.parse(user.habits) : [],
    goals: user.goals ? JSON.parse(user.goals) : []
  }
})

app.patch('/api/users/:id', async (req, reply) => {
  const { age, gender, height, weight, region, habits, goals } = req.body
  const data = {}
  if (age !== undefined) data.age = age
  if (gender !== undefined) data.gender = gender
  if (height !== undefined) data.height = height
  if (weight !== undefined) data.weight = weight
  if (region !== undefined) data.region = region
  if (habits !== undefined) data.habits = JSON.stringify(habits)
  if (goals !== undefined) data.goals = JSON.stringify(goals)

  const user = await prisma.user.update({ where: { id: req.params.id }, data })
  return {
    ...user,
    habits: user.habits ? JSON.parse(user.habits) : [],
    goals: user.goals ? JSON.parse(user.goals) : []
  }
})

// ── MESSAGE ROUTES ───────────────────────────────────────
app.get('/api/users/:id/messages', async (req, reply) => {
  const messages = await prisma.message.findMany({
    where: { userId: req.params.id },
    orderBy: { createdAt: 'asc' }
  })
  return messages
})

app.post('/api/users/:id/messages', async (req, reply) => {
  const { role, content } = req.body
  const message = await prisma.message.create({
    data: { userId: req.params.id, role, content }
  })
  return message
})

app.delete('/api/users/:id/messages', async (req, reply) => {
  await prisma.message.deleteMany({ where: { userId: req.params.id } })
  return { ok: true }
})

// ── SELECTION ROUTES ─────────────────────────────────────
app.get('/api/users/:id/selections', async (req, reply) => {
  const selections = await prisma.selection.findMany({
    where: { userId: req.params.id },
    orderBy: { createdAt: 'desc' }
  })
  return selections
})

app.post('/api/users/:id/selections', async (req, reply) => {
  const { type, name, icon, calories, duration, burn, chosenAt } = req.body
  const selection = await prisma.selection.create({
    data: {
      userId: req.params.id,
      type, name,
      icon: icon || '',
      calories: calories || '',
      duration: duration || '',
      burn: burn || '',
      chosenAt: chosenAt || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
  })
  return selection
})

// ── AI CHAT ROUTE ────────────────────────────────────────
app.post('/api/chat', async (req, reply) => {
  const { userId, message, systemPrompt, history } = req.body

  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

  if (!DEEPSEEK_API_KEY) {
    return reply.status(400).send({ error: 'DEEPSEEK_API_KEY not configured' })
  }

  // Save user message
  await prisma.message.create({
    data: { userId, role: 'user', content: message }
  })

  // Call DeepSeek API
  const messages = [...(history || []), { role: 'user', content: message }]

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 1000,
      system: systemPrompt,
      messages
    })
  })

  const data = await response.json()
  const reply_text = data.choices?.[0]?.message?.content || '抱歉，小橙走神了，再说一遍吧～'

  // Save assistant message
  await prisma.message.create({
    data: { userId, role: 'assistant', content: reply_text }
  })

  return { reply: reply_text }
})

// ── AI EXTRACT ROUTE (structured JSON extraction) ────────
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
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
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

// ── AI TIPS ROUTE ─────────────────────────────────────────
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
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
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

// Start server
try {
  await app.listen({ port: 3000, host: '0.0.0.0' })
  console.log('🚀 Backend running on http://localhost:3000')
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
