/**
 * Case Reliability Types
 *
 * 定义命例可信度评估的等级、报告、过滤器和阈值
 */

import type { ReliabilityDimensionsV2 } from './caseLibraryTypesV2'

/** 可信度等级 */
export type ReliabilityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'unverified'

/** 可信度报告细分项 */
export interface ReliabilityBreakdownItem {
  dimension: string
  score: number
  weight: number
  weightedScore: number
}

/** 单个命例的可信度评估报告 */
export interface ReliabilityReport {
  caseId: string
  overallScore: number
  level: ReliabilityLevel
  dimensions: ReliabilityDimensionsV2
  breakdown: ReliabilityBreakdownItem[]
  recommendations: string[]
}

/** 可信度过滤器 */
export interface ReliabilityFilter {
  minScore?: number
  maxScore?: number
  levels?: ReliabilityLevel[]
}

/** 可信度等级阈值（含） */
export const RELIABILITY_LEVEL_THRESHOLDS = {
  excellent: 90,
  good: 75,
  fair: 60,
  poor: 40,
  unverified: 0,
} as const
