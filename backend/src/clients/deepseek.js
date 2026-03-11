// 与官方文档一致：https://api-docs.deepseek.com/zh-cn/  POST /chat/completions
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'

export async function deepseekChat({
  apiKey,
  systemPrompt,
  messages,
  model = 'deepseek-chat',
  max_tokens = 1000,
  temperature = 1
}) {
  if (!apiKey) {
    const err = new Error('DEEPSEEK_API_KEY not configured')
    err.statusCode = 400
    throw err
  }

  const allMessages = [
    { role: 'system', content: systemPrompt || '你是一个有帮助的助手。' },
    ...(messages || [])
  ]

  const body = {
    model,
    messages: allMessages,
    stream: false,
    max_tokens,
    temperature
  }

  const response = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const msg = data?.error?.message || data?.error?.code || `DeepSeek API error (${response.status})`
    const err = new Error(msg)
    err.statusCode = response.status
    err.details = data
    throw err
  }

  return data
}

