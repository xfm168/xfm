/**
 * RuleVote V2 - 加权投票系统（Weighted Voting）
 *
 * 不是"支持一次 / 反对一次"，而是真正的 Weighted Voting：
 * 每个 Vote 包含：
 *   SupportLevel（1~5 支持强度 +~+++++）
 *   Priority（RulePriorityMatrix 动态优先级）
 *   Confidence（引擎置信度）
 *   ClassicScore（古籍评分）
 *   EvidenceWeight（Evidence 数量归一化）
 *
 * VoteScore = SupportLevel × Priority × Confidence × ClassicScore × EvidenceWeight
 *
 * 通过 Gate 且未被 Kill 的引擎才计入最终 Voting。
 */

import type { Wuxing } from '../../types'
import type { SubEngineResult } from '../types'
import type { ClassicEvidenceRef } from '../../../ruleEngine/types'
import type {
  RuleVote, RuleVoteSummary, VoteStance, SchoolProfile,
  SupportLevel, RulePriorityMatrix, GateReport, KillReport,
} from './types'
import { getEngineWeight, getClassicWeight } from './schoolProfile'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']

/** 根据评分确定投票立场 */
export function getStance(score: number): VoteStance {
  if (score > 0) return 'support'
  if (score < 0) return 'oppose'
  return 'neutral'
}

/** 根据评分绝对值确定支持强度 1~5 */
export function getSupportLevel(score: number): SupportLevel {
  const abs = Math.abs(score)
  if (abs >= 2.5) return 5
  if (abs >= 2.0) return 4
  if (abs >= 1.5) return 3
  if (abs >= 0.8) return 2
  if (abs > 0) return 1
  return 1 // neutral 默认 1，不影响因为 stance=neutral 不计分
}

/**
 * 收集所有引擎对某五行的投票（V2 Weighted Voting，带 Gate/Kill 标签）
 */
export function collectVotesV2(
  wuxing: Wuxing,
  subResults: SubEngineResult[],
  profile: SchoolProfile,
  priorityMatrix: RulePriorityMatrix,
  gate: GateReport,
  kill: KillReport,
): RuleVote[] {
  const votes: RuleVote[] = []

  for (const r of subResults) {
    const score = r.scores[wuxing] ?? 0
    const stance = getStance(score)
    const supportLevel = getSupportLevel(score)
    const baseWeight = getEngineWeight(profile, r.engineName)
    const strength = Math.abs(score)
    const confidence = r.confidence
    const priority = priorityMatrix.byEngine[r.engineName]?.priority ?? baseWeight

    // 引擎 EvidenceWeight（满足的 Evidence 数 / max 5 → 0~1）
    const satisfiedCount = r.evidence.filter(e => e.satisfied).length
    const evidenceWeight = Math.min(satisfiedCount / 5, 1)

    // 引擎 ClassicScore（引用数 × 古籍权重 / max 5 → 0~1）
    const classicWeighted = r.classicEvidence.reduce(
      (sum, c) => sum + getClassicWeight(profile, c.classicName),
      0,
    )
    const classicScore = Math.min(classicWeighted / 3, 1)

    // Gate / Kill 状态
    const gated = !gate.results[r.engineName]?.passed
    const gateRejectReason = gate.results[r.engineName]?.rejectReason
    const killed = !!kill.entries[r.engineName]?.killed
    const killReason = kill.entries[r.engineName]?.killReason as string | undefined

    // 最终 VoteScore（仅 stance=support/oppose 时有意义，且 gated/killed 则为 0）
    const validityFactor = (gated || killed) ? 0 : 1
    const stanceFactor = stance === 'support' ? 1 : stance === 'oppose' ? -1 : 0
    const voteScore = Number((
      supportLevel * 0.25 *
      priority * 5 *
      (0.3 + confidence * 0.7) *
      (0.4 + classicScore * 0.6) *
      (0.4 + evidenceWeight * 0.6) *
      validityFactor * stanceFactor
    ).toFixed(4))

    // 找到该引擎关于这个五行的关键 Evidence
    const relevantEvidence = r.evidence.find(e =>
      e.text.includes(wuxing) || e.text.includes(`${wuxing}：`),
    )

    const vote: RuleVote = {
      voter: r.engineName,
      target: wuxing,
      stance,
      supportLevel,
      priority: Number(priority.toFixed(4)),
      weight: baseWeight,
      strength: Number(strength.toFixed(4)),
      confidence: Number(confidence.toFixed(4)),
      evidenceWeight: Number(evidenceWeight.toFixed(4)),
      classicScore: Number(classicScore.toFixed(4)),
      voteScore,
      reason: r.applicable
        ? relevantEvidence?.text ?? r.summary
        : `引擎不适用（${r.skipReason ?? '未知'}）`,
      citation: relevantEvidence?.citation,
      gated,
      gateRejectReason,
      killed,
      killReason,
    }
    votes.push(vote)
  }

  return votes
}

/**
 * 汇总某五行的投票结果 V2
 */
export function summarizeVotesV2(votes: RuleVote[]): RuleVoteSummary {
  const supportCount = votes.filter(v => v.stance === 'support' && !v.gated && !v.killed).length
  const opposeCount = votes.filter(v => v.stance === 'oppose' && !v.gated && !v.killed).length
  const neutralCount = votes.filter(v => v.stance === 'neutral' && !v.gated && !v.killed).length
  const validVoteCount = votes.filter(v => !v.gated && !v.killed).length
  const gatedVoteCount = votes.filter(v => v.gated).length
  const killedVoteCount = votes.filter(v => v.killed).length

  // 加权支持分 = Σ(valid support voteScore) - Σ(valid oppose voteScore)
  const supportVoteSum = votes
    .filter(v => v.stance === 'support' && !v.gated && !v.killed)
    .reduce((sum, v) => sum + Math.abs(v.voteScore), 0)
  const opposeVoteSum = votes
    .filter(v => v.stance === 'oppose' && !v.gated && !v.killed)
    .reduce((sum, v) => sum + Math.abs(v.voteScore), 0)
  const weightedScore = Number((supportVoteSum - opposeVoteSum).toFixed(4))

  // 支持率 = 支持 voteScore 总和 / (|支持| + |反对|)
  const totalAbs = supportVoteSum + opposeVoteSum
  const supportRate = totalAbs > 0 ? Number((supportVoteSum / totalAbs).toFixed(4)) : 0.5
  const hasConsensus = supportRate > 0.5

  return {
    supportCount,
    opposeCount,
    neutralCount,
    validVoteCount,
    gatedVoteCount,
    killedVoteCount,
    weightedScore,
    supportRate,
    hasConsensus,
    votes,
  }
}

/**
 * 计算投票分（用于 FinalDecisionScore）V2
 */
export function calculateVoteScoreV2(
  wuxing: Wuxing,
  subResults: SubEngineResult[],
  profile: SchoolProfile,
  priorityMatrix: RulePriorityMatrix,
  gate: GateReport,
  kill: KillReport,
): { voteScore: number; summary: RuleVoteSummary } {
  const votes = collectVotesV2(wuxing, subResults, profile, priorityMatrix, gate, kill)
  const summary = summarizeVotesV2(votes)

  // 归一化加权投票分（缩放到 [0, evidenceWeights.voteWeight]）
  const maxPossible = 3 * profile.evidenceWeights.voteWeight
  // summary.weightedScore 理论范围 ≈ [-maxPossible, +maxPossible]
  const normalized = Math.max(0, (summary.weightedScore + maxPossible) / (2 * maxPossible))
  const voteScore = Number((normalized * profile.evidenceWeights.voteWeight).toFixed(4))

  return { voteScore, summary }
}

/**
 * 获取所有五行的投票汇总 V2
 */
export function getAllVoteSummariesV2(
  subResults: SubEngineResult[],
  profile: SchoolProfile,
  priorityMatrix: RulePriorityMatrix,
  gate: GateReport,
  kill: KillReport,
): Record<Wuxing, RuleVoteSummary> {
  const result = {} as Record<Wuxing, RuleVoteSummary>
  for (const wx of WUXING_LIST) {
    const votes = collectVotesV2(wx, subResults, profile, priorityMatrix, gate, kill)
    result[wx] = summarizeVotesV2(votes)
  }
  return result
}

// ============================================================
// V1 兼容导出（不破坏既有导入）
// ============================================================
export {
  collectVotesV2 as collectVotes,
  summarizeVotesV2 as summarizeVotes,
}

/** V1 兼容：老版本 calculateVoteScore */
export function calculateVoteScore(
  wuxing: Wuxing,
  subResults: SubEngineResult[],
  profile: SchoolProfile,
): { voteScore: number; summary: RuleVoteSummary } {
  // 降级：使用空 priorityMatrix + 通过全部 gate + 无 kill
  const dummyMatrix: RulePriorityMatrix = makeDummyPriority(subResults, profile)
  const dummyGate = makeAllPassGate(subResults)
  const dummyKill = makeNoKill(subResults)
  return calculateVoteScoreV2(wuxing, subResults, profile, dummyMatrix, dummyGate, dummyKill)
}

/** V1 兼容：老版本 getAllVoteSummaries */
export function getAllVoteSummaries(
  subResults: SubEngineResult[],
  profile: SchoolProfile,
): Record<Wuxing, RuleVoteSummary> {
  const dummyMatrix = makeDummyPriority(subResults, profile)
  const dummyGate = makeAllPassGate(subResults)
  const dummyKill = makeNoKill(subResults)
  return getAllVoteSummariesV2(subResults, profile, dummyMatrix, dummyGate, dummyKill)
}

/** 辅助：V1 兼容 - 构造伪优先级矩阵（使用 SchoolProfile.engineWeights） */
function makeDummyPriority(
  subResults: SubEngineResult[],
  profile: SchoolProfile,
): RulePriorityMatrix {
  const weightMap: Record<string, number> = {
    StrengthEngine: profile.engineWeights.strength,
    PatternEngine: profile.engineWeights.pattern,
    ClimateEngine: profile.engineWeights.climate,
    BalanceEngine: profile.engineWeights.balance,
    MedicineEngine: profile.engineWeights.medicine,
    BridgeEngine: profile.engineWeights.bridge,
    SeasonEngine: profile.engineWeights.season,
  }
  const entries = subResults.map(r => ({
    engineName: r.engineName,
    baseWeight: weightMap[r.engineName] ?? r.weight,
    adjustmentFactor: 1.0,
    priority: weightMap[r.engineName] ?? r.weight,
    reason: 'V1兼容模式：使用SchoolProfile固定权重',
  }))
  // 归一化
  const sum = entries.reduce((s, e) => s + e.priority, 0)
  if (sum > 0) for (const e of entries) e.priority = Number((e.priority / sum).toFixed(4))
  const byEngine: Record<string, RulePriorityMatrix['entries'][number]> = {}
  for (const e of entries) byEngine[e.engineName] = e
  return {
    detectedPatterns: ['balanced'],
    patternSummary: 'V1兼容模式',
    entries,
    byEngine,
    generatedAt: Date.now(),
  }
}

/** 辅助：V1 兼容 - 全部通过 Gate */
function makeAllPassGate(subResults: SubEngineResult[]): GateReport {
  const results: Record<string, GateReport['results'][string]> = {}
  for (const r of subResults) {
    results[r.engineName] = {
      engineName: r.engineName,
      passed: true,
      traceKept: true,
      checks: {} as any,
    }
  }
  return {
    totalEngines: subResults.length,
    passedCount: subResults.length,
    rejectedCount: 0,
    passRate: 1,
    results,
    thresholds: { minConfidence: 0, minEvidenceCount: 0, minClassicCount: 0, requireApplicable: false, minEngineHealth: 0 },
    summary: 'V1兼容：全部通过Gate',
  }
}

/** 辅助：V1 兼容 - 无 Kill */
function makeNoKill(subResults: SubEngineResult[]): KillReport {
  const entries: Record<string, KillReport['entries'][string]> = {}
  for (const r of subResults) {
    entries[r.engineName] = { engineName: r.engineName, killed: false }
  }
  return {
    totalEngines: subResults.length,
    killedCount: 0,
    aliveCount: subResults.length,
    entries,
    thresholds: { maxContinuousConflicts: 999, minEvidenceBeforeKill: -1, minConfidenceBeforeKill: -1 },
    summary: 'V1兼容：无Kill',
  }
}
