/**
 * Case Dashboard Types
 *
 * 职责：定义案例库仪表盘的所有类型
 */

// ═══════════════════════════════════════════
// 1. 仪表盘指标
// ═══════════════════════════════════════════

/** 指标状态 */
export type DashboardMetricStatus = 'ok' | 'warning' | 'critical'

/** 指标趋势 */
export type DashboardMetricTrend = 'up' | 'down' | 'stable'

/** 单个仪表盘指标 */
export interface CaseDashboardMetric {
  label: string
  value: string | number
  status: DashboardMetricStatus
  trend?: DashboardMetricTrend
  change?: number
}

// ═══════════════════════════════════════════
// 2. 仪表盘板块与整体
// ═══════════════════════════════════════════

/** 仪表盘板块 */
export interface CaseDashboardSection {
  title: string
  metrics: CaseDashboardMetric[]
}

/** 仪表盘整体状态 */
export type DashboardOverallStatus = 'healthy' | 'warning' | 'critical'

/** 完整仪表盘 */
export interface CaseDashboard {
  version: string
  generatedAt: number
  overallStatus: DashboardOverallStatus
  sections: CaseDashboardSection[]
  totalCases: number
  recentAdditions: number
}

/** 精简版仪表盘快照 */
export interface CaseDashboardSnapshot {
  version: string
  generatedAt: number
  overallStatus: DashboardOverallStatus
  totalCases: number
  avgQualityScore: number
  avgReliability: number
  goldRatio: number
  pendingReviewCount: number
  lowQualityCount: number
}
