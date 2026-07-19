/**
 * V5.0 RC Phase 3: Case Expansion — Professional Case Database v2.0
 *
 * 职责：
 *   - 统一管理 8 种案例类型的数据存储与查询
 *   - 以 MIGRATED_SEED_CASES_V2 为种子，支持后续增量扩充
 *   - 提供类别过滤、ID 查询、统计等核心能力
 * 约束：
 *   - 不修改 v1 数据库
 *   - 所有新增案例以 CaseEntryV2 格式录入
 */

import type { CaseEntryV2, CaseCategoryV2 } from './caseLibraryTypesV2'

import { MIGRATED_SEED_CASES_V2 } from './caseDataMigration'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const CASE_DATABASE_V2_VERSION = '2.0.0'

// ═══════════════════════════════════════════
// 2. 内部数据存储（基于迁移种子 + 增量数据）
// ═══════════════════════════════════════════

/** 内部可写存储（允许运行时添加新案例） */
const _caseStoreV2: CaseEntryV2[] = [...MIGRATED_SEED_CASES_V2]

// ═══════════════════════════════════════════
// 3. 核心查询函数
// ═══════════════════════════════════════════

/**
 * 获取所有 v2 命例
 * @returns 全部命例的副本数组
 */
export function getAllCasesV2(): CaseEntryV2[] {
  return [..._caseStoreV2]
}

/**
 * 根据 caseId 查询单个命例
 * @param id - 命例唯一标识符
 * @returns 匹配的命例，未找到则 undefined
 */
export function getCaseByIdV2(id: string): CaseEntryV2 | undefined {
  return _caseStoreV2.find((entry) => entry.caseId === id)
}

/**
 * 根据类别筛选命例
 * @param category - 8 种类别之一
 * @returns 属于指定类别的命例副本数组
 */
export function getCasesByCategoryV2(category: CaseCategoryV2): CaseEntryV2[] {
  return _caseStoreV2.filter((entry) => entry.category === category).map((e) => ({ ...e }))
}

/**
 * 获取各类别命例数量统计
 * @returns 各类别计数 + 总计
 */
export function getTotalCaseCountV2(): {
  classic: number
  anonymous: number
  regression: number
  expertVerified: number
  edge: number
  conflict: number
  historical: number
  celebrity: number
  total: number
} {
  const counts: Record<CaseCategoryV2, number> = {
    classic: 0,
    anonymous: 0,
    regression: 0,
    expertVerified: 0,
    edge: 0,
    conflict: 0,
    historical: 0,
    celebrity: 0,
  }

  for (const entry of _caseStoreV2) {
    counts[entry.category]++
  }

  return {
    ...counts,
    total: _caseStoreV2.length,
  }
}

// ═══════════════════════════════════════════
// 4. 扩展查询函数
// ═══════════════════════════════════════════

/**
 * 根据质量评分范围筛选命例
 * @param minScore - 最低质量评分（含）
 * @param maxScore - 最高质量评分（含）
 */
export function getCasesByQualityScoreRangeV2(
  minScore: number,
  maxScore: number,
): CaseEntryV2[] {
  return _caseStoreV2.filter(
    (entry) => entry.qualityScore >= minScore && entry.qualityScore <= maxScore,
  )
}

/**
 * 根据回归等级筛选命例
 * @param tier - gold / silver / bronze / none
 */
export function getCasesByRegressionTierV2(
  tier: CaseEntryV2['regressionTier'],
): CaseEntryV2[] {
  return _caseStoreV2.filter((entry) => entry.regressionTier === tier)
}

/**
 * 根据审核状态筛选命例
 * @param status - pending / approved / rejected / deprecated
 */
export function getCasesByReviewStatusV2(
  status: CaseEntryV2['reviewStatus'],
): CaseEntryV2[] {
  return _caseStoreV2.filter((entry) => entry.reviewStatus === status)
}

/**
 * 根据可信度范围筛选命例
 * @param minReliability - 最低可信度（含）
 */
export function getCasesByMinReliabilityV2(minReliability: number): CaseEntryV2[] {
  return _caseStoreV2.filter((entry) => entry.reliability >= minReliability)
}

/**
 * 根据标签筛选命例（包含任意一个指定标签即可）
 * @param tags - 标签数组
 */
export function getCasesByTagsV2(tags: string[]): CaseEntryV2[] {
  return _caseStoreV2.filter((entry) =>
    tags.some((tag) => entry.tags.includes(tag)),
  )
}

/**
 * 获取排除在学习之外的命例
 */
export function getExcludedCasesV2(): CaseEntryV2[] {
  return _caseStoreV2.filter((entry) => entry.excludeFromLearning)
}

/**
 * 获取可用于学习的命例（高质量 + 未排除）
 */
export function getLearnableCasesV2(): CaseEntryV2[] {
  return _caseStoreV2.filter(
    (entry) => !entry.excludeFromLearning && entry.qualityScore >= 60,
  )
}

// ═══════════════════════════════════════════
// 5. 数据统计
// ═══════════════════════════════════════════

export interface CaseStatisticsV2 {
  total: number
  byCategory: Record<CaseCategoryV2, number>
  byReviewStatus: Record<CaseEntryV2['reviewStatus'], number>
  byRegressionTier: Record<CaseEntryV2['regressionTier'], number>
  avgQualityScore: number
  avgReliability: number
  avgConfidence: number
  learnableCount: number
  excludedCount: number
  pendingReviewCount: number
  withExpertOpinionCount: number
  withConflictCount: number
}

/**
 * 获取 v2 命例库完整统计
 */
export function getCaseStatisticsV2(): CaseStatisticsV2 {
  const byCategory: Record<CaseCategoryV2, number> = {
    classic: 0, anonymous: 0, regression: 0, expertVerified: 0,
    edge: 0, conflict: 0, historical: 0, celebrity: 0,
  }
  const byReviewStatus: Record<CaseEntryV2['reviewStatus'], number> = {
    pending: 0, approved: 0, rejected: 0, deprecated: 0,
  }
  const byRegressionTier: Record<CaseEntryV2['regressionTier'], number> = {
    gold: 0, silver: 0, bronze: 0, none: 0,
  }

  let totalQuality = 0
  let totalReliability = 0
  let totalConfidence = 0
  let learnableCount = 0
  let excludedCount = 0
  let withExpertOpinionCount = 0
  let withConflictCount = 0

  for (const entry of _caseStoreV2) {
    byCategory[entry.category]++
    byReviewStatus[entry.reviewStatus]++
    byRegressionTier[entry.regressionTier]++
    totalQuality += entry.qualityScore
    totalReliability += entry.reliability
    totalConfidence += entry.confidence
    if (!entry.excludeFromLearning && entry.qualityScore >= 60) learnableCount++
    if (entry.excludeFromLearning) excludedCount++
    if (entry.expertOpinions.length > 0) withExpertOpinionCount++
    if (entry.conflicts.length > 0) withConflictCount++
  }

  const total = _caseStoreV2.length

  return {
    total,
    byCategory,
    byReviewStatus,
    byRegressionTier,
    avgQualityScore: total > 0 ? Math.round(totalQuality / total) : 0,
    avgReliability: total > 0 ? Math.round(totalReliability / total) : 0,
    avgConfidence: total > 0 ? Math.round(totalConfidence * 100 / total) / 100 : 0,
    learnableCount,
    excludedCount,
    pendingReviewCount: byReviewStatus.pending,
    withExpertOpinionCount,
    withConflictCount,
  }
}

// ═══════════════════════════════════════════
// 6. 数据管理（运行时增删改）
// ═══════════════════════════════════════════

/**
 * 添加新命例到 v2 数据库
 * @param entry - 完整 CaseEntryV2
 * @returns 是否添加成功（caseId 已存在则失败）
 */
export function addCaseV2(entry: CaseEntryV2): boolean {
  if (_caseStoreV2.some((e) => e.caseId === entry.caseId)) {
    return false
  }
  _caseStoreV2.push({ ...entry })
  return true
}

/**
 * 批量添加命例
 * @param entries - CaseEntryV2 数组
 * @returns 成功添加的数量
 */
export function addCasesV2(entries: CaseEntryV2[]): number {
  let count = 0
  for (const entry of entries) {
    if (addCaseV2(entry)) count++
  }
  return count
}

/**
 * 更新命例（覆盖式）
 * @param caseId - 目标命例 ID
 * @param updater - 部分更新字段
 * @returns 是否更新成功
 */
export function updateCaseV2(
  caseId: string,
  updater: Partial<Omit<CaseEntryV2, 'caseId'>>,
): boolean {
  const idx = _caseStoreV2.findIndex((e) => e.caseId === caseId)
  if (idx === -1) return false
  _caseStoreV2[idx] = { ..._caseStoreV2[idx], ...updater, updatedAt: Date.now() }
  return true
}

/**
 * 删除命例（标记为 deprecated，非物理删除）
 * @param caseId - 目标命例 ID
 * @returns 是否操作成功
 */
export function deprecateCaseV2(caseId: string): boolean {
  return updateCaseV2(caseId, { reviewStatus: 'deprecated' })
}

/**
 * 清空 v2 内部存储（仅测试用）
 */
export function clearCaseStoreV2(): void {
  _caseStoreV2.length = 0
}

/**
 * 重置为种子数据（仅测试用）
 */
export function resetCaseStoreV2(): void {
  _caseStoreV2.length = 0
  _caseStoreV2.push(...MIGRATED_SEED_CASES_V2)
}

// ═══════════════════════════════════════════
// 7. 种子数据直接导出（供外部引用）
// ═══════════════════════════════════════════

export { MIGRATED_SEED_CASES_V2 }
