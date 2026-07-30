import { describe, it, expect } from 'vitest'
import { globalXiYongEngine, type XiYongInput } from '../../../xiyongshen/index'

describe('B7 喜用神 7路综合（扶抑/调候/病药/通关/寒暖/燥湿/格局）', () => {
  const inputStrong: XiYongInput = {
    dayGanWuxing: '木',
    monthZhiWuxing: '木',
    count: { '木': 4, '火': 1, '土': 1, '金': 0, '水': 2 },
    dayStrength: 2.2,
    isSummerBorn: true,
    isDrySeason: true,
    conflictingPairs: [['木','土']],
    gejuCategory: '正格',
  }

  it('evaluateAsTriple 返回三元（result/evidence/confidence）', () => {
    const t = globalXiYongEngine.evaluateAsTriple(inputStrong)
    expect(t.result.shens.length).toBe(5)
    expect(t.result.primaryShen).toBeTruthy()
    expect(t.evidence.length).toBeGreaterThan(10)
    const c = t.confidence as any
    expect(c.calendar).toBeGreaterThan(0)
    expect(c.geju).toBeDefined()
    expect(c.xiyongshen).toBeGreaterThan(0)
    expect(c.shensha).toBeDefined()
    expect(c.overall).toBeGreaterThan(0)
  })

  it('每路方法至少有 3 步 trace', () => {
    const r = globalXiYongEngine.evaluate(inputStrong)
    for (const m of r.methods) {
      if (m.applicable) {
        expect(m.trace.length, `${m.method} trace ≥3`).toBeGreaterThanOrEqual(3)
        expect(m.trace.some(t => t.citation), `${m.method} 含引用`).toBe(true)
      }
    }
  })
})
