/**
 * 八字模块性能优化 V4.4
 *
 * 本模块为八字命理分析提供运行时性能优化能力，包含：
 *  1. BaziAnalysisCache       —— 分析结果 LRU 缓存（命中统计）
 *  2. ReportGenerationQueue   —— 报告后台生成队列（不阻塞 UI）
 *  3. createLazyAnalyzer      —— 分析器懒加载工具（配合 React.lazy / Suspense）
 *  4. PerformanceMonitor      —— 性能计时与指标采集
 *  5. useVirtualList          —— 虚拟列表 Hook（大运 / 流年等长列表）
 *  6. LazyImage               —— 图片懒加载组件（渐进式 + IntersectionObserver）
 *
 * 设计原则：
 *  - 纯前端、零外部依赖，向下兼容
 *  - 不修改任何排盘算法，仅在调用层做缓存 / 调度
 *  - 不耦合风水模块
 */

import { useState, useRef, useCallback, type UIEvent, type RefObject } from 'react'

/* ------------------------------------------------------------------ *
 * 1. 分析结果缓存（LRU + TTL）
 * ------------------------------------------------------------------ */

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  hitCount: number
}

export interface CacheStats {
  size: number
  maxSize: number
  hitCount: number
  missCount: number
  hitRate: number
  evictedCount: number
}

/**
 * 八字分析结果缓存
 *
 * - 基于 Map 的 LRU（最近最少使用淘汰）
 * - 支持 TTL（条目级过期时间）
 * - 提供 hit / miss 统计，便于性能监控
 *
 * @example
 * const cache = new BaziAnalysisCache(50)
 * cache.set('chart-1990-01-15', chart, 5 * 60 * 1000)
 * const hit = cache.get('chart-1990-01-15')
 */
export class BaziAnalysisCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize: number
  private hitCount = 0
  private missCount = 0
  private evictedCount = 0

  /** 默认 TTL：30 分钟 */
  static readonly DEFAULT_TTL = 30 * 60 * 1000

  constructor(maxSize = 50) {
    this.maxSize = maxSize
  }

  /**
   * 读取缓存。命中时刷新 LRU 顺序；过期则视作未命中并清理。
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {
      this.missCount++
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.missCount++
      return null
    }

    // LRU：重新插入到 Map 末尾（最近使用）
    this.cache.delete(key)
    entry.hitCount++
    entry.timestamp = now
    this.cache.set(key, entry)
    this.hitCount++
    return entry.data as T
  }

  /**
   * 写入缓存。超出容量时淘汰最旧条目。
   * @param ttl 该条目的有效期（ms），默认 30 分钟
   */
  set<T = any>(key: string, data: T, ttl: number = BaziAnalysisCache.DEFAULT_TTL): void {
    // 已存在则先删除，保证 LRU 顺序
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey === undefined) break
      this.cache.delete(oldestKey)
      this.evictedCount++
    }

    this.cache.set(key, { data, timestamp: Date.now(), ttl, hitCount: 0 })
  }

  /** 删除单个条目 */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /** 清空所有缓存 */
  clear(): void {
    this.cache.clear()
    this.hitCount = 0
    this.missCount = 0
    this.evictedCount = 0
  }

  /** 是否存在且未过期 */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  /** 当前条目数量 */
  get size(): number {
    return this.cache.size
  }

  /** 缓存命中统计 */
  getStats(): CacheStats {
    const total = this.hitCount + this.missCount
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total === 0 ? 0 : this.hitCount / total,
      evictedCount: this.evictedCount,
    }
  }

  /** 调整最大容量（可能触发淘汰） */
  resize(newSize: number): void {
    this.maxSize = newSize
    while (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey === undefined) break
      this.cache.delete(oldestKey)
      this.evictedCount++
    }
  }
}

/* ------------------------------------------------------------------ *
 * 2. 报告生成队列（后台生成，避免阻塞 UI）
 * ------------------------------------------------------------------ */

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface QueueTask<T = any> {
  id: string
  config: any
  status: TaskStatus
  result: T | null
  error: Error | null
  createdAt: number
  startedAt: number | null
  finishedAt: number | null
  progress: number // 0~100
}

export interface QueueOptions {
  /** 最大并发数，默认 1（串行，避免抢 CPU） */
  concurrency?: number
  /** 失败重试次数，默认 0 */
  maxRetries?: number
}

type TaskExecutor<T = any> = (
  config: any,
  onProgress?: (p: number) => void
) => Promise<T>

/**
 * 报告后台生成队列
 *
 * 将耗时的报告生成（导出 Word / PDF / 长报告文本等）放入后台执行，
 * 主线程立即返回 taskId，前端可轮询 / 订阅状态。
 *
 * @example
 * const queue = new ReportGenerationQueue(myReportGenerator)
 * const taskId = queue.addTask({ chart, type: 'pdf' })
 * // ...UI 端轮询
 * if (queue.getStatus(taskId) === 'completed') {
 *   const result = queue.getResult(taskId)
 * }
 */
export class ReportGenerationQueue<T = any> {
  private tasks = new Map<string, QueueTask<T>>()
  private executor: TaskExecutor<T>
  private concurrency: number
  private maxRetries: number
  private running = 0
  private listeners = new Map<string, Set<(task: QueueTask<T>) => void>>()

  constructor(executor: TaskExecutor<T>, options: QueueOptions = {}) {
    this.executor = executor
    this.concurrency = options.concurrency ?? 1
    this.maxRetries = options.maxRetries ?? 0
  }

  /** 添加任务，返回 taskId */
  addTask(config: any): string {
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const task: QueueTask<T> = {
      id,
      config,
      status: 'pending',
      result: null,
      error: null,
      createdAt: Date.now(),
      startedAt: null,
      finishedAt: null,
      progress: 0,
    }
    this.tasks.set(id, task)
    this.scheduleNext()
    return id
  }

  /** 查询任务状态 */
  getStatus(taskId: string): TaskStatus | null {
    return this.tasks.get(taskId)?.status ?? null
  }

  /** 获取任务详情 */
  getTask(taskId: string): QueueTask<T> | null {
    return this.tasks.get(taskId) ?? null
  }

  /** 获取任务结果（仅 completed 时返回） */
  getResult(taskId: string): T | null {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== 'completed') return null
    return task.result
  }

  /** 获取任务进度（0~100） */
  getProgress(taskId: string): number {
    return this.tasks.get(taskId)?.progress ?? 0
  }

  /** 订阅任务状态变更 */
  subscribe(taskId: string, listener: (task: QueueTask<T>) => void): () => void {
    if (!this.listeners.has(taskId)) this.listeners.set(taskId, new Set())
    this.listeners.get(taskId)!.add(listener)
    return () => this.listeners.get(taskId)?.delete(listener)
  }

  /** 取消任务（仅 pending 可直接取消） */
  cancel(taskId: string): void {
    const task = this.tasks.get(taskId)
    if (!task) return
    if (task.status === 'pending' || task.status === 'processing') {
      task.status = 'cancelled'
      task.finishedAt = Date.now()
      this.notify(task)
    }
  }

  /** 删除已完成 / 已取消 / 已失败的任务记录 */
  prune(): void {
    for (const [id, task] of this.tasks) {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        this.tasks.delete(id)
        this.listeners.delete(id)
      }
    }
  }

  private notify(task: QueueTask<T>): void {
    this.listeners.get(task.id)?.forEach(fn => fn(task))
  }

  private scheduleNext(): void {
    if (this.running >= this.concurrency) return
    for (const task of this.tasks.values()) {
      if (task.status === 'pending') {
        this.run(task)
        if (this.running >= this.concurrency) break
      }
    }
  }

  private async run(task: QueueTask<T>): Promise<void> {
    task.status = 'processing'
    task.startedAt = Date.now()
    this.running++
    this.notify(task)

    let attempt = 0
    let lastError: Error | null = null

    while (attempt <= this.maxRetries) {
      try {
        const result = await this.executor(task.config, p => {
          task.progress = Math.max(0, Math.min(100, p))
          this.notify(task)
        })
        task.result = result
        task.status = 'completed'
        task.progress = 100
        task.finishedAt = Date.now()
        this.notify(task)
        this.running--
        this.scheduleNext()
        return
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        attempt++
      }
    }

    task.error = lastError
    task.status = 'failed'
    task.finishedAt = Date.now()
    this.notify(task)
    this.running--
    this.scheduleNext()
  }
}

/* ------------------------------------------------------------------ *
 * 3. 懒加载工具
 * ------------------------------------------------------------------ */

export interface LazyAnalyzer<T> {
  /** 加载并返回分析器实例（带缓存） */
  load: () => Promise<T>
  /** 是否已加载 */
  isLoaded: boolean
  /** 预加载（不等待） */
  preload: () => void
  /** 当前缓存的实例（未加载时为 null） */
  value: T | null
}

/**
 * 懒加载分析器工厂
 *
 * 用于将重量级分析器（如 AI 报告生成、长报告文本拼装）延迟到首次使用时加载，
 * 与 React.lazy 配合使用可显著减小首屏 JS 体积。
 *
 * @example
 * const lazyFullReport = createLazyAnalyzer(() => import('./fullReport').then(m => m.generateFullReport))
 * lazyFullReport.preload() // 用户停留命盘页时预加载
 * const fn = await lazyFullReport.load()
 */
export function createLazyAnalyzer<T>(analyzerFn: () => Promise<T>): LazyAnalyzer<T> {
  let promise: Promise<T> | null = null
  let value: T | null = null

  const load = (): Promise<T> => {
    if (value !== null) return Promise.resolve(value)
    if (!promise) {
      promise = analyzerFn()
        .then(mod => {
          value = mod
          promise = null
          return mod
        })
        .catch(err => {
          promise = null
          throw err
        })
    }
    return promise
  }

  return {
    load,
    get isLoaded() {
      return value !== null
    },
    preload: () => {
      void load()
    },
    get value() {
      return value
    },
  }
}

/* ------------------------------------------------------------------ *
 * 4. 性能监控
 * ------------------------------------------------------------------ */

export interface PerformanceMetric {
  name: string
  duration: number // ms
  timestamp: number
  count: number
  min: number
  max: number
  avg: number
}

/**
 * 性能监控器
 *
 * 采集八字分析各阶段耗时，输出 Markdown 报告，便于 V4.4 质量门禁与回归。
 *
 * @example
 * const monitor = new PerformanceMonitor()
 * monitor.startTimer('geju')
 * determineGeJu(...)
 * const ms = monitor.endTimer('geju')
 */
export class PerformanceMonitor {
  private active = new Map<string, number>()
  private metrics = new Map<string, { total: number; count: number; min: number; max: number; last: number }>()
  private enabled = true

  /** 临时禁用 / 启用采集（生产环境可关闭以减少开销） */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /** 开始计时 */
  startTimer(name: string): void {
    if (!this.enabled) return
    this.active.set(name, performance.now())
  }

  /** 结束计时，返回本次耗时（ms） */
  endTimer(name: string): number {
    if (!this.enabled) return 0
    const start = this.active.get(name)
    if (start === undefined) return 0
    this.active.delete(name)
    const duration = performance.now() - start

    const existing = this.metrics.get(name)
    if (existing) {
      existing.total += duration
      existing.count += 1
      existing.min = Math.min(existing.min, duration)
      existing.max = Math.max(existing.max, duration)
      existing.last = duration
    } else {
      this.metrics.set(name, {
        total: duration,
        count: 1,
        min: duration,
        max: duration,
        last: duration,
      })
    }
    return duration
  }

  /** 包装一个同步函数并自动计时 */
  measure<T>(name: string, fn: () => T): T {
    this.startTimer(name)
    const result = fn()
    this.endTimer(name)
    return result
  }

  /** 包装一个异步函数并自动计时 */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(name)
    try {
      return await fn()
    } finally {
      this.endTimer(name)
    }
  }

  /** 获取所有指标 */
  getMetrics(): PerformanceMetric[] {
    const list: PerformanceMetric[] = []
    for (const [name, m] of this.metrics) {
      list.push({
        name,
        duration: m.last,
        timestamp: Date.now(),
        count: m.count,
        min: m.min,
        max: m.max,
        avg: m.count === 0 ? 0 : m.total / m.count,
      })
    }
    return list
  }

  /** 重置所有指标 */
  reset(): void {
    this.metrics.clear()
    this.active.clear()
  }

  /** 生成 Markdown 性能报告 */
  generateReport(): string {
    const metrics = this.getMetrics()
    if (metrics.length === 0) {
      return '# 八字模块性能报告\n\n> 暂无采集数据\n'
    }

    const lines: string[] = [
      '# 八字模块性能报告',
      '',
      `> 生成时间：${new Date().toISOString()}`,
      '',
      '| 阶段 | 调用次数 | 平均(ms) | 最小(ms) | 最大(ms) | 最近(ms) |',
      '| --- | ---: | ---: | ---: | ---: | ---: |',
    ]

    for (const m of metrics.sort((a, b) => b.avg - a.avg)) {
      lines.push(
        `| ${m.name} | ${m.count} | ${m.avg.toFixed(2)} | ${m.min.toFixed(2)} | ${m.max.toFixed(2)} | ${m.duration.toFixed(2)} |`
      )
    }

    const totalAvg = metrics.reduce((s, m) => s + m.avg, 0)
    lines.push('')
    lines.push(`**总平均耗时：${totalAvg.toFixed(2)} ms**`)

    return lines.join('\n')
  }
}

/** 单例性能监控器（便于全局访问，跨组件复用同一份指标） */
export const performanceMonitor = new PerformanceMonitor()

/* ------------------------------------------------------------------ *
 * 5. 虚拟列表工具（用于大运 / 流年等长列表）
 * ------------------------------------------------------------------ */

export interface VirtualListResult<T> {
  /** 当前可视窗口内的条目 */
  visibleItems: T[]
  /** 起始索引（含） */
  startIndex: number
  /** 结束索引（不含） */
  endIndex: number
  /** 容器内 Y 轴偏移（用于占位撑开滚动高度） */
  offsetY: number
  /** 总条目数 */
  total: number
}

/**
 * 虚拟列表计算工具
 *
 * 给定条目数组、单条高度与可视区高度，计算应当渲染的窗口区间。
 * 配合 `transform: translateY(offsetY)` 撑起滚动位置。
 *
 * 当列表较短（条目数 * itemHeight <= containerHeight）时直接返回全部，
 * 避免无意义的虚拟化开销。
 *
 * @example
 * const v = useVirtualList(daYun.steps, 96, 600)
 * // v.visibleItems 仅包含可视条目
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  scrollTop = 0,
  overscan = 3
): VirtualListResult<T> {
  const total = items.length
  const contentHeight = total * itemHeight

  // 列表不长则无需虚拟化
  if (contentHeight <= containerHeight || itemHeight <= 0) {
    return {
      visibleItems: items,
      startIndex: 0,
      endIndex: total,
      offsetY: 0,
      total,
    }
  }

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2
  const endIndex = Math.min(total, startIndex + visibleCount)
  const visibleItems = items.slice(startIndex, endIndex)
  const offsetY = startIndex * itemHeight

  return { visibleItems, startIndex, endIndex, offsetY, total }
}

/**
 * 虚拟列表滚动 Hook（带滚动位置采集）
 *
 * @returns props 用于绑定到滚动容器，result 为虚拟化结果
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 3
): {
  scrollTop: number
  onScroll: (e: UIEvent<HTMLElement>) => void
  result: VirtualListResult<T>
  containerRef: RefObject<HTMLDivElement | null>
} {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const onScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const result = useVirtualList(items, itemHeight, containerHeight, scrollTop, overscan)

  return { scrollTop, onScroll, result, containerRef }
}

/* ------------------------------------------------------------------ *
 * 6. 图片懒加载组件 —— 见 ./LazyImage.tsx
 *    （JSX 组件单独存放于 .tsx 文件，避免 .ts 文件引入 JSX）
 * ------------------------------------------------------------------ */

// re-export 以保持单一导入入口
export { LazyImage } from './LazyImage'
export type { LazyImageProps } from './LazyImage'
