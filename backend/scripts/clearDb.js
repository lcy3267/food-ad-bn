/**
 * Clears all data from the database (Message, Selection, AiCallLog, User).
 * Run from backend: node scripts/clearDb.js
 * Or: npm run db:clear
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearDb() {
  try {
    const deletedAiLogs = await prisma.aiCallLog.deleteMany({})
    const deletedMessages = await prisma.message.deleteMany({})
    const deletedSelections = await prisma.selection.deleteMany({})
    const deletedUsers = await prisma.user.deleteMany({})

    console.log('Database cleared:')
    console.log('  AiCallLog:', deletedAiLogs.count)
    console.log('  Message:', deletedMessages.count)
    console.log('  Selection:', deletedSelections.count)
    console.log('  User:', deletedUsers.count)
  } catch (e) {
    console.error('Failed to clear database:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

clearDb()
