import { prisma } from '../lib/prisma.js'

function buildUserSnapshot(user) {
  if (!user) return null
  const habits = user.habits
  const goals = user.goals

  const snapshot = {
    age: user.age,
    gender: user.gender,
    height: user.height,
    weight: user.weight,
    region: user.region,
    habits: typeof habits === 'string' ? safeParseJsonArray(habits) : habits,
    goals: typeof goals === 'string' ? safeParseJsonArray(goals) : goals
  }

  return JSON.stringify(snapshot)
}

function safeParseJsonArray(str) {
  if (!str) return []
  try {
    const v = JSON.parse(str)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export async function logAiCall({
  user,
  userId,
  model,
  endpoint,
  prompt,
  reply,
  meta
}) {
  try {
    const userSnapshot = buildUserSnapshot(user)

    await prisma.aiCallLog.create({
      data: {
        userId: userId || user?.id || null,
        model,
        endpoint,
        prompt: typeof prompt === 'string' ? prompt : JSON.stringify(prompt),
        reply,
        userSnapshot: userSnapshot || null,
        meta: meta ? JSON.stringify(meta) : null
      }
    })
  } catch (err) {
    console.warn('Failed to log AI call', {
      endpoint,
      userId: userId || user?.id || null,
      error: err?.message
    })
  }
}

