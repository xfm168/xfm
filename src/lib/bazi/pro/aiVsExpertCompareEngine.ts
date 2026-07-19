/**
 * AI vs Expert Compare Engine
 *
 * 职责：
 *   - 对比 AI 计算结果与专家观点
 *   - 逐字段匹配评分
 *   - 生成批量对比报告
 * 约束：
 *   - 不修改输入命例
 *   - 使用加权评分计算 overallAgreement
 */

import type { CaseEntryV2 } from './caseLibraryTypesV2'
import type { ComparisonField, FieldComparison, ExpertAgreement, AiVsExpertReport } from './aiVsExpertCompareTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const AI_VS_EXPERT_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 内部存储（全局对比缓存）
// ═══════════════════════════════════════════

/** 全局字段对比缓存 */
const fieldComparisonCache = new Map<string, FieldComparison[]>()

/** 全部对比结果缓存 */
const agreementCache = new Map<string, ExpertAgreement>()

// ═══════════════════════════════════════════
// 3. 字段提取辅助函数
// ═══════════════════════════════════════════

/** 所有可对比字段 */
const ALL_COMPARISON_FIELDS: ComparisonField[] = [
  'primaryPattern',
  'strengthLevel',
  'xiShen',
  'yongShen',
  'careerScore',
  'marriageScore',
  'overallScore',
  'tenGodSummary',
]

/** 字段权重 */
const FIELD_WEIGHTS: Record<ComparisonField, number> = {
  primaryPattern: 0.20,
  strengthLevel: 0.10,
  xiShen: 0.15,
  yongShen: 0.15,
  careerScore: 0.10,
  marriageScore: 0.10,
  overallScore: 0.10,
  tenGodSummary: 0.10,
}

/** 从 CaseEntryV2 中提取专家共识值 */
function getExpertConsensusValue(
  caseEntry: CaseEntryV2,
  field: ComparisonField,
): string | number {
  const er = caseEntry.expectedResult
  switch (field) {
    case 'primaryPattern':
      return er.primaryPattern ?? ''
    case 'strengthLevel':
      return er.strengthLevel ?? ''
    case 'xiShen':
      return er.primaryXiShen ?? ''
    case 'yongShen':
      return er.primaryYongShen ?? ''
    case 'careerScore':
      return er.careerScore ?? 0
    case 'marriageScore':
      return er.marriageScore ?? 0
    case 'overallScore':
      return er.overallScore ?? 0
    case 'tenGodSummary':
      return er.tenGodSummary ?? ''
  }
}

/** 从 AI 结果中提取对应字段值 */
function getAiValue(
  aiResults: Record<string, string | number>,
  field: ComparisonField,
): string | number {
  return aiResults[field] ?? ''
}

/** 计算单个字段的匹配分数 */
function calculateFieldMatchScore(
  aiValue: string | number,
  expertValue: string | number,
): number {
  // 两者都为空 → 不匹配
  if (aiValue === '' && expertValue === '') return 0
  // 完全一致 → 1
  if (aiValue === expertValue) return 1

  // 数值类型：允许一定误差
  if (typeof aiValue === 'number' && typeof expertValue === 'number') {
    const diff = Math.abs(aiValue - expertValue)
    const max = Math.max(Math.abs(aiValue), Math.abs(expertValue))
    if (max === 0) return 1
    const ratio = diff / max
    if (ratio <= 0.05) return 1       // 误差 <= 5% → 完全匹配
    if (ratio <= 0.2) return 0.5       // 误差 <= 20% → 部分匹配
    return 0                           // 误差 > 20% → 不匹配
  }

  // 字符串类型：部分匹配检查
  if (typeof aiValue === 'string' && typeof expertValue === 'string') {
    if (aiValue === expertValue) return 1
    if (expertValue.length > 0 && aiValue.includes(expertValue)) return 0.5
    if (aiValue.length > 0 && expertValue.includes(aiValue)) return 0.5
    return 0
  }

  return 0
}

/** 判断共识等级 */
function determineConsensusLevel(agreement: number): string {
  if (agreement >= 90) return 'unanimous'
  if (agreement >= 70) return 'strong'
  if (agreement >= 50) return 'moderate'
  if (agreement >= 30) return 'weak'
  return 'disputed'
}

// ═══════════════════════════════════════════
// 4. 核心函数
// ═══════════════════════════════════════════

/**
 * 对比单个命例的 AI 结果与专家观点
 */
export function compareAiVsExpert(
  caseEntry: CaseEntryV2,
  aiResults: Record<string, string | number>,
): ExpertAgreement {
  const fieldComparisons: FieldComparison[] = []
  let totalWeightedScore = 0
  const divergentFields: string[] = []

  for (const field of ALL_COMPARISON_FIELDS) {
    const aiValue = getAiValue(aiResults, field)
    const expertValue = getExpertConsensusValue(caseEntry, field)
    const matchScore = calculateFieldMatchScore(aiValue, expertValue)

    const comparison: FieldComparison = {
      field,
      aiValue,
      expertValue,
      match: matchScore === 1,
      matchScore,
    }
    fieldComparisons.push(comparison)

    totalWeightedScore += matchScore * FIELD_WEIGHTS[field]

    if (matchScore < 1) {
      divergentFields.push(field)
    }
  }

  const overallAgreement = Math.round(totalWeightedScore * 100)

  // 专家统计
  const expertOpinions = caseEntry.expertOpinions
  const expertCount = expertOpinions.length
  const expertAvgScore = expertCount > 0
    ? Math.round(expertOpinions.reduce((s, o) => s + o.score, 0) / expertCount)
    : 0

  // AI 是否与多数专家一致（多数专家 agree 或 partially_agree 则视为一致）
  const agreeOrPartialCount = expertOpinions.filter(
    (o) => o.verdict === 'agree' || o.verdict === 'partially_agree',
  ).length
  const aiConsistentWithMajority = expertCount > 0
    ? agreeOrPartialCount > expertCount / 2
    : true

  const consensusLevel = determineConsensusLevel(overallAgreement)

  const agreement: ExpertAgreement = {
    caseId: caseEntry.caseId,
    overallAgreement,
    fieldComparisons,
    expertAvgScore,
    expertCount,
    aiConsistentWithMajority,
    consensusLevel,
    divergentFields,
  }

  agreementCache.set(caseEntry.caseId, agreement)
  fieldComparisonCache.set(caseEntry.caseId, fieldComparisons)
  return agreement
}

/**
 * 批量对比，生成统计报告
 */
export function batchCompare(
  cases: CaseEntryV2[],
  aiResultsMap: Map<string, Record<string, string | number>>,
): AiVsExpertReport {
  const agreements: ExpertAgreement[] = []

  for (const c of cases) {
    const aiResults = aiResultsMap.get(c.caseId)
    if (aiResults) {
      const agreement = compareAiVsExpert(c, aiResults)
      agreements.push(agreement)
      // 缓存字段对比
      fieldComparisonCache.set(c.caseId, agreement.fieldComparisons)
    }
  }

  const totalComparisons = agreements.length
  const avgAgreement = totalComparisons > 0
    ? Math.round(agreements.reduce((s, a) => s + a.overallAgreement, 0) / totalComparisons)
    : 0

  // 一致度分布
  const distribution = {
    excellent: agreements.filter((a) => a.overallAgreement >= 90).length,
    good: agreements.filter((a) => a.overallAgreement >= 70 && a.overallAgreement < 90).length,
    moderate: agreements.filter((a) => a.overallAgreement >= 50 && a.overallAgreement < 70).length,
    weak: agreements.filter((a) => a.overallAgreement >= 30 && a.overallAgreement < 50).length,
    poor: agreements.filter((a) => a.overallAgreement < 30).length,
  }

  // 差异最大的字段排名
  const topDivergentFields = getTopDivergentFields(5)

  // 建议
  const recommendations: string[] = []
  if (avgAgreement >= 90) {
    recommendations.push('AI 计算结果与专家高度一致，可考虑扩大自动分析范围')
  } else if (avgAgreement >= 70) {
    recommendations.push('AI 计算结果总体良好，需关注分歧较大的字段')
  } else if (avgAgreement >= 50) {
    recommendations.push('AI 计算结果存在较多差异，建议重点优化核心格局判定逻辑')
  } else {
    recommendations.push('AI 计算结果与专家分歧较大，需重新审视基础算法')
  }

  if (topDivergentFields.length > 0) {
    const topFieldNames = topDivergentFields.map((f) => f.field).join(', ')
    recommendations.push(`差异最大的字段: ${topFieldNames}`)
  }

  return {
    version: AI_VS_EXPERT_VERSION,
    generatedAt: Date.now(),
    totalComparisons,
    avgAgreement,
    agreementDistribution: distribution,
    topDivergentFields,
    recommendations,
  }
}

/**
 * 获取特定字段的全局一致率
 */
export function getFieldAgreementRate(field: ComparisonField): number {
  let matchCount = 0
  let totalCount = 0

  for (const comparisons of fieldComparisonCache.values()) {
    const found = comparisons.find((c) => c.field === field)
    if (found) {
      totalCount++
      if (found.match) matchCount++
    }
  }

  return totalCount > 0 ? Math.round((matchCount / totalCount) * 10000) / 100 : 0
}

/**
 * 获取差异最大的字段排名
 */
export function getTopDivergentFields(limit: number): FieldComparison[] {
  const allComparisons: FieldComparison[] = []

  for (const comparisons of fieldComparisonCache.values()) {
    for (const c of comparisons) {
      if (!c.match) {
        allComparisons.push(c)
      }
    }
  }

  // 按匹配分数升序排（分数最低 = 差异最大）
  allComparisons.sort((a, b) => a.matchScore - b.matchScore)

  // 去重（按字段名）
  const seen = new Set<string>()
  const result: FieldComparison[] = []
  for (const c of allComparisons) {
    if (!seen.has(c.field)) {
      seen.add(c.field)
      result.push(c)
      if (result.length >= limit) break
    }
  }

  return result
}

/**
 * 清空内部缓存（仅供测试使用）
 */
export function _clearCompareCache(): void {
  fieldComparisonCache.clear()
  agreementCache.clear()
}
