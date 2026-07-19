/**
 * V5.0 RC: Project Dashboard Engine — 项目驾驶舱类型定义
 *
 * 实时展示所有项目指标：版本、质量、规则、知识、案例、回归、性能、测试、覆盖率、发布状态
 */

/** 仪表盘指标 */
export interface DashboardMetric {
  id: string
  label: string
  value: number | string
  unit?: string
  status: 'ok' | 'warning' | 'critical' | 'info'
  trend?: 'up' | 'down' | 'stable'
  description?: string
}

/** 仪表盘板块 */
export interface DashboardSection {
  title: string
  metrics: DashboardMetric[]
}

/** 完整仪表盘数据 */
export interface ProjectDashboard {
  version: string
  generatedAt: number
  sections: DashboardSection[]
  overallStatus: 'healthy' | 'degraded' | 'critical'
  overallScore: number
}

/** 仪表盘选项 */
export interface DashboardOptions {
  includePerformance?: boolean
  includeHistorical?: boolean
}

/** 工具函数 */
export function statusColor(status: DashboardMetric['status']): string {
  switch (status) {
    case 'ok': return '#22c55e'
    case 'warning': return '#f59e0b'
    case 'critical': return '#ef4444'
    case 'info': return '#3b82f6'
  }
}

export function trendIcon(trend: DashboardMetric['trend']): string {
  switch (trend) {
    case 'up': return '↑'
    case 'down': return '↓'
    case 'stable': return '→'
  }
}
