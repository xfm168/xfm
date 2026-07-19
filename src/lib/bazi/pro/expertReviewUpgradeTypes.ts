/**
 * Expert Review Upgrade Types
 *
 * 职责：定义专家审核体系升级的类型
 */

export type ExpertTier = 'bronze' | 'silver' | 'gold' | 'master'
export type ExpertSpecialty = 'pattern' | 'xiYong' | 'fortune' | 'tenGod' | 'shenSha' | 'marriage' | 'career' | 'health'

export interface ExpertAccount {
  id: string
  name: string
  tier: ExpertTier
  specialties: ExpertSpecialty[]
  totalReviews: number
  agreementRate: number          // 与 AI 一致率
  avgReviewTime: number          // 平均审核用时（分钟）
  qualityScore: number           // 0~100
  joinedAt: number
  lastActiveAt: number
  bio: string
  badges: string[]
}

export interface ExpertLeaderboard {
  dimension: string              // 'agreement_rate' | 'total_reviews' | 'quality_score' | 'avg_time'
  rankings: Array<{
    expertId: string
    expertName: string
    tier: ExpertTier
    value: number
  }>
}

export interface AiExpertDiffRanking {
  field: string
  aiValue: string
  expertValue: string
  severity: string
  caseId: string
  expertId: string
  resolvedAt: number | null
}

export interface ExpertSystemStats {
  totalExperts: number
  byTier: Record<ExpertTier, number>
  totalReviews: number
  overallAgreementRate: number
  topDisagreementFields: Array<{field: string; count: number}>
  averageReviewTime: number
  expertProductivity: Array<{expertId: string; name: string; reviews: number; avgTime: number}>
}

export const EXPERT_REVIEW_UPGRADE_VERSION = '1.0.0'

export const EXPERT_TIER_REQUIREMENTS: Record<ExpertTier, { minReviews: number; minAgreement: number; minQuality: number; title: string }> = {
  bronze: { minReviews: 0, minAgreement: 0, minQuality: 0, title: '见习审核员' },
  silver: { minReviews: 20, minAgreement: 0.7, minQuality: 60, title: '正式审核员' },
  gold: { minReviews: 100, minAgreement: 0.8, minQuality: 75, title: '高级审核员' },
  master: { minReviews: 500, minAgreement: 0.85, minQuality: 90, title: '宗师级审核员' },
}

export const EXPERT_TIERS: ExpertTier[] = ['bronze', 'silver', 'gold', 'master']