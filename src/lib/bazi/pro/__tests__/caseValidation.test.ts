/**
 * V4.5 Case Library — 命例验证引擎 测试文件
 *
 * 覆盖范围：
 * - 版本号
 * - 数据库三大命例集（经典 / 匿名 / 回归）
 * - 查询函数
 * - 类型工具函数
 * - 回归引擎默认运行、报告结构、按类别验证、阈值
 * - 单个验证结果与字段比对
 * - 边界情况
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { runRegression, CASE_LIBRARY_VERSION } from '../caseValidationEngine'
import {
  CLASSIC_CASES,
  ANONYMOUS_CASES,
  REGRESSION_CASES,
  getClassicCases,
  getAnonymousCases,
  getRegressionCases,
  getAllCases,
  getCaseById,
  getCasesByCategory,
  getTotalCaseCount,
} from '../caseDatabase'
import {
  isClassicCase,
  getCaseCategory,
  generateCaseId,
} from '../caseLibraryTypes'
import type {
  ClassicCase,
  AnonymousCase,
  RegressionCase,
  RegressionReport,
  CaseValidationResult,
  FieldComparison,
} from '../caseLibraryTypes'

// ═══════════════════════════════════════════════════════════════
// 顶层 describe
// ═══════════════════════════════════════════════════════════════

describe('V4.5 Case Library', () => {
  // 总览测试：所有命例数据均存在
  it('三大命例集均有数据', () => {
    expect(CLASSIC_CASES.length).toBeGreaterThan(0)
    expect(ANONYMOUS_CASES.length).toBeGreaterThan(0)
    expect(REGRESSION_CASES.length).toBeGreaterThan(0)
  })

  it('getAllCases 长度等于三类之和', () => {
    expect(getAllCases().length).toBe(
      CLASSIC_CASES.length + ANONYMOUS_CASES.length + REGRESSION_CASES.length,
    )
  })
})

// ═══════════════════════════════════════════════════════════════
// 版本号
// ═══════════════════════════════════════════════════════════════

describe('版本号', () => {
  it('CASE_LIBRARY_VERSION === "1.0.0"', () => {
    expect(CASE_LIBRARY_VERSION).toBe('1.0.0')
  })

  it('CASE_LIBRARY_VERSION 是语义化版本格式', () => {
    expect(CASE_LIBRARY_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})

// ═══════════════════════════════════════════════════════════════
// Database: 经典命例
// ═══════════════════════════════════════════════════════════════

describe('Database: 经典命例', () => {
  it('CLASSIC_CASES 长度 === 10', () => {
    expect(CLASSIC_CASES.length).toBe(10)
  })

  it('每条有 caseId / name / description / source / dynasty / gender / expectedResult', () => {
    for (const c of CLASSIC_CASES) {
      expect(c).toHaveProperty('caseId')
      expect(c).toHaveProperty('name')
      expect(c).toHaveProperty('description')
      expect(c).toHaveProperty('source')
      expect(c).toHaveProperty('dynasty')
      expect(c).toHaveProperty('gender')
      expect(c).toHaveProperty('expectedResult')
    }
  })

  it('每条有四柱八字段（yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, hourGan, hourZhi）', () => {
    const pillarFields = [
      'yearGan', 'yearZhi', 'monthGan', 'monthZhi',
      'dayGan', 'dayZhi', 'hourGan', 'hourZhi',
    ] as const
    for (const c of CLASSIC_CASES) {
      for (const f of pillarFields) {
        expect(c).toHaveProperty(f)
        expect(typeof c[f]).toBe('string')
      }
    }
  })

  it('CLS-001 存在', () => {
    const cls001 = CLASSIC_CASES.find((c) => c.caseId === 'CLS-001')
    expect(cls001).toBeDefined()
  })

  it('expectedResult 有 dayMasterElement', () => {
    for (const c of CLASSIC_CASES) {
      expect(c.expectedResult.dayMasterElement).toBeDefined()
    }
  })

  it('来源包含真实古籍名', () => {
    const knownSources = [
      '《三命通会》', '《滴天髓》', '《子平真诠》',
      '《渊海子平》', '《穷通宝鉴》', '《神峰通考》',
    ]
    for (const c of CLASSIC_CASES) {
      expect(knownSources).toContain(c.source)
    }
  })

  it('所有 caseId 以 CLS- 开头', () => {
    for (const c of CLASSIC_CASES) {
      expect(c.caseId).toMatch(/^CLS-\d{3}$/)
    }
  })

  it('gender 只包含 male 或 female', () => {
    for (const c of CLASSIC_CASES) {
      expect(['male', 'female']).toContain(c.gender)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// Database: 匿名命例
// ═══════════════════════════════════════════════════════════════

describe('Database: 匿名命例', () => {
  it('ANONYMOUS_CASES 长度 === 5', () => {
    expect(ANONYMOUS_CASES.length).toBe(5)
  })

  it('每条有 caseId / gender / expectedResult / confidence / source', () => {
    for (const c of ANONYMOUS_CASES) {
      expect(c).toHaveProperty('caseId')
      expect(c).toHaveProperty('gender')
      expect(c).toHaveProperty('expectedResult')
      expect(c).toHaveProperty('confidence')
      expect(c).toHaveProperty('source')
    }
  })

  it('confidence 在 0~1 之间', () => {
    for (const c of ANONYMOUS_CASES) {
      expect(c.confidence).toBeGreaterThanOrEqual(0)
      expect(c.confidence).toBeLessThanOrEqual(1)
    }
  })

  it('所有 caseId 以 ANM- 开头', () => {
    for (const c of ANONYMOUS_CASES) {
      expect(c.caseId).toMatch(/^ANM-\d{3}$/)
    }
  })

  it('source 是合法来源标识', () => {
    const validSources = ['manual-entry', 'user-submitted', 'expert-annotated']
    for (const c of ANONYMOUS_CASES) {
      expect(validSources).toContain(c.source)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// Database: 回归样本
// ═══════════════════════════════════════════════════════════════

describe('Database: 回归样本', () => {
  it('REGRESSION_CASES 长度 === 10', () => {
    expect(REGRESSION_CASES.length).toBe(10)
  })

  it('每条有 caseId / gender / expectedResult / snapshotVersion / snapshotAt', () => {
    for (const c of REGRESSION_CASES) {
      expect(c).toHaveProperty('caseId')
      expect(c).toHaveProperty('gender')
      expect(c).toHaveProperty('expectedResult')
      expect(c).toHaveProperty('snapshotVersion')
      expect(c).toHaveProperty('snapshotAt')
    }
  })

  it('snapshotVersion === "7.0.0"', () => {
    for (const c of REGRESSION_CASES) {
      expect(c.snapshotVersion).toBe('7.0.0')
    }
  })

  it('snapshotAt 是有效的时间戳（毫秒）', () => {
    for (const c of REGRESSION_CASES) {
      expect(c.snapshotAt).toBeGreaterThan(0)
      // 验证是合理的毫秒级时间戳
      expect(c.snapshotAt).toBeGreaterThan(1_000_000_000_000)
    }
  })

  it('所有 caseId 以 REG- 开头', () => {
    for (const c of REGRESSION_CASES) {
      expect(c.caseId).toMatch(/^REG-\d{3}$/)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// Database: 查询函数
// ═══════════════════════════════════════════════════════════════

describe('Database: 查询函数', () => {
  it('getClassicCases() 返回 CLASSIC_CASES', () => {
    const result = getClassicCases()
    expect(result.length).toBe(CLASSIC_CASES.length)
    for (let i = 0; i < result.length; i++) {
      expect(result[i].caseId).toBe(CLASSIC_CASES[i].caseId)
    }
  })

  it('getAnonymousCases() 返回 ANONYMOUS_CASES', () => {
    const result = getAnonymousCases()
    expect(result.length).toBe(ANONYMOUS_CASES.length)
    for (let i = 0; i < result.length; i++) {
      expect(result[i].caseId).toBe(ANONYMOUS_CASES[i].caseId)
    }
  })

  it('getRegressionCases() 返回 REGRESSION_CASES', () => {
    const result = getRegressionCases()
    expect(result.length).toBe(REGRESSION_CASES.length)
    for (let i = 0; i < result.length; i++) {
      expect(result[i].caseId).toBe(REGRESSION_CASES[i].caseId)
    }
  })

  it('getAllCases() 长度 === 25', () => {
    expect(getAllCases().length).toBe(25)
  })

  it('getCaseById("CLS-001") 存在', () => {
    const entry = getCaseById('CLS-001')
    expect(entry).toBeDefined()
    expect(entry!.caseId).toBe('CLS-001')
  })

  it('getCaseById("不存在的ID") === undefined', () => {
    const entry = getCaseById('不存在的ID')
    expect(entry).toBeUndefined()
  })

  it('getCasesByCategory("classic") 长度 === 10', () => {
    const result = getCasesByCategory('classic')
    expect(result.length).toBe(10)
  })

  it('getCasesByCategory("anonymous") 长度 === 5', () => {
    const result = getCasesByCategory('anonymous')
    expect(result.length).toBe(5)
  })

  it('getCasesByCategory("regression") 长度 === 10', () => {
    const result = getCasesByCategory('regression')
    expect(result.length).toBe(10)
  })

  it('getTotalCaseCount() 返回 { classic: 10, anonymous: 5, regression: 10, total: 25 }', () => {
    const counts = getTotalCaseCount()
    expect(counts).toEqual({
      classic: 10,
      anonymous: 5,
      regression: 10,
      total: 25,
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// Types: 工具函数
// ═══════════════════════════════════════════════════════════════

describe('Types: 工具函数', () => {
  it('isClassicCase(CLASSIC_CASES[0]) === true', () => {
    expect(isClassicCase(CLASSIC_CASES[0])).toBe(true)
  })

  it('isClassicCase(ANONYMOUS_CASES[0]) === false', () => {
    expect(isClassicCase(ANONYMOUS_CASES[0])).toBe(false)
  })

  it('isClassicCase(REGRESSION_CASES[0]) === false', () => {
    expect(isClassicCase(REGRESSION_CASES[0])).toBe(false)
  })

  it('getCaseCategory(CLASSIC_CASES[0]) === "classic"', () => {
    expect(getCaseCategory(CLASSIC_CASES[0])).toBe('classic')
  })

  it('getCaseCategory(ANONYMOUS_CASES[0]) === "anonymous"', () => {
    expect(getCaseCategory(ANONYMOUS_CASES[0])).toBe('anonymous')
  })

  it('getCaseCategory(REGRESSION_CASES[0]) === "regression"', () => {
    expect(getCaseCategory(REGRESSION_CASES[0])).toBe('regression')
  })

  it('generateCaseId("classic") 以 "CLS-" 开头', () => {
    const id = generateCaseId('classic')
    expect(id).toMatch(/^CLS-/)
  })

  it('generateCaseId("anonymous") 以 "ANM-" 开头', () => {
    const id = generateCaseId('anonymous')
    expect(id).toMatch(/^ANM-/)
  })

  it('generateCaseId("regression") 以 "REG-" 开头', () => {
    const id = generateCaseId('regression')
    expect(id).toMatch(/^REG-/)
  })

  it('generateCaseId 生成的 ID 是唯一的（高概率）', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateCaseId('classic')))
    // 100 个随机 ID 应该几乎全部唯一
    expect(ids.size).toBeGreaterThanOrEqual(95)
  })
})

// ═══════════════════════════════════════════════════════════════
// Engine: 默认回归
// ═══════════════════════════════════════════════════════════════

describe('Engine: 默认回归', () => {
  let report: RegressionReport

  beforeAll(() => {
    report = runRegression()
  })

  it('runRegression() 返回 RegressionReport', () => {
    expect(report).toBeDefined()
    expect(report.totalCases).toBeDefined()
    expect(report.totalPassed).toBeDefined()
    expect(report.overallConsistencyRate).toBeDefined()
    expect(report.categoryConsistency).toBeDefined()
  })

  it('totalCases === 25', () => {
    expect(report.totalCases).toBe(25)
  })

  it('totalPassed === 25（自回归模式全部通过）', () => {
    expect(report.totalPassed).toBe(25)
  })

  it('overallConsistencyRate === 1.0', () => {
    expect(report.overallConsistencyRate).toBe(1.0)
  })

  it('categoryConsistency.classic === 1.0', () => {
    expect(report.categoryConsistency.classic).toBe(1.0)
  })

  it('categoryConsistency.anonymous === 1.0', () => {
    expect(report.categoryConsistency.anonymous).toBe(1.0)
  })

  it('categoryConsistency.regression === 1.0', () => {
    expect(report.categoryConsistency.regression).toBe(1.0)
  })
})

// ═══════════════════════════════════════════════════════════════
// Engine: 报告结构
// ═══════════════════════════════════════════════════════════════

describe('Engine: 报告结构', () => {
  let report: RegressionReport

  beforeAll(() => {
    report = runRegression()
  })

  it('report.version 存在', () => {
    expect(report.version).toBeDefined()
    expect(typeof report.version).toBe('string')
  })

  it('report.generatedAt 存在', () => {
    expect(report.generatedAt).toBeDefined()
    expect(typeof report.generatedAt).toBe('number')
    expect(report.generatedAt).toBeGreaterThan(0)
  })

  it('report.engineVersions 存在', () => {
    expect(report.engineVersions).toBeDefined()
    expect(report.engineVersions).toHaveProperty('pillars')
    expect(report.engineVersions).toHaveProperty('shenSha')
    expect(report.engineVersions).toHaveProperty('tenGods')
    expect(report.engineVersions).toHaveProperty('pattern')
    expect(report.engineVersions).toHaveProperty('xiYong')
    expect(report.engineVersions).toHaveProperty('fortune')
    expect(report.engineVersions).toHaveProperty('masterReport')
    expect(report.engineVersions).toHaveProperty('reportExport')
  })

  it('report.classicResults 是数组', () => {
    expect(Array.isArray(report.classicResults)).toBe(true)
  })

  it('report.anonymousResults 是数组', () => {
    expect(Array.isArray(report.anonymousResults)).toBe(true)
  })

  it('report.regressionResults 是数组', () => {
    expect(Array.isArray(report.regressionResults)).toBe(true)
  })

  it('report.fieldConsistency 是对象', () => {
    expect(report.fieldConsistency).toBeDefined()
    expect(typeof report.fieldConsistency).toBe('object')
  })

  it('report.failures 长度 === 0', () => {
    expect(report.failures.length).toBe(0)
  })

  it('report.warnings 是数组', () => {
    expect(Array.isArray(report.warnings)).toBe(true)
  })

  it('report.computeTimeMs >= 0', () => {
    expect(report.computeTimeMs).toBeGreaterThanOrEqual(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// Engine: 按类别验证
// ═══════════════════════════════════════════════════════════════

describe('Engine: 按类别验证', () => {
  it('runRegression({ categories: ["classic"] }).totalCases === 10', () => {
    const report = runRegression({ categories: ['classic'] })
    expect(report.totalCases).toBe(10)
  })

  it('runRegression({ categories: ["anonymous"] }).totalCases === 5', () => {
    const report = runRegression({ categories: ['anonymous'] })
    expect(report.totalCases).toBe(5)
  })

  it('runRegression({ categories: ["regression"] }).totalCases === 10', () => {
    const report = runRegression({ categories: ['regression'] })
    expect(report.totalCases).toBe(10)
  })

  it('runRegression({ categories: ["classic", "anonymous"] }).totalCases === 15', () => {
    const report = runRegression({ categories: ['classic', 'anonymous'] })
    expect(report.totalCases).toBe(15)
  })

  it('按类别验证时 classicResults 只包含对应类别', () => {
    const report = runRegression({ categories: ['classic'] })
    expect(report.classicResults.length).toBe(10)
    expect(report.anonymousResults.length).toBe(0)
    expect(report.regressionResults.length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// Engine: 阈值
// ═══════════════════════════════════════════════════════════════

describe('Engine: 阈值', () => {
  it('threshold: 0.5 时全部通过', () => {
    const report = runRegression({ threshold: 0.5 })
    expect(report.totalPassed).toBe(25)
    expect(report.failures.length).toBe(0)
  })

  it('threshold: 1.0 时全部通过（自回归 100%）', () => {
    const report = runRegression({ threshold: 1.0 })
    expect(report.totalPassed).toBe(25)
    expect(report.failures.length).toBe(0)
  })

  it('threshold: 0.99 时全部通过（自回归 100% > 0.99）', () => {
    const report = runRegression({ threshold: 0.99 })
    expect(report.totalPassed).toBe(25)
    expect(report.overallConsistencyRate).toBe(1.0)
  })
})

// ═══════════════════════════════════════════════════════════════
// Engine: 单个验证结果
// ═══════════════════════════════════════════════════════════════

describe('Engine: 单个验证结果', () => {
  let report: RegressionReport
  let firstResult: CaseValidationResult

  beforeAll(() => {
    report = runRegression()
    firstResult = report.classicResults[0]
  })

  it('CaseValidationResult 有 caseId / category / fieldComparisons / matchCount / totalFields / consistencyRate / passed', () => {
    expect(firstResult).toHaveProperty('caseId')
    expect(firstResult).toHaveProperty('category')
    expect(firstResult).toHaveProperty('fieldComparisons')
    expect(firstResult).toHaveProperty('matchCount')
    expect(firstResult).toHaveProperty('totalFields')
    expect(firstResult).toHaveProperty('consistencyRate')
    expect(firstResult).toHaveProperty('passed')
  })

  it('consistencyRate 在 0~1 之间', () => {
    expect(firstResult.consistencyRate).toBeGreaterThanOrEqual(0)
    expect(firstResult.consistencyRate).toBeLessThanOrEqual(1)
  })

  it('passed === true', () => {
    expect(firstResult.passed).toBe(true)
  })

  it('matchCount 等于 totalFields（自回归全匹配）', () => {
    expect(firstResult.matchCount).toBe(firstResult.totalFields)
    expect(firstResult.matchCount).toBeGreaterThan(0)
  })

  it('所有验证结果的 consistencyRate === 1.0', () => {
    const allResults = [
      ...report.classicResults,
      ...report.anonymousResults,
      ...report.regressionResults,
    ]
    for (const r of allResults) {
      expect(r.consistencyRate).toBe(1.0)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// Engine: FieldComparison
// ═══════════════════════════════════════════════════════════════

describe('Engine: FieldComparison', () => {
  let report: RegressionReport
  let firstComparison: FieldComparison

  beforeAll(() => {
    report = runRegression()
    firstComparison = report.classicResults[0].fieldComparisons[0]
  })

  it('FieldComparison 有 field / expected / actual / match', () => {
    expect(firstComparison).toHaveProperty('field')
    expect(firstComparison).toHaveProperty('expected')
    expect(firstComparison).toHaveProperty('actual')
    expect(firstComparison).toHaveProperty('match')
  })

  it('match === true（自回归模式）', () => {
    expect(firstComparison.match).toBe(true)
  })

  it('expected 等于 actual（自回归模式）', () => {
    expect(firstComparison.expected).toBe(firstComparison.actual)
  })

  it('所有字段比对的 match 均为 true', () => {
    const allComparisons = [
      ...report.classicResults,
      ...report.anonymousResults,
      ...report.regressionResults,
    ].flatMap((r) => r.fieldComparisons)

    for (const comp of allComparisons) {
      expect(comp.match).toBe(true)
      expect(comp.expected).toBe(comp.actual)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// Engine: fieldConsistency 统计
// ═══════════════════════════════════════════════════════════════

describe('Engine: fieldConsistency 统计', () => {
  let report: RegressionReport

  beforeAll(() => {
    report = runRegression()
  })

  it('fieldConsistency 包含 dayMasterElement 字段', () => {
    expect('dayMasterElement' in report.fieldConsistency).toBe(true)
  })

  it('fieldConsistency 包含 primaryPattern 字段', () => {
    expect('primaryPattern' in report.fieldConsistency).toBe(true)
  })

  it('每个字段的一致率 === 1.0', () => {
    for (const [field, rate] of Object.entries(report.fieldConsistency)) {
      expect(rate).toBe(1.0)
    }
  })

  it('fieldConsistency 包含五维评分字段', () => {
    const scoreFields = ['careerScore', 'wealthScore', 'marriageScore', 'healthScore', 'studyScore']
    for (const f of scoreFields) {
      expect(f in report.fieldConsistency).toBe(true)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// Engine: 按 caseIds 过滤
// ═══════════════════════════════════════════════════════════════

describe('Engine: 按 caseIds 过滤', () => {
  it('只验证 CLS-001 时 totalCases === 1', () => {
    const report = runRegression({ caseIds: ['CLS-001'] })
    expect(report.totalCases).toBe(1)
    expect(report.classicResults.length).toBe(1)
    expect(report.classicResults[0].caseId).toBe('CLS-001')
  })

  it('验证多条指定命例', () => {
    const report = runRegression({ caseIds: ['CLS-001', 'ANM-002', 'REG-005'] })
    expect(report.totalCases).toBe(3)
  })

  it('caseIds 和 categories 同时使用时取交集', () => {
    const report = runRegression({
      caseIds: ['CLS-001', 'ANM-001'],
      categories: ['classic'],
    })
    expect(report.totalCases).toBe(1)
    expect(report.classicResults[0].caseId).toBe('CLS-001')
  })
})

// ═══════════════════════════════════════════════════════════════
// Engine: engineVersions 自回归标记
// ═══════════════════════════════════════════════════════════════

describe('Engine: engineVersions 自回归标记', () => {
  let report: RegressionReport

  beforeAll(() => {
    report = runRegression()
  })

  it('所有引擎版本标记为 "N/A (自回归模式)"', () => {
    const expected = 'N/A (自回归模式)'
    expect(report.engineVersions.pillars).toBe(expected)
    expect(report.engineVersions.shenSha).toBe(expected)
    expect(report.engineVersions.tenGods).toBe(expected)
    expect(report.engineVersions.pattern).toBe(expected)
    expect(report.engineVersions.xiYong).toBe(expected)
    expect(report.engineVersions.fortune).toBe(expected)
    expect(report.engineVersions.masterReport).toBe(expected)
    expect(report.engineVersions.reportExport).toBe(expected)
  })
})

// ═══════════════════════════════════════════════════════════════
// Engine: 各类别结果分类正确
// ═══════════════════════════════════════════════════════════════

describe('Engine: 各类别结果分类正确', () => {
  let report: RegressionReport

  beforeAll(() => {
    report = runRegression()
  })

  it('classicResults 长度 === 10', () => {
    expect(report.classicResults.length).toBe(10)
  })

  it('anonymousResults 长度 === 5', () => {
    expect(report.anonymousResults.length).toBe(5)
  })

  it('regressionResults 长度 === 10', () => {
    expect(report.regressionResults.length).toBe(10)
  })

  it('经典命例结果的 category 均为 "classic"', () => {
    for (const r of report.classicResults) {
      expect(r.category).toBe('classic')
    }
  })

  it('匿名命例结果的 category 均为 "anonymous"', () => {
    for (const r of report.anonymousResults) {
      expect(r.category).toBe('anonymous')
    }
  })

  it('回归样本结果的 category 均为 "regression"', () => {
    for (const r of report.regressionResults) {
      expect(r.category).toBe('regression')
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// Edge Cases
// ═══════════════════════════════════════════════════════════════

describe('Edge Cases', () => {
  it('空命例列表（caseIds: ["不存在的ID"]）totalCases === 0', () => {
    const report = runRegression({ caseIds: ['不存在的ID'] })
    expect(report.totalCases).toBe(0)
    expect(report.totalPassed).toBe(0)
    expect(report.failures.length).toBe(0)
  })

  it('runRegression 重复调用结果一致', () => {
    const report1 = runRegression()
    const report2 = runRegression()
    // generatedAt 可能不同，所以只比较核心字段
    expect(report1.totalCases).toBe(report2.totalCases)
    expect(report1.totalPassed).toBe(report2.totalPassed)
    expect(report1.overallConsistencyRate).toBe(report2.overallConsistencyRate)
    expect(report1.categoryConsistency).toEqual(report2.categoryConsistency)
    expect(report1.computeTimeMs).toBeGreaterThanOrEqual(0)
    expect(report2.computeTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('空 categories 数组等价于不传 categories', () => {
    const report1 = runRegression({ categories: [] })
    const report2 = runRegression()
    expect(report1.totalCases).toBe(report2.totalCases)
  })

  it('getCaseById("REG-010") 存在且为回归类', () => {
    const entry = getCaseById('REG-010')
    expect(entry).toBeDefined()
    expect(getCaseCategory(entry!)).toBe('regression')
  })

  it('getCaseById("ANM-005") 存在且为匿名类', () => {
    const entry = getCaseById('ANM-005')
    expect(entry).toBeDefined()
    expect(getCaseCategory(entry!)).toBe('anonymous')
  })

  it('getCaseById("CLS-010") 存在且为经典类', () => {
    const entry = getCaseById('CLS-010')
    expect(entry).toBeDefined()
    expect(getCaseCategory(entry!)).toBe('classic')
  })
})

// ═══════════════════════════════════════════════════════════════
// 经典命例数据完整性（CLT-001 深度检查）
// ═══════════════════════════════════════════════════════════════

describe('经典命例 CLS-001 深度检查', () => {
  let cls001: ClassicCase

  beforeAll(() => {
    cls001 = CLASSIC_CASES[0]
  })

  it('四柱完整：甲子年 丙寅月 甲子日 甲子时', () => {
    expect(cls001.yearGan).toBe('甲')
    expect(cls001.yearZhi).toBe('子')
    expect(cls001.monthGan).toBe('丙')
    expect(cls001.monthZhi).toBe('寅')
    expect(cls001.dayGan).toBe('甲')
    expect(cls001.dayZhi).toBe('子')
    expect(cls001.hourGan).toBe('甲')
    expect(cls001.hourZhi).toBe('子')
  })

  it('expectedResult 包含全部 12 个字段', () => {
    const er = cls001.expectedResult
    expect(er.dayMasterElement).toBe('木')
    expect(er.primaryPattern).toBe('建禄格')
    expect(er.strengthLevel).toBe('偏强')
    expect(er.primaryXiShen).toBe('水')
    expect(er.primaryYongShen).toBe('木')
    expect(er.primaryJiShen).toBe('金')
    expect(typeof er.careerScore).toBe('number')
    expect(typeof er.wealthScore).toBe('number')
    expect(typeof er.marriageScore).toBe('number')
    expect(typeof er.healthScore).toBe('number')
    expect(typeof er.studyScore).toBe('number')
    expect(typeof er.overallScore).toBe('number')
  })

  it('五维评分在 0~100 范围内', () => {
    const er = cls001.expectedResult
    const scores = [er.careerScore, er.wealthScore, er.marriageScore, er.healthScore, er.studyScore, er.overallScore]
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(100)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// 匿名命例 ANM-001 深度检查
// ═══════════════════════════════════════════════════════════════

describe('匿名命例 ANM-001 深度检查', () => {
  let anm001: AnonymousCase

  beforeAll(() => {
    anm001 = ANONYMOUS_CASES[0]
  })

  it('confidence === 0.9', () => {
    expect(anm001.confidence).toBe(0.9)
  })

  it('source === "expert-annotated"', () => {
    expect(anm001.source).toBe('expert-annotated')
  })

  it('没有 name 属性（匿名命例特有）', () => {
    expect('name' in anm001).toBe(false)
  })

  it('没有 dynasty 属性（匿名命例特有）', () => {
    expect('dynasty' in anm001).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// 回归样本 REG-001 深度检查
// ═══════════════════════════════════════════════════════════════

describe('回归样本 REG-001 深度检查', () => {
  let reg001: RegressionCase

  beforeAll(() => {
    reg001 = REGRESSION_CASES[0]
  })

  it('snapshotVersion === "7.0.0"', () => {
    expect(reg001.snapshotVersion).toBe('7.0.0')
  })

  it('snapshotAt 是合理时间戳', () => {
    expect(reg001.snapshotAt).toBe(1752624000000)
  })

  it('没有 name 属性（回归样本特有）', () => {
    expect('name' in reg001).toBe(false)
  })

  it('没有 confidence 属性（回归样本特有）', () => {
    expect('confidence' in reg001).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// getCaseById 边界
// ═══════════════════════════════════════════════════════════════

describe('getCaseById 边界', () => {
  it('空字符串返回 undefined', () => {
    expect(getCaseById('')).toBeUndefined()
  })

  it('大小写敏感：cls-001 返回 undefined', () => {
    expect(getCaseById('cls-001')).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════
// 五行分布覆盖
// ═══════════════════════════════════════════════════════════════

describe('经典命例五行分布覆盖', () => {
  it('dayMasterElement 覆盖金木水火土', () => {
    const elements = new Set(CLASSIC_CASES.map((c) => c.expectedResult.dayMasterElement))
    expect(elements.has('金')).toBe(true)
    expect(elements.has('木')).toBe(true)
    expect(elements.has('水')).toBe(true)
    expect(elements.has('火')).toBe(true)
    expect(elements.has('土')).toBe(true)
  })

  it('strengthLevel 覆盖多种取值', () => {
    const levels = new Set(CLASSIC_CASES.map((c) => c.expectedResult.strengthLevel))
    expect(levels.size).toBeGreaterThanOrEqual(3) // 至少 3 种强度级别
  })
})

// ═══════════════════════════════════════════════════════════════
// getAllCases 合并顺序
// ═══════════════════════════════════════════════════════════════

describe('getAllCases 合并顺序', () => {
  it('前 10 条为经典命例', () => {
    const all = getAllCases()
    for (let i = 0; i < 10; i++) {
      expect(getCaseCategory(all[i])).toBe('classic')
    }
  })

  it('第 11~15 条为匿名命例', () => {
    const all = getAllCases()
    for (let i = 10; i < 15; i++) {
      expect(getCaseCategory(all[i])).toBe('anonymous')
    }
  })

  it('第 16~25 条为回归样本', () => {
    const all = getAllCases()
    for (let i = 15; i < 25; i++) {
      expect(getCaseCategory(all[i])).toBe('regression')
    }
  })
})
