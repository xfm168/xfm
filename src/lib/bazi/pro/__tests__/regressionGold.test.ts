/**
 * Regression Gold Engine 测试套件
 *
 * 覆盖：
 *   - 版本号与常量
 *   - 单命例层级分配（Gold / Silver / Bronze / None）
 *   - 专家一致率与 consensusScore
 *   - evaluateGoldCase 报告
 *   - 批量分配
 *   - 筛选函数
 *   - Gold 一致性验证
 *   - 汇总统计
 */

import { describe, test, expect } from 'vitest'
import type { CaseEntryV2, CaseCategoryV2, ExpertOpinionV2 } from '../caseLibraryTypesV2'
import {
  GOLD_TIER_CRITERIA,
  SILVER_TIER_CRITERIA,
  BRONZE_TIER_CRITERIA,
} from '../regressionGoldTypes'
import type { GoldTierCriteria } from '../regressionGoldTypes'
import {
  REGRESSION_GOLD_VERSION,
  assignRegressionTier,
  evaluateGoldCase,
  batchAssignTiers,
  getGoldCases,
  getSilverCases,
  getBronzeCases,
  validateGoldConsistency,
  getRegressionGoldSummary,
} from '../regressionGoldEngine'

// ─── 测试辅助：创建最小可用 v2 命例 ───
function makeCaseV2(
  caseId: string,
  category: CaseCategoryV2,
  overrides?: Partial<CaseEntryV2>,
): CaseEntryV2 {
  const base: CaseEntryV2 = {
    caseId,
    category,
    yearGan: '甲',
    yearZhi: '子',
    monthGan: '丙',
    monthZhi: '寅',
    dayGan: '甲',
    dayZhi: '子',
    hourGan: '甲',
    hourZhi: '子',
    gender: 'male',
    expectedResult: { dayMasterElement: '木' },
    qualityScore: 75,
    starRating: 4,
    confidence: 0.85,
    excludeFromLearning: false,
    verifiedBy: [],
    reviewStatus: 'approved',
    source: 'test-source',
    evidence: [],
    referenceBooks: [],
    tags: [],
    keywords: [],
    expertOpinions: [],
    conflicts: [],
    regressionTier: 'none',
    version: 1,
    history: [],
    changeLog: [],
    reliability: 70,
    reliabilityDimensions: {
      dataCompleteness: 80,
      sourceCredibility: 80,
      expertCount: 0,
      consensusRate: 0,
      citationCount: 0,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  return { ...base, ...overrides }
}

function makeOpinion(overrides?: Partial<ExpertOpinionV2>): ExpertOpinionV2 {
  return {
    opinionId: 'op-1',
    expertId: 'exp-1',
    expertName: 'Test Expert',
    conclusion: 'Conclusion A',
    verdict: 'agree',
    consistencyRate: 1,
    score: 80,
    validatedAt: Date.now(),
    classicalBasis: 'Basis',
    affectedRules: [],
    ...overrides,
  }
}

// ═══════════════════════════════════════════
// 1. 版本号与常量
// ═══════════════════════════════════════════

describe('Regression Gold Engine', () => {
  describe('1. 版本号与常量', () => {
    test('版本号应为 1.0.0', () => {
      expect(REGRESSION_GOLD_VERSION).toBe('1.0.0')
    })

    test('GOLD_TIER_CRITERIA 各字段正确', () => {
      expect(GOLD_TIER_CRITERIA.minQualityScore).toBe(85)
      expect(GOLD_TIER_CRITERIA.minStarRating).toBe(4)
      expect(GOLD_TIER_CRITERIA.minReliability).toBe(80)
      expect(GOLD_TIER_CRITERIA.requiredExpertOpinions).toBe(3)
      expect(GOLD_TIER_CRITERIA.requiredConsistencyRate).toBe(0.85)
    })

    test('SILVER_TIER_CRITERIA 各字段正确', () => {
      expect(SILVER_TIER_CRITERIA.minQualityScore).toBe(70)
      expect(SILVER_TIER_CRITERIA.minStarRating).toBe(3)
      expect(SILVER_TIER_CRITERIA.minReliability).toBe(60)
      expect(SILVER_TIER_CRITERIA.requiredExpertOpinions).toBe(1)
      expect(SILVER_TIER_CRITERIA.requiredConsistencyRate).toBe(0.70)
    })

    test('BRONZE_TIER_CRITERIA 各字段正确', () => {
      expect(BRONZE_TIER_CRITERIA.minQualityScore).toBe(50)
      expect(BRONZE_TIER_CRITERIA.minStarRating).toBe(2)
      expect(BRONZE_TIER_CRITERIA.minReliability).toBe(40)
      expect(BRONZE_TIER_CRITERIA.requiredExpertOpinions).toBe(0)
      expect(BRONZE_TIER_CRITERIA.requiredConsistencyRate).toBe(0.50)
    })
  })

  // ═══════════════════════════════════════════
  // 2. 单命例层级分配
  // ═══════════════════════════════════════════

  describe('2. 单命例层级分配', () => {
    test('满足全部 Gold 标准时分配 gold', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        qualityScore: 90,
        starRating: 5,
        reliability: 85,
        expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()],
        consensusScore: 0.9,
      })
      expect(assignRegressionTier(entry)).toBe('gold')
    })

    test('qualityScore 低于 Gold 但满足 Silver 时分配 silver', () => {
      const entry = makeCaseV2('TEST-002', 'classic', {
        qualityScore: 75,
        starRating: 4,
        reliability: 70,
        expertOpinions: [makeOpinion()],
        consensusScore: 0.75,
      })
      expect(assignRegressionTier(entry)).toBe('silver')
    })

    test('不满足 Silver 但满足 Bronze 时分配 bronze', () => {
      const entry = makeCaseV2('TEST-003', 'classic', {
        qualityScore: 55,
        starRating: 2,
        reliability: 45,
        expertOpinions: [],
        consensusScore: 0.55,
      })
      expect(assignRegressionTier(entry)).toBe('bronze')
    })

    test('不满足 Bronze 时分配 none', () => {
      const entry = makeCaseV2('TEST-004', 'classic', {
        qualityScore: 30,
        starRating: 1,
        reliability: 20,
        expertOpinions: [],
        consensusScore: 0.2,
      })
      expect(assignRegressionTier(entry)).toBe('none')
    })

    test('Gold 边界值：刚好满足时分配 gold', () => {
      const entry = makeCaseV2('TEST-005', 'classic', {
        qualityScore: 85,
        starRating: 4,
        reliability: 80,
        expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()],
        consensusScore: 0.85,
      })
      expect(assignRegressionTier(entry)).toBe('gold')
    })

    test('Gold 边界值：qualityScore 差 1 分配 silver', () => {
      const entry = makeCaseV2('TEST-006', 'classic', {
        qualityScore: 84,
        starRating: 4,
        reliability: 80,
        expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()],
        consensusScore: 0.85,
      })
      expect(assignRegressionTier(entry)).toBe('silver')
    })

    test('无 consensusScore 时回退到专家 agree 比例', () => {
      const entry = makeCaseV2('TEST-007', 'classic', {
        qualityScore: 90,
        starRating: 5,
        reliability: 85,
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
        ],
        consensusScore: undefined,
      })
      expect(assignRegressionTier(entry)).toBe('gold')
    })

    test('专家一致率不足时降级', () => {
      const entry = makeCaseV2('TEST-008', 'classic', {
        qualityScore: 90,
        starRating: 5,
        reliability: 85,
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'disagree' }),
        ],
        consensusScore: undefined,
      })
      // 3/4 = 0.75 >= Silver(0.70) 但 < Gold(0.85)，应降级为 silver
      expect(assignRegressionTier(entry)).toBe('silver')
    })
  })

  // ═══════════════════════════════════════════
  // 3. evaluateGoldCase 报告
  // ═══════════════════════════════════════════

  describe('3. evaluateGoldCase 报告', () => {
    test('Gold 报告 meetsCriteria 为 true', () => {
      const entry = makeCaseV2('TEST-009', 'classic', {
        qualityScore: 90,
        starRating: 5,
        reliability: 85,
        expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()],
        consensusScore: 0.9,
      })
      const report = evaluateGoldCase(entry)
      expect(report.caseId).toBe('TEST-009')
      expect(report.assignedTier).toBe('gold')
      expect(report.meetsCriteria).toBe(true)
      expect(report.failedCriteria).toHaveLength(0)
    })

    test('None 报告包含失败原因', () => {
      const entry = makeCaseV2('TEST-010', 'classic', {
        qualityScore: 30,
        starRating: 1,
        reliability: 20,
        expertOpinions: [],
        consensusScore: 0.1,
      })
      const report = evaluateGoldCase(entry)
      expect(report.assignedTier).toBe('none')
      expect(report.meetsCriteria).toBe(false)
      expect(report.failedCriteria.length).toBeGreaterThan(0)
    })

    test('report score 在合理范围', () => {
      const entry = makeCaseV2('TEST-011', 'classic', {
        qualityScore: 80,
        starRating: 4,
        reliability: 80,
        expertOpinions: [makeOpinion(), makeOpinion()],
        consensusScore: 0.8,
      })
      const report = evaluateGoldCase(entry)
      expect(report.score).toBeGreaterThanOrEqual(0)
      expect(report.score).toBeLessThanOrEqual(100)
    })

    test('report score 随 qualityScore 上升而上升', () => {
      const entry1 = makeCaseV2('TEST-012a', 'classic', {
        qualityScore: 60,
        starRating: 3,
        reliability: 60,
        expertOpinions: [makeOpinion()],
        consensusScore: 0.7,
      })
      const entry2 = makeCaseV2('TEST-012b', 'classic', {
        qualityScore: 95,
        starRating: 5,
        reliability: 95,
        expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()],
        consensusScore: 0.95,
      })
      const r1 = evaluateGoldCase(entry1)
      const r2 = evaluateGoldCase(entry2)
      expect(r2.score).toBeGreaterThan(r1.score)
    })
  })

  // ═══════════════════════════════════════════
  // 4. 批量分配
  // ═══════════════════════════════════════════

  describe('4. 批量分配', () => {
    test('batchAssignTiers 返回与输入数量相同的结果', () => {
      const cases = [
        makeCaseV2('TEST-013', 'classic', { qualityScore: 90, starRating: 5, reliability: 85, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.9 }),
        makeCaseV2('TEST-014', 'classic', { qualityScore: 55, starRating: 2, reliability: 45, expertOpinions: [], consensusScore: 0.55 }),
        makeCaseV2('TEST-015', 'classic', { qualityScore: 30, starRating: 1, reliability: 20, expertOpinions: [], consensusScore: 0.2 }),
      ]
      const results = batchAssignTiers(cases)
      expect(results).toHaveLength(3)
      expect(results[0].tier).toBe('gold')
      expect(results[1].tier).toBe('bronze')
      expect(results[2].tier).toBe('none')
    })

    test('batchAssignTiers 空数组返回空数组', () => {
      expect(batchAssignTiers([])).toEqual([])
    })
  })

  // ═══════════════════════════════════════════
  // 5. 筛选函数
  // ═══════════════════════════════════════════

  describe('5. 筛选函数', () => {
    const cases = [
      makeCaseV2('G-001', 'classic', { qualityScore: 95, starRating: 5, reliability: 90, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.9 }),
      makeCaseV2('G-002', 'classic', { qualityScore: 88, starRating: 4, reliability: 82, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.88 }),
      makeCaseV2('S-001', 'classic', { qualityScore: 72, starRating: 3, reliability: 65, expertOpinions: [makeOpinion()], consensusScore: 0.72 }),
      makeCaseV2('B-001', 'classic', { qualityScore: 55, starRating: 2, reliability: 50, expertOpinions: [], consensusScore: 0.6 }),
      makeCaseV2('N-001', 'classic', { qualityScore: 20, starRating: 1, reliability: 10, expertOpinions: [], consensusScore: 0.1 }),
    ]

    test('getGoldCases 只返回 gold', () => {
      const gold = getGoldCases(cases)
      expect(gold.length).toBe(2)
      expect(gold.every((c) => assignRegressionTier(c) === 'gold')).toBe(true)
    })

    test('getSilverCases 只返回 silver', () => {
      const silver = getSilverCases(cases)
      expect(silver.length).toBe(1)
      expect(silver[0].caseId).toBe('S-001')
    })

    test('getBronzeCases 只返回 bronze', () => {
      const bronze = getBronzeCases(cases)
      expect(bronze.length).toBe(1)
      expect(bronze[0].caseId).toBe('B-001')
    })

    test('筛选函数对空数组返回空数组', () => {
      expect(getGoldCases([])).toEqual([])
      expect(getSilverCases([])).toEqual([])
      expect(getBronzeCases([])).toEqual([])
    })
  })

  // ═══════════════════════════════════════════
  // 6. Gold 一致性验证
  // ═══════════════════════════════════════════

  describe('6. Gold 一致性验证', () => {
    test('结果一致时返回 true', () => {
      const goldCases = [
        makeCaseV2('G-003', 'classic', { qualityScore: 90, starRating: 5, reliability: 85, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.9 }),
        makeCaseV2('G-004', 'classic', { qualityScore: 92, starRating: 5, reliability: 88, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.92 }),
      ]
      const engineFn = (_entry: CaseEntryV2) => ({ status: 'ok' })
      expect(validateGoldConsistency(goldCases, engineFn)).toBe(true)
    })

    test('结果不一致时返回 false', () => {
      const goldCases = [
        makeCaseV2('G-005', 'classic', { qualityScore: 90, starRating: 5, reliability: 85, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.9 }),
        makeCaseV2('G-006', 'classic', { qualityScore: 92, starRating: 5, reliability: 88, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.92 }),
      ]
      let callCount = 0
      const engineFn = () => {
        callCount++
        return { status: callCount === 1 ? 'ok' : 'fail' }
      }
      expect(validateGoldConsistency(goldCases, engineFn)).toBe(false)
    })

    test('空数组返回 true', () => {
      expect(validateGoldConsistency([], () => 'x')).toBe(true)
    })

    test('单元素数组返回 true', () => {
      const cases = [makeCaseV2('G-007', 'classic', { qualityScore: 90, starRating: 5, reliability: 85, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.9 })]
      expect(validateGoldConsistency(cases, () => 'ok')).toBe(true)
    })
  })

  // ═══════════════════════════════════════════
  // 7. 汇总统计
  // ═══════════════════════════════════════════

  describe('7. 汇总统计', () => {
    test('getRegressionGoldSummary 统计正确', () => {
      const cases = [
        makeCaseV2('G-008', 'classic', { qualityScore: 95, starRating: 5, reliability: 90, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.9 }),
        makeCaseV2('S-002', 'classic', { qualityScore: 75, starRating: 4, reliability: 70, expertOpinions: [makeOpinion()], consensusScore: 0.75 }),
        makeCaseV2('B-002', 'classic', { qualityScore: 55, starRating: 2, reliability: 50, expertOpinions: [], consensusScore: 0.6 }),
        makeCaseV2('N-002', 'classic', { qualityScore: 20, starRating: 1, reliability: 10, expertOpinions: [], consensusScore: 0.1 }),
      ]
      const summary = getRegressionGoldSummary(cases)
      expect(summary.total).toBe(4)
      expect(summary.goldCount).toBe(1)
      expect(summary.silverCount).toBe(1)
      expect(summary.bronzeCount).toBe(1)
      expect(summary.noneCount).toBe(1)
      expect(summary.avgQuality).toBe(Math.round((95 + 75 + 55 + 20) / 4))
      expect(summary.avgReliability).toBe(Math.round((90 + 70 + 50 + 10) / 4))
    })

    test('getRegressionGoldSummary 空数组返回零值', () => {
      const summary = getRegressionGoldSummary([])
      expect(summary.total).toBe(0)
      expect(summary.goldCount).toBe(0)
      expect(summary.avgQuality).toBe(0)
      expect(summary.avgReliability).toBe(0)
    })

    test('getRegressionGoldSummary 计数之和等于总数', () => {
      const cases = [
        makeCaseV2('A-001', 'classic', { qualityScore: 95, starRating: 5, reliability: 90, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.9 }),
        makeCaseV2('A-002', 'classic', { qualityScore: 20, starRating: 1, reliability: 10, expertOpinions: [], consensusScore: 0.1 }),
        makeCaseV2('A-003', 'classic', { qualityScore: 55, starRating: 2, reliability: 50, expertOpinions: [], consensusScore: 0.6 }),
      ]
      const summary = getRegressionGoldSummary(cases)
      expect(summary.goldCount + summary.silverCount + summary.bronzeCount + summary.noneCount).toBe(summary.total)
    })
  })
})
