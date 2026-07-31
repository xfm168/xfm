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

/**
 * P0-5 Sprint 1 · 正官格
 * 月令本气为正官（克日主的异性天干透月令），身不太强不太弱，官星不破不混。
 * 经典依据：《子平真诠》论用神 + 《滴天髓》论格局 + 《三命通会》论十神
 */
const ZHENGUAN_001: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-ZHENGUAN-001',
  version: '1.0.0',
  ruleVersion: '2024-v1',
  priority: 90,
  source: ['子平真诠', '滴天髓', '三命通会'],
  classicSource: '子平真诠·论用神',
  author: '玄风门',
  reviewer: '待审核',
  lastReviewDate: '2024-12-20',
  effectiveDate: '2024-12-20',
  description: '正官格：月令本气为正官（克日主之异性五行），官星不破不混，身官两停',
  category: 'geju',
  condition: [
    { description: '月令本气或月干透出正官（克日主的异性五行）', type: 'required', traceable: true, traceText: '月令藏干透出正官' },
    { description: '官星不被伤官冲克（伤官不透或被印制）', type: 'required', traceable: true, traceText: '官星不受伤' },
    { description: '日主有根气（非无根从格）', type: 'required', traceable: true, traceText: '日主有根' },
    { description: '官杀不混杂（无七杀混杂或七杀被合去）', type: 'sufficient', traceable: true, traceText: '官杀不混' },
  ],
  result: '正官格成立，以官星为用，喜财生官、印护官，忌伤官见官',
  evidence: {
    rule: '正官格',
    level: 'core',
    weight: 0.85,
    description: '月令正官透干，官星不破，正官格成立',
  },
  confidence: {
    components: { geju: 0.8, calendar: 0.15, shensha: 0.05 },
    note: '正官格需官星不被伤官冲克',
  },
  conflictStrategy: 'priority-then-vote',
  tags: ['kg-geju-zhengguan', 'kg-shishen-zhengguan'],
  classicEvidence: [
    {
      classicId: 'zpzq',
      classicName: '子平真诠',
      chapterId: 'zpzq-c3',
      chapterTitle: '论格局',
      paragraphId: 'zpzq-c3-p1',
      sentenceId: 'zpzq-c3-p1-s1',
      quotedText: '正官格：月令本气为正官，官星不破不混，身官两停，为正气之格。',
      citation: 'direct',
      supports: '正官格成立条件',
      hasControversy: false,
    },
    {
      classicId: 'dts',
      classicName: '滴天髓',
      chapterId: 'dts-c3',
      chapterTitle: '论格局',
      paragraphId: 'dts-c3-p1',
      sentenceId: 'dts-c3-p1-s1',
      quotedText: '官星正气，不可伤损，身强官弱用财生，身弱官强用印化。',
      citation: 'direct',
      supports: '正官格用神取法',
      hasControversy: false,
    },
    {
      classicId: 'smth',
      classicName: '三命通会',
      chapterId: 'smth-c2',
      chapterTitle: '论十神',
      paragraphId: 'smth-c2-p1',
      sentenceId: 'smth-c2-p1-s1',
      quotedText: '正官者，六亲之主，性纯而正，主名望显达。',
      citation: 'direct',
      supports: '正官星性纯主贵',
      hasControversy: false,
    },
  ],
  evaluate: (input) => {
    const selfWx = input.dayGanWuxing
    // 正官五行 = 克日主的五行
    const guanWx = Object.entries(WUXING_OVERCOME).find(([, v]) => v === selfWx)?.[0] as WuXing
    // 正官 = 异性克我（阴日干见阳官或阳日干见阴官），这里简化为五行判断
    const guanCount = input.wuxingCount[guanWx] ?? 0
    // 月令本气为官星五行
    const monthIsGuan = input.monthZhiWuxing === guanWx
    // 月干或年干透出官星
    const touGan = input.fourPillars.some(p => p.ganWx === guanWx && p.gan !== input.dayGan)
    // 伤官五行 = 日主所生
    const shangWx = WUXING_GENERATE[selfWx]
    const shangCount = input.wuxingCount[shangWx] ?? 0
    const shangTouGan = input.fourPillars.some(p => p.ganWx === shangWx && p.gan !== input.dayGan)
    // 印星五行 = 生日主的五行
    const yinWx = Object.entries(WUXING_GENERATE).find(([, v]) => v === selfWx)?.[0] as WuXing
    const yinCount = input.wuxingCount[yinWx] ?? 0
    // 日主根气
    const roots = input.dayRootCount ?? 0
    // 七杀五行同正官但为同性（简化：官杀同五行，看数量判断是否混杂）
    const isGuanShaHunZa = guanCount >= 4

    const t1 = (monthIsGuan || touGan) && guanCount >= 1
    const t2 = !shangTouGan || yinCount >= 1
    const t3 = roots >= 1
    const t4 = !isGuanShaHunZa
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2 && t3 && t4

    const trace = [
      makeTrace('S1-月令透官', `月令=${input.monthZhi}(${input.monthZhiWuxing}) 官五行=${guanWx} 计数=${guanCount} 透干=${touGan}：${t1 ? '满足' : '不满足'}`, t1, '《子平真诠》论格局'),
      makeTrace('S2-官星不受伤', `伤官五行=${shangWx} 透干=${shangTouGan} 印星=${yinCount}：${t2 ? '官不受伤' : '伤官见官'}`, t2, '《滴天髓》论格局'),
      makeTrace('S3-日主有根', `dayRootCount=${roots}：${t3 ? '有根' : '无根'}`, t3),
      makeTrace('S4-官杀不混', `官杀计数=${guanCount}：${t4 ? '不混' : '混杂'}`, t4, '《三命通会》论十神'),
    ]
    const conf = active ? 0.85 : 0.2
    return buildBundle('GEJU-ZHENGUAN-001', '正官格', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? '正官格成立：月令官星透干不破，身官两停' : '正官格不成立')
  },
  _gejuCategory: '正官格',
  _gejuSubtype: '月令正官',
}

/**
 * P0-5 Sprint 1 · 七杀格（偏官格）
 * 月令本气为七杀（克日主的同性天干透月令），身能抗杀或食制杀或印化杀。
 * 经典依据：《子平真诠》七杀格 + 《三命通会》论十神 + 《渊海子平》
 */
const QISHA_001: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-QISHA-001',
  version: '1.0.0',
  ruleVersion: '2024-v1',
  priority: 88,
  source: ['子平真诠', '三命通会', '渊海子平'],
  classicSource: '子平真诠·论用神·七杀',
  author: '玄风门',
  reviewer: '待审核',
  lastReviewDate: '2024-12-20',
  effectiveDate: '2024-12-20',
  description: '七杀格（偏官格）：月令本气为七杀（克日主之同性五行），身能抗杀或食制杀或印化杀',
  category: 'geju',
  condition: [
    { description: '月令本气或月干透出七杀（克日主之同性五行）', type: 'required', traceable: true, traceText: '月令透出七杀' },
    { description: '日主有根能抗杀（非极弱从杀）', type: 'required', traceable: true, traceText: '身能抗杀' },
    { description: '有食神制杀或印星化杀（至少一项）', type: 'sufficient', traceable: true, traceText: '食制或印化' },
  ],
  result: '七杀格成立，以杀为用，喜食制杀、印化杀，忌财生杀攻身',
  evidence: {
    rule: '七杀格',
    level: 'core',
    weight: 0.85,
    description: '月令七杀透干，有制化，七杀格成立',
  },
  confidence: {
    components: { geju: 0.78, calendar: 0.15, shensha: 0.07 },
    note: '七杀格须有制化方为贵格',
  },
  conflictStrategy: 'priority-then-vote',
  tags: ['kg-geju-qisha', 'kg-shishen-qisha'],
  classicEvidence: [
    {
      classicId: 'zpzq',
      classicName: '子平真诠',
      chapterId: 'zpzq-c3',
      chapterTitle: '论格局',
      paragraphId: 'zpzq-c3-p2',
      sentenceId: 'zpzq-c3-p2-s1',
      quotedText: '七杀用食制，用印化，用刃合，三者皆杀格之取法。',
      citation: 'direct',
      supports: '七杀格制化取法',
      hasControversy: true,
      controversyNote: '有流派认为七杀无制化也可论格，但主流认为须有制化',
    },
    {
      classicId: 'smth',
      classicName: '三命通会',
      chapterId: 'smth-c2',
      chapterTitle: '论十神',
      paragraphId: 'smth-c2-p1',
      sentenceId: 'smth-c2-p1-s2',
      quotedText: '七杀者，刚暴之气，必先制化而后用。',
      citation: 'direct',
      supports: '七杀须制化',
      hasControversy: false,
    },
    {
      classicId: 'yhzp',
      classicName: '渊海子平',
      chapterId: 'yhzp-c3',
      chapterTitle: '论十神',
      paragraphId: 'yhzp-c3-p1',
      sentenceId: 'yhzp-c3-p1-s1',
      quotedText: '偏官即七杀，喜身旺食制，忌身弱无制。',
      citation: 'direct',
      supports: '七杀喜身旺食制',
      hasControversy: false,
    },
  ],
  evaluate: (input) => {
    const selfWx = input.dayGanWuxing
    // 七杀五行同正官（都是克日主），区别在阴阳同性
    const shaWx = Object.entries(WUXING_OVERCOME).find(([, v]) => v === selfWx)?.[0] as WuXing
    const shaCount = input.wuxingCount[shaWx] ?? 0
    const monthIsSha = input.monthZhiWuxing === shaWx
    const touGan = input.fourPillars.some(p => p.ganWx === shaWx && p.gan !== input.dayGan)
    // 食神五行 = 日主所生
    const shiWx = WUXING_GENERATE[selfWx]
    const shiCount = input.wuxingCount[shiWx] ?? 0
    // 印星五行
    const yinWx = Object.entries(WUXING_GENERATE).find(([, v]) => v === selfWx)?.[0] as WuXing
    const yinCount = input.wuxingCount[yinWx] ?? 0
    // 日主根气
    const roots = input.dayRootCount ?? 0
    const strength = input.dayStrengthLevel ?? 0

    const t1 = (monthIsSha || touGan) && shaCount >= 1
    const t2 = roots >= 1 && strength >= -1
    const t3 = shiCount >= 1 || yinCount >= 1
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2

    const trace = [
      makeTrace('S1-月令透杀', `月令=${input.monthZhi}(${input.monthZhiWuxing}) 杀五行=${shaWx} 计数=${shaCount}：${t1 ? '满足' : '不满足'}`, t1, '《子平真诠》七杀格'),
      makeTrace('S2-身能抗杀', `根=${roots} 强弱=${strength}：${t2 ? '能抗杀' : '身弱难抗'}`, t2),
      makeTrace('S3-食制或印化', `食=${shiCount} 印=${yinCount}：${t3 ? '有制化' : '无制化'}`, t3, '《三命通会》论十神'),
    ]
    const conf = active ? (t3 ? 0.82 : 0.65) : 0.18
    return buildBundle('GEJU-QISHA-001', '七杀格', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? (t3 ? '七杀格成立：有制化，贵格' : '七杀格成立但无制化，须防凶性') : '七杀格不成立')
  },
  _gejuCategory: '七杀格',
  _gejuSubtype: '月令七杀',
}

/**
 * P0-5 Sprint 1 · 正财格
 * 月令本气为正财（日主所克之异性五行），身强能任财，财不逢比劫冲克。
 * 经典依据：《子平真诠》正财格 + 《滴天髓》 + 《三命通会》
 */
const ZHENGCAI_001: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-ZHENGCAI-001',
  version: '1.0.0',
  ruleVersion: '2024-v1',
  priority: 86,
  source: ['子平真诠', '滴天髓', '三命通会'],
  classicSource: '子平真诠·论用神·正财',
  author: '玄风门',
  reviewer: '待审核',
  lastReviewDate: '2024-12-20',
  effectiveDate: '2024-12-20',
  description: '正财格：月令本气为正财（日主所克之异性五行），身强能任财，财不逢比劫冲克',
  category: 'geju',
  condition: [
    { description: '月令本气或月干透出正财（日主所克之五行）', type: 'required', traceable: true, traceText: '月令透正财' },
    { description: '日主身强或中和（能任财）', type: 'required', traceable: true, traceText: '身能任财' },
    { description: '比劫不重（比劫不冲克财星）', type: 'sufficient', traceable: true, traceText: '比劫不重' },
  ],
  result: '正财格成立，以财为用，喜食伤生财、官星护财，忌比劫夺财',
  evidence: {
    rule: '正财格',
    level: 'core',
    weight: 0.83,
    description: '月令正财透干，身强任财，正财格成立',
  },
  confidence: {
    components: { geju: 0.78, calendar: 0.15, xiyongshen: 0.07 },
    note: '正财格需身强能任财',
  },
  conflictStrategy: 'priority-then-vote',
  tags: ['kg-geju-zhengcai', 'kg-shishen-zhengcai'],
  classicEvidence: [
    {
      classicId: 'zpzq',
      classicName: '子平真诠',
      chapterId: 'zpzq-c3',
      chapterTitle: '论格局',
      paragraphId: 'zpzq-c3-p3',
      sentenceId: 'zpzq-c3-p3-s1',
      quotedText: '财旺生官，官星卫财；印绶护身，食神制杀。',
      citation: 'direct',
      supports: '财格用官卫财',
      hasControversy: false,
    },
    {
      classicId: 'dts',
      classicName: '滴天髓',
      chapterId: 'dts-c3',
      chapterTitle: '论格局',
      paragraphId: 'dts-c3-p2',
      sentenceId: 'dts-c3-p2-s1',
      quotedText: '财气通门户，无人不富；身弱财多，富屋贫人。',
      citation: 'direct',
      supports: '财格需身强',
      hasControversy: false,
    },
    {
      classicId: 'smth',
      classicName: '三命通会',
      chapterId: 'smth-c2',
      chapterTitle: '论十神',
      paragraphId: 'smth-c2-p2',
      sentenceId: 'smth-c2-p2-s1',
      quotedText: '正财者，财为养命之源，宜身强财弱，身弱财多反为累。',
      citation: 'direct',
      supports: '正财宜身强',
      hasControversy: false,
    },
  ],
  evaluate: (input) => {
    const selfWx = input.dayGanWuxing
    // 正财五行 = 日主所克
    const caiWx = WUXING_OVERCOME[selfWx]
    const caiCount = input.wuxingCount[caiWx] ?? 0
    const monthIsCai = input.monthZhiWuxing === caiWx
    const touGan = input.fourPillars.some(p => p.ganWx === caiWx && p.gan !== input.dayGan)
    // 比劫五行 = 同日主
    const biWx = selfWx
    const biCount = input.wuxingCount[biWx] ?? 0
    // 身强判断
    const strength = input.dayStrengthLevel ?? 0

    const t1 = (monthIsCai || touGan) && caiCount >= 1
    const t2 = strength >= 0
    const t3 = biCount <= 3
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2

    const trace = [
      makeTrace('S1-月令透财', `月令=${input.monthZhi}(${input.monthZhiWuxing}) 财五行=${caiWx} 计数=${caiCount}：${t1 ? '满足' : '不满足'}`, t1, '《子平真诠》正财格'),
      makeTrace('S2-身能任财', `强弱=${strength}：${t2 ? '身强/中和' : '身弱难任'}`, t2, '《滴天髓》论格局'),
      makeTrace('S3-比劫不重', `比劫计数=${biCount}：${t3 ? '不重' : '比劫夺财'}`, t3),
    ]
    const conf = active ? (t3 ? 0.83 : 0.65) : 0.18
    return buildBundle('GEJU-ZHENGCAI-001', '正财格', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? (t3 ? '正财格成立：身强任财，财不被劫' : '正财格成立但比劫重，须防破财') : '正财格不成立')
  },
  _gejuCategory: '正财格',
  _gejuSubtype: '月令正财',
}

/**
 * P0-5 Sprint 1 · 偏财格
 * 月令本气为偏财（日主所克之同性五行），身强能任财，偏财主众财、横财。
 * 经典依据：《子平真诠》偏财格 + 《滴天髓》 + 《渊海子平》
 */
const PIANCAI_001: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-PIANCAI-001',
  version: '1.0.0',
  ruleVersion: '2024-v1',
  priority: 84,
  source: ['子平真诠', '滴天髓', '渊海子平'],
  classicSource: '子平真诠·论用神·偏财',
  author: '玄风门',
  reviewer: '待审核',
  lastReviewDate: '2024-12-20',
  effectiveDate: '2024-12-20',
  description: '偏财格：月令本气为偏财（日主所克之同性五行），身强能任财，偏财主众财横财',
  category: 'geju',
  condition: [
    { description: '月令本气或月干透出偏财（日主所克之五行，与正财同五行但阴阳同性）', type: 'required', traceable: true, traceText: '月令透偏财' },
    { description: '日主身强或中和（能任财）', type: 'required', traceable: true, traceText: '身能任财' },
    { description: '偏财不被比劫冲克严重', type: 'sufficient', traceable: true, traceText: '财不被劫' },
  ],
  result: '偏财格成立，以偏财为用，喜食伤生财、官星护财，忌比劫夺财',
  evidence: {
    rule: '偏财格',
    level: 'core',
    weight: 0.82,
    description: '月令偏财透干，身强任财，偏财格成立',
  },
  confidence: {
    components: { geju: 0.75, calendar: 0.15, xiyongshen: 0.1 },
    note: '偏财与正财同五行，区别在阴阳，实际判定需结合天干',
  },
  conflictStrategy: 'priority-then-vote',
  tags: ['kg-geju-piancai', 'kg-shishen-piancai'],
  classicEvidence: [
    {
      classicId: 'zpzq',
      classicName: '子平真诠',
      chapterId: 'zpzq-c3',
      chapterTitle: '论格局',
      paragraphId: 'zpzq-c3-p3',
      sentenceId: 'zpzq-c3-p3-s2',
      quotedText: '偏财格与正财格同论，但偏财主众财，不主己财。',
      citation: 'paraphrase',
      supports: '偏财主众财',
      hasControversy: true,
      controversyNote: '偏财与正财的区分在阴阳，但实际命局中同五行难以严格区分',
    },
    {
      classicId: 'dts',
      classicName: '滴天髓',
      chapterId: 'dts-c3',
      chapterTitle: '论格局',
      paragraphId: 'dts-c3-p2',
      sentenceId: 'dts-c3-p2-s2',
      quotedText: '偏财好利，性好奢泰，财多身弱，反主贫寒。',
      citation: 'paraphrase',
      supports: '偏财需身强',
      hasControversy: false,
    },
    {
      classicId: 'yhzp',
      classicName: '渊海子平',
      chapterId: 'yhzp-c3',
      chapterTitle: '论十神',
      paragraphId: 'yhzp-c3-p1',
      sentenceId: 'yhzp-c3-p1-s2',
      quotedText: '偏财者，财之偏者，主非分之财，宜身强有制。',
      citation: 'paraphrase',
      supports: '偏财主非分之财',
      hasControversy: false,
    },
  ],
  evaluate: (input) => {
    const selfWx = input.dayGanWuxing
    // 偏财五行同正财（都是日主所克）
    const caiWx = WUXING_OVERCOME[selfWx]
    const caiCount = input.wuxingCount[caiWx] ?? 0
    const monthIsCai = input.monthZhiWuxing === caiWx
    const touGan = input.fourPillars.some(p => p.ganWx === caiWx && p.gan !== input.dayGan)
    const biCount = input.wuxingCount[selfWx] ?? 0
    const strength = input.dayStrengthLevel ?? 0

    const t1 = (monthIsCai || touGan) && caiCount >= 2
    const t2 = strength >= 0
    const t3 = biCount <= 3
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2

    const trace = [
      makeTrace('S1-月令透偏财', `月令=${input.monthZhi}(${input.monthZhiWuxing}) 财五行=${caiWx} 计数=${caiCount}：${t1 ? '满足' : '不满足'}`, t1, '《子平真诠》偏财格'),
      makeTrace('S2-身能任财', `强弱=${strength}：${t2 ? '身强/中和' : '身弱难任'}`, t2),
      makeTrace('S3-比劫不重', `比劫计数=${biCount}：${t3 ? '不重' : '夺财'}`, t3, '《滴天髓》论格局'),
    ]
    const conf = active ? (t3 ? 0.8 : 0.6) : 0.18
    return buildBundle('GEJU-PIANCAI-001', '偏财格', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? (t3 ? '偏财格成立：身强任财，众财可得' : '偏财格成立但比劫重') : '偏财格不成立')
  },
  _gejuCategory: '偏财格',
  _gejuSubtype: '月令偏财',
}

/**
 * P0-5 Sprint 2 · 食神格
 * 月令本气为食神（日主所生之异性五行），身强食神旺，不宜见偏印夺食。
 * 经典依据：《子平真诠》论用神·食神 + 《滴天髓》论格局 + 《渊海子平》论十神
 */
const SHISHEN_001: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-SHISHEN-001',
  version: '1.0.0',
  ruleVersion: '2024-v1',
  priority: 82,
  source: ['子平真诠', '滴天髓', '渊海子平'],
  classicSource: '子平真诠·论用神·食神',
  author: '玄风门',
  reviewer: '待审核',
  lastReviewDate: '2024-12-20',
  effectiveDate: '2024-12-20',
  description: '食神格：月令本气为食神（日主所生之五行），身强食神旺，有财则富',
  category: 'geju',
  condition: [
    { description: '月令本气或月干透出食神（日主所生之五行）', type: 'required', traceable: true, traceText: '月令透食神' },
    { description: '日主身强或中和（能泄秀）', type: 'required', traceable: true, traceText: '身强泄秀' },
    { description: '无偏印夺食（枭印不透或被制）', type: 'sufficient', traceable: true, traceText: '无枭夺食' },
  ],
  result: '食神格成立，以食神为用，喜财星流通、身强泄秀，忌枭印夺食',
  evidence: { rule: '食神格', level: 'core', weight: 0.82, description: '月令食神透干，身强泄秀，食神格成立' },
  confidence: { components: { geju: 0.75, calendar: 0.15, xiyongshen: 0.1 }, note: '食神格忌枭印夺食' },
  conflictStrategy: 'priority-then-vote',
  tags: ['kg-ss-shishen', 'kg-concept-tongshen'],
  classicEvidence: [
    { classicId: 'zpzq', classicName: '子平真诠', chapterId: 'zpzq-c3', chapterTitle: '论格局', paragraphId: 'zpzq-c3-p2', sentenceId: 'zpzq-c3-p2-s2', quotedText: '食神本气，泄身之秀，有财则富，有印则贵。', citation: 'direct', supports: '食神泄秀主富', hasControversy: false },
    { classicId: 'dts', classicName: '滴天髓', chapterId: 'dts-c3', chapterTitle: '论格局', paragraphId: 'dts-c3-p2', sentenceId: 'dts-c3-p2-s3', quotedText: '食神最忌枭印夺食，有枭则食不全。', citation: 'direct', supports: '枭印夺食为忌', hasControversy: false },
    { classicId: 'yhzp', classicName: '渊海子平', chapterId: 'yhzp-c3', chapterTitle: '论十神', paragraphId: 'yhzp-c3-p1', sentenceId: 'yhzp-c3-p1-s3', quotedText: '食神者，日主所生，主饮食福禄，宜身旺财通。', citation: 'direct', supports: '食神主福禄', hasControversy: false },
  ],
  evaluate: (input) => {
    const selfWx = input.dayGanWuxing
    const shiWx = WUXING_GENERATE[selfWx]
    const shiCount = input.wuxingCount[shiWx] ?? 0
    const monthIsShi = input.monthZhiWuxing === shiWx
    const touGan = input.fourPillars.some(p => p.ganWx === shiWx && p.gan !== input.dayGan)
    // 枭印 = 生食神的五行（即生日主的印星的印星，也就是偏印）
    const xiaoWx = Object.entries(WUXING_GENERATE).find(([, v]) => v === shiWx)?.[0] as WuXing
    const xiaoCount = input.wuxingCount[xiaoWx] ?? 0
    const xiaoTouGan = input.fourPillars.some(p => p.ganWx === xiaoWx && p.gan !== input.dayGan)
    const strength = input.dayStrengthLevel ?? 0
    const t1 = (monthIsShi || touGan) && shiCount >= 1
    const t2 = strength >= 0
    const t3 = !xiaoTouGan || xiaoCount <= 1
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2
    const trace = [
      makeTrace('S1-月令透食', `月令=${input.monthZhi}(${input.monthZhiWuxing}) 食五行=${shiWx} 计数=${shiCount}：${t1 ? '满足' : '不满足'}`, t1, '《子平真诠》食神格'),
      makeTrace('S2-身强泄秀', `强弱=${strength}：${t2 ? '身强' : '身弱'}`, t2),
      makeTrace('S3-无枭夺食', `枭印五行=${xiaoWx} 透干=${xiaoTouGan}：${t3 ? '无枭' : '枭夺食'}`, t3, '《滴天髓》论格局'),
    ]
    const conf = active ? (t3 ? 0.82 : 0.6) : 0.18
    return buildBundle('GEJU-SHISHEN-001', '食神格', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? (t3 ? '食神格成立：身强泄秀，福禄之格' : '食神格成立但有枭印夺食之忧') : '食神格不成立')
  },
  _gejuCategory: '食神格',
  _gejuSubtype: '月令食神',
}

/**
 * P0-5 Sprint 2 · 伤官格
 * 月令本气为伤官（日主所生之同性五行），伤官旺，喜佩印或生财。
 * 经典依据：《子平真诠》论用神·伤官 + 《滴天髓》通神论 + 《三命通会》论十神
 */
const SHANGGUAN_001: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-SHANGGUAN-001',
  version: '1.0.0',
  ruleVersion: '2024-v1',
  priority: 80,
  source: ['子平真诠', '滴天髓', '三命通会'],
  classicSource: '子平真诠·论用神·伤官',
  author: '玄风门',
  reviewer: '待审核',
  lastReviewDate: '2024-12-20',
  effectiveDate: '2024-12-20',
  description: '伤官格：月令本气为伤官（日主所生之五行），伤官旺，佩印或生财为佳',
  category: 'geju',
  condition: [
    { description: '月令本气或月干透出伤官（日主所生之五行）', type: 'required', traceable: true, traceText: '月令透伤官' },
    { description: '有印制伤官或财泄伤官（至少一项）', type: 'sufficient', traceable: true, traceText: '印制或财泄' },
    { description: '不宜伤官见正官（伤官见官为祸）', type: 'exception', traceable: true, traceText: '不见官或官被伤制' },
  ],
  result: '伤官格成立，以伤官为用，喜佩印制伤、财泄伤官，忌见正官',
  evidence: { rule: '伤官格', level: 'core', weight: 0.82, description: '月令伤官透干，有制有化，伤官格成立' },
  confidence: { components: { geju: 0.75, calendar: 0.15, xiyongshen: 0.1 }, note: '伤官见官为祸，需佩印化解' },
  conflictStrategy: 'priority-then-vote',
  tags: ['kg-ss-shangguan', 'kg-concept-shangguanjanguan'],
  classicEvidence: [
    { classicId: 'zpzq', classicName: '子平真诠', chapterId: 'zpzq-c3', chapterTitle: '论格局', paragraphId: 'zpzq-c3-p2', sentenceId: 'zpzq-c3-p2-s3', quotedText: '伤官用财，伤官用印，伤官用官，三者皆伤官格之变。', citation: 'direct', supports: '伤官格三种取法', hasControversy: true, controversyNote: '伤官见官有流派认为可并用，但主流认为伤官见官为祸' },
    { classicId: 'dts', classicName: '滴天髓', chapterId: 'dts-c1', chapterTitle: '通神论', paragraphId: 'dts-c1-p2', sentenceId: 'dts-c1-p2-s1', quotedText: '伤官见官，祸患百端；食神制杀，英雄独压万人。', citation: 'direct', supports: '伤官见官为祸', hasControversy: false },
    { classicId: 'smth', classicName: '三命通会', chapterId: 'smth-c2', chapterTitle: '论十神', paragraphId: 'smth-c2-p2', sentenceId: 'smth-c2-p2-s2', quotedText: '伤官者，日主所生之异性，主聪明才智，然伤官见官，祸患百端。', citation: 'direct', supports: '伤官主智但见官为祸', hasControversy: false },
  ],
  evaluate: (input) => {
    const selfWx = input.dayGanWuxing
    const shangWx = WUXING_GENERATE[selfWx]
    const shangCount = input.wuxingCount[shangWx] ?? 0
    const monthIsShang = input.monthZhiWuxing === shangWx
    const touGan = input.fourPillars.some(p => p.ganWx === shangWx && p.gan !== input.dayGan)
    // 印星 = 生日主
    const yinWx = Object.entries(WUXING_GENERATE).find(([, v]) => v === selfWx)?.[0] as WuXing
    const yinCount = input.wuxingCount[yinWx] ?? 0
    // 财星 = 日主所克
    const caiWx = WUXING_OVERCOME[selfWx]
    const caiCount = input.wuxingCount[caiWx] ?? 0
    // 正官 = 克日主
    const guanWx = Object.entries(WUXING_OVERCOME).find(([, v]) => v === selfWx)?.[0] as WuXing
    const guanTouGan = input.fourPillars.some(p => p.ganWx === guanWx && p.gan !== input.dayGan)
    const t1 = (monthIsShang || touGan) && shangCount >= 1
    const t2 = yinCount >= 1 || caiCount >= 1
    const t3 = !guanTouGan || yinCount >= 2
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t3
    const trace = [
      makeTrace('S1-月令透伤', `月令=${input.monthZhi}(${input.monthZhiWuxing}) 伤五行=${shangWx} 计数=${shangCount}：${t1 ? '满足' : '不满足'}`, t1, '《子平真诠》伤官格'),
      makeTrace('S2-印制或财泄', `印=${yinCount} 财=${caiCount}：${t2 ? '有制化' : '无制化'}`, t2),
      makeTrace('S3-不见官', `官透干=${guanTouGan} 印=${yinCount}：${t3 ? '无官或印制' : '伤官见官'}`, t3, '《滴天髓》通神论'),
    ]
    const conf = active ? (t2 ? 0.82 : 0.55) : 0.18
    return buildBundle('GEJU-SHANGGUAN-001', '伤官格', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? (t2 ? '伤官格成立：佩印或生财，贵格' : '伤官格成立但无制化，须防祸') : '伤官格不成立')
  },
  _gejuCategory: '伤官格',
  _gejuSubtype: '月令伤官',
}

/**
 * P0-5 Sprint 2 · 正印格
 * 月令本气为正印（生日主之异性五行），身弱有印生扶，官印相生为佳。
 * 经典依据：《子平真诠》论用神·印 + 《滴天髓》论用神 + 《三命通会》论十神
 */
const ZHENGYIN_001: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-ZHENGYIN-001',
  version: '1.0.0',
  ruleVersion: '2024-v1',
  priority: 78,
  source: ['子平真诠', '滴天髓', '三命通会'],
  classicSource: '子平真诠·论用神·印',
  author: '玄风门',
  reviewer: '待审核',
  lastReviewDate: '2024-12-20',
  effectiveDate: '2024-12-20',
  description: '正印格：月令本气为正印（生日主之异性五行），身弱有印生扶，官印相生为贵',
  category: 'geju',
  condition: [
    { description: '月令本气或月干透出正印（生日主之五行）', type: 'required', traceable: true, traceText: '月令透印' },
    { description: '印星不被财星破坏（财不破印）', type: 'required', traceable: true, traceText: '财不破印' },
    { description: '有官星生印（官印相生）', type: 'sufficient', traceable: true, traceText: '官印相生' },
  ],
  result: '正印格成立，以印为用，喜官星生印，忌财破印',
  evidence: { rule: '正印格', level: 'core', weight: 0.8, description: '月令正印透干，不被财破，正印格成立' },
  confidence: { components: { geju: 0.73, calendar: 0.15, xiyongshen: 0.12 }, note: '正印格需防财破印' },
  conflictStrategy: 'priority-then-vote',
  tags: ['kg-ss-zhengyin', 'kg-concept-guanyin'],
  classicEvidence: [
    { classicId: 'zpzq', classicName: '子平真诠', chapterId: 'zpzq-c3', chapterTitle: '论格局', paragraphId: 'zpzq-c3-p3', sentenceId: 'zpzq-c3-p3-s3', quotedText: '印用官星，官印相生，为贵格之至。', citation: 'direct', supports: '官印相生为贵', hasControversy: false },
    { classicId: 'dts', classicName: '滴天髓', chapterId: 'dts-c2', chapterTitle: '论用神', paragraphId: 'dts-c2-p1', sentenceId: 'dts-c2-p1-s1', quotedText: '印星生身，最忌财破；有官则官印相生，大贵。', citation: 'direct', supports: '印忌财破', hasControversy: false },
    { classicId: 'smth', classicName: '三命通会', chapterId: 'smth-c2', chapterTitle: '论十神', paragraphId: 'smth-c2-p2', sentenceId: 'smth-c2-p2-s2', quotedText: '正印者，生气之源，宜官星生印，忌财星破印。', citation: 'direct', supports: '正印喜官忌财', hasControversy: false },
  ],
  evaluate: (input) => {
    const selfWx = input.dayGanWuxing
    const yinWx = Object.entries(WUXING_GENERATE).find(([, v]) => v === selfWx)?.[0] as WuXing
    const yinCount = input.wuxingCount[yinWx] ?? 0
    const monthIsYin = input.monthZhiWuxing === yinWx
    const touGan = input.fourPillars.some(p => p.ganWx === yinWx && p.gan !== input.dayGan)
    // 财星 = 日主所克
    const caiWx = WUXING_OVERCOME[selfWx]
    const caiCount = input.wuxingCount[caiWx] ?? 0
    // 官星 = 克日主
    const guanWx = Object.entries(WUXING_OVERCOME).find(([, v]) => v === selfWx)?.[0] as WuXing
    const guanCount = input.wuxingCount[guanWx] ?? 0
    const t1 = (monthIsYin || touGan) && yinCount >= 1
    const t2 = caiCount <= 2
    const t3 = guanCount >= 1
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2
    const trace = [
      makeTrace('S1-月令透印', `月令=${input.monthZhi}(${input.monthZhiWuxing}) 印五行=${yinWx} 计数=${yinCount}：${t1 ? '满足' : '不满足'}`, t1, '《子平真诠》正印格'),
      makeTrace('S2-财不破印', `财计数=${caiCount}：${t2 ? '不破印' : '财破印'}`, t2, '《滴天髓》论用神'),
      makeTrace('S3-官印相生', `官计数=${guanCount}：${t3 ? '有官生印' : '无官'}`, t3),
    ]
    const conf = active ? (t3 ? 0.8 : 0.65) : 0.18
    return buildBundle('GEJU-ZHENGYIN-001', '正印格', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? (t3 ? '正印格成立：官印相生，大贵' : '正印格成立但无官生') : '正印格不成立')
  },
  _gejuCategory: '正印格',
  _gejuSubtype: '月令正印',
}

/**
 * P0-5 Sprint 2 · 杀印相生格
 * 七杀与印星并见，杀生印、印生身，化杀为权，大贵之格。
 * 经典依据：《子平真诠》论用神·杀印相生 + 《滴天髓》论用神 + 《三命通会》论十神
 */
const SHAYIN_001: RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string } = {
  id: 'GEJU-SHAYIN-001',
  version: '1.0.0',
  ruleVersion: '2024-v1',
  priority: 95,
  source: ['子平真诠', '滴天髓', '三命通会'],
  classicSource: '子平真诠·论用神·杀印相生',
  author: '玄风门',
  reviewer: '待审核',
  lastReviewDate: '2024-12-20',
  effectiveDate: '2024-12-20',
  description: '杀印相生格：七杀与印星并见，杀生印、印生身，化杀为权，大贵之格',
  category: 'geju',
  condition: [
    { description: '柱中有七杀（克日主之五行，计数 >= 1）', type: 'required', traceable: true, traceText: '有七杀' },
    { description: '柱中有印星（生日主之五行，计数 >= 1）', type: 'required', traceable: true, traceText: '有印星' },
    { description: '杀生印、印生身（五行链路：杀→印→身）', type: 'required', traceable: true, traceText: '杀印相生链路' },
    { description: '无财星破印（财不阻杀生印之路）', type: 'sufficient', traceable: true, traceText: '财不破印' },
  ],
  result: '杀印相生格成立，化杀为权，以印化杀为用，喜身强任杀，忌财破印',
  evidence: { rule: '杀印相生', level: 'core', weight: 0.9, description: '杀印相生，化杀为权，大贵之格' },
  confidence: { components: { geju: 0.85, calendar: 0.1, xiyongshen: 0.05 }, note: '杀印相生为贵格，需杀印身链路畅通' },
  conflictStrategy: 'priority-then-vote',
  tags: ['kg-ss-qisha', 'kg-ss-zhengyin', 'kg-concept-shashengyin'],
  classicEvidence: [
    { classicId: 'zpzq', classicName: '子平真诠', chapterId: 'zpzq-c3', chapterTitle: '论格局', paragraphId: 'zpzq-c3-p2', sentenceId: 'zpzq-c3-p2-s1', quotedText: '七杀用食制，用印化，用刃合，三者皆杀格之取法。', citation: 'direct', supports: '杀用印化', hasControversy: true, controversyNote: '有流派认为杀印相生须杀在月令，但主流认为只要杀印并见即可' },
    { classicId: 'dts', classicName: '滴天髓', chapterId: 'dts-c2', chapterTitle: '论用神', paragraphId: 'dts-c2-p2', sentenceId: 'dts-c2-p2-s1', quotedText: '身弱有印化杀，可保富贵；杀印相生，大贵之命。', citation: 'direct', supports: '杀印相生大贵', hasControversy: false },
    { classicId: 'smth', classicName: '三命通会', chapterId: 'smth-c2', chapterTitle: '论十神', paragraphId: 'smth-c2-p1', sentenceId: 'smth-c2-p1-s3', quotedText: '杀印相生，化杀为权，主威权显赫。', citation: 'direct', supports: '杀印相生主威权', hasControversy: false },
  ],
  evaluate: (input) => {
    const selfWx = input.dayGanWuxing
    // 杀五行 = 克日主
    const shaWx = Object.entries(WUXING_OVERCOME).find(([, v]) => v === selfWx)?.[0] as WuXing
    const shaCount = input.wuxingCount[shaWx] ?? 0
    // 印五行 = 生日主
    const yinWx = Object.entries(WUXING_GENERATE).find(([, v]) => v === selfWx)?.[0] as WuXing
    const yinCount = input.wuxingCount[yinWx] ?? 0
    // 财五行 = 日主所克
    const caiWx = WUXING_OVERCOME[selfWx]
    const caiCount = input.wuxingCount[caiWx] ?? 0
    // 检查杀生印链路：杀五行 → 印五行？杀克印（因为杀克日主，印生日主，杀生印即杀是印的母）
    // 五行相生：杀→印？ 需要杀生印
    const shaGeneratesYin = WUXING_GENERATE[shaWx] === yinWx

    const t1 = shaCount >= 1
    const t2 = yinCount >= 1
    const t3 = shaGeneratesYin
    const t4 = caiCount <= 2
    const cores = [t1, t2, t3].filter(Boolean).length
    const active = t1 && t2 && t3

    const trace = [
      makeTrace('S1-有七杀', `杀五行=${shaWx} 计数=${shaCount}：${t1 ? '满足' : '不满足'}`, t1, '《子平真诠》杀印相生'),
      makeTrace('S2-有印星', `印五行=${yinWx} 计数=${yinCount}：${t2 ? '满足' : '不满足'}`, t2),
      makeTrace('S3-杀生印', `杀(${shaWx})生印(${yinWx})？${t3 ? '相生' : '不相生'}：${t3 ? '满足' : '不满足'}`, t3, '《滴天髓》论用神'),
      makeTrace('S4-财不破印', `财计数=${caiCount}：${t4 ? '不破印' : '财破印'}`, t4),
    ]
    const conf = active ? (t4 ? 0.9 : 0.7) : 0.18
    return buildBundle('GEJU-SHAYIN-001', '杀印相生', cores, 3, active ? 'satisfied' : 'failed', conf, trace,
      active ? (t4 ? '杀印相生格成立：化杀为权，大贵之格' : '杀印相生格成立但财破印') : '杀印相生格不成立')
  },
  _gejuCategory: '杀印相生格',
  _gejuSubtype: '化杀为权',
}

const RULES: Array<RuleDefinition<MinimalPillarInput> & { _gejuCategory: string; _gejuSubtype?: string }> = [
  ZHENGUAN_001,
  QISHA_001,
  ZHENGCAI_001,
  PIANCAI_001,
  SHISHEN_001,
  SHANGGUAN_001,
  ZHENGYIN_001,
  SHAYIN_001,
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
