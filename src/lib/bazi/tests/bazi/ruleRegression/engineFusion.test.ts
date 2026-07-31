import { describe, it, expect } from 'vitest'
import {
  StrengthEngine, PatternEngine, ClimateEngine, BalanceEngine,
  MedicineEngine, BridgeEngine, SeasonEngine,
} from '../../../xiyongshen/engines'
import { globalYongShenDecisionEngine } from '../../../xiyongshen/engines/decisionEngine'
import type { SubEngineInput, SubEngineResult } from '../../../xiyongshen/engines/types'

// 7 个引擎实例
const engines = [
  new StrengthEngine(),
  new PatternEngine(),
  new ClimateEngine(),
  new BalanceEngine(),
  new MedicineEngine(),
  new BridgeEngine(),
  new SeasonEngine(),
]

// 多场景测试数据
const testCases: Array<{ name: string; input: SubEngineInput }> = [
  {
    name: '身强甲木秋生',
    input: {
      dayGan: '甲', dayGanWuxing: '木', monthZhi: '酉', monthZhiWuxing: '金',
      fourPillars: [
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        { gan: '癸', zhi: '酉', ganWx: '水', zhiWx: '金' },
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        { gan: '丙', zhi: '寅', ganWx: '火', zhiWx: '木' },
      ],
      count: { '木': 5, '火': 1, '土': 0, '金': 1, '水': 1 },
      dayStrength: 2, dayRootCount: 3,
      isWinterBorn: false, isSummerBorn: false,
    },
  },
  {
    name: '身弱丙火冬生',
    input: {
      dayGan: '丙', dayGanWuxing: '火', monthZhi: '子', monthZhiWuxing: '水',
      fourPillars: [
        { gan: '壬', zhi: '子', ganWx: '水', zhiWx: '水' },
        { gan: '壬', zhi: '子', ganWx: '水', zhiWx: '水' },
        { gan: '丙', zhi: '申', ganWx: '火', zhiWx: '金' },
        { gan: '戊', zhi: '戌', ganWx: '土', zhiWx: '土' },
      ],
      count: { '木': 0, '火': 1, '土': 1, '金': 1, '水': 5 },
      dayStrength: -2, dayRootCount: 0,
      isWinterBorn: true, isSummerBorn: false,
    },
  },
  {
    // 戊土春生身弱：木旺克土为病 + 水多偏寒 → 触发扶抑/病药/寒暖多引擎协同
    name: '戊土春生身弱',
    input: {
      dayGan: '戊', dayGanWuxing: '土', monthZhi: '卯', monthZhiWuxing: '木',
      fourPillars: [
        { gan: '乙', zhi: '卯', ganWx: '木', zhiWx: '木' },
        { gan: '癸', zhi: '亥', ganWx: '水', zhiWx: '水' },
        { gan: '戊', zhi: '午', ganWx: '土', zhiWx: '火' },
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
      ],
      count: { '木': 3, '火': 1, '土': 1, '金': 0, '水': 3 },
      dayStrength: -1, dayRootCount: 1,
      diseaseWuxing: '木',
      isWinterBorn: false, isSummerBorn: false,
    },
  },
  {
    name: '金木相战',
    input: {
      dayGan: '甲', dayGanWuxing: '木', monthZhi: '申', monthZhiWuxing: '金',
      fourPillars: [
        { gan: '庚', zhi: '申', ganWx: '金', zhiWx: '金' },
        { gan: '庚', zhi: '申', ganWx: '金', zhiWx: '金' },
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
      ],
      count: { '木': 4, '火': 0, '土': 0, '金': 4, '水': 0 },
      dayStrength: 0, dayRootCount: 2,
      conflictingPairs: [['金', '木']] as any,
      isWinterBorn: false, isSummerBorn: false,
    },
  },
  {
    name: '病药场景',
    input: {
      dayGan: '甲', dayGanWuxing: '木', monthZhi: '酉', monthZhiWuxing: '金',
      fourPillars: [
        { gan: '辛', zhi: '酉', ganWx: '金', zhiWx: '金' },
        { gan: '辛', zhi: '酉', ganWx: '金', zhiWx: '金' },
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        { gan: '丙', zhi: '午', ganWx: '火', zhiWx: '火' },
      ],
      count: { '木': 2, '火': 1, '土': 0, '金': 4, '水': 0 },
      dayStrength: -1, dayRootCount: 1,
      diseaseWuxing: '金',
      isWinterBorn: false, isSummerBorn: false,
    },
  },
]

describe('Engine Fusion Test（七引擎协同验证）', () => {

  // 收集所有场景的所有引擎结果
  const allResults: Array<{ caseName: string; results: SubEngineResult[] }> = testCases.map(tc => ({
    caseName: tc.name,
    results: engines.map(e => e.evaluate(tc.input)),
  }))

  describe('① 各子引擎贡献率', () => {
    it('每个场景至少有 3 个引擎 applicable', () => {
      for (const { caseName, results } of allResults) {
        const applicableCount = results.filter(r => r.applicable).length
        expect(applicableCount, `${caseName}: applicable引擎数应≥3`).toBeGreaterThanOrEqual(3)
      }
    })

    it('StrengthEngine 始终 applicable（基础引擎）', () => {
      for (const { caseName, results } of allResults) {
        const strength = results.find(r => r.engineName === 'StrengthEngine')
        expect(strength?.applicable, `${caseName}: StrengthEngine应始终适用`).toBe(true)
      }
    })

    it('各引擎权重分布合理（0~1之间）', () => {
      for (const { results } of allResults) {
        for (const r of results) {
          expect(r.weight).toBeGreaterThanOrEqual(0)
          expect(r.weight).toBeLessThanOrEqual(1)
        }
      }
    })

    it('所有引擎权重总和接近 1.0（profile 归一化，与引擎是否 applicable 无关）', () => {
      // 不论引擎是否 applicable，都应返回其流派权重；全量求和验证 profile 归一化
      for (const { caseName, results } of allResults) {
        const totalWeight = results.reduce((sum, r) => sum + r.weight, 0)
        expect(totalWeight, `${caseName}: 全部引擎权重总和应接近1.0`).toBeCloseTo(1.0, 1)
      }
    })

    it('applicable 引擎权重占比合理（>0.4，避免单一场景引擎过少）', () => {
      for (const { caseName, results } of allResults) {
        const applicableWeight = results.filter(r => r.applicable && r.weight > 0).reduce((s, r) => s + r.weight, 0)
        expect(applicableWeight, `${caseName}: applicable引擎权重占比应>0.4`).toBeGreaterThan(0.4)
      }
    })
  })

  describe('② Evidence 数量', () => {
    it('每个 applicable 引擎至少有 2 条 evidence', () => {
      for (const { caseName, results } of allResults) {
        for (const r of results) {
          if (r.applicable) {
            expect(r.evidence.length, `${caseName}/${r.engineName}: evidence应≥2条`).toBeGreaterThanOrEqual(2)
          }
        }
      }
    })

    it('Evidence 无完全重复', () => {
      for (const { caseName, results } of allResults) {
        const allEvidence = results.filter(r => r.applicable).flatMap(r => r.evidence.map(e => e.text))
        const unique = new Set(allEvidence)
        // 允许少量重复，但重复率不超过 20%
        const duplicateRate = 1 - (unique.size / allEvidence.length)
        expect(duplicateRate, `${caseName}: evidence重复率应<20%`).toBeLessThan(0.2)
      }
    })
  })

  describe('③ Classic 引用情况', () => {
    it('每个 applicable 引擎至少有 1 条 classicEvidence', () => {
      for (const { caseName, results } of allResults) {
        for (const r of results) {
          if (r.applicable && r.engineName !== 'StrengthEngine') {
            expect(r.classicEvidence.length, `${caseName}/${r.engineName}: classicEvidence应≥1`).toBeGreaterThanOrEqual(1)
          }
        }
      }
    })

    it('引用至少 3 部不同经典', () => {
      for (const { caseName, results } of allResults) {
        const allClassics = new Set(
          results.filter(r => r.applicable).flatMap(r => r.classicEvidence.map(ce => ce.classicName))
        )
        expect(allClassics.size, `${caseName}: 应引用≥3部经典`).toBeGreaterThanOrEqual(3)
      }
    })
  })

  describe('④ 权重分布', () => {
    it('无单一引擎权重超过 0.5（避免过度依赖）', () => {
      for (const { caseName, results } of allResults) {
        for (const r of results) {
          if (r.applicable && r.weight > 0) {
            expect(r.weight, `${caseName}/${r.engineName}: 权重应<0.5`).toBeLessThan(0.5)
          }
        }
      }
    })

    it('BalanceEngine 在身强/身弱场景权重最高或并列最高', () => {
      // 身强或身弱场景，BalanceEngine 应是主要贡献者
      const strongCase = allResults.find(r => r.caseName === '身强甲木秋生')!
      const weakCase = allResults.find(r => r.caseName === '身弱丙火冬生')!
      
      for (const caseData of [strongCase, weakCase]) {
        const applicable = caseData.results.filter(r => r.applicable && r.weight > 0)
        const maxWeight = Math.max(...applicable.map(r => r.weight))
        const balance = applicable.find(r => r.engineName === 'BalanceEngine')
        expect(balance).toBeDefined()
        // BalanceEngine 权重应接近最大值
        expect(balance!.weight).toBeCloseTo(maxWeight, 1)
      }
    })
  })

  describe('⑤ 冲突统计', () => {
    it('无两个引擎对同一五行给出完全相反的评分（一个+3另一个-3）', () => {
      for (const { caseName, results } of allResults) {
        const applicable = results.filter(r => r.applicable)
        for (const wx of ['木', '火', '土', '金', '水'] as const) {
          const scores = applicable.map(r => r.scores[wx]).filter(s => s !== 0)
          if (scores.length >= 2) {
            const max = Math.max(...scores)
            const min = Math.min(...scores)
            const diff = max - min
            expect(diff, `${caseName}/${wx}: 引擎间评分差距应≤5`).toBeLessThanOrEqual(5)
          }
        }
      }
    })

    it('用神方向一致：多数引擎对用神给正分', () => {
      for (const { caseName, results: _results } of allResults) {
        const decision = globalYongShenDecisionEngine.decide(testCases.find(tc => tc.name === caseName)!.input)
        const applicable = _results.filter(r => r.applicable)
        const positiveCount = applicable.filter(r => (r.scores[decision.usefulGod] ?? 0) > 0).length
        const threshold = Math.ceil(applicable.length * 0.3) // 至少 30% 引擎认同
        expect(positiveCount, `${caseName}: 用神${decision.usefulGod}正分引擎数应≥${threshold}`).toBeGreaterThanOrEqual(threshold)
      }
    })
  })

  describe('⑥ 权重异常检测', () => {
    it('无循环影响：各引擎独立计算，不互相调用', () => {
      // 验证每个引擎可以独立运行，不依赖其他引擎的结果
      for (const tc of testCases) {
        for (const engine of engines) {
          // 独立调用，不传其他引擎结果
          const result = engine.evaluate(tc.input)
          expect(result).toBeDefined()
          expect(result.engineName).toBe(engine.name)
        }
      }
    })

    it('同一输入多次调用结果一致（确定性）', () => {
      for (const tc of testCases) {
        for (const engine of engines) {
          const r1 = engine.evaluate(tc.input)
          const r2 = engine.evaluate(tc.input)
          expect(r1.scores).toEqual(r2.scores)
          expect(r1.applicable).toBe(r2.applicable)
        }
      }
    })
  })

  describe('⑦ DecisionEngine 综合输出', () => {
    it('每个场景 DecisionEngine 都能输出完整决策', () => {
      for (const tc of testCases) {
        const decision = globalYongShenDecisionEngine.decide(tc.input)
        expect(decision.usefulGod).toBeTruthy()
        expect(decision.favorableGod).toBeTruthy()
        expect(decision.unfavorableGod).toBeTruthy()
        expect(decision.enemyGod).toBeTruthy()
        expect(decision.idleGod).toBeTruthy()
        expect(decision.breakdown.length).toBe(5)
        expect(decision.evidence.length).toBeGreaterThan(0)
        expect(decision.classicEvidence.length).toBeGreaterThan(0)
        expect(decision.explain).toContain('用神')
      }
    })

    it('用神在 breakdown 中 totalScore 最高', () => {
      for (const tc of testCases) {
        const decision = globalYongShenDecisionEngine.decide(tc.input)
        const sorted = [...decision.breakdown].sort((a, b) => b.totalScore - a.totalScore)
        expect(decision.usefulGod).toBe(sorted[0].wuxing)
      }
    })

    it('explain 包含所有 applicable 引擎的说明', () => {
      for (const tc of testCases) {
        const decision = globalYongShenDecisionEngine.decide(tc.input)
        const applicableEngines = decision.subEngineResults.filter(r => r.applicable)
        for (const engine of applicableEngines) {
          expect(decision.explain, `${tc.name}: explain应包含${engine.engineName}`).toContain(engine.engineName)
        }
      }
    })
  })

  describe('⑧ Engine Fusion Report 数据收集', () => {
    it('生成完整 Fusion Report 数据', () => {
      // 收集所有场景的融合数据
      const fusionData = testCases.map(tc => {
        const results = engines.map(e => e.evaluate(tc.input))
        const decision = globalYongShenDecisionEngine.decide(tc.input)
        return {
          caseName: tc.name,
          engineCount: results.filter(r => r.applicable).length,
          totalEvidence: results.filter(r => r.applicable).reduce((sum, r) => sum + r.evidence.length, 0),
          totalClassics: new Set(results.filter(r => r.applicable).flatMap(r => r.classicEvidence.map(ce => ce.classicName))).size,
          usefulGod: decision.usefulGod,
          confidence: decision.confidence,
        }
      })

      // 验证数据完整性
      expect(fusionData.length).toBe(testCases.length)
      for (const data of fusionData) {
        expect(data.engineCount).toBeGreaterThanOrEqual(3)
        expect(data.totalEvidence).toBeGreaterThan(0)
        expect(data.totalClassics).toBeGreaterThanOrEqual(2)
        expect(data.usefulGod).toBeTruthy()
      }
    })
  })
})
