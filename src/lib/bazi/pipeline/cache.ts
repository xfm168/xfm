/**
 * Pipeline Cache Interface — V4.4 Enterprise
 * 
 * 统一缓存接口，当前实现 MemoryCache。
 * 以后可无缝替换为 RedisCache / IndexedDBCache / SupabaseCache。
 */

export interface PipelineCacheEntry<T = unknown> {
  value: T
  createdAt: number
  expiresAt: number
  hits: number
}

export interface PipelineCacheConfig {
  defaultTTL: number    // 默认过期时间（ms）
  maxEntries: number    // 最大条目数
}

export interface PipelineCache {
  get<T = unknown>(key: string): T | undefined
  set<T = unknown>(key: string, value: T, ttl?: number): void
  delete(key: string): boolean
  has(key: string): boolean
  clear(): void
  getStats(): { size: number; hits: number; misses: number; clearCount: number }
}

/** 内存缓存实现 */
export class MemoryPipelineCache implements PipelineCache {
  private store = new Map<string, PipelineCacheEntry>()
  private hits = 0
  private misses = 0
  private clearCount = 0
  private config: PipelineCacheConfig

  constructor(config?: Partial<PipelineCacheConfig>) {
    this.config = {
      defaultTTL: 30 * 60 * 1000, // 30 分钟
      maxEntries: 100,
      ...config,
    }
  }

  get<T = unknown>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) {
      this.misses++
      return undefined
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      this.misses++
      return undefined
    }
    entry.hits++
    this.hits++
    return entry.value as T
  }

  set<T = unknown>(key: string, value: T, ttl?: number): void {
    // LRU: 超出容量时删除最旧条目
    if (this.store.size >= this.config.maxEntries && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value
      if (oldestKey) this.store.delete(oldestKey)
    }
    this.store.set(key, {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl ?? this.config.defaultTTL),
      hits: 0,
    })
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return false
    }
    return true
  }

  clear(): void {
    this.store.clear()
    this.hits = 0
    this.misses = 0
    this.clearCount++
  }

  getStats() {
    return { size: this.store.size, hits: this.hits, misses: this.misses, clearCount: this.clearCount }
  }
}