/**
 * H2: 统一缓存管理器
 * 
 * 多级缓存协调：
 *   Memory (L1) → IndexedDB/LocalStorage (L2) → Compute (L3)
 * 
 * 读流程: Memory → Persistent → undefined (miss)
 * 写流程: Memory + Persistent 同时写入
 * 
 * 支持 CacheLock（同一 Key 同时只计算一次）。
 */

import { MemoryCache } from './MemoryCache'
import { PersistentCache } from './PersistentCache'
import { CacheMetrics } from './CacheMetrics'
import { CacheKey, CacheNamespace, type CacheKeyParams } from './CacheKey'
import { getPolicy, TTL } from './CachePolicy'
import type { CacheTierPolicy } from './CachePolicy'

export interface UnifiedCacheManagerConfig {
  /** 命名空间 */
  namespace: CacheNamespace | string
  /** 自定义策略（覆盖默认） */
  policy?: Partial<CacheTierPolicy>
}

export interface GetOrComputeOptions {
  /** 自定义 TTL（覆盖策略默认值） */
  ttl?: number
  /** 命名空间细分标识 */
  subNamespace?: string
}

export class UnifiedCacheManager {
  private memory: MemoryCache
  private persistent: PersistentCache
  private metrics: CacheMetrics
  private policy: CacheTierPolicy
  private locks: Map<string, Promise<unknown>> = new Map()

  constructor(config: UnifiedCacheManagerConfig, metrics?: CacheMetrics) {
    const defaultPolicy = getPolicy(config.namespace)
    this.policy = { ...defaultPolicy, ...config.policy }
    this.metrics = metrics || new CacheMetrics()

    this.memory = new MemoryCache(
      { maxEntries: this.policy.maxEntries, defaultTTL: this.policy.defaultTTL },
      this.metrics,
    )

    this.persistent = new PersistentCache(
      {
        dbName: `xfm-cache-${this.policy.namespace}`,
        storeName: this.policy.namespace,
        defaultTTL: this.policy.defaultTTL,
        maxEntries: this.policy.maxEntries * 2,
      },
      this.metrics,
    )
  }

  /** 构建缓存 Key */
  buildKey(params: Omit<CacheKeyParams, 'namespace'>): string {
    return CacheKey.build({ ...params, namespace: this.policy.namespace as CacheNamespace })
  }

  /** L1 读取（同步，仅 Memory） */
  get(key: string): unknown | undefined {
    return this.memory.get(key)
  }

  /** L1+L2 读取（异步，Memory → Persistent） */
  async getAsync(key: string): Promise<unknown | undefined> {
    // L1: Memory
    const memVal = this.memory.get(key)
    if (memVal !== undefined) return memVal

    // L2: Persistent
    const persistVal = await this.persistent.get(key)
    if (persistVal !== undefined) {
      // 回填 L1
      this.memory.set(key, persistVal)
      return persistVal
    }

    return undefined
  }

  /** 写入 L1 + L2 */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    this.memory.set(key, value, ttl)
    if (this.policy.persist) {
      await this.persistent.set(key, value, ttl)
    }
  }

  /** 获取或计算（带 CacheLock） */
  async getOrCompute<T>(
    key: string,
    compute: () => T | Promise<T>,
    options?: GetOrComputeOptions,
  ): Promise<T> {
    // CacheLock: 同一 Key 只允许一次计算
    const existingLock = this.locks.get(key)
    if (existingLock) {
      return existingLock as Promise<T>
    }

    // 先占位 lock，防止并发重复计算
    let resolveCompute!: (value: T) => void
    let rejectCompute!: (err: Error) => void
    const computePromise = new Promise<T>((resolve, reject) => {
      resolveCompute = resolve
      rejectCompute = reject
    })
    this.locks.set(key, computePromise)

    try {
      // 查缓存
      const cached = await this.getAsync(key)
      if (cached !== undefined) {
        this.locks.delete(key)
        return cached as T
      }

      // 计算并缓存
      const value = await compute()
      await this.set(key, value, options?.ttl)
      resolveCompute(value)
      return value
    } catch (err) {
      rejectCompute(err instanceof Error ? err : new Error(String(err)))
      throw err
    } finally {
      this.locks.delete(key)
    }
  }

  delete(key: string): boolean {
    this.persistent.delete(key) // fire-and-forget
    return this.memory.delete(key)
  }

  has(key: string): boolean {
    return this.memory.has(key)
  }

  async hasAsync(key: string): Promise<boolean> {
    return this.memory.has(key) || await this.persistent.has(key)
  }

  async clear(): Promise<void> {
    this.memory.clear()
    await this.persistent.clear()
    this.locks.clear()
  }

  /** 清理过期条目 */
  cleanup(): number {
    return this.memory.cleanup()
  }

  /** 获取统计快照 */
  getMetrics() {
    return {
      memory: this.metrics.getSnapshot('memory'),
      persistent: this.metrics.getSnapshot(
        this.persistent.tierName,
      ),
    }
  }

  get memoryCache(): MemoryCache {
    return this.memory
  }

  get persistentCache(): PersistentCache {
    return this.persistent
  }
}

/** 全局 Metrics 实例（单例） */
export const globalCacheMetrics = new CacheMetrics()

/** 预创建的缓存管理器 */
export function createPipelineCache(): UnifiedCacheManager {
  return new UnifiedCacheManager({ namespace: CacheNamespace.Pipeline }, globalCacheMetrics)
}

export function createAnalysisCache(): UnifiedCacheManager {
  return new UnifiedCacheManager({ namespace: CacheNamespace.Analysis }, globalCacheMetrics)
}

export function createAICache(): UnifiedCacheManager {
  return new UnifiedCacheManager({ namespace: CacheNamespace.AI }, globalCacheMetrics)
}
