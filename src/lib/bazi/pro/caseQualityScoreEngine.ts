/**
 * Case Quality Score Engine
 *
 * 职责：
 *   - 计算单个命例的 5 维度质量评分
 *   - 批量评分、低质量过滤、分布统计
 * 约束：
 *   - 不修改输入命例
 *   - 0-100 总分，自动映射星级
 */

import type { CaseEntryV2 } from './caseLibraryTypesV2'
import { scoreToStarRating } from './caseLibraryTypesV2'
import type { QualityScoreResult, QualityThreshold, QualityDimension } from './caseQualityScoreTypes'
import { DEFAULT_QUALITY_THRESHOLD } from './caseQualityScoreTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const CASE_QUALITY_SCORE_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 维度评分内部函数
// ═══════════════════════════════════════════

/** 数据完整度 (0-25) */
function scoreCompleteness(entry: CaseEntryV2): number {
  const requiredFields = [
    'caseId',
    'category',
    'yearGan',
    'yearZhi',
    'monthGan',
    'monthZhi',
    'dayGan',
    'dayZhi',
    'hourGan',
    'hourZhi',
    'gender',
  ] as (keyof CaseEntryV2)[]

  const filledRequired = requiredFields.filter(
    (f) => entry[f] !== undefined && entry[f] !== null && entry[f] !== '',
  ).length

  let score = Math.round((filledRequired / requiredFields.length) * 15)

  const er = entry.expectedResult
  const erValues = Object.values(er).filter(
    (v) => v !== undefined && v !== null && v !== '',
  ).length
  score += Math.min(erValues * 2, 10)

  return Math.min(score, 25)
}

/** 来源可信度 (0-25) */
function scoreSource(entry: CaseEntryV2): number {
  let score = 0
  if (entry.source && entry.source.length > 0) score += 10
  score += Math.min(entry.evidence.length * 3, 10)
  score += Math.min(entry.referenceBooks.length * 3, 5)
  return Math.min(score, 25)
}

/** 专家数量 (0-20) */
function scoreExpert(entry: CaseEntryV2): number {
  return Math.min(entry.expertOpinions.length * 5, 20)
}

/** 一致率 (0-20) */
function scoreConsistency(entry: CaseEntryV2): number {
  if (entry.expertOpinions.length === 0) return 0
  const agreeCount = entry.expertOpinions.filter(
    (o) => o.verdict === 'agree',
  ).length
  const rate = agreeCount / entry.expertOpinions.length
  return Math.round(rate * 20)
}

/** 引用次数 (0-10) */
function scoreCitation(entry: CaseEntryV2): number {
  return Math.min(entry.referenceBooks.length + entry.evidence.length, 10)
}

// ═══════════════════════════════════════════
// 3. 核心评分函数
// ═══════════════════════════════════════════

/**
 * 计算单个命例的质量评分
 * @param entry - 命例条目
 * @param threshold - 质量阈值（默认 DEFAULT_QUALITY_THRESHOLD）
 * @returns 质量评分结果
 */
export function calculateCaseQualityScore(
  entry: CaseEntryV2,
  threshold: QualityThreshold = DEFAULT_QUALITY_THRESHOLD,
): QualityScoreResult {
  const dimensions: Record<QualityDimension, number> = {
    completeness: scoreCompleteness(entry),
    source: scoreSource(entry),
    expert: scoreExpert(entry),
    consistency: scoreConsistency(entry),
    citation: scoreCitation(entry),
  }

  const totalScore =
    dimensions.completeness +
    dimensions.source +
    dimensions.expert +
    dimensions.consistency +
    dimensions.citation

  const starRating = scoreToStarRating(totalScore)

  const passed =
    totalScore >= threshold.minTotal && starRating >= threshold.minStar

  return {
    caseId: entry.caseId,
    totalScore,
    starRating,
    dimensions,
    passed,
  }
}

// ═══════════════════════════════════════════
// 4. 批量与筛选工具
// ═══════════════════════════════════════════

/**
 * 批量计算命例质量评分
 * @param cases - 命例数组
 * @param threshold - 质量阈值（可选）
 * @returns 质量评分结果数组
 */
export function batchCalculateQualityScores(
  cases: CaseEntryV2[],
  threshold?: QualityThreshold,
): QualityScoreResult[] {
  return cases.map((c) => calculateCaseQualityScore(c, threshold))
}

/**
 * 过滤低质量命例（qualityScore < 60）
 * @param cases - 命例数组
 * @returns 低质量命例数组
 */
export function filterLowQualityCases(cases: CaseEntryV2[]): CaseEntryV2[] {
  return cases.filter((c) => calculateCaseQualityScore(c).totalScore < 60)
}

/**
 * 获取质量评分的星级分布统计
 * @param cases - 命例数组
 * @returns 各星级命例数量
 */
export function getQualityScoreDistribution(cases: CaseEntryV2[]): {
  '1': number
  '2': number
  '3': number
  '4': number
  '5': number
} {
  const distribution = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
  }

  for (const c of cases) {
    const result = calculateCaseQualityScore(c)
    const key = String(result.starRating) as '1' | '2' | '3' | '4' | '5'
    distribution[key]++
  }

  return distribution
}
