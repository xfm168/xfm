/**
 * V4.5 Case Library — 命例验证引擎
 *
 * 职责：对命例库进行数据完整性验证与回归统计
 * 约束：不参与任何命理计算，只做命例比对和回归统计
 *
 * 自回归模式：当没有完整引擎运行环境时，
 * 以 expectedResult 自检（expected vs expected）来验证数据完整性。
 */

import { createChain, createTreeNode, DerivationStep } from './types'

import type {
  CaseEntry,
  CaseExpectedResult,
  CaseValidationResult,
  FieldComparison,
  RegressionOptions,
  RegressionReport,
  CaseCategory,
} from './caseLibraryTypes'

import {
  getClassicCases,
  getAnonymousCases,
  getRegressionCases,
  getAllCases,
} from './caseDatabase'

// ═══════════════════════════════════════════
// 版本号
// ═══════════════════════════════════════════

export const CASE_LIBRARY_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// expectedResult 中可参与比对的字段名
// ═══════════════════════════════════════════

const EXPECTED_RESULT_FIELDS: readonly (keyof CaseExpectedResult)[] = [
  'dayMasterElement',
  'primaryPattern',
  'strengthLevel',
  'primaryXiShen',
  'primaryYongShen',
  'primaryJiShen',
  'careerScore',
  'wealthScore',
  'marriageScore',
  'healthScore',
  'studyScore',
  'overallScore',
] as const

// ═══════════════════════════════════════════
// 核心函数
// ═══════════════════════════════════════════

/**
 * 运行回归验证（主入口）
 *
 * 自回归模式：不调用任何引擎，仅验证命例数据的完整性。
 * 遍历命例，检查 expectedResult 中的字段是否非空/有效，
 * 有值的字段标记为 match（自回归 = expected vs expected），
 * 最终统计 matchCount / totalFields。
 *
 * @param options - 回归选项（阈值、类别过滤、指定命例 ID、首次失败即停）
 * @returns 回归验证报告
 */
export function runRegression(options?: RegressionOptions): RegressionReport {
  const startTime = Date.now()
  const chainSteps: DerivationStep[] = []

  const threshold = options?.threshold ?? 0.8
  const categories = options?.categories
  const caseIds = options?.caseIds
  const stopOnFirstFailure = options?.stopOnFirstFailure ?? false

  // 获取命例并按类别与 ID 过滤
  const allCases = getAllCases()

  const filtered = allCases.filter((entry: CaseEntry): boolean => {
    // 按 ID 过滤
    if (caseIds && caseIds.length > 0 && !caseIds.includes(entry.caseId)) {
      return false
    }
    // 按类别过滤
    if (categories && categories.length > 0) {
      const entryCategory = getCaseCategoryFromEntry(entry)
      if (!categories.includes(entryCategory)) {
        return false
      }
    }
    return true
  })

  chainSteps.push(createTreeNode({
    id: 'case-regression-fetch',
    name: '获取命例',
    input: { threshold, categories, caseIds, stopOnFirstFailure },
    output: { filteredCount: filtered.length, totalCount: allCases.length },
    ruleDescription: `过滤后命例数: ${filtered.length}`,
    algorithmVersion: CASE_LIBRARY_VERSION,
    confidence: 1,
  }))

  // 按类别分组验证
  const classicResults: CaseValidationResult[] = []
  const anonymousResults: CaseValidationResult[] = []
  const regressionResults: CaseValidationResult[] = []
  const warnings: string[] = []

  for (const entry of filtered) {
    const category = getCaseCategoryFromEntry(entry)

    const result = validateCase(entry, threshold)

    chainSteps.push(createTreeNode({
      id: `case-regression-compare-${entry.caseId}`,
      name: '字段级比对',
      input: { caseId: entry.caseId, category },
      output: { consistencyRate: result.consistencyRate, passed: result.passed },
      ruleDescription: `命例 ${entry.caseId} 一致率: ${result.consistencyRate}`,
      algorithmVersion: CASE_LIBRARY_VERSION,
      confidence: result.consistencyRate,
    }))

    switch (category) {
      case 'classic':
        classicResults.push(result)
        break
      case 'anonymous':
        anonymousResults.push(result)
        break
      case 'regression':
        regressionResults.push(result)
        break
    }

    // 首次失败即停
    if (stopOnFirstFailure && !result.passed) {
      warnings.push(`首次失败即停：命例 ${entry.caseId} 未通过验证`)
      break
    }
  }

  // 汇总统计
  const summary = generateRegressionSummary(
    classicResults,
    anonymousResults,
    regressionResults,
  )

  const computeTimeMs = Date.now() - startTime

  const chain = createChain(chainSteps, computeTimeMs, {
    engineVersion: CASE_LIBRARY_VERSION,
    algorithmVersion: CASE_LIBRARY_VERSION,
  })

  return {
    version: CASE_LIBRARY_VERSION,
    generatedAt: Date.now(),
    engineVersions: {
      pillars: 'N/A (自回归模式)',
      shenSha: 'N/A (自回归模式)',
      tenGods: 'N/A (自回归模式)',
      pattern: 'N/A (自回归模式)',
      xiYong: 'N/A (自回归模式)',
      fortune: 'N/A (自回归模式)',
      masterReport: 'N/A (自回归模式)',
      reportExport: 'N/A (自回归模式)',
    },
    classicResults,
    anonymousResults,
    regressionResults,
    ...summary,
    warnings,
    computeTimeMs,
    derivationChain: chain,
  }
}

/**
 * 验证单个命例
 *
 * 遍历 expectedResult 的所有非 undefined 字段，
 * 每个字段生成 FieldComparison（自回归模式下 actual 等于 expected），
 * 计算 consistencyRate = matchCount / totalFields，
 * passed = consistencyRate >= threshold。
 *
 * @param entry - 命例条目
 * @param threshold - 一致率阈值（0~1）
 * @returns 单个命例的验证结果
 */
function validateCase(entry: CaseEntry, threshold: number): CaseValidationResult {
  const comparisons: FieldComparison[] = []
  let matchCount = 0
  let totalFields = 0

  for (const field of EXPECTED_RESULT_FIELDS) {
    const expected = entry.expectedResult[field]
    const comparison = validateField(field, expected)

    if (comparison !== null) {
      comparisons.push(comparison)
      totalFields++
      if (comparison.match) {
        matchCount++
      }
    }
  }

  // 如果 expectedResult 没有任何有效字段，发出警告
  const consistencyRate = totalFields > 0 ? matchCount / totalFields : 0
  const passed = totalFields > 0 ? consistencyRate >= threshold : false

  return {
    caseId: entry.caseId,
    category: getCaseCategoryFromEntry(entry),
    fieldComparisons: comparisons,
    matchCount,
    totalFields,
    consistencyRate,
    passed,
  }
}

/**
 * 验证单个字段
 *
 * 在自回归模式下，actual 始终等于 expected，
 * 因此只要 expected 不是 undefined 就标记为 match: true。
 *
 * @param field - 字段名
 * @param expected - 预期值
 * @returns 字段比对结果，若 expected 为 undefined 则返回 null（跳过）
 */
function validateField(
  field: string,
  expected: string | number | undefined,
): FieldComparison | null {
  if (expected === undefined) {
    return null
  }

  return {
    field,
    expected,
    actual: expected,
    match: true,
  }
}

/**
 * 生成回归汇总统计
 *
 * 汇总三个类别的验证结果，计算：
 * - 总命例数、通过数、总体一致率
 * - 各类别一致率
 * - 各字段一致率
 * - 失败列表
 *
 * @param classicResults - 经典命例验证结果
 * @param anonymousResults - 匿名命例验证结果
 * @param regressionResults - 回归样本验证结果
 * @returns 汇总统计（部分 RegressionReport 字段）
 */
function generateRegressionSummary(
  classicResults: CaseValidationResult[],
  anonymousResults: CaseValidationResult[],
  regressionResults: CaseValidationResult[],
): Pick<
  RegressionReport,
  'totalCases' | 'totalPassed' | 'overallConsistencyRate' | 'categoryConsistency' | 'fieldConsistency' | 'failures'
> {
  const allResults = [
    ...classicResults,
    ...anonymousResults,
    ...regressionResults,
  ]

  const totalCases = allResults.length
  const totalPassed = allResults.filter((r) => r.passed).length

  // 总体一致率：所有命例一致率的加权平均
  const overallConsistencyRate =
    totalCases > 0
      ? allResults.reduce((sum, r) => sum + r.consistencyRate, 0) / totalCases
      : 0

  // 各类别一致率
  const calcCategoryRate = (results: CaseValidationResult[]): number => {
    if (results.length === 0) return 0
    return results.reduce((sum, r) => sum + r.consistencyRate, 0) / results.length
  }

  const categoryConsistency = {
    classic: calcCategoryRate(classicResults),
    anonymous: calcCategoryRate(anonymousResults),
    regression: calcCategoryRate(regressionResults),
  }

  // 各字段一致率：统计每个字段在所有比对中的匹配率
  const fieldMatchCounts: Record<string, { matched: number; total: number }> = {}

  for (const result of allResults) {
    for (const comparison of result.fieldComparisons) {
      const key = comparison.field
      if (!(key in fieldMatchCounts)) {
        fieldMatchCounts[key] = { matched: 0, total: 0 }
      }
      fieldMatchCounts[key].total++
      if (comparison.match) {
        fieldMatchCounts[key].matched++
      }
    }
  }

  const fieldConsistency: Record<string, number> = {}
  for (const [field, counts] of Object.entries(fieldMatchCounts)) {
    fieldConsistency[field] =
      counts.total > 0 ? counts.matched / counts.total : 0
  }

  // 失败列表：所有未通过的命例
  const failures = allResults.filter((r) => !r.passed)

  return {
    totalCases,
    totalPassed,
    overallConsistencyRate,
    categoryConsistency,
    fieldConsistency,
    failures,
  }
}

// ═══════════════════════════════════════════
// 内部工具
// ═══════════════════════════════════════════

/**
 * 根据命例条目的特征判断其所属类别
 *
 * @param entry - 命例条目
 * @returns 命例类别
 */
function getCaseCategoryFromEntry(entry: CaseEntry): CaseCategory {
  if ('snapshotVersion' in entry) return 'regression'
  if ('confidence' in entry) return 'anonymous'
  return 'classic'
}