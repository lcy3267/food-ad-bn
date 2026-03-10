import { prisma } from '../lib/prisma.js'

export default async function messagesRoutes(app) {
  app.get('/api/users/:id/messages', async (req) => {
    const messages = await prisma.message.findMany({
      where: { userId: req.params.id },
      orderBy: { createdAt: 'asc' }
    })
    return messages
  })

  app.post('/api/users/:id/messages', async (req) => {
    const { role, content } = req.body
    const message = await prisma.message.create({
      data: { userId: req.params.id, role, content }
    })
    return message
  })

  app.delete('/api/users/:id/messages', async (req) => {
    await prisma.message.deleteMany({ where: { userId: req.params.id } })
    return { ok: true }
  })
}

