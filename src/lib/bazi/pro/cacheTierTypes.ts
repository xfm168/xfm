// V5.0 RC Phase 5 Module I: Cache Tier Engine — Types
// 三级缓存：Memory / Redis / Persistent

export type CacheTier = 'memory' | 'redis' | 'persistent'
export type CacheStrategy = 'lru' | 'lfu' | 'ttl' | 'write-through' | 'write-behind'

export interface CacheEntry<T = unknown> {
  key: string
  value: T
  tier: CacheTier
  createdAt: number
  accessedAt: number
  ttl: number
  hitCount: number
  size: number
}

export interface CacheTierConfig {
  tier: CacheTier
  enabled: boolean
  maxSize: number      // bytes
  defaultTtl: number   // ms
  strategy: CacheStrategy
}

export interface CacheStats {
  tier: CacheTier
  entries: number
  hits: number
  misses: number
  hitRate: number
  evictions: number
  totalSize: number
}

export interface CacheTierOutput {
  stats: Record<CacheTier, CacheStats>
  overallHitRate: number
  totalEntries: number
  totalSize: number
  recommendations: string[]
}

export interface CacheInvalidationRule {
  pattern: string
  trigger: 'time' | 'version' | 'manual'
  priority: number
}

export interface CacheSetOptions {
  tier?: CacheTier
  ttl?: number
  tags?: string[]
}

export const DEFAULT_CACHE_CONFIGS: Record<CacheTier, CacheTierConfig> = {
  memory: { tier: 'memory', enabled: true, maxSize: 50 * 1024 * 1024, defaultTtl: 300000, strategy: 'lru' },
  redis: { tier: 'redis', enabled: true, maxSize: 500 * 1024 * 1024, defaultTtl: 3600000, strategy: 'ttl' },
  persistent: { tier: 'persistent', enabled: true, maxSize: 2000 * 1024 * 1024, defaultTtl: 86400000, strategy: 'write-through' },
}

export const CACHE_TIER_VERSION = '1.0.0'
