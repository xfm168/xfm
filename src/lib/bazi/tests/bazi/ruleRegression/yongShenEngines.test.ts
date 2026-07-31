import { describe, it, expect } from 'vitest'
import { StrengthEngine, PatternEngine, ClimateEngine, BalanceEngine, MedicineEngine, BridgeEngine, SeasonEngine } from '../../../xiyongshen/engines'
import type { SubEngineInput } from '../../../xiyongshen/engines'

describe('Sprint3-1+3-2 喜用神子引擎', () => {
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

  describe('StrengthEngine（日主旺衰）', () => {
    it('计算日主强弱等级并输出 Evidence', () => {
      const engine = new StrengthEngine()
      const result = engine.evaluate(baseInput)

      expect(result.engineName).toBe('StrengthEngine')
      expect(result.applicable).toBe(true)
      expect(result.evidence.length).toBeGreaterThan(0)
      expect(result.classicEvidence.length).toBeGreaterThanOrEqual(2)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.summary).toContain('日主')
      expect(result.summary).toContain('木')
    })

    it('身强场景判定正确', () => {
      const engine = new StrengthEngine()
      const strongInput = { ...baseInput, count: { '木': 5, '火': 0, '土': 0, '金': 1, '水': 2 } as any, dayRootCount: 3 }
      const result = engine.evaluate(strongInput)
      expect(result.summary).toContain('身强')
    })

    it('身弱场景判定正确', () => {
      const engine = new StrengthEngine()
      const weakInput = { ...baseInput, count: { '木': 1, '火': 0, '土': 0, '金': 4, '水': 1 } as any, dayRootCount: 0 }
      const result = engine.evaluate(weakInput)
      expect(result.summary).toContain('身弱')
    })

    it('classicEvidence 引用滴天髓和子平真诠', () => {
      const engine = new StrengthEngine()
      const result = engine.evaluate(baseInput)
      const sources = result.classicEvidence.map(ce => ce.classicName)
      expect(sources).toContain('滴天髓')
      expect(sources).toContain('子平真诠')
    })
  })

  describe('PatternEngine（格局影响）', () => {
    it('正格不强制评分', () => {
      const engine = new PatternEngine()
      const result = engine.evaluate({ ...baseInput, gejuCategory: '正格' })
      expect(result.applicable).toBe(false)
    })

    it('从格从旺神', () => {
      const engine = new PatternEngine()
      const result = engine.evaluate({ ...baseInput, gejuCategory: '从格', count: { '木': 1, '火': 0, '土': 0, '金': 5, '水': 1 } as any })
      expect(result.applicable).toBe(true)
      // 金最旺，从金
      expect(result.scores['金']).toBeGreaterThan(0)
    })

    it('专旺格助旺泄秀', () => {
      const engine = new PatternEngine()
      const result = engine.evaluate({ ...baseInput, gejuCategory: '曲直仁寿格', count: { '木': 5, '火': 0, '土': 0, '金': 0, '水': 2 } as any })
      expect(result.applicable).toBe(true)
      expect(result.scores['木']).toBeGreaterThan(0)
      expect(result.scores['火']).toBeGreaterThan(0) // 泄秀
    })

    it('classicEvidence 引用子平真诠和滴天髓', () => {
      const engine = new PatternEngine()
      const result = engine.evaluate({ ...baseInput, gejuCategory: '从格' })
      const sources = result.classicEvidence.map(ce => ce.classicName)
      expect(sources).toContain('子平真诠')
      expect(sources).toContain('滴天髓')
    })
  })

  describe('ClimateEngine（调候）', () => {
    it('冬月用火暖', () => {
      const engine = new ClimateEngine()
      const result = engine.evaluate({ ...baseInput, isWinterBorn: true })
      expect(result.scores['火']).toBeGreaterThan(0)
      expect(result.scores['水']).toBeLessThan(0)
    })

    it('夏月用水凉', () => {
      const engine = new ClimateEngine()
      const result = engine.evaluate({ ...baseInput, isSummerBorn: true })
      expect(result.scores['水']).toBeGreaterThan(0)
      expect(result.scores['火']).toBeLessThan(0)
    })

    it('预设调候用神', () => {
      const engine = new ClimateEngine()
      const result = engine.evaluate({ ...baseInput, tiaohouShen: ['火', '土'] })
      expect(result.scores['火']).toBeGreaterThan(0)
      expect(result.scores['土']).toBeGreaterThan(0)
    })

    it('classicEvidence 引用穷通宝鉴', () => {
      const engine = new ClimateEngine()
      const result = engine.evaluate({ ...baseInput, isWinterBorn: true })
      const sources = result.classicEvidence.map(ce => ce.classicName)
      expect(sources).toContain('穷通宝鉴')
      expect(sources.filter(s => s === '穷通宝鉴').length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('BalanceEngine（扶抑）', () => {
    it('身强用克泄耗', () => {
      const engine = new BalanceEngine()
      const result = engine.evaluate({ ...baseInput, dayStrength: 2 })
      expect(result.applicable).toBe(true)
      // 甲木身强 → 官杀(金)为用
      expect(result.scores['金']).toBeGreaterThan(0)
      // 印星(水)为忌
      expect(result.scores['水']).toBeLessThan(0)
    })

    it('身弱用生扶', () => {
      const engine = new BalanceEngine()
      const result = engine.evaluate({ ...baseInput, dayStrength: -2 })
      expect(result.applicable).toBe(true)
      // 甲木身弱 → 印星(水)为用
      expect(result.scores['水']).toBeGreaterThan(0)
      // 官杀(金)为忌
      expect(result.scores['金']).toBeLessThan(0)
    })

    it('中和不强制', () => {
      const engine = new BalanceEngine()
      const result = engine.evaluate({ ...baseInput, dayStrength: 0 })
      expect(result.applicable).toBe(false)
    })

    it('classicEvidence 引用子平真诠和滴天髓', () => {
      const engine = new BalanceEngine()
      const result = engine.evaluate({ ...baseInput, dayStrength: 2 })
      const sources = result.classicEvidence.map(ce => ce.classicName)
      expect(sources).toContain('子平真诠')
      expect(sources).toContain('滴天髓')
    })
  })

  describe('统一 SubEngine 接口', () => {
    it('4 个引擎都实现了 SubEngine 接口', () => {
      const engines = [new StrengthEngine(), new PatternEngine(), new ClimateEngine(), new BalanceEngine()]
      for (const e of engines) {
        expect(e.name).toBeTruthy()
        expect(e.version).toBeTruthy()
        expect(typeof e.evaluate).toBe('function')
        const result = e.evaluate(baseInput)
        expect(result.engineName).toBe(e.name)
        expect(result.scores).toBeDefined()
        expect(result.evidence).toBeInstanceOf(Array)
        expect(result.classicEvidence).toBeInstanceOf(Array)
        expect(typeof result.confidence).toBe('number')
        expect(typeof result.weight).toBe('number')
        expect(typeof result.summary).toBe('string')
      }
    })
  })
})

describe('Sprint3-3 喜用神子引擎（病药/通关/寒暖燥湿）', () => {
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

  describe('MedicineEngine（病药）', () => {
    it('指定病神时确定药神', () => {
      const engine = new MedicineEngine()
      const result = engine.evaluate({ ...baseInput, diseaseWuxing: '金' })
      expect(result.applicable).toBe(true)
      // 病=金 → 克金者=火（正药）
      expect(result.scores['火']).toBe(2)
      // 泄金者=水（辅药）
      expect(result.scores['水']).toBe(1)
      // 病=金
      expect(result.scores['金']).toBe(-2)
    })

    it('未指定病神且有过旺五行时自动推断', () => {
      const engine = new MedicineEngine()
      const result = engine.evaluate({ ...baseInput, count: { '木': 1, '火': 0, '土': 0, '金': 5, '水': 1 } as any })
      expect(result.applicable).toBe(true)
      expect(result.scores['金']).toBe(-2) // 金为病
    })

    it('无过旺五行时不适用', () => {
      const engine = new MedicineEngine()
      const result = engine.evaluate({ ...baseInput, count: { '木': 2, '火': 1, '土': 1, '金': 1, '水': 1 } as any })
      expect(result.applicable).toBe(false)
    })

    it('classicEvidence 引用三命通会和子平真诠', () => {
      const engine = new MedicineEngine()
      const result = engine.evaluate({ ...baseInput, diseaseWuxing: '金' })
      const sources = result.classicEvidence.map(ce => ce.classicName)
      expect(sources).toContain('三命通会')
      expect(sources).toContain('子平真诠')
    })
  })

  describe('BridgeEngine（通关）', () => {
    it('金木相战取水通关', () => {
      const engine = new BridgeEngine()
      const result = engine.evaluate({ ...baseInput, conflictingPairs: [['金', '木']] as any })
      expect(result.applicable).toBe(true)
      // 金克木 → 通关=水（金生水→水生木）
      expect(result.scores['水']).toBe(2)
    })

    it('水火相战取木通关', () => {
      const engine = new BridgeEngine()
      const result = engine.evaluate({ ...baseInput, conflictingPairs: [['水', '火']] as any })
      expect(result.applicable).toBe(true)
      // 水克火 → 通关=木（水生木→木生火）
      expect(result.scores['木']).toBe(2)
    })

    it('无相战时不适用', () => {
      const engine = new BridgeEngine()
      const result = engine.evaluate({ ...baseInput })
      expect(result.applicable).toBe(false)
    })

    it('classicEvidence 引用滴天髓', () => {
      const engine = new BridgeEngine()
      const result = engine.evaluate({ ...baseInput, conflictingPairs: [['金', '木']] as any })
      const sources = result.classicEvidence.map(ce => ce.classicName)
      expect(sources).toContain('滴天髓')
    })
  })

  describe('SeasonEngine（寒暖燥湿）', () => {
    it('冬月过寒需火暖', () => {
      const engine = new SeasonEngine()
      const result = engine.evaluate({ ...baseInput, isWinterBorn: true })
      expect(result.applicable).toBe(true)
      expect(result.scores['火']).toBeGreaterThan(0)
    })

    it('夏月过暖需水寒', () => {
      const engine = new SeasonEngine()
      const result = engine.evaluate({ ...baseInput, isSummerBorn: true })
      expect(result.applicable).toBe(true)
      expect(result.scores['水']).toBeGreaterThan(0)
    })

    it('过燥需水润', () => {
      const engine = new SeasonEngine()
      const result = engine.evaluate({ ...baseInput, isDrySeason: true })
      expect(result.applicable).toBe(true)
      expect(result.scores['水']).toBeGreaterThan(0)
    })

    it('过湿需土燥', () => {
      const engine = new SeasonEngine()
      const result = engine.evaluate({ ...baseInput, isWetSeason: true })
      expect(result.applicable).toBe(true)
      expect(result.scores['土']).toBeGreaterThan(0)
    })

    it('寒暖燥湿均适中时不适用', () => {
      const engine = new SeasonEngine()
      const result = engine.evaluate({ ...baseInput })
      expect(result.applicable).toBe(false)
    })

    it('classicEvidence 引用穷通宝鉴', () => {
      const engine = new SeasonEngine()
      const result = engine.evaluate({ ...baseInput, isWinterBorn: true })
      const sources = result.classicEvidence.map(ce => ce.classicName)
      expect(sources).toContain('穷通宝鉴')
    })
  })

  describe('统一 SubEngine 接口（全部7个引擎）', () => {
    it('7 个引擎都实现 SubEngine 接口', () => {
      // StrengthEngine/PatternEngine/ClimateEngine/BalanceEngine 已在文件顶部 ESM 导入
      const engines = [
        new StrengthEngine(), new PatternEngine(), new ClimateEngine(), new BalanceEngine(),
        new MedicineEngine(), new BridgeEngine(), new SeasonEngine(),
      ]
      for (const e of engines) {
        expect(e.name).toBeTruthy()
        expect(e.version).toBeTruthy()
        expect(typeof e.evaluate).toBe('function')
        const result = e.evaluate(baseInput)
        expect(result.engineName).toBe(e.name)
        expect(result.scores).toBeDefined()
        expect(result.evidence).toBeInstanceOf(Array)
        expect(typeof result.confidence).toBe('number')
        expect(typeof result.weight).toBe('number')
        expect(typeof result.summary).toBe('string')
      }
    })
  })
})
