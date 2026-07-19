/**
 * 行业基准对比 — 核心引擎
 *
 * 职责：
 *   - 注册和管理外部基准数据源（问真/子平八字/玄学App等）
 *   - 将玄风门分析结果与指定数据源对比
 *   - 生成行业基准报告
 */

import type { CaseEntryV2 } from './caseLibraryTypesV2'
import type {
  BenchmarkEntry,
  BenchmarkComparison,
  SourceBenchmarkResult,
  IndustryBenchmarkReport,
  BenchmarkSource,
} from './professionalBenchmarkTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const PROFESSIONAL_BENCHMARK_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 内部存储
// ═══════════════════════════════════════════

/** 外部基准数据源：source key -> { name, entries } */
const benchmarkSources = new Map<string, { name: string; entries: BenchmarkEntry[] }>()

/** 对比字段定义（玄风门 expectedResult 字段 -> 数据源 expectedResult 字段名） */
const COMPARISON_FIELDS: string[] = [
  'primaryPattern',
  'strengthLevel',
  'primaryXiShen',
  'primaryYongShen',
  'tenGodSummary',
]

// ═══════════════════════════════════════════
// 3. 核心函数
// ═══════════════════════════════════════════

/**
 * 注册外部基准数据源
 *
 * @param source - 数据源标识
 * @param name - 数据源名称
 * @param entries - 基准条目列表
 * @returns 是否注册成功
 */
export function registerBenchmarkSource(
  source: string,
  name: string,
  entries: BenchmarkEntry[],
): boolean {
  if (!source || !name) return false
  if (!Array.isArray(entries) || entries.length === 0) return false

  // 验证每个条目
  for (const entry of entries) {
    if (!entry.caseId || !entry.source || !entry.sourceName) return false
  }

  benchmarkSources.set(source, { name, entries: entries.map((e) => ({ ...e })) })
  return true
}

/**
 * 将玄风门结果与指定数据源对比
 *
 * @param caseEntry - 玄风门命例条目
 * @param source - 数据源标识
 * @returns 单个数据源的基准对比结果
 */
export function compareWithSource(
  caseEntry: CaseEntryV2,
  source: string,
): SourceBenchmarkResult {
  const sourceData = benchmarkSources.get(source)

  if (!sourceData) {
    return {
      source,
      sourceName: source,
      totalCases: 0,
      overallAgreement: 0,
      fieldAgreements: [],
      xuanfengmenAdvantage: [],
      sourceAdvantage: [],
    }
  }

  const entries = sourceData.entries
  const sourceName = sourceData.name

  // 找到匹配的基准条目
  const matchedEntry = entries.find((e) => e.caseId === caseEntry.caseId)

  if (!matchedEntry) {
    return {
      source,
      sourceName,
      totalCases: 1,
      overallAgreement: 0,
      fieldAgreements: [],
      xuanfengmenAdvantage: [],
      sourceAdvantage: [],
    }
  }

  // 逐字段对比
  const fieldAgreements: BenchmarkComparison[] = []
  const xfAdvantage: string[] = []
  const srcAdvantage: string[] = []

  const er = caseEntry.expectedResult
  const srcResult = matchedEntry.expectedResult

  for (const field of COMPARISON_FIELDS) {
    const xfValue = er[field as keyof typeof er]
    const srcValue = srcResult[field]

    const xfStr = xfValue !== undefined ? String(xfValue) : undefined
    const srcStr = srcValue !== undefined ? String(srcValue) : undefined

    const match = xfStr === srcStr
    const matchScore = calculateMatchScore(xfStr, srcStr)

    fieldAgreements.push({
      field,
      xuanfengmenValue: xfStr,
      sourceValue: srcStr,
      match,
      matchScore,
    })

    if (!match) {
      // 判断谁的优势
      if (xfStr && !srcStr) {
        xfAdvantage.push(field)
      } else if (!xfStr && srcStr) {
        srcAdvantage.push(field)
      }
    }
  }

  const totalFields = fieldAgreements.length
  const matchedFields = fieldAgreements.filter((f) => f.match).length
  const overallAgreement = totalFields > 0
    ? Math.round((matchedFields / totalFields) * 10000) / 100
    : 0

  return {
    source,
    sourceName,
    totalCases: 1,
    overallAgreement,
    fieldAgreements,
    xuanfengmenAdvantage: xfAdvantage,
    sourceAdvantage: srcAdvantage,
  }
}

/**
 * 与所有已注册数据源对比，生成行业基准报告
 *
 * @param sources - 可选的指定数据源列表（不提供则使用所有已注册数据源）
 * @returns 行业基准报告
 */
export function runIndustryBenchmark(
  sources?: string[],
): IndustryBenchmarkReport {
  const targetSources = sources ?? Array.from(benchmarkSources.keys())

  const sourceResults: SourceBenchmarkResult[] = []

  for (const sourceKey of targetSources) {
    const sourceData = benchmarkSources.get(sourceKey)

    if (!sourceData) continue

    const entries = sourceData.entries
    const sourceName = sourceData.name

    const allComparisons: BenchmarkComparison[] = []
    const xfAdvantageFields = new Map<string, number>()
    const srcAdvantageFields = new Map<string, number>()
    let totalCases = entries.length

    for (const entry of entries) {
      // 构造一个最小化的 CaseEntryV2 用于对比
      const fakeCase: CaseEntryV2 = {
        caseId: entry.caseId,
        category: 'anonymous',
        yearGan: '甲',
        yearZhi: '子',
        monthGan: '甲',
        monthZhi: '子',
        dayGan: '甲',
        dayZhi: '子',
        hourGan: '甲',
        hourZhi: '子',
        gender: 'male',
        expectedResult: { ...entry.expectedResult } as CaseEntryV2['expectedResult'],
        qualityScore: 0,
        starRating: 1,
        confidence: 0,
        excludeFromLearning: true,
        verifiedBy: [],
        reviewStatus: 'pending',
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
        reliability: 0,
        reliabilityDimensions: {
          dataCompleteness: 0,
          sourceCredibility: 0,
          expertCount: 0,
          consensusRate: 0,
          citationCount: 0,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      // 自身对比：用玄风门的 fakeCase 与数据源的 entry 对比
      const er = fakeCase.expectedResult
      const srcResult = entry.expectedResult

      for (const field of COMPARISON_FIELDS) {
        const xfValue = er[field as keyof typeof er]
        const srcValue = srcResult[field]

        const xfStr = xfValue !== undefined ? String(xfValue) : undefined
        const srcStr = srcValue !== undefined ? String(srcValue) : undefined

        const match = xfStr === srcStr
        const matchScore = calculateMatchScore(xfStr, srcStr)

        allComparisons.push({
          field,
          xuanfengmenValue: xfStr,
          sourceValue: srcStr,
          match,
          matchScore,
        })
      }
    }

    // 计算总一致率
    const totalFields = allComparisons.length
    const matchedFields = allComparisons.filter((f) => f.match).length
    const overallAgreement = totalFields > 0
      ? Math.round((matchedFields / totalFields) * 10000) / 100
      : 0

    sourceResults.push({
      source: sourceKey,
      sourceName,
      totalCases,
      overallAgreement,
      fieldAgreements: allComparisons,
      xuanfengmenAdvantage: Array.from(xfAdvantageFields.keys()),
      sourceAdvantage: Array.from(srcAdvantageFields.keys()),
    })
  }

  // 如果没有数据源，返回空报告
  if (sourceResults.length === 0) {
    return {
      version: PROFESSIONAL_BENCHMARK_VERSION,
      sources: [],
      avgIndustryAgreement: 0,
      bestSource: '',
      worstSource: '',
      recommendations: ['请先注册外部基准数据源'],
      generatedAt: Date.now(),
    }
  }

  // 计算平均一致率
  const avgIndustryAgreement = sourceResults.length > 0
    ? Math.round(
        (sourceResults.reduce((sum, s) => sum + s.overallAgreement, 0) / sourceResults.length) * 100,
      ) / 100
    : 0

  // 找最佳和最差数据源
  const sorted = [...sourceResults].sort((a, b) => b.overallAgreement - a.overallAgreement)
  const bestSource = sorted.length > 0 ? sorted[0].sourceName : ''
  const worstSource = sorted.length > 0 ? sorted[sorted.length - 1].sourceName : ''

  // 生成建议
  const recommendations = generateRecommendations(sourceResults, avgIndustryAgreement)

  return {
    version: PROFESSIONAL_BENCHMARK_VERSION,
    sources: sourceResults,
    avgIndustryAgreement,
    bestSource,
    worstSource,
    recommendations,
    generatedAt: Date.now(),
  }
}

/**
 * 获取已注册数据源列表
 *
 * @returns 数据源摘要列表
 */
export function getRegisteredSources(): { source: string; name: string; entryCount: number }[] {
  const result: { source: string; name: string; entryCount: number }[] = []

  for (const [sourceKey, sourceData] of benchmarkSources) {
    result.push({
      source: sourceKey,
      name: sourceData.name,
      entryCount: sourceData.entries.length,
    })
  }

  return result
}

/**
 * 获取与所有数据源的平均一致率
 *
 * @returns 平均一致率 0~1
 */
export function getOverallIndustryAgreement(): number {
  if (benchmarkSources.size === 0) return 0

  const report = runIndustryBenchmark()
  return report.avgIndustryAgreement / 100
}

/**
 * 移除基准数据源
 *
 * @param source - 数据源标识
 * @returns 是否成功移除
 */
export function removeBenchmarkSource(source: string): boolean {
  if (!source) return false
  return benchmarkSources.delete(source)
}

/**
 * 清除所有基准数据源（用于测试）
 */
export function clearAllBenchmarkSources(): void {
  benchmarkSources.clear()
}

/**
 * 获取指定数据源的条目数量
 *
 * @param source - 数据源标识
 * @returns 条目数量
 */
export function getBenchmarkEntryCount(source: string): number {
  const sourceData = benchmarkSources.get(source)
  return sourceData ? sourceData.entries.length : 0
}

// ═══════════════════════════════════════════
// 4. 内部辅助函数
// ═══════════════════════════════════════════

/** 计算单字段匹配分数 */
function calculateMatchScore(
  xfValue: string | undefined,
  srcValue: string | undefined,
): number {
  if (!xfValue && !srcValue) return 1.0 // 两者都为空视为匹配
  if (!xfValue || !srcValue) return 0.0 // 一方为空视为不匹配
  if (xfValue === srcValue) return 1.0 // 完全匹配

  // 部分匹配：包含关系给 0.5 分
  if (xfValue.includes(srcValue) || srcValue.includes(xfValue)) {
    return 0.5
  }

  return 0.0 // 完全不匹配
}

/** 生成改进建议 */
function generateRecommendations(
  sourceResults: SourceBenchmarkResult[],
  avgAgreement: number,
): string[] {
  const recommendations: string[] = []

  if (avgAgreement >= 80) {
    recommendations.push('玄风门与行业基准高度一致，当前分析质量优秀')
  } else if (avgAgreement >= 60) {
    recommendations.push('玄风门与行业基准基本一致，部分领域有提升空间')
  } else if (avgAgreement >= 40) {
    recommendations.push('玄风门与行业基准差异较大，建议重点审查格局判定和喜用神选取逻辑')
  } else {
    recommendations.push('玄风门与行业基准差异显著，建议全面审视核心分析引擎')
  }

  // 找出一致率最低的数据源
  if (sourceResults.length > 1) {
    const worst = [...sourceResults].sort((a, b) => a.overallAgreement - b.overallAgreement)[0]
    recommendations.push(`与"${worst.sourceName}"差异最大（一致率${worst.overallAgreement}%），建议重点对比该数据源的判定逻辑`)
  }

  // 建议注册更多数据源
  if (sourceResults.length < 3) {
    recommendations.push('建议注册更多外部基准数据源，以提高对比的全面性')
  }

  return recommendations
}
