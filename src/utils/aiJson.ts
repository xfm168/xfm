export function safeParseAIJson<T = Record<string, unknown>>(content: string): T | null {
  if (!content || typeof content !== 'string') {
    return null
  }

  let cleaned = content.trim()

  // 去除 Markdown 代码块 ```json ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '')
  cleaned = cleaned.replace(/\s*```$/, '')

  // 找到第一个 { 和最后一个 }
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return null
  }

  const jsonStr = cleaned.slice(firstBrace, lastBrace + 1)

  try {
    return JSON.parse(jsonStr) as T
  } catch {
    return null
  }
}
