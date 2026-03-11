const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'

/**
 * 调用 DeepSeek 对话补全，请求体符合官方文档。
 * @param {{ apiKey: string, messages: Array<{role:string,content:string}>, max_tokens?: number, temperature?: number }}
 */
export async function deepseekChat({ apiKey, messages, max_tokens = 500, temperature = 0.8 }) {
  if (!apiKey) {
    const err = new Error('DEEPSEEK_API_KEY not configured')
    err.statusCode = 400
    throw err
  }

  const body = {
    model: 'deepseek-chat',
    messages,
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
