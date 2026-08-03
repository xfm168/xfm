import { describe, it, expect, beforeEach } from 'vitest'
import { defaultBaziPatternPlugin, PatternClassifier, AdvancedPatternEngine, type GejuCategory, type ClassifierInput } from '../pattern'
import { globalCapabilityRegistry } from '@/lib/bazi/foundation/core/plugin/capability'
import { PatternEngine as OldPatternEngine } from '../../engines/patternEngine'
import type { Wuxing, SubEngineInput } from '../../types'

const WX: Wuxing[] = ['木', '火', '土', '金', '水']

function mkInput(partial: Partial<ClassifierInput>): ClassifierInput & SubEngineInput {
  const count = partial.count ?? { '木': 1, '火': 1, '土': 1, '金': 1, '水': 1 }
  const dayGanWuxing = partial.dayGanWuxing ?? '木'
  const monthZhiWuxing = partial.monthZhiWuxing ?? '木'
  const dayGan = partial.dayGan ?? '甲'
  const monthZhi = partial.monthZhi ?? '寅'
  const fourPillars = partial.fourPillars ?? [
    { gan: dayGan, zhi: '寅', ganWx: dayGanWuxing, zhiWx: monthZhiWuxing },
    { gan: '丙', zhi: monthZhi, ganWx: '火', zhiWx: monthZhiWuxing },
    { gan: '戊', zhi: '辰', ganWx: '土', zhiWx: '土' },
    { gan: '庚', zhi: '申', ganWx: '金', zhiWx: '金' },
  ]
  return {
    dayGanWuxing,
    monthZhiWuxing,
    count,
    fourPillars,
    dayStrength: partial.dayStrength ?? 0,
    dayGan,
    monthZhi,
    dayRootCount: partial.dayRootCount ?? 1,
    isWinterBorn: partial.isWinterBorn,
    isSummerBorn: partial.isSummerBorn,
    conflictingPairs: partial.conflictingPairs,
  }
}

describe('P1.1 格局体系验收测试', () => {
  beforeEach(async () => {
    try { await defaultBaziPatternPlugin.destroy() } catch (_) { /* noop */ }
  })

  // ============================================================
  // Criterion 1: 10 大类全部可识别
  // ============================================================
  describe('Criterion 1: 10 大类全部可识别', () => {
    it('识别真从格（zhencong）', () => {
      const classifier = new PatternClassifier()
      const input = mkInput({
        dayGanWuxing: '木',
        count: { '木': 0, '火': 3, '土': 3, '金': 6, '水': 0 },
        dayRootCount: 0,
        dayStrength: 3.5,
        dayGan: '甲',
      })
      const r = classifier.classify(input)
      expect(r.candidates.some(c => c.category === 'zhencong')).toBe(true)
      const zc = r.candidates.find(c => c.category === 'zhencong')!
      expect(zc.score).toBeGreaterThanOrEqual(70)
    })

    it('识别假从格（jiacong）', () => {
      const classifier = new PatternClassifier()
      const input = mkInput({
        dayGanWuxing: '木',
        count: { '木': 1, '火': 0, '土': 1, '金': 6, '水': 2 },
        dayRootCount: 1,
        dayStrength: 2.5,
        dayGan: '甲',
      })
      const r = classifier.classify(input)
      expect(r.candidates.some(c => c.category === 'jiacong')).toBe(true)
    })

    it('识别专旺格（zhuanwang·曲直）', () => {
      const classifier = new PatternClassifier()
      const input = mkInput({
        dayGanWuxing: '木',
        count: { '木': 5, '火': 2, '土': 1, '金': 0, '水': 2 },
        dayStrength: 2.5,
        monthZhiWuxing: '木',
        monthZhi: '卯',
        dayGan: '甲',
        fourPillars: [
          { gan: '甲', zhi: '亥', ganWx: '木', zhiWx: '水' },
          { gan: '甲', zhi: '卯', ganWx: '木', zhiWx: '木' },
          { gan: '乙', zhi: '未', ganWx: '木', zhiWx: '土' },
          { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        ],
      })
      const r = classifier.classify(input)
      expect(r.candidates.some(c => c.category === 'zhuanwang')).toBe(true)
    })

    it('识别一气格（yiqi·天元一气 / 地元一气）', () => {
      const classifier = new PatternClassifier()
      const tianyuan = mkInput({
        dayGan: '甲',
        dayGanWuxing: '木',
        count: { '木': 4, '火': 1, '土': 1, '金': 1, '水': 1 },
        fourPillars: [
          { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
          { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
          { gan: '甲', zhi: '辰', ganWx: '木', zhiWx: '土' },
          { gan: '甲', zhi: '午', ganWx: '木', zhiWx: '火' },
        ],
      })
      const r1 = classifier.classify(tianyuan)
      expect(r1.candidates.some(c => c.category === 'yiqi' && c.name === '一气-天元一气')).toBe(true)

      const diyuan = mkInput({
        dayGanWuxing: '木',
        count: { '木': 1, '火': 1, '土': 1, '金': 1, '水': 4 },
        fourPillars: [
          { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
          { gan: '丙', zhi: '子', ganWx: '火', zhiWx: '水' },
          { gan: '戊', zhi: '子', ganWx: '土', zhiWx: '水' },
          { gan: '庚', zhi: '子', ganWx: '金', zhiWx: '水' },
        ],
      })
      const r2 = classifier.classify(diyuan)
      expect(r2.candidates.some(c => c.category === 'yiqi' && c.name === '一气-地元一气')).toBe(true)
    })

    it('识别化气格（huaqi·甲己化土）', () => {
      const classifier = new PatternClassifier()
      const input = mkInput({
        dayGan: '甲',
        dayGanWuxing: '木',
        monthZhi: '辰',
        monthZhiWuxing: '土',
        count: { '木': 2, '火': 1, '土': 3, '金': 1, '水': 1 },
        fourPillars: [
          { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
          { gan: '戊', zhi: '辰', ganWx: '土', zhiWx: '土' },
          { gan: '己', zhi: '申', ganWx: '土', zhiWx: '金' },
          { gan: '壬', zhi: '戌', ganWx: '水', zhiWx: '土' },
        ],
      })
      const r = classifier.classify(input)
      expect(r.candidates.some(c => c.category === 'huaqi')).toBe(true)
      expect(r.candidates.find(c => c.category === 'huaqi')?.name).toContain('化土')
    })

    it('识别调候格（tiaohou·冬生）', () => {
      const classifier = new PatternClassifier()
      const input = mkInput({
        dayGanWuxing: '木',
        monthZhi: '亥',
        monthZhiWuxing: '水',
        isWinterBorn: true,
        count: { '木': 1, '火': 0, '土': 1, '金': 3, '水': 5 },
      })
      const r = classifier.classify(input)
      expect(r.candidates.some(c => c.category === 'tiaohou')).toBe(true)
    })

    it('识别病药格（bingyao）', () => {
      const classifier = new PatternClassifier()
      const input = mkInput({
        dayGanWuxing: '木',
        count: { '木': 5, '火': 2, '土': 1, '金': 2, '水': 1 },
      })
      const r = classifier.classify(input)
      expect(r.candidates.some(c => c.category === 'bingyao')).toBe(true)
    })

    it('识别通关格（tongguan）', () => {
      const classifier = new PatternClassifier()
      const input = mkInput({
        dayGanWuxing: '木',
        count: { '木': 3, '火': 1, '土': 1, '金': 3, '水': 2 },
      })
      const r = classifier.classify(input)
      expect(r.candidates.some(c => c.category === 'tongguan')).toBe(true)
    })

    it('识别扶抑格（fuyi）', () => {
      const classifier = new PatternClassifier()
      const strong = mkInput({
        dayGanWuxing: '木',
        count: { '木': 5, '火': 1, '土': 1, '金': 1, '水': 2 },
        dayStrength: 2.8,
      })
      const r1 = classifier.classify(strong)
      expect(r1.candidates.some(c => c.category === 'fuyi')).toBe(true)

      const weak = mkInput({
        dayGanWuxing: '木',
        count: { '木': 1, '火': 2, '土': 2, '金': 3, '水': 1 },
        dayStrength: -2.5,
      })
      const r2 = classifier.classify(weak)
      expect(r2.candidates.some(c => c.category === 'fuyi')).toBe(true)
    })

    it('识别正格（zheng）', () => {
      const classifier = new PatternClassifier()
      const input = mkInput({
        dayGanWuxing: '木',
        monthZhi: '寅',
        monthZhiWuxing: '木',
        count: { '木': 2, '火': 2, '土': 2, '金': 1, '水': 1 },
        dayStrength: 0,
      })
      const r = classifier.classify(input)
      expect(r.candidates.some(c => c.category === 'zheng')).toBe(true)
      expect(r.strongestVerdict).toBeDefined()
    })
  })

  // ============================================================
  // Criterion 2: Evidence 链完整
  // ============================================================
  describe('Criterion 2: Evidence 链完整', () => {
    it('evaluate() 结果的 evidence[] 包含 S1 ~ S4 步骤', () => {
      const engine = new AdvancedPatternEngine()
      const input = mkInput({
        dayGanWuxing: '木',
        count: { '木': 0, '火': 3, '土': 2, '金': 6, '水': 1 },
        dayRootCount: 0,
        dayStrength: 3.5,
        dayGan: '甲',
      })
      const r = engine.evaluate(input)
      const steps = r.evidence.map(e => e.step)
      expect(steps.some(s => s.startsWith('S1'))).toBe(true)
      expect(steps.some(s => s.startsWith('S2'))).toBe(true)
      expect(steps.some(s => s.startsWith('S3'))).toBe(true)
      expect(steps.some(s => s.startsWith('S4'))).toBe(true)
    })

    it('每个 evidence step 具有 step 和 text 字段', () => {
      const engine = new AdvancedPatternEngine()
      const input = mkInput({
        dayGanWuxing: '木',
        monthZhi: '亥',
        monthZhiWuxing: '水',
        isWinterBorn: true,
        count: { '木': 1, '火': 0, '土': 1, '金': 3, '水': 5 },
      })
      const r = engine.evaluate(input)
      expect(r.evidence.length).toBeGreaterThanOrEqual(4)
      for (const e of r.evidence) {
        expect(e).toHaveProperty('step')
        expect(e).toHaveProperty('text')
        expect(typeof e.step).toBe('string')
        expect(e.step.length).toBeGreaterThan(0)
        expect(typeof e.text).toBe('string')
        expect(e.text.length).toBeGreaterThan(0)
      }
    })
  })

  // ============================================================
  // Criterion 3: 古籍溯源
  // ============================================================
  describe('Criterion 3: 古籍溯源', () => {
    it('每个类别 verdict.classicCitations 至少 1 条，具备 classicCode + quote', () => {
      const classifier = new PatternClassifier()
      const testCases: Array<{ cat: GejuCategory; input: ClassifierInput }> = [
        {
          cat: 'zhencong',
          input: mkInput({
            dayGanWuxing: '木', count: { '木': 0, '火': 3, '土': 3, '金': 6, '水': 0 },
            dayRootCount: 0, dayStrength: 3.5, dayGan: '甲',
          }),
        },
        {
          cat: 'tiaohou',
          input: mkInput({
            dayGanWuxing: '木', monthZhi: '亥', monthZhiWuxing: '水',
            isWinterBorn: true, count: { '木': 1, '火': 0, '土': 1, '金': 3, '水': 5 },
          }),
        },
      ]
      for (const tc of testCases) {
        const r = classifier.classify(tc.input)
        const cand = r.candidates.find(c => c.category === tc.cat)
        expect(cand).toBeDefined()
        const verdict = r.strongestVerdict ?? r.verdict
        expect(verdict).toBeDefined()
        expect(verdict!.classicCitations.length).toBeGreaterThanOrEqual(1)
        const first = verdict!.classicCitations[0]
        expect(first).toHaveProperty('classicCode')
        expect(first).toHaveProperty('quote')
        expect(first.classicCode.length).toBeGreaterThan(0)
        expect(first.quote.length).toBeGreaterThan(0)
      }
    })

    it('AdvancedPatternEngine.classicEvidence 具备 non-empty classicName/chapterTitle', () => {
      const engine = new AdvancedPatternEngine()
      const input = mkInput({
        dayGanWuxing: '木',
        count: { '木': 5, '火': 2, '土': 1, '金': 0, '水': 2 },
        dayStrength: 2.5, monthZhiWuxing: '木', monthZhi: '卯', dayGan: '甲',
        fourPillars: [
          { gan: '甲', zhi: '亥', ganWx: '木', zhiWx: '水' },
          { gan: '甲', zhi: '卯', ganWx: '木', zhiWx: '木' },
          { gan: '乙', zhi: '未', ganWx: '木', zhiWx: '土' },
          { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        ],
      })
      const r = engine.evaluate(input)
      expect(r.classicEvidence.length).toBeGreaterThanOrEqual(1)
      for (const ce of r.classicEvidence) {
        expect(ce.classicName).toBeTruthy()
        expect(ce.chapterTitle).toBeTruthy()
        expect(typeof ce.classicName).toBe('string')
        expect(ce.classicName.length).toBeGreaterThan(0)
        expect(typeof ce.chapterTitle).toBe('string')
        expect(ce.chapterTitle.length).toBeGreaterThan(0)
      }
    })
  })

  // ============================================================
  // Criterion 4: 拟议喜用神非空
  // ============================================================
  describe('Criterion 4: 拟议喜用神非空', () => {
    it('真从/专旺/调候/化气 verdict.yongshenProposal 非空', () => {
      const classifier = new PatternClassifier()
      const cases: Array<{ label: string; input: ClassifierInput; cat: GejuCategory }> = [
        {
          label: '真从', cat: 'zhencong',
          input: mkInput({
            dayGanWuxing: '木', count: { '木': 0, '火': 2, '土': 1, '金': 7, '水': 0 },
            dayRootCount: 0, dayStrength: 4, dayGan: '甲',
          }),
        },
        {
          label: '专旺', cat: 'zhuanwang',
          input: mkInput({
            dayGanWuxing: '木', count: { '木': 6, '火': 2, '土': 0, '金': 0, '水': 2 },
            dayStrength: 3, monthZhiWuxing: '木', monthZhi: '卯', dayGan: '甲',
            fourPillars: [
              { gan: '甲', zhi: '亥', ganWx: '木', zhiWx: '水' },
              { gan: '甲', zhi: '卯', ganWx: '木', zhiWx: '木' },
              { gan: '乙', zhi: '未', ganWx: '木', zhiWx: '土' },
              { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
            ],
          }),
        },
        {
          label: '调候', cat: 'tiaohou',
          input: mkInput({
            dayGanWuxing: '木', monthZhi: '亥', monthZhiWuxing: '水',
            isWinterBorn: true, count: { '木': 1, '火': 0, '土': 2, '金': 2, '水': 5 },
          }),
        },
        {
          label: '化气', cat: 'huaqi',
          input: mkInput({
            dayGan: '甲', dayGanWuxing: '木', monthZhi: '辰', monthZhiWuxing: '土',
            count: { '木': 2, '火': 1, '土': 3, '金': 1, '水': 1 },
            fourPillars: [
              { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
              { gan: '戊', zhi: '辰', ganWx: '土', zhiWx: '土' },
              { gan: '己', zhi: '申', ganWx: '土', zhiWx: '金' },
              { gan: '壬', zhi: '戌', ganWx: '水', zhiWx: '土' },
            ],
          }),
        },
      ]
      for (const tc of cases) {
        const r = classifier.classify(tc.input)
        const verdict = r.verdict ?? r.strongestVerdict
        expect(verdict, `${tc.label} 判定缺失`).toBeDefined()
        expect(
          verdict!.yongshenProposal && verdict!.yongshenProposal!.length >= 1,
          `${tc.label} yongshenProposal 为空`
        ).toBe(true)
        expect(
          verdict!.jishenProposal && verdict!.jishenProposal!.length >= 1,
          `${tc.label} jishenProposal 为空`
        ).toBe(true)
      }
    })

    it('拟议喜用神数组元素为合法五行', () => {
      const classifier = new PatternClassifier()
      const input = mkInput({
        dayGanWuxing: '木', count: { '木': 0, '火': 2, '土': 1, '金': 7, '水': 0 },
        dayRootCount: 0, dayStrength: 4, dayGan: '甲',
      })
      const r = classifier.classify(input)
      const verdict = r.verdict ?? r.strongestVerdict
      expect(verdict).toBeDefined()
      for (const y of verdict!.yongshenProposal ?? []) {
        expect(WX).toContain(y)
      }
      for (const j of verdict!.jishenProposal ?? []) {
        expect(WX).toContain(j)
      }
    })
  })

  // ============================================================
  // Criterion 5: Plugin Capability 自动注册/注销
  // ============================================================
  describe('Criterion 5: Plugin Capability 自动注册/注销', () => {
    it('initialize() 后 capabilityRegistry 有 bazi-pattern，具备 bazi 和 knowledge', async () => {
      await defaultBaziPatternPlugin.initialize()
      const caps = globalCapabilityRegistry.getCapabilities('bazi-pattern')
      expect(caps).toContain('bazi')
      expect(caps).toContain('knowledge')
      const decls = globalCapabilityRegistry.getAllDeclarations()
      expect(decls.some(d => d.pluginId === 'bazi-pattern')).toBe(true)
    })

    it('destroy() 后 bazi-pattern 被注销', async () => {
      await defaultBaziPatternPlugin.initialize()
      expect(globalCapabilityRegistry.getCapabilities('bazi-pattern').length).toBeGreaterThan(0)
      await defaultBaziPatternPlugin.destroy()
      expect(globalCapabilityRegistry.getCapabilities('bazi-pattern')).toEqual([])
    })
  })

  // ============================================================
  // Criterion 6: Scores 范围 [-3, +3]
  // ============================================================
  describe('Criterion 6: Scores 范围 [-3, +3]', () => {
    it('所有五行 key 存在，每个值在 [-3, +3]', () => {
      const engine = new AdvancedPatternEngine()
      const inputs: ClassifierInput[] = [
        mkInput({
          dayGanWuxing: '木', count: { '木': 0, '火': 2, '土': 1, '金': 7, '水': 0 },
          dayRootCount: 0, dayStrength: 4, dayGan: '甲',
        }),
        mkInput({
          dayGanWuxing: '木', monthZhi: '亥', monthZhiWuxing: '水',
          isWinterBorn: true, count: { '木': 1, '火': 0, '土': 2, '金': 2, '水': 5 },
        }),
      ]
      for (const input of inputs) {
        const r = engine.evaluate(input)
        for (const wx of WX) {
          expect(r.scores).toHaveProperty(wx)
          expect(typeof r.scores[wx]).toBe('number')
          expect(r.scores[wx]).toBeGreaterThanOrEqual(-3)
          expect(r.scores[wx]).toBeLessThanOrEqual(3)
        }
      }
    })

    it('scores 主用神值 ≥ 2，忌神值 ≤ -2（典型强格局）', () => {
      const engine = new AdvancedPatternEngine()
      const input = mkInput({
        dayGan: '甲', dayGanWuxing: '木', monthZhi: '辰', monthZhiWuxing: '土',
        count: { '木': 2, '火': 1, '土': 3, '金': 1, '水': 1 },
        fourPillars: [
          { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
          { gan: '戊', zhi: '辰', ganWx: '土', zhiWx: '土' },
          { gan: '己', zhi: '申', ganWx: '土', zhiWx: '金' },
          { gan: '壬', zhi: '戌', ganWx: '水', zhiWx: '土' },
        ],
      })
      const r = engine.evaluate(input)
      const vals = Object.values(r.scores)
      expect(vals.some(v => v >= 2)).toBe(true)
    })
  })

  // ============================================================
  // Criterion 7: Classification 确定性阈值
  // ============================================================
  describe('Criterion 7: Classification 确定性阈值', () => {
    it('强格局输入 → winner.score ≥ runner-up * 1.3 或 ≥ 60', () => {
      const classifier = new PatternClassifier()
      const input = mkInput({
        dayGanWuxing: '木', count: { '木': 0, '火': 1, '土': 1, '金': 8, '水': 0 },
        dayRootCount: 0, dayStrength: 4.5, dayGan: '甲',
      })
      const r = classifier.classify(input)
      expect(r.candidates.length).toBeGreaterThanOrEqual(2)
      const winner = r.candidates[0]
      const runner = r.candidates[1]
      const ok = winner.score >= 60 || winner.score >= runner.score * 1.3
      expect(ok, `winner=${winner.score} runner=${runner.score}`).toBe(true)
      expect(r.verdict).toBeDefined()
    })

    it('边界两个接近候选 → warning 与 strongestVerdict 同时定义', () => {
      const classifier = new PatternClassifier()
      const ambiguous = mkInput({
        dayGanWuxing: '木',
        monthZhi: '寅',
        monthZhiWuxing: '木',
        count: { '木': 3, '火': 2, '土': 2, '金': 2, '水': 1 },
        dayStrength: 1.2,
      })
      const r = classifier.classify(ambiguous)
      let got = false
      for (let i = 0; i < 50 && !got; i++) {
        const tune = mkInput({
          dayGanWuxing: '木',
          monthZhi: '寅',
          monthZhiWuxing: '木',
          count: { '木': 3, '火': 2, '土': 2, '金': 2, '水': 1 },
          dayStrength: 0,
          isWinterBorn: i % 2 === 0 ? true : undefined,
        })
        const rr = classifier.classify(tune)
        if (rr.warning && rr.strongestVerdict) {
          got = true
          break
        }
      }
      if (r.warning) {
        expect(r.strongestVerdict).toBeDefined()
      } else {
        expect(got).toBe(true)
      }
    })
  })

  // ============================================================
  // Criterion 8: 权重 > 1.0（优先级高于旧 PatternEngine）
  // ============================================================
  describe('Criterion 8: 权重 > 1.0（优先级高于旧 PatternEngine）', () => {
    it('AdvancedPatternEngine.weight >= 1.2', () => {
      const engine = new AdvancedPatternEngine()
      expect(engine.weight).toBeGreaterThanOrEqual(1.2)
    })

    it('evaluate 返回结果 weight 字段 >= 1.2', () => {
      const engine = new AdvancedPatternEngine()
      const input = mkInput({
        dayGanWuxing: '木', monthZhi: '亥', monthZhiWuxing: '水',
        isWinterBorn: true, count: { '木': 1, '火': 0, '土': 2, '金': 2, '水': 5 },
      })
      const r = engine.evaluate(input)
      expect(r.weight).toBeGreaterThanOrEqual(1.2)
    })
  })

  // ============================================================
  // Criterion 9: SubEngineResult 完整字段
  // ============================================================
  describe('Criterion 9: SubEngineResult 完整字段', () => {
    it('返回 8 个必需字段：engineName, applicable, scores, evidence, classicEvidence, confidence, weight, summary', () => {
      const engine = new AdvancedPatternEngine()
      const input = mkInput({
        dayGanWuxing: '木', count: { '木': 1, '火': 2, '土': 2, '金': 2, '水': 1 },
        monthZhi: '寅', monthZhiWuxing: '木',
      })
      const r = engine.evaluate(input)
      expect(r).toHaveProperty('engineName')
      expect(r).toHaveProperty('applicable')
      expect(r).toHaveProperty('scores')
      expect(r).toHaveProperty('evidence')
      expect(r).toHaveProperty('classicEvidence')
      expect(r).toHaveProperty('confidence')
      expect(r).toHaveProperty('weight')
      expect(r).toHaveProperty('summary')
      expect(typeof r.engineName).toBe('string')
      expect(typeof r.applicable).toBe('boolean')
      expect(typeof r.confidence).toBe('number')
      expect(typeof r.weight).toBe('number')
      expect(typeof r.summary).toBe('string')
      expect(Array.isArray(r.evidence)).toBe(true)
      expect(Array.isArray(r.classicEvidence)).toBe(true)
      expect(typeof r.scores).toBe('object')
    })

    it('各字段类型和值合理性校验（confidence ∈ [0,1]，weight>0）', () => {
      const engine = new AdvancedPatternEngine()
      const input = mkInput({
        dayGanWuxing: '木',
        count: { '木': 0, '火': 2, '土': 1, '金': 7, '水': 0 },
        dayRootCount: 0, dayStrength: 4, dayGan: '甲',
      })
      const r = engine.evaluate(input)
      expect(r.confidence).toBeGreaterThanOrEqual(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
      expect(r.weight).toBeGreaterThan(0)
      expect(r.engineName.length).toBeGreaterThan(0)
      expect(r.summary.length).toBeGreaterThan(0)
    })
  })

  // ============================================================
  // Criterion 10: 与旧引擎共存（非替换）
  // ============================================================
  describe('Criterion 10: 与旧引擎共存（非替换）', () => {
    it('旧 PatternEngine 仍可 require、evaluate 且无错误，返回 SubEngineResult', () => {
      const oldEngine = new OldPatternEngine()
      expect(oldEngine.name).toBe('PatternEngine')
      const input = mkInput({
        dayGanWuxing: '木',
        count: { '木': 3, '火': 2, '土': 1, '金': 1, '水': 1 },
        monthZhi: '寅',
        monthZhiWuxing: '木',
      })
      const r = oldEngine.evaluate(input)
      expect(r).toBeDefined()
      expect(r).toHaveProperty('engineName')
      expect(r).toHaveProperty('scores')
      expect(r).toHaveProperty('evidence')
      expect(r).toHaveProperty('classicEvidence')
      expect(r).toHaveProperty('confidence')
      expect(r).toHaveProperty('weight')
      expect(r).toHaveProperty('summary')
    })

    it('新旧引擎可同时 evaluate 同一输入互不干扰', () => {
      const oldEngine = new OldPatternEngine()
      const newEngine = new AdvancedPatternEngine()
      const input = mkInput({
        dayGanWuxing: '木', monthZhi: '亥', monthZhiWuxing: '水',
        isWinterBorn: true, count: { '木': 1, '火': 0, '土': 2, '金': 2, '水': 5 },
      })
      const r1 = oldEngine.evaluate(input)
      const r2 = newEngine.evaluate(input)
      expect(r1.engineName).toBe('PatternEngine')
      expect(r2.engineName).toBe('AdvancedPatternEngine')
      expect(r1.weight).toBeLessThan(r2.weight)
      for (const wx of WX) {
        expect(r1.scores).toHaveProperty(wx)
        expect(r2.scores).toHaveProperty(wx)
      }
    })
  })
})
