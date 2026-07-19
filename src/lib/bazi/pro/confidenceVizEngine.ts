/**
 * V5.0 RC Phase 5 Batch 2 Module IV: Confidence Visualization Engine
 *
 * 职责：纯数据转换，将置信度分数+维度数据转换为可视化结构
 * 约束：不依赖实际引擎输出，不直接 import 现有引擎运行时函数
 */

import type {
  VizDisplayMode,
  TrustDisplayLevel,
  TrustScoreGauge,
  SourceContribution,
  ConfidenceBreakdownItem,
  ConfidenceVisualization,
  ConfidenceVizOptions,
} from './confidenceVizTypes'

import {
  CONFIDENCE_VIZ_VERSION,
  TRUST_LEVEL_THRESHOLDS_VIZ,
  DEFAULT_VIZ_OPTIONS,
} from './confidenceVizTypes'

// ═══════════════════════════════════════════════════════════
// 版本号
// ═══════════════════════════════════════════════════════════

export const CONFIDENCE_VIZ_ENGINE_VERSION = '1.0.0'

// ═══════════════════════════════════════════════════════════
// 内部辅助
// ═══════════════════════════════════════════════════════════

function clampScore(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

const DEFAULT_MAX_SCORE = 100

// ═══════════════════════════════════════════════════════════
// 公开函数
// ═══════════════════════════════════════════════════════════

/**
 * 分数 -> 仪表盘数据（含 level/color/label）
 */
export function buildTrustScoreGauge(score: number): TrustScoreGauge {
  const clamped = clampScore(score, 0, 100)
  const level = getTrustDisplayLevel(clamped)
  const thresholds = TRUST_LEVEL_THRESHOLDS_VIZ[level]
  return {
    value: clamped,
    level,
    color: thresholds.color,
    label: thresholds.label,
  }
}

/**
 * 各维度贡献度 = score * weight，排序
 */
export function calculateSourceContributions(
  dimensions: Array<{ dimension: string; score: number; weight: number; source: string }>,
): SourceContribution[] {
  return dimensions
    .map((d) => {
      const contribution = clampScore(d.score * d.weight, 0, 100)
      return {
        source: d.source,
        contribution,
        weight: d.weight,
        label: d.dimension,
        color: mapScoreToColor(d.score),
        status: mapScoreToStatus(d.score),
      }
    })
    .sort((a, b) => b.contribution - a.contribution)
}

/**
 * 分项明细
 */
export function buildBreakdownItems(
  dimensions: Array<{ dimension: string; score: number; weight: number; source: string }>,
): ConfidenceBreakdownItem[] {
  return dimensions.map((d) => {
    const maxScore = DEFAULT_MAX_SCORE
    const percentage = maxScore > 0 ? clampScore(Math.round((d.score / maxScore) * 100), 0, 100) : 0
    return {
      dimension: d.dimension,
      score: d.score,
      maxScore,
      percentage,
      status: mapScoreToStatus(d.score),
    }
  })
}

/**
 * 分数到颜色（3 种配色方案）
 */
export function mapScoreToColor(
  score: number,
  scheme: 'default' | 'monochrome' | 'traffic-light' = 'default',
): string {
  const clamped = clampScore(score, 0, 100)

  switch (scheme) {
    case 'monochrome': {
      // 单色灰度：高分深灰，低分浅灰
      const intensity = Math.round((clamped / 100) * 200 + 55)
      return `#${intensity.toString(16).padStart(2, '0')}${intensity.toString(16).padStart(2, '0')}${intensity.toString(16).padStart(2, '0')}`
    }
    case 'traffic-light': {
      if (clamped >= 70) return '#22c55e'
      if (clamped >= 40) return '#eab308'
      return '#ef4444'
    }
    case 'default':
    default: {
      const level = getTrustDisplayLevel(clamped)
      return TRUST_LEVEL_THRESHOLDS_VIZ[level].color
    }
  }
}

/**
 * 可信度文字标签
 */
export function formatConfidenceLabel(score: number): string {
  const clamped = clampScore(score, 0, 100)
  const level = getTrustDisplayLevel(clamped)
  return TRUST_LEVEL_THRESHOLDS_VIZ[level].label
}

/**
 * 获取可信度展示级别
 */
export function getTrustDisplayLevel(score: number): TrustDisplayLevel {
  const clamped = clampScore(score, 0, 100)
  if (clamped >= 85) return 'highly_trusted'
  if (clamped >= 70) return 'trusted'
  if (clamped >= 50) return 'moderate'
  if (clamped >= 30) return 'low'
  return 'unverified'
}

/**
 * 分数映射到状态：>=70 strong, >=40 moderate, <40 weak
 */
export function mapScoreToStatus(score: number): 'strong' | 'moderate' | 'weak' {
  const clamped = clampScore(score, 0, 100)
  if (clamped >= 70) return 'strong'
  if (clamped >= 40) return 'moderate'
  return 'weak'
}

/**
 * 组合函数：将分数+维度数据转换为可视化结构
 */
export function buildConfidenceVisualization(
  score: number,
  dimensions: Array<{ dimension: string; score: number; weight: number; source: string }>,
  options?: Partial<ConfidenceVizOptions>,
): ConfidenceVisualization {
  const opts: ConfidenceVizOptions = { ...DEFAULT_VIZ_OPTIONS, ...options }
  const gauge = buildTrustScoreGauge(score)
  const breakdown = buildBreakdownItems(dimensions)

  let sourceContributions = calculateSourceContributions(dimensions)
  if (opts.maxSources > 0) {
    sourceContributions = sourceContributions.slice(0, opts.maxSources)
  }

  const displayMode: VizDisplayMode = opts.displayMode
  const overallLabel = formatConfidenceLabel(score)

  return {
    gauge,
    breakdown,
    sourceContributions,
    overallLabel,
    displayMode,
  }
}
