/**
 * H2.1 Enterprise: AI Analytics
 * 
 * 统计 Provider 命中率、Retry、Fallback、Cache、响应时间、Token、Cost、Error。
 * 为 Dashboard 提供数据。
 */

import type { AIProviderType } from './AIProvider'

export interface AnalyticsSnapshot {
  totalRequests: number
  successRate: number
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  totalTokens: number
  totalCost: number
  cacheHitRate: number
  retryRate: number
  fallbackRate: number
  errorRate: number
  byProvider: Record<string, ProviderAnalytics>
  period: { start: number; end: number }
}

export interface ProviderAnalytics {
  requests: number
  successRate: number
  avgLatencyMs: number
  tokens: number
  cost: number
  errors: number
}

interface RequestRecord {
  provider: AIProviderType
  model: string
  latencyMs: number
  success: boolean
  cached: boolean
  retried: boolean
  fallback: boolean
  tokens: number
  cost: number
  errorCode?: string
  timestamp: number
}

export class AIAnalytics {
  private records: RequestRecord[] = []

  record(params: RequestRecord): void {
    this.records.push(params)
  }

  getSnapshot(): AnalyticsSnapshot {
    if (this.records.length === 0) {
      return {
        totalRequests: 0, successRate: 0, avgLatencyMs: 0, p50LatencyMs: 0, p95LatencyMs: 0,
        totalTokens: 0, totalCost: 0, cacheHitRate: 0, retryRate: 0, fallbackRate: 0, errorRate: 0,
        byProvider: {},
        period: { start: 0, end: 0 },
      }
    }

    const total = this.records.length
    const successes = this.records.filter(r => r.success).length
    const latencies = this.records.map(r => r.latencyMs).sort((a, b) => a - b)
    const p50 = latencies[Math.floor((total - 1) * 0.5)]
    const p95 = latencies[Math.min(Math.ceil((total - 1) * 0.95), total - 1)]

    const byProvider: Record<string, ProviderAnalytics> = {}
    for (const r of this.records) {
      if (!byProvider[r.provider]) byProvider[r.provider] = { requests: 0, successRate: 0, avgLatencyMs: 0, tokens: 0, cost: 0, errors: 0 }
      const pa = byProvider[r.provider]
      pa.requests++
      pa.tokens += r.tokens
      pa.cost += r.cost
      if (!r.success) pa.errors++
    }
    // 计算每个 provider 的 successRate 和 avgLatency
    for (const [key, pa] of Object.entries(byProvider)) {
      const providerRecords = this.records.filter(r => r.provider === key)
      const providerSuccesses = providerRecords.filter(r => r.success).length
      pa.successRate = providerRecords.length > 0 ? providerSuccesses / providerRecords.length : 0
      pa.avgLatencyMs = providerRecords.length > 0
        ? providerRecords.reduce((s, r) => s + r.latencyMs, 0) / providerRecords.length
        : 0
    }

    return {
      totalRequests: total,
      successRate: successes / total,
      avgLatencyMs: latencies.reduce((s, l) => s + l, 0) / total,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      totalTokens: this.records.reduce((s, r) => s + r.tokens, 0),
      totalCost: this.records.reduce((s, r) => s + r.cost, 0),
      cacheHitRate: this.records.filter(r => r.cached).length / total,
      retryRate: this.records.filter(r => r.retried).length / total,
      fallbackRate: this.records.filter(r => r.fallback).length / total,
      errorRate: this.records.filter(r => !r.success).length / total,
      byProvider,
      period: {
        start: this.records[0].timestamp,
        end: this.records[this.records.length - 1].timestamp,
      },
    }
  }

  reset(): void {
    this.records = []
  }
}