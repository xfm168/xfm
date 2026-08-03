/**
 * P0-5A Foundation Core — 缓存（Cache）
 *
 * Foundation 系统的通用内存缓存组件。
 *
 * 设计原则：
 *   - 多策略驱逐：支持 LRU（最近最少使用）/ TTL（过期时间）/ FIFO（先进先出）
 *   - 惰性过期：get 时检查 TTL，也可主动 evictExpired() 清理
 *   - 标签分组：支持按 tags 批量删除缓存项
 *   - 统计观测：命中/未命中/命中率/热门排行可查询
 *   - 生成器模式：getOrSet 原子化"获取-否则生成"，防止缓存击穿
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 *
 * Core 7件事 之 7：缓存（Cache）
 */

import { Option, Some, None, Result, Ok, Err } from '../../shared/kernel/types'

// ============================================================
// 类型定义
// ============================================================

/**
 * 缓存条目
 */
export interface CacheEntry<T = any> {
  /** 缓存 key */
  key: string
  /** 缓存值 */
  value: T
  /** 创建时间戳（ms） */
  createdAt: number
  /** 过期时间戳（ms），undefined 表示永不过期 */
  expiresAt?: number
  /** 命中次数 */
  hits: number
  /** 标签数组，用于按标签批量删除 */
  tags: string[]
}

/**
 * 缓存驱逐策略
 * - lru：最近最少使用（默认），Map 前端为最久未使用，get 命中后移到末尾
 * - ttl：优先移除已过期，若仍超出容量则回退 LRU
 * - fifo：先进先出，直接移除 Map 前端条目
 */
export type CachePolicy = 'lru' | 'ttl' | 'fifo'

// ============================================================
// InMemoryCache 类
// ============================================================

/**
 * 内存缓存
 *
 * @example
 * import { globalCache } from '@/lib/bazi/foundation/core'
 *
 * // 基础写入读取
 * globalCache.set('user:1', { name: '张三' }, 3600_000, ['user'])
 * const user = globalCache.get('user:1')
 * if (user.isSome()) {
 *   console.log(user.value.name)
 * }
 *
 * // 原子化获取-否则生成
 * const result = globalCache.getOrSet('heavy:calc', () => expensiveCompute(), 60_000)
 *
 * // 标签批量删除
 * globalCache.deleteByTag('user')
 *
 * // 查看统计
 * const stats = globalCache.stats()
 * console.log(`命中率: ${stats.hitRate}`)
 */
export class InMemoryCache {
  /** 缓存存储：Map 前端 = 最旧/最久未使用；末尾 = 最新/最近使用 */
  private store = new Map<string, CacheEntry>()
  /** 最大条目数，超出时按策略驱逐 */
  private maxEntries: number
  /** 默认 TTL（ms），undefined 表示永不过期 */
  private defaultTtlMs?: number
  /** 驱逐策略 */
  private policy: CachePolicy
  /** 累计命中数（get 成功） */
  private totalHits = 0
  /** 累计未命中数（get 失败） */
  private totalMisses = 0

  constructor(options?: { maxEntries?: number; defaultTtlMs?: number; policy?: CachePolicy }) {
    this.maxEntries = options?.maxEntries ?? 1000
    this.defaultTtlMs = options?.defaultTtlMs
    this.policy = options?.policy ?? 'lru'
  }

  /**
   * 写入缓存
   * 若容量已满，按 policy 驱逐条目后再写入
   * @param key 缓存 key
   * @param value 缓存值
   * @param ttlMs 过期时间（ms），不传则用 defaultTtlMs
   * @param tags 标签数组
   */
  set<T>(key: string, value: T, ttlMs?: number, tags: string[] = []): void {
    const now = Date.now()
    const actualTtl = ttlMs ?? this.defaultTtlMs
    const expiresAt = actualTtl !== undefined ? now + actualTtl : undefined

    if (this.store.has(key)) {
      this.store.delete(key)
    }

    while (this.store.size >= this.maxEntries) {
      this.evictOne()
    }

    this.store.set(key, {
      key,
      value,
      createdAt: now,
      expiresAt,
      hits: 0,
      tags: [...tags],
    })
  }

  /**
   * 读取缓存
   * 命中：移到 Map 末尾（LRU），hits+1，totalHits+1
   * 未命中或已过期：totalMisses+1，返回 None
   * @param key 缓存 key
   */
  get<T>(key: string): Option<T> {
    const entry = this.store.get(key)
    if (!entry) {
      this.totalMisses++
      return None
    }

    if (entry.expiresAt !== undefined && Date.now() >= entry.expiresAt) {
      this.store.delete(key)
      this.totalMisses++
      return None
    }

    entry.hits++
    this.totalHits++

    if (this.policy === 'lru') {
      this.store.delete(key)
      this.store.set(key, entry)
    }

    return Some(entry.value as T)
  }

  /**
   * 原子化获取缓存，不存在则生成并写入
   * 用于防止缓存击穿（多个并发同时计算同一个 key）
   * @param key 缓存 key
   * @param producer 值生成函数
   * @param ttlMs 过期时间（ms）
   * @param tags 标签数组
   */
  getOrSet<T>(key: string, producer: () => T, ttlMs?: number, tags?: string[]): T {
    const existing = this.get<T>(key)
    if (existing.isSome()) {
      return existing.value
    }
    const value = producer()
    this.set(key, value, ttlMs, tags)
    return value
  }

  /**
   * 检查 key 是否存在（且未过期）
   * 该操作不影响 hits 统计与 LRU 顺序
   * @param key 缓存 key
   */
  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (entry.expiresAt !== undefined && Date.now() >= entry.expiresAt) {
      this.store.delete(key)
      return false
    }
    return true
  }

  /**
   * 删除指定 key
   * @returns 是否删除成功
   */
  delete(key: string): boolean {
    return this.store.delete(key)
  }

  /**
   * 按标签批量删除
   * @returns 删除的条目数量
   */
  deleteByTag(tag: string): number {
    const toDelete: string[] = []
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.includes(tag)) {
        toDelete.push(key)
      }
    }
    for (const key of toDelete) {
      this.store.delete(key)
    }
    return toDelete.length
  }

  /**
   * 查询指定 key 的命中次数
   * 不存在则返回 0
   */
  hitCount(key: string): number {
    const entry = this.store.get(key)
    return entry ? entry.hits : 0
  }

  /**
   * 清空所有缓存与统计
   */
  clear(): void {
    this.store.clear()
    this.totalHits = 0
    this.totalMisses = 0
  }

  /**
   * 当前缓存条目数
   */
  size(): number {
    return this.store.size
  }

  /**
   * 主动驱逐所有已过期条目
   * @returns 驱逐的条目数量
   */
  evictExpired(): number {
    const now = Date.now()
    const toDelete: string[] = []
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt !== undefined && now >= entry.expiresAt) {
        toDelete.push(key)
      }
    }
    for (const key of toDelete) {
      this.store.delete(key)
    }
    return toDelete.length
  }

  /**
   * 获取缓存统计
   */
  stats(): { size: number; capacity: number; hits: number; misses: number; hitRate: number } {
    const total = this.totalHits + this.totalMisses
    const hitRate = total > 0 ? this.totalHits / total : 0
    return {
      size: this.store.size,
      capacity: this.maxEntries,
      hits: this.totalHits,
      misses: this.totalMisses,
      hitRate,
    }
  }

  /**
   * 获取命中次数最多的前 N 条
   * @param n 返回数量，默认 10
   */
  getTopHits(n = 10): CacheEntry[] {
    const entries = Array.from(this.store.values())
    entries.sort((a, b) => b.hits - a.hits)
    return entries.slice(0, n).map(e => ({ ...e }))
  }

  // ─── 内部实现 ───────────────────────────────────

  /**
   * 按当前 policy 驱逐一条缓存
   * - TTL 策略：优先找过期条目，无过期则回退 LRU
   * - LRU / FIFO：都移除 Map 前端条目（最旧插入/最久未访问）
   */
  private evictOne(): void {
    if (this.store.size === 0) return

    if (this.policy === 'ttl') {
      const now = Date.now()
      for (const [key, entry] of this.store.entries()) {
        if (entry.expiresAt !== undefined && now >= entry.expiresAt) {
          this.store.delete(key)
          return
        }
      }
    }

    const firstKey = this.store.keys().next().value
    if (firstKey !== undefined) {
      this.store.delete(firstKey)
    }
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局缓存单例 */
export const globalCache = new InMemoryCache()

export default globalCache
