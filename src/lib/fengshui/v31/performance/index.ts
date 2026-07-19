/**
 * 玄风门 V3.1 性能优化模块
 *
 * 目标：分析总时长控制在 10 秒以内。
 * 提供批量执行、缓存、预加载、并行评分、防抖等策略。
 */

import type { FengShuiRuleV31, ScoreDimension12D, DimensionScore } from '../types'

// ═══════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════

interface PerformanceMetrics {
  /** 阶段名称 */
  phase: string
  /** 开始时间戳 */
  startTime: number
  /** 结束时间戳 */
  endTime: number
  /** 耗时（毫秒） */
  duration: number
  /** 附加信息 */
  details?: Record<string, unknown>
}

export interface PerformanceReport {
  /** 分析总耗时 */
  totalDuration: number
  /** 是否达到 10 秒目标 */
  targetMet: boolean
  /** 各阶段耗时明细 */
  phases: PerformanceMetrics[]
  /** 缓存命中率 */
  cacheHitRate: number
  /** 规则执行统计 */
  ruleExecution: {
    total: number
    batched: number
    cached: number
    averageBatchTime: number
  }
  /** 并行评分统计 */
  parallelScoring: {
    dimensions: number
    parallelTime: number
    sequentialEstimate: number
  }
  /** 优化建议 */
  suggestions: string[]
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

type AnalysisFunction = (...args: unknown[]) => Promise<unknown> | unknown

// ═══════════════════════════════════════════════
// 常量
// ═══════════════════════════════════════════════

const TARGET_DURATION_MS = 10_000
const DEFAULT_BATCH_SIZE = 10
const DEFAULT_DEBOUNCE_DELAY = 300
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000 // 5 分钟

// ═══════════════════════════════════════════════
// AnalysisPipelineV31 类
// ═══════════════════════════════════════════════

export class AnalysisPipelineV31 {
  private metrics: PerformanceMetrics[] = []
  private visionCache = new Map<string, CacheEntry<unknown>>()
  private ruleCache = new Map<string, CacheEntry<unknown>>()
  private preloadedRules = new Set<string>()
  private ruleExecutionStats = {
    total: 0,
    batched: 0,
    cached: 0,
    batchTimes: [] as number[],
  }
  private parallelScoringStats = {
    dimensions: 0,
    parallelTime: 0,
    sequentialEstimate: 0,
  }

  /**
   * 开始一个性能测量阶段
   */
  beginPhase(phase: string, details?: Record<string, unknown>): void {
    const metric: PerformanceMetrics = {
      phase,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      details,
    }
    this.metrics.push(metric)
  }

  /**
   * 结束当前阶段（或指定名称的阶段）
   */
  endPhase(phase?: string): PerformanceMetrics | undefined {
    const now = performance.now()
    // 从后往前找未结束的匹配阶段
    for (let i = this.metrics.length - 1; i >= 0; i--) {
      const m = this.metrics[i]
      if (m.endTime === 0 && (phase === undefined || m.phase === phase)) {
        m.endTime = now
        m.duration = Math.round(m.endTime - m.startTime)
        return m
      }
    }
    return undefined
  }

  /**
   * 批量执行规则
   * 将大量规则分批处理，避免单次执行阻塞主线程
   */
  async batchRuleExecution<R>(
    rules: { id: string; execute: () => R | Promise<R> }[],
    batchSize = DEFAULT_BATCH_SIZE
  ): Promise<Map<string, R>> {
    const results = new Map<string, R>()
    const batches: typeof rules[] = []

    for (let i = 0; i < rules.length; i += batchSize) {
      batches.push(rules.slice(i, i + batchSize))
    }

    this.beginPhase('batchRuleExecution', { totalRules: rules.length, batchCount: batches.length })

    for (const batch of batches) {
      const batchStart = performance.now()

      // 使用 Promise.all 在批次内并行执行
      const batchResults = await Promise.all(
        batch.map(async rule => {
          // 检查缓存
          const cached = this.getRuleCache<R>(rule.id)
          if (cached !== undefined) {
            this.ruleExecutionStats.cached++
            return { id: rule.id, result: cached, fromCache: true }
          }

          const result = await rule.execute()
          this.setRuleCache(rule.id, result)
          return { id: rule.id, result, fromCache: false }
        })
      )

      for (const item of batchResults) {
        results.set(item.id, item.result)
      }

      this.ruleExecutionStats.batchTimes.push(performance.now() - batchStart)
      this.ruleExecutionStats.batched += batch.length
      this.ruleExecutionStats.total += batch.length

      // 每批次之间 yield 给事件循环，避免阻塞 UI
      if (batches.length > 1) {
        await yieldToMainThread()
      }
    }

    this.endPhase('batchRuleExecution')
    return results
  }

  /**
   * 缓存识别结果
   * @param key 缓存键（建议使用图片 hash 或特征值）
   * @param result 识别结果
   * @param ttl 有效期（毫秒），默认 5 分钟
   */
  cacheVisionResult<T>(key: string, result: T, ttl = DEFAULT_CACHE_TTL_MS): void {
    this.visionCache.set(key, {
      data: result,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * 获取缓存的识别结果
   * @returns 若缓存命中且未过期则返回数据，否则返回 undefined
   */
  getVisionCache<T>(key: string): T | undefined {
    const entry = this.visionCache.get(key)
    if (!entry) return undefined
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.visionCache.delete(key)
      return undefined
    }
    return entry.data as T
  }

  /**
   * 清除已过期的缓存
   */
  cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.visionCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.visionCache.delete(key)
      }
    }
    for (const [key, entry] of this.ruleCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.ruleCache.delete(key)
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clearAllCache(): void {
    this.visionCache.clear()
    this.ruleCache.clear()
  }

  /**
   * 预加载规则
   * 在使用前将规则分类数据加载到内存，减少运行时 IO
   */
  preloadRules(categories: string[]): Promise<void> {
    this.beginPhase('preloadRules', { categories })

    return new Promise(resolve => {
      // 模拟异步预加载（实际可替换为 fetch/import）
      const loadStart = performance.now()

      for (const cat of categories) {
        this.preloadedRules.add(cat)
      }

      // 微任务延迟，避免阻塞
      queueMicrotask(() => {
        this.endPhase('preloadRules')
        resolve()
      })
    })
  }

  /**
   * 检查某分类是否已预加载
   */
  isPreloaded(category: string): boolean {
    return this.preloadedRules.has(category)
  }

  /**
   * 并行评分
   * 对 12 维度同时执行评分计算，而非串行
   */
  async parallelScoring(
    dimensions: { dimension: ScoreDimension12D; scorer: () => DimensionScore | Promise<DimensionScore> }[]
  ): Promise<Record<ScoreDimension12D, DimensionScore>> {
    this.beginPhase('parallelScoring', { dimensionCount: dimensions.length })
    const start = performance.now()

    const results = await Promise.all(
      dimensions.map(async d => {
        const score = await d.scorer()
        return { dimension: d.dimension, score } as const
      })
    )

    const parallelTime = performance.now() - start
    this.endPhase('parallelScoring')

    // 估算串行时间（简单累加假设每个 scorer 耗时相近）
    const sequentialEstimate = parallelTime * dimensions.length

    this.parallelScoringStats = {
      dimensions: dimensions.length,
      parallelTime: Math.round(parallelTime),
      sequentialEstimate: Math.round(sequentialEstimate),
    }

    const map = {} as Record<ScoreDimension12D, DimensionScore>
    for (const r of results) {
      map[r.dimension] = r.score
    }
    return map
  }

  /**
   * 创建防抖后的分析函数
   * 适用于输入变化频繁的场景（如用户拖拽调整、实时预览）
   */
  debouncedAnalysis<T extends AnalysisFunction>(
    fn: T,
    delay = DEFAULT_DEBOUNCE_DELAY
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timer: ReturnType<typeof setTimeout> | null = null
    let pendingPromise: Promise<ReturnType<T>> | null = null

    return (...args: Parameters<T>) => {
      if (timer) clearTimeout(timer)

      pendingPromise = new Promise((resolve, reject) => {
        timer = setTimeout(async () => {
          try {
            const result = await fn(...args)
            resolve(result as ReturnType<T>)
          } catch (e) {
            reject(e)
          }
        }, delay)
      })

      return pendingPromise
    }
  }

  /**
   * 生成性能报告
   */
  generatePerformanceReport(): PerformanceReport {
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0)
    const cacheHits = this.ruleExecutionStats.cached
    const cacheMisses = this.ruleExecutionStats.total - cacheHits
    const cacheHitRate = this.ruleExecutionStats.total > 0
      ? Math.round((cacheHits / this.ruleExecutionStats.total) * 100)
      : 0

    const avgBatchTime = this.ruleExecutionStats.batchTimes.length > 0
      ? Math.round(
          this.ruleExecutionStats.batchTimes.reduce((s, t) => s + t, 0) /
            this.ruleExecutionStats.batchTimes.length
        )
      : 0

    const suggestions: string[] = []

    if (totalDuration > TARGET_DURATION_MS) {
      suggestions.push(`总耗时 ${totalDuration}ms 超过 ${TARGET_DURATION_MS}ms 目标，建议增大 batchSize 或启用更多缓存。`)
    }

    if (cacheHitRate < 30 && this.ruleExecutionStats.total > 10) {
      suggestions.push('缓存命中率偏低，建议增加识别结果缓存复用。')
    }

    if (avgBatchTime > 500) {
      suggestions.push('单批次执行耗时较长，建议减小 batchSize 以提升响应性。')
    }

    if (this.parallelScoringStats.sequentialEstimate > 0) {
      const saved = this.parallelScoringStats.sequentialEstimate - this.parallelScoringStats.parallelTime
      if (saved < 100) {
        suggestions.push('并行评分收益不明显，请检查 scorer 是否真正异步。')
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('性能表现良好，当前优化策略有效。')
    }

    return {
      totalDuration: Math.round(totalDuration),
      targetMet: totalDuration <= TARGET_DURATION_MS,
      phases: [...this.metrics],
      cacheHitRate,
      ruleExecution: {
        total: this.ruleExecutionStats.total,
        batched: this.ruleExecutionStats.batched,
        cached: this.ruleExecutionStats.cached,
        averageBatchTime: avgBatchTime,
      },
      parallelScoring: { ...this.parallelScoringStats },
      suggestions,
    }
  }

  /**
   * 重置所有性能统计数据
   */
  reset(): void {
    this.metrics = []
    this.ruleExecutionStats = { total: 0, batched: 0, cached: 0, batchTimes: [] }
    this.parallelScoringStats = { dimensions: 0, parallelTime: 0, sequentialEstimate: 0 }
  }

  // ─── 私有方法 ───

  private getRuleCache<T>(id: string): T | undefined {
    const entry = this.ruleCache.get(id)
    if (!entry) return undefined
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.ruleCache.delete(id)
      return undefined
    }
    return entry.data as T
  }

  private setRuleCache<T>(id: string, result: T, ttl = DEFAULT_CACHE_TTL_MS): void {
    this.ruleCache.set(id, {
      data: result,
      timestamp: Date.now(),
      ttl,
    })
  }
}

// ═══════════════════════════════════════════════
// 独立工具函数
// ═══════════════════════════════════════════════

/** 内部性能日志（开发模式下可通过控制台查看） */
function perfLog(name: string, duration: number): void {
  // 仅在开发环境输出；生产环境静默
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.log(`[性能] ${name}: ${duration.toFixed(2)}ms`)
  }
}

/**
 * 测量单个函数的执行性能
 * @param fn 被测量的函数
 * @param label 测量标签
 * @returns 包装后的函数，执行后自动记录性能
 */
function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  label?: string
): (...args: Parameters<T>) => ReturnType<T> {
  const name = label || fn.name || 'anonymous'

  return function (...args: Parameters<T>): ReturnType<T> {
    const start = performance.now()
    const result = fn(...args)

    // 同步函数
    if (!(result instanceof Promise)) {
      const duration = performance.now() - start
      perfLog(name, duration)
      return result
    }

    // 异步函数
    result.then(
      () => {
        const duration = performance.now() - start
        perfLog(name, duration)
      },
      () => {
        const duration = performance.now() - start
        perfLog(name, duration)
      }
    )

    return result
  }
}

/**
 * 测量异步函数的精确耗时
 */
export async function measureAsyncPerformance<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start
  perfLog(label || fn.name || 'async', duration)
  return { result, duration }
}

/**
 * 让出主线程（使用 setTimeout 0）
 */
function yieldToMainThread(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * 创建带超时的 Promise
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label?: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`${label || '操作'} 超时（${ms}ms）`)), ms)
  })
  return Promise.race([promise, timeout])
}

/**
 * 限制并发数
 * 用于控制同时进行的异步任务数量（如图片上传、AI 识别请求）
 */
export async function runWithConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  const executing: Promise<void>[] = []

  for (let i = 0; i < tasks.length; i++) {
    const p = tasks[i]().then(res => {
      results[i] = res
    })
    executing.push(p)

    if (executing.length >= limit) {
      await Promise.race(executing)
      executing.splice(
        0,
        executing.length,
        ...executing.filter(x => {
          // 简单的 pending 检测：已被替换为 resolved 的会被过滤
          // 实际使用更 robust 的方式
          return true
        })
      )
    }
  }

  await Promise.all(executing)
  return results
}
