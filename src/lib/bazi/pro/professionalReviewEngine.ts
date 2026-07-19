/**
 * Professional Review Engine
 *
 * 职责：
 *   - 管理命例的专家审核流程
 *   - 提交审核、批准、驳回、生成统计
 * 约束：
 *   - 使用 Map 内部存储，按 caseId 索引
 *   - 不修改已有命例数据（仅更新 verifiedBy/reviewStatus 等审核元数据）
 */

import type { ExpertReview, ReviewAction, ReviewWorkflow, ReviewStats, ReviewFilter } from './professionalReviewTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const PROFESSIONAL_REVIEW_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 内部存储
// ═══════════════════════════════════════════

/** 按 caseId 索引的审核记录存储 */
const reviewStore = new Map<string, ExpertReview[]>()

/** 当前已提交的全部审核（平铺） */
function getAllReviewsFlat(): ExpertReview[] {
  const all: ExpertReview[] = []
  for (const reviews of reviewStore.values()) {
    all.push(...reviews)
  }
  return all
}

// ═══════════════════════════════════════════
// 3. 核心函数
// ═══════════════════════════════════════════

/**
 * 生成审核 ID
 */
function generateReviewId(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `REV-${ts}-${rand}`
}

/**
 * 提交审核
 */
export function submitReview(
  caseId: string,
  reviewerId: string,
  action: ReviewAction,
  comment: string,
  affectedFields: string[] = [],
): ExpertReview {
  const review: ExpertReview = {
    reviewId: generateReviewId(),
    caseId,
    reviewerId,
    reviewerName: reviewerId, // 默认使用 reviewerId 作为名称
    action,
    status: action,
    reviewedAt: Date.now(),
    comment,
    revisionHistory: [],
    affectedFields,
  }

  const existing = reviewStore.get(caseId) ?? []
  existing.push(review)
  reviewStore.set(caseId, existing)

  return review
}

/**
 * 获取单个命例的审核工作流
 */
export function getReviewWorkflow(caseId: string): ReviewWorkflow {
  const reviews = reviewStore.get(caseId) ?? []

  const pendingReviews = reviews.filter((r) => r.status === 'pending_review')
  const approvedReviews = reviews.filter((r) => r.status === 'approved')
  const contestedReviews = reviews.filter((r) => r.status === 'contested')
  const deprecatedReviews = reviews.filter((r) => r.status === 'deprecated')

  const totalCount = reviews.length
  const approvalRate = totalCount > 0 ? approvedReviews.length / totalCount : 0
  const avgReviewScore = totalCount > 0 ? Math.round(approvalRate * 100) : 0

  return {
    pendingReviews,
    approvedReviews,
    contestedReviews,
    deprecatedReviews,
    totalCount,
    approvalRate: Math.round(approvalRate * 10000) / 100,
    avgReviewScore,
  }
}

/**
 * 全局审核统计
 */
export function getReviewStats(): ReviewStats {
  const allReviews = getAllReviewsFlat()
  const totalReviews = allReviews.length

  const byAction: Record<ReviewAction, number> = {
    pending_review: 0,
    approved: 0,
    revision_required: 0,
    contested: 0,
    deprecated: 0,
  }

  const byReviewer: Record<string, number> = {}

  for (const r of allReviews) {
    byAction[r.action]++
    byReviewer[r.reviewerId] = (byReviewer[r.reviewerId] ?? 0) + 1
  }

  const approvalRate = totalReviews > 0 ? byAction.approved / totalReviews : 0
  const contestedRate = totalReviews > 0 ? byAction.contested / totalReviews : 0
  const totalCommentLength = allReviews.reduce((s, r) => s + r.comment.length, 0)
  const avgCommentsPerReview = totalReviews > 0 ? Math.round((totalCommentLength / totalReviews) * 10) / 10 : 0

  // 最近 10 条审核
  const sorted = [...allReviews].sort((a, b) => b.reviewedAt - a.reviewedAt)
  const recentReviews = sorted.slice(0, 10)

  return {
    totalReviews,
    byAction,
    byReviewer,
    approvalRate: Math.round(approvalRate * 10000) / 100,
    contestedRate: Math.round(contestedRate * 10000) / 100,
    avgCommentsPerReview,
    recentReviews,
  }
}

/**
 * 获取待审核列表
 */
export function getPendingReviews(): ExpertReview[] {
  return getAllReviewsFlat().filter((r) => r.status === 'pending_review')
}

/**
 * 批准审核（将 pending_review 变为 approved）
 */
export function approveReview(reviewId: string): boolean {
  for (const reviews of reviewStore.values()) {
    const target = reviews.find((r) => r.reviewId === reviewId)
    if (target && target.status === 'pending_review') {
      target.status = 'approved'
      target.action = 'approved'
      return true
    }
  }
  return false
}

/**
 * 驳回审核（将 pending_review 变为 revision_required，添加原因）
 */
export function rejectReview(reviewId: string, reason: string): boolean {
  for (const reviews of reviewStore.values()) {
    const target = reviews.find((r) => r.reviewId === reviewId)
    if (target && target.status === 'pending_review') {
      target.status = 'revision_required'
      target.action = 'revision_required'
      target.revisionHistory.push(reason)
      target.comment = reason
      return true
    }
  }
  return false
}

/**
 * 获取单个命例的审核历史
 */
export function getReviewHistory(caseId: string): ExpertReview[] {
  const reviews = reviewStore.get(caseId) ?? []
  return [...reviews].sort((a, b) => b.reviewedAt - a.reviewedAt)
}

/**
 * 批量提交审核
 */
export function submitBatchReview(
  reviews: Array<{
    caseId: string
    reviewerId: string
    action: ReviewAction
    comment: string
    affectedFields?: string[]
  }>,
): ExpertReview[] {
  return reviews.map((r) =>
    submitReview(r.caseId, r.reviewerId, r.action, r.comment, r.affectedFields ?? []),
  )
}

/**
 * 生成审核摘要
 */
export function generateReviewSummary(): string {
  const stats = getReviewStats()
  const pending = getPendingReviews()

  const lines: string[] = [
    `=== 专业审核摘要 (v${PROFESSIONAL_REVIEW_VERSION}) ===`,
    `总审核数: ${stats.totalReviews}`,
    `批准率: ${stats.approvalRate}%`,
    `争议率: ${stats.contestedRate}%`,
    `待审核: ${pending.length}`,
    `--- 按动作统计 ---`,
  ]

  for (const [action, count] of Object.entries(stats.byAction)) {
    lines.push(`  ${action}: ${count}`)
  }

  return lines.join('\n')
}

/**
 * 清空内部存储（仅供测试使用）
 */
export function _clearReviewStore(): void {
  reviewStore.clear()
}
