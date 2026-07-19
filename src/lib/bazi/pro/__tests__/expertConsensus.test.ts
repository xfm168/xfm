/**
 * Expert Consensus Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - 无专家观点时的共识
 *   - 一致同意
 *   - 部分同意
 *   - 分歧严重
 *   - 共识等级判断
 *   - 主导观点识别
 *   - 批量计算
 */

import { describe, test, expect } from 'vitest'
import type { CaseEntryV2, CaseCategoryV2, ExpertOpinionV2 } from '../caseLibraryTypesV2'
import {
  EXPERT_CONSENSUS_VERSION,
  calculateExpertConsensus,
  batchCalculateConsensus,
  getCasesByConsensusLevel,
} from '../expertConsensusEngine'
import type { ConsensusLevel } from '../expertConsensusTypes'

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

describe('Expert Consensus Engine', () => {
  describe('1. 版本号', () => {
    test('版本号应为 1.0.0', () => {
      expect(EXPERT_CONSENSUS_VERSION).toBe('1.0.0')
    })
  })

  // ═══════════════════════════════════════════
  // 2. 无专家观点时的共识
  // ═══════════════════════════════════════════

  describe('2. 无专家观点时的共识', () => {
    test('无专家观点时 consensusScore 为 0', () => {
      const entry = makeCaseV2('TEST-001', 'classic', { expertOpinions: [] })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusScore).toBe(0)
    })

    test('无专家观点时 consensusLevel 为 disputed', () => {
      const entry = makeCaseV2('TEST-001', 'classic', { expertOpinions: [] })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusLevel).toBe('disputed')
    })

    test('无专家观点时 dominantConclusion 为空字符串', () => {
      const entry = makeCaseV2('TEST-001', 'classic', { expertOpinions: [] })
      const result = calculateExpertConsensus(entry)
      expect(result.dominantConclusion).toBe('')
    })

    test('无专家观点时 minorityViews 为空数组', () => {
      const entry = makeCaseV2('TEST-001', 'classic', { expertOpinions: [] })
      const result = calculateExpertConsensus(entry)
      expect(result.minorityViews).toEqual([])
    })

    test('无专家观点时 agreementRate 为 0', () => {
      const entry = makeCaseV2('TEST-001', 'classic', { expertOpinions: [] })
      const result = calculateExpertConsensus(entry)
      expect(result.agreementRate).toBe(0)
    })
  })

  // ═══════════════════════════════════════════
  // 3. 一致同意
  // ═══════════════════════════════════════════

  describe('3. 一致同意', () => {
    test('全部 agree 时 consensusLevel 为 unanimous', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree', conclusion: 'Pattern X' }),
          makeOpinion({ verdict: 'agree', conclusion: 'Pattern X' }),
          makeOpinion({ verdict: 'agree', conclusion: 'Pattern X' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusLevel).toBe('unanimous')
    })

    test('全部 agree 时 agreementRate 为 1', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.agreementRate).toBe(1)
    })

    test('全部 agree 时 consensusScore 应高于 80', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusScore).toBeGreaterThan(80)
    })

    test('全部 agree 时 dominantConclusion 为共同结论', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree', conclusion: 'Strong DayMaster' }),
          makeOpinion({ verdict: 'agree', conclusion: 'Strong DayMaster' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.dominantConclusion).toBe('Strong DayMaster')
    })

    test('全部 agree 时 minorityViews 为空数组', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree', conclusion: 'Pattern A' }),
          makeOpinion({ verdict: 'agree', conclusion: 'Pattern A' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.minorityViews).toEqual([])
    })
  })

  // ═══════════════════════════════════════════
  // 4. 部分同意
  // ═══════════════════════════════════════════

  describe('4. 部分同意', () => {
    test('80% agree 时 consensusLevel 为 strong', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'disagree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusLevel).toBe('strong')
    })

    test('60% agree 时 consensusLevel 为 moderate', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'disagree' }),
          makeOpinion({ verdict: 'disagree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusLevel).toBe('moderate')
    })

    test('40% agree 时 consensusLevel 为 weak', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'disagree' }),
          makeOpinion({ verdict: 'disagree' }),
          makeOpinion({ verdict: 'disagree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusLevel).toBe('weak')
    })

    test('部分同意时 agreementRate 计算正确', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'disagree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.agreementRate).toBeCloseTo(2 / 3, 2)
    })
  })

  // ═══════════════════════════════════════════
  // 5. 分歧严重
  // ═══════════════════════════════════════════

  describe('5. 分歧严重', () => {
    test('低于 40% agree 时 consensusLevel 为 disputed', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'disagree' }),
          makeOpinion({ verdict: 'disagree' }),
          makeOpinion({ verdict: 'disagree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusLevel).toBe('disputed')
    })

    test('严重分歧时 consensusScore 较低', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'disagree' }),
          makeOpinion({ verdict: 'disagree' }),
          makeOpinion({ verdict: 'disagree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusScore).toBeLessThan(50)
    })

    test('全部 disagree 时 consensusLevel 为 disputed', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'disagree' }),
          makeOpinion({ verdict: 'disagree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusLevel).toBe('disputed')
    })
  })

  // ═══════════════════════════════════════════
  // 6. 共识等级判断边界
  // ═══════════════════════════════════════════

  describe('6. 共识等级判断边界', () => {
    test('100% agree 为 unanimous', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [makeOpinion({ verdict: 'agree' })],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusLevel).toBe('unanimous')
    })

    test('80% agree 为 strong（边界值）', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'disagree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusLevel).toBe('strong')
    })

    test('60% agree 为 moderate（边界值）', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'disagree' }),
          makeOpinion({ verdict: 'disagree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusLevel).toBe('moderate')
    })

    test('40% agree 为 weak（边界值）', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'disagree' }),
          makeOpinion({ verdict: 'disagree' }),
          makeOpinion({ verdict: 'disagree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusLevel).toBe('weak')
    })

    test('39% agree 为 disputed（边界值）', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ verdict: 'agree' }),
          makeOpinion({ verdict: 'disagree' }),
          makeOpinion({ verdict: 'disagree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.consensusLevel).toBe('disputed')
    })
  })

  // ═══════════════════════════════════════════
  // 7. 主导观点识别
  // ═══════════════════════════════════════════

  describe('7. 主导观点识别', () => {
    test('主导观点为出现次数最多的结论', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ conclusion: 'Pattern A', verdict: 'agree' }),
          makeOpinion({ conclusion: 'Pattern A', verdict: 'agree' }),
          makeOpinion({ conclusion: 'Pattern B', verdict: 'disagree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.dominantConclusion).toBe('Pattern A')
    })

    test('少数观点应包含非主导结论', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ conclusion: 'Pattern A', verdict: 'agree' }),
          makeOpinion({ conclusion: 'Pattern B', verdict: 'disagree' }),
          makeOpinion({ conclusion: 'Pattern C', verdict: 'disagree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.minorityViews).toContain('Pattern B')
      expect(result.minorityViews).toContain('Pattern C')
      expect(result.minorityViews).not.toContain('Pattern A')
    })

    test('少数观点去重', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion({ conclusion: 'Pattern A', verdict: 'agree' }),
          makeOpinion({ conclusion: 'Pattern A', verdict: 'agree' }),
          makeOpinion({ conclusion: 'Pattern B', verdict: 'disagree' }),
          makeOpinion({ conclusion: 'Pattern B', verdict: 'disagree' }),
          makeOpinion({ conclusion: 'Pattern C', verdict: 'disagree' }),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.dominantConclusion).toBe('Pattern A')
      expect(result.minorityViews).toContain('Pattern B')
      expect(result.minorityViews).toContain('Pattern C')
      expect(result.minorityViews).toHaveLength(2)
    })

    test('结果应包含正确的 caseId', () => {
      const entry = makeCaseV2('TEST-ABC', 'classic', {
        expertOpinions: [makeOpinion()],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.caseId).toBe('TEST-ABC')
    })

    test('结果应包含正确的 opinionCount', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        expertOpinions: [
          makeOpinion(),
          makeOpinion(),
          makeOpinion(),
        ],
      })
      const result = calculateExpertConsensus(entry)
      expect(result.opinionCount).toBe(3)
    })
  })

  // ═══════════════════════════════════════════
  // 8. 批量计算
  // ═══════════════════════════════════════════

  describe('8. 批量计算', () => {
    test('批量计算返回与输入数量相同的结果', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic', {
          expertOpinions: [makeOpinion()],
        }),
        makeCaseV2('TEST-002', 'anonymous', {
          expertOpinions: [makeOpinion(), makeOpinion()],
        }),
        makeCaseV2('TEST-003', 'regression', {
          expertOpinions: [],
        }),
      ]
      const results = batchCalculateConsensus(cases)
      expect(results).toHaveLength(3)
      expect(results[0].caseId).toBe('TEST-001')
      expect(results[1].caseId).toBe('TEST-002')
      expect(results[2].caseId).toBe('TEST-003')
    })

    test('空数组批量计算返回空数组', () => {
      const results = batchCalculateConsensus([])
      expect(results).toEqual([])
    })

    test('按共识等级筛选返回正确命例', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic', {
          expertOpinions: [
            makeOpinion({ verdict: 'agree' }),
            makeOpinion({ verdict: 'agree' }),
          ],
        }),
        makeCaseV2('TEST-002', 'classic', {
          expertOpinions: [
            makeOpinion({ verdict: 'agree' }),
            makeOpinion({ verdict: 'disagree' }),
            makeOpinion({ verdict: 'disagree' }),
          ],
        }),
        makeCaseV2('TEST-003', 'classic', {
          expertOpinions: [],
        }),
      ]
      const unanimousCases = getCasesByConsensusLevel(cases, 'unanimous')
      const disputedCases = getCasesByConsensusLevel(cases, 'disputed')
      expect(unanimousCases).toHaveLength(1)
      expect(unanimousCases[0].caseId).toBe('TEST-001')
      expect(disputedCases).toHaveLength(2)
      expect(disputedCases.map((c) => c.caseId).sort()).toEqual(['TEST-002', 'TEST-003'])
    })

    test('按不存在的共识等级筛选返回空数组', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic', {
          expertOpinions: [makeOpinion({ verdict: 'agree' })],
        }),
      ]
      const filtered = getCasesByConsensusLevel(cases, 'disputed')
      expect(filtered).toEqual([])
    })
  })
})
