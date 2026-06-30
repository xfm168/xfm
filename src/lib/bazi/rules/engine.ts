/**
 * 命理规则引擎 - 通用规则接口
 * 所有规则统一结构：priority, condition, result, weight, description, reference
 */

export interface RuleContext {
  [key: string]: unknown
}

export interface RuleResult {
  [key: string]: unknown
}

export interface BaseRule<
  TContext extends RuleContext = RuleContext,
  TResult extends RuleResult = RuleResult,
> {
  id: string
  name: string
  category: string
  priority: number       // 优先级，数字越大优先级越高
  weight: number         // 权重，0-100
  description: string    // 规则描述
  reference: string      // 规则来源/参考典籍
  condition: (ctx: TContext) => boolean
  result: TResult
}

export interface RuleMatchResult<
  TContext extends RuleContext = RuleContext,
  TResult extends RuleResult = RuleResult,
> {
  rule: BaseRule<TContext, TResult>
  matched: boolean
  result: TResult
  confidence: number     // 0-100
  reasons: string[]
}

export interface RuleEngineOptions {
  stopOnFirstMatch?: boolean
  returnAllMatches?: boolean
}

// ========== DEBUG_AUDIT 审计Hook ==========
// 通过全局变量 __RULE_AUDIT__ 控制
// 生产环境不启用，零开销

export interface RuleAuditStat {
  ruleId: string
  name: string
  category: string
  priority: number
  weight: number
  executionCount: number
  matchCount: number
  errorCount: number
  lastError: string | null
  firstMatchContext: string | null
  bestMatchCount: number
  top3Count: number
  assistCount: number
  blockedByPriority: number
  blockedByWeight: number
}

export interface RuleAuditTrace {
  timestamp: number
  contextSummary: string
  matchedRules: { id: string; name: string; priority: number; weight: number; score: number }[]
  bestMatchRule: string | null
  bestMatchScore: number
  eliminatedRules: { id: string; name: string; reason: string }[]
}

declare global {
  var __RULE_AUDIT__: {
    enabled: boolean
    stats: Map<string, RuleAuditStat>
    traces: RuleAuditTrace[]
    maxTraces: number
    callCount: number
    totalRulesExecuted: number
    totalRulesMatched: number
  } | undefined
}

function getAudit(): NonNullable<typeof globalThis.__RULE_AUDIT__> | null {
  if (typeof globalThis !== 'undefined' && globalThis.__RULE_AUDIT__?.enabled) {
    return globalThis.__RULE_AUDIT__
  }
  return null
}

function summarizeContext(ctx: any): string {
  try {
    const parts: string[] = []
    if (ctx.dayGan) parts.push(`${ctx.dayGan}日`)
    if (ctx.monthZhi) parts.push(`${ctx.monthZhi}月`)
    if (ctx.monthGanShen) parts.push(ctx.monthGanShen)
    if (typeof ctx.strengthScore === 'number') parts.push(`S${ctx.strengthScore}`)
    return parts.join(' ')
  } catch { return 'unknown' }
}

function initAuditStat(rule: BaseRule<any, any>): RuleAuditStat {
  return {
    ruleId: rule.id,
    name: rule.name,
    category: rule.category,
    priority: rule.priority,
    weight: rule.weight,
    executionCount: 0,
    matchCount: 0,
    errorCount: 0,
    lastError: null,
    firstMatchContext: null,
    bestMatchCount: 0,
    top3Count: 0,
    assistCount: 0,
    blockedByPriority: 0,
    blockedByWeight: 0,
  }
}

export function enableAudit(maxTraces = 1000): void {
  if (typeof globalThis === 'undefined') return
  globalThis.__RULE_AUDIT__ = {
    enabled: true,
    stats: new Map(),
    traces: [],
    maxTraces,
    callCount: 0,
    totalRulesExecuted: 0,
    totalRulesMatched: 0,
  }
}

export function disableAudit(): void {
  if (typeof globalThis !== 'undefined') {
    globalThis.__RULE_AUDIT__ = undefined
  }
}

export function getAuditStats(): RuleAuditStat[] {
  const audit = getAudit()
  if (!audit) return []
  return Array.from(audit.stats.values()).sort((a, b) => b.matchCount - a.matchCount)
}

export function getAuditTraces(): RuleAuditTrace[] {
  const audit = getAudit()
  if (!audit) return []
  return audit.traces
}

export function getAuditSummary() {
  const audit = getAudit()
  if (!audit) return { enabled: false }
  const stats = Array.from(audit.stats.values())
  const matched = stats.filter(s => s.matchCount > 0)
  const neverMatched = stats.filter(s => s.matchCount === 0 && s.executionCount > 0)
  return {
    enabled: true,
    callCount: audit.callCount,
    totalRulesExecuted: audit.totalRulesExecuted,
    totalRulesMatched: audit.totalRulesMatched,
    registeredRules: stats.length,
    matchedRules: matched.length,
    neverMatchedRules: neverMatched.length,
    tracesCount: audit.traces.length,
    coveragePercent: stats.length > 0 ? (matched.length / stats.length * 100).toFixed(1) : '0',
  }
}

/**
 * 规则引擎执行器
 */
export function executeRules<TContext extends RuleContext, TResult extends RuleResult>(
  rules: BaseRule<TContext, TResult>[],
  context: TContext,
  options: RuleEngineOptions = { stopOnFirstMatch: false, returnAllMatches: false },
): {
  bestMatch: RuleMatchResult<TContext, TResult> | null
  allMatches: RuleMatchResult<TContext, TResult>[]
  conflicts: BaseRule<TContext, TResult>[]
} {
  const audit = getAudit()
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)
  const matches: RuleMatchResult<TContext, TResult>[] = []
  const conflicts: BaseRule<TContext, TResult>[] = []
  const traceMatched: { id: string; name: string; priority: number; weight: number; score: number }[] = []
  const traceEliminated: { id: string; name: string; reason: string }[] = []

  if (audit) {
    audit.callCount++
    audit.totalRulesExecuted += rules.length
  }

  for (const rule of sortedRules) {
    // 审计：初始化统计
    if (audit && !audit.stats.has(rule.id)) {
      audit.stats.set(rule.id, initAuditStat(rule))
    }
    const stat = audit?.stats.get(rule.id)
    if (stat) stat.executionCount++

    try {
      const matched = rule.condition(context)
      if (matched) {
        const matchResult: RuleMatchResult<TContext, TResult> = {
          rule,
          matched: true,
          result: rule.result,
          confidence: rule.weight,
          reasons: [rule.description],
        }
        matches.push(matchResult)

        if (stat) {
          stat.matchCount++
          if (!stat.firstMatchContext) {
            stat.firstMatchContext = summarizeContext(context)
          }
        }

        if (audit) audit.totalRulesMatched++

        traceMatched.push({
          id: rule.id,
          name: rule.name,
          priority: rule.priority,
          weight: rule.weight,
          score: rule.priority * 10 + rule.weight,
        })

        if (options.stopOnFirstMatch) {
          break
        }
      }
    } catch (e: any) {
      if (stat) {
        stat.errorCount++
        stat.lastError = e.message
      }
    }
  }

  // 检测冲突：同优先级且结果不同的规则
  if (matches.length > 1) {
    const highestPriority = matches[0].rule.priority
    const topMatches = matches.filter(m => m.rule.priority === highestPriority)
    if (topMatches.length > 1) {
      conflicts.push(...topMatches.map(m => m.rule))
    }
  }

  // 计算最佳匹配：按优先级 + 权重
  let bestMatch: RuleMatchResult<TContext, TResult> | null = null
  if (matches.length > 0) {
    bestMatch = matches.reduce((best, current) => {
      const bestScore = best.rule.priority * 10 + best.confidence
      const currentScore = current.rule.priority * 10 + current.confidence
      if (currentScore > bestScore) {
        if (audit) {
          const bestStat = audit?.stats.get(best.rule.id)
          const curStat = audit?.stats.get(current.rule.id)
          if (bestStat) {
            if (current.rule.priority > best.rule.priority) {
              bestStat.blockedByPriority++
            } else if (current.confidence > best.confidence) {
              bestStat.blockedByWeight++
            }
          }
        }
        return current
      } else {
        if (audit) {
          const curStat = audit?.stats.get(current.rule.id)
          if (curStat) {
            if (best.rule.priority > current.rule.priority) {
              curStat.blockedByPriority++
            } else if (best.confidence > current.confidence) {
              curStat.blockedByWeight++
            }
          }
        }
        return best
      }
    })
  }

  // 审计：贡献度统计 + Trace
  if (audit && matches.length > 0) {
    const sortedMatches = [...matches].sort(
      (a, b) => (b.rule.priority * 10 + b.confidence) - (a.rule.priority * 10 + a.confidence)
    )

    sortedMatches.forEach((m, idx) => {
      const s = audit.stats.get(m.rule.id)
      if (!s) return
      if (idx === 0) s.bestMatchCount++
      if (idx < 3) s.top3Count++
      if (idx > 0) s.assistCount++
    })

    // 记录Trace（最多maxTraces条）
    if (audit.traces.length < audit.maxTraces) {
      const eliminated: { id: string; name: string; reason: string }[] = []
      if (bestMatch) {
        const bestScore = bestMatch.rule.priority * 10 + bestMatch.confidence
        for (const m of matches) {
          if (m.rule.id !== bestMatch.rule.id) {
            let reason = ''
            if (m.rule.priority < bestMatch.rule.priority) reason = 'priority低'
            else if (m.confidence < bestMatch.confidence) reason = 'weight低'
            else reason = '同分'
            eliminated.push({ id: m.rule.id, name: m.rule.name, reason })
          }
        }
      }

      audit.traces.push({
        timestamp: Date.now(),
        contextSummary: summarizeContext(context),
        matchedRules: traceMatched,
        bestMatchRule: bestMatch?.rule.id || null,
        bestMatchScore: bestMatch ? bestMatch.rule.priority * 10 + bestMatch.confidence : 0,
        eliminatedRules: eliminated,
      })
    }
  }

  return {
    bestMatch,
    allMatches: matches,
    conflicts,
  }
}

/**
 * 创建规则的辅助函数
 */
export function createRule<TContext extends RuleContext, TResult extends RuleResult>(
  rule: Partial<BaseRule<TContext, TResult>> & Pick<BaseRule<TContext, TResult>, 'id' | 'name' | 'condition' | 'result'>,
): BaseRule<TContext, TResult> {
  return {
    category: 'general',
    priority: 50,
    weight: 80,
    description: '',
    reference: '',
    ...rule,
  }
}
