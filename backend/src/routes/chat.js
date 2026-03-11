import { getRecentMessages, sendChat } from '../services/chatService.js'

export default async function chatRoutes(app) {
  app.get('/api/users/:id/messages', async (req, reply) => {
    const { id } = req.params
    const list = await getRecentMessages(id, 10)
    return list
  })

  app.post('/api/chat', async (req, reply) => {
    const { userId, message, action } = req.body || {}
    if (!userId) {
      return reply.status(400).send({ error: 'userId is required' })
    }
    try {
      const result = await sendChat({ userId, message, action })
      return result
    } catch (err) {
      const code = err.statusCode || 500
      return reply.status(code).send({ error: err.message || 'Chat failed' })
    }
  })
}
