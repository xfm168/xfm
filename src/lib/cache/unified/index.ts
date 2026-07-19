/**
 * H2: Unified Cache Layer — 统一导出
 *
 * 多级缓存架构：
 *   Memory (L1) → IndexedDB/LocalStorage (L2) → Compute (L3)
 */

// Core
export { CacheKey, CacheNamespace, CACHE_VERSION } from './CacheKey'
export type { CacheKeyParams } from './CacheKey'

export { TTL, LRU_CAPACITY, CACHE_POLICIES, getPolicy, CACHE_VERSION as CACHE_POLICY_VERSION } from './CachePolicy'
export type { CacheTierPolicy } from './CachePolicy'

export { CacheMetrics } from './CacheMetrics'
export type { CacheMetricsSnapshot } from './CacheMetrics'

// Cache implementations
export { MemoryCache } from './MemoryCache'
export type { MemoryCacheConfig } from './MemoryCache'

export { PersistentCache } from './PersistentCache'
export type { PersistentCacheConfig } from './PersistentCache'

// Unified manager
export {
  UnifiedCacheManager,
  globalCacheMetrics,
  createPipelineCache,
  createAnalysisCache,
  createAICache,
} from './UnifiedCacheManager'
export type { UnifiedCacheManagerConfig, GetOrComputeOptions } from './UnifiedCacheManager'
