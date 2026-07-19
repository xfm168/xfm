/**
 * Case Quality Score Types
 *
 * 定义命例质量评分的维度、结果和阈值类型
 */

import type { StarRating } from './caseLibraryTypesV2'

/** 质量评分维度 */
export type QualityDimension = 'completeness' | 'source' | 'expert' | 'consistency' | 'citation'

/** 质量评分结果 */
export interface QualityScoreResult {
  caseId: string
  totalScore: number
  starRating: StarRating
  dimensions: Record<QualityDimension, number>
  passed: boolean
}

/** 质量阈值配置 */
export interface QualityThreshold {
  minTotal: number
  minStar: number
  dimensionMinimums: Record<QualityDimension, number>
}

/** 默认质量阈值 */
export const DEFAULT_QUALITY_THRESHOLD: QualityThreshold = {
  minTotal: 60,
  minStar: 3,
  dimensionMinimums: {
    completeness: 10,
    source: 10,
    expert: 5,
    consistency: 5,
    citation: 0,
  },
}
