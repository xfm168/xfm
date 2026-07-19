/**
 * Confidence Calibration Engine
 *
 * 职责：
 *   - 从 CaseEntryV2 提取 5 个信任维度并加权计算总信任分
 *   - 批量校准、等级筛选、分布统计、排序与比较
 * 约束：
 *   - 不修改输入命例
 *   - 0-100 总分，自动映射信任等级
 */

import type { CaseEntryV2 } from './caseLibraryTypesV2'
import type { TrustDimension, TrustLevel, FinalTrustScore, CalibrationOptions } from './confidenceCalibrationTypes'
import { DEFAULT_TRUST_WEIGHTS, TRUST_LEVEL_THRESHOLDS } from './confidenceCalibrationTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const CONFIDENCE_CALIBRATION_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 维度提取
// ═══════════════════════════════════════════

/** 提取 confidence 维度 (0-100) */
function extractConfidence(entry: CaseEntryV2): number {
  return Math.round(entry.confidence * 100)
}

/** 提取 reliability 维度 (0-100) */
function extractReliability(entry: CaseEntryV2): number {
  return entry.reliability
}

/** 提取 evidenceScore 维度 (0-100)：基于证据数量和平均置信度 */
function extractEvidenceScore(entry: CaseEntryV2): number {
  const evidence = entry.evidence
  if (evidence.length === 0) return 0

  const avgConfidence = evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length
  const countFactor = Math.min(evidence.length / 5, 1) // 5条以上满分
  return Math.round(avgConfidence * countFactor * 100)
}

/** 提取 expertConsensus 维度 (0-100) */
function extractExpertConsensus(entry: CaseEntryV2): number {
  if (entry.consensusScore !== undefined) return entry.consensusScore

  const opinions = entry.expertOpinions
  if (opinions.length === 0) return 0

  const agreeCount = opinions.filter((o) => o.verdict === 'agree').length
  const rate = agreeCount / opinions.length
  const countBonus = Math.min(opinions.length * 2, 10)
  return Math.min(Math.round(rate * 100) + countBonus, 100)
}

/** 提取 regressionStability 维度 (0-100)：基于回归等级和审核状态 */
function extractRegressionStability(entry: CaseEntryV2): number {
  const tierScores: Record<string, number> = {
    gold: 95,
    silver: 80,
    bronze: 60,
    none: 0,
  }

  const reviewScores: Record<string, number> = {
    approved: 10,
    pending: 0,
    rejected: -10,
    deprecated: -20,
  }

  const tierScore = tierScores[entry.regressionTier] ?? 0
  const reviewBonus = reviewScores[entry.reviewStatus] ?? 0
  return Math.max(0, Math.min(100, tierScore + reviewBonus))
}

// ═══════════════════════════════════════════
// 3. 等级映射与描述生成
// ═══════════════════════════════════════════

/** 根据总分获取信任等级 */
function getTrustLevel(score: number, thresholds: Record<TrustLevel, number>): TrustLevel {
  if (score >= thresholds.highly_trusted) return 'highly_trusted'
  if (score >= thresholds.trusted) return 'trusted'
  if (score >= thresholds.moderate) return 'moderate'
  if (score >= thresholds.low) return 'low'
  return 'unverified'
}

/** 维度描述映射 */
const DIMENSION_DESCRIPTIONS: Record<TrustDimension, string> = {
  confidence: 'AI 引擎自身置信度',
  reliability: '命例数据可信度综合评分',
  evidenceScore: '证据数量与质量的综合评估',
  expertConsensus: '专家共识程度与一致性',
  regressionStability: '回归验证稳定性与审核状态',
}

/** 生成维度描述（含评分等级） */
function generateDimensionDescription(dimension: TrustDimension, score: number): string {
  const base = DIMENSION_DESCRIPTIONS[dimension]
  if (score >= 80) return `${base}（优秀：${score}）`
  if (score >= 60) return `${base}（良好：${score}）`
  if (score >= 40) return `${base}（中等：${score}）`
  if (score >= 20) return `${base}（较低：${score}）`
  return `${base}（不足：${score}）`
}

// ═══════════════════════════════════════════
// 4. 核心校准函数
// ═══════════════════════════════════════════

/**
 * 校准单个命例的信任评分
 * @param entry - CaseEntryV2 命例
 * @param options - 校准选项（可选）
 * @returns 完整的 FinalTrustScore
 */
export function calibrateTrustScore(
  entry: CaseEntryV2,
  options?: CalibrationOptions,
): FinalTrustScore {
  const weights = { ...DEFAULT_TRUST_WEIGHTS, ...options?.weights }
  const thresholds = { ...TRUST_LEVEL_THRESHOLDS, ...options?.thresholds }

  // 提取 5 个维度
  const dimensionScores: Record<TrustDimension, number> = {
    confidence: extractConfidence(entry),
    reliability: extractReliability(entry),
    evidenceScore: extractEvidenceScore(entry),
    expertConsensus: extractExpertConsensus(entry),
    regressionStability: extractRegressionStability(entry),
  }

  // 加权计算
  let totalWeightedScore = 0
  const breakdown: FinalTrustScore['breakdown'] = []

  for (const dim of Object.keys(weights) as TrustDimension[]) {
    const score = dimensionScores[dim]
    const weight = weights[dim]
    const weightedScore = score * weight
    totalWeightedScore += weightedScore

    breakdown.push({
      dimension: dim,
      score,
      weight,
      weightedScore,
      description: generateDimensionDescription(dim, score),
    })
  }

  const trustScore = Math.round(totalWeightedScore)
  const trustLevel = getTrustLevel(trustScore, thresholds)

  return {
    caseId: entry.caseId,
    trustScore,
    trustLevel,
    dimensions: dimensionScores,
    breakdown,
    calibratedAt: Date.now(),
  }
}

// ═══════════════════════════════════════════
// 5. 批量与筛选
// ═══════════════════════════════════════════

/** 批量校准信任评分 */
export function batchCalibrateTrust(
  cases: CaseEntryV2[],
  options?: CalibrationOptions,
): FinalTrustScore[] {
  return cases.map((c) => calibrateTrustScore(c, options))
}

/** 按信任等级筛选命例 */
export function filterByTrustLevel(
  cases: CaseEntryV2[],
  level: TrustLevel,
): CaseEntryV2[] {
  return cases.filter((c) => calibrateTrustScore(c).trustLevel === level)
}

// ═══════════════════════════════════════════
// 6. 统计与排序
// ═══════════════════════════════════════════

/** 获取信任等级分布统计 */
export function getTrustDistribution(cases: CaseEntryV2[]): Record<TrustLevel, number> {
  const distribution: Record<TrustLevel, number> = {
    highly_trusted: 0,
    trusted: 0,
    moderate: 0,
    low: 0,
    unverified: 0,
  }

  for (const c of cases) {
    const result = calibrateTrustScore(c)
    distribution[result.trustLevel]++
  }

  return distribution
}

/** 获取最可信的命例（按总分降序） */
export function getTopTrustedCases(
  cases: CaseEntryV2[],
  limit: number,
): CaseEntryV2[] {
  return [...cases]
    .sort((a, b) => {
      const scoreA = calibrateTrustScore(a).trustScore
      const scoreB = calibrateTrustScore(b).trustScore
      return scoreB - scoreA
    })
    .slice(0, limit)
}

/** 获取信任趋势 */
export function getTrustTrend(cases: CaseEntryV2[]): {
  avgScore: number
  highlyTrustedPct: number
  trustedPct: number
  unverifiedPct: number
} {
  if (cases.length === 0) {
    return { avgScore: 0, highlyTrustedPct: 0, trustedPct: 0, unverifiedPct: 0 }
  }

  const results = cases.map((c) => calibrateTrustScore(c))
  const totalScore = results.reduce((sum, r) => sum + r.trustScore, 0)
  const avgScore = Math.round(totalScore / results.length)

  const highlyTrustedCount = results.filter((r) => r.trustLevel === 'highly_trusted').length
  const trustedCount = results.filter((r) => r.trustLevel === 'trusted').length
  const unverifiedCount = results.filter((r) => r.trustLevel === 'unverified').length

  return {
    avgScore,
    highlyTrustedPct: Math.round((highlyTrustedCount / cases.length) * 100),
    trustedPct: Math.round((trustedCount / cases.length) * 100),
    unverifiedPct: Math.round((unverifiedCount / cases.length) * 100),
  }
}

// ═══════════════════════════════════════════
// 7. 比较
// ═══════════════════════════════════════════

/** 比较两个命例的信任评分 */
export function compareTrust(
  caseA: CaseEntryV2,
  caseB: CaseEntryV2,
): {
  caseA_score: number
  caseB_score: number
  diff: number
  leader: string
} {
  const resultA = calibrateTrustScore(caseA)
  const resultB = calibrateTrustScore(caseB)
  const diff = Math.abs(resultA.trustScore - resultB.trustScore)

  return {
    caseA_score: resultA.trustScore,
    caseB_score: resultB.trustScore,
    diff,
    leader: resultA.trustScore >= resultB.trustScore ? caseA.caseId : caseB.caseId,
  }
}