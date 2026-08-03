/**
 * P0-5B Rule Runtime — 规则运行时（RuleRuntime）
 *
 * 管理规则的完整生命周期：
 *   load → checkVersion → checkDependencies → checkConflict → run / runAll / runBatch → unload
 *
 * 兼容两种规则格式：
 *   - DSL 编译规则（RuleDSLDefinition，含 conditions/support/oppose）
 *   - 既有代码规则（RuleDefinition，含 evaluate 函数）
 *
 * 核心能力：
 *   1. 规则加载/卸载（load / unload / clear）
 *   2. 版本检查（checkVersion，对接 VersionManager）
 *   3. 依赖检查（checkDependencies，验证所有 dependencies 已加载）
 *   4. 冲突检查（checkConflict，同分类 + 相反 support/oppose 五行）
 *   5. 规则执行（run / runAll / runBatch，统计耗时 + 错误隔离）
 *   6. 事件发射（通过核心层 EventBus）
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

import type { RuleDSLDefinition } from '../../types'
import type { RuleDefinition, EvidenceBundle } from '../../../ruleEngine/types'
import { evaluateConditionGroup } from '../../dsl/parser'
import { globalVersionManager } from '../../versioning/versionManager'

// ============================================================
// EventBus 集成（核心层 eventBus 模块）
// ============================================================

// 通过 EventBus 发射运行时事件
// 核心层 EventBus 模块路径：../../core/eventbus/eventBus
// 若该模块尚未就绪（核心层未实现），降级为 no-op emitter，不影响规则执行主流程
type EventBusLike = {
  emit?: (type: string, payload?: any) => void
  on?: (type: string, handler: (payload?: any) => void) => void
  off?: (type: string, handler?: (payload?: any) => void) => void
}

let eventBus: EventBusLike | null = null
try {
  // 使用 createRequire 在 ESM 环境中同步加载核心层 EventBus
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createRequire } = require('module')
  const nativeRequire = createRequire(import.meta.url)
  const mod = nativeRequire('../../core/eventbus/eventBus')
  eventBus = (mod?.globalEventBus ?? (mod?.EventBus ? new mod.EventBus() : null)) as EventBusLike | null
} catch {
  // 核心层 EventBus 模块未就绪，降级为 no-op
  eventBus = null
}

/** 发射运行时事件（EventBus 未就绪或发射失败时静默忽略） */
function emitEvent(type: string, payload?: any): void {
  try {
    eventBus?.emit?.(type, payload)
  } catch {
    // 事件发射失败不影响主流程
  }
}

// ============================================================
// 类型定义
// ============================================================

/** 单规则运行结果 */
export interface RuntimeRuleResult {
  /** 规则 ID */
  ruleId: string
  /** 规则名称 */
  ruleName: string
  /** 是否满足条件 */
  satisfied: boolean
  /** 五行分数（正数=支持，负数=反对） */
  scores: Record<string, number>
  /** 执行追踪（每步评估的过程记录） */
  trace: any[]
  /** 执行耗时（毫秒） */
  executionTimeMs: number
  /** 错误信息（执行失败时填充） */
  error?: string
}

/** 运行时统计 */
export interface RuntimeStats {
  /** 已加载规则数 */
  loaded: number
  /** 累计执行次数 */
  executed: number
  /** 累计执行耗时（毫秒） */
  totalExecutionTimeMs: number
  /** 平均执行耗时（毫秒） */
  avgExecutionTimeMs: number
  /** 最后一次执行时间戳 */
  lastExecutedAt: number
}

/** 版本检查结果 */
export interface VersionCheckResult {
  /** 当前加载的版本 */
  current?: string
  /** VersionManager 中的最新版本 */
  latest?: string
  /** 是否需要更新 */
  needsUpdate: boolean
}

/** 依赖检查结果 */
export interface DependencyCheckResult {
  /** 依赖是否全部满足 */
  satisfied: boolean
  /** 缺失的依赖规则 ID 列表 */
  missing: string[]
}

/** 冲突检查结果 */
export interface ConflictCheckResult {
  /** 是否存在冲突 */
  hasConflict: boolean
  /** 冲突详情列表 */
  conflicts: Array<{ ruleId: string; reason: string }>
}

/** 运行时事件类型 */
export type RuleRuntimeEventType =
  | 'rule:loaded'        // 规则加载
  | 'rule:unloaded'      // 规则卸载
  | 'rule:executed'      // 规则执行完成
  | 'rule:error'         // 规则执行错误
  | 'runtime:cleared'    // 运行时清空

// ============================================================
// RuleRuntime 类
// ============================================================

/**
 * 规则运行时
 *
 * 维护已加载规则表，提供版本/依赖/冲突检查与规则执行能力。
 * 执行过程统计耗时、捕获错误，确保单条规则失败不影响其他规则。
 */
export class RuleRuntime {
  /** 已加载规则表：ruleId → 原始规则对象 */
  private loaded = new Map<string, any>()
  /** 已加载规则的来源类型记录 */
  private ruleSources = new Map<string, 'code' | 'dsl'>()
  /** 累计执行次数 */
  private executedCount = 0
  /** 累计执行耗时 */
  private totalExecutionTimeMs = 0
  /** 最后执行时间戳 */
  private lastExecutedAt = 0

  // ---------- 加载 / 卸载 ----------

  /**
   * 加载编译后的规则（接受 DSL 编译规则或既有 RuleDefinition）
   * @returns 是否加载成功
   */
  load(compiledRule: any): boolean {
    try {
      const ruleId = compiledRule?.id
      if (!ruleId) {
        console.warn('[RuleRuntime] 规则缺少 id 字段，加载失败')
        return false
      }
      const sourceType: 'code' | 'dsl' = this.isDSLRule(compiledRule) ? 'dsl' : 'code'
      this.loaded.set(ruleId, compiledRule)
      this.ruleSources.set(ruleId, sourceType)
      emitEvent('rule:loaded', { ruleId, source: sourceType })
      return true
    } catch (err) {
      console.warn(`[RuleRuntime] 加载规则失败: ${err instanceof Error ? err.message : String(err)}`)
      return false
    }
  }

  /** 卸载规则 */
  unload(ruleId: string): boolean {
    const existed = this.loaded.delete(ruleId)
    this.ruleSources.delete(ruleId)
    if (existed) {
      emitEvent('rule:unloaded', { ruleId })
    }
    return existed
  }

  /** 清空所有已加载规则 */
  clear(): void {
    const count = this.loaded.size
    this.loaded.clear()
    this.ruleSources.clear()
    this.executedCount = 0
    this.totalExecutionTimeMs = 0
    this.lastExecutedAt = 0
    emitEvent('runtime:cleared', { clearedCount: count })
  }

  // ---------- 检查 ----------

  /**
   * 检查规则版本（对接 VersionManager）
   * 比较当前加载版本与 VersionManager 中记录的最新版本
   */
  checkVersion(ruleId: string): VersionCheckResult {
    const rule = this.loaded.get(ruleId)
    const current = rule?.version
    const latest = globalVersionManager.getLatestVersion(ruleId)

    if (!current) {
      return { current: undefined, latest, needsUpdate: false }
    }
    if (!latest) {
      return { current, latest: undefined, needsUpdate: false }
    }
    return {
      current,
      latest,
      needsUpdate: current !== latest,
    }
  }

  /**
   * 检查规则依赖是否全部加载
   */
  checkDependencies(ruleId: string): DependencyCheckResult {
    const rule = this.loaded.get(ruleId)
    if (!rule) {
      return { satisfied: false, missing: [ruleId] }
    }
    const deps: string[] = rule.dependencies ?? []
    const missing: string[] = []
    for (const dep of deps) {
      if (!this.loaded.has(dep)) missing.push(dep)
    }
    return {
      satisfied: missing.length === 0,
      missing,
    }
  }

  /**
   * 检查规则与已加载规则是否存在冲突
   * 冲突条件：同分类 + 一方 support 的五行与另一方 oppose 的五行重叠
   */
  checkConflict(ruleId: string): ConflictCheckResult {
    const rule = this.loaded.get(ruleId)
    if (!rule) {
      return { hasConflict: false, conflicts: [] }
    }

    const targetCategory = rule.category
    const targetSupport = this.extractWuxingSet(rule, 'support')
    const targetOppose = this.extractWuxingSet(rule, 'oppose')

    const conflicts: Array<{ ruleId: string; reason: string }> = []

    for (const [otherId, otherRule] of this.loaded) {
      if (otherId === ruleId) continue
      // 同分类才检查冲突
      if (targetCategory && otherRule.category !== targetCategory) continue

      const otherSupport = this.extractWuxingSet(otherRule, 'support')
      const otherOppose = this.extractWuxingSet(otherRule, 'oppose')

      // 检查重叠：A 的 support 与 B 的 oppose 重叠
      const supportOpposeOverlap = this.intersect(targetSupport, otherOppose)
      const opposeSupportOverlap = this.intersect(targetOppose, otherSupport)

      if (supportOpposeOverlap.length > 0) {
        conflicts.push({
          ruleId: otherId,
          reason: `规则 ${ruleId} support 五行 [${supportOpposeOverlap.join(',')}] 与规则 ${otherId} oppose 五行冲突`,
        })
      } else if (opposeSupportOverlap.length > 0) {
        conflicts.push({
          ruleId: otherId,
          reason: `规则 ${ruleId} oppose 五行 [${opposeSupportOverlap.join(',')}] 与规则 ${otherId} support 五行冲突`,
        })
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    }
  }

  // ---------- 执行 ----------

  /**
   * 执行单条规则
   * 错误隔离：单条规则失败不影响其他调用
   */
  run(ruleId: string, input: any): RuntimeRuleResult {
    const rule = this.loaded.get(ruleId)
    const ruleName = rule?.name ?? ruleId

    if (!rule) {
      return {
        ruleId,
        ruleName,
        satisfied: false,
        scores: {},
        trace: [],
        executionTimeMs: 0,
        error: `规则 ${ruleId} 未加载`,
      }
    }

    const startTs = Date.now()
    try {
      const result = this.executeRule(rule, input)
      const executionTimeMs = Date.now() - startTs

      this.executedCount += 1
      this.totalExecutionTimeMs += executionTimeMs
      this.lastExecutedAt = Date.now()

      const runtimeResult: RuntimeRuleResult = {
        ruleId,
        ruleName,
        satisfied: result.satisfied,
        scores: result.scores,
        trace: result.trace,
        executionTimeMs,
      }

      emitEvent('rule:executed', {
        ruleId,
        ruleName,
        satisfied: result.satisfied,
        executionTimeMs,
      })

      return runtimeResult
    } catch (err) {
      const executionTimeMs = Date.now() - startTs
      this.executedCount += 1
      this.totalExecutionTimeMs += executionTimeMs
      this.lastExecutedAt = Date.now()

      const errorMsg = err instanceof Error ? err.message : String(err)
      console.warn(`[RuleRuntime] 规则 ${ruleId} 执行出错: ${errorMsg}`)

      emitEvent('rule:error', { ruleId, ruleName, error: errorMsg })

      return {
        ruleId,
        ruleName,
        satisfied: false,
        scores: {},
        trace: [],
        executionTimeMs,
        error: errorMsg,
      }
    }
  }

  /** 执行所有已加载规则 */
  runAll(input: any): RuntimeRuleResult[] {
    const results: RuntimeRuleResult[] = []
    for (const ruleId of this.loaded.keys()) {
      results.push(this.run(ruleId, input))
    }
    return results
  }

  /** 批量执行指定规则 */
  runBatch(ruleIds: string[], input: any): RuntimeRuleResult[] {
    const results: RuntimeRuleResult[] = []
    for (const ruleId of ruleIds) {
      results.push(this.run(ruleId, input))
    }
    return results
  }

  // ---------- 查询 ----------

  /** 获取所有已加载规则 ID */
  getLoadedRules(): string[] {
    return Array.from(this.loaded.keys())
  }

  /** 判断规则是否已加载 */
  isLoaded(ruleId: string): boolean {
    return this.loaded.has(ruleId)
  }

  /** 获取运行时统计 */
  getStats(): RuntimeStats {
    return {
      loaded: this.loaded.size,
      executed: this.executedCount,
      totalExecutionTimeMs: this.totalExecutionTimeMs,
      avgExecutionTimeMs: this.executedCount > 0
        ? Number((this.totalExecutionTimeMs / this.executedCount).toFixed(4))
        : 0,
      lastExecutedAt: this.lastExecutedAt,
    }
  }

  // ---------- 内部辅助 ----------

  /** 判断是否为 DSL 规则（DSL 有 conditions 字段，RuleDefinition 有 evaluate 字段） */
  private isDSLRule(rule: any): rule is RuleDSLDefinition {
    return rule && !('evaluate' in rule) && 'conditions' in rule
  }

  /**
   * 执行单条规则的核心逻辑（区分 DSL 规则与代码规则）
   */
  private executeRule(
    rule: any,
    input: any,
  ): { satisfied: boolean; scores: Record<string, number>; trace: any[] } {
    if (this.isDSLRule(rule)) {
      return this.executeDSLRule(rule as RuleDSLDefinition, input)
    }
    return this.executeCodeRule(rule as RuleDefinition, input)
  }

  /** 执行 DSL 规则：使用 evaluateConditionGroup 评估条件，按 support/oppose 累加分数 */
  private executeDSLRule(
    rule: RuleDSLDefinition,
    input: any,
  ): { satisfied: boolean; scores: Record<string, number>; trace: any[] } {
    const trace: any[] = []
    const satisfied = evaluateConditionGroup(input, rule.conditions)
    trace.push({
      step: '条件评估',
      text: `conditions ${satisfied ? '满足' : '不满足'}`,
      satisfied,
    })

    const scores: Record<string, number> = {}
    if (satisfied) {
      for (const s of rule.support ?? []) {
        scores[s.wuxing] = (scores[s.wuxing] ?? 0) + s.score
      }
      for (const s of rule.oppose ?? []) {
        scores[s.wuxing] = (scores[s.wuxing] ?? 0) - Math.abs(s.score)
      }
      trace.push({
        step: '分数累加',
        text: `support=${(rule.support ?? []).map(s => `${s.wuxing}:+${s.score}`).join(',')}; oppose=${(rule.oppose ?? []).map(s => `${s.wuxing}:-${Math.abs(s.score)}`).join(',')}`,
        satisfied: true,
      })
    }

    trace.push({
      step: '结论',
      text: satisfied ? rule.result : '条件不满足，不产生分数',
      satisfied,
    })

    return { satisfied, scores, trace }
  }

  /** 执行代码规则：调用 rule.evaluate() 并解析返回的 EvidenceBundle */
  private executeCodeRule(
    rule: RuleDefinition,
    input: any,
  ): { satisfied: boolean; scores: Record<string, number>; trace: any[] } {
    const trace: any[] = []
    const bundle: EvidenceBundle = rule.evaluate(input)

    const satisfied = bundle.conclusion === 'satisfied'
      || bundle.coreSatisfied === bundle.coreTotal
      || (bundle.coreSatisfied ?? 0) > 0

    trace.push({
      step: 'evaluate 调用',
      text: bundle.summary ?? rule.result,
      satisfied,
      conclusion: bundle.conclusion,
      coreSatisfied: bundle.coreSatisfied,
      coreTotal: bundle.coreTotal,
    })

    // 从 evidence items 中提取五行分数
    const scores: Record<string, number> = {}
    for (const item of bundle.items ?? []) {
      if (item.weight !== undefined && item.meta?.wuxing) {
        const sign = item.level === 'support' || item.level === 'strong_support' ? 1 : -1
        scores[item.meta.wuxing] = (scores[item.meta.wuxing] ?? 0) + sign * item.weight
      }
      if (item.trace) {
        for (const t of item.trace) trace.push(t)
      }
    }

    return { satisfied, scores, trace }
  }

  /** 从规则中提取 support 或 oppose 五行集合 */
  private extractWuxingSet(rule: any, field: 'support' | 'oppose'): string[] {
    const arr = rule?.[field]
    if (!Array.isArray(arr)) return []
    return arr.map((s: any) => s?.wuxing).filter(Boolean)
  }

  /** 计算两个数组的交集 */
  private intersect(a: string[], b: string[]): string[] {
    const setB = new Set(b)
    return a.filter(x => setB.has(x))
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局规则运行时单例 */
export const globalRuleRuntime = new RuleRuntime()
