import { prisma } from '../lib/prisma.js'

export default async function selectionsRoutes(app) {
  app.get('/api/users/:id/selections', async (req) => {
    const selections = await prisma.selection.findMany({
      where: { userId: req.params.id },
      orderBy: { createdAt: 'desc' }
    })
    return selections
  })

  app.post('/api/users/:id/selections', async (req) => {
    const { type, name, icon, calories, duration, burn, chosenAt } = req.body
    const selection = await prisma.selection.create({
      data: {
        userId: req.params.id,
        type,
        name,
        icon: icon || '',
        calories: calories || '',
        duration: duration || '',
        burn: burn || '',
        chosenAt:
          chosenAt ||
          new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          })
      }
    })
    return selection
  })
}

