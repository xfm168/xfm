/**
 * RuleVote - 规则投票系统
 *
 * 不是所有 Rule 权重都一样，每个引擎对每个五行进行投票：
 * - Support（支持，score > 0）
 * - Oppose（反对，score < 0）
 * - Neutral（中立，score = 0 或不适用）
 *
 * DecisionEngine 根据投票裁决，而非简单加权平均。
 */

import type { Wuxing } from '../../types'
import type { SubEngineResult } from '../types'
import type { RuleVote, RuleVoteSummary, VoteStance, SchoolProfile } from './types'
import { getEngineWeight, getEnginePriority } from './schoolProfile'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']

/** 根据评分确定投票立场 */
export function getStance(score: number): VoteStance {
  if (score > 0) return 'support'
  if (score < 0) return 'oppose'
  return 'neutral'
}

/**
 * 收集所有引擎对某五行的投票
 */
export function collectVotes(
  wuxing: Wuxing,
  subResults: SubEngineResult[],
  profile: SchoolProfile,
): RuleVote[] {
  const votes: RuleVote[] = []

  for (const r of subResults) {
    const score = r.scores[wuxing] ?? 0
    const stance = getStance(score)
    const weight = getEngineWeight(profile, r.engineName)
    const strength = Math.abs(score)

    // 找到该引擎关于这个五行的关键 Evidence
    const relevantEvidence = r.evidence.find(e =>
      e.text.includes(wuxing) || e.text.includes(`${wuxing}：`),
    )

    const vote: RuleVote = {
      voter: r.engineName,
      target: wuxing,
      stance,
      weight: r.applicable ? weight : 0,
      strength,
      reason: r.applicable
        ? relevantEvidence?.text ?? r.summary
        : `引擎不适用（${r.skipReason ?? '未知'}）`,
      citation: relevantEvidence?.citation,
    }
    votes.push(vote)
  }

  return votes
}

/**
 * 汇总某五行的投票结果
 */
export function summarizeVotes(votes: RuleVote[]): RuleVoteSummary {
  const supportCount = votes.filter(v => v.stance === 'support').length
  const opposeCount = votes.filter(v => v.stance === 'oppose').length
  const neutralCount = votes.filter(v => v.stance === 'neutral').length

  // 加权支持分 = Σ(support 权重×强度) - Σ(oppose 权重×强度)
  const supportWeighted = votes
    .filter(v => v.stance === 'support')
    .reduce((sum, v) => sum + v.weight * v.strength, 0)
  const opposeWeighted = votes
    .filter(v => v.stance === 'oppose')
    .reduce((sum, v) => sum + v.weight * v.strength, 0)
  const weightedScore = supportWeighted - opposeWeighted

  const totalVoters = votes.length
  const supportRate = totalVoters > 0 ? supportCount / totalVoters : 0
  const hasConsensus = supportRate > 0.5

  return {
    supportCount,
    opposeCount,
    neutralCount,
    weightedScore,
    supportRate,
    hasConsensus,
    votes,
  }
}

/**
 * 计算投票分（用于 FinalDecisionScore）
 *
 * 投票分 = 加权支持分归一化 × voteWeight（来自 SchoolProfile）
 */
export function calculateVoteScore(
  wuxing: Wuxing,
  subResults: SubEngineResult[],
  profile: SchoolProfile,
): { voteScore: number; summary: RuleVoteSummary } {
  const votes = collectVotes(wuxing, subResults, profile)
  const summary = summarizeVotes(votes)

  // 归一化加权支持分（[-1, 1] 区间，再缩放到 [0, 1]）
  const maxPossible = subResults.reduce((sum, r) => sum + getEngineWeight(profile, r.engineName) * 3, 0)
  const normalized = maxPossible > 0 ? summary.weightedScore / maxPossible : 0

  const voteScore = normalized * profile.evidenceWeights.voteWeight

  return { voteScore, summary }
}

/**
 * 获取所有五行的投票汇总
 */
export function getAllVoteSummaries(
  subResults: SubEngineResult[],
  profile: SchoolProfile,
): Record<Wuxing, RuleVoteSummary> {
  const result = {} as Record<Wuxing, RuleVoteSummary>
  for (const wx of WUXING_LIST) {
    const votes = collectVotes(wx, subResults, profile)
    result[wx] = summarizeVotes(votes)
  }
  return result
}
