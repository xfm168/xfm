// V5.0 RC Phase 5 Module VI: Dashboard v2 Engine — Types

export type DashboardPanel = 'health' | 'performance' | 'knowledge' | 'coverage' | 'regression' | 'case' | 'expert' | 'report'
export type DashboardStatus = 'excellent' | 'good' | 'fair' | 'critical'

export interface DashboardV2Metric {
  panel: DashboardPanel
  id: string
  label: string
  value: number | string
  status: 'ok' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  unit?: string
}

export interface DashboardV2Section {
  panel: DashboardPanel
  title: string
  description: string
  metrics: DashboardV2Metric[]
  score: number
  status: 'ok' | 'warning' | 'critical'
}

export interface DashboardV2Options {
  panels: DashboardPanel[]
  refreshInterval: number
}

export interface DashboardV2 {
  version: string
  generatedAt: number
  overallScore: number
  overallStatus: DashboardStatus
  sections: DashboardV2Section[]
  recommendations: string[]
}

export interface DashboardV2Snapshot {
  timestamp: number
  overallScore: number
  scoresByPanel: Record<string, number>
}

export const DASHBOARD_V2_VERSION = '1.0.0'

export const ALL_DASHBOARD_PANELS: DashboardPanel[] = [
  'health', 'performance', 'knowledge', 'coverage', 'regression', 'case', 'expert', 'report'
]

export const PANEL_WEIGHTS: Record<DashboardPanel, number> = {
  health: 0.15,
  performance: 0.15,
  knowledge: 0.10,
  coverage: 0.10,
  regression: 0.15,
  case: 0.15,
  expert: 0.10,
  report: 0.10,
}

export const DEFAULT_DASHBOARD_V2_OPTIONS: DashboardV2Options = {
  panels: ALL_DASHBOARD_PANELS,
  refreshInterval: 300000,
}