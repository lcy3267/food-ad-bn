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

  const response = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      max_tokens,
      temperature,
      system: systemPrompt,
      messages
    })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const err = new Error(data?.error?.message || `DeepSeek error (${response.status})`)
    err.statusCode = response.status
    err.details = data
    throw err
  }

  return data
}

