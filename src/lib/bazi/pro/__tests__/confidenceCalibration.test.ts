/**
 * Confidence Calibration Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - 各维度提取
 *   - 加权总分计算
 *   - 等级映射
 *   - 维度描述生成
 *   - 批量校准
 *   - 等级筛选
 *   - 分布统计
 *   - 排序
 *   - 趋势分析
 *   - 比较
 *   - 自定义权重和阈值
 */

import { describe, test, expect, beforeEach } from 'vitest'
import type { CaseEntryV2, CaseCategoryV2 } from '../caseLibraryTypesV2'
import {
  CONFIDENCE_CALIBRATION_VERSION,
  calibrateTrustScore,
  batchCalibrateTrust,
  filterByTrustLevel,
  getTrustDistribution,
  getTopTrustedCases,
  getTrustTrend,
  compareTrust,
} from '../confidenceCalibrationEngine'
import { DEFAULT_TRUST_WEIGHTS, TRUST_LEVEL_THRESHOLDS } from '../confidenceCalibrationTypes'
import type { TrustLevel, CalibrationOptions } from '../confidenceCalibrationTypes'

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
      expertCount: 2,
      consensusRate: 80,
      citationCount: 2,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  return { ...base, ...overrides }
}

// ─── 测试辅助：创建高信任命例 ───
function makeHighTrustCase(caseId: string): CaseEntryV2 {
  return makeCaseV2(caseId, 'classic', {
    confidence: 0.95,
    reliability: 90,
    evidence: [
      { type: 'classical_text', content: 'test', source: '三命通会', confidence: 0.95 },
      { type: 'classical_text', content: 'test2', source: '滴天髓', confidence: 0.93 },
      { type: 'expert_opinion', content: 'test3', source: 'expert', confidence: 0.90 },
    ],
    consensusScore: 95,
    regressionTier: 'gold',
    reviewStatus: 'approved',
  })
}

// ─── 测试辅助：创建低信任命例 ───
function makeLowTrustCase(caseId: string): CaseEntryV2 {
  return makeCaseV2(caseId, 'anonymous', {
    confidence: 0.1,
    reliability: 5,
    evidence: [],
    consensusScore: 0,
    regressionTier: 'none',
    reviewStatus: 'pending',
  })
}

describe('confidenceCalibrationEngine', () => {
  // ─── 1. 版本号 ───
  test('版本号应为 1.0.0', () => {
    expect(CONFIDENCE_CALIBRATION_VERSION).toBe('1.0.0')
  })

  // ─── 2. 默认权重和阈值常量 ───
  test('DEFAULT_TRUST_WEIGHTS 五个维度权重之和为 1', () => {
    const sum = Object.values(DEFAULT_TRUST_WEIGHTS).reduce((s, w) => s + w, 0)
    expect(sum).toBe(1)
  })

  test('DEFAULT_TRUST_WEIGHTS 的 expertConsensus 权重最大', () => {
    expect(DEFAULT_TRUST_WEIGHTS.expertConsensus).toBe(0.30)
    expect(DEFAULT_TRUST_WEIGHTS.expertConsensus).toBeGreaterThan(DEFAULT_TRUST_WEIGHTS.confidence)
    expect(DEFAULT_TRUST_WEIGHTS.expertConsensus).toBeGreaterThan(DEFAULT_TRUST_WEIGHTS.evidenceScore)
  })

  test('TRUST_LEVEL_THRESHOLDS 阈值递减', () => {
    expect(TRUST_LEVEL_THRESHOLDS.highly_trusted).toBeGreaterThan(TRUST_LEVEL_THRESHOLDS.trusted)
    expect(TRUST_LEVEL_THRESHOLDS.trusted).toBeGreaterThan(TRUST_LEVEL_THRESHOLDS.moderate)
    expect(TRUST_LEVEL_THRESHOLDS.moderate).toBeGreaterThan(TRUST_LEVEL_THRESHOLDS.low)
    expect(TRUST_LEVEL_THRESHOLDS.low).toBeGreaterThan(TRUST_LEVEL_THRESHOLDS.unverified)
  })

  // ─── 3. calibrateTrustScore 基础 ───
  test('calibrateTrustScore 返回正确的结构', () => {
    const entry = makeCaseV2('TC-001', 'classic')
    const result = calibrateTrustScore(entry)

    expect(result.caseId).toBe('TC-001')
    expect(result.trustScore).toBeGreaterThanOrEqual(0)
    expect(result.trustScore).toBeLessThanOrEqual(100)
    expect(typeof result.trustLevel).toBe('string')
    expect(result.dimensions).toBeDefined()
    expect(result.breakdown).toHaveLength(5)
    expect(result.calibratedAt).toBeGreaterThan(0)
  })

  test('calibrateTrustScore 五个维度都在 0-100 范围内', () => {
    const entry = makeCaseV2('TC-002', 'classic')
    const result = calibrateTrustScore(entry)

    for (const [dim, score] of Object.entries(result.dimensions)) {
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })

  // ─── 4. confidence 维度提取 ───
  test('confidence 维度 = entry.confidence * 100', () => {
    const entry = makeCaseV2('TC-003', 'classic', { confidence: 0.72 })
    const result = calibrateTrustScore(entry)
    expect(result.dimensions.confidence).toBe(72)
  })

  // ─── 5. reliability 维度提取 ───
  test('reliability 维度 = entry.reliability', () => {
    const entry = makeCaseV2('TC-004', 'classic', { reliability: 88 })
    const result = calibrateTrustScore(entry)
    expect(result.dimensions.reliability).toBe(88)
  })

  // ─── 6. evidenceScore 维度提取 ───
  test('无证据时 evidenceScore 为 0', () => {
    const entry = makeCaseV2('TC-005', 'classic', { evidence: [] })
    const result = calibrateTrustScore(entry)
    expect(result.dimensions.evidenceScore).toBe(0)
  })

  test('有高质量证据时 evidenceScore > 0', () => {
    const entry = makeCaseV2('TC-006', 'classic', {
      evidence: [
        { type: 'classical_text', content: 'c1', source: 's1', confidence: 0.95 },
        { type: 'classical_text', content: 'c2', source: 's2', confidence: 0.90 },
        { type: 'expert_opinion', content: 'c3', source: 's3', confidence: 0.85 },
      ],
    })
    const result = calibrateTrustScore(entry)
    expect(result.dimensions.evidenceScore).toBeGreaterThan(0)
  })

  // ─── 7. expertConsensus 维度提取 ───
  test('有 consensusScore 时直接使用', () => {
    const entry = makeCaseV2('TC-007', 'classic', { consensusScore: 88 })
    const result = calibrateTrustScore(entry)
    expect(result.dimensions.expertConsensus).toBe(88)
  })

  test('无 consensusScore 且无专家观点时为 0', () => {
    const entry = makeCaseV2('TC-008', 'classic', {
      consensusScore: undefined,
      expertOpinions: [],
    })
    const result = calibrateTrustScore(entry)
    expect(result.dimensions.expertConsensus).toBe(0)
  })

  test('无 consensusScore 但有专家观点时自动计算', () => {
    const entry = makeCaseV2('TC-009', 'expertVerified', {
      consensusScore: undefined,
      expertOpinions: [
        {
          opinionId: 'op1', expertId: 'e1', conclusion: '正确', verdict: 'agree',
          consistencyRate: 1, score: 90, validatedAt: Date.now(), classicalBasis: 'b', affectedRules: [],
        },
        {
          opinionId: 'op2', expertId: 'e2', conclusion: '正确', verdict: 'agree',
          consistencyRate: 1, score: 85, validatedAt: Date.now(), classicalBasis: 'b', affectedRules: [],
        },
      ],
    })
    const result = calibrateTrustScore(entry)
    expect(result.dimensions.expertConsensus).toBeGreaterThan(0)
  })

  // ─── 8. regressionStability 维度提取 ───
  test('gold + approved 时 regressionStability 较高', () => {
    const entry = makeCaseV2('TC-010', 'regression', {
      regressionTier: 'gold',
      reviewStatus: 'approved',
    })
    const result = calibrateTrustScore(entry)
    expect(result.dimensions.regressionStability).toBeGreaterThanOrEqual(90)
  })

  test('none + pending 时 regressionStability 为 0', () => {
    const entry = makeCaseV2('TC-011', 'anonymous', {
      regressionTier: 'none',
      reviewStatus: 'pending',
    })
    const result = calibrateTrustScore(entry)
    expect(result.dimensions.regressionStability).toBe(0)
  })

  // ─── 9. 等级映射 ───
  test('高信任命例映射为 highly_trusted', () => {
    const entry = makeHighTrustCase('TC-HIGH')
    const result = calibrateTrustScore(entry)
    expect(result.trustLevel).toBe('highly_trusted')
  })

  test('低信任命例映射为 unverified 或 low', () => {
    const entry = makeLowTrustCase('TC-LOW')
    const result = calibrateTrustScore(entry)
    expect(['low', 'unverified']).toContain(result.trustLevel)
  })

  // ─── 10. breakdown 结构 ───
  test('breakdown 每项包含 dimension, score, weight, weightedScore, description', () => {
    const entry = makeCaseV2('TC-012', 'classic')
    const result = calibrateTrustScore(entry)

    for (const item of result.breakdown) {
      expect(item).toHaveProperty('dimension')
      expect(item).toHaveProperty('score')
      expect(item).toHaveProperty('weight')
      expect(item).toHaveProperty('weightedScore')
      expect(item).toHaveProperty('description')
      expect(typeof item.description).toBe('string')
      expect(item.description.length).toBeGreaterThan(0)
    }
  })

  // ─── 11. 自定义权重 ───
  test('自定义权重应影响总分', () => {
    const entry = makeCaseV2('TC-013', 'classic', {
      confidence: 1.0,
      reliability: 0,
      evidence: [],
      consensusScore: 0,
      regressionTier: 'none',
      reviewStatus: 'pending',
    })

    const defaultResult = calibrateTrustScore(entry)
    const customResult = calibrateTrustScore(entry, {
      weights: { confidence: 1.0, reliability: 0, evidenceScore: 0, expertConsensus: 0, regressionStability: 0 },
    })

    expect(customResult.trustScore).toBe(100)
    expect(customResult.trustScore).toBeGreaterThan(defaultResult.trustScore)
  })

  // ─── 12. 自定义阈值 ───
  test('自定义阈值应影响等级映射', () => {
    const entry = makeCaseV2('TC-014', 'classic', {
      confidence: 0.6,
      reliability: 60,
      evidence: [],
      consensusScore: 60,
      regressionTier: 'none',
      reviewStatus: 'pending',
    })

    const defaultResult = calibrateTrustScore(entry)
    const customResult = calibrateTrustScore(entry, {
      thresholds: { highly_trusted: 30, trusted: 20, moderate: 10, low: 5, unverified: 0 },
    })

    // 降低阈值后应获得更高等级
    const levelOrder: Record<TrustLevel, number> = {
      highly_trusted: 5, trusted: 4, moderate: 3, low: 2, unverified: 1,
    }
    expect(levelOrder[customResult.trustLevel]).toBeGreaterThanOrEqual(levelOrder[defaultResult.trustLevel])
  })

  // ─── 13. batchCalibrateTrust ───
  test('batchCalibrateTrust 返回与输入等长的结果', () => {
    const cases = [
      makeCaseV2('TC-015', 'classic'),
      makeCaseV2('TC-016', 'anonymous'),
      makeCaseV2('TC-017', 'regression'),
    ]
    const results = batchCalibrateTrust(cases)
    expect(results).toHaveLength(3)
    expect(results[0].caseId).toBe('TC-015')
    expect(results[1].caseId).toBe('TC-016')
    expect(results[2].caseId).toBe('TC-017')
  })

  // ─── 14. filterByTrustLevel ───
  test('filterByTrustLevel 正确筛选指定等级', () => {
    const cases = [
      makeHighTrustCase('TC-H1'),
      makeHighTrustCase('TC-H2'),
      makeLowTrustCase('TC-L1'),
    ]
    const highlyTrusted = filterByTrustLevel(cases, 'highly_trusted')
    expect(highlyTrusted).toHaveLength(2)

    const unverified = filterByTrustLevel(cases, 'unverified')
    expect(unverified).toHaveLength(1)
  })

  // ─── 15. getTrustDistribution ───
  test('getTrustDistribution 返回五个等级的计数', () => {
    const cases = [
      makeHighTrustCase('TC-D1'),
      makeHighTrustCase('TC-D2'),
      makeLowTrustCase('TC-D3'),
    ]
    const dist = getTrustDistribution(cases)

    expect(dist.highly_trusted).toBe(2)
    expect(dist.low + dist.unverified).toBeGreaterThanOrEqual(1)
    expect(dist.moderate).toBe(0)
  })

  // ─── 16. getTopTrustedCases ───
  test('getTopTrustedCases 返回不超过 limit 条且按分数降序', () => {
    const cases = [
      makeHighTrustCase('TC-T1'),
      makeLowTrustCase('TC-T2'),
      makeHighTrustCase('TC-T3'),
      makeLowTrustCase('TC-T4'),
    ]
    const top2 = getTopTrustedCases(cases, 2)
    expect(top2).toHaveLength(2)
    // 前 2 条应该是高信任命例
    expect(top2[0].caseId).toBe('TC-T1')
    expect(top2[1].caseId).toBe('TC-T3')
  })

  // ─── 17. getTrustTrend ───
  test('getTrustTrend 空数组返回零值', () => {
    const trend = getTrustTrend([])
    expect(trend.avgScore).toBe(0)
    expect(trend.highlyTrustedPct).toBe(0)
    expect(trend.trustedPct).toBe(0)
    expect(trend.unverifiedPct).toBe(0)
  })

  test('getTrustTrend 正确计算趋势', () => {
    const cases = [
      makeHighTrustCase('TC-TR1'),
      makeHighTrustCase('TC-TR2'),
      makeLowTrustCase('TC-TR3'),
    ]
    const trend = getTrustTrend(cases)

    expect(trend.avgScore).toBeGreaterThan(0)
    expect(trend.highlyTrustedPct).toBeGreaterThan(0)
    expect(trend.unverifiedPct).toBeGreaterThan(0)
  })

  // ─── 18. compareTrust ───
  test('compareTrust 高信任命例为 leader', () => {
    const high = makeHighTrustCase('TC-C1')
    const low = makeLowTrustCase('TC-C2')
    const comp = compareTrust(high, low)

    expect(comp.leader).toBe('TC-C1')
    expect(comp.caseA_score).toBeGreaterThan(comp.caseB_score)
    expect(comp.diff).toBeGreaterThan(0)
  })

  test('compareTrust 相同命例 diff 为 0', () => {
    const entry = makeCaseV2('TC-C3', 'classic')
    const comp = compareTrust(entry, entry)
    expect(comp.diff).toBe(0)
  })

  // ─── 19. 不修改输入命例 ───
  test('calibrateTrustScore 不修改输入命例', () => {
    const entry = makeCaseV2('TC-IMM', 'classic', { confidence: 0.5 })
    const originalConfidence = entry.confidence
    calibrateTrustScore(entry)
    expect(entry.confidence).toBe(originalConfidence)
  })

  // ─── 20. 批量校准支持自定义选项 ───
  test('batchCalibrateTrust 支持自定义选项', () => {
    const cases = [makeCaseV2('TC-B1', 'classic')]
    const options: CalibrationOptions = {
      weights: { confidence: 1.0, reliability: 0, evidenceScore: 0, expertConsensus: 0, regressionStability: 0 },
    }
    const results = batchCalibrateTrust(cases, options)
    expect(results).toHaveLength(1)
    expect(results[0].trustScore).toBe(85) // confidence 0.85 * 100 * 1.0 + all others * 0 = 85
  })
})