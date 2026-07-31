import { describe, it, expect } from 'vitest'
import { globalGeJuEngine, GEJU_RULES, type MinimalPillarInput } from '../../../geju/index'
import { ExplainScoreAnalyzer, type ExplainScore } from '../../../ruleEngine/quality'

describe('P0-5 Sprint 1 · 十神格局规则（正官/七杀/正财/偏财）', () => {

  it('4 条新规则注册成功，总规则数 ≥ 16', () => {
    expect(GEJU_RULES.length).toBeGreaterThanOrEqual(16)
    const newIds = ['GEJU-ZHENGUAN-001', 'GEJU-QISHA-001', 'GEJU-ZHENGCAI-001', 'GEJU-PIANCAI-001']
    for (const id of newIds) {
      const rule = GEJU_RULES.find(r => r.id === id)
      expect(rule, `规则 ${id} 应存在`).toBeDefined()
    }
  })

  it('4 条新规则含 17 字段规范（B2 10 + C4 7 + C6-2 classicEvidence[]）', () => {
    const newIds = ['GEJU-ZHENGUAN-001', 'GEJU-QISHA-001', 'GEJU-ZHENGCAI-001', 'GEJU-PIANCAI-001']
    for (const id of newIds) {
      const rule = GEJU_RULES.find(r => r.id === id)!
      // B2 10 字段
      expect(rule.id).toBeTruthy()
      expect(/^\d+\.\d+\.\d+$/.test(rule.version)).toBe(true)
      expect(typeof rule.priority).toBe('number')
      expect(rule.source).toBeTruthy()
      expect(rule.description).toBeTruthy()
      expect(Array.isArray(rule.condition)).toBe(true)
      expect(rule.condition.length).toBeGreaterThan(0)
      expect(typeof rule.result).toBe('string')
      expect(rule.evidence).toBeDefined()
      expect(rule.confidence?.components).toBeDefined()
      expect(['priority-then-vote','majority-vote','prefer-conservative','prefer-newer','reject-both','custom']).toContain(rule.conflictStrategy)
      // C4 7 字段
      expect(rule.ruleVersion).toBeTruthy()
      expect(rule.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(rule.classicSource).toBeTruthy()
      expect(rule.author).toBeTruthy()
      expect(rule.lastReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      // C6-2 classicEvidence[]
      expect(rule.classicEvidence).toBeDefined()
      expect(rule.classicEvidence!.length).toBeGreaterThanOrEqual(2)
      for (const ce of rule.classicEvidence!) {
        expect(ce.classicName).toBeTruthy()
        expect(ce.quotedText).toBeTruthy()
        expect(ce.supports).toBeTruthy()
        expect(['direct', 'paraphrase']).toContain(ce.citation)
      }
    }
  })

  it('正官格：甲木日主，月令酉金（正官），身中和 → 成立', async () => {
    const input: MinimalPillarInput = {
      dayGan: '甲', dayGanWuxing: '木',
      monthZhi: '酉', monthZhiWuxing: '金',
      fourPillars: [
        { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
        { gan: '癸', zhi: '酉', ganWx: '水', zhiWx: '金' },
        { gan: '甲', zhi: '申', ganWx: '木', zhiWx: '金' },
        { gan: '丙', zhi: '寅', ganWx: '火', zhiWx: '木' },
      ],
      wuxingCount: { '木': 3, '火': 1, '土': 0, '金': 2, '水': 2 },
      dayStrengthLevel: 0,
      dayRootCount: 2,
    }
    const r = await globalGeJuEngine.evaluate(input)
    const zhengGuan = r.secondary.find(s => s.ruleId === 'GEJU-ZHENGUAN-001')
      ?? (r.primary.ruleId === 'GEJU-ZHENGUAN-001' ? r.primary : undefined)
    expect(zhengGuan).toBeDefined()
    expect(zhengGuan!.active).toBe(true)
  })

  it('七杀格：甲木日主，月令申金（七杀），有食神制杀 → 成立', async () => {
    const input: MinimalPillarInput = {
      dayGan: '甲', dayGanWuxing: '木',
      monthZhi: '申', monthZhiWuxing: '金',
      fourPillars: [
        { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
        { gan: '壬', zhi: '申', ganWx: '水', zhiWx: '金' },
        { gan: '甲', zhi: '申', ganWx: '木', zhiWx: '金' },
        { gan: '丙', zhi: '寅', ganWx: '火', zhiWx: '木' },
      ],
      wuxingCount: { '木': 3, '火': 1, '土': 0, '金': 2, '水': 2 },
      dayStrengthLevel: 0,
      dayRootCount: 2,
    }
    const r = await globalGeJuEngine.evaluate(input)
    const qiSha = r.secondary.find(s => s.ruleId === 'GEJU-QISHA-001')
      ?? (r.primary.ruleId === 'GEJU-QISHA-001' ? r.primary : undefined)
    expect(qiSha).toBeDefined()
    expect(qiSha!.active).toBe(true)
  })

  it('正财格：甲木日主，月令丑土（正财），身强 → 成立', async () => {
    const input: MinimalPillarInput = {
      dayGan: '甲', dayGanWuxing: '木',
      monthZhi: '丑', monthZhiWuxing: '土',
      fourPillars: [
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        { gan: '丁', zhi: '丑', ganWx: '火', zhiWx: '土' },
        { gan: '甲', zhi: '辰', ganWx: '木', zhiWx: '土' },
        { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
      ],
      wuxingCount: { '木': 4, '火': 1, '土': 2, '金': 0, '水': 1 },
      dayStrengthLevel: 1,
      dayRootCount: 2,
    }
    const r = await globalGeJuEngine.evaluate(input)
    const zhengCai = r.secondary.find(s => s.ruleId === 'GEJU-ZHENGCAI-001')
      ?? (r.primary.ruleId === 'GEJU-ZHENGCAI-001' ? r.primary : undefined)
    expect(zhengCai).toBeDefined()
    expect(zhengCai!.active).toBe(true)
  })

  it('偏财格：甲木日主，月令辰土（偏财），身强 → 成立', async () => {
    const input: MinimalPillarInput = {
      dayGan: '甲', dayGanWuxing: '木',
      monthZhi: '辰', monthZhiWuxing: '土',
      fourPillars: [
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        { gan: '戊', zhi: '辰', ganWx: '土', zhiWx: '土' },
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
      ],
      wuxingCount: { '木': 4, '火': 0, '土': 2, '金': 0, '水': 1 },
      dayStrengthLevel: 1,
      dayRootCount: 2,
    }
    const r = await globalGeJuEngine.evaluate(input)
    const pianCai = r.secondary.find(s => s.ruleId === 'GEJU-PIANCAI-001')
      ?? (r.primary.ruleId === 'GEJU-PIANCAI-001' ? r.primary : undefined)
    expect(pianCai).toBeDefined()
    expect(pianCai!.active).toBe(true)
  })

  it('C8-6 Explain Score：4 条新规则全部 ≥ 80 分（B级以上）', () => {
    const analyzer = new ExplainScoreAnalyzer()
    const newIds = ['GEJU-ZHENGUAN-001', 'GEJU-QISHA-001', 'GEJU-ZHENGCAI-001', 'GEJU-PIANCAI-001']
    for (const id of newIds) {
      const rule = GEJU_RULES.find(r => r.id === id)!
      const score = analyzer.scoreRule(rule, false)
      expect(score.score, `${id} Explain Score 应 ≥ 80`).toBeGreaterThanOrEqual(80)
      expect(['A', 'B', 'C']).toContain(score.level)
    }
  })

  it('七杀格 classicEvidence 含流派争议标注（hasControversy=true）', () => {
    const rule = GEJU_RULES.find(r => r.id === 'GEJU-QISHA-001')!
    const controversial = rule.classicEvidence!.find(ce => ce.hasControversy === true)
    expect(controversial).toBeDefined()
    expect(controversial!.controversyNote).toBeTruthy()
  })
})
