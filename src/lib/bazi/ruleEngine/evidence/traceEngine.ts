import type { RuleCondition, EvidenceItem, EvidenceBundle } from '../types'

export interface BuildTraceOptions {
  ruleId?: string
  conclusion: string
  conditions: RuleCondition[]
  appendConclusionStep?: boolean
  citation?: string
}

export function buildTraceFromConditions(options: BuildTraceOptions): NonNullable<EvidenceItem['trace']> {
  const { conclusion, conditions, appendConclusionStep = true, citation } = options
  const trace: NonNullable<EvidenceItem['trace']> = conditions.map(c => ({
    step: c.description.length > 20 ? c.description.slice(0, 20) + '…' : c.description,
    text: c.formula ?? c.description,
    satisfied: c.satisfied,
    satisfaction: c.satisfaction,
    citation,
  }))
  if (appendConclusionStep) {
    const passedCount = conditions.filter(c => c.satisfied).length
    const passedStr = passedCount === conditions.length
      ? '全部条件满足'
      : `${passedCount}/${conditions.length} 条件满足`
    trace.push({
      step: '结论',
      text: `${conclusion}（${passedStr}）`,
      satisfied: passedCount === conditions.length,
      satisfaction: Number((passedCount / Math.max(1, conditions.length)).toFixed(2)),
      citation,
    })
  }
  return trace
}

export function traceToNarrative(trace: NonNullable<EvidenceItem['trace']>): string {
  return trace.map(t => {
    const flag =
      t.satisfied === true ? '✓' :
      t.satisfied === false ? '✗' :
      t.satisfaction != null ? `${Math.round(t.satisfaction * 100)}%` : '·'
    return `${flag} [${t.step}] ${t.text}${t.citation ? `（引自《${t.citation}》）` : ''}`
  }).join('\n')
}

export function enrichEvidenceItemWithTrace(
  item: EvidenceItem,
  options: BuildTraceOptions,
): EvidenceItem {
  const trace = buildTraceFromConditions(options)
  const narrative = traceToNarrative(trace)
  return {
    ...item,
    conditions: options.conditions,
    trace,
    meta: { ...item.meta, narrative },
  }
}

export function createDemoCaiWangBundle(): EvidenceBundle {
  const conditions: RuleCondition[] = [
    { description: '日主明确', type: 'required', formula: '日主=乙木', satisfied: true, satisfaction: 1, traceable: true, traceText: '日主乙木' },
    { description: '月令得令', type: 'required', formula: '月令申金→财星当令', satisfied: true, satisfaction: 1, traceable: true, traceText: '月令申金，财星当令' },
    { description: '天干透财', type: 'sufficient', formula: '年干戊+月干己 透两重财', satisfied: true, satisfaction: 1, traceable: true, traceText: '天干透正偏财' },
    { description: '地支有财库', type: 'sufficient', formula: '未丑皆为财库', satisfied: true, satisfaction: 1, traceable: true, traceText: '地支有两重财库' },
  ]
  const trace = buildTraceFromConditions({ ruleId: 'XIYONG-CAI-001', conclusion: '财旺', conditions, citation: '子平真诠' })
  const item: EvidenceItem = {
    id: 'demo-caiwang-item',
    ruleId: 'XIYONG-CAI-001',
    version: '1.0.0',
    source: '子平真诠',
    rule: '喜用神·财旺判定',
    result: true,
    confidence: 0.92,
    level: 'strong_support',
    weight: 0.9,
    description: '日主乙木，月令申金得令，天干透财，地支两重财库，判定财旺',
  }
  const enriched = enrichEvidenceItemWithTrace(item, { ruleId: 'XIYONG-CAI-001', conclusion: '财旺', conditions, citation: '子平真诠' })
  return {
    ruleId: 'XIYONG-CAI-001',
    ruleName: '财旺判定',
    summary: '财旺：得令+透干+地支财库',
    narrative: traceToNarrative(trace),
    version: '1.0.0',
    items: [enriched],
  }
}
