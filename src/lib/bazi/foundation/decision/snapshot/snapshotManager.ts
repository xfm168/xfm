// 决策快照管理器 —— 每次 Decision 自动保存快照，支持 Replay 重放
// 任何 Bug 都可以通过 Replay 复现

// ============================================================
// 类型定义
// ============================================================

/** 决策快照 */
export interface DecisionSnapshot {
  /** 唯一 ID */
  snapshotId: string
  /** 关联命例 */
  caseId?: string
  /** 输入（SubEngineInput） */
  input: any
  /** 输出（DecisionResult） */
  output: any
  /** 使用的策略 */
  strategy?: string
  /** 各引擎权重 */
  engineWeights?: Record<string, number>
  /** 证据链 */
  evidence?: any[]
  /** 时间戳 */
  timestamp: number
  /** 决策引擎版本 */
  version: string
  /** 元数据 */
  metadata?: Record<string, any>
}

/** Replay 返回结果 */
export interface ReplayResult {
  success: boolean
  result?: any
  error?: string
  diff?: { field: string; expected: any; actual: any }[] | null
}

/** 批量 Replay 结果 */
export interface BatchReplayResult {
  total: number
  passed: number
  failed: number
  diffs: any[]
}

/** 快照统计信息 */
export interface SnapshotStats {
  totalSnapshots: number
  oldestTimestamp?: number
  newestTimestamp?: number
  avgReplayDiff?: number
}

/** 列表过滤条件 */
export interface SnapshotListFilter {
  caseId?: string
  limit?: number
}

// ============================================================
// SnapshotManager 类
// ============================================================

/**
 * 决策快照管理器
 *
 * 内存存储，最多保留最近 maxSnapshots 条快照（默认 1000）。
 * 每次 Decision 自动保存快照，支持 Replay 重放以复现任何 Bug。
 *
 * Replay 采用动态导入（lazy import）避免与 fusion 引擎的循环依赖。
 */
export class SnapshotManager {
  /** 快照表：snapshotId → DecisionSnapshot（保留插入顺序） */
  private snapshots = new Map<string, DecisionSnapshot>()
  /** 最大快照数 */
  private maxSnapshots: number
  /** 自增计数器（用于生成唯一 ID） */
  private counter = 0
  /** 累计 replay 次数 */
  private replayCount = 0
  /** 累计 replay 差异字段总数 */
  private replayDiffFieldTotal = 0

  constructor(maxSnapshots: number = 1000) {
    this.maxSnapshots = maxSnapshots
  }

  /** 生成唯一快照 ID */
  private genId(): string {
    this.counter += 1
    return `snap_${Date.now()}_${this.counter}`
  }

  /** 超过容量时淘汰最旧快照 */
  private evictIfNeeded(): void {
    while (this.snapshots.size > this.maxSnapshots) {
      // Map 保留插入顺序，最早的快照在最前
      const oldestId = this.snapshots.keys().next().value
      if (oldestId === undefined) break
      this.snapshots.delete(oldestId)
    }
  }

  /**
   * 保存快照：自动生成 ID + 时间戳，超容量淘汰最旧
   * @returns 完整的 DecisionSnapshot
   */
  save(snapshot: Omit<DecisionSnapshot, 'snapshotId' | 'timestamp'>): DecisionSnapshot {
    const full: DecisionSnapshot = {
      ...snapshot,
      snapshotId: this.genId(),
      timestamp: Date.now(),
    }
    this.snapshots.set(full.snapshotId, full)
    this.evictIfNeeded()
    return full
  }

  /** 获取指定快照 */
  get(snapshotId: string): DecisionSnapshot | undefined {
    return this.snapshots.get(snapshotId)
  }

  /**
   * 列出快照（最新在前）
   * @param filter 可选过滤：caseId / limit
   */
  list(filter?: SnapshotListFilter): DecisionSnapshot[] {
    let arr = Array.from(this.snapshots.values())
    if (filter?.caseId) {
      arr = arr.filter(s => s.caseId === filter!.caseId)
    }
    // 最新在前（按时间戳降序）
    arr.sort((a, b) => b.timestamp - a.timestamp)
    if (typeof filter?.limit === 'number') {
      arr = arr.slice(0, Math.max(0, filter.limit))
    }
    return arr
  }

  /**
   * 重放：取出快照，用相同输入重新跑决策引擎，比较输出
   * 动态导入 fusion 引擎以避免循环依赖。
   */
  async replay(snapshotId: string): Promise<ReplayResult> {
    const snapshot = this.get(snapshotId)
    if (!snapshot) return { success: false, error: '快照不存在' }
    try {
      // 动态导入避免循环依赖
      const { EvidenceFusionDecisionEngine, getSchoolProfile } =
        await import('../../../xiyongshen/engines/fusion')
      const engine = new EvidenceFusionDecisionEngine(getSchoolProfile('modern'))
      const result = engine.decide(snapshot.input)
      const diff = this.computeDiff(snapshot.output, result)
      // 统计 replay 差异
      this.replayCount += 1
      if (diff && diff.length > 0) {
        this.replayDiffFieldTotal += diff.length
      }
      return { success: diff === null, result, diff }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  /**
   * 批量重放
   * @param filter 可选过滤：caseId / limit
   */
  async replayBatch(filter?: SnapshotListFilter): Promise<BatchReplayResult> {
    const snaps = this.list(filter)
    let passed = 0
    let failed = 0
    const diffs: any[] = []
    for (const s of snaps) {
      const r = await this.replay(s.snapshotId)
      if (r.success) {
        passed++
      } else {
        failed++
        if (r.diff) diffs.push({ snapshotId: s.snapshotId, diff: r.diff })
        else if (r.error) diffs.push({ snapshotId: s.snapshotId, error: r.error })
      }
    }
    return { total: snaps.length, passed, failed, diffs }
  }

  /** 导出快照为 JSON 字符串 */
  exportSnapshot(snapshotId: string): string {
    const snapshot = this.get(snapshotId)
    if (!snapshot) {
      throw new Error(`快照不存在: ${snapshotId}`)
    }
    return JSON.stringify(snapshot)
  }

  /** 从 JSON 字符串导入快照 */
  importSnapshot(json: string): DecisionSnapshot {
    const parsed = JSON.parse(json) as DecisionSnapshot
    this.snapshots.set(parsed.snapshotId, parsed)
    this.evictIfNeeded()
    return parsed
  }

  /** 获取统计信息 */
  getStats(): SnapshotStats {
    const arr = Array.from(this.snapshots.values())
    if (arr.length === 0) {
      return { totalSnapshots: 0 }
    }
    let oldest = arr[0].timestamp
    let newest = arr[0].timestamp
    for (const s of arr) {
      if (s.timestamp < oldest) oldest = s.timestamp
      if (s.timestamp > newest) newest = s.timestamp
    }
    const stats: SnapshotStats = {
      totalSnapshots: arr.length,
      oldestTimestamp: oldest,
      newestTimestamp: newest,
    }
    if (this.replayCount > 0) {
      stats.avgReplayDiff = Number((this.replayDiffFieldTotal / this.replayCount).toFixed(4))
    }
    return stats
  }

  /** 清空所有快照 */
  clear(): void {
    this.snapshots.clear()
  }

  // ---------- 内部辅助 ----------

  /**
   * 浅比较关键字段
   * @returns null 表示一致；否则返回 { field, expected, actual }[]
   */
  private computeDiff(
    expected: any,
    actual: any,
  ): { field: string; expected: any; actual: any }[] | null {
    if (!expected || !actual) return null
    const keys = [
      'primaryYongShen',
      'secondaryYongShen',
      'assistantGod',
      'avoidGod',
      'idleGod',
      'isMultiYongShen',
      'confidence',
      'school',
    ]
    const diffs: { field: string; expected: any; actual: any }[] = []
    for (const k of keys) {
      const e = expected[k]
      const a = actual[k]
      if (e === a) continue
      // 数值允许微小误差
      if (typeof e === 'number' && typeof a === 'number' && Math.abs(e - a) < 1e-9) continue
      diffs.push({ field: k, expected: e, actual: a })
    }
    return diffs.length === 0 ? null : diffs
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局决策快照管理器单例 */
export const globalSnapshotManager = new SnapshotManager()
