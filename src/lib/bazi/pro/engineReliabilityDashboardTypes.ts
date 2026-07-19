/**
 * Engine Reliability Dashboard — 可靠性仪表盘类型定义
 *
 * 职责：定义引擎可靠性仪表盘的所有数据结构
 */

/** 可靠性指标分类 */
export type ReliabilityMetricCategory =
  | 'rule_engine'
  | 'confidence'
  | 'regression'
  | 'performance'
  | 'cache'
  | 'knowledge'
  | 'expert_review'
  | 'case_quality'
  | 'health'
  | 'trust'

/** 可靠性指标 */
export interface EngineReliabilityMetric {
  category: ReliabilityMetricCategory
  label: string
  value: number | string
  status: 'ok' | 'warning' | 'critical'
  threshold: number
  trend?: 'up' | 'down' | 'stable'
  description: string
}

/** 可靠性仪表盘板块 */
export interface ReliabilityDashboardSection {
  title: string
  metrics: EngineReliabilityMetric[]
}

/** 完整的引擎可靠性仪表盘 */
export interface EngineReliabilityDashboard {
  version: string
  generatedAt: number
  overallStatus: 'excellent' | 'good' | 'fair' | 'critical'
  overallScore: number
  sections: ReliabilityDashboardSection[]
  recommendations: string[]
}
