/**
 * Case Quality Score Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - 单命例质量评分（各维度）
 *   - 星级映射
 *   - passed/failed 判断
 *   - 批量计算
 *   - 低质量过滤
 *   - 分布统计
 */

import { describe, test, expect } from 'vitest'
import type { CaseEntryV2, CaseCategoryV2, ExpertOpinionV2 } from '../caseLibraryTypesV2'
import {
  CASE_QUALITY_SCORE_VERSION,
  calculateCaseQualityScore,
  batchCalculateQualityScores,
  filterLowQualityCases,
  getQualityScoreDistribution,
} from '../caseQualityScoreEngine'
import { DEFAULT_QUALITY_THRESHOLD } from '../caseQualityScoreTypes'

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
// 1. 版本号
// ═══════════════════════════════════════════

describe('Case Quality Score Engine', () => {
  describe('1. 版本号', () => {
    test('版本号应为 1.0.0', () => {
      expect(CASE_QUALITY_SCORE_VERSION).toBe('1.0.0')
    })
  })

  // ═══════════════════════════════════════════
  // 2. 单命例质量评分 - 各维度
  // ═══════════════════════════════════════════

  describe('2. 单命例质量评分', () => {
    test('完整度维度：必填字段齐全时得分较高', () => {
      const entry = makeCaseV2('TEST-001', 'classic')
      const result = calculateCaseQualityScore(entry)
      expect(result.dimensions.completeness).toBeGreaterThanOrEqual(10)
    })

    test('完整度维度：expectedResult 越丰富得分越高', () => {
      const entry1 = makeCaseV2('TEST-001', 'classic', {
        expectedResult: { dayMasterElement: '木' },
      })
      const entry2 = makeCaseV2('TEST-002', 'classic', {
        expectedResult: {
          dayMasterElement: '木',
          primaryPattern: 'pattern',
          strengthLevel: 'strong',
          careerScore: 80,
          wealthScore: 70,
          marriageScore: 60,
          healthScore: 50,
          studyScore: 90,
          overallScore: 75,
        },
      })
      const r1 = calculateCaseQualityScore(entry1)
      const r2 = calculateCaseQualityScore(entry2)
      expect(r2.dimensions.completeness).toBeGreaterThan(r1.dimensions.completeness)
    })

    test('来源维度：无来源、无证据、无参考书时得 0 分', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        source: '',
        evidence: [],
        referenceBooks: [],
      })
      const result = calculateCaseQualityScore(entry)
      expect(result.dimensions.source).toBe(0)
    })

    test('来源维度：有来源、有证据、有参考书时得分较高', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        source: '权威古籍',
        evidence: [
          { type: 'classical_text', content: 'content', source: 'src', confidence: 0.9 },
          { type: 'modern_study', content: 'content', source: 'src', confidence: 0.8 },
        ],
        referenceBooks: ['书A', '书B'],
      })
      const result = calculateCaseQualityScore(entry)
      expect(result.dimensions.source).toBeGreaterThanOrEqual(20)
    })

    test('专家维度：无专家观点时得 0 分', () => {
      const entry = makeCaseV2('TEST-001', 'classic', { expertOpinions: [] })
      const result = calculateCaseQualityScore(entry)
      expect(result.dimensions.expert).toBe(0)
    })

    test('专家维度：每增加 1 个专家观点增加 5 分，上限 20 分', () => {
      const entry1 = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [makeOpinion()],
      })
      const entry2 = makeCaseV2('TEST-002', 'classic', {
        expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion(), makeOpinion()],
      })
      const entry3 = makeCaseV2('TEST-003', 'classic', {
        expertOpinions: [
          makeOpinion(), makeOpinion(), makeOpinion(), makeOpinion(), makeOpinion(),
        ],
      })
      expect(calculateCaseQualityScore(entry1).dimensions.expert).toBe(5)
      expect(calculateCaseQualityScore(entry2).dimensions.expert).toBe(20)
      expect(calculateCaseQualityScore(entry3).dimensions.expert).toBe(20)
    })

    test('一致率维度：无专家观点时得 0 分', () => {
      const entry = makeCaseV2('TEST-001', 'classic', { expertOpinions: [] })
      const result = calculateCaseQualityScore(entry)
      expect(result.dimensions.consistency).toBe(0)
    })

    test('一致率维度：全部 agree 时得 20 分', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
        ],
      })
      const result = calculateCaseQualityScore(entry)
      expect(result.dimensions.consistency).toBe(20)
    })

    test('一致率维度：一半 agree 时得 10 分', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'disagree' }),
        ],
      })
      const result = calculateCaseQualityScore(entry)
      expect(result.dimensions.consistency).toBe(10)
    })

    test('引用维度：无引用时得 0 分', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        evidence: [],
        referenceBooks: [],
      })
      const result = calculateCaseQualityScore(entry)
      expect(result.dimensions.citation).toBe(0)
    })

    test('引用维度：证据和参考书总数计入得分，上限 10 分', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        evidence: [
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
        ],
        referenceBooks: ['书A'],
      })
      const result = calculateCaseQualityScore(entry)
      expect(result.dimensions.citation).toBe(10)
    })
  })

  // ═══════════════════════════════════════════
  // 3. 总分与星级映射
  // ═══════════════════════════════════════════

  describe('3. 总分与星级映射', () => {
    test('总分范围在 0-100 之间', () => {
      const entry = makeCaseV2('TEST-001', 'classic')
      const result = calculateCaseQualityScore(entry)
      expect(result.totalScore).toBeGreaterThanOrEqual(0)
      expect(result.totalScore).toBeLessThanOrEqual(100)
    })

    test('高质量命例映射到 4-5 星', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        source: '权威来源',
        evidence: [
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
        ],
        referenceBooks: ['书A', '书B'],
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
        ],
        expectedResult: {
          dayMasterElement: '木',
          primaryPattern: 'pattern',
          strengthLevel: 'strong',
          careerScore: 80,
          wealthScore: 70,
          marriageScore: 60,
          healthScore: 50,
          studyScore: 90,
          overallScore: 75,
        },
      })
      const result = calculateCaseQualityScore(entry)
      expect(result.starRating).toBeGreaterThanOrEqual(4)
      expect(result.totalScore).toBeGreaterThanOrEqual(75)
    })

    test('低质量命例映射到 1-2 星', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        source: '',
        evidence: [],
        referenceBooks: [],
        expertOpinions: [],
        expectedResult: {},
      })
      const result = calculateCaseQualityScore(entry)
      expect(result.starRating).toBeLessThanOrEqual(2)
    })

    test('星级与总分的对应关系符合 scoreToStarRating', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        source: 'src',
        evidence: [],
        referenceBooks: [],
        expertOpinions: [],
        expectedResult: { dayMasterElement: '木' },
      })
      const result = calculateCaseQualityScore(entry)
      if (result.totalScore >= 90) expect(result.starRating).toBe(5)
      else if (result.totalScore >= 75) expect(result.starRating).toBe(4)
      else if (result.totalScore >= 60) expect(result.starRating).toBe(3)
      else if (result.totalScore >= 40) expect(result.starRating).toBe(2)
      else expect(result.starRating).toBe(1)
    })
  })

  // ═══════════════════════════════════════════
  // 4. passed / failed 判断
  // ═══════════════════════════════════════════

  describe('4. passed / failed 判断', () => {
    test('高质量命例应通过阈值', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        source: '权威来源',
        evidence: [
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
        ],
        referenceBooks: ['书A', '书B'],
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
        ],
        expectedResult: {
          dayMasterElement: '木',
          primaryPattern: 'pattern',
          strengthLevel: 'strong',
          careerScore: 80,
          wealthScore: 70,
          marriageScore: 60,
          healthScore: 50,
          studyScore: 90,
          overallScore: 75,
        },
      })
      const result = calculateCaseQualityScore(entry)
      expect(result.passed).toBe(true)
    })

    test('低质量命例不应通过阈值', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        source: '',
        evidence: [],
        referenceBooks: [],
        expertOpinions: [],
        expectedResult: {},
      })
      const result = calculateCaseQualityScore(entry)
      expect(result.passed).toBe(false)
    })

    test('自定义阈值可以影响 passed 结果', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        source: 'src',
        evidence: [],
        referenceBooks: [],
        expertOpinions: [],
        expectedResult: { dayMasterElement: '木' },
      })
      const strictThreshold = { ...DEFAULT_QUALITY_THRESHOLD, minTotal: 90, minStar: 5 }
      const result = calculateCaseQualityScore(entry, strictThreshold)
      expect(result.passed).toBe(false)
    })

    test('结果应包含 caseId', () => {
      const entry = makeCaseV2('TEST-ABC', 'classic')
      const result = calculateCaseQualityScore(entry)
      expect(result.caseId).toBe('TEST-ABC')
    })
  })

  // ═══════════════════════════════════════════
  // 5. 批量计算
  // ═══════════════════════════════════════════

  describe('5. 批量计算', () => {
    test('批量计算返回与输入数量相同的结果', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic'),
        makeCaseV2('TEST-002', 'anonymous'),
        makeCaseV2('TEST-003', 'regression'),
      ]
      const results = batchCalculateQualityScores(cases)
      expect(results).toHaveLength(3)
      expect(results[0].caseId).toBe('TEST-001')
      expect(results[1].caseId).toBe('TEST-002')
      expect(results[2].caseId).toBe('TEST-003')
    })

    test('空数组批量计算返回空数组', () => {
      const results = batchCalculateQualityScores([])
      expect(results).toEqual([])
    })

    test('批量计算支持自定义阈值', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic', { source: '', evidence: [], referenceBooks: [], expertOpinions: [], expectedResult: {} }),
      ]
      const strictThreshold = { ...DEFAULT_QUALITY_THRESHOLD, minTotal: 100, minStar: 5 }
      const results = batchCalculateQualityScores(cases, strictThreshold)
      expect(results[0].passed).toBe(false)
    })
  })

  // ═══════════════════════════════════════════
  // 6. 低质量过滤
  // ═══════════════════════════════════════════

  describe('6. 低质量过滤', () => {
    test('过滤出总分低于 60 的命例', () => {
      const highQuality = makeCaseV2('TEST-001', 'classic', {
        source: '权威来源',
        evidence: [
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
        ],
        referenceBooks: ['书A', '书B'],
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
        ],
        expectedResult: {
          dayMasterElement: '木',
          primaryPattern: 'pattern',
          strengthLevel: 'strong',
        },
      })
      const lowQuality = makeCaseV2('TEST-002', 'classic', {
        source: '',
        evidence: [],
        referenceBooks: [],
        expertOpinions: [],
        expectedResult: {},
      })
      const filtered = filterLowQualityCases([highQuality, lowQuality])
      expect(filtered).toHaveLength(1)
      expect(filtered[0].caseId).toBe('TEST-002')
    })

    test('全部高质量时返回空数组', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic', {
          source: '权威来源',
          evidence: [
            { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          ],
          referenceBooks: ['书A'],
          expertOpinions: [
            makeOpinion({ verdict: 'agree' }),
            makeOpinion({ verdict: 'agree' }),
          ],
          expectedResult: { dayMasterElement: '木', primaryPattern: 'p' },
        }),
      ]
      const filtered = filterLowQualityCases(cases)
      expect(filtered).toEqual([])
    })

    test('全部低质量时返回全部', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic', { source: '', evidence: [], referenceBooks: [], expertOpinions: [], expectedResult: {} }),
        makeCaseV2('TEST-002', 'classic', { source: '', evidence: [], referenceBooks: [], expertOpinions: [], expectedResult: {} }),
      ]
      const filtered = filterLowQualityCases(cases)
      expect(filtered).toHaveLength(2)
    })
  })

  // ═══════════════════════════════════════════
  // 7. 分布统计
  // ═══════════════════════════════════════════

  describe('7. 分布统计', () => {
    test('分布统计返回正确的星级分布', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic', {
          source: '',
          evidence: [],
          referenceBooks: [],
          expertOpinions: [],
          expectedResult: {},
        }),
        makeCaseV2('TEST-002', 'classic', {
          source: 'src',
          evidence: [],
          referenceBooks: [],
          expertOpinions: [],
          expectedResult: { dayMasterElement: '木' },
        }),
        makeCaseV2('TEST-003', 'classic', {
          source: '权威来源',
          evidence: [
            { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
            { type: 'classical_text', content: 'c', source: 's', confidence: 0.9 },
          ],
          referenceBooks: ['书A', '书B'],
          expertOpinions: [
            makeOpinion({ verdict: 'agree' }),
            makeOpinion({ verdict: 'agree' }),
            makeOpinion({ verdict: 'agree' }),
            makeOpinion({ verdict: 'agree' }),
          ],
          expectedResult: {
            dayMasterElement: '木',
            primaryPattern: 'pattern',
            strengthLevel: 'strong',
            careerScore: 80,
            wealthScore: 70,
            marriageScore: 60,
            healthScore: 50,
            studyScore: 90,
            overallScore: 75,
          },
        }),
      ]
      const dist = getQualityScoreDistribution(cases)
      expect(dist['1'] + dist['2'] + dist['3'] + dist['4'] + dist['5']).toBe(3)
    })

    test('空数组分布统计全为 0', () => {
      const dist = getQualityScoreDistribution([])
      expect(dist['1']).toBe(0)
      expect(dist['2']).toBe(0)
      expect(dist['3']).toBe(0)
      expect(dist['4']).toBe(0)
      expect(dist['5']).toBe(0)
    })

    test('分布统计各星级之和等于命例总数', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic'),
        makeCaseV2('TEST-002', 'anonymous'),
        makeCaseV2('TEST-003', 'regression'),
        makeCaseV2('TEST-004', 'expertVerified'),
        makeCaseV2('TEST-005', 'edge'),
      ]
      const dist = getQualityScoreDistribution(cases)
      const total = dist['1'] + dist['2'] + dist['3'] + dist['4'] + dist['5']
      expect(total).toBe(5)
    })
  })
})
