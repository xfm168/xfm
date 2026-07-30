import { describe, it, expect } from 'vitest'
import { globalGeJuEngine, GEJU_RULES, type MinimalPillarInput } from '../../../geju/index'

describe('B6 格局系统升级（10 大类）', () => {
  const zhuanwangCase: MinimalPillarInput = {
    dayGan: '甲', dayGanWuxing: '木',
    monthZhi: '寅', monthZhiWuxing: '木',
    fourPillars: [
      { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
      { gan: '甲', zhi: '卯', ganWx: '木', zhiWx: '木' },
      { gan: '甲', zhi: '辰', ganWx: '木', zhiWx: '土' },
      { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
    ],
    wuxingCount: { '木': 6, '火': 0, '土': 1, '金': 0, '水': 1 },
    dayStrengthLevel: 3,
    dayRootCount: 2,
  }

  it('12条+格局规则注册成功（按 B2 10字段规范）', () => {
    const rules = GEJU_RULES
    expect(rules.length).toBeGreaterThanOrEqual(12)
    rules.forEach(r => {
      expect(r.id, `${r.id} id 非空`).toBeTruthy()
      expect(/^\d+\.\d+\.\d+/.test(r.version), `${r.id} version`).toBe(true)
      expect(typeof r.priority).toBe('number')
      expect(r.source, `${r.id} source`).toBeTruthy()
      expect(Array.isArray(r.condition), `${r.id} condition`).toBe(true)
      expect(Array.isArray(r.condition) && r.condition.length > 0, `${r.id} 有 condition`).toBe(true)
      expect(typeof r.result).toBe('string')
      expect(r.confidence?.components, `${r.id} confidence.components`).toBeDefined()
      expect(['priority-then-vote','majority-vote','prefer-conservative','prefer-newer','reject-both','custom']).toContain(r.conflictStrategy)
    })
  })

  it('evaluate 木专旺案例返回 GeJuResult（primary/secondary/rejected 齐全）', async () => {
    const r = await globalGeJuEngine.evaluate(zhuanwangCase)
    expect(r.summary).toBeTruthy()
    expect(r.primary).toBeDefined()
    expect(Array.isArray(r.secondary)).toBe(true)
    expect(Array.isArray(r.rejected)).toBe(true)
  })
})
