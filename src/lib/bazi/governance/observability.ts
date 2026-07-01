/**
 * Observability - 可观测性
 * V4.8.1 Baseline
 *
 * 收集算法运行指标：调用次数、缓存命中、错误、耗时。
 * 生产环境零开销（关闭时不记录）。
 */

export interface MetricEntry {
  name: string
  value: number
  tags: Record<string, string>
  timestamp: number
}

export interface ObservabilityCounters {
  /** 总调用次数 */
  calls: number
  /** 缓存命中 */
  cacheHits: number
  /** 缓存未命中 */
  cacheMisses: number
  /** 错误次数 */
  errors: number
  /** 总耗时(ms) */
  totalDurationMs: number
}

const counters: Record<string, ObservabilityCounters> = {}
const metrics: MetricEntry[] = []
let enabled = true

function ensureCounter(key: string): ObservabilityCounters {
  if (!counters[key]) {
    counters[key] = {
      calls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      totalDurationMs: 0,
    }
  }
  return counters[key]
}

/** 记录一次调用 */
export function recordCall(key: string, durationMs: number, cacheHit = false): void {
  if (!enabled) return
  const c = ensureCounter(key)
  c.calls++
  c.totalDurationMs += durationMs
  if (cacheHit) c.cacheHits++
  else c.cacheMisses++
}

/** 记录一次错误 */
export function recordError(key: string): void {
  if (!enabled) return
  ensureCounter(key).errors++
}

/** 记录自定义指标 */
export function recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
  if (!enabled) return
  metrics.push({ name, value, tags, timestamp: Date.now() })
}

/** 获取计数器 */
export function getCounters(key: string): ObservabilityCounters {
  return { ...(counters[key] ?? ensureCounter(key)) }
}

/** 获取全部计数器 */
export function getAllCounters(): Record<string, ObservabilityCounters> {
  const result: Record<string, ObservabilityCounters> = {}
  for (const [k, v] of Object.entries(counters)) {
    result[k] = { ...v }
  }
  return result
}

/** 获取自定义指标 */
export function getMetrics(): MetricEntry[] {
  return [...metrics]
}

/** 获取平均耗时 */
export function getAvgDuration(key: string): number {
  const c = counters[key]
  if (!c || c.calls === 0) return 0
  return Math.round(c.totalDurationMs / c.calls)
}

/** 获取缓存命中率 */
export function getCacheHitRate(key: string): number {
  const c = counters[key]
  if (!c || c.calls === 0) return 0
  return Math.round((c.cacheHits / c.calls) * 100)
}

/** 汇总报告 */
export function getObservabilitySummary() {
  const keys = Object.keys(counters)
  return {
    enabled,
    trackedKeys: keys.length,
    totalCalls: keys.reduce((sum, k) => sum + counters[k].calls, 0),
    totalErrors: keys.reduce((sum, k) => sum + counters[k].errors, 0),
    customMetrics: metrics.length,
  }
}

/** 启用/禁用 */
export function setObservabilityEnabled(value: boolean): void {
  enabled = value
}

/** 重置 */
export function resetObservability(): void {
  for (const k of Object.keys(counters)) delete counters[k]
  metrics.length = 0
}
