/**
 * Case Reliability Engine
 *
 * 职责：
 *   - 计算单个命例的 5 维度可信度报告
 *   - 批量评估、等级筛选、分布统计、排序与比较
 * 约束：
 *   - 不修改输入命例
 *   - 0-100 总分，自动映射可信度等级
 */

import type { CaseEntryV2, ReliabilityDimensionsV2 } from './caseLibraryTypesV2'
import { calculateReliabilityScore } from './caseLibraryTypesV2'
import type { ReliabilityLevel, ReliabilityReport, ReliabilityFilter } from './caseReliabilityTypes'
import { RELIABILITY_LEVEL_THRESHOLDS } from './caseReliabilityTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const CASE_RELIABILITY_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 等级映射
// ═══════════════════════════════════════════

/** 根据总分获取可信度等级 */
export function getReliabilityLevel(score: number): ReliabilityLevel {
  if (score >= RELIABILITY_LEVEL_THRESHOLDS.excellent) return 'excellent'
  if (score >= RELIABILITY_LEVEL_THRESHOLDS.good) return 'good'
  if (score >= RELIABILITY_LEVEL_THRESHOLDS.fair) return 'fair'
  if (score >= RELIABILITY_LEVEL_THRESHOLDS.poor) return 'poor'
  return 'unverified'
}

// ═══════════════════════════════════════════
// 3. 改进建议生成
// ═══════════════════════════════════════════

/** 根据各维度表现生成改进建议 */
function generateRecommendations(dimensions: ReliabilityDimensionsV2): string[] {
  const recommendations: string[] = []

  if (dimensions.dataCompleteness < 80) {
    recommendations.push('补充缺失的命例数据字段以提升完整度')
  }
  if (dimensions.sourceCredibility < 80) {
    recommendations.push('增加权威来源或文献引用以提升来源可信度')
  }
  if (dimensions.expertCount < 3) {
    recommendations.push('增加专家验证以提升可信度')
  }
  if (dimensions.consensusRate < 80) {
    recommendations.push('解决专家分歧以提升一致率')
  }
  if (dimensions.citationCount < 5) {
    recommendations.push('增加学术或文献引用以提升引用次数')
  }

  return recommendations
}

// ═══════════════════════════════════════════
// 4. 核心评估函数
// ═══════════════════════════════════════════

/**
 * 计算单个命例的可信度报告
 * @param entry - CaseEntryV2 命例
 * @returns 完整的 ReliabilityReport
 */
export function calculateCaseReliability(entry: CaseEntryV2): ReliabilityReport {
  const dimensions = entry.reliabilityDimensions

  // 专家数量与引用次数需要先转换为 0-100 分制
  const expertScore = Math.min(dimensions.expertCount * 20, 100)
  const citationScore = Math.min(dimensions.citationCount * 10, 100)

  const breakdown = [
    {
      dimension: '数据完整度',
      score: dimensions.dataCompleteness,
      weight: 0.25,
      weightedScore: dimensions.dataCompleteness * 0.25,
    },
    {
      dimension: '来源可信度',
      score: dimensions.sourceCredibility,
      weight: 0.25,
      weightedScore: dimensions.sourceCredibility * 0.25,
    },
    {
      dimension: '专家数量',
      score: expertScore,
      weight: 0.15,
      weightedScore: expertScore * 0.15,
    },
    {
      dimension: '一致率',
      score: dimensions.consensusRate,
      weight: 0.25,
      weightedScore: dimensions.consensusRate * 0.25,
    },
    {
      dimension: '引用次数',
      score: citationScore,
      weight: 0.10,
      weightedScore: citationScore * 0.10,
    },
  ]

  const overallScore = calculateReliabilityScore(dimensions)
  const level = getReliabilityLevel(overallScore)
  const recommendations = generateRecommendations(dimensions)

  return {
    caseId: entry.caseId,
    overallScore,
    level,
    dimensions,
    breakdown,
    recommendations,
  }
}

// ═══════════════════════════════════════════
// 5. 批量与筛选
// ═══════════════════════════════════════════

/** 批量计算可信度报告 */
export function batchCalculateReliability(cases: CaseEntryV2[]): ReliabilityReport[] {
  return cases.map((c) => calculateCaseReliability(c))
}

/** 按可信度等级筛选命例 */
export function filterByReliabilityLevel(cases: CaseEntryV2[], level: ReliabilityLevel): CaseEntryV2[] {
  return cases.filter((c) => getReliabilityLevel(calculateReliabilityScore(c.reliabilityDimensions)) === level)
}

/** 按可信度过滤器筛选命例 */
export function filterByReliability(cases: CaseEntryV2[], filter: ReliabilityFilter): CaseEntryV2[] {
  return cases.filter((c) => {
    const score = calculateReliabilityScore(c.reliabilityDimensions)
    const level = getReliabilityLevel(score)

    if (filter.minScore !== undefined && score < filter.minScore) return false
    if (filter.maxScore !== undefined && score > filter.maxScore) return false
    if (filter.levels !== undefined && !filter.levels.includes(level)) return false

    return true
  })
}

// ═══════════════════════════════════════════
// 6. 统计与排序
// ═══════════════════════════════════════════

/** 获取可信度等级分布统计 */
export function getReliabilityDistribution(cases: CaseEntryV2[]): Record<ReliabilityLevel, number> {
  const distribution: Record<ReliabilityLevel, number> = {
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
    unverified: 0,
  }

  for (const c of cases) {
    const level = getReliabilityLevel(calculateReliabilityScore(c.reliabilityDimensions))
    distribution[level]++
  }

  return distribution
}

/** 获取最可信的命例（按总分降序） */
export function getTopReliableCases(cases: CaseEntryV2[], limit: number): CaseEntryV2[] {
  return [...cases]
    .sort((a, b) => {
      const scoreA = calculateReliabilityScore(a.reliabilityDimensions)
      const scoreB = calculateReliabilityScore(b.reliabilityDimensions)
      return scoreB - scoreA
    })
    .slice(0, limit)
}

// ═══════════════════════════════════════════
// 7. 比较
// ═══════════════════════════════════════════

/** 比较两个命例的可信度 */
export function compareReliability(
  caseA: CaseEntryV2,
  caseB: CaseEntryV2,
): {
  betterCaseId: string
  scoreDifference: number
  levelA: ReliabilityLevel
  levelB: ReliabilityLevel
} {
  const scoreA = calculateReliabilityScore(caseA.reliabilityDimensions)
  const scoreB = calculateReliabilityScore(caseB.reliabilityDimensions)
  const levelA = getReliabilityLevel(scoreA)
  const levelB = getReliabilityLevel(scoreB)

  if (scoreA >= scoreB) {
    return {
      betterCaseId: caseA.caseId,
      scoreDifference: scoreA - scoreB,
      levelA,
      levelB,
    }
  }

  return {
    betterCaseId: caseB.caseId,
    scoreDifference: scoreB - scoreA,
    levelA,
    levelB,
  }
}
