/**
 * Expert Review Form Engine
 *
 * 职责：
 *   - 命理师审核员档案管理
 *   - 审核表单的 CRUD 操作
 *   - 审核统计汇总
 *   - 审核员一致率计算
 * 约束：
 *   - 不修改已有文件
 *   - 纯数据管理层
 */

import type {
  ExpertReviewerProfile,
  ExpertReviewFormEntry,
  ExpertReviewFormStats,
  ReviewerLevel,
  ReviewDimension,
  ReviewVerdict,
  CaseSeverity,
} from './expertReviewFormTypes'

import { EXPERT_REVIEW_FORM_VERSION } from './expertReviewFormTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const EXPERT_REVIEW_FORM_ENGINE_VERSION = EXPERT_REVIEW_FORM_VERSION

// ═══════════════════════════════════════════
// 2. 内部存储
// ═══════════════════════════════════════════

const reviewStore = new Map<string, ExpertReviewFormEntry>()
const reviewerStore = new Map<string, ExpertReviewerProfile>()

// ═══════════════════════════════════════════
// 3. 常量
// ═══════════════════════════════════════════

const ALL_DIMENSIONS: ReviewDimension[] = [
  'accuracy', 'depth', 'completeness', 'classicalReference', 'readability', 'recommendation',
]

const ALL_SEVERITIES: CaseSeverity[] = ['critical', 'major', 'minor', 'info']

// ═══════════════════════════════════════════
// 4. 核心函数
// ═══════════════════════════════════════════

/** 注册审核员 */
export function registerReviewer(
  profile: Omit<ExpertReviewerProfile, 'totalReviews' | 'agreementRate' | 'joinedAt'>,
): ExpertReviewerProfile {
  const fullProfile: ExpertReviewerProfile = {
    ...profile,
    totalReviews: 0,
    agreementRate: 0,
    joinedAt: Date.now(),
  }
  reviewerStore.set(fullProfile.reviewerId, fullProfile)
  return fullProfile
}

/** 提交审核表单 */
export function submitExpertReview(
  data: Omit<ExpertReviewFormEntry, 'id' | 'reviewedAt'>,
): ExpertReviewFormEntry {
  const entry: ExpertReviewFormEntry = {
    ...data,
    id: `ER-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    reviewedAt: Date.now(),
  }
  reviewStore.set(entry.id, entry)

  // 更新审核员统计
  const reviewer = reviewerStore.get(entry.reviewerId)
  if (reviewer) {
    reviewer.totalReviews++
    // 重新计算一致率
    reviewer.agreementRate = calculateReviewerAgreement(entry.reviewerId)
    reviewerStore.set(reviewer.reviewerId, reviewer)
  }

  return entry
}

/** 按 ID 获取审核 */
export function getReviewById(id: string): ExpertReviewFormEntry | undefined {
  return reviewStore.get(id)
}

/** 按案例ID获取审核 */
export function getReviewsByCaseId(caseId: string): ExpertReviewFormEntry[] {
  return Array.from(reviewStore.values()).filter((r) => r.caseId === caseId)
}

/** 按审核员ID获取审核 */
export function getReviewsByReviewerId(reviewerId: string): ExpertReviewFormEntry[] {
  return Array.from(reviewStore.values()).filter((r) => r.reviewerId === reviewerId)
}

/** 按严重程度获取审核 */
export function getReviewsBySeverity(severity: CaseSeverity): ExpertReviewFormEntry[] {
  return Array.from(reviewStore.values()).filter((r) => r.severity === severity)
}

/** 获取所有不一致的审核（任一维度 verdict !== 'correct'） */
export function getDisagreementReviews(): ExpertReviewFormEntry[] {
  return Array.from(reviewStore.values()).filter((r) => {
    return Object.values(r.dimensions).some((d) => d.verdict !== 'correct')
  })
}

/** 获取审核统计汇总 */
export function getReviewStats(): ExpertReviewFormStats {
  const all = Array.from(reviewStore.values())
  const total = all.length

  if (total === 0) {
    const emptyDimAvgs = {} as Record<ReviewDimension, number>
    const emptySevDist = {} as Record<CaseSeverity, number>
    for (const d of ALL_DIMENSIONS) emptyDimAvgs[d] = 0
    for (const s of ALL_SEVERITIES) emptySevDist[s] = 0
    return {
      totalReviews: 0,
      averageAgreementRate: 0,
      dimensionAverages: emptyDimAvgs,
      severityDistribution: emptySevDist,
      topDisagreementReasons: [],
      reviewerProductivity: [],
    }
  }

  // 维度平均分
  const dimAverages = {} as Record<ReviewDimension, number>
  for (const dim of ALL_DIMENSIONS) {
    const sum = all.reduce((acc, r) => acc + r.dimensions[dim].rating, 0)
    dimAverages[dim] = Math.round((sum / total) * 100) / 100
  }

  // 严重程度分布
  const sevDist = {} as Record<CaseSeverity, number>
  for (const s of ALL_SEVERITIES) sevDist[s] = 0
  for (const r of all) sevDist[r.severity]++

  // 分歧原因 TOP
  const reasonMap = new Map<string, number>()
  for (const r of all) {
    if (r.disagreementReason) {
      reasonMap.set(r.disagreementReason, (reasonMap.get(r.disagreementReason) ?? 0) + 1)
    }
  }
  const topReasons = Array.from(reasonMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // 审核员效率
  const reviewerMap = new Map<string, { name: string; reviews: number; totalAgreement: number }>()
  for (const r of all) {
    const existing = reviewerMap.get(r.reviewerId)
    const reviewAgreement = Object.values(r.dimensions).filter((d) => d.verdict === 'correct').length
    const dimCount = Object.values(r.dimensions).length
    const agreementRatio = dimCount > 0 ? reviewAgreement / dimCount : 0
    if (existing) {
      existing.reviews++
      existing.totalAgreement += agreementRatio
    } else {
      const rev = reviewerStore.get(r.reviewerId)
      reviewerMap.set(r.reviewerId, {
        name: rev?.name ?? 'unknown',
        reviews: 1,
        totalAgreement: agreementRatio,
      })
    }
  }
  const reviewerProductivity = Array.from(reviewerMap.entries())
    .map(([reviewerId, info]) => ({
      reviewerId,
      name: info.name,
      reviews: info.reviews,
      avgAgreement: Math.round((info.totalAgreement / info.reviews) * 100) / 100,
    }))
    .sort((a, b) => b.reviews - a.reviews)

  // 平均一致率
  const allReviewers = getAllReviewers()
  const avgAgreement = allReviewers.length > 0
    ? Math.round(
        allReviewers.reduce((acc, rev) => acc + calculateReviewerAgreement(rev.reviewerId), 0) /
        allReviewers.length * 100,
      ) / 100
    : 0

  return {
    totalReviews: total,
    averageAgreementRate: avgAgreement,
    dimensionAverages: dimAverages,
    severityDistribution: sevDist,
    topDisagreementReasons: topReasons,
    reviewerProductivity,
  }
}

/** 获取审核员档案 */
export function getReviewerProfile(reviewerId: string): ExpertReviewerProfile | undefined {
  return reviewerStore.get(reviewerId)
}

/** 获取所有审核员 */
export function getAllReviewers(): ExpertReviewerProfile[] {
  return Array.from(reviewerStore.values())
}

/** 计算单个审核员与 AI 一致率 */
export function calculateReviewerAgreement(reviewerId: string): number {
  const reviews = getReviewsByReviewerId(reviewerId)
  if (reviews.length === 0) return 0

  let totalDims = 0
  let correctDims = 0
  for (const r of reviews) {
    for (const d of Object.values(r.dimensions)) {
      totalDims++
      if (d.verdict === 'correct') correctDims++
    }
  }
  return totalDims > 0 ? Math.round((correctDims / totalDims) * 100) / 100 : 0
}

/** 重置存储 */
export function resetReviewFormStore(): void {
  reviewStore.clear()
  reviewerStore.clear()
  initSeedData()
}

// ═══════════════════════════════════════════
// 5. 种子数据
// ═══════════════════════════════════════════

function makeDimensions(
  verdict: ReviewVerdict,
  rating?: number,
): Record<ReviewDimension, { rating: number; comment: string; verdict: ReviewVerdict }> {
  const r = rating ?? (verdict === 'correct' ? 8 : verdict === 'partial' ? 5 : 3)
  const comment = verdict === 'correct' ? '准确' : verdict === 'partial' ? '部分准确' : '不准确'
  return {
    accuracy: { rating: r, comment, verdict },
    depth: { rating: r, comment, verdict },
    completeness: { rating: r, comment, verdict },
    classicalReference: { rating: r, comment, verdict },
    readability: { rating: Math.min(10, r + 1), comment, verdict },
    recommendation: { rating: r, comment, verdict },
  }
}

function initSeedData(): void {
  // 注册 3 个审核员
  registerReviewer({
    reviewerId: 'REV-001',
    name: '张大师',
    level: 'senior',
    specialties: ['格局', '喜用神', '大运'],
  })
  registerReviewer({
    reviewerId: 'REV-002',
    name: '李师傅',
    level: 'intermediate',
    specialties: ['十神', '格局'],
  })
  registerReviewer({
    reviewerId: 'REV-003',
    name: '王学徒',
    level: 'junior',
    specialties: ['五行'],
  })

  // 5 条审核记录
  const now = Date.now()

  const review1: ExpertReviewFormEntry = {
    id: 'ER-1000001-0001',
    reviewerId: 'REV-001',
    caseId: 'CASE-001',
    reportId: 'RPT-001',
    dimensions: makeDimensions('correct', 9),
    aiConclusion: '命主财星旺相，财运亨通',
    expertConclusion: '命主财星旺相，财运亨通',
    disagreementReason: '',
    severity: 'info',
    classicalReferenceUsed: ['渊海子平'],
    recommendation: '保持当前分析',
    reviewedAt: now - 86400000 * 5,
    timeSpentMinutes: 30,
  }

  const review2: ExpertReviewFormEntry = {
    id: 'ER-1000002-0002',
    reviewerId: 'REV-001',
    caseId: 'CASE-002',
    reportId: 'RPT-002',
    dimensions: makeDimensions('partial', 6),
    aiConclusion: '婚姻宫逢冲，婚姻不顺',
    expertConclusion: '婚姻宫逢冲，但需综合大运走势',
    disagreementReason: 'AI 未考虑大运对婚姻宫的影响',
    severity: 'major',
    classicalReferenceUsed: ['三命通会', '滴天髓'],
    recommendation: '增加大运维度分析婚姻',
    reviewedAt: now - 86400000 * 4,
    timeSpentMinutes: 45,
  }

  const review3: ExpertReviewFormEntry = {
    id: 'ER-1000003-0003',
    reviewerId: 'REV-002',
    caseId: 'CASE-003',
    reportId: 'RPT-003',
    dimensions: makeDimensions('incorrect', 2),
    aiConclusion: '喜用神为水',
    expertConclusion: '喜用神为木',
    disagreementReason: '五行平衡分析错误，木为实际喜用',
    severity: 'critical',
    classicalReferenceUsed: ['穷通宝鉴', '滴天髓'],
    recommendation: '修正喜用神判断逻辑',
    reviewedAt: now - 86400000 * 3,
    timeSpentMinutes: 60,
  }

  const review4: ExpertReviewFormEntry = {
    id: 'ER-1000004-0004',
    reviewerId: 'REV-002',
    caseId: 'CASE-004',
    reportId: 'RPT-004',
    dimensions: makeDimensions('correct', 7),
    aiConclusion: '命主官星得位，事业有成',
    expertConclusion: '命主官星得位，事业有成',
    disagreementReason: '',
    severity: 'info',
    classicalReferenceUsed: ['渊海子平'],
    recommendation: '维持当前逻辑',
    reviewedAt: now - 86400000 * 2,
    timeSpentMinutes: 25,
  }

  const review5: ExpertReviewFormEntry = {
    id: 'ER-1000005-0005',
    reviewerId: 'REV-003',
    caseId: 'CASE-005',
    reportId: 'RPT-005',
    dimensions: makeDimensions('insufficient', 4),
    aiConclusion: '五行缺土，需补土',
    expertConclusion: '五行不缺，土气虽弱但不应补',
    disagreementReason: 'AI 过于简单化五行判断',
    severity: 'major',
    classicalReferenceUsed: ['穷通宝鉴'],
    recommendation: '细化五行强弱判断标准',
    reviewedAt: now - 86400000 * 1,
    timeSpentMinutes: 35,
  }

  reviewStore.set(review1.id, review1)
  reviewStore.set(review2.id, review2)
  reviewStore.set(review3.id, review3)
  reviewStore.set(review4.id, review4)
  reviewStore.set(review5.id, review5)

  // 更新审核员统计（注册时为0，需要根据审核记录更新）
  for (const reviewer of getAllReviewers()) {
    const reviews = getReviewsByReviewerId(reviewer.reviewerId)
    reviewer.totalReviews = reviews.length
    reviewer.agreementRate = calculateReviewerAgreement(reviewer.reviewerId)
    reviewerStore.set(reviewer.reviewerId, reviewer)
  }
}

// 初始化种子数据
initSeedData()
