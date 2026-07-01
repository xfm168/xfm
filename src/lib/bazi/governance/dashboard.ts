/**
 * Rule Statistics Dashboard - 规则统计仪表盘
 * V4.8.1 Baseline
 *
 * 聚合规则执行统计：覆盖率、命中率、最佳匹配率。
 * 复用 rules/engine.ts 的 __RULE_AUDIT__ 全局审计。
 */

import { getAuditSummary, getAuditStats } from '../rules/engine'
import type { RuleAuditStat } from '../rules/engine'

export interface DashboardSummary {
  /** 审计是否启用 */
  auditEnabled: boolean
  /** 注册规则数 */
  registeredRules: number
  /** 命中过的规则数 */
  matchedRules: number
  /** 从未命中的规则数 */
  neverMatchedRules: number
  /** 覆盖率 % */
  coveragePercent: number
  /** 引擎总调用 */
  engineCalls: number
  /** 规则总执行 */
  totalExecuted: number
  /** 规则总命中 */
  totalMatched: number
  /** Top 规则（按最佳匹配数） */
  topRules: RuleAuditStat[]
  /** 死规则（执行过但从未命中） */
  deadRules: RuleAuditStat[]
}

/** 生成仪表盘汇总 */
export function getDashboardSummary(): DashboardSummary {
  const summary = getAuditSummary()
  const stats = getAuditStats()

  if (!summary.enabled) {
    return {
      auditEnabled: false,
      registeredRules: 0,
      matchedRules: 0,
      neverMatchedRules: 0,
      coveragePercent: 0,
      engineCalls: 0,
      totalExecuted: 0,
      totalMatched: 0,
      topRules: [],
      deadRules: [],
    }
  }

  const matched = stats.filter(s => s.matchCount > 0)
  const neverMatched = stats.filter(s => s.matchCount === 0 && s.executionCount > 0)

  return {
    auditEnabled: true,
    registeredRules: stats.length,
    matchedRules: matched.length,
    neverMatchedRules: neverMatched.length,
    coveragePercent: stats.length > 0 ? Math.round((matched.length / stats.length) * 100) : 0,
    engineCalls: summary.callCount ?? 0,
    totalExecuted: summary.totalRulesExecuted ?? 0,
    totalMatched: summary.totalRulesMatched ?? 0,
    topRules: stats.filter(s => s.bestMatchCount > 0).slice(0, 10),
    deadRules: neverMatched,
  }
}

/** 格式化仪表盘报告 */
export function formatDashboardReport(summary: DashboardSummary): string {
  const lines: string[] = []
  lines.push('========== Rule Statistics Dashboard ==========')
  if (!summary.auditEnabled) {
    lines.push('Audit: DISABLED')
    return lines.join('\n')
  }
  lines.push(`Registered Rules: ${summary.registeredRules}`)
  lines.push(`Matched Rules: ${summary.matchedRules} (${summary.coveragePercent}%)`)
  lines.push(`Never Matched: ${summary.neverMatchedRules}`)
  lines.push(`Engine Calls: ${summary.engineCalls}`)
  lines.push(`Total Executed: ${summary.totalExecuted}`)
  lines.push(`Total Matched: ${summary.totalMatched}`)
  lines.push('')
  if (summary.topRules.length > 0) {
    lines.push('Top Rules (by best match):')
    for (const r of summary.topRules) {
      lines.push(`  - ${r.ruleId} ${r.name}: best=${r.bestMatchCount} match=${r.matchCount}`)
    }
  }
  if (summary.deadRules.length > 0) {
    lines.push('')
    lines.push('Dead Rules (never matched):')
    for (const r of summary.deadRules) {
      lines.push(`  - ${r.ruleId} ${r.name}: executed=${r.executionCount}`)
    }
  }
  lines.push('==============================================')
  return lines.join('\n')
}
