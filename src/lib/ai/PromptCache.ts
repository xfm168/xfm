/**
 * H2.1: Prompt Cache — 基于 PromptVersion 的缓存
 * 
 * Cache Key = PromptVersion + Prompt Hash + Model + Temperature
 * 相同输入直接命中缓存，预计 API 成本下降 50%~80%。
 */

import { CacheKey, CacheNamespace } from '../cache/unified/CacheKey'
import { CacheMetrics } from '../cache/unified/CacheMetrics'

interface CachedResponse {
  content: string
  model: string
  provider: string
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number }
  cachedAt: number
}

export class PromptCache {
  private store = new Map<string, CachedResponse>()
  private metrics: CacheMetrics
  private ttl: number

  constructor(ttl: number = 30 * 60 * 1000, metrics?: CacheMetrics) {
    this.ttl = ttl
    this.metrics = metrics || new CacheMetrics()
  }

  private buildCacheKey(params: {
    promptVersion: string
    promptHash: string
    model?: string
    temperature?: number
    imageHash?: string
    locale?: string
  }): string {
    return CacheKey.build({
      namespace: CacheNamespace.AI,
      scope: 'prompt',
      identifier: [
        params.promptVersion,
        params.promptHash,
        params.model || '',
        String(params.temperature ?? 0.7),
        params.imageHash || '',
        params.locale || '',
      ].join('|'),
    })
  }

  get(params: Parameters<typeof this.buildCacheKey>[0]): CachedResponse | undefined {
    const key = this.buildCacheKey(params)
    const entry = this.store.get(key)

    if (!entry) {
      this.metrics.recordMiss('memory', 0, 'ai')
      return undefined
    }

    if (Date.now() - entry.cachedAt > this.ttl) {
      this.store.delete(key)
      this.metrics.recordExpiration('memory', 'ai')
      this.metrics.recordMiss('memory', 0, 'ai')
      return undefined
    }

    this.metrics.recordHit('memory', 0, 'ai')
    return entry
  }

  set(
    params: Parameters<typeof this.buildCacheKey>[0],
    response: Omit<CachedResponse, 'cachedAt'>,
  ): void {
    const key = this.buildCacheKey(params)
    this.store.set(key, { ...response, cachedAt: Date.now() })
    this.metrics.recordWrite('memory', 0, 'ai')
  }

  clear(): void {
    this.store.clear()
    this.metrics.recordClear('memory')
  }

  get size(): number {
    return this.store.size
  }

  getStats() {
    return this.metrics.getSnapshot('memory')
  }
}