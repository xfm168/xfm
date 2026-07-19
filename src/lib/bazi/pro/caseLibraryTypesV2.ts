/**
 * V5.0 RC Phase 3: Case Expansion — Case Library v2.0 统一类型定义
 *
 * 职责：定义统一的 CaseEntryV2 接口，支持 8 种案例类型
 * 约束：
 *   - 继承并扩展 v1 全部字段，保持向下兼容
 *   - 不修改 Module 1~8（Frozen）
 *   - 单一接口设计，不用 Union Type，便于搜索和统一处理
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement } from '@/lib/core/types/base'

// ═══════════════════════════════════════════
// 1. 基础枚举（复用 v1 兼容定义）
// ═══════════════════════════════════════════

/** v2 命例类别（8 种） */
export type CaseCategoryV2 =
  | 'classic'
  | 'anonymous'
  | 'regression'
  | 'expertVerified'
  | 'edge'
  | 'conflict'
  | 'historical'
  | 'celebrity'

/** 性别 */
export type CaseGender = 'male' | 'female'

/** 星级评分 */
export type StarRating = 1 | 2 | 3 | 4 | 5

/** 回归等级 */
export type RegressionTier = 'gold' | 'silver' | 'bronze' | 'none'

/** 审核状态 */
export type CaseReviewStatus = 'pending' | 'approved' | 'rejected' | 'deprecated'

/** 匿名级别 */
export type AnonymityLevel = 'full' | 'partial' | 'none'

/** 证据类型 */
export type EvidenceType =
  | 'classical_text'
  | 'modern_study'
  | 'expert_opinion'
  | 'statistical'
  | 'historical_record'

/** 冲突类型 */
export type ConflictType = 'classical' | 'school' | 'expert'

// ═══════════════════════════════════════════
// 2. 子结构定义
// ═══════════════════════════════════════════

/** 四柱输入（与 v1 完全兼容的最小输入集） */
export interface CasePillarsInput {
  yearGan: HeavenlyStem
  yearZhi: EarthlyBranch
  monthGan: HeavenlyStem
  monthZhi: EarthlyBranch
  dayGan: HeavenlyStem
  dayZhi: EarthlyBranch
  hourGan: HeavenlyStem
  hourZhi: EarthlyBranch
  gender: CaseGender
  birthDate?: string
}

/** 命例预期结果（v1 兼容 + 可扩展） */
export interface CaseExpectedResultV2 {
  dayMasterElement?: FiveElement
  primaryPattern?: string
  secondaryPattern?: string
  strengthLevel?: string
  primaryXiShen?: FiveElement
  primaryYongShen?: FiveElement
  primaryJiShen?: FiveElement
  primaryChouShen?: FiveElement
  primaryXianShen?: FiveElement
  careerScore?: number
  wealthScore?: number
  marriageScore?: number
  healthScore?: number
  studyScore?: number
  overallScore?: number
  // 扩展：十神摘要、神煞列表等
  tenGodSummary?: string
  shenShaList?: string[]
}

/** 专家观点（Module C） */
export interface ExpertOpinionV2 {
  opinionId: string
  expertId: string
  expertName?: string
  conclusion: string
  verdict: 'agree' | 'disagree' | 'partially_agree' | 'unclear'
  consistencyRate: number
  score: number
  validatedAt: number
  classicalBasis: string
  affectedRules: string[]
  notes?: string
}

/** 冲突记录（Module D） */
export interface ConflictRecordV2 {
  conflictId: string
  conflictType: ConflictType
  topic: string
  description: string
  viewpointA: string
  viewpointB: string
  sourceA: string
  sourceB: string
  resolution?: string
  affectedCaseIds: string[]
}

/** 版本历史条目（Module H） */
export interface CaseVersionHistoryV2 {
  version: number
  updatedAt: number
  updatedBy: string
  changeSummary: string
  diffFields: string[]
}

/** 可信度维度（Extension 1） */
export interface ReliabilityDimensionsV2 {
  dataCompleteness: number
  sourceCredibility: number
  expertCount: number
  consensusRate: number
  citationCount: number
}

/** 证据条目 */
export interface CaseEvidenceV2 {
  type: EvidenceType
  content: string
  source: string
  confidence: number
}

/** 类似案例推荐（Extension 2） */
export interface SimilarCaseRecommendation {
  caseId: string
  similarityScore: number
  commonFeatures: string[]
  differences: string[]
  historicalResult: string
  suggestion: string
  reliability: number
}

// ═══════════════════════════════════════════
// 3. 统一 CaseEntryV2（核心）
// ═══════════════════════════════════════════

export interface CaseEntryV2 {
  // --- 基础标识 ---
  caseId: string
  category: CaseCategoryV2

  // --- 四柱输入（与 v1 完全兼容）---
  yearGan: HeavenlyStem
  yearZhi: EarthlyBranch
  monthGan: HeavenlyStem
  monthZhi: EarthlyBranch
  dayGan: HeavenlyStem
  dayZhi: EarthlyBranch
  hourGan: HeavenlyStem
  hourZhi: EarthlyBranch
  gender: CaseGender
  birthDate?: string

  // --- 预期结果 ---
  expectedResult: CaseExpectedResultV2

  // --- Module B: 质量评分 ---
  qualityScore: number
  starRating: StarRating
  confidence: number
  excludeFromLearning: boolean

  // --- 验证与审核 ---
  verifiedBy: string[]
  verifiedDate?: number
  reviewStatus: CaseReviewStatus

  // --- 来源与证据 ---
  source: string
  evidence: CaseEvidenceV2[]
  referenceBooks: string[]

  // --- 标签与关键词（Module F 搜索基础）---
  tags: string[]
  keywords: string[]

  // --- Module C: 专家共识 ---
  expertOpinions: ExpertOpinionV2[]
  consensusScore?: number

  // --- Module D: 冲突记录 ---
  conflicts: ConflictRecordV2[]

  // --- Module E: 回归等级 ---
  regressionTier: RegressionTier

  // --- Module H: 版本历史 ---
  version: number
  history: CaseVersionHistoryV2[]
  changeLog: string[]

  // --- Extension 1: 可信度 ---
  reliability: number
  reliabilityDimensions: ReliabilityDimensionsV2

  // --- 类别特有可选字段 ---
  name?: string
  description?: string
  dynasty?: string
  biography?: string
  snapshotVersion?: string
  snapshotAt?: number
  anonymityLevel?: AnonymityLevel
  verificationMethod?: string
  edgeCondition?: string
  conflictTopic?: string
  celebrityField?: string
  historicalPeriod?: string

  // --- 元数据 ---
  createdAt: number
  updatedAt: number
}

// ═══════════════════════════════════════════
// 4. v1 兼容类型（用于迁移和降级）
// ═══════════════════════════════════════════

/** v1 命例类别（迁移用） */
export type CaseCategoryV1 = 'classic' | 'anonymous' | 'regression'

/** v1 经典命例（迁移用） */
export interface ClassicCaseV1 extends CasePillarsInput {
  caseId: string
  name: string
  description: string
  source: string
  dynasty?: string
  expectedResult: CaseExpectedResultV2
  notes?: string
}

/** v1 匿名命例（迁移用） */
export interface AnonymousCaseV1 extends CasePillarsInput {
  caseId: string
  expectedResult: CaseExpectedResultV2
  confidence: number
  source: string
}

/** v1 回归样本（迁移用） */
export interface RegressionCaseV1 extends CasePillarsInput {
  caseId: string
  expectedResult: CaseExpectedResultV2
  snapshotVersion: string
  snapshotAt: number
}

/** v1 命例联合类型 */
export type CaseEntryV1 = ClassicCaseV1 | AnonymousCaseV1 | RegressionCaseV1

// ═══════════════════════════════════════════
// 5. 工具函数
// ═══════════════════════════════════════════

/** 生成 v2 命例 ID */
export function generateCaseIdV2(category: CaseCategoryV2): string {
  const prefix: Record<CaseCategoryV2, string> = {
    classic: 'CLS',
    anonymous: 'ANM',
    regression: 'REG',
    expertVerified: 'EXP',
    edge: 'EDG',
    conflict: 'CNF',
    historical: 'HIS',
    celebrity: 'CEB',
  }
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix[category]}-${rand}`
}

/** 判断是否为经典命例 */
export function isClassicCaseV2(entry: CaseEntryV2): boolean {
  return entry.category === 'classic'
}

/** 判断是否为匿名命例 */
export function isAnonymousCaseV2(entry: CaseEntryV2): boolean {
  return entry.category === 'anonymous'
}

/** 判断是否为回归样本 */
export function isRegressionCaseV2(entry: CaseEntryV2): boolean {
  return entry.category === 'regression'
}

/** 判断是否为专家验证命例 */
export function isExpertVerifiedCaseV2(entry: CaseEntryV2): boolean {
  return entry.category === 'expertVerified'
}

/** 获取命例类别显示名 */
export function getCaseCategoryDisplayV2(category: CaseCategoryV2): string {
  const map: Record<CaseCategoryV2, string> = {
    classic: '经典命例',
    anonymous: '匿名命例',
    regression: '回归样本',
    expertVerified: '专家验证',
    edge: '边缘案例',
    conflict: '冲突案例',
    historical: '历史命例',
    celebrity: '名人命例',
  }
  return map[category]
}

/** 星级映射：qualityScore -> StarRating */
export function scoreToStarRating(score: number): StarRating {
  if (score >= 90) return 5
  if (score >= 75) return 4
  if (score >= 60) return 3
  if (score >= 40) return 2
  return 1
}

/** StarRating -> 显示字符串 */
export function starRatingToString(rating: StarRating): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

/** 默认空的 CaseEntryV2 工厂（用于增量构建） */
export function createEmptyCaseEntryV2(
  caseId: string,
  category: CaseCategoryV2,
  pillars: CasePillarsInput,
): CaseEntryV2 {
  const now = Date.now()
  return {
    caseId,
    category,
    ...pillars,
    expectedResult: {},
    qualityScore: 0,
    starRating: 1,
    confidence: 0,
    excludeFromLearning: true,
    verifiedBy: [],
    reviewStatus: 'pending',
    source: '',
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
    createdAt: now,
    updatedAt: now,
  }
}

/** 计算可信度综合评分 */
export function calculateReliabilityScore(dimensions: ReliabilityDimensionsV2): number {
  const {
    dataCompleteness,
    sourceCredibility,
    expertCount,
    consensusRate,
    citationCount,
  } = dimensions

  // 加权计算：数据完整度 25% + 来源可信度 25% + 专家数量 15% + 一致率 25% + 引用次数 10%
  const expertScore = Math.min(expertCount * 20, 100)
  const citationScore = Math.min(citationCount * 10, 100)

  return Math.round(
    dataCompleteness * 0.25 +
    sourceCredibility * 0.25 +
    expertScore * 0.15 +
    consensusRate * 0.25 +
    citationScore * 0.10,
  )
}

/** 验证 CaseEntryV2 基础完整性 */
export function validateCaseEntryV2(entry: CaseEntryV2): {
  valid: boolean
  missingFields: string[]
  completenessRate: number
} {
  const requiredFields: (keyof CaseEntryV2)[] = [
    'caseId', 'category', 'yearGan', 'yearZhi', 'monthGan', 'monthZhi',
    'dayGan', 'dayZhi', 'hourGan', 'hourZhi', 'gender', 'expectedResult',
  ]
  const missingFields: string[] = []

  for (const field of requiredFields) {
    const value = entry[field]
    if (value === undefined || value === null || value === '') {
      missingFields.push(field)
    }
  }

  // 检查 expectedResult 是否有有效字段
  const er = entry.expectedResult
  const hasAnyExpected = Object.values(er).some((v) => v !== undefined && v !== null && v !== '')
  if (!hasAnyExpected) {
    missingFields.push('expectedResult (empty)')
  }

  const totalChecks = requiredFields.length + 1
  const completenessRate = Math.round(((totalChecks - missingFields.length) / totalChecks) * 100)

  return {
    valid: missingFields.length === 0,
    missingFields,
    completenessRate,
  }
}
