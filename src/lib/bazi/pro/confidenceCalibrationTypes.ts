/**
 * Confidence Calibration Types
 *
 * 定义置信度校准的信任维度、信任评分、等级、选项和过滤器
 */

/** 信任维度 */
export type TrustDimension =
  | 'confidence'
  | 'reliability'
  | 'evidenceScore'
  | 'expertConsensus'
  | 'regressionStability'

/** 信任等级 */
export type TrustLevel =
  | 'highly_trusted'
  | 'trusted'
  | 'moderate'
  | 'low'
  | 'unverified'

/** 信任细分项 */
export interface TrustBreakdownItem {
  dimension: TrustDimension
  score: number
  weight: number
  weightedScore: number
  description: string
}

/** 最终信任评分 */
export interface FinalTrustScore {
  caseId: string
  trustScore: number
  trustLevel: TrustLevel
  dimensions: Record<TrustDimension, number>
  breakdown: TrustBreakdownItem[]
  calibratedAt: number
}

/** 校准选项 */
export interface CalibrationOptions {
  weights?: Partial<Record<TrustDimension, number>>
  thresholds?: Partial<Record<TrustLevel, number>>
}

/** 信任过滤器 */
export interface TrustFilter {
  minScore: number
  levels: TrustLevel[]
  dimensions?: Partial<Record<TrustDimension, number>>
}

/** 默认信任权重 */
export const DEFAULT_TRUST_WEIGHTS: Record<TrustDimension, number> = {
  confidence: 0.15,
  reliability: 0.25,
  evidenceScore: 0.15,
  expertConsensus: 0.30,
  regressionStability: 0.15,
}

/** 信任等级阈值 */
export const TRUST_LEVEL_THRESHOLDS: Record<TrustLevel, number> = {
  highly_trusted: 85,
  trusted: 70,
  moderate: 50,
  low: 30,
  unverified: 0,
}