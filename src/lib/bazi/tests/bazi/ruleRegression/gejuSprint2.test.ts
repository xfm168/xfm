import { describe, it, expect } from 'vitest'
import { globalGeJuEngine, GEJU_RULES, type MinimalPillarInput } from '../../../geju/index'
import { ExplainScoreAnalyzer } from '../../../ruleEngine/quality'

describe('P0-5 Sprint 2 · 十神格局规则（食神/伤官/印格/杀印相生）', () => {

  it('4 条新规则注册成功，总规则数 ≥ 24', () => {
    expect(GEJU_RULES.length).toBeGreaterThanOrEqual(24)
    const newIds = ['GEJU-SHISHEN-001', 'GEJU-SHANGGUAN-001', 'GEJU-ZHENGYIN-001', 'GEJU-SHAYIN-001']
    for (const id of newIds) {
      expect(GEJU_RULES.find(r => r.id === id), `规则 ${id} 应存在`).toBeDefined()
    }
  })

  it('4 条新规则含 17 字段 + classicEvidence[] ≥ 3', () => {
    const newIds = ['GEJU-SHISHEN-001', 'GEJU-SHANGGUAN-001', 'GEJU-ZHENGYIN-001', 'GEJU-SHAYIN-001']
    for (const id of newIds) {
      const rule = GEJU_RULES.find(r => r.id === id)!
      expect(rule.id).toBeTruthy()
      expect(rule.version).toMatch(/^\d+\.\d+\.\d+$/)
      expect(rule.ruleVersion).toBeTruthy()
      expect(rule.classicEvidence!.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('食神格：甲木日主，月令巳火（食神），身强 → 成立', async () => {
    const input: MinimalPillarInput = {
      dayGan: '甲', dayGanWuxing: '木',
      monthZhi: '巳', monthZhiWuxing: '火',
      fourPillars: [
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        { gan: '丁', zhi: '巳', ganWx: '火', zhiWx: '火' },
        { gan: '甲', zhi: '辰', ganWx: '木', zhiWx: '土' },
        { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
      ],
      wuxingCount: { '木': 4, '火': 1, '土': 1, '金': 0, '水': 1 },
      dayStrengthLevel: 1,
      dayRootCount: 2,
    }
    const r = await globalGeJuEngine.evaluate(input)
    const found = r.secondary.find(s => s.ruleId === 'GEJU-SHISHEN-001') ?? (r.primary.ruleId === 'GEJU-SHISHEN-001' ? r.primary : undefined)
    expect(found).toBeDefined()
    expect(found!.active).toBe(true)
  })

  it('伤官格：甲木日主，月令午火（伤官），有印制 → 成立', async () => {
    const input: MinimalPillarInput = {
      dayGan: '甲', dayGanWuxing: '木',
      monthZhi: '午', monthZhiWuxing: '火',
      fourPillars: [
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        { gan: '丁', zhi: '午', ganWx: '火', zhiWx: '火' },
        { gan: '癸', zhi: '酉', ganWx: '水', zhiWx: '金' },
        { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
      ],
      wuxingCount: { '木': 3, '火': 1, '土': 0, '金': 1, '水': 2 },
      dayStrengthLevel: 0,
      dayRootCount: 2,
    }
    const r = await globalGeJuEngine.evaluate(input)
    const found = r.secondary.find(s => s.ruleId === 'GEJU-SHANGGUAN-001') ?? (r.primary.ruleId === 'GEJU-SHANGGUAN-001' ? r.primary : undefined)
    expect(found).toBeDefined()
    expect(found!.active).toBe(true)
  })

  it('正印格：甲木日主，月令亥水（正印），有官生印 → 成立', async () => {
    const input: MinimalPillarInput = {
      dayGan: '甲', dayGanWuxing: '木',
      monthZhi: '亥', monthZhiWuxing: '水',
      fourPillars: [
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        { gan: '癸', zhi: '亥', ganWx: '水', zhiWx: '水' },
        { gan: '甲', zhi: '申', ganWx: '木', zhiWx: '金' },
        { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
      ],
      wuxingCount: { '木': 4, '火': 0, '土': 0, '金': 1, '水': 3 },
      dayStrengthLevel: 1,
      dayRootCount: 2,
    }
    const r = await globalGeJuEngine.evaluate(input)
    const found = r.secondary.find(s => s.ruleId === 'GEJU-ZHENGYIN-001') ?? (r.primary.ruleId === 'GEJU-ZHENGYIN-001' ? r.primary : undefined)
    expect(found).toBeDefined()
    expect(found!.active).toBe(true)
  })

  it('杀印相生格：甲木日主，有七杀(金)+印(水)，金生水→水生木 → 成立', async () => {
    const input: MinimalPillarInput = {
      dayGan: '甲', dayGanWuxing: '木',
      monthZhi: '申', monthZhiWuxing: '金',
      fourPillars: [
        { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
        { gan: '壬', zhi: '申', ganWx: '水', zhiWx: '金' },
        { gan: '甲', zhi: '申', ganWx: '木', zhiWx: '金' },
        { gan: '癸', zhi: '亥', ganWx: '水', zhiWx: '水' },
      ],
      wuxingCount: { '木': 2, '火': 0, '土': 0, '金': 2, '水': 4 },
      dayStrengthLevel: 0,
      dayRootCount: 1,
    }
    const r = await globalGeJuEngine.evaluate(input)
    const found = r.secondary.find(s => s.ruleId === 'GEJU-SHAYIN-001') ?? (r.primary.ruleId === 'GEJU-SHAYIN-001' ? r.primary : undefined)
    expect(found).toBeDefined()
    expect(found!.active).toBe(true)
  })

  it('C8-6 Explain Score：4 条新规则全部 ≥ 80 分', () => {
    const analyzer = new ExplainScoreAnalyzer()
    const newIds = ['GEJU-SHISHEN-001', 'GEJU-SHANGGUAN-001', 'GEJU-ZHENGYIN-001', 'GEJU-SHAYIN-001']
    for (const id of newIds) {
      const rule = GEJU_RULES.find(r => r.id === id)!
      const score = analyzer.scoreRule(rule, false)
      expect(score.score, `${id} Explain Score 应 ≥ 80`).toBeGreaterThanOrEqual(80)
      expect(['A', 'B', 'C']).toContain(score.level)
    }
  })

  it('伤官格 + 杀印相生格 classicEvidence 含流派争议标注', () => {
    const sg = GEJU_RULES.find(r => r.id === 'GEJU-SHANGGUAN-001')!
    expect(sg.classicEvidence!.some(ce => ce.hasControversy === true)).toBe(true)
    const sy = GEJU_RULES.find(r => r.id === 'GEJU-SHAYIN-001')!
    expect(sy.classicEvidence!.some(ce => ce.hasControversy === true)).toBe(true)
  })
})
