/**
 * AI Expert Diff Types
 *
 * 职责：定义 P0 真人验证反馈系统的 AI vs 专家差异记录类型
 */

import type { CaseSeverity } from './expertReviewFormTypes'

export type { CaseSeverity }

// ═══════════════════════════════════════════
// 1. 枚举类型
// ═══════════════════════════════════════════

export type DiffCategory = 'conclusion' | 'detail' | 'reference' | 'recommendation' | 'confidence'
export type DiffResolution = 'resolved' | 'pending' | 'wont_fix' | 'deferred'

// ═══════════════════════════════════════════
// 2. 数据实体
// ═══════════════════════════════════════════

export interface AiExpertDiffEntry {
  id: string
  reviewId: string
  caseId: string
  reportId: string
  field: string
  category: DiffCategory
  aiValue: string
  expertValue: string
  diffDescription: string
  severity: CaseSeverity
  resolution: DiffResolution
  resolvedAt: number | null
  resolvedBy: string | null
  resolutionNote: string | null
  createdAt: number
}

export interface AiExpertDiffStats {
  totalDiffs: number
  unresolvedDiffs: number
  resolutionRate: number
  categoryDistribution: Record<DiffCategory, number>
  severityDistribution: Record<CaseSeverity, number>
  topDiffFields: Array<{ field: string; count: number }>
  avgResolutionTimeHours: number
}

// ═══════════════════════════════════════════
// 3. 版本号
// ═══════════════════════════════════════════

export const AI_EXPERT_DIFF_VERSION = '1.0.0'
