/**
 * 规则引擎统计Hook
 * 挂在executeRules上，自动收集所有Rule的执行/命中数据
 */

import { executeRules as originalExecuteRules, type BaseRule, type RuleContext, type RuleResult, type RuleEngineOptions } from './engine'
import { GEJU_RULES } from './gejuRules'

export interface RuleStat {
  ruleId: string
  name: string
  category: string
  priority: number
  executionCount: number
  matchCount: number
  firstMatchedContext: string | null
  lastMatchedContext: string | null
  errorCount: number
  lastError: string | null
}

export interface CoverageReport {
  totalRules: number
  matchedRules: number
  unmatchedRules: number
  coverage: number
  stats: RuleStat[]
  generatedAt: string
}

// 全局统计Map
const globalStats = new Map<string, RuleStat>()

// 初始化所有Rule的统计
function initStats(rules: BaseRule<any, any>[]): void {
  for (const rule of rules) {
    if (!globalStats.has(rule.id)) {
      globalStats.set(rule.id, {
        ruleId: rule.id,
        name: rule.name,
        category: rule.category,
        priority: rule.priority,
        executionCount: 0,
        matchCount: 0,
        firstMatchedContext: null,
        lastMatchedContext: null,
        errorCount: 0,
        lastError: null,
      })
    }
  }
}

// 包装后的executeRules，带Hook统计
export function executeRulesWithHook<TContext extends RuleContext, TResult extends RuleResult>(
  rules: BaseRule<TContext, TResult>[],
  context: TContext,
  options: RuleEngineOptions = { stopOnFirstMatch: false, returnAllMatches: false },
): {
  bestMatch: any
  allMatches: any[]
  conflicts: any[]
} {
  // 确保统计已初始化
  initStats(rules)

  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)
  const matches: any[] = []
  const conflicts: any[] = []

  for (const rule of sortedRules) {
    const stat = globalStats.get(rule.id)!
    stat.executionCount++

    try {
      const matched = rule.condition(context)
      if (matched) {
        stat.matchCount++
        if (!stat.firstMatchedContext) {
          stat.firstMatchedContext = summarizeContext(context)
        }
        stat.lastMatchedContext = summarizeContext(context)

        matches.push({
          rule,
          matched: true,
          result: rule.result,
          confidence: rule.weight,
          reasons: [rule.description],
        })

        if (options.stopOnFirstMatch) {
          break
        }
      }
    } catch (e: any) {
      stat.errorCount++
      stat.lastError = e.message
    }
  }

  // 检测冲突
  if (matches.length > 1) {
    const highestPriority = matches[0].rule.priority
    const topMatches = matches.filter(m => m.rule.priority === highestPriority)
    if (topMatches.length > 1) {
      conflicts.push(...topMatches.map(m => m.rule))
    }
  }

  // 计算最佳匹配
  let bestMatch: any = null
  if (matches.length > 0) {
    bestMatch = matches.reduce((best, current) => {
      const bestScore = best.rule.priority * 10 + best.confidence
      const currentScore = current.rule.priority * 10 + current.confidence
      return currentScore > bestScore ? current : best
    })
  }

  return { bestMatch, allMatches: matches, conflicts }
}

// 上下文摘要（用于记录首次命中时的信息）
function summarizeContext(ctx: any): string {
  try {
    const parts: string[] = []
    if (ctx.dayGan) parts.push(`${ctx.dayGan}日`)
    if (ctx.monthZhi) parts.push(`${ctx.monthZhi}月`)
    if (ctx.monthGanShen) parts.push(ctx.monthGanShen)
    if (ctx.strengthScore !== undefined) parts.push(`强度${ctx.strengthScore}`)
    if (ctx.isSeasonal) parts.push('得令')
    if (ctx.tongGenCount !== undefined) parts.push(`通根${ctx.tongGenCount}`)
    return parts.slice(0, 4).join(' ')
  } catch {
    return 'unknown'
  }
}

// 获取统计报告
export function getCoverageReport(): CoverageReport {
  const stats = Array.from(globalStats.values())
  const matchedRules = stats.filter(s => s.matchCount > 0).length
  const unmatchedRules = stats.filter(s => s.matchCount === 0).length
  const coverage = (matchedRules / stats.length) * 100

  return {
    totalRules: stats.length,
    matchedRules,
    unmatchedRules,
    coverage,
    stats: stats.sort((a, b) => b.matchCount - a.matchCount),
    generatedAt: new Date().toISOString(),
  }
}

// 获取未命中Rule
export function getUnmatchedRules(): RuleStat[] {
  return Array.from(globalStats.values())
    .filter(s => s.matchCount === 0)
    .sort((a, b) => b.priority - a.priority)
}

// 获取Top20命中最多
export function getTopMatched(count = 20): RuleStat[] {
  return Array.from(globalStats.values())
    .filter(s => s.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, count)
}

// 获取Top20未命中
export function getTopUnmatched(count = 20): RuleStat[] {
  return Array.from(globalStats.values())
    .filter(s => s.matchCount === 0)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, count)
}

// 导出CSV格式的Coverage
export function exportCoverageCSV(): string {
  const report = getCoverageReport()
  const headers = ['ruleId', 'name', 'priority', 'category', 'executionCount', 'matchCount', 'coverage']
  const rows = report.stats.map(s => [
    s.ruleId,
    `"${s.name}"`,
    s.priority,
    `"${s.category}"`,
    s.executionCount,
    s.matchCount,
    s.matchCount > 0 ? 'YES' : 'NO',
  ])

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

// 导出Dead Rules JSON
export function exportDeadRulesJSON(): string {
  const dead = getUnmatchedRules()
  return JSON.stringify({
    count: dead.length,
    rules: dead.map(s => ({
      ruleId: s.ruleId,
      name: s.name,
      priority: s.priority,
      category: s.category,
      executionCount: s.executionCount,
      matchCount: s.matchCount,
      errorCount: s.errorCount,
      lastError: s.lastError,
    })),
    generatedAt: new Date().toISOString(),
  }, null, 2)
}

// 导出完整报告
export function exportFullReport(): string {
  const report = getCoverageReport()
  return JSON.stringify(report, null, 2)
}

// 重置统计
export function resetStats(): void {
  globalStats.clear()
}

// 初始化统计（用于特定规则集）
export function initCoverage(rules: BaseRule<any, any>[]): void {
  initStats(rules)
}

// 导出单rule统计
export function getRuleStat(ruleId: string): RuleStat | undefined {
  return globalStats.get(ruleId)
}

// 检查是否已初始化
export function isInitialized(): boolean {
  return globalStats.size > 0
}
