/**
 * V5.0 RC Phase 3: Case Expansion — v1 / v2 双向兼容层
 *
 * 职责：
 *   - v1 -> v2 迁移（数据升级）
 *   - v2 -> v1 降级（兼容现有 v1 引擎）
 *   - 类别映射
 * 约束：不修改任何 v1 文件
 */

import type {
  CaseEntryV2,
  CaseCategoryV2,
  CasePillarsInput,
  CaseExpectedResultV2,
  CaseEntryV1,
  ClassicCaseV1,
  AnonymousCaseV1,
  RegressionCaseV1,
  CaseCategoryV1,
} from './caseLibraryTypesV2'

import { scoreToStarRating, calculateReliabilityScore } from './caseLibraryTypesV2'

// ═══════════════════════════════════════════
// 1. 类别映射
// ═══════════════════════════════════════════

/** v1 category -> v2 category */
export function mapCategoryV1ToV2(cat: CaseCategoryV1): CaseCategoryV2 {
  const map: Record<CaseCategoryV1, CaseCategoryV2> = {
    classic: 'classic',
    anonymous: 'anonymous',
    regression: 'regression',
  }
  return map[cat]
}

/** v2 category -> v1 category（降级用，不匹配的返回 undefined） */
export function mapCategoryV2ToV1(cat: CaseCategoryV2): CaseCategoryV1 | undefined {
  const map: Partial<Record<CaseCategoryV2, CaseCategoryV1>> = {
    classic: 'classic',
    anonymous: 'anonymous',
    regression: 'regression',
  }
  return map[cat]
}

// ═══════════════════════════════════════════
// 2. v1 -> v2 迁移函数
// ═══════════════════════════════════════════

/**
 * 迁移经典命例 v1 -> v2
 */
export function migrateClassicCaseV1ToV2(v1: ClassicCaseV1): CaseEntryV2 {
  const now = Date.now()
  const qualityScore = v1.dynasty ? 90 : 85
  const tags = generateTagsFromExpectedResult(v1.expectedResult)

  return {
    caseId: v1.caseId,
    category: 'classic',
    yearGan: v1.yearGan,
    yearZhi: v1.yearZhi,
    monthGan: v1.monthGan,
    monthZhi: v1.monthZhi,
    dayGan: v1.dayGan,
    dayZhi: v1.dayZhi,
    hourGan: v1.hourGan,
    hourZhi: v1.hourZhi,
    gender: v1.gender,
    birthDate: undefined,
    expectedResult: v1.expectedResult,
    qualityScore,
    starRating: scoreToStarRating(qualityScore),
    confidence: 0.85,
    excludeFromLearning: false,
    verifiedBy: [],
    reviewStatus: 'approved',
    source: v1.source,
    evidence: [],
    referenceBooks: [v1.source],
    tags,
    keywords: tags,
    expertOpinions: [],
    conflicts: [],
    regressionTier: 'none',
    version: 1,
    history: [],
    changeLog: ['Migrated from v1.0.0'],
    reliability: 70,
    reliabilityDimensions: {
      dataCompleteness: 85,
      sourceCredibility: 90,
      expertCount: 0,
      consensusRate: 0,
      citationCount: 1,
    },
    name: v1.name,
    description: v1.description,
    dynasty: v1.dynasty,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 迁移匿名命例 v1 -> v2
 */
export function migrateAnonymousCaseV1ToV2(v1: AnonymousCaseV1): CaseEntryV2 {
  const now = Date.now()
  const qualityScore = Math.round(v1.confidence * 100)
  const tags = generateTagsFromExpectedResult(v1.expectedResult)

  return {
    caseId: v1.caseId,
    category: 'anonymous',
    yearGan: v1.yearGan,
    yearZhi: v1.yearZhi,
    monthGan: v1.monthGan,
    monthZhi: v1.monthZhi,
    dayGan: v1.dayGan,
    dayZhi: v1.dayZhi,
    hourGan: v1.hourGan,
    hourZhi: v1.hourZhi,
    gender: v1.gender,
    birthDate: undefined,
    expectedResult: v1.expectedResult,
    qualityScore,
    starRating: scoreToStarRating(qualityScore),
    confidence: v1.confidence,
    excludeFromLearning: qualityScore < 60,
    verifiedBy: [],
    reviewStatus: 'pending',
    source: v1.source,
    evidence: [],
    referenceBooks: [],
    tags,
    keywords: tags,
    expertOpinions: [],
    conflicts: [],
    regressionTier: 'none',
    version: 1,
    history: [],
    changeLog: ['Migrated from v1.0.0'],
    reliability: 50,
    reliabilityDimensions: {
      dataCompleteness: 60,
      sourceCredibility: 50,
      expertCount: 0,
      consensusRate: 0,
      citationCount: 0,
    },
    anonymityLevel: 'full',
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 迁移回归样本 v1 -> v2
 */
export function migrateRegressionCaseV1ToV2(v1: RegressionCaseV1): CaseEntryV2 {
  const now = Date.now()
  const qualityScore = 70
  const tags = generateTagsFromExpectedResult(v1.expectedResult)

  return {
    caseId: v1.caseId,
    category: 'regression',
    yearGan: v1.yearGan,
    yearZhi: v1.yearZhi,
    monthGan: v1.monthGan,
    monthZhi: v1.monthZhi,
    dayGan: v1.dayGan,
    dayZhi: v1.dayZhi,
    hourGan: v1.hourGan,
    hourZhi: v1.hourZhi,
    gender: v1.gender,
    birthDate: undefined,
    expectedResult: v1.expectedResult,
    qualityScore,
    starRating: scoreToStarRating(qualityScore),
    confidence: 0.7,
    excludeFromLearning: false,
    verifiedBy: [],
    reviewStatus: 'approved',
    source: `snapshot-${v1.snapshotVersion}`,
    evidence: [],
    referenceBooks: [],
    tags,
    keywords: tags,
    expertOpinions: [],
    conflicts: [],
    regressionTier: 'none',
    version: 1,
    history: [],
    changeLog: ['Migrated from v1.0.0'],
    reliability: 55,
    reliabilityDimensions: {
      dataCompleteness: 70,
      sourceCredibility: 60,
      expertCount: 0,
      consensusRate: 0,
      citationCount: 0,
    },
    snapshotVersion: v1.snapshotVersion,
    snapshotAt: v1.snapshotAt,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 统一迁移入口：任意 v1 命例 -> v2
 */
export function migrateCaseV1ToV2(v1: CaseEntryV1): CaseEntryV2 {
  // 通过特征字段判断具体类型
  if ('snapshotVersion' in v1 && typeof v1.snapshotVersion === 'string') {
    return migrateRegressionCaseV1ToV2(v1 as RegressionCaseV1)
  }
  if ('confidence' in v1 && typeof v1.confidence === 'number') {
    return migrateAnonymousCaseV1ToV2(v1 as AnonymousCaseV1)
  }
  return migrateClassicCaseV1ToV2(v1 as ClassicCaseV1)
}

// ═══════════════════════════════════════════
// 3. v2 -> v1 降级函数（兼容现有引擎）
// ═══════════════════════════════════════════

/**
 * v2 -> v1 降级（仅支持可降级的类别）
 * 若 category 不可降级（如 edge / conflict / historical / celebrity / expertVerified），返回 null
 */
export function downgradeCaseV2ToV1(v2: CaseEntryV2): CaseEntryV1 | null {
  const v1Category = mapCategoryV2ToV1(v2.category)
  if (!v1Category) return null

  const base = extractPillarsAndExpected(v2)

  switch (v1Category) {
    case 'classic':
      return {
        ...base,
        caseId: v2.caseId,
        name: v2.name || v2.caseId,
        description: v2.description || '',
        source: v2.source,
        dynasty: v2.dynasty,
        expectedResult: v2.expectedResult,
      } as ClassicCaseV1

    case 'anonymous':
      return {
        ...base,
        caseId: v2.caseId,
        expectedResult: v2.expectedResult,
        confidence: v2.confidence,
        source: v2.source,
      } as AnonymousCaseV1

    case 'regression':
      return {
        ...base,
        caseId: v2.caseId,
        expectedResult: v2.expectedResult,
        snapshotVersion: v2.snapshotVersion || '7.0.0',
        snapshotAt: v2.snapshotAt || Date.now(),
      } as RegressionCaseV1
  }
}

/**
 * 批量降级 v2 -> v1
 * 仅保留可降级的命例，跳过不可降级的类别
 */
export function downgradeCasesV2ToV1(v2Cases: CaseEntryV2[]): CaseEntryV1[] {
  return v2Cases
    .map(downgradeCaseV2ToV1)
    .filter((c): c is CaseEntryV1 => c !== null)
}

// ═══════════════════════════════════════════
// 4. 辅助函数
// ═══════════════════════════════════════════

function generateTagsFromExpectedResult(er: CaseExpectedResultV2): string[] {
  const tags: string[] = []
  if (er.dayMasterElement) tags.push(`日主五行:${er.dayMasterElement}`)
  if (er.primaryPattern) tags.push(`格局:${er.primaryPattern}`)
  if (er.strengthLevel) tags.push(`强弱:${er.strengthLevel}`)
  if (er.primaryXiShen) tags.push(`喜神:${er.primaryXiShen}`)
  return tags
}

function extractPillarsAndExpected(v2: CaseEntryV2): CasePillarsInput {
  return {
    yearGan: v2.yearGan,
    yearZhi: v2.yearZhi,
    monthGan: v2.monthGan,
    monthZhi: v2.monthZhi,
    dayGan: v2.dayGan,
    dayZhi: v2.dayZhi,
    hourGan: v2.hourGan,
    hourZhi: v2.hourZhi,
    gender: v2.gender,
    birthDate: v2.birthDate,
  }
}
