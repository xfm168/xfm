/**
 * Regression Gold Engine
 *
 * 职责：
 *   - 根据质量评分、星级、可信度、专家意见等判定回归层级
 *   - 批量分级、筛选、一致性验证与汇总统计
 * 约束：
 *   - 不修改输入命例
 *   - 纯函数设计
 */

import type { CaseEntryV2, RegressionTier } from './caseLibraryTypesV2'
import type { GoldTierCriteria, GoldCaseReport, RegressionGoldSummary } from './regressionGoldTypes'
import { GOLD_TIER_CRITERIA, SILVER_TIER_CRITERIA, BRONZE_TIER_CRITERIA } from './regressionGoldTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const REGRESSION_GOLD_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 内部工具函数
// ═══════════════════════════════════════════

/**
 * 计算单个标准的一致率（consensusScore 回退到专家一致率）
 */
function getEffectiveConsistencyRate(entry: CaseEntryV2): number {
  if (entry.consensusScore !== undefined && entry.consensusScore !== null) {
    return entry.consensusScore
  }
  if (entry.expertOpinions.length === 0) return 0
  const agreeCount = entry.expertOpinions.filter((o) => o.verdict === 'agree').length
  return agreeCount / entry.expertOpinions.length
}

/**
 * 检查命例是否满足指定层级标准
 */
function meetsCriteria(entry: CaseEntryV2, criteria: GoldTierCriteria): {
  meets: boolean
  failed: string[]
} {
  const failed: string[] = []

  if (entry.qualityScore < criteria.minQualityScore) {
    failed.push(`qualityScore (${entry.qualityScore} < ${criteria.minQualityScore})`)
  }
  if (entry.starRating < criteria.minStarRating) {
    failed.push(`starRating (${entry.starRating} < ${criteria.minStarRating})`)
  }
  if (entry.reliability < criteria.minReliability) {
    failed.push(`reliability (${entry.reliability} < ${criteria.minReliability})`)
  }
  if (entry.expertOpinions.length < criteria.requiredExpertOpinions) {
    failed.push(`expertOpinions (${entry.expertOpinions.length} < ${criteria.requiredExpertOpinions})`)
  }
  const consistencyRate = getEffectiveConsistencyRate(entry)
  if (consistencyRate < criteria.requiredConsistencyRate) {
    failed.push(`consistencyRate (${consistencyRate.toFixed(2)} < ${criteria.requiredConsistencyRate})`)
  }

  return { meets: failed.length === 0, failed }
}

// ═══════════════════════════════════════════
// 3. 核心分级函数
// ═══════════════════════════════════════════

/**
 * 为单个命例分配回归层级
 * @param entry - 命例条目
 * @returns 分配的 RegressionTier
 */
export function assignRegressionTier(entry: CaseEntryV2): RegressionTier {
  const gold = meetsCriteria(entry, GOLD_TIER_CRITERIA)
  if (gold.meets) return 'gold'

  const silver = meetsCriteria(entry, SILVER_TIER_CRITERIA)
  if (silver.meets) return 'silver'

  const bronze = meetsCriteria(entry, BRONZE_TIER_CRITERIA)
  if (bronze.meets) return 'bronze'

  return 'none'
}

/**
 * 评估单个命例的黄金分层报告
 * @param entry - 命例条目
 * @returns GoldCaseReport
 */
export function evaluateGoldCase(entry: CaseEntryV2): GoldCaseReport {
  const tier = assignRegressionTier(entry)
  const criteria = tier === 'gold'
    ? GOLD_TIER_CRITERIA
    : tier === 'silver'
      ? SILVER_TIER_CRITERIA
      : tier === 'bronze'
        ? BRONZE_TIER_CRITERIA
        : null

  const failedCriteria: string[] = []
  let meetsCriteria = false

  if (criteria) {
    const check = meetsCriteriaInternal(entry, criteria)
    meetsCriteria = check.meets
    failedCriteria.push(...check.failed)
  } else {
    const goldCheck = meetsCriteriaInternal(entry, GOLD_TIER_CRITERIA)
    const silverCheck = meetsCriteriaInternal(entry, SILVER_TIER_CRITERIA)
    const bronzeCheck = meetsCriteriaInternal(entry, BRONZE_TIER_CRITERIA)
    failedCriteria.push(`failed gold: ${goldCheck.failed.join(', ')}`)
    failedCriteria.push(`failed silver: ${silverCheck.failed.join(', ')}`)
    failedCriteria.push(`failed bronze: ${bronzeCheck.failed.join(', ')}`)
  }

  const consistencyRate = getEffectiveConsistencyRate(entry)
  const score = Math.round(
    entry.qualityScore * 0.3 +
    entry.starRating * 10 * 0.2 +
    entry.reliability * 0.3 +
    consistencyRate * 100 * 0.2,
  )

  return {
    caseId: entry.caseId,
    assignedTier: tier,
    score,
    meetsCriteria,
    failedCriteria,
  }
}

/** 内部复用：不暴露给外部 */
function meetsCriteriaInternal(entry: CaseEntryV2, criteria: GoldTierCriteria): {
  meets: boolean
  failed: string[]
} {
  return meetsCriteria(entry, criteria)
}

/**
 * 批量为命例分配回归层级
 * @param cases - 命例数组
 * @returns 每个命例的层级分配结果
 */
export function batchAssignTiers(cases: CaseEntryV2[]): Array<{
  caseId: string
  tier: RegressionTier
}> {
  return cases.map((entry) => ({
    caseId: entry.caseId,
    tier: assignRegressionTier(entry),
  }))
}

/**
 * 筛选 Gold 层级命例
 * @param cases - 命例数组
 * @returns Gold 层级命例数组
 */
export function getGoldCases(cases: CaseEntryV2[]): CaseEntryV2[] {
  return cases.filter((entry) => assignRegressionTier(entry) === 'gold')
}

/**
 * 筛选 Silver 层级命例
 * @param cases - 命例数组
 * @returns Silver 层级命例数组
 */
export function getSilverCases(cases: CaseEntryV2[]): CaseEntryV2[] {
  return cases.filter((entry) => assignRegressionTier(entry) === 'silver')
}

/**
 * 筛选 Bronze 层级命例
 * @param cases - 命例数组
 * @returns Bronze 层级命例数组
 */
export function getBronzeCases(cases: CaseEntryV2[]): CaseEntryV2[] {
  return cases.filter((entry) => assignRegressionTier(entry) === 'bronze')
}

/**
 * 验证 Gold 级案例的一致性：所有 Gold 案例经 engineFn 运行后结果必须 100% 一致
 * @param goldCases - Gold 级命例数组
 * @param engineFn - 引擎函数，接受命例返回可序列化结果
 * @returns 是否 100% 一致
 */
export function validateGoldConsistency<T>(
  goldCases: CaseEntryV2[],
  engineFn: (entry: CaseEntryV2) => T,
): boolean {
  if (goldCases.length === 0) return true
  if (goldCases.length === 1) return true

  const firstResult = JSON.stringify(engineFn(goldCases[0]))
  for (let i = 1; i < goldCases.length; i++) {
    const result = JSON.stringify(engineFn(goldCases[i]))
    if (result !== firstResult) return false
  }
  return true
}

/**
 * 获取回归黄金分层汇总统计
 * @param cases - 命例数组
 * @returns RegressionGoldSummary
 */
export function getRegressionGoldSummary(cases: CaseEntryV2[]): RegressionGoldSummary {
  let goldCount = 0
  let silverCount = 0
  let bronzeCount = 0
  let noneCount = 0
  let totalQuality = 0
  let totalReliability = 0

  for (const entry of cases) {
    const tier = assignRegressionTier(entry)
    if (tier === 'gold') goldCount++
    else if (tier === 'silver') silverCount++
    else if (tier === 'bronze') bronzeCount++
    else noneCount++

    totalQuality += entry.qualityScore
    totalReliability += entry.reliability
  }

  const total = cases.length
  return {
    total,
    goldCount,
    silverCount,
    bronzeCount,
    noneCount,
    avgQuality: total > 0 ? Math.round(totalQuality / total) : 0,
    avgReliability: total > 0 ? Math.round(totalReliability / total) : 0,
  }
}
