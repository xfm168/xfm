/**
 * PerformanceEngine — P3.16 性能引擎
 *
 * 纯 Plugin，不修改 Kernel。
 * 提供五级缓存体系（CaseCache / KnowledgeCache / ClassicCache / ExplainCache / BenchmarkCache）、
 * LRU 淘汰策略、TTL 过期检查、性能分析（profile）、性能仪表盘和中文报告生成。
 *
 * 古籍依据：
 *   《孙子兵法》："兵贵神速。" — 性能至上
 *   《道德经》："天下大事必作于细。" — 性能优化从细节入手
 *   《易经》："君子以自强不息。" — 持续优化
 *
 * 性能目标：
 *   - 普通命盘分析 ≤ 150ms
 *   - 复杂命盘分析 ≤ 300ms
 *   - Explain 生成 ≤ 500ms
 */

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

/** 从数组中随机选取一个元素 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 从数组中随机选取 N 个不重复元素 */
function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr]
  const result: T[] = []
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(Math.random() * copy.length)
    result.push(copy.splice(idx, 1)[0])
  }
  return result
}

/** 安全除法，分母为零返回 0 */
function safeDiv(a: number, b: number): number {
  return b === 0 ? 0 : a / b
}

/** 保留一位小数 */
function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** 格式化时间 */
function formatTime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 简单字符串哈希（djb2 变体） */
function simpleHash(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff
  }
  return hash >>> 0 // 转为无符号
}

/** 估算对象占用的字节数（UTF-16 编码，每字符 2 字节） */
function estimateSize(obj: unknown): number {
  try {
    return JSON.stringify(obj).length * 2
  } catch {
    return 256 // 序列化失败时的默认估算
  }
}

/** 限制数值在 [min, max] 范围内 */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** 格式化字节大小为人类可读字符串 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${round1(bytes / 1024)} KB`
  return `${round1(bytes / (1024 * 1024))} MB`
}

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** 缓存条目（泛型） */
export interface CacheEntry<T> {
  /** 缓存键 */
  key: string
  /** 缓存值 */
  value: T
  /** 创建时间戳 */
  createdAt: number
  /** 最后访问时间戳 */
  lastAccessedAt: number
  /** 访问次数 */
  accessCount: number
  /** 过期时间（毫秒） */
  ttl: number
  /** 估算字节大小 */
  size: number
}

/** 缓存配置 */
export interface CacheConfig {
  /** 最大条目数 */
  maxSize: number
  /** 默认过期时间（毫秒） */
  defaultTTL: number
  /** 最大内存占用（MB） */
  maxMemoryMB: number
}

/** 性能分析结果（单次操作） */
export interface PerformanceProfile {
  /** 操作名称 */
  operation: string
  /** 耗时（毫秒） */
  duration: number
  /** 内存使用量（字节） */
  memoryUsed: number
  /** 是否命中缓存 */
  cacheHit: boolean
  /** 缓存键（如有） */
  cacheKey?: string
  /** 时间戳 */
  timestamp: string
}

/** 缓存统计 */
export interface CacheStats {
  /** 命中次数 */
  hits: number
  /** 未命中次数 */
  misses: number
  /** 淘汰次数 */
  evictions: number
  /** 命中率 0-1 */
  hitRate: number
  /** 当前总条目数 */
  totalEntries: number
  /** 当前总内存（字节） */
  totalMemory: number
  /** 平均访问耗时（毫秒） */
  avgAccessTime: number
}

/** 性能仪表盘 */
export interface PerformanceDashboard {
  /** 生成时间 */
  generatedAt: string
  /** 性能分析记录 */
  profiles: PerformanceProfile[]
  /** 五种缓存各自的统计 */
  caches: {
    case: CacheStats
    knowledge: CacheStats
    classic: CacheStats
    explain: CacheStats
    benchmark: CacheStats
  }
  /** 性能目标达标情况 */
  targets: {
    /** 普通命盘分析 */
    normalChart: { target: number; current: number; passing: boolean }
    /** 复杂命盘分析 */
    complexChart: { target: number; current: number; passing: boolean }
    /** Explain 生成 */
    explain: { target: number; current: number; passing: boolean }
  }
  /** 总体评分 0-100 */
  overallScore: number
  /** 优化建议 */
  suggestions: string[]
  /** 报告 */
  report: string
  /** 古籍引用 */
  classicalRef: string
}

/** 案例缓存条目 */
export interface CaseCacheEntry {
  chartId: string
  similarCharts: Array<{ chartId: string; similarity: number; summary: string }>
  cachedAt: string
}

/** 知识图谱缓存条目 */
export interface KnowledgeCacheEntry {
  topic: string
  nodes: Array<{ id: string; type: string; name: string }>
  edges: Array<{ from: string; to: string; type: string }>
  inferences: string[]
  cachedAt: string
}

/** 古籍引用缓存条目 */
export interface ClassicCacheEntry {
  source: string
  text: string
  context: string
  relatedTopics: string[]
  cachedAt: string
}

/** Explain 缓存条目 */
export interface ExplainCacheEntry {
  chartId: string
  explainLayers: Record<string, string>
  totalLength: number
  cachedAt: string
}

/** Benchmark 缓存条目 */
export interface BenchmarkCacheEntry {
  caseId: string
  result: { expected: string; actual: string; match: boolean; score: number }
  cachedAt: string
}

// ═══════════════════════════════════════════════════════════
// 默认配置
// ═══════════════════════════════════════════════════════════

/** 默认缓存配置 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 500,
  defaultTTL: 30 * 60 * 1000, // 30 分钟
  maxMemoryMB: 50,
}

/** 各缓存的独立配置 */
const CACHE_CONFIGS: Record<string, Partial<CacheConfig>> = {
  case: { maxSize: 200, defaultTTL: 60 * 60 * 1000 },      // 1 小时
  knowledge: { maxSize: 100, defaultTTL: 2 * 60 * 60 * 1000 }, // 2 小时
  classic: { maxSize: 300, defaultTTL: 24 * 60 * 60 * 1000 }, // 24 小时
  explain: { maxSize: 150, defaultTTL: 30 * 60 * 1000 },     // 30 分钟
  benchmark: { maxSize: 100, defaultTTL: 60 * 60 * 1000 },   // 1 小时
}

/** 性能目标（毫秒） */
const PERF_TARGETS = {
  normalChart: 150,
  complexChart: 300,
  explain: 500,
} as const

/** 古籍引用池 */
const CLASSICAL_QUOTES: readonly string[] = [
  '《孙子兵法》："兵贵神速。" — 命盘分析当求快而不失准。',
  '《道德经》："天下大事必作于细。" — 性能优化从每一个缓存条目做起。',
  '《易经》："君子以自强不息。" — 系统性能永无止境，唯有持续精进。',
  '《孙子兵法》："知己知彼，百战不殆。" — 了解性能瓶颈方能精准优化。',
  '《道德经》："大音希声，大象无形。" — 最好的性能优化是无感知的。',
  '《论语》："工欲善其事，必先利其器。" — 缓存系统即八字分析的利器。',
  '《易经》："变则通，通则久。" — 性能调优需因势而变，方能持久。',
  '《道德经》："上善若水。" — 优秀的缓存系统如水般润滑无阻。',
]

/** 优化建议池 */
const SUGGESTION_POOL: readonly string[] = [
  '缓存命中率偏低，建议检查缓存键的生成策略，确保相似请求能命中同一缓存。',
  '内存占用接近上限，建议减小 defaultTTL 或降低 maxSize 以控制内存增长。',
  'Explain 缓存命中率不足 50%，可考虑增加缓存预热范围，将高频命盘提前加载。',
  'Knowledge 缓存淘汰频繁，建议增大 maxSize 或延长 TTL 以减少重复计算。',
  '古籍引用缓存命中率较高，当前配置合理，继续保持。',
  'Benchmark 缓存条目较少，建议批量预热历史案例结果以提升系统响应速度。',
  '普通命盘分析耗时超标，建议排查核心计算模块，重点优化格局判定与用神推算。',
  '复杂命盘分析耗时超标，建议对通关心法、疾病推算等重模块增加缓存层级。',
  '缓存内存效率偏低（实际占用 / 最大限制 < 30%），当前配置偏保守，可适当放宽。',
  '预热覆盖率不足，建议在系统启动时加载 Top-50 高频命盘的完整缓存。',
  'LRU 淘汰集中在单一缓存类型上，建议重新平衡各缓存的 maxSize 分配。',
  '平均访问耗时波动较大，建议检查 GC 压力或是否存在锁竞争问题。',
]

// ═══════════════════════════════════════════════════════════
// GenericCache<T> — 泛型缓存类
// ═══════════════════════════════════════════════════════════

/**
 * 泛型缓存类，支持 LRU 淘汰、TTL 过期检查和内存估算。
 * 可独立于 PerformanceEngine 使用。
 */
export class GenericCache<T> {
  /** 缓存名称（用于统计和日志） */
  private readonly name: string
  /** 缓存存储 */
  private readonly store: Map<string, CacheEntry<T>> = new Map()
  /** LRU 访问顺序（最近使用的在尾部） */
  private readonly accessOrder: string[] = []
  /** 缓存配置 */
  private readonly config: CacheConfig
  /** 命中次数 */
  private _hits: number = 0
  /** 未命中次数 */
  private _misses: number = 0
  /** 淘汰次数 */
  private _evictions: number = 0
  /** 累计访问耗时（用于计算平均值） */
  private _totalAccessTime: number = 0
  /** 预热键集合 */
  private warmedKeys: Set<string> = new Set()

  constructor(name: string, config?: Partial<CacheConfig>) {
    this.name = name
    this.config = {
      ...DEFAULT_CACHE_CONFIG,
      ...config,
    }
  }

  /** 获取缓存值，TTL 过期自动删除 */
  get(key: string): T | null {
    const start = performance.now()
    const entry = this.store.get(key)

    if (!entry) {
      this._misses++
      this._totalAccessTime += performance.now() - start
      return null
    }

    // 检查 TTL 是否过期
    const now = Date.now()
    if (now - entry.createdAt > entry.ttl) {
      this.delete(key)
      this._misses++
      this._totalAccessTime += performance.now() - start
      return null
    }

    // 更新访问信息
    entry.lastAccessedAt = now
    entry.accessCount++

    // 更新 LRU 顺序（移至尾部）
    this.updateAccessOrder(key)

    this._hits++
    this._totalAccessTime += performance.now() - start
    return entry.value
  }

  /** 设置缓存值 */
  set(key: string, value: T, ttl?: number): void {
    const size = estimateSize(value)
    const now = Date.now()

    // 如果已存在则先删除旧条目
    if (this.store.has(key)) {
      this.delete(key)
    }

    // 检查内存限制，必要时淘汰
    this.evictIfNeeded(size)

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      ttl: ttl ?? this.config.defaultTTL,
      size,
    }

    this.store.set(key, entry)
    this.accessOrder.push(key)
  }

  /** 删除缓存条目 */
  delete(key: string): boolean {
    const existed = this.store.delete(key)
    if (existed) {
      // 从 LRU 顺序中移除
      const idx = this.accessOrder.indexOf(key)
      if (idx !== -1) {
        this.accessOrder.splice(idx, 1)
      }
    }
    return existed
  }

  /** 清空缓存 */
  clear(): void {
    this.store.clear()
    this.accessOrder.length = 0
    this.warmedKeys.clear()
  }

  /** 检查键是否存在且未过期 */
  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false

    // 检查 TTL
    if (Date.now() - entry.createdAt > entry.ttl) {
      this.delete(key)
      return false
    }
    return true
  }

  /** 获取缓存统计信息 */
  getStats(): CacheStats {
    const totalEntries = this.store.size
    let totalMemory = 0
    for (const entry of this.store.values()) {
      totalMemory += entry.size
    }
    const total = this._hits + this._misses
    const avgAccessTime = total > 0 ? this._totalAccessTime / total : 0

    return {
      hits: this._hits,
      misses: this._misses,
      evictions: this._evictions,
      hitRate: safeDiv(this._hits, total),
      totalEntries,
      totalMemory,
      avgAccessTime: round1(avgAccessTime),
    }
  }

  /**
   * 获取缓存值；若未命中则自动计算并缓存。
   * 这是最常用的缓存访问模式。
   */
  getOrCompute(key: string, computeFn: () => T, ttl?: number): T {
    const cached = this.get(key)
    if (cached !== null) {
      return cached
    }
    // 未命中，调用计算函数
    const value = computeFn()
    this.set(key, value, ttl)
    return value
  }

  /** 重置统计数据（保留缓存内容） */
  resetStats(): void {
    this._hits = 0
    this._misses = 0
    this._evictions = 0
    this._totalAccessTime = 0
  }

  /** 获取缓存条目数量 */
  get size(): number {
    return this.store.size
  }

  /** 获取缓存名称 */
  getName(): string {
    return this.name
  }

  /** 获取预热键集合 */
  getWarmedKeys(): Set<string> {
    return new Set(this.warmedKeys)
  }

  /** 标记键为已预热 */
  markWarmed(key: string): void {
    this.warmedKeys.add(key)
  }

  // ─── 内部方法 ───────────────────────────────────────────

  /** 更新 LRU 访问顺序，将指定键移至尾部 */
  private updateAccessOrder(key: string): void {
    const idx = this.accessOrder.indexOf(key)
    if (idx !== -1) {
      this.accessOrder.splice(idx, 1)
    }
    this.accessOrder.push(key)
  }

  /** 检查并执行 LRU 淘汰，确保不超限 */
  private evictIfNeeded(newEntrySize: number): void {
    const maxMemoryBytes = this.config.maxMemoryMB * 1024 * 1024

    // 循环淘汰直到满足限制条件
    while (this.accessOrder.length > 0) {
      // 检查条目数限制
      const overCount = this.store.size >= this.config.maxSize
      // 检查内存限制
      let currentMemory = 0
      for (const entry of this.store.values()) {
        currentMemory += entry.size
      }
      const overMemory = (currentMemory + newEntrySize) > maxMemoryBytes

      if (!overCount && !overMemory) break

      // 淘汰最久未使用的条目（LRU 头部）
      const lruKey = this.accessOrder.shift()!
      this.store.delete(lruKey)
      this._evictions++
    }
  }
}

// ═══════════════════════════════════════════════════════════
// PerformanceEngine — 性能引擎主类
// ═══════════════════════════════════════════════════════════

/**
 * 性能引擎 — P3.16 核心 Plugin
 *
 * 功能：
 *   1. 五级缓存体系（Case / Knowledge / Classic / Explain / Benchmark）
 *   2. 性能分析（profile）
 *   3. 性能仪表盘与中文报告
 *   4. 缓存预热
 */
export class PerformanceEngine {
  /** 案例缓存 */
  readonly caseCache: GenericCache<CaseCacheEntry>
  /** 知识图谱缓存 */
  readonly knowledgeCache: GenericCache<KnowledgeCacheEntry>
  /** 古籍引用缓存 */
  readonly classicCache: GenericCache<ClassicCacheEntry>
  /** Explain 结果缓存 */
  readonly explainCache: GenericCache<ExplainCacheEntry>
  /** Benchmark 结果缓存 */
  readonly benchmarkCache: GenericCache<BenchmarkCacheEntry>

  /** 性能分析记录 */
  private readonly profiles: PerformanceProfile[] = []
  /** 分析记录最大条数 */
  private readonly maxProfiles: number = 1000

  constructor() {
    this.caseCache = new GenericCache<CaseCacheEntry>('case', CACHE_CONFIGS.case)
    this.knowledgeCache = new GenericCache<KnowledgeCacheEntry>('knowledge', CACHE_CONFIGS.knowledge)
    this.classicCache = new GenericCache<ClassicCacheEntry>('classic', CACHE_CONFIGS.classic)
    this.explainCache = new GenericCache<ExplainCacheEntry>('explain', CACHE_CONFIGS.explain)
    this.benchmarkCache = new GenericCache<BenchmarkCacheEntry>('benchmark', CACHE_CONFIGS.benchmark)
  }

  // ─── 性能分析 ────────────────────────────────────────────

  /**
   * 分析函数执行性能，返回结果和性能记录。
   * 自动测量耗时和内存使用。
   */
  profile<T>(operation: string, fn: () => T): { result: T; profile: PerformanceProfile } {
    const memBefore = this.estimateCurrentMemory()
    const start = performance.now()

    const result = fn()

    const duration = performance.now() - start
    const memAfter = this.estimateCurrentMemory()
    const memoryUsed = Math.max(0, memAfter - memBefore)

    const profileRecord: PerformanceProfile = {
      operation,
      duration: round1(duration),
      memoryUsed,
      cacheHit: false,
      timestamp: formatTime(new Date()),
    }

    this.addProfile(profileRecord)
    return { result, profile: profileRecord }
  }

  // ─── 案例缓存便捷方法 ────────────────────────────────────

  /** 获取缓存的相似案例 */
  getCachedCase(chartId: string): CaseCacheEntry | null {
    const key = this.generateKey('case', chartId)
    const entry = this.caseCache.get(key)
    this.recordCacheAccess('case', key, entry !== null)
    return entry
  }

  /** 设置相似案例缓存 */
  setCachedCase(chartId: string, data: CaseCacheEntry): void {
    const key = this.generateKey('case', chartId)
    this.caseCache.set(key, data)
  }

  // ─── 知识图谱缓存便捷方法 ────────────────────────────────

  /** 获取缓存的知识图谱 */
  getCachedKnowledge(topic: string): KnowledgeCacheEntry | null {
    const key = this.generateKey('knowledge', topic)
    const entry = this.knowledgeCache.get(key)
    this.recordCacheAccess('knowledge', key, entry !== null)
    return entry
  }

  /** 设置知识图谱缓存 */
  setCachedKnowledge(topic: string, data: KnowledgeCacheEntry): void {
    const key = this.generateKey('knowledge', topic)
    this.knowledgeCache.set(key, data)
  }

  // ─── 古籍引用缓存便捷方法 ────────────────────────────────

  /** 获取缓存的古籍引用 */
  getCachedClassic(source: string): ClassicCacheEntry | null {
    const key = this.generateKey('classic', source)
    const entry = this.classicCache.get(key)
    this.recordCacheAccess('classic', key, entry !== null)
    return entry
  }

  /** 设置古籍引用缓存 */
  setCachedClassic(source: string, data: ClassicCacheEntry): void {
    const key = this.generateKey('classic', source)
    this.classicCache.set(key, data)
  }

  // ─── Explain 缓存便捷方法 ───────────────────────────────

  /** 获取缓存的 Explain 结果 */
  getCachedExplain(chartId: string): ExplainCacheEntry | null {
    const key = this.generateKey('explain', chartId)
    const entry = this.explainCache.get(key)
    this.recordCacheAccess('explain', key, entry !== null)
    return entry
  }

  /** 设置 Explain 缓存 */
  setCachedExplain(chartId: string, data: ExplainCacheEntry): void {
    const key = this.generateKey('explain', chartId)
    this.explainCache.set(key, data)
  }

  // ─── Benchmark 缓存便捷方法 ─────────────────────────────

  /** 获取缓存的 Benchmark 结果 */
  getCachedBenchmark(caseId: string): BenchmarkCacheEntry | null {
    const key = this.generateKey('benchmark', caseId)
    const entry = this.benchmarkCache.get(key)
    this.recordCacheAccess('benchmark', key, entry !== null)
    return entry
  }

  /** 设置 Benchmark 缓存 */
  setCachedBenchmark(caseId: string, data: BenchmarkCacheEntry): void {
    const key = this.generateKey('benchmark', caseId)
    this.benchmarkCache.set(key, data)
  }

  // ─── 缓存键生成 ────────────────────────────────────────

  /**
   * 生成缓存键：将多个部分拼接后进行哈希。
   * 确保不同维度的参数组合生成唯一键。
   */
  generateKey(...parts: string[]): string {
    const raw = parts.join('|')
    const hash = simpleHash(raw).toString(16).padStart(8, '0')
    // 组合原始前缀（便于调试）和哈希值
    const prefix = parts.length > 0 ? parts[0] : 'key'
    return `${prefix}:${hash}`
  }

  // ─── 缓存统计 ───────────────────────────────────────────

  /** 获取所有缓存的统计信息 */
  getAllStats(): {
    case: CacheStats
    knowledge: CacheStats
    classic: CacheStats
    explain: CacheStats
    benchmark: CacheStats
  } {
    return {
      case: this.caseCache.getStats(),
      knowledge: this.knowledgeCache.getStats(),
      classic: this.classicCache.getStats(),
      explain: this.explainCache.getStats(),
      benchmark: this.benchmarkCache.getStats(),
    }
  }

  // ─── 性能仪表盘 ──────────────────────────────────────────

  /**
   * 生成性能仪表盘，包含完整统计、评分和中文报告。
   */
  getDashboard(): PerformanceDashboard {
    const allStats = this.getAllStats()

    // 计算各性能目标的当前值
    const normalChartTimes = this.getRecentDurations('normalChart')
    const complexChartTimes = this.getRecentDurations('complexChart')
    const explainTimes = this.getRecentDurations('explain')

    const targets = {
      normalChart: {
        target: PERF_TARGETS.normalChart,
        current: normalChartTimes.length > 0 ? round1(avg(normalChartTimes)) : 0,
        passing: normalChartTimes.length > 0 && avg(normalChartTimes) <= PERF_TARGETS.normalChart,
      },
      complexChart: {
        target: PERF_TARGETS.complexChart,
        current: complexChartTimes.length > 0 ? round1(avg(complexChartTimes)) : 0,
        passing: complexChartTimes.length > 0 && avg(complexChartTimes) <= PERF_TARGETS.complexChart,
      },
      explain: {
        target: PERF_TARGETS.explain,
        current: explainTimes.length > 0 ? round1(avg(explainTimes)) : 0,
        passing: explainTimes.length > 0 && avg(explainTimes) <= PERF_TARGETS.explain,
      },
    }

    // 计算总体评分
    const overallScore = this.calculateOverallScore(allStats, targets)

    // 生成优化建议
    const suggestions = this.generateSuggestions(allStats, targets)

    // 随机选择古籍引用
    const classicalRef = pick(CLASSICAL_QUOTES)

    // 生成中文报告
    const report = this.generateReport(allStats, targets, overallScore, suggestions, classicalRef)

    return {
      generatedAt: formatTime(new Date()),
      profiles: [...this.profiles],
      caches: allStats,
      targets,
      overallScore,
      suggestions,
      report,
      classicalRef,
    }
  }

  // ─── 缓存管理 ───────────────────────────────────────────

  /** 清除所有缓存 */
  clearAll(): void {
    this.caseCache.clear()
    this.knowledgeCache.clear()
    this.classicCache.clear()
    this.explainCache.clear()
    this.benchmarkCache.clear()
    this.profiles.length = 0
  }

  /**
   * 预热缓存：将指定键标记为已预热状态。
   * 实际预热逻辑由调用者实现（通过 set 方法写入缓存后调用此方法标记）。
   *
   * @param keys 格式为 "缓存类型:键" 的字符串数组
   */
  warmup(keys: string[]): void {
    for (const key of keys) {
      const [cacheType, ...rest] = key.split(':')
      const actualKey = rest.join(':')

      switch (cacheType) {
        case 'case':
          this.caseCache.markWarmed(actualKey)
          break
        case 'knowledge':
          this.knowledgeCache.markWarmed(actualKey)
          break
        case 'classic':
          this.classicCache.markWarmed(actualKey)
          break
        case 'explain':
          this.explainCache.markWarmed(actualKey)
          break
        case 'benchmark':
          this.benchmarkCache.markWarmed(actualKey)
          break
        default:
          // 未知的缓存类型，跳过
          break
      }
    }
  }

  // ─── 内部方法 ────────────────────────────────────────────

  /** 估算当前进程的内存使用量（字节） */
  private estimateCurrentMemory(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    // 浏览器环境降级：返回 0
    return 0
  }

  /** 添加性能分析记录（自动维持最大条数） */
  private addProfile(profile: PerformanceProfile): void {
    this.profiles.push(profile)
    if (this.profiles.length > this.maxProfiles) {
      this.profiles.splice(0, this.profiles.length - this.maxProfiles)
    }
  }

  /** 记录缓存访问（在便捷方法中调用，用于标记 profile 中的缓存命中状态） */
  private recordCacheAccess(cacheType: string, key: string, hit: boolean): void {
    // 在最近的 profile 记录中更新缓存命中信息
    if (this.profiles.length > 0) {
      const lastProfile = this.profiles[this.profiles.length - 1]
      if (!lastProfile.cacheHit) {
        lastProfile.cacheHit = hit
        lastProfile.cacheKey = key
      }
    }
  }

  /** 获取最近 N 次指定操作的耗时 */
  private getRecentDurations(operation: string, limit: number = 50): number[] {
    return this.profiles
      .filter(p => p.operation === operation)
      .slice(-limit)
      .map(p => p.duration)
  }

  /**
   * 计算总体性能评分（0-100）
   *
   * 权重分配：
   *   - 缓存命中率 30%
   *   - 平均响应时间 40%
   *   - 内存效率 15%
   *   - 预热覆盖率 15%
   */
  private calculateOverallScore(
    allStats: ReturnType<typeof this.getAllStats>,
    targets: PerformanceDashboard['targets']
  ): number {
    // 1. 缓存命中率评分（30%）
    const cacheHitRates = [
      allStats.case.hitRate,
      allStats.knowledge.hitRate,
      allStats.classic.hitRate,
      allStats.explain.hitRate,
      allStats.benchmark.hitRate,
    ]
    const avgHitRate = avg(cacheHitRates)
    const hitRateScore = clamp(avgHitRate * 100, 0, 100) // 0-100

    // 2. 平均响应时间评分（40%）
    // 根据三个性能目标的达标情况评分
    const targetChecks = [
      targets.normalChart,
      targets.complexChart,
      targets.explain,
    ]
    // 达标的目标数占比 * 100
    const passedCount = targetChecks.filter(t => t.passing).length
    const noDataCount = targetChecks.filter(t => t.current === 0).length
    let responseScore: number
    if (noDataCount === targetChecks.length) {
      // 无数据时给中性分
      responseScore = 50
    } else {
      // 有数据的项中达标的比例
      const evaluatedCount = targetChecks.length - noDataCount
      const evaluatedPassed = targetChecks.filter(t => t.current > 0 && t.passing).length
      // 进一步考虑超标程度
      let overRatio = 0
      for (const t of targetChecks) {
        if (t.current > 0 && !t.passing) {
          overRatio += safeDiv(t.current - t.target, t.target)
        }
      }
      overRatio = safeDiv(overRatio, evaluatedCount)
      responseScore = clamp(
        safeDiv(evaluatedPassed, evaluatedCount) * 100 - overRatio * 20,
        0, 100
      )
    }

    // 3. 内存效率评分（15%）
    // 所有缓存的总内存 / 所有缓存的最大内存限制
    const totalMemory = Object.values(allStats).reduce((s, cs) => s + cs.totalMemory, 0)
    const maxMemoryBytes = 5 * DEFAULT_CACHE_CONFIG.maxMemoryMB * 1024 * 1024
    const memoryRatio = clamp(safeDiv(totalMemory, maxMemoryBytes), 0, 1)
    // 内存利用率在 30%-70% 之间最佳
    let memoryScore: number
    if (memoryRatio === 0) {
      memoryScore = 50 // 无数据
    } else if (memoryRatio < 0.3) {
      memoryScore = 60 // 利用率偏低
    } else if (memoryRatio <= 0.7) {
      memoryScore = 90 // 理想区间
    } else {
      memoryScore = clamp(100 - (memoryRatio - 0.7) * 100, 30, 100) // 接近上限，扣分
    }

    // 4. 预热覆盖率评分（15%）
    const caches = [this.caseCache, this.knowledgeCache, this.classicCache, this.explainCache, this.benchmarkCache]
    let warmupCoverage = 0
    let cacheCount = 0
    for (const cache of caches) {
      const stats = cache.getStats()
      if (stats.totalEntries > 0) {
        const warmed = cache.getWarmedKeys().size
        warmupCoverage += safeDiv(warmed, stats.totalEntries)
        cacheCount++
      }
    }
    const warmupScore = cacheCount > 0
      ? clamp(safeDiv(warmupCoverage, cacheCount) * 100, 0, 100)
      : 50

    // 加权总分
    const overall = clamp(
      hitRateScore * 0.30 +
      responseScore * 0.40 +
      memoryScore * 0.15 +
      warmupScore * 0.15,
      0, 100
    )

    return round1(overall)
  }

  /** 生成优化建议 */
  private generateSuggestions(
    allStats: ReturnType<typeof this.getAllStats>,
    targets: PerformanceDashboard['targets']
  ): string[] {
    const suggestions: string[] = []
    const scoreMap = new Map<string, number>()

    // 分析各缓存的命中率
    for (const [name, stats] of Object.entries(allStats)) {
      if (stats.hitRate < 0.3 && stats.totalEntries > 10) {
        scoreMap.set(`${name}_lowHitRate`, 0)
      }
      if (stats.evictions > stats.totalEntries * 0.5 && stats.totalEntries > 0) {
        scoreMap.set(`${name}_highEviction`, 0)
      }
    }

    // 分析性能目标
    if (!targets.normalChart.passing && targets.normalChart.current > 0) {
      scoreMap.set('normalChart_slow', 0)
    }
    if (!targets.complexChart.passing && targets.complexChart.current > 0) {
      scoreMap.set('complexChart_slow', 0)
    }
    if (!targets.explain.passing && targets.explain.current > 0) {
      scoreMap.set('explain_slow', 0)
    }

    // 分析内存效率
    const totalMemory = Object.values(allStats).reduce((s, cs) => s + cs.totalMemory, 0)
    const maxMemoryBytes = 5 * DEFAULT_CACHE_CONFIG.maxMemoryMB * 1024 * 1024
    const memoryRatio = safeDiv(totalMemory, maxMemoryBytes)
    if (memoryRatio > 0.8) {
      scoreMap.set('highMemory', 0)
    }
    if (memoryRatio < 0.2 && totalMemory > 0) {
      scoreMap.set('lowMemory', 0)
    }

    // 从建议池中筛选匹配项
    const poolTexts = [...SUGGESTION_POOL]
    for (const key of scoreMap.keys()) {
      if (key.includes('lowHitRate') || key.includes('highEviction')) {
        const match = poolTexts.find(s =>
          s.includes('缓存命中率') || s.includes('淘汰频繁') || s.includes('缓存键')
        )
        if (match) suggestions.push(match)
      }
      if (key.includes('slow')) {
        if (key.includes('normalChart')) {
          const match = poolTexts.find(s => s.includes('普通命盘'))
          if (match) suggestions.push(match)
        }
        if (key.includes('complexChart')) {
          const match = poolTexts.find(s => s.includes('复杂命盘'))
          if (match) suggestions.push(match)
        }
        if (key.includes('explain')) {
          const match = poolTexts.find(s => s.includes('Explain'))
          if (match) suggestions.push(match)
        }
      }
      if (key === 'highMemory') {
        const match = poolTexts.find(s => s.includes('内存占用'))
        if (match) suggestions.push(match)
      }
      if (key === 'lowMemory') {
        const match = poolTexts.find(s => s.includes('内存效率'))
        if (match) suggestions.push(match)
      }
    }

    // 如果没有具体问题，给出正面建议
    if (suggestions.length === 0) {
      suggestions.push(pick([
        '当前系统性能良好，各项指标均在目标范围内。',
        '缓存系统运行正常，命中率良好，继续保持。',
        '性能指标表现优秀，建议持续监控以确保稳定。',
      ]))
    }

    // 随机补充 1-2 条通用建议
    const extras = pickN(
      SUGGESTION_POOL.filter(s => !suggestions.includes(s)),
      Math.min(2, 3 - suggestions.length)
    )
    suggestions.push(...extras)

    // 去重并限制数量
    return [...new Set(suggestions)].slice(0, 5)
  }

  /** 生成中文性能报告 */
  private generateReport(
    allStats: ReturnType<typeof this.getAllStats>,
    targets: PerformanceDashboard['targets'],
    overallScore: number,
    suggestions: string[],
    classicalRef: string
  ): string {
    const lines: string[] = []

    lines.push('══════════════════════════════════════════════════')
    lines.push('            玄风门 · 性能引擎报告')
    lines.push('══════════════════════════════════════════════════')
    lines.push('')

    // ── 一、性能概览 ──
    lines.push('【一、性能概览】')
    lines.push(`  总体评分：${overallScore} / 100`)
    lines.push(`  评级：${this.getScoreGrade(overallScore)}`)
    lines.push('')

    // ── 二、性能目标达标情况 ──
    lines.push('【二、性能目标达标情况】')
    lines.push(`  普通命盘分析：目标 ≤ ${targets.normalChart.target}ms，当前 ${targets.normalChart.current}ms ${targets.normalChart.passing ? '✓ 达标' : targets.normalChart.current > 0 ? '✗ 超标' : '— 无数据'}`)
    lines.push(`  复杂命盘分析：目标 ≤ ${targets.complexChart.target}ms，当前 ${targets.complexChart.current}ms ${targets.complexChart.passing ? '✓ 达标' : targets.complexChart.current > 0 ? '✗ 超标' : '— 无数据'}`)
    lines.push(`  Explain 生成：目标 ≤ ${targets.explain.target}ms，当前 ${targets.explain.current}ms ${targets.explain.passing ? '✓ 达标' : targets.explain.current > 0 ? '✗ 超标' : '— 无数据'}`)
    lines.push('')

    // ── 三、各缓存统计 ──
    lines.push('【三、各缓存统计】')
    const cacheLabels: Array<{ key: keyof typeof allStats; label: string }> = [
      { key: 'case', label: '案例缓存 (CaseCache)' },
      { key: 'knowledge', label: '知识图谱缓存 (KnowledgeCache)' },
      { key: 'classic', label: '古籍引用缓存 (ClassicCache)' },
      { key: 'explain', label: 'Explain缓存 (ExplainCache)' },
      { key: 'benchmark', label: 'Benchmark缓存 (BenchmarkCache)' },
    ]
    for (const { key, label } of cacheLabels) {
      const stats = allStats[key]
      const hitPct = round1(stats.hitRate * 100)
      lines.push(`  ┌ ${label}`)
      lines.push(`  │   命中率：${hitPct}%（命中 ${stats.hits} / 未命中 ${stats.misses}）`)
      lines.push(`  │   条目数：${stats.totalEntries}`)
      lines.push(`  │   内存占用：${formatBytes(stats.totalMemory)}`)
      lines.push(`  │   淘汰次数：${stats.evictions}`)
      lines.push(`  │   平均访问耗时：${stats.avgAccessTime}ms`)
      lines.push(`  └──────────────────────────────────`)
    }
    lines.push('')

    // ── 四、优化建议 ──
    lines.push('【四、优化建议】')
    if (suggestions.length > 0) {
      suggestions.forEach((s, i) => {
        lines.push(`  ${i + 1}. ${s}`)
      })
    } else {
      lines.push('  当前无需特别优化，各项指标表现良好。')
    }
    lines.push('')

    // ── 五、古籍引用 ──
    lines.push('【五、古籍引用】')
    lines.push(`  ${classicalRef}`)
    lines.push('')

    lines.push('══════════════════════════════════════════════════')
    lines.push(`  报告生成时间：${formatTime(new Date())}`)
    lines.push('══════════════════════════════════════════════════')

    return lines.join('\n')
  }

  /** 根据评分获取评级文字 */
  private getScoreGrade(score: number): string {
    if (score >= 90) return '优秀（甲等）'
    if (score >= 80) return '良好（乙等）'
    if (score >= 70) return '中等（丙等）'
    if (score >= 60) return '及格（丁等）'
    return '不及格（需紧急优化）'
  }
}

// ═══════════════════════════════════════════════════════════
// 辅助：数组平均值
// ═══════════════════════════════════════════════════════════

/** 计算数组平均值（空数组返回 0） */
function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}
