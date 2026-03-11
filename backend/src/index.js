import Fastify from 'fastify'
import cors from '@fastify/cors'
import usersRoutes from './routes/users.js'
import chatRoutes from './routes/chat.js'

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
})

await app.register(usersRoutes)
await app.register(chatRoutes)

// Start server
try {
  await app.listen({ port: 3000, host: '0.0.0.0' })
  console.log('🚀 Backend running on http://localhost:3000')
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
