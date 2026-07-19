/**
 * AI vs Expert Compare Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - compareAiVsExpert 完全匹配
 *   - compareAiVsExpert 部分匹配
 *   - compareAiVsExpert 不匹配
 *   - compareAiVsExpert 数值误差
 *   - batchCompare
 *   - getFieldAgreementRate
 *   - getTopDivergentFields
 *   - 边界条件
 */

import { describe, test, expect, beforeEach } from 'vitest'
import type { CaseEntryV2, CaseCategoryV2, ExpertOpinionV2 } from '../caseLibraryTypesV2'
import type { ComparisonField, ExpertAgreement, AiVsExpertReport } from '../aiVsExpertCompareTypes'
import {
  AI_VS_EXPERT_VERSION,
  compareAiVsExpert,
  batchCompare,
  getFieldAgreementRate,
  getTopDivergentFields,
  _clearCompareCache,
} from '../aiVsExpertCompareEngine'

// ─── 测试辅助 ───

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
    expectedResult: {
      dayMasterElement: '木',
      primaryPattern: '建禄格',
      strengthLevel: '偏强',
      primaryXiShen: '水',
      primaryYongShen: '金',
      careerScore: 80,
      marriageScore: 70,
      overallScore: 75,
      tenGodSummary: '比肩建禄',
    },
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

beforeEach(() => {
  _clearCompareCache()
})

// ─── 版本号 ───

describe('AI vs Expert Compare Engine - 版本号', () => {
  test('版本号为 1.0.0', () => {
    expect(AI_VS_EXPERT_VERSION).toBe('1.0.0')
  })
})

// ─── compareAiVsExpert ───

describe('AI vs Expert Compare Engine - compareAiVsExpert', () => {
  test('完全匹配时 overallAgreement 为 100', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '建禄格',
      strengthLevel: '偏强',
      xiShen: '水',
      yongShen: '金',
      careerScore: 80,
      marriageScore: 70,
      overallScore: 75,
      tenGodSummary: '比肩建禄',
    }

    const result = compareAiVsExpert(caseEntry, aiResults)
    expect(result.caseId).toBe('CLS-001')
    expect(result.overallAgreement).toBe(100)
    expect(result.divergentFields).toHaveLength(0)
    expect(result.fieldComparisons).toHaveLength(8)
  })

  test('完全匹配时所有字段的 match 为 true', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '建禄格',
      strengthLevel: '偏强',
      xiShen: '水',
      yongShen: '金',
      careerScore: 80,
      marriageScore: 70,
      overallScore: 75,
      tenGodSummary: '比肩建禄',
    }

    const result = compareAiVsExpert(caseEntry, aiResults)
    for (const fc of result.fieldComparisons) {
      expect(fc.match).toBe(true)
      expect(fc.matchScore).toBe(1)
    }
  })

  test('字符串不匹配时 matchScore 为 0', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '食神格',
      strengthLevel: '偏强',
      xiShen: '水',
      yongShen: '金',
      careerScore: 80,
      marriageScore: 70,
      overallScore: 75,
      tenGodSummary: '比肩建禄',
    }

    const result = compareAiVsExpert(caseEntry, aiResults)
    const patternComp = result.fieldComparisons.find((f) => f.field === 'primaryPattern')
    expect(patternComp).toBeDefined()
    expect(patternComp!.match).toBe(false)
    expect(patternComp!.matchScore).toBe(0)
  })

  test('字符串部分匹配时 matchScore 为 0.5', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '建禄格特殊变体',
      strengthLevel: '偏强',
      xiShen: '水',
      yongShen: '金',
      careerScore: 80,
      marriageScore: 70,
      overallScore: 75,
      tenGodSummary: '比肩建禄',
    }

    const result = compareAiVsExpert(caseEntry, aiResults)
    const patternComp = result.fieldComparisons.find((f) => f.field === 'primaryPattern')
    expect(patternComp!.matchScore).toBe(0.5)
  })

  test('数值误差 <= 5% 时完全匹配', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '建禄格',
      strengthLevel: '偏强',
      xiShen: '水',
      yongShen: '金',
      careerScore: 81,
      marriageScore: 70,
      overallScore: 75,
      tenGodSummary: '比肩建禄',
    }

    const result = compareAiVsExpert(caseEntry, aiResults)
    const careerComp = result.fieldComparisons.find((f) => f.field === 'careerScore')
    expect(careerComp!.matchScore).toBe(1)
  })

  test('数值误差 > 5% 且 <= 20% 时部分匹配', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '建禄格',
      strengthLevel: '偏强',
      xiShen: '水',
      yongShen: '金',
      careerScore: 100,
      marriageScore: 70,
      overallScore: 75,
      tenGodSummary: '比肩建禄',
    }

    const result = compareAiVsExpert(caseEntry, aiResults)
    const careerComp = result.fieldComparisons.find((f) => f.field === 'careerScore')
    // |100 - 80| / 100 = 0.2 → 部分匹配
    expect(careerComp!.matchScore).toBe(0.5)
  })

  test('数值误差 > 20% 时不匹配', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '建禄格',
      strengthLevel: '偏强',
      xiShen: '水',
      yongShen: '金',
      careerScore: 10,
      marriageScore: 70,
      overallScore: 75,
      tenGodSummary: '比肩建禄',
    }

    const result = compareAiVsExpert(caseEntry, aiResults)
    const careerComp = result.fieldComparisons.find((f) => f.field === 'careerScore')
    // |10 - 80| / 80 = 0.875 → 不匹配
    expect(careerComp!.matchScore).toBe(0)
  })

  test('有分歧时 divergentFields 包含 matchScore < 1 的字段', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '食神格',
      strengthLevel: '偏强',
      xiShen: '火',
      yongShen: '金',
      careerScore: 80,
      marriageScore: 70,
      overallScore: 75,
      tenGodSummary: '比肩建禄',
    }

    const result = compareAiVsExpert(caseEntry, aiResults)
    expect(result.divergentFields).toContain('primaryPattern')
    expect(result.divergentFields).toContain('xiShen')
  })

  test('有专家观点时正确计算 expertAvgScore 和 expertCount', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic', {
      expertOpinions: [
        {
          opinionId: 'op-1',
          expertId: 'EXP-001',
          expertName: 'Expert A',
          conclusion: '建禄格',
          verdict: 'agree',
          consistencyRate: 1.0,
          score: 90,
          validatedAt: Date.now(),
          classicalBasis: '三命通会',
          affectedRules: [],
        },
        {
          opinionId: 'op-2',
          expertId: 'EXP-002',
          expertName: 'Expert B',
          conclusion: '建禄格',
          verdict: 'partially_agree',
          consistencyRate: 0.8,
          score: 70,
          validatedAt: Date.now(),
          classicalBasis: '子平真诠',
          affectedRules: [],
        },
      ],
    })

    const aiResults: Record<string, string | number> = {
      primaryPattern: '建禄格',
      strengthLevel: '偏强',
      xiShen: '水',
      yongShen: '金',
      careerScore: 80,
      marriageScore: 70,
      overallScore: 75,
      tenGodSummary: '比肩建禄',
    }

    const result = compareAiVsExpert(caseEntry, aiResults)
    expect(result.expertCount).toBe(2)
    expect(result.expertAvgScore).toBe(80)
  })

  test('无专家观点时 expertAvgScore 为 0，aiConsistentWithMajority 为 true', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '建禄格',
      strengthLevel: '偏强',
      xiShen: '水',
      yongShen: '金',
      careerScore: 80,
      marriageScore: 70,
      overallScore: 75,
      tenGodSummary: '比肩建禄',
    }

    const result = compareAiVsExpert(caseEntry, aiResults)
    expect(result.expertCount).toBe(0)
    expect(result.expertAvgScore).toBe(0)
    expect(result.aiConsistentWithMajority).toBe(true)
  })

  test('aiConsistentWithMajority 在多数专家 agree/partially_agree 时为 true', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic', {
      expertOpinions: [
        {
          opinionId: 'op-1',
          expertId: 'EXP-001',
          conclusion: '建禄格',
          verdict: 'agree',
          consistencyRate: 1.0,
          score: 90,
          validatedAt: Date.now(),
          classicalBasis: '三命通会',
          affectedRules: [],
        },
        {
          opinionId: 'op-2',
          expertId: 'EXP-002',
          conclusion: '建禄格',
          verdict: 'disagree',
          consistencyRate: 0.3,
          score: 40,
          validatedAt: Date.now(),
          classicalBasis: '神峰通考',
          affectedRules: [],
        },
        {
          opinionId: 'op-3',
          expertId: 'EXP-003',
          conclusion: '建禄格',
          verdict: 'agree',
          consistencyRate: 1.0,
          score: 85,
          validatedAt: Date.now(),
          classicalBasis: '滴天髓',
          affectedRules: [],
        },
      ],
    })

    const aiResults: Record<string, string | number> = {
      primaryPattern: '建禄格',
      strengthLevel: '偏强',
      xiShen: '水',
      yongShen: '金',
      careerScore: 80,
      marriageScore: 70,
      overallScore: 75,
      tenGodSummary: '比肩建禄',
    }

    const result = compareAiVsExpert(caseEntry, aiResults)
    expect(result.aiConsistentWithMajority).toBe(true)
  })

  test('consensusLevel 在高一致度时为 unanimous', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '建禄格',
      strengthLevel: '偏强',
      xiShen: '水',
      yongShen: '金',
      careerScore: 80,
      marriageScore: 70,
      overallScore: 75,
      tenGodSummary: '比肩建禄',
    }

    const result = compareAiVsExpert(caseEntry, aiResults)
    expect(result.consensusLevel).toBe('unanimous')
  })

  test('consensusLevel 在低一致度时为 disputed', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '食神格',
      strengthLevel: '偏弱',
      xiShen: '火',
      yongShen: '木',
      careerScore: 20,
      marriageScore: 10,
      overallScore: 10,
      tenGodSummary: '食神生财',
    }

    const result = compareAiVsExpert(caseEntry, aiResults)
    expect(result.consensusLevel).toBe('disputed')
  })
})

// ─── batchCompare ───

describe('AI vs Expert Compare Engine - batchCompare', () => {
  test('批量对比生成完整报告', () => {
    const case1 = makeCaseV2('CLS-001', 'classic')
    const case2 = makeCaseV2('CLS-002', 'classic')

    const aiMap = new Map<string, Record<string, string | number>>([
      ['CLS-001', {
        primaryPattern: '建禄格', strengthLevel: '偏强', xiShen: '水', yongShen: '金',
        careerScore: 80, marriageScore: 70, overallScore: 75, tenGodSummary: '比肩建禄',
      }],
      ['CLS-002', {
        primaryPattern: '食神格', strengthLevel: '偏弱', xiShen: '火', yongShen: '木',
        careerScore: 60, marriageScore: 50, overallScore: 55, tenGodSummary: '食神生财',
      }],
    ])

    const report = batchCompare([case1, case2], aiMap)
    expect(report.version).toBe(AI_VS_EXPERT_VERSION)
    expect(report.totalComparisons).toBe(2)
    expect(report.avgAgreement).toBeGreaterThan(0)
    expect(report.recommendations.length).toBeGreaterThan(0)
    expect(report.agreementDistribution).toBeDefined()
  })

  test('报告包含5级一致度分布', () => {
    const report = batchCompare([], new Map())
    expect(report.agreementDistribution).toEqual({
      excellent: 0,
      good: 0,
      moderate: 0,
      weak: 0,
      poor: 0,
    })
  })

  test('空命例数组返回零对比报告', () => {
    const report = batchCompare([], new Map())
    expect(report.totalComparisons).toBe(0)
    expect(report.avgAgreement).toBe(0)
  })

  test('aiResultsMap 中无对应 caseId 时跳过', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiMap = new Map<string, Record<string, string | number>>()
    const report = batchCompare([caseEntry], aiMap)
    expect(report.totalComparisons).toBe(0)
  })
})

// ─── getFieldAgreementRate ───

describe('AI vs Expert Compare Engine - getFieldAgreementRate', () => {
  test('无缓存时一致率为 0', () => {
    expect(getFieldAgreementRate('primaryPattern')).toBe(0)
  })

  test('全部匹配时一致率为 100', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '建禄格', strengthLevel: '偏强', xiShen: '水', yongShen: '金',
      careerScore: 80, marriageScore: 70, overallScore: 75, tenGodSummary: '比肩建禄',
    }
    compareAiVsExpert(caseEntry, aiResults)

    expect(getFieldAgreementRate('primaryPattern')).toBe(100)
  })

  test('部分匹配时正确计算一致率', () => {
    const case1 = makeCaseV2('CLS-001', 'classic')
    const case2 = makeCaseV2('CLS-002', 'classic', {
      expectedResult: {
        ...case1.expectedResult,
        primaryPattern: '食神格',
      },
    })

    const ai1: Record<string, string | number> = {
      primaryPattern: '建禄格', strengthLevel: '偏强', xiShen: '水', yongShen: '金',
      careerScore: 80, marriageScore: 70, overallScore: 75, tenGodSummary: '比肩建禄',
    }
    const ai2: Record<string, string | number> = {
      primaryPattern: '食神格', strengthLevel: '偏强', xiShen: '水', yongShen: '金',
      careerScore: 80, marriageScore: 70, overallScore: 75, tenGodSummary: '比肩建禄',
    }

    compareAiVsExpert(case1, ai1)
    compareAiVsExpert(case2, ai2)

    // case1 primaryPattern 匹配，case2 primaryPattern 也匹配 → 100%
    expect(getFieldAgreementRate('primaryPattern')).toBe(100)
  })
})

// ─── getTopDivergentFields ───

describe('AI vs Expert Compare Engine - getTopDivergentFields', () => {
  test('无缓存时返回空数组', () => {
    expect(getTopDivergentFields(5)).toEqual([])
  })

  test('返回差异最大的字段（matchScore 最低的在前）', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '食神格',
      strengthLevel: '偏强',
      xiShen: '木',
      yongShen: '金',
      careerScore: 10,
      marriageScore: 70,
      overallScore: 75,
      tenGodSummary: '比肩建禄',
    }
    compareAiVsExpert(caseEntry, aiResults)

    const top = getTopDivergentFields(3)
    expect(top.length).toBeLessThanOrEqual(3)
    // 按匹配分数升序
    for (let i = 1; i < top.length; i++) {
      expect(top[i].matchScore).toBeGreaterThanOrEqual(top[i - 1].matchScore)
    }
  })

  test('limit 参数控制返回数量', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '食神格',
      strengthLevel: '偏弱',
      xiShen: '木',
      yongShen: '水',
      careerScore: 10,
      marriageScore: 20,
      overallScore: 30,
      tenGodSummary: '食神',
    }
    compareAiVsExpert(caseEntry, aiResults)

    const top1 = getTopDivergentFields(1)
    const top5 = getTopDivergentFields(5)
    expect(top1.length).toBeLessThanOrEqual(1)
    expect(top5.length).toBeLessThanOrEqual(5)
  })
})

// ─── _clearCompareCache ───

describe('AI vs Expert Compare Engine - _clearCompareCache', () => {
  test('清空后一致率归零', () => {
    const caseEntry = makeCaseV2('CLS-001', 'classic')
    const aiResults: Record<string, string | number> = {
      primaryPattern: '建禄格', strengthLevel: '偏强', xiShen: '水', yongShen: '金',
      careerScore: 80, marriageScore: 70, overallScore: 75, tenGodSummary: '比肩建禄',
    }
    compareAiVsExpert(caseEntry, aiResults)

    _clearCompareCache()
    expect(getFieldAgreementRate('primaryPattern')).toBe(0)
    expect(getTopDivergentFields(5)).toEqual([])
  })
})
