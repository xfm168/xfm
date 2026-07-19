// V5.0 RC Phase 5 Batch 2 Module IV: Confidence Visualization Engine — Types

export type VizDisplayMode = 'gauge' | 'bar' | 'breakdown' | 'timeline'
export type TrustDisplayLevel = 'highly_trusted' | 'trusted' | 'moderate' | 'low' | 'unverified'

export interface TrustScoreGauge {
  value: number
  level: TrustDisplayLevel
  color: string
  label: string
}

export interface SourceContribution {
  source: string
  contribution: number     // 0~100
  weight: number
  label: string
  color: string
  status: 'strong' | 'moderate' | 'weak'
}

export interface ConfidenceBreakdownItem {
  dimension: string
  score: number
  maxScore: number
  percentage: number
  status: 'strong' | 'moderate' | 'weak'
}

export interface ConfidenceVisualization {
  gauge: TrustScoreGauge
  breakdown: ConfidenceBreakdownItem[]
  sourceContributions: SourceContribution[]
  overallLabel: string
  displayMode: VizDisplayMode
}

export interface ConfidenceVizOptions {
  displayMode: VizDisplayMode
  showSourceBreakdown: boolean
  maxSources: number
  colorScheme: 'default' | 'monochrome' | 'traffic-light'
}

export const CONFIDENCE_VIZ_VERSION = '1.0.0'

export const TRUST_LEVEL_THRESHOLDS_VIZ: Record<TrustDisplayLevel, { min: number; max: number; label: string; color: string }> = {
  highly_trusted: { min: 85, max: 100, label: '高度可信', color: '#22c55e' },
  trusted: { min: 70, max: 84, label: '可信', color: '#84cc16' },
  moderate: { min: 50, max: 69, label: '中等', color: '#eab308' },
  low: { min: 30, max: 49, label: '偏低', color: '#f97316' },
  unverified: { min: 0, max: 29, label: '未验证', color: '#ef4444' },
}

export const DEFAULT_VIZ_OPTIONS: ConfidenceVizOptions = {
  displayMode: 'gauge',
  showSourceBreakdown: true,
  maxSources: 10,
  colorScheme: 'default',
}
