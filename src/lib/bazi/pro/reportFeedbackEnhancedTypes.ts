/**
 * Report Feedback Enhanced Types
 *
 * 职责：定义报告反馈增强系统的类型
 */

export type FeedbackDimension = 'overall_accuracy' | 'personality' | 'career' | 'wealth' | 'marriage' | 'health'

export interface DimensionFeedback {
  dimension: FeedbackDimension
  rating: number              // 1~5
  comment: string
  recognized: boolean         // 用户是否认可
}

export interface ParagraphFeedback {
  sectionId: string
  paragraphIndex: number
  content: string             // 段落摘要
  approved: boolean          // 认可
  disputed: boolean          // 不认可
  userComment: string
  userExperience: string     // 用户真实经历补充
}

export interface EnhancedReportFeedback {
  id: string
  reportId: string
  userId: string
  dimensionFeedbacks: DimensionFeedback[]
  paragraphFeedbacks: ParagraphFeedback[]
  overallComment: string
  wouldShare: boolean
  createdAt: number
  autoEnqueued: boolean      // 是否已自动进入 Case Library
}

export interface ReportFeedbackAnalytics {
  totalFeedbacks: number
  averageOverallAccuracy: number
  dimensionAverages: Record<FeedbackDimension, number>
  approvalRateBySection: Array<{sectionId: string; rate: number; count: number}>
  topDisputedSections: Array<{sectionId: string; disputeCount: number; comments: string[]}>
  experienceHighlights: string[]
  totalAutoEnqueued: number
}

export const REPORT_FEEDBACK_ENHANCED_VERSION = '1.0.0'

export const FEEDBACK_DIMENSIONS: FeedbackDimension[] = [
  'overall_accuracy', 'personality', 'career', 'wealth', 'marriage', 'health'
]

export const DIMENSION_LABELS: Record<FeedbackDimension, string> = {
  overall_accuracy: '总体准确度',
  personality: '性格符合度',
  career: '事业分析符合度',
  wealth: '财富分析符合度',
  marriage: '婚姻分析符合度',
  health: '健康建议参考度',
}