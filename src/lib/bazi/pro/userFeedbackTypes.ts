/**
 * User Feedback Types
 *
 * 职责：定义 P0 真人验证反馈系统的用户反馈类型
 */

// ═══════════════════════════════════════════
// 1. 枚举类型
// ═══════════════════════════════════════════

export type FeedbackChannel = 'web' | 'mobile' | 'wechat' | 'api'
export type ReportSection = 'overview' | 'career' | 'wealth' | 'marriage' | 'health' | 'education' | 'fortune' | 'risk' | 'suggestion' | 'all'
export type SatisfactionRating = 1 | 2 | 3 | 4 | 5

// ═══════════════════════════════════════════
// 2. 数据实体
// ═══════════════════════════════════════════

export interface UserFeedbackEntry {
  id: string
  reportId: string
  userId: string
  channel: FeedbackChannel
  rating: SatisfactionRating
  accuracyRating: SatisfactionRating
  readabilityRating: SatisfactionRating
  helpfulnessRating: SatisfactionRating
  mostAccurateSections: ReportSection[]
  leastAccurateSections: ReportSection[]
  comment: string
  improvementSuggestions: string[]
  wouldRecommend: boolean
  createdAt: number
  validatedAt: number | null
  validatedBy: string | null
}

export interface UserFeedbackStats {
  totalFeedbacks: number
  averageRating: number
  averageAccuracy: number
  averageReadability: number
  averageHelpfulness: number
  recommendRate: number
  ratingDistribution: Record<SatisfactionRating, number>
  sectionAccuracy: Record<ReportSection, number>
  topImprovementSuggestions: Array<{ suggestion: string; count: number }>
}

export interface UserFeedbackOptions {
  reportId: string
  userId: string
  channel: FeedbackChannel
  minCommentLength: number
  maxCommentLength: number
}

// ═══════════════════════════════════════════
// 3. 版本号
// ═══════════════════════════════════════════

export const USER_FEEDBACK_VERSION = '1.0.0'
