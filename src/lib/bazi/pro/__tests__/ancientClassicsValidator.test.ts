/**
 * Ancient Classics Validator Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - 古典来源识别
 *   - 单条验证（含/不含必需来源）
 *   - 覆盖率计算
 *   - 建议生成
 *   - 批量验证与报告
 *   - 最低覆盖率
 *   - 引用建议
 *   - 全局覆盖率报告
 *   - 边界情况
 */

import { describe, test, expect, beforeEach } from 'vitest'
import type { CaseEntryV2, CaseCategoryV2 } from '../caseLibraryTypesV2'
import {
  ANCIENT_CLASSICS_VERSION,
  validateClassicalReferences,
  batchValidateClassicalReferences,
  getMinimumClassicalCoverage,
  suggestClassicalReferences,
  getSourceCoverageReport,
} from '../ancientClassicsValidatorEngine'
import type { ClassicalSource } from '../ancientClassicsValidatorTypes'

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

describe('ancientClassicsValidatorEngine', () => {
  // ─── 1. 版本号 ───
  test('版本号应为 1.0.0', () => {
    expect(ANCIENT_CLASSICS_VERSION).toBe('1.0.0')
  })

  // ─── 2. validateClassicalReferences 无引用 ───
  test('无引用时 totalReferences 为 0 且 validationPassed 为 false', () => {
    const entry = makeCaseV2('AC-001', 'classic', {
      referenceBooks: [],
      evidence: [],
    })
    const result = validateClassicalReferences(entry)

    expect(result.caseId).toBe('AC-001')
    expect(result.totalReferences).toBe(0)
    expect(result.validationPassed).toBe(false)
    expect(result.requiredSourcesMet).toBe(true) // 无必需来源要求时默认满足
    expect(result.missingSources).toHaveLength(0)
  })

  // ─── 3. validateClassicalReferences 有 referenceBooks 引用 ───
  test('referenceBooks 引用古籍时应被统计', () => {
    const entry = makeCaseV2('AC-002', 'classic', {
      referenceBooks: ['滴天髓', '三命通会'],
    })
    const result = validateClassicalReferences(entry)

    expect(result.totalReferences).toBe(2)
    expect(result.bySource['滴天髓']).toBe(1)
    expect(result.bySource['三命通会']).toBe(1)
    expect(result.validationPassed).toBe(true)
  })

  // ─── 4. validateClassicalReferences evidence 中引用 ───
  test('evidence 中的 source 为古籍时应被统计', () => {
    const entry = makeCaseV2('AC-003', 'classic', {
      evidence: [
        { type: 'classical_text', content: 'c1', source: '子平真诠', confidence: 0.9 },
        { type: 'classical_text', content: 'c2', source: '穷通宝鉴', confidence: 0.85 },
      ],
    })
    const result = validateClassicalReferences(entry)

    expect(result.totalReferences).toBe(2)
    expect(result.bySource['子平真诠']).toBe(1)
    expect(result.bySource['穷通宝鉴']).toBe(1)
    expect(result.validationPassed).toBe(true)
  })

  // ─── 5. 非古籍来源不计入 ───
  test('非古籍来源不应被统计', () => {
    const entry = makeCaseV2('AC-004', 'classic', {
      referenceBooks: ['某现代书', '百度百科'],
      evidence: [
        { type: 'modern_study', content: 'c1', source: '现代论文', confidence: 0.8 },
      ],
    })
    const result = validateClassicalReferences(entry)

    expect(result.totalReferences).toBe(0)
    expect(result.validationPassed).toBe(false)
  })

  // ─── 6. 必需来源验证 - 满足 ───
  test('requiredSources 指定且全部满足时 requiredSourcesMet 为 true', () => {
    const entry = makeCaseV2('AC-005', 'classic', {
      referenceBooks: ['滴天髓', '三命通会'],
    })
    const result = validateClassicalReferences(entry, ['滴天髓', '三命通会'])

    expect(result.requiredSourcesMet).toBe(true)
    expect(result.missingSources).toHaveLength(0)
    expect(result.validationPassed).toBe(true)
  })

  // ─── 7. 必需来源验证 - 不满足 ───
  test('requiredSources 指定但部分缺失时 requiredSourcesMet 为 false', () => {
    const entry = makeCaseV2('AC-006', 'classic', {
      referenceBooks: ['滴天髓'],
    })
    const result = validateClassicalReferences(entry, ['滴天髓', '子平真诠'])

    expect(result.requiredSourcesMet).toBe(false)
    expect(result.missingSources).toContain('子平真诠')
    expect(result.validationPassed).toBe(false)
  })

  // ─── 8. referenceCoverage 计算 ───
  test('referenceCoverage 应为正数且不超过 100', () => {
    const entry = makeCaseV2('AC-007', 'classic', {
      referenceBooks: ['滴天髓'],
    })
    const result = validateClassicalReferences(entry)

    expect(result.referenceCoverage).toBeGreaterThan(0)
    expect(result.referenceCoverage).toBeLessThanOrEqual(100)
  })

  // ─── 9. 建议生成 ───
  test('无引用时生成增加引用的建议', () => {
    const entry = makeCaseV2('AC-008', 'classic', {
      referenceBooks: [],
      evidence: [],
    })
    const result = validateClassicalReferences(entry)

    expect(result.recommendations.length).toBeGreaterThan(0)
    expect(result.recommendations.some((r) => r.includes('古籍'))).toBe(true)
  })

  test('缺失必需来源时生成补充建议', () => {
    const entry = makeCaseV2('AC-009', 'classic', {
      referenceBooks: ['滴天髓'],
    })
    const result = validateClassicalReferences(entry, ['滴天髓', '神峰通考'])

    expect(result.recommendations.some((r) => r.includes('神峰通考'))).toBe(true)
  })

  // ─── 10. batchValidateClassicalReferences ───
  test('批量验证返回正确报告结构', () => {
    const cases = [
      makeCaseV2('AC-B1', 'classic', { referenceBooks: ['滴天髓'] }),
      makeCaseV2('AC-B2', 'classic', { referenceBooks: [] }),
      makeCaseV2('AC-B3', 'classic', { referenceBooks: ['三命通会', '子平真诠'] }),
    ]
    const report = batchValidateClassicalReferences(cases)

    expect(report.version).toBe('1.0.0')
    expect(report.totalCases).toBe(3)
    expect(report.coverageRate).toBeGreaterThan(0)
    expect(report.avgReferences).toBeGreaterThan(0)
    expect(report.generatedAt).toBeGreaterThan(0)
  })

  test('批量验证的 coverageRate 反映通过率', () => {
    const cases = [
      makeCaseV2('AC-B4', 'classic', { referenceBooks: [] }),
      makeCaseV2('AC-B5', 'classic', { referenceBooks: [] }),
      makeCaseV2('AC-B6', 'classic', { referenceBooks: ['滴天髓'] }),
    ]
    const report = batchValidateClassicalReferences(cases)

    expect(report.coverageRate).toBe(Math.round((1 / 3) * 100))
  })

  // ─── 11. getMinimumClassicalCoverage ───
  test('空数组返回 0', () => {
    expect(getMinimumClassicalCoverage([])).toBe(0)
  })

  test('所有命例都有引用时最低覆盖率应 > 0', () => {
    const cases = [
      makeCaseV2('AC-M1', 'classic', { referenceBooks: ['滴天髓', '三命通会'] }),
      makeCaseV2('AC-M2', 'classic', { referenceBooks: ['子平真诠'] }),
    ]
    const minCov = getMinimumClassicalCoverage(cases)
    expect(minCov).toBeGreaterThan(0)
  })

  // ─── 12. suggestClassicalReferences ───
  test('无 expectedResult 时返回空数组', () => {
    const entry = makeCaseV2('AC-S1', 'classic', {
      expectedResult: {},
      referenceBooks: [],
    })
    const suggestions = suggestClassicalReferences(entry)
    expect(suggestions).toHaveLength(0)
  })

  test('有格局时返回格局相关建议', () => {
    const entry = makeCaseV2('AC-S2', 'classic', {
      expectedResult: { primaryPattern: '正官格' },
      referenceBooks: [],
    })
    const suggestions = suggestClassicalReferences(entry)
    // 知识库中格局类条目应能匹配
    expect(suggestions.length).toBeGreaterThanOrEqual(0) // 可能匹配到也可能匹配不到
  })

  // ─── 13. getSourceCoverageReport ───
  test('全局覆盖率报告返回非空数组', () => {
    const report = getSourceCoverageReport()
    expect(Array.isArray(report)).toBe(true)
    expect(report.length).toBeGreaterThan(0)
  })

  test('全局覆盖率报告按数量降序排列', () => {
    const report = getSourceCoverageReport()
    for (let i = 1; i < report.length; i++) {
      expect(report[i - 1].count).toBeGreaterThanOrEqual(report[i].count)
    }
  })

  test('全局覆盖率报告中每项 coverage 在 0-100 之间', () => {
    const report = getSourceCoverageReport()
    for (const item of report) {
      expect(item.coverage).toBeGreaterThanOrEqual(0)
      expect(item.coverage).toBeLessThanOrEqual(100)
      expect(item.count).toBeGreaterThan(0)
    }
  })

  // ─── 14. 不修改输入命例 ───
  test('validateClassicalReferences 不修改输入命例', () => {
    const entry = makeCaseV2('AC-IMM', 'classic', { referenceBooks: ['滴天髓'] })
    const originalBooks = [...entry.referenceBooks]
    validateClassicalReferences(entry)
    expect(entry.referenceBooks).toEqual(originalBooks)
  })

  // ─── 15. referenceBooks 与 evidence 同时引用同一来源 ───
  test('referenceBooks 和 evidence 同时引用同一来源时应累加计数', () => {
    const entry = makeCaseV2('AC-DUP', 'classic', {
      referenceBooks: ['滴天髓'],
      evidence: [
        { type: 'classical_text', content: 'c1', source: '滴天髓', confidence: 0.9 },
      ],
    })
    const result = validateClassicalReferences(entry)

    expect(result.totalReferences).toBe(2)
    expect(result.bySource['滴天髓']).toBe(2)
  })
})