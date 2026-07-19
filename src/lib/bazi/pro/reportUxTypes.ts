// V5.0 RC Phase 5 Batch 2 Module I: Report UX Engine — Types

export type RiskColor = 'green' | 'yellow' | 'orange' | 'red'
export type ReadingPhase = 'conclusion' | 'reason' | 'classic' | 'explanation' | 'suggestion'

export interface ReadingRhythmSection {
  phase: ReadingPhase
  title: string
  content: string
  sourceModule: string
  riskColor: RiskColor
  order: number
}

export interface TrendTimelinePoint {
  ageRange: string
  career: number       // 0~100
  wealth: number
  love: number
  health: number
}

export interface TrendTimelineSeries {
  name: string
  color: string
  symbol: string
  data: number[]
}

export interface WuXingRadarData {
  element: string       // 木火土金水
  value: number         // 0~100 normalized
  label: string
  color: string
}

export interface WuXingEnergyBar {
  element: string
  rawScore: number
  normalizedScore: number    // 0~100
  polarity: 'productive' | 'exhaustive'
}

export interface WuXingCycleNode {
  element: string
  role: 'productive' | 'weakening'
  targets: string[]
}

export interface TenGodRelationGraphNode {
  id: string
  label: string
  category: string
  relations: TenGodRelationEdge[]
}

export interface TenGodRelationEdge {
  from: string
  to: string
  type: string          // '生' '克' '合' '冲' etc.
  strength: number      // 0~1
}

export interface ReportUxOutput {
  rhythm: ReadingRhythmSection[]
  riskColors: Record<string, RiskColor>
  timeline: TrendTimelinePoint[]
  radar: WuXingRadarData[]
  energyBars: WuXingEnergyBar[]
  cycle: WuXingCycleNode[]
  tenGodGraph: TenGodRelationGraphNode[]
}

export interface ReportUxOptions {
  includeRhythm: boolean
  includeRiskColors: boolean
  includeTimeline: boolean
  includeWuXingRadar: boolean
  includeWuXingEnergyBars: boolean
  includeWuXingCycle: boolean
  includeTenGodGraph: boolean
  maxTimelinePoints: number
}

export const REPORT_UX_VERSION = '1.0.0'

export const DEFAULT_REPORT_UX_OPTIONS: ReportUxOptions = {
  includeRhythm: true,
  includeRiskColors: true,
  includeTimeline: true,
  includeWuXingRadar: true,
  includeWuXingEnergyBars: true,
  includeWuXingCycle: true,
  includeTenGodGraph: true,
  maxTimelinePoints: 12,
}

export const RISK_COLOR_MAP: Record<number, RiskColor> = {
  0: 'green',
  1: 'green',
  2: 'yellow',
  3: 'orange',
  4: 'red',
  5: 'red',
}
