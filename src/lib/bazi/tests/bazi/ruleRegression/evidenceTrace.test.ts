import { describe, it, expect } from 'vitest'
import { TraceEngine, buildConfidence5D, buildConfidenceFromEvidence } from '../../../ruleEngine'

describe('B3 Evidence 追溯 + B4 Confidence 5维拆分', () => {
  it('B3: createDemoCaiWangBundle 含完整 trace 5 步', () => {
    const bundle = TraceEngine.createDemoCaiWangBundle()
    expect(bundle.summary).toContain('财旺')
    expect(bundle.items.length).toBe(1)
    const item = bundle.items[0]
    expect(item.trace!.length).toBeGreaterThanOrEqual(5)
    expect(item.trace!.map(t => t.step)).toContain('结论')
    expect(bundle.narrative).toMatch(/✓/)
    expect(bundle.narrative).toMatch(/子平真诠/)
  })

  it('B3: buildTraceFromConditions: 0条件空数组也必须有1步结论', () => {
    const t = TraceEngine.buildTraceFromConditions({ conclusion: '空', conditions: [] })
    expect(t.length).toBe(1)
    expect(t[0].step).toBe('结论')
  })

  it('B4: buildConfidence5D 返回 5 字段齐全', () => {
    const c = buildConfidence5D({
      calendar: { preciseProvider: true, trueSolarTimeUsed: true, ziHourStrategy: 'true-solar', termPrecisionLevel: 2 },
      geju: { conditions: [{ description: 'a', type: 'required', satisfied: true }, { description: 'b', type: 'required', satisfied: true }] },
      xiyongshen: { consensusRate: 0.9, hasStrongConflict: false },
      shensha: { invalidatedRate: 0, destroyedRate: 0 },
    })
    expect(typeof c.calendar).toBe('number')
    expect(typeof c.geju).toBe('number')
    expect(typeof c.xiyongshen).toBe('number')
    expect(typeof c.shensha).toBe('number')
    expect(typeof c.overall).toBe('number')
    expect(c.overall).toBeGreaterThan(0.8)
    expect(c.breakdown.length).toBe(5)
    expect(['low', 'medium', 'high', 'very_high']).toContain(c.level)
  })

  it('B4: buildConfidenceFromEvidence 自动生成5维', () => {
    const bundle = TraceEngine.createDemoCaiWangBundle()
    const c = buildConfidenceFromEvidence(bundle)
    expect(c.overall).toBeGreaterThan(0)
    expect(c.value).toEqual(c.overall)
  })
})
