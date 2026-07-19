/**
 * V5.0 RC Phase 3: Case Database v2.0 测试套件
 *
 * 覆盖：
 *   - 类型工具函数
 *   - v1 -> v2 迁移
 *   - v2 -> v1 降级
 *   - 数据库查询与统计
 *   - 数据管理（增删改）
 */

import { describe, test, expect, beforeEach } from 'vitest'
import type { CaseEntryV2, CaseCategoryV2 } from '../caseLibraryTypesV2'
import {
  generateCaseIdV2,
  scoreToStarRating,
  starRatingToString,
  createEmptyCaseEntryV2,
  calculateReliabilityScore,
  validateCaseEntryV2,
  getCaseCategoryDisplayV2,
  isClassicCaseV2,
  isAnonymousCaseV2,
  isRegressionCaseV2,
  isExpertVerifiedCaseV2,
} from '../caseLibraryTypesV2'

import {
  migrateClassicCaseV1ToV2,
  migrateAnonymousCaseV1ToV2,
  migrateRegressionCaseV1ToV2,
  migrateCaseV1ToV2,
  downgradeCaseV2ToV1,
  downgradeCasesV2ToV1,
  mapCategoryV1ToV2,
  mapCategoryV2ToV1,
} from '../caseCompatibility'

import {
  runMigrationAudit,
  verifyMigrationIntegrity,
  getMigrationSummary,
  MIGRATED_SEED_CASES_V2,
} from '../caseDataMigration'

import {
  CASE_DATABASE_V2_VERSION,
  getAllCasesV2,
  getCaseByIdV2,
  getCasesByCategoryV2,
  getTotalCaseCountV2,
  getCasesByQualityScoreRangeV2,
  getCasesByRegressionTierV2,
  getCasesByReviewStatusV2,
  getCasesByMinReliabilityV2,
  getCasesByTagsV2,
  getExcludedCasesV2,
  getLearnableCasesV2,
  getCaseStatisticsV2,
  addCaseV2,
  addCasesV2,
  updateCaseV2,
  deprecateCaseV2,
  clearCaseStoreV2,
  resetCaseStoreV2,
} from '../caseDatabaseV2'

import {
  CLASSIC_CASES,
  ANONYMOUS_CASES,
  REGRESSION_CASES,
} from '../caseDatabase'

// ─── 测试辅助：创建最小可用 v2 命例 ───
function makeMinimalCaseV2(
  caseId: string,
  category: CaseCategoryV2,
): CaseEntryV2 {
  return {
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
    source: 'test',
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
      expertCount: 0,
      consensusRate: 0,
      citationCount: 0,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

// ═══════════════════════════════════════════
// Group 1: 类型工具函数
// ═══════════════════════════════════════════

describe('caseLibraryTypesV2 utilities', () => {
  test('generateCaseIdV2 produces correct prefix', () => {
    const id = generateCaseIdV2('classic')
    expect(id.startsWith('CLS-')).toBe(true)
    expect(id.length).toBeGreaterThan(4)
  })

  test('scoreToStarRating maps correctly', () => {
    expect(scoreToStarRating(95)).toBe(5)
    expect(scoreToStarRating(80)).toBe(4)
    expect(scoreToStarRating(65)).toBe(3)
    expect(scoreToStarRating(50)).toBe(2)
    expect(scoreToStarRating(30)).toBe(1)
  })

  test('starRatingToString renders stars', () => {
    expect(starRatingToString(5)).toBe('★★★★★')
    expect(starRatingToString(3)).toBe('★★★☆☆')
    expect(starRatingToString(1)).toBe('★☆☆☆☆')
  })

  test('createEmptyCaseEntryV2 returns valid structure', () => {
    const entry = createEmptyCaseEntryV2('TEST-001', 'classic', {
      yearGan: '乙', yearZhi: '丑', monthGan: '丁', monthZhi: '卯',
      dayGan: '乙', dayZhi: '丑', hourGan: '丁', hourZhi: '卯',
      gender: 'female',
    })
    expect(entry.caseId).toBe('TEST-001')
    expect(entry.category).toBe('classic')
    expect(entry.qualityScore).toBe(0)
    expect(entry.excludeFromLearning).toBe(true)
  })

  test('calculateReliabilityScore weights correctly', () => {
    const score = calculateReliabilityScore({
      dataCompleteness: 100,
      sourceCredibility: 100,
      expertCount: 5,
      consensusRate: 100,
      citationCount: 10,
    })
    expect(score).toBeGreaterThanOrEqual(90)
    expect(score).toBeLessThanOrEqual(100)
  })

  test('validateCaseEntryV2 detects missing fields', () => {
    const entry = createEmptyCaseEntryV2('TEST-002', 'anonymous', {
      yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅',
      dayGan: '甲', dayZhi: '子', hourGan: '甲', hourZhi: '子',
      gender: 'male',
    })
    const result = validateCaseEntryV2(entry)
    expect(result.valid).toBe(false)
    expect(result.missingFields.length).toBeGreaterThan(0)
    expect(result.completenessRate).toBeLessThan(100)
  })

  test('validateCaseEntryV2 passes for valid entry', () => {
    const entry = makeMinimalCaseV2('TEST-003', 'classic')
    const result = validateCaseEntryV2(entry)
    expect(result.valid).toBe(true)
    expect(result.completenessRate).toBe(100)
  })

  test('getCaseCategoryDisplayV2 returns Chinese names', () => {
    expect(getCaseCategoryDisplayV2('classic')).toBe('经典命例')
    expect(getCaseCategoryDisplayV2('anonymous')).toBe('匿名命例')
    expect(getCaseCategoryDisplayV2('expertVerified')).toBe('专家验证')
  })

  test('is*CaseV2 type guards work', () => {
    const classic = makeMinimalCaseV2('C-001', 'classic')
    expect(isClassicCaseV2(classic)).toBe(true)
    expect(isAnonymousCaseV2(classic)).toBe(false)

    const anon = makeMinimalCaseV2('A-001', 'anonymous')
    expect(isAnonymousCaseV2(anon)).toBe(true)

    const reg = makeMinimalCaseV2('R-001', 'regression')
    expect(isRegressionCaseV2(reg)).toBe(true)

    const exp = makeMinimalCaseV2('E-001', 'expertVerified')
    expect(isExpertVerifiedCaseV2(exp)).toBe(true)
  })
})

// ═══════════════════════════════════════════
// Group 2: v1 -> v2 迁移
// ═══════════════════════════════════════════

describe('caseCompatibility migration', () => {
  test('mapCategoryV1ToV2 maps all v1 categories', () => {
    expect(mapCategoryV1ToV2('classic')).toBe('classic')
    expect(mapCategoryV1ToV2('anonymous')).toBe('anonymous')
    expect(mapCategoryV1ToV2('regression')).toBe('regression')
  })

  test('mapCategoryV2ToV1 only maps compatible categories', () => {
    expect(mapCategoryV2ToV1('classic')).toBe('classic')
    expect(mapCategoryV2ToV1('edge')).toBeUndefined()
    expect(mapCategoryV2ToV1('conflict')).toBeUndefined()
  })

  test('migrateClassicCaseV1ToV2 preserves pillars and adds fields', () => {
    const v1 = CLASSIC_CASES[0]
    const v2 = migrateClassicCaseV1ToV2(v1)
    expect(v2.caseId).toBe(v1.caseId)
    expect(v2.category).toBe('classic')
    expect(v2.yearGan).toBe(v1.yearGan)
    expect(v2.qualityScore).toBeGreaterThanOrEqual(85)
    expect(v2.starRating).toBeGreaterThanOrEqual(4)
    expect(v2.version).toBe(1)
    expect(v2.reliability).toBeGreaterThan(0)
    expect(v2.tags.length).toBeGreaterThan(0)
  })

  test('migrateAnonymousCaseV1ToV2 uses confidence as qualityScore', () => {
    const v1 = ANONYMOUS_CASES[0]
    const v2 = migrateAnonymousCaseV1ToV2(v1)
    expect(v2.category).toBe('anonymous')
    expect(v2.qualityScore).toBe(Math.round(v1.confidence * 100))
    expect(v2.confidence).toBe(v1.confidence)
    expect(v2.anonymityLevel).toBe('full')
  })

  test('migrateRegressionCaseV1ToV2 preserves snapshot metadata', () => {
    const v1 = REGRESSION_CASES[0]
    const v2 = migrateRegressionCaseV1ToV2(v1)
    expect(v2.category).toBe('regression')
    expect(v2.snapshotVersion).toBe(v1.snapshotVersion)
    expect(v2.snapshotAt).toBe(v1.snapshotAt)
  })

  test('migrateCaseV1ToV2 auto-detects all types', () => {
    const classic = migrateCaseV1ToV2(CLASSIC_CASES[0] as never)
    expect(classic.category).toBe('classic')

    const anon = migrateCaseV1ToV2(ANONYMOUS_CASES[0] as never)
    expect(anon.category).toBe('anonymous')

    const reg = migrateCaseV1ToV2(REGRESSION_CASES[0] as never)
    expect(reg.category).toBe('regression')
  })
})

// ═══════════════════════════════════════════
// Group 3: v2 -> v1 降级
// ═══════════════════════════════════════════

describe('caseCompatibility downgrade', () => {
  test('downgradeCaseV2ToV1 works for classic/anon/regression', () => {
    const classicV2 = migrateClassicCaseV1ToV2(CLASSIC_CASES[0])
    const v1 = downgradeCaseV2ToV1(classicV2)
    expect(v1).not.toBeNull()
    expect(v1!.caseId).toBe(classicV2.caseId)
  })

  test('downgradeCaseV2ToV1 returns null for unsupported categories', () => {
    const edgeCase = makeMinimalCaseV2('EDG-001', 'edge')
    const v1 = downgradeCaseV2ToV1(edgeCase)
    expect(v1).toBeNull()
  })

  test('downgradeCasesV2ToV1 filters unsupported categories', () => {
    const cases = [
      migrateClassicCaseV1ToV2(CLASSIC_CASES[0]),
      makeMinimalCaseV2('EDG-001', 'edge'),
      migrateAnonymousCaseV1ToV2(ANONYMOUS_CASES[0]),
    ]
    const v1Cases = downgradeCasesV2ToV1(cases)
    expect(v1Cases.length).toBe(2)
  })
})

// ═══════════════════════════════════════════
// Group 4: 迁移审计
// ═══════════════════════════════════════════

describe('caseDataMigration audit', () => {
  test('MIGRATED_SEED_CASES_V2 contains all v1 cases', () => {
    const v1Total = CLASSIC_CASES.length + ANONYMOUS_CASES.length + REGRESSION_CASES.length
    expect(MIGRATED_SEED_CASES_V2.length).toBe(v1Total)
  })

  test('runMigrationAudit reports correct counts', () => {
    const audit = runMigrationAudit()
    expect(audit.v1Total).toBe(audit.v2Total)
    expect(audit.failedCount).toBe(0)
    expect(audit.errors.length).toBe(0)
    expect(audit.categoryBreakdown.classic.v1).toBe(CLASSIC_CASES.length)
    expect(audit.categoryBreakdown.classic.v2).toBe(CLASSIC_CASES.length)
  })

  test('verifyMigrationIntegrity returns true', () => {
    expect(verifyMigrationIntegrity()).toBe(true)
  })

  test('getMigrationSummary has correct totals', () => {
    const summary = getMigrationSummary()
    expect(summary.total).toBe(MIGRATED_SEED_CASES_V2.length)
    expect(summary.categories.classic).toBe(CLASSIC_CASES.length)
    expect(summary.categories.anonymous).toBe(ANONYMOUS_CASES.length)
    expect(summary.categories.regression).toBe(REGRESSION_CASES.length)
  })
})

// ═══════════════════════════════════════════
// Group 5: v2 数据库查询
// ═══════════════════════════════════════════

describe('caseDatabaseV2 queries', () => {
  beforeEach(() => {
    resetCaseStoreV2()
  })

  test('CASE_DATABASE_V2_VERSION is 2.0.0', () => {
    expect(CASE_DATABASE_V2_VERSION).toBe('2.0.0')
  })

  test('getAllCasesV2 returns seed data', () => {
    const all = getAllCasesV2()
    expect(all.length).toBe(MIGRATED_SEED_CASES_V2.length)
  })

  test('getCaseByIdV2 finds existing case', () => {
    const c = getCaseByIdV2('CLS-001')
    expect(c).toBeDefined()
    expect(c!.caseId).toBe('CLS-001')
  })

  test('getCaseByIdV2 returns undefined for unknown id', () => {
    expect(getCaseByIdV2('UNKNOWN')).toBeUndefined()
  })

  test('getCasesByCategoryV2 filters correctly', () => {
    expect(getCasesByCategoryV2('classic').length).toBe(CLASSIC_CASES.length)
    expect(getCasesByCategoryV2('anonymous').length).toBe(ANONYMOUS_CASES.length)
    expect(getCasesByCategoryV2('regression').length).toBe(REGRESSION_CASES.length)
    expect(getCasesByCategoryV2('edge').length).toBe(0)
  })

  test('getTotalCaseCountV2 sums correctly', () => {
    const counts = getTotalCaseCountV2()
    expect(counts.total).toBe(MIGRATED_SEED_CASES_V2.length)
    expect(counts.classic).toBe(CLASSIC_CASES.length)
    expect(counts.anonymous).toBe(ANONYMOUS_CASES.length)
    expect(counts.regression).toBe(REGRESSION_CASES.length)
    expect(counts.edge).toBe(0)
  })

  test('getCasesByQualityScoreRangeV2 filters by score', () => {
    const high = getCasesByQualityScoreRangeV2(80, 100)
    expect(high.length).toBeGreaterThanOrEqual(1)
    const low = getCasesByQualityScoreRangeV2(0, 30)
    expect(low.length).toBe(0)
  })

  test('getCasesByRegressionTierV2 returns only matching tier', () => {
    const gold = getCasesByRegressionTierV2('gold')
    expect(gold.length).toBe(0)
    const none = getCasesByRegressionTierV2('none')
    expect(none.length).toBe(MIGRATED_SEED_CASES_V2.length)
  })

  test('getCasesByReviewStatusV2 filters by status', () => {
    const approved = getCasesByReviewStatusV2('approved')
    expect(approved.length).toBeGreaterThanOrEqual(1)
  })

  test('getCasesByTagsV2 matches any tag', () => {
    const cases = getCasesByTagsV2(['日主五行:木'])
    expect(cases.length).toBeGreaterThanOrEqual(1)
  })

  test('getLearnableCasesV2 excludes low quality', () => {
    const learnable = getLearnableCasesV2()
    for (const c of learnable) {
      expect(c.qualityScore).toBeGreaterThanOrEqual(60)
      expect(c.excludeFromLearning).toBe(false)
    }
  })
})

// ═══════════════════════════════════════════
// Group 6: v2 数据统计
// ═══════════════════════════════════════════

describe('caseDatabaseV2 statistics', () => {
  beforeEach(() => {
    resetCaseStoreV2()
  })

  test('getCaseStatisticsV2 returns comprehensive stats', () => {
    const stats = getCaseStatisticsV2()
    expect(stats.total).toBe(MIGRATED_SEED_CASES_V2.length)
    expect(stats.byCategory.classic).toBe(CLASSIC_CASES.length)
    expect(stats.avgQualityScore).toBeGreaterThan(0)
    expect(stats.avgReliability).toBeGreaterThan(0)
    expect(stats.learnableCount + stats.excludedCount).toBeLessThanOrEqual(stats.total)
  })
})

// ═══════════════════════════════════════════
// Group 7: v2 数据管理
// ═══════════════════════════════════════════

describe('caseDatabaseV2 CRUD', () => {
  beforeEach(() => {
    resetCaseStoreV2()
  })

  test('addCaseV2 adds new case', () => {
    const entry = makeMinimalCaseV2('NEW-001', 'edge')
    expect(addCaseV2(entry)).toBe(true)
    expect(getCaseByIdV2('NEW-001')).toBeDefined()
  })

  test('addCaseV2 rejects duplicate caseId', () => {
    const entry = makeMinimalCaseV2('CLS-001', 'edge')
    expect(addCaseV2(entry)).toBe(false)
  })

  test('addCasesV2 batch adds correctly', () => {
    const entries = [
      makeMinimalCaseV2('BATCH-001', 'edge'),
      makeMinimalCaseV2('BATCH-002', 'historical'),
    ]
    expect(addCasesV2(entries)).toBe(2)
    expect(getCaseByIdV2('BATCH-001')).toBeDefined()
  })

  test('updateCaseV2 modifies existing case', () => {
    const before = getCaseByIdV2('CLS-001')!
    expect(updateCaseV2('CLS-001', { qualityScore: 99, name: 'Updated' })).toBe(true)
    const after = getCaseByIdV2('CLS-001')!
    expect(after.qualityScore).toBe(99)
    expect(after.name).toBe('Updated')
    expect(after.updatedAt).toBeGreaterThanOrEqual(before.updatedAt)
  })

  test('updateCaseV2 returns false for unknown id', () => {
    expect(updateCaseV2('UNKNOWN', { qualityScore: 99 })).toBe(false)
  })

  test('deprecateCaseV2 marks as deprecated', () => {
    expect(deprecateCaseV2('CLS-001')).toBe(true)
    expect(getCaseByIdV2('CLS-001')!.reviewStatus).toBe('deprecated')
  })

  test('clearCaseStoreV2 empties store', () => {
    clearCaseStoreV2()
    expect(getAllCasesV2().length).toBe(0)
  })

  test('resetCaseStoreV2 restores seed data', () => {
    clearCaseStoreV2()
    resetCaseStoreV2()
    expect(getAllCasesV2().length).toBe(MIGRATED_SEED_CASES_V2.length)
  })
})
