import { prisma } from '../lib/prisma.js'

export default async function usersRoutes(app) {
  app.post('/api/users', async () => {
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

  app.patch('/api/users/:id', async (req) => {
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
}

