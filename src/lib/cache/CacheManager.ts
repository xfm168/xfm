/**
 * RC3-4: Cache 体系 - 核心缓存管理器
 *
 * 功能：
 * - get/set/delete/clear/has/size 基础操作
 * - TTL 过期机制
 * - 命名空间支持（namespace:key 格式）
 * - 内存存储 + 可选 localStorage 持久化
 * - getStats 命中率统计
 * - cleanup 过期清理
 * - 静态注册表（供 CacheReport 聚合统计）
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

// ══════════════════════════════════════════════════
//  类型定义
// ══════════════════════════════════════════════════

/** 缓存条目接口 */
export interface CacheEntry<T = unknown> {
  /** 完整 key（含命名空间） */
  key: string
  /** 缓存值 */
  value: T
  /** 创建时间戳（毫秒） */
  createdAt: number
  /** TTL 存活时间（毫秒），0 表示永不过期 */
  ttl: number
  /** 命中次数 */
  hits: number
  /** 最后访问时间戳 */
  lastAccessed: number
}

/** 缓存统计接口 */
export interface CacheStats {
  /** 当前缓存条目数 */
  totalEntries: number
  /** 累计命中次数 */
  totalHits: number
  /** 累计未命中次数 */
  totalMisses: number
  /** 命中率（0-1） */
  hitRate: number
  /** 估算内存使用（字节） */
  memoryUsage: number
}

/** 缓存管理器选项 */
export interface CacheManagerOptions {
  /** 是否持久化到 localStorage */
  persist?: boolean
}

// ══════════════════════════════════════════════════
//  工具函数
// ══════════════════════════════════════════════════

/**
 * FNV-1a 哈希（用于缓存 key 生成）
 * @param input 输入字符串
 * @returns 8 字符十六进制哈希
 */
export function hashString(input: string): string {
  var h = 2166136261 >>> 0
  for (var i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  var hex = h.toString(16)
  while (hex.length < 8) {
    hex = '0' + hex
  }
  return hex
}

// ══════════════════════════════════════════════════
//  CacheManager 类
// ══════════════════════════════════════════════════

/**
 * 缓存管理器
 *
 * 支持命名空间、TTL、localStorage 持久化和命中率统计。
 * 所有实例自动注册到静态注册表，供 CacheReport 聚合。
 *
 * @example
 * var cache = new CacheManager('my-namespace', { persist: true })
 * cache.set('key', { data: 123 }, 60000) // TTL 60s
 * var val = cache.get<{ data: number }>('key')
 */
export class CacheManager {
  /** 内存存储 */
  private store: Map<string, CacheEntry> = new Map()

  /** 命名空间 */
  private namespace: string

  /** 是否持久化 */
  private persist: boolean

  /** 累计命中次数 */
  private totalHits = 0

  /** 累计未命中次数 */
  private totalMisses = 0

  /** localStorage key 前缀 */
  private storageKey: string

  /** 静态注册表（所有 CacheManager 实例） */
  private static registry: CacheManager[] = []

  constructor(namespace?: string, options?: CacheManagerOptions) {
    this.namespace = namespace || 'default'
    this.persist = options?.persist || false
    this.storageKey = 'xuanfengmen_cache_' + this.namespace

    // 注册到静态注册表
    CacheManager.registry.push(this)

    // 从 localStorage 加载
    if (this.persist) {
      this.loadFromStorage()
    }
  }

  // ─── 基础操作 ───────────────────────────────────

  /**
   * 获取缓存值
   * 自动检查 TTL，过期则删除并返回 undefined
   */
  get<T = unknown>(key: string): T | undefined {
    var fullKey = this.fullKey(key)
    var entry = this.store.get(fullKey)

    if (!entry) {
      this.totalMisses++
      return undefined
    }

    // 检查 TTL
    if (this.isExpired(entry)) {
      this.store.delete(fullKey)
      this.totalMisses++
      this.persistToStorage()
      return undefined
    }

    // 更新命中信息
    entry.hits++
    entry.lastAccessed = Date.now()
    this.totalHits++

    return entry.value as T
  }

  /**
   * 设置缓存值
   * @param key 缓存 key
   * @param value 缓存值
   * @param ttlMs 存活时间（毫秒），0 或不传表示永不过期
   */
  set<T = unknown>(key: string, value: T, ttlMs?: number): void {
    var fullKey = this.fullKey(key)
    var entry: CacheEntry = {
      key: fullKey,
      value,
      createdAt: Date.now(),
      ttl: ttlMs || 0,
      hits: 0,
      lastAccessed: Date.now(),
    }
    this.store.set(fullKey, entry)
    this.persistToStorage()
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    var fullKey = this.fullKey(key)
    var deleted = this.store.delete(fullKey)
    if (deleted) {
      this.persistToStorage()
    }
    return deleted
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.store.clear()
    this.persistToStorage()
  }

  /**
   * 检查缓存是否存在（检查 TTL）
   */
  has(key: string): boolean {
    var fullKey = this.fullKey(key)
    var entry = this.store.get(fullKey)
    if (!entry) {
      return false
    }
    if (this.isExpired(entry)) {
      this.store.delete(fullKey)
      this.persistToStorage()
      return false
    }
    return true
  }

  /**
   * 当前缓存数量
   */
  size(): number {
    return this.store.size
  }

  // ─── 统计与维护 ─────────────────────────────────

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    var totalEntries = this.store.size
    var total = this.totalHits + this.totalMisses
    var hitRate = total > 0 ? this.totalHits / total : 0

    // 估算内存使用
    var memoryUsage = 0
    this.store.forEach(function (entry) {
      try {
        memoryUsage += JSON.stringify(entry).length
      } catch {
        memoryUsage += 200 // 估算
      }
    })

    return {
      totalEntries,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      hitRate: Math.round(hitRate * 10000) / 10000,
      memoryUsage,
    }
  }

  /**
   * 清理过期缓存
   * @returns 清理的条目数
   */
  cleanup(): number {
    var removed = 0
    var keysToDelete: string[] = []

    this.store.forEach(function (entry, key) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key)
      }
    }.bind(this))

    for (var i = 0; i < keysToDelete.length; i++) {
      this.store.delete(keysToDelete[i])
      removed++
    }

    if (removed > 0) {
      this.persistToStorage()
    }

    return removed
  }

  /**
   * 获取命名空间
   */
  getNamespace(): string {
    return this.namespace
  }

  /**
   * 获取所有 key（不含命名空间前缀）
   */
  keys(): string[] {
    var keys: string[] = []
    var prefix = this.namespace === 'default' ? '' : this.namespace + ':'

    this.store.forEach(function (entry, fullKey) {
      if (prefix.length > 0 && fullKey.startsWith(prefix)) {
        keys.push(fullKey.substring(prefix.length))
      } else if (prefix.length === 0) {
        keys.push(fullKey)
      }
    })

    return keys
  }

  // ─── 静态方法 ───────────────────────────────────

  /**
   * 获取所有注册的 CacheManager 实例
   */
  static getRegistry(): CacheManager[] {
    return CacheManager.registry.slice()
  }

  /**
   * 清理所有注册缓存中的过期条目
   */
  static cleanupAll(): number {
    var total = 0
    for (var i = 0; i < CacheManager.registry.length; i++) {
      total += CacheManager.registry[i].cleanup()
    }
    return total
  }

  // ─── 内部实现 ───────────────────────────────────

  /**
   * 生成完整 key（含命名空间前缀）
   */
  private fullKey(key: string): string {
    if (this.namespace === 'default') {
      return key
    }
    return this.namespace + ':' + key
  }

  /**
   * 检查条目是否过期
   */
  private isExpired(entry: CacheEntry): boolean {
    if (entry.ttl <= 0) {
      return false
    }
    return Date.now() - entry.createdAt > entry.ttl
  }

  /**
   * 持久化到 localStorage
   */
  private persistToStorage(): void {
    if (!this.persist) return

    try {
      var entries: Array<{ key: string; entry: CacheEntry }> = []
      this.store.forEach(function (entry, key) {
        entries.push({ key, entry })
      })

      var payload = JSON.stringify({
        namespace: this.namespace,
        savedAt: Date.now(),
        entries,
      })

      localStorage.setItem(this.storageKey, payload)
    } catch {
      // localStorage 不可用或配额超限，静默忽略
    }
  }

  /**
   * 从 localStorage 加载
   */
  private loadFromStorage(): void {
    if (!this.persist) return

    try {
      var raw = localStorage.getItem(this.storageKey)
      if (!raw) return

      var parsed = JSON.parse(raw)
      if (!parsed || !Array.isArray(parsed.entries)) return

      for (var i = 0; i < parsed.entries.length; i++) {
        var item = parsed.entries[i]
        if (item && item.key && item.entry) {
          // 加载时检查是否已过期
          if (!this.isExpired(item.entry)) {
            this.store.set(item.key, item.entry)
          }
        }
      }
    } catch {
      // 解析失败，静默忽略
    }
  }
}

export default CacheManager
