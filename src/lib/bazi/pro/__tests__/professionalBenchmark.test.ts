/**
 * 行业基准对比 — 测试
 *
 * 覆盖：数据源注册、单源对比、行业基准报告、数据源管理
 */

import { describe, test, expect, beforeEach } from 'vitest'

import {
  registerBenchmarkSource,
  compareWithSource,
  runIndustryBenchmark,
  getRegisteredSources,
  getOverallIndustryAgreement,
  removeBenchmarkSource,
  clearAllBenchmarkSources,
  getBenchmarkEntryCount,
  PROFESSIONAL_BENCHMARK_VERSION,
} from '../professionalBenchmarkEngine'

import type {
  BenchmarkEntry,
  SourceBenchmarkResult,
  IndustryBenchmarkReport,
  BenchmarkSource,
} from '../professionalBenchmarkTypes'

import type { CaseEntryV2 } from '../caseLibraryTypesV2'

// ═══════════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════════

function createTestEntry(overrides: Partial<BenchmarkEntry> = {}): BenchmarkEntry {
  return {
    caseId: 'BM-CASE-001',
    source: 'test-source',
    sourceName: '测试数据源',
    expectedResult: {
      primaryPattern: '正官格',
      strengthLevel: '身旺',
      primaryXiShen: '金',
      primaryYongShen: '金',
      tenGodSummary: '比肩、正官、正印',
    },
    confidence: 0.8,
    ...overrides,
  }
}

function createTestCaseForCompare(expectedResult: CaseEntryV2['expectedResult'] = {}): CaseEntryV2 {
  return {
    caseId: 'BM-CASE-001',
    category: 'anonymous',
    yearGan: '甲',
    yearZhi: '子',
    monthGan: '丙',
    monthZhi: '寅',
    dayGan: '甲',
    dayZhi: '午',
    hourGan: '戊',
    hourZhi: '辰',
    gender: 'male',
    expectedResult,
    qualityScore: 80,
    starRating: 4,
    confidence: 0.85,
    excludeFromLearning: false,
    verifiedBy: [],
    reviewStatus: 'approved',
    source: 'xuanfengmen',
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
    reliability: 0.8,
    reliabilityDimensions: {
      dataCompleteness: 80,
      sourceCredibility: 70,
      expertCount: 2,
      consensusRate: 75,
      citationCount: 3,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

// ═══════════════════════════════════════════════════════════════
// 测试
// ═══════════════════════════════════════════════════════════════

describe('professionalBenchmarkEngine — 版本号', () => {
  test('PROFESSIONAL_BENCHMARK_VERSION 应为 1.0.0', () => {
    expect(PROFESSIONAL_BENCHMARK_VERSION).toBe('1.0.0')
  })
})

describe('registerBenchmarkSource — 数据源注册', () => {
  beforeEach(() => {
    clearAllBenchmarkSources()
  })

  test('正常注册数据源返回 true', () => {
    const entries = [
      createTestEntry(),
      createTestEntry({ caseId: 'BM-CASE-002' }),
    ]
    const result = registerBenchmarkSource('wenzhen', '问真八字', entries)
    expect(result).toBe(true)
  })

  test('注册后可通过 getRegisteredSources 获取', () => {
    const entries = [createTestEntry()]
    registerBenchmarkSource('wenzhen', '问真八字', entries)

    const sources = getRegisteredSources()
    expect(sources).toHaveLength(1)
    expect(sources[0].source).toBe('wenzhen')
    expect(sources[0].name).toBe('问真八字')
    expect(sources[0].entryCount).toBe(1)
  })

  test('空 source 返回 false', () => {
    const entries = [createTestEntry()]
    expect(registerBenchmarkSource('', '问真八字', entries)).toBe(false)
  })

  test('空 name 返回 false', () => {
    const entries = [createTestEntry()]
    expect(registerBenchmarkSource('wenzhen', '', entries)).toBe(false)
  })

  test('空 entries 返回 false', () => {
    expect(registerBenchmarkSource('wenzhen', '问真八字', [])).toBe(false)
  })

  test('条目缺少 caseId 返回 false', () => {
    const entries = [createTestEntry({ caseId: '', source: 'test', sourceName: 'test' })]
    expect(registerBenchmarkSource('wenzhen', '问真八字', entries)).toBe(false)
  })

  test('可注册多个数据源', () => {
    registerBenchmarkSource('wenzhen', '问真八字', [createTestEntry({ caseId: 'A', source: 'wenzhen', sourceName: '问真八字' })])
    registerBenchmarkSource('ziping', '子平八字', [createTestEntry({ caseId: 'B', source: 'ziping', sourceName: '子平八字' })])

    const sources = getRegisteredSources()
    expect(sources).toHaveLength(2)
  })

  test('getBenchmarkEntryCount 返回正确条目数', () => {
    registerBenchmarkSource('wenzhen', '问真八字', [
      createTestEntry({ caseId: 'A', source: 'wenzhen', sourceName: '问真八字' }),
      createTestEntry({ caseId: 'B', source: 'wenzhen', sourceName: '问真八字' }),
      createTestEntry({ caseId: 'C', source: 'wenzhen', sourceName: '问真八字' }),
    ])

    expect(getBenchmarkEntryCount('wenzhen')).toBe(3)
    expect(getBenchmarkEntryCount('nonexistent')).toBe(0)
  })
})

describe('compareWithSource — 单源对比', () => {
  beforeEach(() => {
    clearAllBenchmarkSources()
  })

  test('未注册的数据源返回空结果', () => {
    const caseEntry = createTestCaseForCompare()
    const result = compareWithSource(caseEntry, 'nonexistent')

    expect(result.source).toBe('nonexistent')
    expect(result.totalCases).toBe(0)
    expect(result.overallAgreement).toBe(0)
    expect(result.fieldAgreements).toHaveLength(0)
  })

  test('完全一致的字段 match 为 true', () => {
    const entry = createTestEntry({
      caseId: 'BM-CASE-001',
      source: 'test-src',
      sourceName: '测试数据源',
      expectedResult: {
        primaryPattern: '正官格',
        strengthLevel: '身旺',
        primaryXiShen: '金',
      },
    })
    registerBenchmarkSource('test-src', '测试数据源', [entry])

    const caseEntry = createTestCaseForCompare({
      primaryPattern: '正官格',
      strengthLevel: '身旺',
      primaryXiShen: '金',
    })

    const result = compareWithSource(caseEntry, 'test-src')
    expect(result.overallAgreement).toBeGreaterThan(0)

    const matchedFields = result.fieldAgreements.filter((f) => f.match)
    expect(matchedFields.length).toBeGreaterThanOrEqual(3)
  })

  test('不一致的字段 match 为 false', () => {
    const entry = createTestEntry({
      caseId: 'BM-CASE-001',
      source: 'test-src',
      sourceName: '测试数据源',
      expectedResult: {
        primaryPattern: '从财格',
        strengthLevel: '身弱',
        primaryXiShen: '水',
      },
    })
    registerBenchmarkSource('test-src', '测试数据源', [entry])

    const caseEntry = createTestCaseForCompare({
      primaryPattern: '正官格',
      strengthLevel: '身旺',
      primaryXiShen: '金',
    })

    const result = compareWithSource(caseEntry, 'test-src')
    const unmatchedFields = result.fieldAgreements.filter((f) => !f.match)
    expect(unmatchedFields.length).toBeGreaterThanOrEqual(3)
  })

  test('每个 BenchmarkComparison 包含必需字段', () => {
    const entry = createTestEntry({
      caseId: 'BM-CASE-001',
      source: 'test-src',
      sourceName: '测试数据源',
    })
    registerBenchmarkSource('test-src', '测试数据源', [entry])

    const caseEntry = createTestCaseForCompare()
    const result = compareWithSource(caseEntry, 'test-src')

    expect(result.fieldAgreements.length).toBeGreaterThan(0)
    for (const comp of result.fieldAgreements) {
      expect(comp.field).toBeTruthy()
      expect(typeof comp.match).toBe('boolean')
      expect(typeof comp.matchScore).toBe('number')
      expect(comp.matchScore).toBeGreaterThanOrEqual(0)
      expect(comp.matchScore).toBeLessThanOrEqual(1)
    }
  })

  test('一方有值一方无值时 matchScore 为 0', () => {
    const entry = createTestEntry({
      caseId: 'BM-CASE-001',
      source: 'test-src',
      sourceName: '测试数据源',
      expectedResult: {
        primaryPattern: '正官格',
      },
    })
    registerBenchmarkSource('test-src', '测试数据源', [entry])

    const caseEntry = createTestCaseForCompare({
      primaryPattern: undefined,
      strengthLevel: '身旺',
    })

    const result = compareWithSource(caseEntry, 'test-src')
    const patternComp = result.fieldAgreements.find((f) => f.field === 'primaryPattern')
    expect(patternComp).toBeDefined()
    expect(patternComp!.match).toBe(false)
    expect(patternComp!.matchScore).toBe(0)
  })
})

describe('runIndustryBenchmark — 行业基准报告', () => {
  beforeEach(() => {
    clearAllBenchmarkSources()
  })

  test('无数据源时返回空报告', () => {
    const report = runIndustryBenchmark()

    expect(report.version).toBe(PROFESSIONAL_BENCHMARK_VERSION)
    expect(report.sources).toHaveLength(0)
    expect(report.avgIndustryAgreement).toBe(0)
    expect(report.bestSource).toBe('')
    expect(report.worstSource).toBe('')
    expect(report.recommendations.length).toBeGreaterThan(0)
    expect(report.generatedAt).toBeGreaterThan(0)
  })

  test('有数据源时返回完整报告', () => {
    registerBenchmarkSource('wenzhen', '问真八字', [
      createTestEntry({ caseId: 'A', source: 'wenzhen', sourceName: '问真八字' }),
    ])
    registerBenchmarkSource('ziping', '子平八字', [
      createTestEntry({ caseId: 'B', source: 'ziping', sourceName: '子平八字' }),
    ])

    const report = runIndustryBenchmark()

    expect(report.sources).toHaveLength(2)
    expect(report.generatedAt).toBeGreaterThan(0)
    expect(report.avgIndustryAgreement).toBeGreaterThanOrEqual(0)
    expect(report.bestSource).toBeTruthy()
    expect(report.worstSource).toBeTruthy()
    expect(report.recommendations.length).toBeGreaterThan(0)
  })

  test('指定数据源列表时只对比指定的数据源', () => {
    registerBenchmarkSource('wenzhen', '问真八字', [
      createTestEntry({ caseId: 'A', source: 'wenzhen', sourceName: '问真八字' }),
    ])
    registerBenchmarkSource('ziping', '子平八字', [
      createTestEntry({ caseId: 'B', source: 'ziping', sourceName: '子平八字' }),
    ])

    const report = runIndustryBenchmark(['wenzhen'])

    expect(report.sources).toHaveLength(1)
    expect(report.sources[0].source).toBe('wenzhen')
  })

  test('recommendations 包含有意义的建议', () => {
    registerBenchmarkSource('wenzhen', '问真八字', [
      createTestEntry({ caseId: 'A', source: 'wenzhen', sourceName: '问真八字' }),
    ])

    const report = runIndustryBenchmark()

    for (const rec of report.recommendations) {
      expect(rec.length).toBeGreaterThan(0)
    }

    // 不足 3 个数据源时应建议注册更多
    const hasMoreSourcesSuggestion = report.recommendations.some(
      (r) => r.includes('注册') || r.includes('数据源'),
    )
    expect(hasMoreSourcesSuggestion).toBe(true)
  })
})

describe('removeBenchmarkSource — 数据源移除', () => {
  beforeEach(() => {
    clearAllBenchmarkSources()
  })

  test('移除已注册的数据源返回 true', () => {
    registerBenchmarkSource('wenzhen', '问真八字', [
      createTestEntry({ caseId: 'A', source: 'wenzhen', sourceName: '问真八字' }),
    ])
    expect(removeBenchmarkSource('wenzhen')).toBe(true)
    expect(getRegisteredSources()).toHaveLength(0)
  })

  test('移除不存在的数据源返回 false', () => {
    expect(removeBenchmarkSource('nonexistent')).toBe(false)
  })

  test('空 source 返回 false', () => {
    expect(removeBenchmarkSource('')).toBe(false)
  })
})

describe('getOverallIndustryAgreement — 平均一致率', () => {
  beforeEach(() => {
    clearAllBenchmarkSources()
  })

  test('无数据源时返回 0', () => {
    expect(getOverallIndustryAgreement()).toBe(0)
  })

  test('有数据源时返回非负数', () => {
    registerBenchmarkSource('wenzhen', '问真八字', [
      createTestEntry({ caseId: 'A', source: 'wenzhen', sourceName: '问真八字' }),
    ])
    const agreement = getOverallIndustryAgreement()
    expect(agreement).toBeGreaterThanOrEqual(0)
  })
})

describe('clearAllBenchmarkSources — 清除所有数据源', () => {
  beforeEach(() => {
    clearAllBenchmarkSources()
  })

  test('清除后 getRegisteredSources 返回空', () => {
    registerBenchmarkSource('wenzhen', '问真八字', [
      createTestEntry({ caseId: 'A', source: 'wenzhen', sourceName: '问真八字' }),
    ])
    registerBenchmarkSource('ziping', '子平八字', [
      createTestEntry({ caseId: 'B', source: 'ziping', sourceName: '子平八字' }),
    ])

    clearAllBenchmarkSources()

    expect(getRegisteredSources()).toHaveLength(0)
    expect(getOverallIndustryAgreement()).toBe(0)
  })
})
