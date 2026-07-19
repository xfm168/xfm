/**
 * Expert Review Form Types
 *
 * 职责：定义 P0 真人验证反馈系统的命理师审核表单类型
 */

// ═══════════════════════════════════════════
// 1. 枚举类型
// ═══════════════════════════════════════════

export type ReviewerLevel = 'senior' | 'intermediate' | 'junior'
export type ReviewDimension = 'accuracy' | 'depth' | 'completeness' | 'classicalReference' | 'readability' | 'recommendation'
export type ReviewVerdict = 'correct' | 'partial' | 'incorrect' | 'insufficient'
export type CaseSeverity = 'critical' | 'major' | 'minor' | 'info'

// ═══════════════════════════════════════════
// 2. 数据实体
// ═══════════════════════════════════════════

export interface ExpertReviewerProfile {
  reviewerId: string
  name: string
  level: ReviewerLevel
  specialties: string[]
  totalReviews: number
  agreementRate: number
  joinedAt: number
}

export interface ExpertReviewFormEntry {
  id: string
  reviewerId: string
  caseId: string
  reportId: string
  dimensions: Record<ReviewDimension, {
    rating: number
    comment: string
    verdict: ReviewVerdict
  }>
  aiConclusion: string
  expertConclusion: string
  disagreementReason: string
  severity: CaseSeverity
  classicalReferenceUsed: string[]
  recommendation: string
  reviewedAt: number
  timeSpentMinutes: number
}

export interface ExpertReviewFormStats {
  totalReviews: number
  averageAgreementRate: number
  dimensionAverages: Record<ReviewDimension, number>
  severityDistribution: Record<CaseSeverity, number>
  topDisagreementReasons: Array<{ reason: string; count: number }>
  reviewerProductivity: Array<{ reviewerId: string; name: string; reviews: number; avgAgreement: number }>
}

// ═══════════════════════════════════════════
// 3. 版本号
// ═══════════════════════════════════════════

export const EXPERT_REVIEW_FORM_VERSION = '1.0.0'
