/**
 * P0-5 Part 1: RuleDSL — 声明式规则描述语言
 *
 * Parser: 将 RuleDSLDefinition（声明式 JSON/YAML 格式）转换为 RuleDefinition（可执行规则）
 *
 * 核心理念：
 *   - 规则不再硬编码在 TypeScript 中
 *   - 新增规则只需编写声明式 DSL 数据
 *   - 古籍规则可以批量录入
 *   - AI 可以辅助生成规则
 *   - 方便版本管理和审核
 */

import type { RuleDSLDefinition, DSLCondition, DSLConditionGroup } from '../types'
import type { RuleDefinition, RuleCondition, EvidenceItem, ConflictStrategy, ClassicEvidenceRef } from '../../ruleEngine/types'
import type { Wuxing } from '../../types'
import type { SubEngineInput } from '../../xiyongshen/engines/types'
import type { EvidenceBundle } from '../../ruleEngine/types'

// ============================================================
// DSL 条件评估器
// ============================================================

/** 从 SubEngineInput 中按字段路径取值 */
function getFieldValue(input: any, fieldPath: string): any {
  if (!fieldPath) return undefined
  // 支持 'count.木' 这样的嵌套路径
  const parts = fieldPath.split('.')
  let val = input
  for (const p of parts) {
    if (val == null) return undefined
    val = val[p]
  }
  return val
}

/** 评估单个条件 */
function evaluateCondition(input: any, cond: DSLCondition): boolean {
  const actual = getFieldValue(input, cond.field)
  const expected = cond.value

  switch (cond.operator) {
    case '>=': return Number(actual) >= Number(expected)
    case '<=': return Number(actual) <= Number(expected)
    case '>':  return Number(actual) > Number(expected)
    case '<':  return Number(actual) < Number(expected)
    case '==': return actual === expected
    case '!=': return actual !== expected
    case 'in': return Array.isArray(expected) && expected.includes(actual)
    case 'not_in': return Array.isArray(expected) && !expected.includes(actual)
    case 'contains':
      if (Array.isArray(actual)) return actual.includes(expected)
      if (typeof actual === 'string') return actual.includes(String(expected))
      if (typeof actual === 'object' && actual !== null) return expected in actual
      return false
    case 'not_contains':
      if (Array.isArray(actual)) return !actual.includes(expected)
      if (typeof actual === 'string') return !actual.includes(String(expected))
      if (typeof actual === 'object' && actual !== null) return !(expected in actual)
      return true
    default: return false
  }
}

/** 递归评估条件组 */
export function evaluateConditionGroup(input: any, group: DSLConditionGroup): boolean {
  const results = group.conditions.map(c => {
    if ('logic' in c) {
      // 嵌套条件组
      return evaluateConditionGroup(input, c as DSLConditionGroup)
    }
    // 单个条件
    return evaluateCondition(input, c as DSLCondition)
  })

  if (group.logic === 'and') {
    return results.every(r => r)
  }
  return results.some(r => r) // 'or'
}

// ============================================================
// DSL → RuleDefinition 转换器
// ============================================================

/** 将 DSL 条件组转为 RuleCondition[] */
function dslConditionsToRuleConditions(group: DSLConditionGroup): RuleCondition[] {
  const conditions: RuleCondition[] = []

  function flatten(g: DSLConditionGroup, parentLogic?: string) {
    for (const c of g.conditions) {
      if ('logic' in c) {
        flatten(c as DSLConditionGroup, g.logic)
      } else {
        const cond = c as DSLCondition
        conditions.push({
          description: cond.description ?? `${cond.field} ${cond.operator} ${cond.value}`,
          type: 'required',
          formula: `${cond.field} ${cond.operator} ${JSON.stringify(cond.value)}`,
          traceable: true,
        })
      }
    }
  }
  flatten(group)
  return conditions
}

/** 将 DSL 支持的五行转为 EvidenceItem */
function buildEvidenceFromDSL(dsl: RuleDSLDefinition, satisfied: boolean): Omit<EvidenceItem, 'id'> & { resultOverride?: EvidenceItem['result'] } {
  const supportDesc = dsl.support?.map(s => `${s.wuxing}(${s.score})`).join(', ') ?? ''
  const opposeDesc = dsl.oppose?.map(s => `${s.wuxing}(${s.score})`).join(', ') ?? ''
  const level = satisfied ? 'support' : 'neutral'

  return {
    rule: dsl.name,
    level: level as EvidenceItem['level'],
    weight: dsl.priority / 100,
    description: dsl.description,
    result: satisfied ? 'satisfied' : 'failed',
    trace: [
      { step: '条件评估', text: dsl.conditions.conditions.map((c: any) => c.description ?? `${c.field} ${c.operator} ${c.value}`).join(' AND '), satisfied },
      { step: '支持五行', text: supportDesc, satisfaction: satisfied ? 1 : 0 },
      { step: '反对五行', text: opposeDesc, satisfaction: 0 },
      ...(dsl.classicEvidence ?? []).map((ce, i) => ({
        step: `古籍引用${i + 1}`,
        text: `${ce.classicName}${ce.chapter ? `·${ce.chapter}` : ''}: ${ce.quotedText}`,
        citation: ce.classicName,
      })),
    ],
  }
}

/**
 * 将 RuleDSLDefinition 转换为可执行的 RuleDefinition
 *
 * 生成的 evaluate 函数会在运行时根据 DSL 条件评估命局
 */
export function parseDSLRule(dsl: RuleDSLDefinition): RuleDefinition {
  const evaluate = (input: SubEngineInput): EvidenceBundle => {
    // 评估条件
    const satisfied = evaluateConditionGroup(input, dsl.conditions)

    // 构建五行分数
    const scores: Partial<Record<Wuxing, number>> = {}
    if (satisfied) {
      for (const s of dsl.support ?? []) {
        scores[s.wuxing as Wuxing] = (scores[s.wuxing as Wuxing] ?? 0) + s.score
      }
      for (const s of dsl.oppose ?? []) {
        scores[s.wuxing as Wuxing] = (scores[s.wuxing as Wuxing] ?? 0) - Math.abs(s.score)
      }
    }

    // 构建 Evidence
    const evidenceTemplate = buildEvidenceFromDSL(dsl, satisfied)
    const items: EvidenceItem[] = [{
      ...evidenceTemplate,
      id: `${dsl.id}-ev-0`,
    }]

    return {
      ruleId: dsl.id,
      ruleName: dsl.name,
      items,
      summary: satisfied ? dsl.result : '条件不满足',
      version: dsl.version,
      conclusion: satisfied ? 'satisfied' : 'failed',
      coreSatisfied: satisfied ? 1 : 0,
      coreTotal: 1,
    }
  }

  // 构建 RuleCondition[]
  const conditions = dslConditionsToRuleConditions(dsl.conditions)

  // 构建 ClassicEvidenceRef[]
  const classicEvidence: ClassicEvidenceRef[] | undefined = dsl.classicEvidence?.map((ce, i) => ({
    classicId: ce.classicName,
    classicName: ce.classicName,
    chapterTitle: ce.chapter,
    quotedText: ce.quotedText,
    citation: 'direct' as const,
    supports: ce.supports,
  }))

  return {
    id: dsl.id,
    name: dsl.name,
    version: dsl.version,
    priority: dsl.priority,
    source: dsl.source,
    description: dsl.description,
    condition: conditions,
    result: dsl.result,
    evidence: buildEvidenceFromDSL(dsl, true) as any,
    confidence: dsl.confidence ?? { components: {} },
    conflictStrategy: (dsl.conflictStrategy ?? 'priority-then-vote') as ConflictStrategy,
    category: dsl.category as any,
    dependencies: dsl.dependencies,
    tags: dsl.tags,
    status: 'active',
    author: dsl.author,
    reviewer: dsl.reviewer,
    classicEvidence,
    evaluate,
  }
}

// ============================================================
// DSL 序列化器（RuleDefinition → DSL）
// ============================================================

/** 将 RuleDefinition 序列化回 DSL 格式（用于导出/审核） */
export function serializeToDSL(rule: RuleDefinition): RuleDSLDefinition {
  // 从 condition[].formula 反向解析字段
  const conditions: DSLCondition[] = rule.condition
    .filter(c => c.formula)
    .map(c => {
      const match = c.formula!.match(/^(\S+)\s*(>=|<=|>|<|==|!=)\s*(.+)$/)
      if (match) {
        let value: any = match[3]
        try { value = JSON.parse(match[3]) } catch { /* keep as string */ }
        return {
          field: match[1],
          operator: match[2] as DSLCondition['operator'],
          value,
          description: c.description,
        }
      }
      return {
        field: c.description ?? 'unknown',
        operator: '==' as const,
        value: true,
        description: c.description,
      }
    })

  return {
    id: rule.id,
    name: rule.name ?? rule.id,
    version: rule.version,
    source: Array.isArray(rule.source) ? rule.source : [rule.source],
    priority: rule.priority,
    category: rule.category ?? 'general',
    description: rule.description,
    conditions: { logic: 'and', conditions },
    result: rule.result,
    confidence: rule.confidence,
    dependencies: rule.dependencies,
    conflictStrategy: rule.conflictStrategy,
    classicEvidence: rule.classicEvidence?.map(ce => ({
      classicName: ce.classicName,
      chapter: ce.chapterTitle,
      quotedText: ce.quotedText,
      supports: ce.supports,
    })),
    tags: rule.tags,
    author: rule.author,
    reviewer: rule.reviewer,
  }
}

// ============================================================
// DSL 批量加载器
// ============================================================

/** 从 JSON 数组批量加载 DSL 规则 */
export function loadDSLRules(dslArray: RuleDSLDefinition[]): RuleDefinition[] {
  return dslArray.map(dsl => parseDSLRule(dsl))
}

/** 验证 DSL 规则格式 */
export function validateDSLRule(dsl: RuleDSLDefinition): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!dsl.id) errors.push('缺少 id')
  if (!dsl.name) errors.push('缺少 name')
  if (!dsl.version) errors.push('缺少 version')
  if (!dsl.source || dsl.source.length === 0) errors.push('缺少 source')
  if (!dsl.priority && dsl.priority !== 0) errors.push('缺少 priority')
  if (!dsl.conditions) errors.push('缺少 conditions')
  if (!dsl.result) errors.push('缺少 result')

  // 检查条件格式
  if (dsl.conditions) {
    function checkGroup(group: DSLConditionGroup) {
      if (!group.logic || !['and', 'or'].includes(group.logic)) {
        errors.push(`条件组 logic 必须是 'and' 或 'or'`)
      }
      for (const c of group.conditions) {
        if ('logic' in c) {
          checkGroup(c as DSLConditionGroup)
        } else {
          const cond = c as DSLCondition
          if (!cond.field) errors.push(`条件缺少 field`)
          if (!cond.operator) errors.push(`条件缺少 operator`)
        }
      }
    }
    checkGroup(dsl.conditions)
  }

  return { valid: errors.length === 0, errors }
}
