/**
 * H2.1: AI Response Cache
 * 
 * 缓存 AI 请求结果，避免重复调用。
 * Cache Key 基于消息内容的 hash。
 */

import type { AIMessage, AIRequestOptions, AIResponse } from './AIProvider'
import { PromptCache } from './PromptCache'
import { PROMPT_VERSION } from './PromptVersion'

export class AIResponseCache {
  private promptCache: PromptCache

  constructor(ttl?: number) {
    this.promptCache = new PromptCache(ttl)
  }

  private hashMessages(messages: AIMessage[]): string {
    const content = messages.map(m => `${m.role}:${m.content}${(m.images || []).join(',')}`).join('\n')
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0
    }
    return (hash >>> 0).toString(36)
  }

  get(messages: AIMessage[], options?: AIRequestOptions): AIResponse | undefined {
    const cached = this.promptCache.get({
      promptVersion: PROMPT_VERSION,
      promptHash: this.hashMessages(messages),
      model: options?.model,
      temperature: options?.temperature,
    })
    if (!cached) return undefined
    return {
      content: cached.content,
      model: cached.model as AIResponse['model'],
      provider: cached.provider as AIResponse['provider'],
      usage: cached.usage,
    }
  }

  set(messages: AIMessage[], options: AIRequestOptions | undefined, response: AIResponse): void {
    this.promptCache.set(
      {
        promptVersion: PROMPT_VERSION,
        promptHash: this.hashMessages(messages),
        model: options?.model,
        temperature: options?.temperature,
      },
      {
        content: response.content,
        model: response.model,
        provider: response.provider,
        usage: response.usage,
      },
    )
  }

  clear(): void {
    this.promptCache.clear()
  }

  get size(): number {
    return this.promptCache.size
  }
}