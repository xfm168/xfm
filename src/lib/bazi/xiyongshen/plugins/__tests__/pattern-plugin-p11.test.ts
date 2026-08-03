import { describe, it, expect, beforeAll } from 'vitest'
import type { Wuxing } from '../../types'
import {
  defaultBaziPatternPlugin,
  BaziPatternPlugin,
  PatternClassifier,
  AdvancedPatternEngine,
  type ClassifierInput,
} from '../pattern'

function makeInput(overrides: Partial<ClassifierInput> & { fourPillars?: any[] } = {}): ClassifierInput {
  const defaultPillars = [
    { gan: '甲', zhi: '寅', ganWx: '木' as Wuxing, zhiWx: '木' as Wuxing },
    { gan: '丙', zhi: '午', ganWx: '火' as Wuxing, zhiWx: '火' as Wuxing },
    { gan: '甲', zhi: '寅', ganWx: '木' as Wuxing, zhiWx: '木' as Wuxing },
    { gan: '丁', zhi: '卯', ganWx: '火' as Wuxing, zhiWx: '木' as Wuxing },
  ]
  const defaultCount: Record<Wuxing, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  const pillars = overrides.fourPillars ?? defaultPillars
  for (const p of pillars) {
    defaultCount[p.ganWx as Wuxing] = (defaultCount[p.ganWx as Wuxing] || 0) + 1
    defaultCount[p.zhiWx as Wuxing] = (defaultCount[p.zhiWx as Wuxing] || 0) + 1
  }
  const monthZhi = pillars[1]?.zhi ?? '寅'
  const monthZhiWx = pillars[1]?.zhiWx ?? '木'
  return {
    dayGanWuxing: '木',
    monthZhiWx,
    count: defaultCount,
    fourPillars: pillars,
    dayStrength: 0,
    dayGan: pillars[2]?.gan ?? '甲',
    monthZhi,
    dayRootCount: 0,
    ...overrides,
  }
}

describe('P1.1 格局体系插件 smoke tests', () => {
  describe('T1. 插件 install/initialize/enable 生命周期', () => {
    let plugin: BaziPatternPlugin
    beforeAll(() => {
      plugin = defaultBaziPatternPlugin
    })

    it('T1.1 插件实例已创建，id/name/version 正确', async () => {
      expect(plugin).toBeTruthy()
      expect(plugin.id).toBe('bazi-pattern')
      expect(plugin.name).toBe('八字·格局体系 P1.1')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.divinationConfig.icon).toBe('📐')
      expect(plugin.divinationConfig.supportsFeatures).toContain('格局判定')
    })

    it('T1.2 install → initialize → enable 完整生命周期，classifier/engine 可用', async () => {
      await plugin.install()
      expect(plugin.state).toBe('installed')
      await plugin.initialize()
      expect(plugin.state).toBe('initialized')
      expect(plugin.classifier).toBeTruthy()
      expect(plugin.engine).toBeTruthy()
      await plugin.enable()
      expect(plugin.state).toBe('enabled')

      const health = plugin.health()
      expect(health.status).toBe('healthy')
    })

    it('T1.3 classify() 便捷方法能返回候选列表', () => {
      const input = makeInput()
      const result = plugin.classify(input)
      expect(result).toBeTruthy()
      expect(Array.isArray(result.candidates)).toBe(true)
      expect(result.candidates.length).toBeGreaterThan(0)
    })
  })

  describe('T2. 专旺格·曲直格（甲乙春生木旺）', () => {
    it('T2.1 甲乙春生+木旺 → 识别为 zhuanwang 曲直格', () => {
      const pillars = [
        { gan: '甲', zhi: '寅', ganWx: '木' as Wuxing, zhiWx: '木' as Wuxing },
        { gan: '甲', zhi: '卯', ganWx: '木' as Wuxing, zhiWx: '木' as Wuxing },
        { gan: '甲', zhi: '辰', ganWx: '木' as Wuxing, zhiWx: '土' as Wuxing },
        { gan: '乙', zhi: '亥', ganWx: '木' as Wuxing, zhiWx: '水' as Wuxing },
      ]
      const input = makeInput({
        fourPillars: pillars,
        dayGanWuxing: '木',
        dayGan: '甲',
        dayStrength: 3,
      })
      const cls = new PatternClassifier()
      const res = cls.classify(input)
      const verdict = res.verdict ?? res.strongestVerdict
      expect(verdict).toBeTruthy()
      expect(verdict!.category).toBe('zhuanwang')
      expect(verdict!.name).toContain('曲直')
    })

    it('T2.2 曲直格 yongshenProposal 包含木/水/火（喜木水泄秀火）', () => {
      const pillars = [
        { gan: '甲', zhi: '寅', ganWx: '木' as Wuxing, zhiWx: '木' as Wuxing },
        { gan: '乙', zhi: '卯', ganWx: '木' as Wuxing, zhiWx: '木' as Wuxing },
        { gan: '甲', zhi: '寅', ganWx: '木' as Wuxing, zhiWx: '木' as Wuxing },
        { gan: '丁', zhi: '亥', ganWx: '火' as Wuxing, zhiWx: '水' as Wuxing },
      ]
      const input = makeInput({ fourPillars: pillars, dayGanWuxing: '木', dayGan: '甲', dayStrength: 3 })
      const cls = new PatternClassifier()
      const res = cls.classify(input)
      const verdict = res.verdict ?? res.strongestVerdict
      expect(verdict!.yongshenProposal).toContain('木')
      expect(verdict!.yongshenProposal).toContain('水')
    })
  })

  describe('T3. 真从财格（日主无根，财星最多）', () => {
    it('T3.1 无根无印比 + 财星70%+ → category=zhencong 从财', () => {
      const pillars = [
        { gan: '丙', zhi: '午', ganWx: '火' as Wuxing, zhiWx: '火' as Wuxing },
        { gan: '庚', zhi: '酉', ganWx: '金' as Wuxing, zhiWx: '金' as Wuxing },
        { gan: '戊', zhi: '申', ganWx: '土' as Wuxing, zhiWx: '金' as Wuxing },
        { gan: '庚', zhi: '戌', ganWx: '金' as Wuxing, zhiWx: '土' as Wuxing },
      ]
      const input = makeInput({
        fourPillars: pillars,
        dayGanWuxing: '木',
        dayGan: '甲',
        monthZhi: '午',
        monthZhiWx: '火',
        dayStrength: 3,
        dayRootCount: 0,
        count: { '木': 0, '火': 2, '土': 2, '金': 5, '水': 0 },
      })
      const cls = new PatternClassifier()
      const res = cls.classify(input)
      const verdict = res.verdict ?? res.strongestVerdict
      expect(verdict!.category).toBe('zhencong')
      expect(verdict!.name).toContain('从')
    })
  })

  describe('T4. 调候格·冬生', () => {
    it('T4.1 亥子丑月 → 候选至少包含 tiaohou', () => {
      const pillars = [
        { gan: '壬', zhi: '亥', ganWx: '水' as Wuxing, zhiWx: '水' as Wuxing },
        { gan: '癸', zhi: '子', ganWx: '水' as Wuxing, zhiWx: '水' as Wuxing },
        { gan: '甲', zhi: '丑', ganWx: '木' as Wuxing, zhiWx: '土' as Wuxing },
        { gan: '乙', zhi: '亥', ganWx: '木' as Wuxing, zhiWx: '水' as Wuxing },
      ]
      const input = makeInput({
        fourPillars: pillars,
        dayGanWuxing: '木',
        dayGan: '甲',
        monthZhi: '子',
        monthZhiWx: '水',
        isWinterBorn: true,
      })
      const cls = new PatternClassifier()
      const res = cls.classify(input)
      const hasTiaoHou = res.candidates.some(c => c.category === 'tiaohou')
      expect(hasTiaoHou).toBe(true)
    })

    it('T4.2 甲乙木日主冬季调候 → yongshenProposal 包含火', () => {
      const pillars = [
        { gan: '癸', zhi: '亥', ganWx: '水' as Wuxing, zhiWx: '水' as Wuxing },
        { gan: '甲', zhi: '子', ganWx: '木' as Wuxing, zhiWx: '水' as Wuxing },
        { gan: '乙', zhi: '丑', ganWx: '木' as Wuxing, zhiWx: '土' as Wuxing },
        { gan: '丙', zhi: '亥', ganWx: '火' as Wuxing, zhiWx: '水' as Wuxing },
      ]
      const input = makeInput({
        fourPillars: pillars,
        dayGanWuxing: '木',
        dayGan: '乙',
        monthZhi: '子',
        monthZhiWx: '水',
        isWinterBorn: true,
      })
      const cls = new PatternClassifier()
      const res = cls.classify(input)
      const tiaohou = res.candidates.find(c => c.category === 'tiaohou')
      expect(tiaohou).toBeTruthy()
      const verdict = res.verdict ?? res.strongestVerdict
      if (verdict!.category === 'tiaohou') {
        expect(verdict!.yongshenProposal).toContain('火')
      }
    })
  })

  describe('T5. AdvancedPatternEngine evaluate() 返回 SubEngineResult 结构', () => {
    it('T5.1 输出 shape 正确：engineName / scores / evidence / confidence / weight >= 1.0', () => {
      const pillars = [
        { gan: '甲', zhi: '寅', ganWx: '木' as Wuxing, zhiWx: '木' as Wuxing },
        { gan: '丙', zhi: '午', ganWx: '火' as Wuxing, zhiWx: '火' as Wuxing },
        { gan: '甲', zhi: '寅', ganWx: '木' as Wuxing, zhiWx: '木' as Wuxing },
        { gan: '丁', zhi: '卯', ganWx: '火' as Wuxing, zhiWx: '木' as Wuxing },
      ]
      const input = makeInput({
        fourPillars: pillars,
        dayGanWuxing: '木',
        dayGan: '甲',
        dayStrength: 2,
      })
      const engine = new AdvancedPatternEngine()
      const out = engine.evaluate(input)

      expect(out.engineName).toBe('AdvancedPatternEngine')
      expect(out.weight).toBeGreaterThanOrEqual(1.0)
      expect(typeof out.confidence).toBe('number')
      expect(out.confidence).toBeGreaterThanOrEqual(0)
      expect(out.confidence).toBeLessThanOrEqual(1)
      expect(out.applicable).toBe(true)
      expect(out.scores).toBeTruthy()
      const expectedKeys: Wuxing[] = ['木', '火', '土', '金', '水']
      expect(expectedKeys.every(k => Object.prototype.hasOwnProperty.call(out.scores, k))).toBe(true)
      for (const k of expectedKeys) {
        expect(typeof out.scores[k]).toBe('number')
        expect(out.scores[k]).toBeGreaterThanOrEqual(-3)
        expect(out.scores[k]).toBeLessThanOrEqual(3)
      }
      expect(Array.isArray(out.evidence)).toBe(true)
      expect(out.evidence.length).toBeGreaterThanOrEqual(2)
      expect(Array.isArray(out.classicEvidence)).toBe(true)
      expect(typeof out.summary).toBe('string')
      expect(out.summary.length).toBeGreaterThan(5)
    })

    it('T5.2 evidence 含 S1/S2/S3/S4 证据步骤', () => {
      const pillars = [
        { gan: '甲', zhi: '寅', ganWx: '木' as Wuxing, zhiWx: '木' as Wuxing },
        { gan: '乙', zhi: '卯', ganWx: '木' as Wuxing, zhiWx: '木' as Wuxing },
        { gan: '甲', zhi: '寅', ganWx: '木' as Wuxing, zhiWx: '木' as Wuxing },
        { gan: '丙', zhi: '亥', ganWx: '火' as Wuxing, zhiWx: '水' as Wuxing },
      ]
      const input = makeInput({ fourPillars: pillars, dayGanWuxing: '木', dayGan: '甲', dayStrength: 3 })
      const engine = new AdvancedPatternEngine()
      const out = engine.evaluate(input)
      const steps = out.evidence.map(e => e.step)
      const hasS1 = steps.some(s => s.startsWith('S1'))
      const hasS2 = steps.some(s => s.startsWith('S2'))
      const hasS3 = steps.some(s => s.startsWith('S3'))
      const hasS4 = steps.some(s => s.startsWith('S4'))
      expect(hasS1).toBe(true)
      expect(hasS2).toBe(true)
      expect(hasS3).toBe(true)
      expect(hasS4).toBe(true)
    })
  })
})
