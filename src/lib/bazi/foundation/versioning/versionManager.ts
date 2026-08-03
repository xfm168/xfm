/**
 * P0-5 Part 4: Rule Version Manager — 规则版本管理器
 *
 * 职责：
 *   1. 跟踪每条规则的完整版本历史（创建/更新/激活/弃用/回滚）
 *   2. 维护每个版本的 DSL 快照（snapshots）
 *   3. 记录每次修改（modifyHistory）
 *   4. 记录每次准确率评估（accuracyHistory）
 *   5. 支持回滚到任意历史版本
 *   6. 提供准确率趋势查询
 *
 * 与既有 AccuracyCenter（xiyongshen/quality/accuracy.ts）的区别：
 *   AccuracyCenter 关注"规则在命例上的命中率"实时统计
 *   VersionManager 关注"规则版本本身的演化与追溯"
 */

import type {
  RuleDSLDefinition,
  RuleVersionRecord,
  RuleModifyRecord,
  RuleAccuracyHistoryEntry,
} from '../types'

// ============================================================
// 内部类型定义
// ============================================================

/** 回滚操作结果 */
export interface RollbackResult {
  /** 是否成功 */
  success: boolean
  /** 规则 ID */
  ruleId: string
  /** 回滚到的目标版本 */
  targetVersion: string
  /** 回滚前的版本 */
  previousVersion: string
  /** 当前生效版本（回滚成功后等于 targetVersion） */
  currentVersion: string
  /** 失败原因（success=false 时） */
  reason?: string
}

/** 版本注册结果 */
export interface RegisterVersionResult {
  /** 是否为新规则（首次注册） */
  isNew: boolean
  /** 规则 ID */
  ruleId: string
  /** 注册前的版本（新规则为 undefined） */
  previousVersion?: string
  /** 当前版本 */
  currentVersion: string
}

/** 准确率趋势 */
export interface AccuracyTrend {
  /** 规则 ID */
  ruleId: string
  /** 评估次数 */
  evaluationCount: number
  /** 首次评估准确率 */
  firstAccuracy: number | null
  /** 最近一次评估准确率 */
  latestAccuracy: number | null
  /** 最高准确率 */
  maxAccuracy: number | null
  /** 最低准确率 */
  minAccuracy: number | null
  /** 平均准确率 */
  averageAccuracy: number
  /** 趋势方向：improving 提升 / declining 下降 / stable 稳定 / insufficient 数据不足 */
  direction: 'improving' | 'declining' | 'stable' | 'insufficient'
  /** 历史轨迹（按时间排序） */
  trajectory: Array<{ timestamp: number; accuracyScore: number; ruleVersion: string }>
}

// ============================================================
// RuleVersionManager 引擎
// ============================================================

/**
 * 规则版本管理器
 *
 * 维护每条规则的 RuleVersionRecord，支持版本注册、修改记录、
 * 准确率评估记录、版本回滚与趋势查询。
 */
export class RuleVersionManager {
  /** 规则版本记录表：ruleId → RuleVersionRecord */
  private records = new Map<string, RuleVersionRecord>()

  // ---------- 版本注册 ----------

  /**
   * 注册新版本（或首次注册规则）
   * 若 ruleId 已存在且 version 不同，则视为版本更新
   */
  registerVersion(ruleId: string, dsl: RuleDSLDefinition): RegisterVersionResult {
    const now = Date.now()
    const existing = this.records.get(ruleId)

    // 首次注册
    if (!existing) {
      const record: RuleVersionRecord = {
        ruleId,
        currentVersion: dsl.version,
        status: 'active',
        modifyHistory: [
          {
            timestamp: now,
            action: 'create',
            operator: dsl.author ?? 'system',
            toVersion: dsl.version,
            summary: `首次创建规则 ${dsl.name}（v${dsl.version}）`,
            changedFields: [],
          },
        ],
        accuracyHistory: [],
        snapshots: { [dsl.version]: { ...dsl } },
        createdAt: now,
        lastModifiedAt: now,
      }
      this.records.set(ruleId, record)
      return {
        isNew: true,
        ruleId,
        currentVersion: dsl.version,
      }
    }

    // 版本更新
    const previousVersion = existing.currentVersion
    if (previousVersion === dsl.version) {
      // 同版本覆盖：仅更新快照，不新增修改记录（视为修订）
      existing.snapshots[dsl.version] = { ...dsl }
      existing.lastModifiedAt = now
      return {
        isNew: false,
        ruleId,
        previousVersion,
        currentVersion: dsl.version,
      }
    }

    // 新版本
    existing.snapshots[dsl.version] = { ...dsl }
    existing.currentVersion = dsl.version
    existing.lastModifiedAt = now
    existing.modifyHistory.push({
      timestamp: now,
      action: 'update',
      operator: dsl.author ?? 'system',
      fromVersion: previousVersion,
      toVersion: dsl.version,
      summary: `规则 ${ruleId} 从 v${previousVersion} 升级到 v${dsl.version}`,
      changedFields: this.diffFields(existing.snapshots[previousVersion], dsl),
    })

    return {
      isNew: false,
      ruleId,
      previousVersion,
      currentVersion: dsl.version,
    }
  }

  // ---------- 修改记录 ----------

  /**
   * 记录一次修改（不改变版本号，仅追加修改历史）
   */
  recordModification(ruleId: string, record: Omit<RuleModifyRecord, 'timestamp'>): boolean {
    const rec = this.records.get(ruleId)
    if (!rec) return false

    rec.modifyHistory.push({
      ...record,
      timestamp: Date.now(),
    })
    rec.lastModifiedAt = Date.now()
    return true
  }

  // ---------- 准确率记录 ----------

  /**
   * 记录一次准确率评估
   */
  recordAccuracy(ruleId: string, entry: Omit<RuleAccuracyHistoryEntry, 'timestamp'>): boolean {
    const rec = this.records.get(ruleId)
    if (!rec) return false

    rec.accuracyHistory.push({
      ...entry,
      timestamp: Date.now(),
    })
    rec.lastModifiedAt = Date.now()
    return true
  }

  // ---------- 查询 ----------

  /**
   * 获取版本历史（按时间排序的修改记录）
   */
  getVersionHistory(ruleId: string): RuleModifyRecord[] {
    const rec = this.records.get(ruleId)
    if (!rec) return []
    return [...rec.modifyHistory].sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * 获取最新版本号
   */
  getLatestVersion(ruleId: string): string | undefined {
    return this.records.get(ruleId)?.currentVersion
  }

  /**
   * 获取最新版本的 DSL 快照
   */
  getLatestSnapshot(ruleId: string): RuleDSLDefinition | undefined {
    const rec = this.records.get(ruleId)
    if (!rec) return undefined
    return rec.snapshots[rec.currentVersion]
  }

  /**
   * 获取指定版本的 DSL 快照
   */
  getSnapshot(ruleId: string, version: string): RuleDSLDefinition | undefined {
    return this.records.get(ruleId)?.snapshots[version]
  }

  /**
   * 获取完整版本记录
   */
  getRecord(ruleId: string): RuleVersionRecord | undefined {
    return this.records.get(ruleId)
  }

  /**
   * 获取全部规则 ID
   */
  getAllRuleIds(): string[] {
    return Array.from(this.records.keys())
  }

  /**
   * 获取所有版本号（按时间顺序）
   */
  getAllVersions(ruleId: string): string[] {
    const rec = this.records.get(ruleId)
    if (!rec) return []
    // 按修改历史中的版本出现顺序
    const versions: string[] = []
    for (const m of rec.modifyHistory) {
      const v = m.toVersion
      if (v && !versions.includes(v)) versions.push(v)
    }
    // 兜底：从 snapshots 取
    for (const v of Object.keys(rec.snapshots)) {
      if (!versions.includes(v)) versions.push(v)
    }
    return versions
  }

  /**
   * 获取准确率趋势
   */
  getAccuracyTrend(ruleId: string): AccuracyTrend {
    const rec = this.records.get(ruleId)
    if (!rec || rec.accuracyHistory.length === 0) {
      return {
        ruleId,
        evaluationCount: 0,
        firstAccuracy: null,
        latestAccuracy: null,
        maxAccuracy: null,
        minAccuracy: null,
        averageAccuracy: 0,
        direction: 'insufficient',
        trajectory: [],
      }
    }

    const history = [...rec.accuracyHistory].sort((a, b) => a.timestamp - b.timestamp)
    const scores = history.map(h => h.accuracyScore)
    const first = scores[0]
    const latest = scores[scores.length - 1]
    const max = Math.max(...scores)
    const min = Math.min(...scores)
    const avg = scores.reduce((s, x) => s + x, 0) / scores.length

    // 趋势方向判定（需要至少 2 次评估）
    let direction: AccuracyTrend['direction'] = 'insufficient'
    if (scores.length >= 2) {
      const diff = latest - first
      const threshold = 0.02 // 2% 阈值
      if (diff > threshold) direction = 'improving'
      else if (diff < -threshold) direction = 'declining'
      else direction = 'stable'
    }

    return {
      ruleId,
      evaluationCount: history.length,
      firstAccuracy: first,
      latestAccuracy: latest,
      maxAccuracy: max,
      minAccuracy: min,
      averageAccuracy: Number(avg.toFixed(4)),
      direction,
      trajectory: history.map(h => ({
        timestamp: h.timestamp,
        accuracyScore: h.accuracyScore,
        ruleVersion: h.ruleVersion,
      })),
    }
  }

  // ---------- 回滚 ----------

  /**
   * 回滚到指定版本
   * 会保留历史快照（不删除），仅在 modifyHistory 追加 rollback 记录
   */
  rollback(ruleId: string, targetVersion: string, operator = 'system'): RollbackResult {
    const rec = this.records.get(ruleId)
    if (!rec) {
      return {
        success: false,
        ruleId,
        targetVersion,
        previousVersion: '',
        currentVersion: '',
        reason: `规则 ${ruleId} 不存在`,
      }
    }

    if (!rec.snapshots[targetVersion]) {
      return {
        success: false,
        ruleId,
        targetVersion,
        previousVersion: rec.currentVersion,
        currentVersion: rec.currentVersion,
        reason: `版本 ${targetVersion} 的快照不存在`,
      }
    }

    if (rec.currentVersion === targetVersion) {
      return {
        success: false,
        ruleId,
        targetVersion,
        previousVersion: rec.currentVersion,
        currentVersion: rec.currentVersion,
        reason: `当前已是版本 ${targetVersion}，无需回滚`,
      }
    }

    const previousVersion = rec.currentVersion
    const now = Date.now()
    rec.currentVersion = targetVersion
    rec.lastModifiedAt = now
    rec.modifyHistory.push({
      timestamp: now,
      action: 'rollback',
      operator,
      fromVersion: previousVersion,
      toVersion: targetVersion,
      summary: `规则 ${ruleId} 从 v${previousVersion} 回滚到 v${targetVersion}`,
      changedFields: [],
    })

    return {
      success: true,
      ruleId,
      targetVersion,
      previousVersion,
      currentVersion: targetVersion,
    }
  }

  // ---------- 状态管理 ----------

  /**
   * 激活规则（status → active）
   */
  activate(ruleId: string, operator = 'system'): boolean {
    const rec = this.records.get(ruleId)
    if (!rec) return false
    if (rec.status === 'active') return true
    const prev = rec.status
    rec.status = 'active'
    rec.lastModifiedAt = Date.now()
    rec.modifyHistory.push({
      timestamp: Date.now(),
      action: 'activate',
      operator,
      fromVersion: rec.currentVersion,
      toVersion: rec.currentVersion,
      summary: `规则 ${ruleId} 从 ${prev} 状态激活`,
      changedFields: ['status'],
    })
    return true
  }

  /**
   * 弃用规则（status → deprecated）
   */
  deprecate(ruleId: string, operator = 'system', reason = ''): boolean {
    const rec = this.records.get(ruleId)
    if (!rec) return false
    if (rec.status === 'deprecated') return true
    const prev = rec.status
    rec.status = 'deprecated'
    rec.lastModifiedAt = Date.now()
    rec.modifyHistory.push({
      timestamp: Date.now(),
      action: 'deprecate',
      operator,
      fromVersion: rec.currentVersion,
      toVersion: rec.currentVersion,
      summary: `规则 ${ruleId} 从 ${prev} 状态弃用${reason ? `：${reason}` : ''}`,
      changedFields: ['status'],
    })
    return true
  }

  /**
   * 转入沙箱（status → sandbox）
   */
  sandbox(ruleId: string, operator = 'system'): boolean {
    const rec = this.records.get(ruleId)
    if (!rec) return false
    if (rec.status === 'sandbox') return true
    const prev = rec.status
    rec.status = 'sandbox'
    rec.lastModifiedAt = Date.now()
    rec.modifyHistory.push({
      timestamp: Date.now(),
      action: 'update',
      operator,
      fromVersion: rec.currentVersion,
      toVersion: rec.currentVersion,
      summary: `规则 ${ruleId} 从 ${prev} 状态转入沙箱`,
      changedFields: ['status'],
    })
    return true
  }

  /**
   * 获取规则当前状态
   */
  getStatus(ruleId: string): RuleVersionRecord['status'] | undefined {
    return this.records.get(ruleId)?.status
  }

  // ---------- 统计 ----------

  /**
   * 获取全部规则的版本数统计
   */
  getStats(): {
    totalRules: number
    totalVersions: number
    activeCount: number
    sandboxCount: number
    deprecatedCount: number
    totalModifications: number
    totalAccuracyEvaluations: number
  } {
    let totalVersions = 0
    let activeCount = 0
    let sandboxCount = 0
    let deprecatedCount = 0
    let totalModifications = 0
    let totalAccuracyEvaluations = 0

    for (const rec of this.records.values()) {
      totalVersions += Object.keys(rec.snapshots).length
      totalModifications += rec.modifyHistory.length
      totalAccuracyEvaluations += rec.accuracyHistory.length
      if (rec.status === 'active') activeCount += 1
      else if (rec.status === 'sandbox') sandboxCount += 1
      else if (rec.status === 'deprecated') deprecatedCount += 1
    }

    return {
      totalRules: this.records.size,
      totalVersions,
      activeCount,
      sandboxCount,
      deprecatedCount,
      totalModifications,
      totalAccuracyEvaluations,
    }
  }

  // ---------- 内部辅助 ----------

  /**
   * 比较两个 DSL 版本的字段差异
   */
  private diffFields(oldDsl: RuleDSLDefinition | undefined, newDsl: RuleDSLDefinition): string[] {
    if (!oldDsl) return ['*']
    const changed: string[] = []
    const keys: Array<keyof RuleDSLDefinition> = [
      'name', 'version', 'priority', 'category', 'description', 'result',
      'source', 'conditions', 'support', 'oppose', 'dependencies', 'tags',
      'confidence', 'conflictStrategy', 'classicEvidence', 'author', 'reviewer',
    ]
    for (const k of keys) {
      if (JSON.stringify(oldDsl[k]) !== JSON.stringify(newDsl[k])) {
        changed.push(k)
      }
    }
    return changed
  }

  /** 重置所有记录（调试用） */
  clear(): void {
    this.records.clear()
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局规则版本管理器单例 */
export const globalVersionManager = new RuleVersionManager()
