/**
 * H2.1: AIManager — 统一 AI 推理入口
 * 
 * 以后所有 AI 调用统一经过 AIManager。
 * 禁止任何地方直接调用 Gemini/OpenAI API。
 * 
 * 功能：
 *   - Provider 管理（注册/切换/fallback）
 *   - Retry（指数退避，429/503/timeout/network）
 *   - Fallback（Gemini → DeepSeek → OpenAI）
 *   - Response Cache
 *   - Token Counter
 *   - Usage Metrics
 */

import type {
  AIProviderType, AIModel, AIMessage, AIRequestOptions,
  AIResponse, AIStreamChunk, AIProviderConfig, AIRetryableError,
} from './AIProvider'
import { AIError } from './AIProvider'
import { AIResponseCache } from './AIResponseCache'
import { AITokenCounter } from './AITokenCounter'
import { AIUsageMetrics } from './AIUsageMetrics'

export interface AIManagerConfig {
  providers: AIProviderConfig[]
  defaultProvider?: AIProviderType
  defaultModel?: AIModel
  enableCache?: boolean
  enableMetrics?: boolean
  maxRetries?: number
  retryBaseDelayMs?: number
  requestTimeoutMs?: number
}

interface RegisteredProvider {
  config: AIProviderConfig
  call: (messages: AIMessage[], options?: AIRequestOptions) => Promise<AIResponse>
  callStream?: (messages: AIMessage[], options?: AIRequestOptions) => AsyncIterable<AIStreamChunk>
}

function isRetryableError(err: unknown): { retryable: boolean; code: AIRetryableError } {
  if (err instanceof AIError) {
    return { retryable: err.retryable, code: err.code as AIRetryableError }
  }
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return { retryable: true, code: 'network' }
  }
  return { retryable: false, code: 'network' as AIRetryableError }
}

export class AIManager {
  private providers: Map<AIProviderType, RegisteredProvider> = new Map()
  private config: Required<Pick<AIManagerConfig, 'maxRetries' | 'retryBaseDelayMs' | 'requestTimeoutMs' | 'enableCache' | 'enableMetrics'>>
  private defaultProvider: AIProviderType
  private responseCache: AIResponseCache
  private _tokenCounter: AITokenCounter
  private usageMetrics: AIUsageMetrics

  constructor(config: AIManagerConfig) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryBaseDelayMs: config.retryBaseDelayMs ?? 2000,
      requestTimeoutMs: config.requestTimeoutMs ?? 60000,
      enableCache: config.enableCache ?? true,
      enableMetrics: config.enableMetrics ?? true,
    }
    this.defaultProvider = config.defaultProvider || 'gemini'
    this.responseCache = new AIResponseCache()
    this._tokenCounter = new AITokenCounter()
    this.usageMetrics = new AIUsageMetrics()

    for (const pc of config.providers) {
      // 实际 provider call 将在集成时注入
      this.providers.set(pc.type, { config: pc, call: async () => {
        throw new AIError('Provider not initialized', 'unknown', false, pc.type)
      }})
    }
  }

  /** 注册 provider 实现 */
  registerProvider(type: AIProviderType, call: RegisteredProvider['call'], streamCall?: RegisteredProvider['callStream']): void {
    const existing = this.providers.get(type)
    if (existing) {
      existing.call = call
      if (streamCall) existing.callStream = streamCall
    }
  }

  /** 生成文本 */
  async generate(messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse> {
    const startTime = Date.now()
    const providerType = this.resolveProvider(options)
    let lastError: unknown

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Cache 检查
        if (this.config.enableCache && attempt === 0) {
          const cached = this.responseCache.get(messages, options)
          if (cached) {
            this.usageMetrics.recordCacheHit(providerType)
            return cached
          }
        }

        // 获取 provider
        const provider = this.getProvider(providerType)
        const opts = { ...options, timeoutMs: options?.timeoutMs ?? this.config.requestTimeoutMs }

        const response = await this.withTimeout(
          provider.call(messages, opts),
          opts.timeoutMs ?? this.config.requestTimeoutMs,
        )

        // Cache 写入
        if (this.config.enableCache) {
          this.responseCache.set(messages, options, response)
        }

        // Metrics
        if (this.config.enableMetrics) {
          this.usageMetrics.recordRequest(providerType, response.model, Date.now() - startTime, response.usage)
          this._tokenCounter.record(response.model, response.usage)
        }

        return response
      } catch (err) {
        lastError = err
        const { retryable, code } = isRetryableError(err)

        if (!retryable || attempt >= this.config.maxRetries) {
          if (this.config.enableMetrics) {
            this.usageMetrics.recordFailure(providerType, code)
          }
          break
        }

        // 指数退避
        const delay = this.config.retryBaseDelayMs * Math.pow(2, attempt) + Math.random() * 1000
        await new Promise(r => setTimeout(r, delay))
      }
    }

    // Fallback
    const fallback = this.getFallbackProvider(providerType)
    if (fallback && fallback !== providerType) {
      try {
        const provider = this.getProvider(fallback)
        const response = await provider.call(messages, options)
        if (this.config.enableMetrics) {
          this.usageMetrics.recordFallback(providerType, fallback, Date.now() - startTime)
        }
        return response
      } catch {
        // Fallback 也失败
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError))
  }

  /** 生成 JSON（确保 AI 返回有效 JSON） */
  async generateJson<T>(messages: AIMessage[], options?: AIRequestOptions): Promise<T> {
    const response = await this.generate(messages, options)
    // 尝试提取 JSON
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new AIError('AI response does not contain valid JSON', 'invalid_request', false)
    }
    try {
      return JSON.parse(jsonMatch[0]) as T
    } catch {
      throw new AIError('Failed to parse AI JSON response', 'invalid_request', false)
    }
  }

  /** 生成 Stream */
  async *generateStream(messages: AIMessage[], options?: AIRequestOptions): AsyncIterable<AIStreamChunk> {
    const providerType = this.resolveProvider(options)
    const provider = this.getProvider(providerType)

    if (!provider.callStream) {
      // Fallback to non-streaming
      const response = await this.generate(messages, options)
      yield { content: response.content, done: true, usage: response.usage }
      return
    }

    yield* provider.callStream(messages, options)
  }

  /** Vision 分析（图片 + Prompt） */
  async generateVision(images: string[], prompt: string, options?: AIRequestOptions): Promise<AIResponse> {
    const messages: AIMessage[] = [
      { role: 'user', content: prompt, images },
    ]
    return this.generate(messages, options)
  }

  private resolveProvider(options?: AIRequestOptions): AIProviderType {
    return (options?.model && this.findProviderByModel(options.model)) || this.defaultProvider
  }

  private findProviderByModel(model: string): AIProviderType | undefined {
    for (const [type, provider] of this.providers) {
      if (provider.config.models.includes(model as AIModel)) return type
    }
    return undefined
  }

  private getProvider(type: AIProviderType): RegisteredProvider {
    const provider = this.providers.get(type)
    if (!provider || !provider.config.enabled) {
      throw new AIError(`Provider ${type} not available`, 'unknown', false, type)
    }
    return provider
  }

  private getFallbackProvider(currentType: AIProviderType): AIProviderType | undefined {
    const sorted = [...this.providers.entries()]
      .filter(([, p]) => p.config.enabled && p.config.type !== currentType)
      .sort(([, a], [, b]) => a.config.priority - b.config.priority)
    return sorted[0]?.[0]
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new AIError('Request timeout', 'timeout', true)), ms)
      promise.then(
        v => { clearTimeout(timer); resolve(v) },
        e => { clearTimeout(timer); reject(e) },
      )
    })
  }

  get metrics() { return this.usageMetrics }
  get cache() { return this.responseCache }
  get tokenCounter() { return this._tokenCounter }
}