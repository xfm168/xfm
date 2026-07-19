/**
 * Professional Review Types
 *
 * 定义专家审核流程的类型和结构
 */

/** 审核动作 */
export type ReviewAction = 'pending_review' | 'approved' | 'revision_required' | 'contested' | 'deprecated'

/** 审核记录 */
export interface ExpertReview {
  reviewId: string
  caseId: string
  reviewerId: string
  reviewerName: string
  action: ReviewAction
  status: ReviewAction
  reviewedAt: number
  comment: string
  revisionHistory: string[]
  affectedFields: string[]
}

/** 审核工作流 */
export interface ReviewWorkflow {
  pendingReviews: ExpertReview[]
  approvedReviews: ExpertReview[]
  contestedReviews: ExpertReview[]
  deprecatedReviews: ExpertReview[]
  totalCount: number
  approvalRate: number
  avgReviewScore: number
}

/** 审核筛选条件 */
export interface ReviewFilter {
  actions?: ReviewAction[]
  reviewers?: string[]
  dateRange?: { start: number; end: number }
  statuses?: ReviewAction[]
  caseIds?: string[]
}

/** 审核统计 */
export interface ReviewStats {
  totalReviews: number
  byAction: Record<ReviewAction, number>
  byReviewer: Record<string, number>
  approvalRate: number
  contestedRate: number
  avgCommentsPerReview: number
  recentReviews: ExpertReview[]
}
