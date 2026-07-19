/**
 * 八字模块网络与稳定性工具 V4.4
 *
 * 提供：
 *  1. withRetry    —— 带指数退避的重试
 *  2. withTimeout  —— 超时控制
 *  3. OfflineCache —— 离线缓存（断网暂存，上线后同步）
 *
 * 适用于 AI 问命、报告导出等涉及网络请求的场景，
 * 不修改排盘算法本身。
 */

import { baziLogger } from './logger'

/* ------------------------------------------------------------------ *
 * 1. 重试机制
 * ------------------------------------------------------------------ */

export interface RetryOptions {
  /** 最大重试次数（不含首次），默认 3 */
  maxRetries?: number
  /** 初始延迟（ms），默认 300 */
  delay?: number
  /** 最大延迟上限（ms），默认 5000 */
  maxDelay?: number
  /** 是否指数退避，默认 true */
  backoff?: boolean
  /** 退避因子，默认 2 */
  backoffFactor?: number
  /** 是否在重试前加入抖动（避免惊群），默认 true */
  jitter?: boolean
  /** 判断错误是否可重试，默认全部重试 */
  shouldRetry?: (err: unknown, attempt: number) => boolean
  /** 重试回调（用于 UI 提示） */
  onRetry?: (err: unknown, attempt: number, nextDelay: number) => void
}

/**
 * 带指数退避的重试包装
 *
 * @example
 * const data = await withRetry(() => fetchReport(config), {
 *   maxRetries: 3,
 *   delay: 500,
 * })
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 300,
    maxDelay = 5000,
    backoff = true,
    backoffFactor = 2,
    jitter = true,
    shouldRetry = () => true,
    onRetry,
  } = options

  let lastError: unknown
  let currentDelay = delay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const isLast = attempt >= maxRetries
      if (isLast || !shouldRetry(err, attempt)) {
        throw err
      }

      // 计算下次延迟
      if (backoff) {
        currentDelay = Math.min(delay * Math.pow(backoffFactor, attempt), maxDelay)
      }
      if (jitter) {
        // ±25% 抖动
        const factor = 0.75 + Math.random() * 0.5
        currentDelay = Math.round(currentDelay * factor)
      }

      baziLogger.warn('请求重试', {
        attempt: attempt + 1,
        maxRetries,
        nextDelay: currentDelay,
        error: err instanceof Error ? err.message : String(err),
      })
      onRetry?.(err, attempt + 1, currentDelay)

      await sleep(currentDelay)
    }
  }

  throw lastError
}

/* ------------------------------------------------------------------ *
 * 2. 超时机制
 * ------------------------------------------------------------------ */

export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`操作超时（${timeoutMs}ms）`)
    this.name = 'TimeoutError'
  }
}

/**
 * 超时控制
 *
 * @example
 * const result = await withTimeout(() => generateReport(config), 10000)
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  if (timeoutMs <= 0) return fn()

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(timeoutMs))
    }, timeoutMs)

    fn()
      .then(result => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch(err => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

/**
 * 组合：重试 + 超时
 *
 * @example
 * const data = await withRetryAndTimeout(fetchReport, { maxRetries: 2 }, 5000)
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  retryOptions: RetryOptions = {}
): Promise<T> {
  return withRetry(() => withTimeout(fn, timeoutMs), retryOptions)
}

/* ------------------------------------------------------------------ *
 * 3. 离线缓存
 * ------------------------------------------------------------------ */

const OFFLINE_QUEUE_KEY = 'xuanfengmen:bazi:offlineQueue'

export interface OfflineQueueItem {
  key: string
  data: any
  createdAt: number
  /** 同步状态 */
  synced: boolean
}

/**
 * 离线缓存
 *
 * 断网时将数据暂存到 localStorage，上线后调用 sync() 重放。
 * 适用于 AI 问命结果暂存、命盘保存等写操作。
 *
 * @example
 * const cache = new OfflineCache()
 * if (!navigator.onLine) {
 *   cache.save('ask-master', { question, chart })
 * } else {
 *   await sendToServer(data)
 * }
 * // 上线后
 * window.addEventListener('online', () => cache.sync())
 */
export class OfflineCache {
  private queue: OfflineQueueItem[] = []
  private syncHandler: ((item: OfflineQueueItem) => Promise<boolean>) | null = null

  constructor() {
    this.loadFromStorage()
    // 监听网络恢复
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline)
    }
  }

  /** 保存数据到离线队列 */
  save(key: string, data: any): void {
    const item: OfflineQueueItem = {
      key,
      data,
      createdAt: Date.now(),
      synced: false,
    }
    this.queue.push(item)
    this.persist()
    baziLogger.info('离线数据已暂存', { key, queueSize: this.queue.length })
  }

  /** 读取（不入队，仅查看） */
  load(key: string): any | null {
    const item = this.queue.find(i => i.key === key)
    return item ? item.data : null
  }

  /** 读取所有未同步条目 */
  getPending(): OfflineQueueItem[] {
    return this.queue.filter(i => !i.synced)
  }

  /** 注册同步处理器 */
  onSync(handler: (item: OfflineQueueItem) => Promise<boolean>): void {
    this.syncHandler = handler
  }

  /** 上线后同步：依次重放队列 */
  async sync(): Promise<void> {
    if (!this.syncHandler) {
      baziLogger.warn('未注册同步处理器，跳过 sync')
      return
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      baziLogger.info('当前离线，sync 将在网络恢复后触发')
      return
    }

    const pending = this.getPending()
    if (pending.length === 0) return

    baziLogger.info('开始同步离线队列', { count: pending.length })

    for (const item of pending) {
      try {
        const ok = await this.syncHandler(item)
        if (ok) {
          item.synced = true
        }
      } catch (err) {
        baziLogger.error('同步条目失败', { key: item.key, error: String(err) })
        // 单条失败不阻断后续
      }
    }

    // 清理已同步条目
    this.queue = this.queue.filter(i => !i.synced)
    this.persist()
    baziLogger.info('离线队列同步完成', { remaining: this.queue.length })
  }

  /** 销毁：移除监听 */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
    }
  }

  private handleOnline = (): void => {
    void this.sync()
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
      if (raw) {
        this.queue = JSON.parse(raw)
      }
    } catch (err) {
      baziLogger.warn('离线队列读取失败', { error: String(err) })
    }
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue))
    } catch (err) {
      // 容量超限时丢弃最旧条目
      baziLogger.warn('离线队列持久化失败', { error: String(err) })
      if (this.queue.length > 10) {
        this.queue = this.queue.slice(-10)
        try {
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue))
        } catch {
          /* 放弃 */
        }
      }
    }
  }
}

/** 全局离线缓存单例 */
export const offlineCache = new OfflineCache()

/* ------------------------------------------------------------------ *
 * 工具
 * ------------------------------------------------------------------ */

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** 判断是否为可重试的网络错误（429 / 5xx） */
export function isRetryableHttpError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const status = (err as any).status ?? (err as any).statusCode
  if (typeof status !== 'number') return true // 未知错误默认重试
  return status === 429 || status >= 500
}
