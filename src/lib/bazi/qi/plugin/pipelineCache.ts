/**
 * P6-C Pipeline Cache — 三级缓存策略
 *
 * Level-1: Memory Cache — 重复命盘结果缓存（LRU）
 * Level-2: Rule Cache — RuleWeight / Rule 映射缓存
 * Level-3: Knowledge Cache — Classic / KnowledgeGraph / Explain 缓存
 *
 * 设计原则：
 *   - 缓存不得影响 Evidence 完整性
 *   - 缓存不得影响命理结果一致性
 *   - 缓存 key 基于输入参数的确定性哈希
 *   - 所有缓存条目带 TTL 过期
 */

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

/** 简单字符串哈希（djb2 变体） */
function hashString(str: string): string {
  var hash = 5381
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7FFFFFFF
  }
  return 'h' + hash.toString(36)
}

/** 生成缓存 key */
function makeCacheKey(parts: string[]): string {
  return parts.map(function(p) { return String(p) }).join('|')
}

// ═══════════════════════════════════════════════════════════
// LRU Cache 实现
// ═══════════════════════════════════════════════════════════

interface CacheEntry<T> {
  value: T
  createdAt: number
  lastAccessedAt: number
  ttl: number
}

class LRUCache<T> {
  private store: Map<string, CacheEntry<T>> = new Map()
  private maxSize: number
  private defaultTtl: number

  constructor(maxSize: number, defaultTtlMs: number) {
    this.maxSize = maxSize
    this.defaultTtl = defaultTtlMs
  }

  get(key: string): T | undefined {
    var entry = this.store.get(key)
    if (!entry) return undefined
    var now = Date.now()
    if (now - entry.createdAt > entry.ttl) {
      this.store.delete(key)
      return undefined
    }
    entry.lastAccessedAt = now
    // Move to end (most recently used) — 移到末尾，标记最近使用
    this.store.delete(key)
    this.store.set(key, entry)
    return entry.value
  }

  set(key: string, value: T, ttl?: number): void {
    // Evict if at capacity — 容量满时淘汰最早条目
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      var firstKey = this.store.keys().next().value
      if (firstKey !== undefined) {
        this.store.delete(firstKey)
      }
    }
    this.store.set(key, {
      value: value,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      ttl: ttl !== undefined ? ttl : this.defaultTtl,
    })
  }

  has(key: string): boolean {
    var entry = this.store.get(key)
    if (!entry) return false
    if (Date.now() - entry.createdAt > entry.ttl) {
      this.store.delete(key)
      return false
    }
    return true
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  get size(): number {
    return this.store.size
  }

  /** 获取缓存统计 */
  getStats(): { size: number; maxSize: number; defaultTtl: number } {
    // Clean expired — 清理过期条目
    var now = Date.now()
    this.store.forEach(function(entry, key) {
      if (now - entry.createdAt > entry.ttl) {
        this.store.delete(key)
      }
    }.bind(this))
    return { size: this.store.size, maxSize: this.maxSize, defaultTtl: this.defaultTtl }
  }
}

// ═══════════════════════════════════════════════════════════
// Level-1: Memory Cache（重复命盘缓存）
// ═══════════════════════════════════════════════════════════

/**
 * Level-1 缓存完整 Pipeline 结果。
 * 当相同输入（birthday + birthTime + gender）再次请求时，
 * 直接返回缓存的 PipelineReport，跳过全部 15 步。
 *
 * 不影响 Evidence：缓存的是最终结果，Evidence 数据完整保留。
 * TTL: 10 分钟（命盘数据不变，10 分钟内重复查询很常见）
 * maxSize: 50（同时缓存 50 个不同命盘）
 */
var memoryCache = new LRUCache<any>(50, 10 * 60 * 1000)

export function getMemoryCacheKey(input: { birthday: string; birthTime: string; gender: string }): string {
  return 'L1:' + hashString(makeCacheKey([input.birthday, input.birthTime, input.gender]))
}

export function getMemoryCachedReport(key: string): any | undefined {
  return memoryCache.get(key)
}

export function setMemoryCachedReport(key: string, report: any): void {
  memoryCache.set(key, report)
}

// ═══════════════════════════════════════════════════════════
// Level-2: Rule Cache（RuleWeight / Rule 映射缓存）
// ═══════════════════════════════════════════════════════════

/**
 * Level-2 缓存规则引擎的中间结果。
 * 当相同日主 + 月令再次查询时，复用格局判断和十神分析结果。
 *
 * 不影响命理结果：缓存的是纯计算结果，不修改 RuleWeight。
 * TTL: 30 分钟
 * maxSize: 200
 */
var ruleCache = new LRUCache<any>(200, 30 * 60 * 1000)

export function getRuleCacheKey(params: { dayGan: string; monthBranch: string; category: string }): string {
  return 'L2:' + hashString(makeCacheKey([params.dayGan, params.monthBranch, params.category]))
}

export function getCachedRuleResult(key: string): any | undefined {
  return ruleCache.get(key)
}

export function setCachedRuleResult(key: string, result: any): void {
  ruleCache.set(key, result)
}

// ═══════════════════════════════════════════════════════════
// Level-3: Knowledge Cache（Classic / KnowledgeGraph / Explain 缓存）
// ═══════════════════════════════════════════════════════════

/**
 * Level-3 缓存知识库查询结果。
 * - Classic: 古籍引用缓存（相同维度查询）
 * - KnowledgeGraph: 知识图谱查询缓存（相同关键词）
 * - Explain: Explain 结果缓存（相同结论 + 命盘哈希）
 *
 * 不影响 Evidence：Explain 缓存包含完整的 EvidenceItem 链。
 * TTL: 1 小时（知识库数据相对稳定）
 * maxSize: 100 per category
 */
var classicCache = new LRUCache<any>(100, 60 * 60 * 1000)
var knowledgeCache = new LRUCache<any>(100, 60 * 60 * 1000)
var explainCache = new LRUCache<any>(100, 30 * 60 * 1000)

export function getClassicCacheKey(dimension: string, subDimension?: string): string {
  var parts = [dimension]
  if (subDimension) parts.push(subDimension)
  return 'L3-classic:' + hashString(makeCacheKey(parts))
}

export function getCachedClassic(key: string): any | undefined {
  return classicCache.get(key)
}

export function setCachedClassic(key: string, result: any): void {
  classicCache.set(key, result)
}

export function getKnowledgeCacheKey(keyword: string): string {
  return 'L3-knowledge:' + hashString(keyword)
}

export function getCachedKnowledge(key: string): any | undefined {
  return knowledgeCache.get(key)
}

export function setCachedKnowledge(key: string, result: any): void {
  knowledgeCache.set(key, result)
}

export function getExplainCacheKey(conclusionHash: string): string {
  return 'L3-explain:' + conclusionHash
}

export function getCachedExplain(key: string): any | undefined {
  return explainCache.get(key)
}

export function setCachedExplain(key: string, result: any): void {
  explainCache.set(key, result)
}

// ═══════════════════════════════════════════════════════════
// Cache Management
// ═══════════════════════════════════════════════════════════

export function getCacheReport(): {
  level1: ReturnType<typeof memoryCache.getStats>
  level2: ReturnType<typeof ruleCache.getStats>
  level3Classic: ReturnType<typeof classicCache.getStats>
  level3Knowledge: ReturnType<typeof knowledgeCache.getStats>
  level3Explain: ReturnType<typeof explainCache.getStats>
} {
  return {
    level1: memoryCache.getStats(),
    level2: ruleCache.getStats(),
    level3Classic: classicCache.getStats(),
    level3Knowledge: knowledgeCache.getStats(),
    level3Explain: explainCache.getStats(),
  }
}

export function clearAllCaches(): void {
  memoryCache.clear()
  ruleCache.clear()
  classicCache.clear()
  knowledgeCache.clear()
  explainCache.clear()
}

/** Clear only expired entries across all caches — 清理所有缓存中的过期条目 */
export function evictExpired(): number {
  var before = memoryCache.size + ruleCache.size + classicCache.size + knowledgeCache.size + explainCache.size
  memoryCache.getStats() // 触发过期清理
  ruleCache.getStats()
  classicCache.getStats()
  knowledgeCache.getStats()
  explainCache.getStats()
  var after = memoryCache.size + ruleCache.size + classicCache.size + knowledgeCache.size + explainCache.size
  return before - after
}
