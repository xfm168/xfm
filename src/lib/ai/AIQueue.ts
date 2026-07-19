/**
 * H2.1 Enterprise: AI 请求队列
 * 
 * 控制并发、限流、优先级、取消。
 * 防止 100 人同时调用 Gemini。
 */

export type QueuePriority = 'low' | 'normal' | 'high' | 'urgent'

interface QueueItem {
  id: string
  priority: QueuePriority
  execute: () => Promise<unknown>
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
  cancelled: boolean
  enqueuedAt: number
}

const PRIORITY_WEIGHT: Record<QueuePriority, number> = {
  low: 0, normal: 1, high: 2, urgent: 3,
}

let queueIdCounter = 0

export class AIQueue {
  private queue: QueueItem[] = []
  private running = 0
  private maxConcurrency: number
  private rateLimitMs: number
  private lastRunTime = 0

  constructor(maxConcurrency: number = 3, rateLimitMs: number = 1000) {
    this.maxConcurrency = maxConcurrency
    this.rateLimitMs = rateLimitMs
  }

  /** 入队 */
  enqueue<T>(execute: () => Promise<T>, priority: QueuePriority = 'normal'): Promise<T> {
    return new Promise((resolve, reject) => {
      const item: QueueItem = {
        id: `q-${++queueIdCounter}`,
        priority,
        execute: execute as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        cancelled: false,
        enqueuedAt: Date.now(),
      }
      this.queue.push(item)
      this.queue.sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority])
      // Delay process() to allow batch enqueue with correct priority ordering
      queueMicrotask(() => this.process())
    })
  }

  /** 取消指定 ID 的请求 */
  cancel(id: string): boolean {
    const idx = this.queue.findIndex(item => item.id === id)
    if (idx === -1) return false
    this.queue[idx].cancelled = true
    this.queue[idx].reject(new Error('Cancelled'))
    this.queue.splice(idx, 1)
    return true
  }

  /** 取消所有 */
  cancelAll(): void {
    for (const item of this.queue) {
      item.cancelled = true
      item.reject(new Error('Queue cancelled'))
    }
    this.queue = []
  }

  /** 队列大小 */
  get size(): number {
    return this.queue.length
  }

  /** 正在运行数 */
  get activeCount(): number {
    return this.running
  }

  private async process(): Promise<void> {
    while (this.queue.length > 0 && this.running < this.maxConcurrency) {
      const now = Date.now()
      const elapsed = now - this.lastRunTime
      if (elapsed < this.rateLimitMs) {
        await new Promise(r => setTimeout(r, this.rateLimitMs - elapsed))
      }

      const item = this.queue.shift()
      if (!item || item.cancelled) continue

      this.running++
      this.lastRunTime = Date.now()

      item.execute()
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          this.running--
          this.process()
        })
    }
  }

  reset(): void {
    this.cancelAll()
    this.running = 0
    queueIdCounter = 0
  }
}