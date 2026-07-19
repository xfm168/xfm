/**
 * H2: 统一缓存策略
 * 
 * 集中管理所有 TTL、LRU 容量、Version 配置。
 * 禁止任何地方使用硬编码 TTL 值（如 60000, 30 * 60 * 1000）。
 */

export interface CacheTierPolicy {
  namespace: string
  defaultTTL: number       // 毫秒
  maxEntries: number       // LRU 容量
  persist: boolean        // 是否持久化到 IndexedDB/LocalStorage
  compressThreshold?: number // 超过此字节自动压缩（默认 100KB）
}

export const CACHE_VERSION = '1.0.0'

/** TTL 常量（毫秒） */
export const TTL = {
  /** 30 秒 */
  ThirtySec: 30 * 1000,
  /** 1 分钟 */
  OneMin: 60 * 1000,
  /** 5 分钟 */
  FiveMin: 5 * 60 * 1000,
  /** 30 分钟 */
  ThirtyMin: 30 * 60 * 1000,
  /** 1 小时 */
  OneHour: 60 * 60 * 1000,
  /** 6 小时 */
  SixHour: 6 * 60 * 60 * 1000,
  /** 12 小时 */
  TwelveHour: 12 * 60 * 60 * 1000,
  /** 24 小时 */
  OneDay: 24 * 60 * 60 * 1000,
  /** 7 天 */
  SevenDay: 7 * 24 * 60 * 60 * 1000,
  /** 30 天 */
  ThirtyDay: 30 * 24 * 60 * 60 * 1000,
  /** 永不过期 */
  Never: 0,
} as const

/** LRU 容量限制 */
export const LRU_CAPACITY = {
  Pipeline: 50,
  Analysis: 100,
  AI: 200,
  Image: 30,
  Knowledge: 500,
  Static: 1000,
  Session: 20,
} as const

/** 各命名空间的默认策略 */
export const CACHE_POLICIES: Record<string, CacheTierPolicy> = {
  pipeline: {
    namespace: 'pipeline',
    defaultTTL: TTL.ThirtyMin,
    maxEntries: LRU_CAPACITY.Pipeline,
    persist: true,
  },
  analysis: {
    namespace: 'analysis',
    defaultTTL: TTL.SevenDay,
    maxEntries: LRU_CAPACITY.Analysis,
    persist: true,
  },
  ai: {
    namespace: 'ai',
    defaultTTL: TTL.ThirtyDay,
    maxEntries: LRU_CAPACITY.AI,
    persist: true,
    compressThreshold: 100 * 1024,
  },
  image: {
    namespace: 'image',
    defaultTTL: TTL.ThirtyDay,
    maxEntries: LRU_CAPACITY.Image,
    persist: true,
    compressThreshold: 50 * 1024,
  },
  knowledge: {
    namespace: 'knowledge',
    defaultTTL: TTL.Never,
    maxEntries: LRU_CAPACITY.Knowledge,
    persist: true,
  },
  static: {
    namespace: 'static',
    defaultTTL: TTL.Never,
    maxEntries: LRU_CAPACITY.Static,
    persist: false,
  },
}

export function getPolicy(namespace: string): CacheTierPolicy {
  return CACHE_POLICIES[namespace] || {
    namespace,
    defaultTTL: TTL.OneHour,
    maxEntries: 100,
    persist: false,
  }
}
