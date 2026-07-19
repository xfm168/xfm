/**
 * Case Report Linker 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - extractFeaturesFromReport 特征提取
 *   - calculateSimilarityScore 相似度计算
 *   - findSimilarCasesForReport 相似命例推荐
 *   - LinkerOptions 选项过滤
 */

import { describe, test, expect, beforeEach } from 'vitest'
import type { MasterReport } from '../masterReportTypes'
import type { CaseEntryV2, CaseCategoryV2 } from '../caseLibraryTypesV2'
import { clearCaseStoreV2, addCaseV2 } from '../caseDatabaseV2'
import {
  CASE_REPORT_LINKER_VERSION,
  extractFeaturesFromReport,
  calculateSimilarityScore,
  findSimilarCasesForReport,
} from '../caseReportLinker'

// ─── 辅助：构造最小化 MasterReport ───

function makeMinimalMasterReport(overrides?: Partial<MasterReport>): MasterReport {
  return {
    version: '7.0.0',
    dayMaster: '甲',
    dayMasterElement: '木',
    overallAssessment: {
      summary: '甲木日主，偏强，适宜管理岗位',
      patternEvaluation: '甲木日主，正官格，中成',
      lifePositioning: '领导型人格',
      strengths: ['正直', '有责任感'],
      weaknesses: ['过于固执'],
      opportunities: ['仕途发展', '管理岗位'],
      risks: ['伤官见官风险'],
      developmentDirection: '管理方向',
      sourceModules: ['pattern', 'xiYong'],
      confidence: 0.8,
    },
    fiveDimensionScores: {
      career: { score: 75, level: '良好', influencedModules: ['pattern'], weight: 0.25, reasons: ['正官格利事业'], confidence: 0.75 },
      wealth: { score: 60, level: '中等', influencedModules: ['pattern'], weight: 0.2, reasons: [], confidence: 0.6 },
      marriage: { score: 65, level: '中等', influencedModules: ['pattern'], weight: 0.2, reasons: [], confidence: 0.65 },
      health: { score: 70, level: '良好', influencedModules: ['xiYong'], weight: 0.15, reasons: [], confidence: 0.7 },
      study: { score: 80, level: '良好', influencedModules: ['pattern'], weight: 0.2, reasons: [], confidence: 0.8 },
      overall: 70,
    },
    crossValidation: {
      validated: true,
      confidence: 0.8,
      reasons: ['格局与十神一致'],
      contradictions: [],
      supportingModules: ['pattern', 'xiYong', 'tenGods'],
      traceChain: [],
    },
    timeline: [],
    risks: [],
    opportunities: [],
    recommendations: [
      { category: '五行补救', content: '建议补水泄木之气', relatedElements: ['水', '木'], relatedModules: ['xiYong'], reasoning: '身偏强喜水润' },
    ],
    explains: [
      {
        topic: '十神分析',
        classicalReference: '渊海子平·十神篇',
        modernInterpretation: '十神现代解读',
        professionalExplanation: '十神摘要测试内容：正官透出，印星生身',
        plainExplanation: '命中有正官，有贵人相助',
        risks: [],
        suggestions: [],
        keywords: ['十神', '正官'],
        sourceModules: ['tenGods'],
      },
      {
        topic: '日主强弱',
        classicalReference: '滴天髓',
        modernInterpretation: '现代强弱分析',
        professionalExplanation: '甲木生于寅月，得令而偏强',
        plainExplanation: '日主比较旺',
        risks: [],
        suggestions: [],
        keywords: ['强弱', '旺衰'],
        sourceModules: ['xiYong'],
      },
    ],
    warnings: [],
    computeTimeMs: 120,
    executionMetadata: {
      computeTimeMs: 120,
      cacheVersion: '7.0.0',
      moduleVersions: {
        pillars: '1.0.0',
        shenSha: '2.0.0',
        tenGods: '3.1.0',
        pattern: '4.1.0',
        xiYong: '5.0.0',
        fortune: '6.0.0',
      },
    },
    cacheVersion: '7.0.0',
    derivation: {
      steps: [],
      overallConfidence: 1,
      computeTimeMs: 0,
      engineVersion: '7.0.0',
      algorithmVersion: 'v1.0-classic',
      warnings: [],
    },
    ...overrides,
  } as MasterReport
}

// ─── 辅助：构造最小可用 v2 命例 ───

function makeMinimalCaseV2(
  caseId: string,
  category: CaseCategoryV2,
  overrides?: Partial<CaseEntryV2>,
): CaseEntryV2 {
  return {
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
    verifiedBy: ['expert-1'],
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
      expertCount: 1,
      consensusRate: 80,
      citationCount: 2,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

// ═══════════════════════════════════════════
// Group 1: 版本号与基础导出
// ═══════════════════════════════════════════

describe('caseReportLinker basics', () => {
  test('CASE_REPORT_LINKER_VERSION is 1.0.0', () => {
    expect(CASE_REPORT_LINKER_VERSION).toBe('1.0.0')
  })
})

// ═══════════════════════════════════════════
// Group 2: extractFeaturesFromReport
// ═══════════════════════════════════════════

describe('extractFeaturesFromReport', () => {
  test('extracts dayMaster and dayMasterElement', () => {
    const report = makeMinimalMasterReport()
    const features = extractFeaturesFromReport(report)
    expect(features.dayMaster).toBe('甲')
    expect(features.dayMasterElement).toBe('木')
  })

  test('extracts pattern from patternEvaluation', () => {
    const report = makeMinimalMasterReport()
    const features = extractFeaturesFromReport(report)
    expect(features.pattern).toBe('正官格')
  })

  test('extracts strength from summary', () => {
    const report = makeMinimalMasterReport()
    const features = extractFeaturesFromReport(report)
    expect(features.strength).toBe('偏强')
  })

  test('extracts xiShen from recommendations (五行补救)', () => {
    const report = makeMinimalMasterReport()
    const features = extractFeaturesFromReport(report)
    expect(features.xiShen).toBe('水')
  })

  test('extracts yongShen as second element from recommendations', () => {
    const report = makeMinimalMasterReport()
    const features = extractFeaturesFromReport(report)
    expect(features.yongShen).toBe('木')
  })

  test('extracts tenGodSummary from explains', () => {
    const report = makeMinimalMasterReport()
    const features = extractFeaturesFromReport(report)
    expect(features.tenGodSummary).toContain('十神摘要')
  })

  test('returns undefined for pattern when patternEvaluation is empty', () => {
    const report = makeMinimalMasterReport({
      overallAssessment: {
        ...makeMinimalMasterReport().overallAssessment,
        patternEvaluation: '',
      },
    })
    const features = extractFeaturesFromReport(report)
    expect(features.pattern).toBeUndefined()
  })
})

// ═══════════════════════════════════════════
// Group 3: calculateSimilarityScore
// ═══════════════════════════════════════════

describe('calculateSimilarityScore', () => {
  test('identical cases score 100', () => {
    const caseA = makeMinimalCaseV2('A-001', 'classic', {
      expectedResult: {
        dayMasterElement: '木',
        primaryPattern: '正官格',
        strengthLevel: '偏强',
        primaryXiShen: '水',
        primaryYongShen: '木',
        tenGodSummary: '正官透出',
      },
      gender: 'male',
    })
    const caseB = makeMinimalCaseV2('B-001', 'classic', {
      expectedResult: {
        dayMasterElement: '木',
        primaryPattern: '正官格',
        strengthLevel: '偏强',
        primaryXiShen: '水',
        primaryYongShen: '木',
        tenGodSummary: '正官透出',
      },
      gender: 'male',
    })
    expect(calculateSimilarityScore(caseA, caseB)).toBe(100)
  })

  test('completely different cases score 0', () => {
    const caseA = makeMinimalCaseV2('A-002', 'classic', {
      expectedResult: {
        dayMasterElement: '木',
        primaryPattern: '正官格',
        strengthLevel: '偏强',
        primaryXiShen: '水',
        tenGodSummary: 'A',
      },
      gender: 'male',
    })
    const caseB = makeMinimalCaseV2('B-002', 'classic', {
      expectedResult: {
        dayMasterElement: '火',
        primaryPattern: '偏财格',
        strengthLevel: '偏弱',
        primaryXiShen: '木',
        tenGodSummary: 'B',
      },
      gender: 'female',
    })
    expect(calculateSimilarityScore(caseA, caseB)).toBe(0)
  })

  test('dayMasterElement match adds 20', () => {
    const caseA = makeMinimalCaseV2('A-003', 'classic', {
      expectedResult: { dayMasterElement: '木' },
      gender: 'male',
    })
    const caseB = makeMinimalCaseV2('B-003', 'classic', {
      expectedResult: { dayMasterElement: '木' },
      gender: 'female',
    })
    expect(calculateSimilarityScore(caseA, caseB)).toBe(20)
  })

  test('gender match adds 5', () => {
    const caseA = makeMinimalCaseV2('A-004', 'classic', {
      expectedResult: { dayMasterElement: '木' },
      gender: 'male',
    })
    const caseB = makeMinimalCaseV2('B-004', 'classic', {
      expectedResult: { dayMasterElement: '火' },
      gender: 'male',
    })
    expect(calculateSimilarityScore(caseA, caseB)).toBe(5)
  })

  test('pattern match adds 25', () => {
    const caseA = makeMinimalCaseV2('A-005', 'classic', {
      expectedResult: { primaryPattern: '正官格' },
      gender: 'male',
    })
    const caseB = makeMinimalCaseV2('B-005', 'classic', {
      expectedResult: { primaryPattern: '正官格' },
      gender: 'female',
    })
    expect(calculateSimilarityScore(caseA, caseB)).toBe(25)
  })

  test('strength match adds 15', () => {
    const caseA = makeMinimalCaseV2('A-006', 'classic', {
      expectedResult: { strengthLevel: '偏强' },
      gender: 'male',
    })
    const caseB = makeMinimalCaseV2('B-006', 'classic', {
      expectedResult: { strengthLevel: '偏强' },
      gender: 'female',
    })
    expect(calculateSimilarityScore(caseA, caseB)).toBe(15)
  })

  test('xiShen match adds 25', () => {
    const caseA = makeMinimalCaseV2('A-007', 'classic', {
      expectedResult: { primaryXiShen: '水' },
      gender: 'male',
    })
    const caseB = makeMinimalCaseV2('B-007', 'classic', {
      expectedResult: { primaryXiShen: '水' },
      gender: 'female',
    })
    expect(calculateSimilarityScore(caseA, caseB)).toBe(25)
  })

  test('yongShen match also adds 25', () => {
    const caseA = makeMinimalCaseV2('A-008', 'classic', {
      expectedResult: { primaryYongShen: '木' },
      gender: 'male',
    })
    const caseB = makeMinimalCaseV2('B-008', 'classic', {
      expectedResult: { primaryYongShen: '木' },
      gender: 'female',
    })
    expect(calculateSimilarityScore(caseA, caseB)).toBe(25)
  })
})

// ═══════════════════════════════════════════
// Group 4: findSimilarCasesForReport
// ═══════════════════════════════════════════

describe('findSimilarCasesForReport', () => {
  beforeEach(() => {
    clearCaseStoreV2()
  })

  test('returns correct structure', () => {
    const report = makeMinimalMasterReport()
    const result = findSimilarCasesForReport(report)
    expect(result.targetCaseId).toBeDefined()
    expect(result.topRecommendations).toBeInstanceOf(Array)
    expect(result.summary).toBeTypeOf('string')
    expect(result.generatedAt).toBeTypeOf('number')
  })

  test('returns top recommendations sorted by similarity', () => {
    const report = makeMinimalMasterReport()

    // 高度匹配（70 分：日主五行20 + 格局25 + 强弱15 + 喜用神0 + 性别0 + 十神0）
    // 实际上：日主五行20 + 格局25 + 强弱15 + 喜用神25 = 85（xiShen=水匹配）
    addCaseV2(makeMinimalCaseV2('HIGH-001', 'classic', {
      expectedResult: {
        dayMasterElement: '木',
        primaryPattern: '正官格',
        strengthLevel: '偏强',
        primaryXiShen: '水',
      },
      gender: 'male',
      reliability: 90,
    }))

    // 中度匹配（20 分：仅日主五行）
    addCaseV2(makeMinimalCaseV2('MID-001', 'classic', {
      expectedResult: {
        dayMasterElement: '木',
        primaryPattern: '偏财格',
        strengthLevel: '偏弱',
        primaryXiShen: '金',
      },
      gender: 'female',
      reliability: 60,
    }))

    // 低匹配（0 分）
    addCaseV2(makeMinimalCaseV2('LOW-001', 'classic', {
      expectedResult: {
        dayMasterElement: '火',
        primaryPattern: '偏财格',
        strengthLevel: '偏弱',
        primaryXiShen: '木',
      },
      gender: 'female',
      reliability: 50,
    }))

    const result = findSimilarCasesForReport(report, { limit: 3 })
    expect(result.topRecommendations.length).toBe(3)
    expect(result.topRecommendations[0].caseId).toBe('HIGH-001')
    expect(result.topRecommendations[0].similarityScore).toBeGreaterThan(
      result.topRecommendations[1].similarityScore,
    )
  })

  test('default limit is 5', () => {
    const report = makeMinimalMasterReport()
    for (let i = 0; i < 10; i++) {
      addCaseV2(makeMinimalCaseV2(`CASE-${i}`, 'classic', {
        expectedResult: { dayMasterElement: '木' },
        reliability: 80,
      }))
    }
    const result = findSimilarCasesForReport(report)
    expect(result.topRecommendations.length).toBeLessThanOrEqual(5)
  })

  test('options.limit overrides default', () => {
    const report = makeMinimalMasterReport()
    for (let i = 0; i < 10; i++) {
      addCaseV2(makeMinimalCaseV2(`CASE-${i}`, 'classic', {
        expectedResult: { dayMasterElement: '木' },
        reliability: 80,
      }))
    }
    const result = findSimilarCasesForReport(report, { limit: 3 })
    expect(result.topRecommendations.length).toBeLessThanOrEqual(3)
  })

  test('options.minSimilarity filters low scores', () => {
    const report = makeMinimalMasterReport()
    addCaseV2(makeMinimalCaseV2('MATCH-001', 'classic', {
      expectedResult: { dayMasterElement: '木', primaryPattern: '正官格' },
      reliability: 80,
    }))
    addCaseV2(makeMinimalCaseV2('NOMATCH-001', 'classic', {
      expectedResult: { dayMasterElement: '火', primaryPattern: '偏财格' },
      reliability: 80,
    }))

    const result = findSimilarCasesForReport(report, { minSimilarity: 20, limit: 10 })
    expect(result.topRecommendations.every(r => r.similarityScore >= 20)).toBe(true)
  })

  test('options.minReliability filters unreliable cases', () => {
    const report = makeMinimalMasterReport()
    addCaseV2(makeMinimalCaseV2('RELIABLE-001', 'classic', {
      expectedResult: { dayMasterElement: '木' },
      reliability: 80,
    }))
    addCaseV2(makeMinimalCaseV2('UNRELIABLE-001', 'classic', {
      expectedResult: { dayMasterElement: '木' },
      reliability: 30,
    }))

    const result = findSimilarCasesForReport(report, { minReliability: 50, limit: 10 })
    expect(result.topRecommendations.every(r => r.reliability >= 50)).toBe(true)
  })

  test('each recommendation contains credibilityNote', () => {
    const report = makeMinimalMasterReport()
    addCaseV2(makeMinimalCaseV2('CRED-001', 'classic', {
      expectedResult: { dayMasterElement: '木' },
      reliability: 85,
    }))

    const result = findSimilarCasesForReport(report, { limit: 10 })
    expect(result.topRecommendations.length).toBeGreaterThan(0)
    for (const rec of result.topRecommendations) {
      expect(rec.credibilityNote).toBeTypeOf('string')
      expect(rec.credibilityNote.length).toBeGreaterThan(0)
    }
  })

  test('each recommendation contains historicalResult and suggestion', () => {
    const report = makeMinimalMasterReport()
    addCaseV2(makeMinimalCaseV2('HIST-001', 'classic', {
      expectedResult: { dayMasterElement: '木', primaryXiShen: '水' },
      reliability: 70,
    }))

    const result = findSimilarCasesForReport(report, { limit: 10 })
    expect(result.topRecommendations.length).toBeGreaterThan(0)
    for (const rec of result.topRecommendations) {
      expect(rec.historicalResult).toBeTypeOf('string')
      expect(rec.suggestion).toBeTypeOf('string')
    }
  })

  test('summary is non-empty when matches exist', () => {
    const report = makeMinimalMasterReport()
    addCaseV2(makeMinimalCaseV2('SUM-001', 'classic', {
      expectedResult: { dayMasterElement: '木' },
      reliability: 70,
    }))

    const result = findSimilarCasesForReport(report, { limit: 10 })
    expect(result.summary.length).toBeGreaterThan(0)
    expect(result.summary).toContain('甲')
  })

  test('summary indicates no matches when empty', () => {
    const report = makeMinimalMasterReport()
    // 不添加任何案例，数据库为空
    const result = findSimilarCasesForReport(report)
    expect(result.topRecommendations.length).toBe(0)
    expect(result.summary).toContain('未找到')
  })

  test('includeDifferences false clears differences array', () => {
    const report = makeMinimalMasterReport()
    addCaseV2(makeMinimalCaseV2('DIFF-001', 'classic', {
      expectedResult: {
        dayMasterElement: '火',
        primaryPattern: '偏财格',
        strengthLevel: '偏弱',
        primaryXiShen: '木',
      },
      reliability: 70,
    }))

    const resultWithDiff = findSimilarCasesForReport(report, { limit: 10, includeDifferences: true })
    const resultWithoutDiff = findSimilarCasesForReport(report, { limit: 10, includeDifferences: false })

    expect(resultWithDiff.topRecommendations[0].differences.length).toBeGreaterThan(0)
    expect(resultWithoutDiff.topRecommendations[0].differences.length).toBe(0)
  })
})
