import type { RuleDefinition, EvidenceBundle, EvidenceItem } from '../ruleEngine/types'
import { makeEvidenceItem } from '../ruleEngine/evidenceEngine'
import type { MinimalPillarInput, WuXing } from './types'

const WUXING_GENERATE: Record<WuXing, WuXing> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

const WUXING_OVERCOME: Record<WuXing, WuXing> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
}

function makeTrace(step: string, text: string, satisfied: boolean, citation?: string) {
  return { step, text, satisfied, citation }
}

function buildBundle(
  ruleId: string,
  ruleName: string,
  satisfiedCores: number,
  totalCores: number,
  itemResult: EvidenceItem['result'],
  confidence: number,
  traceList: ReturnType<typeof makeTrace>[],
  summary: string,
): EvidenceBundle {
  const item = makeEvidenceItem({
    id: `${ruleId}-item-1`,
    rule: ruleName,
    ruleId,
    result: itemResult,
    confidence,
    level: satisfiedCores === totalCores ? 'core' : 'support',
    weight: 1.0,
    description: summary,
    trace: traceList.map(t => ({
      step: t.step,
      text: t.text,
      satisfied: t.satisfied,
      citation: t.citation,
    })),
  })
  return {
    ruleId,
    ruleName,
    items: [item],
    summary,
    coreSatisfied: satisfiedCores,
    coreTotal: totalCores,
  }
}

const ZHENG_RULE_001: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-ZHENG-001',
  version: '1.0.0',
  priority: 50,
  source: ['子平真诠', '滴天髓'],
  description: '正格（身弱用印比）：日主身弱有根，用印星比劫扶身',
  category: 'geju',
  condition: [
    { description: '日主身弱（dayStrengthLevel < 0）', type: 'required', traceable: true, traceText: '日主强弱值小于0，为身弱' },
    { description: '日主有根（dayRootCount >= 1）', type: 'required', traceable: true, traceText: '地支有印比通根，非真从格' },
    { description: '不满足专旺/从格等特殊格条件', type: 'exception', traceable: true, traceText: '非特殊格，归入正格' },
  ],
  result: '正格·身弱用印比，以扶抑法取用',
  evidence: {
    rule: '正格身弱',
    level: 'support',
    weight: 0.8,
    description: '身弱有根，归入正格扶抑体系',
  },
  confidence: {
    components: { geju: 0.7, calendar: 0.2, xiyongshen: 0.1 },
    note: '正格判定的基础可信度，随旺衰精度上调',
  },
  conflictStrategy: 'prefer-conservative',
  evaluate: (input) => {
    const strength = input.dayStrengthLevel ?? 0
    const roots = input.dayRootCount ?? 0
    const t1 = strength < 0
    const t2 = roots >= 1
    const t3 = (input.wuxingCount[input.dayGanWuxing] ?? 0) <= 4
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2 && t3
    const trace = [
      makeTrace('S1-身弱判定', `日主强弱=${strength}，身弱判定：${t1 ? '满足' : '不满足'}`, t1, '《子平真诠》用神篇'),
      makeTrace('S2-根气判定', `印比根数量=${roots}，有根判定：${t2 ? '满足' : '不满足'}`, t2, '《滴天髓》通根篇'),
      makeTrace('S3-排除特殊格', `日主五行计数=${input.wuxingCount[input.dayGanWuxing] ?? 0}，非专旺：${t3 ? '满足' : '不满足'}`, t3),
    ]
    const conf = active ? 0.82 : 0.25
    return buildBundle('GEJU-ZHENG-001', '正格身弱', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? '正格身弱成立：以印比扶身为用神方向' : '正格身弱不成立')
  },
  _gejuCategory: '正格',
  _gejuSubtype: '身弱用印比',
}

const ZHENG_RULE_002: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-ZHENG-002',
  version: '1.0.0',
  priority: 50,
  source: ['子平真诠', '滴天髓'],
  description: '正格（身强用财官食伤）：日主身强旺，用财官食伤泄耗',
  category: 'geju',
  condition: [
    { description: '日主身强（dayStrengthLevel > 0）', type: 'required', traceable: true },
    { description: '日主有根但不致专旺', type: 'required', traceable: true },
    { description: '不满足专旺/从格条件', type: 'exception', traceable: true },
  ],
  result: '正格·身强用财官食伤，以扶抑法取用',
  evidence: {
    rule: '正格身强',
    level: 'support',
    weight: 0.8,
    description: '身强旺有根，归入正格扶抑体系',
  },
  confidence: {
    components: { geju: 0.7, calendar: 0.2, xiyongshen: 0.1 },
  },
  conflictStrategy: 'prefer-conservative',
  evaluate: (input) => {
    const strength = input.dayStrengthLevel ?? 0
    const roots = input.dayRootCount ?? 0
    const selfCount = input.wuxingCount[input.dayGanWuxing] ?? 0
    const t1 = strength > 0
    const t2 = roots >= 1 && selfCount <= 5
    const t3 = selfCount <= 5
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2 && t3
    const trace = [
      makeTrace('S1-身强判定', `日主强弱=${strength}，身强判定：${t1 ? '满足' : '不满足'}`, t1, '《子平真诠》用神篇'),
      makeTrace('S2-根气范围', `根=${roots} 日主五行计数=${selfCount}，非专旺：${t2 ? '满足' : '不满足'}`, t2),
      makeTrace('S3-排除专旺', `日主五行计数=${selfCount}，非专旺：${t3 ? '满足' : '不满足'}`, t3),
    ]
    const conf = active ? 0.8 : 0.22
    return buildBundle('GEJU-ZHENG-002', '正格身强', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? '正格身强成立：以财官食伤泄耗为用神方向' : '正格身强不成立')
  },
  _gejuCategory: '正格',
  _gejuSubtype: '身强用财官食伤',
}

function makeZhuanWangRule(idx: number, wuxing: WuXing, subType: string, sourceBook: string) {
  const rule: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
    id: `GEJU-ZHUANWANG-00${idx}`,
    version: '1.0.0',
    priority: 200,
    source: ['滴天髓·专旺篇', sourceBook],
    description: `专旺格·${subType}：${wuxing}日主，柱中${wuxing}旺极成势，一气专旺`,
    category: 'geju',
    condition: [
      { description: `日干五行为${wuxing}`, type: 'required', traceable: true },
      { description: `${wuxing}五行计数 >= 5（八字中占绝对多数）`, type: 'required', traceable: true },
      { description: `dayStrengthLevel >= 2（极旺）`, type: 'required', traceable: true },
      { description: '月令为日主同党或印星', type: 'sufficient', traceable: true },
    ],
    result: `专旺格·${subType}成立，顺其气势，用同党食伤泄秀`,
    evidence: {
      rule: `专旺·${subType}`,
      level: 'core',
      weight: 0.95,
      description: `${wuxing}一气专旺，${subType}成立`,
    },
    confidence: {
      components: { geju: 0.85, calendar: 0.15 },
      note: '专旺格优先级最高，需严格满足旺极条件',
    },
    conflictStrategy: 'priority-then-vote',
    evaluate: (input) => {
      const t1 = input.dayGanWuxing === wuxing
      const count = input.wuxingCount[wuxing] ?? 0
      const t2 = count >= 5
      const strength = input.dayStrengthLevel ?? 0
      const t3 = strength >= 2
      const monthWx = input.monthZhiWuxing
      const t4 = monthWx === wuxing || monthWx === Object.entries(WUXING_GENERATE).find(([, v]) => v === wuxing)?.[0] as WuXing
      const cores = [t1, t2, t3].filter(Boolean).length
      const active = t1 && t2 && t3
      const trace = [
        makeTrace('S1-日干五行', `日干=${input.dayGan}(${input.dayGanWuxing})，为${wuxing}：${t1 ? '满足' : '不满足'}`, t1),
        makeTrace('S2-五行计数', `柱中${wuxing}=${count}个，>=5：${t2 ? '满足' : '不满足'}`, t2, '《滴天髓》专旺篇'),
        makeTrace('S3-身强极旺', `dayStrengthLevel=${strength}，>=2：${t3 ? '满足' : '不满足'}`, t3),
        makeTrace('S4-月令辅助', `月令=${input.monthZhi}(${monthWx})，为同党/印：${t4 ? '满足' : '不满足'}`, t4, sourceBook),
      ]
      const conf = active ? Math.min(0.95, 0.6 + count * 0.05 + (t4 ? 0.05 : 0)) : 0.15
      return buildBundle(rule.id, `专旺·${subType}`, cores, 3, active ? 'satisfied' : 'failed', conf, trace,
        active ? `${subType}成立：${wuxing}专旺极甚，宜顺不宜逆` : `${subType}不成立`)
    },
    _gejuCategory: '专旺格',
    _gejuSubtype: subType,
  }
  return rule
}

const ZHUANWANG_RULES = [
  makeZhuanWangRule(1, '木', '曲直仁寿格', '《三命通会》曲直格'),
  makeZhuanWangRule(2, '火', '炎上格', '《三命通会》炎上格'),
  makeZhuanWangRule(3, '土', '稼穑格', '《渊海子平》稼穑格'),
  makeZhuanWangRule(4, '金', '从革格', '《三命通会》从革格'),
  makeZhuanWangRule(5, '水', '润下格', '《渊海子平》润下格'),
]

const CONG_001: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-CONG-001',
  version: '1.0.0',
  priority: 180,
  source: ['子平真诠·从格篇', '滴天髓·从气篇'],
  description: '弃命从势（真从）：日主极弱无根无印，顺从财官食伤大势',
  category: 'geju',
  condition: [
    { description: '日主无根（dayRootCount == 0）', type: 'required', traceable: true },
    { description: '日主极弱（dayStrengthLevel <= -2）', type: 'required', traceable: true },
    { description: '异党（财官食伤）五行计数 >= 5', type: 'required', traceable: true },
    { description: '无印星透干生扶', type: 'exception', traceable: true },
  ],
  result: '弃命从势（真从格）成立，以从神为用神',
  evidence: {
    rule: '弃命从势',
    level: 'core',
    weight: 0.9,
    description: '日主无根极弱，真从财官食伤之势',
  },
  confidence: {
    components: { geju: 0.8, calendar: 0.15, shensha: 0.05 },
    note: '真从格需严格无印无比根',
  },
  conflictStrategy: 'priority-then-vote',
  evaluate: (input) => {
    const roots = input.dayRootCount ?? 0
    const strength = input.dayStrengthLevel ?? 0
    const selfWx = input.dayGanWuxing
    const yinWx = Object.entries(WUXING_GENERATE).find(([, v]) => v === selfWx)?.[0] as WuXing
    const yinCount = input.wuxingCount[yinWx] ?? 0
    const caiWx = WUXING_OVERCOME[selfWx]
    const guanWx = Object.entries(WUXING_OVERCOME).find(([, v]) => v === selfWx)?.[0] as WuXing
    const shishangWx = WUXING_GENERATE[selfWx]
    const diffCount = (input.wuxingCount[caiWx] ?? 0) + (input.wuxingCount[guanWx] ?? 0) + (input.wuxingCount[shishangWx] ?? 0)
    const t1 = roots === 0
    const t2 = strength <= -2
    const t3 = diffCount >= 5
    const t4 = yinCount <= 1
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2 && t3 && t4
    const trace = [
      makeTrace('S1-日主无根', `印比根=${roots}，无根：${t1 ? '满足' : '不满足'}`, t1, '《子平真诠》从格篇'),
      makeTrace('S2-日主极弱', `强弱值=${strength}，<=-2：${t2 ? '满足' : '不满足'}`, t2),
      makeTrace('S3-异党势众', `财官食伤合计=${diffCount}，>=5：${t3 ? '满足' : '不满足'}`, t3),
      makeTrace('S4-印星微弱', `印五行(${yinWx})计数=${yinCount}，无强印：${t4 ? '满足' : '不满足'}`, t4, '《滴天髓》从气篇'),
    ]
    const conf = active ? 0.88 : 0.18
    return buildBundle('GEJU-CONG-001', '弃命从势', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? '真从格成立：弃命从势，以从神取用' : '真从格不成立')
  },
  _gejuCategory: '从格',
  _gejuSubtype: '真从·弃命从势',
}

const CONG_002: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-CONG-002',
  version: '1.0.0',
  priority: 160,
  source: ['滴天髓·假从篇', '神峰通考'],
  description: '假从格：日主微有1根气，但大势所趋，仍顺从异党',
  category: 'geju',
  condition: [
    { description: '日主仅有 1 根（dayRootCount == 1）', type: 'required', traceable: true },
    { description: '日主弱（-2 < dayStrengthLevel < 0）', type: 'required', traceable: true },
    { description: '异党五行计数 >= 4', type: 'required', traceable: true },
  ],
  result: '假从格成立，从势中微有根气，运遇扶身则变',
  evidence: {
    rule: '假从格',
    level: 'support',
    weight: 0.7,
    description: '日主微根，从势不真，假从',
  },
  confidence: {
    components: { geju: 0.65, calendar: 0.25, xiyongshen: 0.1 },
  },
  conflictStrategy: 'prefer-conservative',
  evaluate: (input) => {
    const roots = input.dayRootCount ?? 0
    const strength = input.dayStrengthLevel ?? 0
    const selfWx = input.dayGanWuxing
    const caiWx = WUXING_OVERCOME[selfWx]
    const guanWx = Object.entries(WUXING_OVERCOME).find(([, v]) => v === selfWx)?.[0] as WuXing
    const shishangWx = WUXING_GENERATE[selfWx]
    const diffCount = (input.wuxingCount[caiWx] ?? 0) + (input.wuxingCount[guanWx] ?? 0) + (input.wuxingCount[shishangWx] ?? 0)
    const t1 = roots === 1
    const t2 = strength > -2 && strength < 0
    const t3 = diffCount >= 4
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2 && t3
    const trace = [
      makeTrace('S1-根气数量', `dayRootCount=${roots}，恰为1根：${t1 ? '满足' : '不满足'}`, t1),
      makeTrace('S2-强弱区间', `dayStrengthLevel=${strength}，在(-2,0)：${t2 ? '满足' : '不满足'}`, t2, '《滴天髓》假从篇'),
      makeTrace('S3-异党势众', `财官食伤=${diffCount}，>=4：${t3 ? '满足' : '不满足'}`, t3),
    ]
    const conf = active ? 0.72 : 0.2
    return buildBundle('GEJU-CONG-002', '假从格', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? '假从格成立：微根难支，顺从大势' : '假从格不成立')
  },
  _gejuCategory: '假从格',
  _gejuSubtype: '假从·1微根',
}

const CONG_003: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-CONG-003',
  version: '1.0.0',
  priority: 140,
  source: ['三命通会·半从格', '现代命理流派'],
  description: '半从格：日主有 2-3 印比，但异党仍占优，边从边扶',
  category: 'geju',
  condition: [
    { description: 'dayRootCount 在 2~3 之间', type: 'required', traceable: true },
    { description: 'dayStrengthLevel < 0（仍偏弱）', type: 'required', traceable: true },
    { description: '异党数 > 同党数', type: 'required', traceable: true },
  ],
  result: '半从格成立，从神兼扶身，视运而定',
  evidence: {
    rule: '半从格',
    level: 'neutral',
    weight: 0.6,
    description: '印比 2-3 仍偏弱，半从半扶',
  },
  confidence: {
    components: { geju: 0.55, calendar: 0.3, xiyongshen: 0.15 },
  },
  conflictStrategy: 'prefer-conservative',
  evaluate: (input) => {
    const roots = input.dayRootCount ?? 0
    const strength = input.dayStrengthLevel ?? 0
    const selfWx = input.dayGanWuxing
    const yinWx = Object.entries(WUXING_GENERATE).find(([, v]) => v === selfWx)?.[0] as WuXing
    const sameCount = (input.wuxingCount[selfWx] ?? 0) + (input.wuxingCount[yinWx] ?? 0)
    const totalCount = Object.values(input.wuxingCount).reduce((a, b) => a + b, 0)
    const diffCount = totalCount - sameCount
    const t1 = roots >= 2 && roots <= 3
    const t2 = strength < 0
    const t3 = diffCount > sameCount
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2 && t3
    const trace = [
      makeTrace('S1-根气范围', `dayRootCount=${roots}，2-3之间：${t1 ? '满足' : '不满足'}`, t1),
      makeTrace('S2-仍偏弱', `dayStrengthLevel=${strength}，<0：${t2 ? '满足' : '不满足'}`, t2),
      makeTrace('S3-异党占优', `同党=${sameCount} 异党=${diffCount}，异党>同党：${t3 ? '满足' : '不满足'}`, t3),
    ]
    const conf = active ? 0.62 : 0.22
    return buildBundle('GEJU-CONG-003', '半从格', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? '半从格成立：印比尚存，半从半扶' : '半从格不成立')
  },
  _gejuCategory: '半从格',
  _gejuSubtype: '半从·2-3根',
}

const CONG_004: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-CONG-004',
  version: '1.0.0',
  priority: 170,
  source: ['三命通会·弃命从财', '子平真诠'],
  description: '弃命从财：日主无根，财星当令或财星极旺',
  category: 'geju',
  condition: [
    { description: '日主无根（dayRootCount == 0）', type: 'required', traceable: true },
    { description: '财星五行计数 >= 3', type: 'required', traceable: true },
    { description: 'dayStrengthLevel <= -1.5', type: 'required', traceable: true },
  ],
  result: '弃命从财成立，以财为用神，食伤为辅',
  evidence: {
    rule: '弃命从财',
    level: 'core',
    weight: 0.9,
    description: '日主无根，财星旺极，从财',
  },
  confidence: {
    components: { geju: 0.8, calendar: 0.2 },
  },
  conflictStrategy: 'priority-then-vote',
  evaluate: (input) => {
    const roots = input.dayRootCount ?? 0
    const strength = input.dayStrengthLevel ?? 0
    const caiWx = WUXING_OVERCOME[input.dayGanWuxing]
    const caiCount = input.wuxingCount[caiWx] ?? 0
    const t1 = roots === 0
    const t2 = caiCount >= 3
    const t3 = strength <= -1.5
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2 && t3
    const trace = [
      makeTrace('S1-日主无根', `dayRootCount=${roots}，无根：${t1 ? '满足' : '不满足'}`, t1),
      makeTrace('S2-财星旺', `财五行(${caiWx})=${caiCount}，>=3：${t2 ? '满足' : '不满足'}`, t2, '《三命通会》弃命从财'),
      makeTrace('S3-身弱甚', `dayStrengthLevel=${strength}，<=-1.5：${t3 ? '满足' : '不满足'}`, t3),
    ]
    const conf = active ? 0.85 : 0.2
    return buildBundle('GEJU-CONG-004', '弃命从财', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? '弃命从财成立：专从财星，富格' : '弃命从财不成立')
  },
  _gejuCategory: '从财格',
  _gejuSubtype: '弃命从财',
}

const CONG_005: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-CONG-005',
  version: '1.0.0',
  priority: 170,
  source: ['三命通会·弃命从杀', '渊海子平'],
  description: '弃命从杀（从官杀）：日主无根，官杀当令极旺',
  category: 'geju',
  condition: [
    { description: '日主无根（dayRootCount == 0）', type: 'required', traceable: true },
    { description: '官杀五行计数 >= 3', type: 'required', traceable: true },
    { description: 'dayStrengthLevel <= -1.5', type: 'required', traceable: true },
  ],
  result: '弃命从杀成立，以官杀为用神，财星为辅',
  evidence: {
    rule: '弃命从杀',
    level: 'core',
    weight: 0.9,
    description: '日主无根，官杀旺极，从杀',
  },
  confidence: {
    components: { geju: 0.8, calendar: 0.2 },
  },
  conflictStrategy: 'priority-then-vote',
  evaluate: (input) => {
    const roots = input.dayRootCount ?? 0
    const strength = input.dayStrengthLevel ?? 0
    const guanWx = Object.entries(WUXING_OVERCOME).find(([, v]) => v === input.dayGanWuxing)?.[0] as WuXing
    const guanCount = input.wuxingCount[guanWx] ?? 0
    const t1 = roots === 0
    const t2 = guanCount >= 3
    const t3 = strength <= -1.5
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2 && t3
    const trace = [
      makeTrace('S1-日主无根', `dayRootCount=${roots}，无根：${t1 ? '满足' : '不满足'}`, t1),
      makeTrace('S2-官杀旺', `官杀五行(${guanWx})=${guanCount}，>=3：${t2 ? '满足' : '不满足'}`, t2, '《三命通会》弃命从杀'),
      makeTrace('S3-身弱甚', `dayStrengthLevel=${strength}，<=-1.5：${t3 ? '满足' : '不满足'}`, t3),
    ]
    const conf = active ? 0.86 : 0.2
    return buildBundle('GEJU-CONG-005', '弃命从杀', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? '弃命从杀成立：专从官杀，贵格须防凶运' : '弃命从杀不成立')
  },
  _gejuCategory: '从杀格',
  _gejuSubtype: '弃命从杀·从官杀',
}

const CONG_006: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-CONG-006',
  version: '1.0.0',
  priority: 165,
  source: ['子平真诠·从儿格', '滴天髓·从儿篇'],
  description: '弃命从儿（从食伤）：日主无根，食伤当令旺极，从儿格',
  category: 'geju',
  condition: [
    { description: '日主无根（dayRootCount == 0）', type: 'required', traceable: true },
    { description: '食伤五行计数 >= 3', type: 'required', traceable: true },
    { description: 'dayStrengthLevel <= -1.5', type: 'required', traceable: true },
  ],
  result: '弃命从儿成立，以食伤泄秀为用神，财星为辅',
  evidence: {
    rule: '弃命从儿',
    level: 'core',
    weight: 0.88,
    description: '日主无根，食伤旺极，从儿',
  },
  confidence: {
    components: { geju: 0.78, calendar: 0.22 },
  },
  conflictStrategy: 'priority-then-vote',
  evaluate: (input) => {
    const roots = input.dayRootCount ?? 0
    const strength = input.dayStrengthLevel ?? 0
    const ssWx = WUXING_GENERATE[input.dayGanWuxing]
    const ssCount = input.wuxingCount[ssWx] ?? 0
    const t1 = roots === 0
    const t2 = ssCount >= 3
    const t3 = strength <= -1.5
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2 && t3
    const trace = [
      makeTrace('S1-日主无根', `dayRootCount=${roots}，无根：${t1 ? '满足' : '不满足'}`, t1),
      makeTrace('S2-食伤旺', `食伤五行(${ssWx})=${ssCount}，>=3：${t2 ? '满足' : '不满足'}`, t2, '《滴天髓》从儿篇'),
      makeTrace('S3-身弱甚', `dayStrengthLevel=${strength}，<=-1.5：${t3 ? '满足' : '不满足'}`, t3),
    ]
    const conf = active ? 0.83 : 0.2
    return buildBundle('GEJU-CONG-006', '弃命从儿', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? '弃命从儿成立：从儿秀气，才华横溢' : '弃命从儿不成立')
  },
  _gejuCategory: '从儿格',
  _gejuSubtype: '弃命从儿·从食伤',
}

const LIANGSHEN_001: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-LIANGSHEN-001',
  version: '1.0.0',
  priority: 120,
  source: ['滴天髓·两神成象篇', '三命通会'],
  description: '两神成象格：柱中仅有两行，各占约 50%，两气各半',
  category: 'geju',
  condition: [
    { description: '有且仅有 2 种五行计数 > 0', type: 'required', traceable: true },
    { description: '两种五行计数之和 = 8', type: 'required', traceable: true },
    { description: '两者比例在 3:5 ~ 5:3 之间（各近半）', type: 'required', traceable: true },
  ],
  result: '两神成象格成立，两行并立，视生克定格局层次',
  evidence: {
    rule: '两神成象',
    level: 'support',
    weight: 0.75,
    description: '八字两行各半，两神成象',
  },
  confidence: {
    components: { geju: 0.7, calendar: 0.3 },
  },
  conflictStrategy: 'majority-vote',
  evaluate: (input) => {
    const entries = Object.entries(input.wuxingCount).filter(([, c]) => c > 0)
    const nonZeroWxs = entries.length
    const total = entries.reduce((s, [, c]) => s + c, 0)
    let t3 = false
    let ratioDesc = ''
    if (nonZeroWxs === 2) {
      const [, a] = entries[0] as [string, number]
      const [, b] = entries[1] as [string, number]
      const big = Math.max(a, b)
      const small = Math.min(a, b)
      t3 = small / big >= 3 / 5
      ratioDesc = `${small}:${big}`
    }
    const t1 = nonZeroWxs === 2
    const t2 = total === 8
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2 && t3
    const trace = [
      makeTrace('S1-行数量', `非0五行=${nonZeroWxs}种，恰好2种：${t1 ? '满足' : '不满足'}`, t1, '《滴天髓》两神成象篇'),
      makeTrace('S2-总和=8', `总计数=${total}，等于8：${t2 ? '满足' : '不满足'}`, t2),
      makeTrace('S3-比例近半', `比例=${ratioDesc || '-'}，>=3:5：${t3 ? '满足' : '不满足'}`, t3),
    ]
    const conf = active ? 0.78 : 0.2
    return buildBundle('GEJU-LIANGSHEN-001', '两神成象', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? '两神成象格成立：两行并立，清奇之格' : '两神成象格不成立')
  },
  _gejuCategory: '两神成象格',
  _gejuSubtype: '两气各半',
}

const HUAQI_001: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-HUAQI-001',
  version: '1.0.0',
  priority: 150,
  source: ['三命通会·化气篇', '渊海子平·天干五合化气'],
  description: '化气格·甲己化土：日干甲或己，柱中见对方天干，月令土旺化神得令',
  category: 'geju',
  condition: [
    { description: '日干为甲或己', type: 'required', traceable: true },
    { description: '其他天干见对应五合之干（甲配己、己配甲）', type: 'required', traceable: true },
    { description: '月令为辰戌丑未（土月）或化神土计数 >= 2', type: 'required', traceable: true },
  ],
  result: '化气格·甲己化土成立，以化神土为论命基准',
  evidence: {
    rule: '化气·甲己化土',
    level: 'support',
    weight: 0.8,
    description: '甲己相合，化神土得令，化气格',
  },
  confidence: {
    components: { geju: 0.65, calendar: 0.35 },
    note: '化气格真化难遇，多为假化，需结合行运',
  },
  conflictStrategy: 'custom',
  evaluate: (input) => {
    const day = input.dayGan
    const t1 = day === '甲' || day === '己'
    const target = day === '甲' ? '己' : '甲'
    const otherGans = input.fourPillars.filter(p => p.gan !== day).map(p => p.gan)
    const t2 = otherGans.includes(target)
    const earthZhi = ['辰', '戌', '丑', '未']
    const earthCount = input.wuxingCount['土'] ?? 0
    const t3 = earthZhi.includes(input.monthZhi) || earthCount >= 2
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2 && t3
    const trace = [
      makeTrace('S1-日干属甲己', `日干=${day}，甲或己：${t1 ? '满足' : '不满足'}`, t1),
      makeTrace('S2-见五合之干', `其他天干=[${otherGans.join(',')}]，见${target}：${t2 ? '满足' : '不满足'}`, t2, '《三命通会》天干五合'),
      makeTrace('S3-化神得令', `月令=${input.monthZhi} 土计数=${earthCount}，土旺：${t3 ? '满足' : '不满足'}`, t3, '《渊海子平》化气篇'),
    ]
    const conf = active ? 0.75 : 0.2
    return buildBundle('GEJU-HUAQI-001', '化气·甲己化土', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? '化气格·甲己化土成立：真化须行运辅助' : '化气格不成立')
  },
  _gejuCategory: '化气格',
  _gejuSubtype: '甲己化土',
}

const XIANDAI_001: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-XIANDAI-001',
  version: '1.0.0',
  priority: 100,
  source: ['现代命理·归禄格', '三命通会·归禄格'],
  description: '归禄格（现代特殊格）：日干之禄在时支，身旺用财官食伤',
  category: 'geju',
  condition: [
    { description: '时支为日干之禄位（甲禄寅、乙禄卯、丙戊禄巳、丁己禄午、庚禄申、辛禄酉、壬禄亥、癸禄子）', type: 'required', traceable: true },
    { description: '日主身强（dayStrengthLevel >= 1）', type: 'required', traceable: true },
    { description: '归禄不逢官杀（非官杀格）', type: 'sufficient', traceable: true },
  ],
  result: '归禄格成立，身旺归禄，宜享福气',
  evidence: {
    rule: '归禄格',
    level: 'support',
    weight: 0.65,
    description: '日禄归时，归禄格',
  },
  confidence: {
    components: { geju: 0.55, shensha: 0.25, calendar: 0.2 },
  },
  conflictStrategy: 'prefer-conservative',
  evaluate: (input) => {
    const day = input.dayGan
    const luMap: Record<string, string> = {
      '甲': '寅', '乙': '卯', '丙': '巳', '戊': '巳',
      '丁': '午', '己': '午', '庚': '申', '辛': '酉',
      '壬': '亥', '癸': '子',
    }
    const expectedLu = luMap[day] ?? ''
    const hourZhi = input.fourPillars[3]?.zhi ?? ''
    const t1 = hourZhi === expectedLu
    const strength = input.dayStrengthLevel ?? 0
    const t2 = strength >= 1
    const guanWx = Object.entries(WUXING_OVERCOME).find(([, v]) => v === input.dayGanWuxing)?.[0] as WuXing
    const guanCount = input.wuxingCount[guanWx] ?? 0
    const t3 = guanCount <= 2
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2
    const trace = [
      makeTrace('S1-时支为禄', `日干=${day} 禄在${expectedLu} 时支=${hourZhi}：${t1 ? '满足' : '不满足'}`, t1, '《三命通会》归禄格'),
      makeTrace('S2-身强', `dayStrengthLevel=${strength}，>=1：${t2 ? '满足' : '不满足'}`, t2),
      makeTrace('S3-官杀不混', `官杀计数=${guanCount}，不重：${t3 ? '满足' : '不满足'}`, t3),
    ]
    const conf = active ? 0.68 : 0.2
    return buildBundle('GEJU-XIANDAI-001', '归禄格', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? '归禄格成立：日禄归时，福气之格' : '归禄格不成立')
  },
  _gejuCategory: '现代特殊格',
  _gejuSubtype: '归禄格',
}

const RULES: Array<RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string }> = [
  ZHENG_RULE_001,
  ZHENG_RULE_002,
  ...ZHUANWANG_RULES,
  CONG_001,
  CONG_002,
  CONG_003,
  CONG_004,
  CONG_005,
  CONG_006,
  LIANGSHEN_001,
  HUAQI_001,
  XIANDAI_001,
]

export default RULES
