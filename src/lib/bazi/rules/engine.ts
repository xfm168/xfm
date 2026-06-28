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
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)
  const matches: RuleMatchResult<TContext, TResult>[] = []
  const conflicts: BaseRule<TContext, TResult>[] = []

  for (const rule of sortedRules) {
    try {
      const matched = rule.condition(context)
      if (matched) {
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
    } catch (_e) {
      // 规则执行错误，跳过
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
      return currentScore > bestScore ? current : best
    })
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
