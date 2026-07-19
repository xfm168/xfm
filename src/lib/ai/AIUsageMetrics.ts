/**
 * H2.1: AI Usage Metrics
 * 
 * 统计响应时间、成功率、失败率、缓存命中率等。
 */

export interface UsageSnapshot {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  cacheHits: number
  cacheMisses: number
  fallbackCount: number
  retryCount: number
  avgResponseTimeMs: number
  totalTokens: number
  failuresByCode: Record<string, number>
  requestsByProvider: Record<string, number>
}

export class AIUsageMetrics {
  private requests: number = 0
  private successes: number = 0
  private failures: number = 0
  private cacheHits: number = 0
  private fallbacks: number = 0
  private totalResponseTime: number = 0
  private failuresByCode: Record<string, number> = {}
  private requestsByProvider: Record<string, number> = {}

  recordRequest(provider: string, _model: string, responseTimeMs: number, _usage?: { totalTokens?: number }): void {
    this.requests++
    this.successes++
    this.totalResponseTime += responseTimeMs
    this.failuresByCode[provider] = (this.failuresByCode[provider] || 0) + 1
  }

  recordFailure(provider: string, code: string): void {
    this.requests++
    this.failures++
    this.failuresByCode[code] = (this.failuresByCode[code] || 0) + 1
    this.requestsByProvider[provider] = (this.requestsByProvider[provider] || 0) + 1
  }

  recordCacheHit(provider: string): void {
    this.cacheHits++
    this.requestsByProvider[provider] = (this.requestsByProvider[provider] || 0) + 1
  }

  recordFallback(_from: string, _to: string, responseTimeMs: number): void {
    this.fallbacks++
    this.totalResponseTime += responseTimeMs
  }

  getSnapshot(): UsageSnapshot {
    return {
      totalRequests: this.requests,
      successfulRequests: this.successes,
      failedRequests: this.failures,
      cacheHits: this.cacheHits,
      cacheMisses: this.requests - this.cacheHits - this.failures,
      fallbackCount: this.fallbacks,
      retryCount: 0, // tracked externally
      avgResponseTimeMs: this.requests > 0 ? this.totalResponseTime / this.requests : 0,
      totalTokens: 0,
      failuresByCode: { ...this.failuresByCode },
      requestsByProvider: { ...this.requestsByProvider },
    }
  }

  reset(): void {
    this.requests = 0
    this.successes = 0
    this.failures = 0
    this.cacheHits = 0
    this.fallbacks = 0
    this.totalResponseTime = 0
    this.failuresByCode = {}
    this.requestsByProvider = {}
  }
}