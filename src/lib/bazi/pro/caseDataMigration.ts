/**
 * V5.0 RC Phase 3: Case Expansion — v1 -> v2 数据迁移引擎
 *
 * 职责：
 *   - 从 v1 数据库读取数据并迁移为 v2 格式
 *   - 提供迁移审计功能
 *   - 导出 MIGRATED_SEED_CASES_V2 作为 v2 种子数据
 * 约束：
 *   - 不修改 v1 数据库文件
 *   - 迁移过程可审计、可追溯
 */

import {
  migrateClassicCaseV1ToV2,
  migrateAnonymousCaseV1ToV2,
  migrateRegressionCaseV1ToV2,
  migrateCaseV1ToV2,
} from './caseCompatibility'

import type { CaseEntryV2 } from './caseLibraryTypesV2'

import {
  CLASSIC_CASES,
  ANONYMOUS_CASES,
  REGRESSION_CASES,
} from './caseDatabase'

// ═══════════════════════════════════════════
// 1. 迁移执行
// ═══════════════════════════════════════════

/** 迁移后的 v2 种子数据集 */
export const MIGRATED_SEED_CASES_V2: readonly CaseEntryV2[] = [
  ...CLASSIC_CASES.map(migrateClassicCaseV1ToV2),
  ...ANONYMOUS_CASES.map(migrateAnonymousCaseV1ToV2),
  ...REGRESSION_CASES.map(migrateRegressionCaseV1ToV2),
]

/** v1 原始数据总数 */
export const V1_SOURCE_COUNT = {
  classic: CLASSIC_CASES.length,
  anonymous: ANONYMOUS_CASES.length,
  regression: REGRESSION_CASES.length,
  total: CLASSIC_CASES.length + ANONYMOUS_CASES.length + REGRESSION_CASES.length,
}

// ═══════════════════════════════════════════
// 2. 迁移审计
// ═══════════════════════════════════════════

export interface MigrationAuditReport {
  v1Total: number
  v2Total: number
  migratedCount: number
  failedCount: number
  categoryBreakdown: {
    classic: { v1: number; v2: number }
    anonymous: { v1: number; v2: number }
    regression: { v1: number; v2: number }
  }
  qualityScoreRange: { min: number; max: number; avg: number }
  reliabilityRange: { min: number; max: number; avg: number }
  errors: string[]
  timestamp: number
}

/**
 * 执行迁移审计
 * 比对 v1 总数与 v2 迁移结果，确保无丢失
 */
export function runMigrationAudit(): MigrationAuditReport {
  const errors: string[] = []
  let failedCount = 0

  // 逐个验证迁移
  for (const v1Case of [...CLASSIC_CASES, ...ANONYMOUS_CASES, ...REGRESSION_CASES]) {
    try {
      const v2 = migrateCaseV1ToV2(v1Case as never)
      if (!v2 || !v2.caseId) {
        errors.push(`迁移失败: ${v1Case.caseId} - 输出无效`)
        failedCount++
      }
    } catch (e) {
      errors.push(`迁移异常: ${v1Case.caseId} - ${e instanceof Error ? e.message : String(e)}`)
      failedCount++
    }
  }

  const v2Total = MIGRATED_SEED_CASES_V2.length
  const v1Total = V1_SOURCE_COUNT.total

  // 类别统计
  const classicV2 = MIGRATED_SEED_CASES_V2.filter((c) => c.category === 'classic').length
  const anonymousV2 = MIGRATED_SEED_CASES_V2.filter((c) => c.category === 'anonymous').length
  const regressionV2 = MIGRATED_SEED_CASES_V2.filter((c) => c.category === 'regression').length

  // 质量评分统计
  const qualityScores = MIGRATED_SEED_CASES_V2.map((c) => c.qualityScore)
  const reliabilityScores = MIGRATED_SEED_CASES_V2.map((c) => c.reliability)

  return {
    v1Total,
    v2Total,
    migratedCount: v2Total,
    failedCount,
    categoryBreakdown: {
      classic: { v1: V1_SOURCE_COUNT.classic, v2: classicV2 },
      anonymous: { v1: V1_SOURCE_COUNT.anonymous, v2: anonymousV2 },
      regression: { v1: V1_SOURCE_COUNT.regression, v2: regressionV2 },
    },
    qualityScoreRange: {
      min: Math.min(...qualityScores),
      max: Math.max(...qualityScores),
      avg: Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length),
    },
    reliabilityRange: {
      min: Math.min(...reliabilityScores),
      max: Math.max(...reliabilityScores),
      avg: Math.round(reliabilityScores.reduce((a, b) => a + b, 0) / reliabilityScores.length),
    },
    errors,
    timestamp: Date.now(),
  }
}

/**
 * 验证迁移完整性
 * 返回 true 表示 v1 和 v2 数量完全匹配且零错误
 */
export function verifyMigrationIntegrity(): boolean {
  const audit = runMigrationAudit()
  return (
    audit.v1Total === audit.v2Total &&
    audit.failedCount === 0 &&
    audit.errors.length === 0
  )
}

// ═══════════════════════════════════════════
// 3. 辅助查询
// ═══════════════════════════════════════════

/** 获取所有已迁移的 v2 种子命例 */
export function getMigratedSeedCasesV2(): CaseEntryV2[] {
  return [...MIGRATED_SEED_CASES_V2]
}

/** 按类别获取已迁移的种子命例 */
export function getMigratedSeedCasesByCategoryV2(
  category: CaseEntryV2['category'],
): CaseEntryV2[] {
  return MIGRATED_SEED_CASES_V2.filter((c) => c.category === category).map((c) => ({ ...c }))
}

/** 获取迁移统计摘要 */
export function getMigrationSummary(): {
  total: number
  categories: Record<string, number>
  avgQualityScore: number
  avgReliability: number
} {
  const categories: Record<string, number> = {}
  for (const c of MIGRATED_SEED_CASES_V2) {
    categories[c.category] = (categories[c.category] || 0) + 1
  }

  const total = MIGRATED_SEED_CASES_V2.length
  const avgQualityScore =
    Math.round(
      MIGRATED_SEED_CASES_V2.reduce((sum, c) => sum + c.qualityScore, 0) / total,
    ) || 0
  const avgReliability =
    Math.round(
      MIGRATED_SEED_CASES_V2.reduce((sum, c) => sum + c.reliability, 0) / total,
    ) || 0

  return { total, categories, avgQualityScore, avgReliability }
}
