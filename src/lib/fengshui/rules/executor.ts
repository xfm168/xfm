/**
 * Rule Engine - 规则执行器
 * 
 * 执行所有规则，返回结果。
 */

import type {
  FengShuiRule,
  FengShuiContext,
  FengShuiRuleResult,
  RuleExecutionInput,
  RuleExecutionResult,
  RuleCategory,
} from './types'

import { ALL_RULES } from './index'

/**
 * 执行所有规则
 */
export function executeRules(input: RuleExecutionInput): FengShuiRuleResult[] {
  const results: FengShuiRuleResult[] = []
  
  const applicableRules = getApplicableRules(input)
  
  for (const rule of applicableRules) {
    const result = executeSingleRule(rule, input.context)
    results.push(result)
  }
  
  return results
}

/**
 * 执行规则并返回完整结果
 */
export function executeRulesFull(input: RuleExecutionInput): RuleExecutionResult {
  const results = executeRules(input)
  
  // 计算综合得分
  const totalWeight = results.reduce((sum, r) => sum + r.weight, 0)
  const weightedScore = results.reduce((sum, r) => sum + r.score * r.weight, 0)
  const overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0
  
  // 各分类统计
  const categoryScores: Record<string, { passed: number; total: number; avgScore: number }> = {}
  
  for (const r of results) {
    if (!categoryScores[r.category]) {
      categoryScores[r.category] = { passed: 0, total: 0, avgScore: 0 }
    }
    categoryScores[r.category].total++
    if (r.matched) {
      categoryScores[r.category].passed++
    }
    categoryScores[r.category].avgScore += r.score
  }
  
  for (const cat of Object.keys(categoryScores)) {
    const data = categoryScores[cat]
    data.avgScore = data.total > 0 ? Math.round(data.avgScore / data.total) : 0
  }
  
  // 各房间统计
  const roomScores: Record<string, { passed: number; total: number; avgScore: number }> = {}
  
  return {
    results,
    overallScore,
    passedCount: results.filter(r => r.matched).length,
    failedCount: results.filter(r => !r.matched).length,
    categoryScores: categoryScores as any,
    roomScores,
  }
}

/**
 * 获取适用的规则
 */
function getApplicableRules(input: RuleExecutionInput): FengShuiRule[] {
  let rules = [...ALL_RULES]
  
  if (input.categories && input.categories.length > 0) {
    rules = rules.filter(r => input.categories!.includes(r.category))
  }
  
  return rules
}

/**
 * 执行单条规则
 */
function executeSingleRule(
  rule: FengShuiRule,
  context: FengShuiContext
): FengShuiRuleResult {
  let matched = false
  let score = 0
  
  try {
    matched = rule.condition(context)
    score = matched ? rule.result.score : 0
  } catch (error) {
    console.error(`Rule ${rule.id} execution error:`, error)
    matched = false
    score = 0
  }
  
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    category: rule.category,
    matched,
    score,
    weight: rule.weight,
    priority: rule.priority,
    type: matched ? rule.result.type : 'neutral',
    explanation: matched ? rule.result.type === 'auspicious' 
      ? `符合规则：${rule.name}` 
      : `违反规则：${rule.name}`
      : undefined,
    classicalRef: rule.referenceIds.length > 0 
      ? rule.referenceIds.join(', ')
      : undefined,
    confidence: rule.confidence,
    source: rule.source,
  }
}
