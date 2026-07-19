/**
 * V5.0 RC Phase 5 Module I: Cache Tier Engine — 三级缓存引擎
 *
 * 职责：Memory / Redis / Persistent 三级缓存管理、LRU 淘汰、TTL 过期、跨层提升
 * 约束：不做命理计算，仅提供缓存基础设施
 */

import type {
  CacheEntry,
  CacheStats,
  CacheTier,
  CacheTierOutput,
  CacheSetOptions,
} from './cacheTierTypes'

import {
  DEFAULT_CACHE_CONFIGS,
  CACHE_TIER_VERSION,
} from './cacheTierTypes'

// ═══════════════════════════════════════════════════════════
// 版本号
// ═══════════════════════════════════════════════════════════

export const CACHE_TIER_ENGINE_VERSION = '1.0.0'

// ═══════════════════════════════════════════════════════════
// 内部存储与统计
// ═══════════════════════════════════════════════════════════

const memoryStore = new Map<string, CacheEntry>()
const redisStore = new Map<string, CacheEntry>()
const persistentStore = new Map<string, CacheEntry>()

const tierStores: Record<CacheTier, Map<string, CacheEntry>> = {
  memory: memoryStore,
  redis: redisStore,
  persistent: persistentStore,
}

const tierHits: Record<CacheTier, number> = { memory: 0, redis: 0, persistent: 0 }
const tierMisses: Record<CacheTier, number> = { memory: 0, redis: 0, persistent: 0 }
const tierEvictions: Record<CacheTier, number> = { memory: 0, redis: 0, persistent: 0 }

// ═══════════════════════════════════════════════════════════
// 内部辅助
// ═══════════════════════════════════════════════════════════

/**
 * glob 简易匹配（仅支持 * 通配符）
 */
function globMatch(pattern: string, key: string): boolean {
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
  const regex = new RegExp(`^${regexStr}$`)
  return regex.test(key)
}

/**
 * 判断条目是否过期
 */
function isExpired(entry: CacheEntry): boolean {
  return (entry.accessedAt + entry.ttl) < Date.now()
}

/**
 * 获取某层级的总大小
 */
function getTierSize(tier: CacheTier): number {
  const store = tierStores[tier]
  let total = 0
  for (const entry of store.values()) {
    total += entry.size
  }
  return total
}

/**
 * LRU 淘汰：逐个移除 accessedAt 最小的条目直到容量足够
 */
function evictLru(tier: CacheTier, requiredSpace: number): number {
  const config = DEFAULT_CACHE_CONFIGS[tier]
  const store = tierStores[tier]
  let evicted = 0

  while (getTierSize(tier) + requiredSpace > config.maxSize && store.size > 0) {
    let oldestKey: string | null = null
    let oldestAccess = Infinity

    for (const [k, entry] of store) {
      if (entry.accessedAt < oldestAccess) {
        oldestAccess = entry.accessedAt
        oldestKey = k
      }
    }

    if (oldestKey !== null) {
      store.delete(oldestKey)
      tierEvictions[tier]++
      evicted++
    } else {
      break
    }
  }

  return evicted
}

// ═══════════════════════════════════════════════════════════
// 核心函数
// ═══════════════════════════════════════════════════════════

/**
 * 粗略估算值大小（JSON.stringify.length * 2）
 */
export function estimateSize(value: unknown): number {
  try {
    return JSON.stringify(value).length * 2
  } catch {
    return 0
  }
}

/**
 * 按 tier 查找缓存；未指定则依次查 memory → redis → persistent
 */
export function getFromCache<T>(key: string, tier?: CacheTier): CacheEntry<T> | null {
  const tiersToSearch: CacheTier[] = tier
    ? [tier]
    : ['memory', 'redis', 'persistent']

  for (const t of tiersToSearch) {
    const store = tierStores[t]
    const entry = store.get(key)
    if (entry) {
      if (isExpired(entry)) {
        store.delete(key)
        tierMisses[t]++
        continue
      }
      entry.accessedAt = Date.now()
      entry.hitCount++
      tierHits[t]++
      return entry as CacheEntry<T>
    } else {
      tierMisses[t]++
    }
  }

  return null
}

/**
 * 写入指定层级缓存（默认 memory）
 */
export function setCache<T>(key: string, value: T, options?: CacheSetOptions): void {
  const targetTier: CacheTier = options?.tier ?? 'memory'
  const config = DEFAULT_CACHE_CONFIGS[targetTier]
  const size = estimateSize(value)

  // 淘汰以腾出空间
  evictLru(targetTier, size)

  const store = tierStores[targetTier]
  const now = Date.now()
  const ttl = options?.ttl ?? config.defaultTtl

  store.set(key, {
    key,
    value: value as unknown,
    tier: targetTier,
    createdAt: now,
    accessedAt: now,
    ttl,
    hitCount: 0,
    size,
  })
}

/**
 * glob 模式匹配失效，返回失效数
 */
export function invalidateCache(pattern: string, tier?: CacheTier): number {
  const targets: CacheTier[] = tier ? [tier] : ['memory', 'redis', 'persistent']
  let count = 0

  for (const t of targets) {
    const store = tierStores[t]
    const keysToDelete: string[] = []
    for (const [k] of store) {
      if (globMatch(pattern, k)) {
        keysToDelete.push(k)
      }
    }
    for (const k of keysToDelete) {
      store.delete(k)
      count++
    }
  }

  return count
}

/**
 * 全部失效
 */
export function invalidateAll(tier?: CacheTier): number {
  const targets: CacheTier[] = tier ? [tier] : ['memory', 'redis', 'persistent']
  let count = 0
  for (const t of targets) {
    count += tierStores[t].size
    tierStores[t].clear()
  }
  return count
}

/**
 * 获取统计
 */
export function getCacheStats(tier?: CacheTier): CacheStats {
  if (tier) {
    const store = tierStores[tier]
    const hits = tierHits[tier]
    const misses = tierMisses[tier]
    const total = hits + misses
    let totalSize = 0
    for (const entry of store.values()) {
      totalSize += entry.size
    }
    return {
      tier,
      entries: store.size,
      hits,
      misses,
      hitRate: total > 0 ? hits / total : 0,
      evictions: tierEvictions[tier],
      totalSize,
    }
  }

  // 无指定层时返回 memory 层统计（兼容性）
  return getCacheStats('memory')
}

/**
 * 三级完整报告
 */
export function getFullCacheReport(): CacheTierOutput {
  const tiers: CacheTier[] = ['memory', 'redis', 'persistent']
  const stats: Record<CacheTier, CacheStats> = {
    memory: getCacheStats('memory'),
    redis: getCacheStats('redis'),
    persistent: getCacheStats('persistent'),
  }

  let totalHits = 0
  let totalMisses = 0
  let totalEntries = 0
  let totalSize = 0

  for (const t of tiers) {
    totalHits += stats[t].hits
    totalMisses += stats[t].misses
    totalEntries += stats[t].entries
    totalSize += stats[t].totalSize
  }

  const overallTotal = totalHits + totalMisses
  const overallHitRate = overallTotal > 0 ? totalHits / overallTotal : 0

  const recommendations: string[] = []

  if (overallHitRate < 0.5) {
    recommendations.push('整体命中率低于 50%，建议检查缓存策略或增大容量')
  }
  if (stats.memory.evictions > 10) {
    recommendations.push('Memory 层淘汰频繁，建议提升至 Redis 层或增大 Memory 容量')
  }
  if (stats.persistent.entries > 1000) {
    recommendations.push('Persistent 层条目过多，建议清理过期条目')
  }
  if (overallHitRate >= 0.8 && recommendations.length === 0) {
    recommendations.push('缓存状态良好，命中率优秀')
  }

  return {
    stats,
    overallHitRate,
    totalEntries,
    totalSize,
    recommendations,
  }
}

/**
 * 跨层提升
 */
export function promoteEntry(key: string, fromTier: CacheTier, toTier: CacheTier): boolean {
  const fromStore = tierStores[fromTier]
  const entry = fromStore.get(key)

  if (!entry) {
    return false
  }

  if (isExpired(entry)) {
    fromStore.delete(key)
    return false
  }

  const toConfig = DEFAULT_CACHE_CONFIGS[toTier]
  evictLru(toTier, entry.size)

  const promotedEntry: CacheEntry = {
    ...entry,
    tier: toTier,
    createdAt: entry.createdAt,
    accessedAt: Date.now(),
  }

  tierStores[toTier].set(key, promotedEntry)
  fromStore.delete(key)
  return true
}

/**
 * 重置统计（用于测试）
 */
export function resetCacheStats(): void {
  for (const t of ['memory', 'redis', 'persistent'] as CacheTier[]) {
    tierHits[t] = 0
    tierMisses[t] = 0
    tierEvictions[t] = 0
  }
}

/**
 * 重置全部缓存存储（用于测试）
 */
export function resetAllStores(): void {
  memoryStore.clear()
  redisStore.clear()
  persistentStore.clear()
  resetCacheStats()
}
