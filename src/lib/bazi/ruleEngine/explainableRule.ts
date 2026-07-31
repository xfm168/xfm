/**
 * C6-4 Explainable Rule Engine
 * 可解释推演：为什么命中、为什么没命中、哪些条件不足、哪些经典支持、哪些持不同意见
 */

import type { RuleDefinition, EvidenceBundle } from './types'

/** 规则解释结果 */
export interface RuleExplanation {
  /** 规则 ID */
  ruleId: string
  /** 规则名称 */
  ruleName: string
  /** 是否命中 */
  hit: boolean
  /** 命中/未命中原因总结 */
  summary: string
  /** 各条件满足情况 */
  conditions: Array<{
    description: string
    type: 'required' | 'sufficient' | 'exception'
    satisfied: boolean | null  // null=未评估
    satisfaction?: number
    /** 该条件为何满足/不满足 */
    reason?: string
    /** 该条件不足时的提示 */
    hint?: string
  }>
  /** 哪些条件不足（未满足的 required 条件） */
  missingConditions: string[]
  /** 经典支持（命中的规则有哪些经典引用） */
  classicSupport: Array<{
    classicName: string
    chapterTitle?: string
    quotedText: string
    supports: string
    citation: 'direct' | 'paraphrase'
  }>
  /** 不同流派观点（classicEvidence 中 hasControversy=true 的） */
  conflictOpinions: Array<{
    classicName: string
    opinion: string
    controversyNote: string
  }>
  /** 结论可信度 0~1 */
  confidence: number
  /** 建议的下一步（未命中时如何补救） */
  suggestions?: string[]
}

/**
 * 创建可解释规则
 * 包装普通 RuleDefinition，增加 explain() 能力
 */
export interface ExplainableRule<TInput = any> extends RuleDefinition<TInput> {
  /** 解释为什么命中/未命中 */
  explain(input: TInput, bundle?: EvidenceBundle): RuleExplanation | Promise<RuleExplanation>
}

/**
 * 将普通 RuleDefinition 转为 ExplainableRule
 */
export function makeExplainable<TInput>(rule: RuleDefinition<TInput>): ExplainableRule<TInput> {
  return {
    ...rule,
    async explain(input: TInput, bundle?: EvidenceBundle): Promise<RuleExplanation> {
      // 执行 evaluate 获取 EvidenceBundle
      const eb = bundle ?? await rule.evaluate(input, { traceable: true })
      const hit = eb.items.length > 0 && eb.items.every(i => i.result === true || i.result === 'partial')

      // 分析条件
      const conditions = (rule.condition ?? []).map(c => {
        // 尝试从 EvidenceBundle 的 trace 中匹配条件
        const traceItem = eb.items[0]?.trace?.find(t => t.step.includes(c.description.slice(0, 10)))
        const satisfied = traceItem?.satisfied ?? null
        const satisfaction = traceItem?.satisfaction
        const reason = traceItem ? (satisfied ? '条件已满足' : '条件未满足') : '条件未评估'
        const hint = satisfied === false ? `需要满足：${c.description}` : undefined
        return {
          description: c.description,
          type: c.type,
          satisfied,
          satisfaction,
          reason,
          hint,
        }
      })

      const missingConditions = conditions
        .filter(c => c.type === 'required' && c.satisfied === false)
        .map(c => c.description)

      // 经典支持
      const classicSupport = (rule.classicEvidence ?? []).map(ce => ({
        classicName: ce.classicName,
        chapterTitle: ce.chapterTitle,
        quotedText: ce.quotedText,
        supports: ce.supports,
        citation: ce.citation,
      }))

      // 不同流派观点
      const conflictOpinions = (rule.classicEvidence ?? [])
        .filter(ce => ce.hasControversy)
        .map(ce => ({
          classicName: ce.classicName,
          opinion: ce.supports,
          controversyNote: ce.controversyNote ?? '存在不同流派解释',
        }))

      const confidence = eb.items[0]?.confidence ?? 0.5
      const summary = hit
        ? `规则 ${rule.id} 命中：${rule.result}（${conditions.filter(c => c.satisfied).length}/${conditions.length} 条件满足）`
        : `规则 ${rule.id} 未命中：${missingConditions.length} 个必要条件未满足`

      const suggestions = hit ? undefined : [
        `补充以下条件可能使命中：${missingConditions.join('；')}`,
        '检查输入数据是否完整',
        '参考经典依据调整规则条件',
      ]

      return {
        ruleId: rule.id,
        ruleName: rule.name ?? rule.id,
        hit,
        summary,
        conditions,
        missingConditions,
        classicSupport,
        conflictOpinions,
        confidence,
        suggestions,
      }
    },
  }
}

/**
 * 批量将规则转为可解释规则
 */
export function makeAllExplainable<TInput>(rules: RuleDefinition<TInput>[]): ExplainableRule<TInput>[] {
  return rules.map(makeExplainable)
}
