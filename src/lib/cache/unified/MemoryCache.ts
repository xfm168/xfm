/**
 * H2: O(1) LRU 内存缓存
 * 
 * 使用 Map 天然有序特性实现 O(1) 的 get/set/delete。
 * Map.keys() 返回插入顺序，每次 get 后 delete + set 将条目移到末尾（最近使用）。
 * 淘汰时删除 Map.keys().next()（最久未使用）。
 */

import { CacheMetrics } from './CacheMetrics'

export interface MemoryCacheConfig {
  /** LRU 最大容量 */
  maxEntries: number
  /** 默认 TTL（毫秒），0 = 永不过期 */
  defaultTTL: number
}

interface CacheEntry<T = unknown> {
  value: T
  createdAt: number
  expiresAt: number
}

export class MemoryCache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>()
  private config: MemoryCacheConfig
  private metrics: CacheMetrics
  private _clearCount = 0

  constructor(config: MemoryCacheConfig, metrics: CacheMetrics) {
    this.config = config
    this.metrics = metrics
  }

  get(key: string): T | undefined {
    const start = performance.now()
    const entry = this.store.get(key)

    if (!entry) {
      this.metrics.recordMiss('memory', performance.now() - start)
      return undefined
    }

    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      this.metrics.recordExpiration('memory')
      this.metrics.recordMiss('memory', performance.now() - start)
      this.metrics.setSize('memory', this.store.size)
      return undefined
    }

    // LRU: 移到末尾（最近使用）
    this.store.delete(key)
    this.store.set(key, entry)

    this.metrics.recordHit('memory', performance.now() - start)
    return entry.value
  }

  set(key: string, value: T, ttl?: number): void {
    const start = performance.now()

    // LRU 淘汰
    while (this.store.size >= this.config.maxEntries && !this.store.has(key)) {
      const oldest = this.store.keys().next().value
      if (oldest !== undefined) {
        this.store.delete(oldest)
        this.metrics.recordEviction('memory')
      }
    }

    const effectiveTTL = ttl ?? this.config.defaultTTL
    this.store.set(key, {
      value,
      createdAt: Date.now(),
      expiresAt: effectiveTTL > 0 ? Date.now() + effectiveTTL : 0,
    })

    this.metrics.setSize('memory', this.store.size)
    this.metrics.recordWrite('memory', performance.now() - start)
  }

  delete(key: string): boolean {
    const existed = this.store.delete(key)
    this.metrics.setSize('memory', this.store.size)
    return existed
  }

  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      this.metrics.recordExpiration('memory')
      this.metrics.setSize('memory', this.store.size)
      return false
    }
    return true
  }

  clear(): void {
    this.store.clear()
    this._clearCount++
    this.metrics.recordClear('memory')
    this.metrics.setSize('memory', 0)
  }

  get size(): number {
    return this.store.size
  }

  get clearCount(): number {
    return this._clearCount
  }

  /** 清理所有过期条目 */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0
    for (const [key, entry] of this.store) {
      if (entry.expiresAt > 0 && now > entry.expiresAt) {
        this.store.delete(key)
        cleaned++
        this.metrics.recordExpiration('memory')
      }
    }
    if (cleaned > 0) this.metrics.setSize('memory', this.store.size)
    return cleaned
  }

  /** 获取所有 key（调试用） */
  keys(): string[] {
    return Array.from(this.store.keys())
  }
}
