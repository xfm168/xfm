/**
 * Regression Gold Types
 *
 * 定义回归黄金分层相关类型与常量
 */

import type { RegressionTier } from './caseLibraryTypesV2'

/** 黄金层级判定标准 */
export interface GoldTierCriteria {
  minQualityScore: number
  minStarRating: number
  minReliability: number
  requiredExpertOpinions: number
  requiredConsistencyRate: number
}

/** 单个案例的黄金分层报告 */
export interface GoldCaseReport {
  caseId: string
  assignedTier: RegressionTier
  score: number
  meetsCriteria: boolean
  failedCriteria: string[]
}

/** 回归黄金分层汇总统计 */
export interface RegressionGoldSummary {
  total: number
  goldCount: number
  silverCount: number
  bronzeCount: number
  noneCount: number
  avgQuality: number
  avgReliability: number
}

// ═══════════════════════════════════════════
// 预设层级标准
// ═══════════════════════════════════════════

/** Gold 层级标准 */
export const GOLD_TIER_CRITERIA: GoldTierCriteria = {
  minQualityScore: 85,
  minStarRating: 4,
  minReliability: 80,
  requiredExpertOpinions: 3,
  requiredConsistencyRate: 0.85,
}

/** Silver 层级标准 */
export const SILVER_TIER_CRITERIA: GoldTierCriteria = {
  minQualityScore: 70,
  minStarRating: 3,
  minReliability: 60,
  requiredExpertOpinions: 1,
  requiredConsistencyRate: 0.70,
}

/** Bronze 层级标准 */
export const BRONZE_TIER_CRITERIA: GoldTierCriteria = {
  minQualityScore: 50,
  minStarRating: 2,
  minReliability: 40,
  requiredExpertOpinions: 0,
  requiredConsistencyRate: 0.50,
}
