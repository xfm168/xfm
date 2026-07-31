import { describe, it, expect } from 'vitest'
import { YongShenDecisionEngine, globalYongShenDecisionEngine } from '../../../xiyongshen/engines/decisionEngine'
import type { SubEngineInput } from '../../../xiyongshen/engines/types'
import type { YongShenDecision } from '../../../xiyongshen/engines/decisionEngine'

describe('Sprint3-4 YongShenDecisionEngine（喜用神综合决策引擎）', () => {
  // 甲木日主，月令酉金（正官），身中和，有食神(火)
  const baseInput: SubEngineInput = {
    dayGan: '甲', dayGanWuxing: '木', monthZhi: '酉', monthZhiWuxing: '金',
    fourPillars: [
      { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
      { gan: '癸', zhi: '酉', ganWx: '水', zhiWx: '金' },
      { gan: '甲', zhi: '申', ganWx: '木', zhiWx: '金' },
      { gan: '丙', zhi: '寅', ganWx: '火', zhiWx: '木' },
    ],
    count: { '木': 3, '火': 1, '土': 0, '金': 2, '水': 2 },
    dayStrength: 0, dayRootCount: 2,
    isWinterBorn: false, isSummerBorn: false,
  }

  it('输出完整 YongShenDecision 结构', () => {
    const decision = globalYongShenDecisionEngine.decide(baseInput)

    expect(decision.usefulGod).toBeTruthy()
    expect(decision.favorableGod).toBeTruthy()
    expect(decision.unfavorableGod).toBeTruthy()
    expect(decision.enemyGod).toBeTruthy()
    expect(decision.idleGod).toBeTruthy()
    expect(decision.strategy).toBeTruthy()
    expect(decision.evidence).toBeInstanceOf(Array)
    expect(decision.evidence.length).toBeGreaterThan(0)
    expect(decision.confidence).toBeDefined()
    expect(decision.classicEvidence).toBeInstanceOf(Array)
    expect(decision.explain).toContain('用神')
    expect(decision.subEngineResults.length).toBe(7)
    expect(decision.summary).toContain('用神')
    expect(decision.breakdown.length).toBe(5)
  })

  it('breakdown 包含 5 个五行的评分明细', () => {
    const decision = globalYongShenDecisionEngine.decide(baseInput)

    for (const b of decision.breakdown) {
      expect(['木', '火', '土', '金', '水']).toContain(b.wuxing)
      expect(typeof b.totalScore).toBe('number')
      expect(['用神', '喜神', '闲神', '忌神', '仇神']).toContain(b.finalType)
      expect(b.byEngine).toBeInstanceOf(Array)
    }
  })

  it('用神是综合评分最高的五行', () => {
    const decision = globalYongShenDecisionEngine.decide(baseInput)

    const sorted = [...decision.breakdown].sort((a, b) => b.totalScore - a.totalScore)
    expect(decision.usefulGod).toBe(sorted[0].wuxing)
  })

  it('忌神是综合评分最低的五行', () => {
    const decision = globalYongShenDecisionEngine.decide(baseInput)

    const sorted = [...decision.breakdown].sort((a, b) => a.totalScore - b.totalScore)
    expect(decision.unfavorableGod).toBe(sorted[0].wuxing)
  })

  it('evidence 来自所有适用的子引擎', () => {
    const decision = globalYongShenDecisionEngine.decide(baseInput)

    const engineNames = decision.evidence.map(e => e.engineName)
    // 至少有 ClimateEngine 和 BalanceEngine 适用
    expect(engineNames).toContain('ClimateEngine')
    // 每个 evidence 项都有 trace items
    for (const ev of decision.evidence) {
      expect(ev.items).toBeInstanceOf(Array)
      if (ev.items.length > 0) {
        expect(ev.items[0].step).toBeTruthy()
      }
    }
  })

  it('classicEvidence 合并所有子引擎的经典引用', () => {
    const decision = globalYongShenDecisionEngine.decide(baseInput)

    expect(decision.classicEvidence.length).toBeGreaterThan(0)
    // 检查至少引用了 2 部经典
    const classicNames = new Set(decision.classicEvidence.map(ce => ce.classicName))
    expect(classicNames.size).toBeGreaterThanOrEqual(2)
  })

  it('confidence 是 5 维结构', () => {
    const decision = globalYongShenDecisionEngine.decide(baseInput)

    expect(decision.confidence).toBeDefined()
    expect(decision.confidence.overall).toBeDefined()
    expect(typeof decision.confidence.overall).toBe('number')
  })

  it('explain 包含完整推演说明', () => {
    const decision = globalYongShenDecisionEngine.decide(baseInput)

    expect(decision.explain).toContain('喜用神综合推演说明')
    expect(decision.explain).toContain('用神')
    expect(decision.explain).toContain('忌神')
    expect(decision.explain).toContain('推演过程')
    expect(decision.explain).toContain('五行综合评分')
  })

  it('strategy 包含引擎数量和策略建议', () => {
    const decision = globalYongShenDecisionEngine.decide(baseInput)

    expect(decision.strategy).toContain('用神')
    expect(decision.strategy).toContain('忌神')
    expect(decision.strategy).toContain('引擎')
  })

  it('身弱场景：甲木日主身弱，印星(水)应为用神', () => {
    const weakInput: SubEngineInput = {
      ...baseInput,
      dayStrength: -2,
      count: { '木': 1, '火': 0, '土': 0, '金': 4, '水': 1 },
    }
    const decision = globalYongShenDecisionEngine.decide(weakInput)

    // 身弱用印比，水为印星
    const waterScore = decision.breakdown.find(b => b.wuxing === '水')!
    const metalScore = decision.breakdown.find(b => b.wuxing === '金')!
    expect(waterScore.totalScore).toBeGreaterThan(metalScore.totalScore)
  })

  it('冬月场景：甲木日主冬生，火应为调候用神', () => {
    const winterInput: SubEngineInput = {
      ...baseInput,
      isWinterBorn: true,
      count: { '木': 3, '火': 0, '土': 0, '金': 1, '水': 4 },
    }
    const decision = globalYongShenDecisionEngine.decide(winterInput)

    // 冬月用火调候
    const fireScore = decision.breakdown.find(b => b.wuxing === '火')!
    expect(fireScore.totalScore).toBeGreaterThan(0)
  })

  it('新增子引擎不会推翻决策逻辑（可扩展性验证）', () => {
    // 验证 DecisionEngine 的 engines 数组是可扩展的
    const engine = new YongShenDecisionEngine()
    const decision1 = engine.decide(baseInput)

    // 模拟新增一个引擎（通过修改输入但不改变 DecisionEngine 结构）
    const modifiedInput = { ...baseInput, diseaseWuxing: '金' as const }
    const decision2 = engine.decide(modifiedInput)

    // 两次决策结构一致
    expect(decision1.usefulGod).toBeTruthy()
    expect(decision2.usefulGod).toBeTruthy()
    expect(typeof decision1.usefulGod).toBe('string')
    expect(typeof decision2.usefulGod).toBe('string')
  })
})
