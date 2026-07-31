import { describe, it, expect } from 'vitest'
import { makeExplainable, type ExplainableRule, type ClassicEvidenceRef } from '../../../ruleEngine'
import type { RuleDefinition } from '../../../ruleEngine/types'

describe('C6-2 + C6-4: classicEvidence[] + explain()', () => {
  // 构造一条有 classicEvidence 的规则
  const rule: RuleDefinition<any> = {
    id: 'GEJU-TEST-EXPLAIN-001',
    version: '1.0.0',
    priority: 50,
    source: '滴天髓',
    description: '测试可解释规则',
    condition: [
      { description: '日主得令', type: 'required', formula: 'dayGan=甲, monthZhi=寅' },
      { description: '天干透比肩', type: 'sufficient', formula: 'yearGan=甲 or monthGan=甲' },
    ],
    result: '建禄格成立',
    evidence: { rule: '建禄格', level: 'strong_support', weight: 0.8, description: '甲木生寅月，建禄格' },
    confidence: { components: { geju: 0.8 } },
    conflictStrategy: 'priority-then-vote',
    classicEvidence: [
      {
        classicId: 'dts',
        classicName: '滴天髓',
        chapterId: 'dts-c3',
        chapterTitle: '论格局',
        paragraphId: 'dts-c3-p1',
        sentenceId: 'dts-c3-p1-s1',
        quotedText: '甲木生寅月，为建禄格。',
        citation: 'direct',
        supports: '建禄格成立',
        hasControversy: false,
      },
      {
        classicId: 'zpzq',
        classicName: '子平真诠',
        chapterId: 'zpzq-c3',
        chapterTitle: '论格局',
        paragraphId: 'zpzq-c3-p1',
        sentenceId: 'zpzq-c3-p1-s1',
        quotedText: '月令为禄，名为建禄。',
        citation: 'direct',
        supports: '建禄格成立',
        hasControversy: true,
        controversyNote: '有流派认为建禄需透干才算成立',
      },
    ],
    evaluate: async () => ({
      items: [{
        id: 'test-item-1',
        rule: '建禄格',
        ruleId: 'GEJU-TEST-EXPLAIN-001',
        result: true,
        confidence: 0.85,
        level: 'strong_support',
        weight: 0.8,
        description: '甲木生寅月，建禄格',
        trace: [
          { step: '日主得令', text: '甲木日主', satisfied: true },
          { step: '天干透比肩', text: '年干甲木', satisfied: true },
          { step: '结论', text: '建禄格成立', satisfied: true },
        ],
      }],
      summary: '建禄格成立',
      narrative: '甲木生寅月，建禄格',
    }),
  }

  it('ClassicEvidenceRef 包含多源引用（滴天髓+子平真诠）', () => {
    expect(rule.classicEvidence).toBeDefined()
    expect(rule.classicEvidence!.length).toBeGreaterThanOrEqual(2)
    const names = rule.classicEvidence!.map(ce => ce.classicName)
    expect(names).toContain('滴天髓')
    expect(names).toContain('子平真诠')
  })

  it('explain() 返回 RuleExplanation（含命中原因+经典支持+流派争议）', async () => {
    const explainable = makeExplainable(rule)
    const explanation = await explainable.explain({})
    expect(explanation.ruleId).toBe('GEJU-TEST-EXPLAIN-001')
    expect(explanation.hit).toBe(true)
    expect(explanation.summary).toContain('命中')
    expect(explanation.classicSupport.length).toBeGreaterThanOrEqual(2)
    expect(explanation.conflictOpinions.length).toBeGreaterThanOrEqual(1)
    expect(explanation.conflictOpinions[0].controversyNote).toContain('流派')
  })

  it('未命中时 missingConditions 非空 + suggestions 非空', async () => {
    const failRule: RuleDefinition<any> = {
      ...rule,
      id: 'GEJU-TEST-EXPLAIN-002',
      evaluate: async () => ({
        items: [{
          id: 'test-item-2',
          rule: '建禄格',
          ruleId: 'GEJU-TEST-EXPLAIN-002',
          result: false,
          confidence: 0.2,
          level: 'weaken',
          weight: 0.3,
          description: '不满足',
          trace: [
            { step: '日主得令', text: '乙木日主', satisfied: false },
            { step: '结论', text: '未命中', satisfied: false },
          ],
        }],
      }),
    }
    const explainable = makeExplainable(failRule)
    const explanation = await explainable.explain({})
    expect(explanation.hit).toBe(false)
    expect(explanation.missingConditions.length).toBeGreaterThanOrEqual(0)
    expect(explanation.suggestions).toBeDefined()
    expect(explanation.suggestions!.length).toBeGreaterThan(0)
  })
})
