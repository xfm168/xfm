/**
 * H2: 统一缓存统计
 * 
 * 跟踪所有缓存层的命中/未命中/淘汰/过期/大小等指标。
 * 支持按命名空间分别统计。
 */

export interface CacheMetricsSnapshot {
  /** 缓存层标识（memory / indexeddb / localstorage） */
  tier: string
  /** 总命中 */
  hits: number
  /** 总未命中 */
  misses: number
  /** 淘汰数 */
  evictions: number
  /** 过期数 */
  expired: number
  /** 当前大小 */
  size: number
  /** 命中率 0-1 */
  hitRate: number
  /** 总读耗时 ms */
  totalReadTime: number
  /** 总写耗时 ms */
  totalWriteTime: number
  /** 平均读耗时 ms */
  avgReadTime: number
  /** 平均写耗时 ms */
  avgWriteTime: number
  /** clear 调用次数 */
  clearCount: number
  /** 按 namespace 的细分 */
  byNamespace: Record<string, CacheMetricsSnapshot>
}

export class CacheMetrics {
  private stats: Map<string, {
    hits: number
    misses: number
    evictions: number
    expired: number
    size: number
    totalReadTime: number
    totalWriteTime: number
    readCount: number
    writeCount: number
    clearCount: number
  }> = new Map()

  private defaultStats() {
    return {
      hits: 0, misses: 0, evictions: 0, expired: 0, size: 0,
      totalReadTime: 0, totalWriteTime: 0, readCount: 0, writeCount: 0, clearCount: 0,
    }
  }

  private getOrCreate(key: string) {
    if (!this.stats.has(key)) this.stats.set(key, this.defaultStats())
    return this.stats.get(key)!
  }

  recordHit(tier: string, readTimeMs: number, namespace?: string): void {
    const s = this.getOrCreate(tier)
    s.hits++
    s.totalReadTime += readTimeMs
    s.readCount++
    if (namespace) {
      const ns = this.getOrCreate(`${tier}:${namespace}`)
      ns.hits++
      ns.totalReadTime += readTimeMs
      ns.readCount++
    }
  }

  recordMiss(tier: string, readTimeMs: number, namespace?: string): void {
    const s = this.getOrCreate(tier)
    s.misses++
    s.totalReadTime += readTimeMs
    s.readCount++
    if (namespace) {
      const ns = this.getOrCreate(`${tier}:${namespace}`)
      ns.misses++
      ns.totalReadTime += readTimeMs
      ns.readCount++
    }
  }

  recordEviction(tier: string, namespace?: string): void {
    this.getOrCreate(tier).evictions++
    if (namespace) this.getOrCreate(`${tier}:${namespace}`).evictions++
  }

  recordExpiration(tier: string, namespace?: string): void {
    this.getOrCreate(tier).expired++
    if (namespace) this.getOrCreate(`${tier}:${namespace}`).expired++
  }

  recordClear(tier: string): void {
    this.getOrCreate(tier).clearCount++
  }

  setSize(tier: string, size: number): void {
    this.getOrCreate(tier).size = size
  }

  recordWrite(tier: string, writeTimeMs: number, namespace?: string): void {
    const s = this.getOrCreate(tier)
    s.totalWriteTime += writeTimeMs
    s.writeCount++
    if (namespace) {
      const ns = this.getOrCreate(`${tier}:${namespace}`)
      ns.totalWriteTime += writeTimeMs
      ns.writeCount++
    }
  }

  getSnapshot(tier: string): CacheMetricsSnapshot {
    const s = this.getOrCreate(tier)
    const total = s.hits + s.misses
    return {
      tier,
      hits: s.hits,
      misses: s.misses,
      evictions: s.evictions,
      expired: s.expired,
      size: s.size,
      hitRate: total > 0 ? s.hits / total : 0,
      totalReadTime: s.totalReadTime,
      totalWriteTime: s.totalWriteTime,
      avgReadTime: s.readCount > 0 ? s.totalReadTime / s.readCount : 0,
      avgWriteTime: s.writeCount > 0 ? s.totalWriteTime / s.writeCount : 0,
      clearCount: s.clearCount,
      byNamespace: {},
    }
  }

  /** 获取所有缓存层的汇总 */
  getAllSnapshots(): CacheMetricsSnapshot[] {
    const tiers = ['memory', 'indexeddb', 'localstorage']
    return tiers.map(t => this.getSnapshot(t))
  }

  reset(): void {
    this.stats.clear()
  }
}
