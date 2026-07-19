// Phase 6 Batch 3: P3 Data Asset Tracker — Types
// 数据资产追踪：案例库增长、知识库增长、专家验证指标、阶段达标统计

export type AssetType = 'case_library' | 'knowledge_base' | 'expert_validation' | 'user_feedback' | 'report_generation'
export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed'
export type GrowthTrend = 'accelerating' | 'steady' | 'decelerating' | 'stagnant'

export interface AssetMilestone {
  id: string
  assetType: AssetType
  title: string
  currentValue: number
  targetValue: number
  unit: string
  status: MilestoneStatus
  deadline: number | null       // timestamp
  createdAt: number
  completedAt: number | null
}

export interface AssetGrowthRecord {
  id: string
  assetType: AssetType
  date: string                  // YYYY-MM-DD
  startValue: number
  endValue: number
  growth: number                // delta
  growthRate: number            // percentage
  source: string                // 'user_submission' | 'expert_review' | 'ai_generation' | 'migration' | 'manual'
}

export interface DataAssetSnapshot {
  timestamp: number
  caseLibrary: {
    total: number
    classic: number
    anonymous: number
    regression: number
    expertVerified: number
    edge: number
    conflict: number
    target: number              // 1000
  }
  knowledgeBase: {
    total: number
    categories: number
    sources: number
    avgConfidence: number
    target: number              // 500
  }
  expertValidation: {
    totalReviews: number
    agreementRate: number       // 0~100
    uniqueExperts: number
    highConfidenceCases: number
    disputeCases: number
    targetReviews: number       // 50
  }
  userFeedback: {
    totalFeedbacks: number
    avgSatisfaction: number    // 0~5
    effectiveFeedbacks: number   // 有效反馈数
    targetFeedbacks: number     // 100
    targetSatisfaction: number  // 4.0 (>=80%)
  }
  reportGeneration: {
    totalReports: number
    targetReports: number       // 1000
    uniqueUsers: number
    targetUsers: number        // 300
  }
  milestones: AssetMilestone[]
  phaseCompleted: boolean
  completionPercentage: number // 0~100
}

export interface PhaseCompletionCriteria {
  criteriaId: string
  title: string
  currentValue: number
  targetValue: number
  met: boolean
  unit: string
}

export const DATA_ASSET_TRACKER_VERSION = '1.0.0'