// Phase 6 Batch 2 Module 3: Report Optimization — Types
// 报告优化建议系统：建议管理、优化计划、体验评分

export type OptimizationCategory = 'readability' | 'terminology' | 'action_suggestion' | 'timeline' | 'sharing' | 'mobile'
export type OptimizationPriority = 'critical' | 'high' | 'medium' | 'low'

export interface OptimizationSuggestion {
  id: string
  category: OptimizationCategory
  priority: OptimizationPriority
  title: string
  description: string
  source: string               // 'user_feedback' | 'expert_review' | 'analytics' | 'design_review'
  relatedFeedbackIds: string[]
  status: 'pending' | 'implemented' | 'deferred' | 'rejected'
  createdAt: number
  implementedAt: number | null
}

export interface ReportOptimizationPlan {
  id: string
  reportType: string
  version: string
  suggestions: OptimizationSuggestion[]
  overallScore: number           // 0~100 当前报告体验评分
  targetScore: number
  createdAt: number
}

export interface OptimizationStats {
  totalSuggestions: number
  byCategory: Record<OptimizationCategory, number>
  byPriority: Record<OptimizationPriority, number>
  byStatus: Record<string, number>
  bySource: Record<string, number>
  implementedRate: number
}

export const REPORT_OPTIMIZATION_VERSION = '1.0.0'

export const OPTIMIZATION_CATEGORIES: OptimizationCategory[] = [
  'readability', 'terminology', 'action_suggestion', 'timeline', 'sharing', 'mobile'
]

export const DEFAULT_OPTIMIZATION_SUGGESTIONS: Array<{
  category: OptimizationCategory
  priority: OptimizationPriority
  title: string
  description: string
}> = [
  { category: 'readability', priority: 'critical', title: '首页3秒核心结论', description: '用户应在3秒内理解能获得什么' },
  { category: 'readability', priority: 'high', title: '减少专业术语堆积', description: '每个专业术语首次出现时附带简短解释' },
  { category: 'action_suggestion', priority: 'critical', title: '风险与建议一一对应', description: '每个风险提示后必须有具体建议' },
  { category: 'timeline', priority: 'high', title: '人生阶段时间轴', description: '以四线趋势图展示事业/财富/感情/健康' },
  { category: 'sharing', priority: 'medium', title: '分享卡片', description: '生成可分享的命理摘要卡片' },
  { category: 'mobile', priority: 'high', title: '移动端阅读优化', description: '报告适配移动端排版和触控交互' },
]