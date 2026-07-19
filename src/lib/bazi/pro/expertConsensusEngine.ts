/**
 * Expert Consensus Engine
 *
 * 职责：
 *   - 分析命例的专家观点数组，计算共识等级
 *   - 识别主导观点和少数观点
 *   - 批量分析与筛选
 * 约束：
 *   - 不修改输入命例
 *   - 支持选项自定义
 */

import type { CaseEntryV2 } from './caseLibraryTypesV2'
import type { ConsensusResult, ConsensusLevel, ConsensusOptions } from './expertConsensusTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const EXPERT_CONSENSUS_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 默认选项
// ═══════════════════════════════════════════

const DEFAULT_CONSENSUS_OPTIONS: ConsensusOptions = {
  minOpinions: 1,
  weightByExpertScore: false,
}

// ═══════════════════════════════════════════
// 3. 内部辅助函数
// ═══════════════════════════════════════════

/** 根据一致率判断共识等级 */
function determineConsensusLevel(rate: number): ConsensusLevel {
  if (rate >= 1) return 'unanimous'
  if (rate >= 0.8) return 'strong'
  if (rate >= 0.6) return 'moderate'
  if (rate >= 0.4) return 'weak'
  return 'disputed'
}

/** 计算加权一致率 */
function calculateAgreementRate(
  opinions: CaseEntryV2['expertOpinions'],
  weightByExpertScore: boolean,
): number {
  if (opinions.length === 0) return 0

  if (!weightByExpertScore) {
    const agreeCount = opinions.filter((o) => o.verdict === 'agree').length
    return agreeCount / opinions.length
  }

  let totalWeight = 0
  let agreeWeight = 0

  for (const o of opinions) {
    const weight = o.score > 0 ? o.score : 1
    totalWeight += weight
    if (o.verdict === 'agree') agreeWeight += weight
  }

  return totalWeight > 0 ? agreeWeight / totalWeight : 0
}

/** 识别主导结论 */
function findDominantConclusion(opinions: CaseEntryV2['expertOpinions']): string {
  if (opinions.length === 0) return ''

  const counts = new Map<string, number>()
  for (const o of opinions) {
    counts.set(o.conclusion, (counts.get(o.conclusion) ?? 0) + 1)
  }

  let dominant = ''
  let maxCount = 0
  for (const [conclusion, count] of counts) {
    if (count > maxCount) {
      maxCount = count
      dominant = conclusion
    }
  }

  return dominant
}

/** 识别少数观点（去重） */
function findMinorityViews(
  opinions: CaseEntryV2['expertOpinions'],
  dominantConclusion: string,
): string[] {
  const minoritySet = new Set<string>()
  for (const o of opinions) {
    if (o.conclusion !== dominantConclusion) {
      minoritySet.add(o.conclusion)
    }
  }
  return Array.from(minoritySet)
}

/** 计算共识分数 (0-100) */
function calculateConsensusScore(
  agreementRate: number,
  opinionCount: number,
): number {
  // 基础分来自一致率，专家数量给予额外加成（最多 10 分）
  const baseScore = Math.round(agreementRate * 100)
  const countBonus = Math.min(opinionCount * 2, 10)
  return Math.min(baseScore + countBonus, 100)
}

// ═══════════════════════════════════════════
// 4. 核心共识分析函数
// ═══════════════════════════════════════════

/**
 * 计算单个命例的专家共识结果
 * @param caseEntry - 命例条目
 * @param options - 分析选项（可选）
 * @returns 共识分析结果
 */
export function calculateExpertConsensus(
  caseEntry: CaseEntryV2,
  options?: Partial<ConsensusOptions>,
): ConsensusResult {
  const opts = { ...DEFAULT_CONSENSUS_OPTIONS, ...options }
  const opinions = caseEntry.expertOpinions

  if (opinions.length < opts.minOpinions) {
    return {
      caseId: caseEntry.caseId,
      consensusScore: 0,
      consensusLevel: 'disputed',
      opinionCount: opinions.length,
      agreementRate: 0,
      dominantConclusion: '',
      minorityViews: [],
    }
  }

  const agreementRate = calculateAgreementRate(opinions, opts.weightByExpertScore)
  const consensusScore = calculateConsensusScore(agreementRate, opinions.length)
  const consensusLevel = determineConsensusLevel(agreementRate)
  const dominantConclusion = findDominantConclusion(opinions)
  const minorityViews = findMinorityViews(opinions, dominantConclusion)

  return {
    caseId: caseEntry.caseId,
    consensusScore,
    consensusLevel,
    opinionCount: opinions.length,
    agreementRate: Math.round(agreementRate * 100) / 100,
    dominantConclusion,
    minorityViews,
  }
}

// ═══════════════════════════════════════════
// 5. 批量与筛选工具
// ═══════════════════════════════════════════

/**
 * 批量计算命例共识
 * @param cases - 命例数组
 * @param options - 分析选项（可选）
 * @returns 共识结果数组
 */
export function batchCalculateConsensus(
  cases: CaseEntryV2[],
  options?: Partial<ConsensusOptions>,
): ConsensusResult[] {
  return cases.map((c) => calculateExpertConsensus(c, options))
}

/**
 * 按共识等级筛选命例
 * @param cases - 命例数组
 * @param level - 目标共识等级
 * @param options - 分析选项（可选）
 * @returns 符合等级的命例数组
 */
export function getCasesByConsensusLevel(
  cases: CaseEntryV2[],
  level: ConsensusLevel,
  options?: Partial<ConsensusOptions>,
): CaseEntryV2[] {
  return cases.filter(
    (c) => calculateExpertConsensus(c, options).consensusLevel === level,
  )
}
