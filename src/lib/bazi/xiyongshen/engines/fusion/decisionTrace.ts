/**
 * DecisionTrace - 决策回溯系统
 *
 * 最终结果必须能够完整回溯：
 * 为什么定某五行？
 * → StrengthEngine + ClimateEngine + PatternEngine + Classic Support + Rule XXX + Evidence XXX
 *
 * 用户点击即可看到整个决策过程。
 */

import type { Wuxing } from '../../types'
import type { SubEngineResult } from '../types'
import type {
  DecisionTrace, DecisionTraceStep, SchoolProfile,
  FinalDecisionScoreBreakdown, RuleVoteSummary, ClassicSupport,
} from './types'
import { getEnginePriority } from './schoolProfile'

/**
 * 构建某五行的完整决策回溯
 */
export function buildDecisionTrace(
  wuxing: Wuxing,
  subResults: SubEngineResult[],
  scoreBreakdown: FinalDecisionScoreBreakdown,
  voteSummary: RuleVoteSummary,
  classicSupport: ClassicSupport,
  profile: SchoolProfile,
): DecisionTrace {
  const steps: DecisionTraceStep[] = []
  let order = 1

  // ===== Step 1: 各引擎评分贡献 =====
  for (const r of subResults) {
    if (!r.applicable) continue
    const score = r.scores[wuxing] ?? 0
    if (score === 0) continue

    const weight = r.weight
    const contributionValue = score * weight
    const evidenceRef = r.evidence.find(e =>
      e.text.includes(wuxing) || e.text.includes(`${wuxing}：`),
    )

    steps.push({
      order: order++,
      name: `${r.engineName} 评分贡献`,
      contributor: r.engineName,
      contributionType: 'score',
      contributionValue: Number(contributionValue.toFixed(4)),
      description: `${r.engineName} 对 ${wuxing} 评分=${score}，权重=${weight.toFixed(2)}，加权贡献=${contributionValue.toFixed(4)}`,
      evidenceRef: evidenceRef
        ? { engineName: r.engineName, step: evidenceRef.step, text: evidenceRef.text }
        : undefined,
      ruleId: undefined,
      classicRef: r.classicEvidence.find(ce => ce.supports?.includes(wuxing) || true),
    })
  }

  // ===== Step 2: 投票裁决 =====
  steps.push({
    order: order++,
    name: 'Rule Voting 投票裁决',
    contributor: 'RuleVoteSystem',
    contributionType: 'vote',
    contributionValue: Number(scoreBreakdown.voteScore.toFixed(4)),
    description: `投票统计：支持=${voteSummary.supportCount}，反对=${voteSummary.opposeCount}，中立=${voteSummary.neutralCount}，加权支持分=${voteSummary.weightedScore.toFixed(4)}，支持率=${(voteSummary.supportRate * 100).toFixed(0)}%`,
  })

  // ===== Step 3: 古籍支持度 =====
  steps.push({
    order: order++,
    name: 'Classic Support 古籍支持度',
    contributor: 'ClassicSupportSystem',
    contributionType: 'classic',
    contributionValue: Number(scoreBreakdown.classicScore.toFixed(4)),
    description: `古籍引用：${classicSupport.totalRefCount} 条，涉及 ${classicSupport.classicCount} 部经典，支持度=${(classicSupport.supportScore * 100).toFixed(0)}%`,
  })

  // ===== Step 4: 证据完整度 =====
  steps.push({
    order: order++,
    name: 'Evidence Completeness 证据完整度',
    contributor: 'EvidenceTree',
    contributionType: 'evidence',
    contributionValue: Number(scoreBreakdown.evidenceScore.toFixed(4)),
    description: `证据完整度分=${scoreBreakdown.evidenceScore.toFixed(4)}`,
  })

  // ===== Step 5: 流派共识 =====
  steps.push({
    order: order++,
    name: 'School Consensus 流派共识',
    contributor: 'SchoolConsensusSystem',
    contributionType: 'confidence',
    contributionValue: Number(scoreBreakdown.consensusScore.toFixed(4)),
    description: `流派共识分=${scoreBreakdown.consensusScore.toFixed(4)}`,
  })

  // ===== Step 6: 规则优先级因子 =====
  steps.push({
    order: order++,
    name: 'Rule Priority 规则优先级因子',
    contributor: 'RulePrioritySystem',
    contributionType: 'priority',
    contributionValue: Number(scoreBreakdown.priorityFactor.toFixed(4)),
    description: `优先级因子=${scoreBreakdown.priorityFactor.toFixed(4)}（基于 ${profile.name}）`,
  })

  // ===== Step 7: 冲突惩罚 =====
  if (scoreBreakdown.conflictPenalty !== 0) {
    steps.push({
      order: order++,
      name: 'Conflict Penalty 冲突惩罚',
      contributor: 'ConflictReportSystem',
      contributionType: 'penalty',
      contributionValue: Number(scoreBreakdown.conflictPenalty.toFixed(4)),
      description: `冲突惩罚分=${scoreBreakdown.conflictPenalty.toFixed(4)}（降低该五行最终得分）`,
    })
  }

  // ===== Step 8: 最终得分 =====
  steps.push({
    order: order++,
    name: 'Final Score 最终综合分',
    contributor: 'EvidenceFusionEngine',
    contributionType: 'score',
    contributionValue: Number(scoreBreakdown.finalScore.toFixed(4)),
    description: `最终综合分=${scoreBreakdown.finalScore.toFixed(4)} = 加权(${scoreBreakdown.weightedScore.toFixed(4)}) + 投票(${scoreBreakdown.voteScore.toFixed(4)}) + 古籍(${scoreBreakdown.classicScore.toFixed(4)}) + 证据(${scoreBreakdown.evidenceScore.toFixed(4)}) + 共识(${scoreBreakdown.consensusScore.toFixed(4)}) × 优先级(${scoreBreakdown.priorityFactor.toFixed(4)}) - 冲突(${scoreBreakdown.conflictPenalty.toFixed(4)})`,
  })

  // ===== 生成叙事说明 =====
  const narrative = buildNarrative(wuxing, steps, subResults, voteSummary, classicSupport, profile)

  return {
    wuxing,
    finalScore: scoreBreakdown.finalScore,
    steps,
    narrative,
  }
}

/**
 * 生成用户可读的完整回溯说明
 */
function buildNarrative(
  wuxing: Wuxing,
  steps: DecisionTraceStep[],
  subResults: SubEngineResult[],
  voteSummary: RuleVoteSummary,
  classicSupport: ClassicSupport,
  profile: SchoolProfile,
): string {
  const lines: string[] = []
  lines.push(`【${wuxing} 决策回溯】`)
  lines.push('')
  lines.push(`流派：${profile.name}（${profile.description}）`)
  lines.push(`最终综合分：${steps[steps.length - 1].contributionValue}`)
  lines.push('')

  // 引擎评分贡献
  lines.push('① 各引擎评分贡献：')
  for (const r of subResults) {
    if (!r.applicable) continue
    const score = r.scores[wuxing] ?? 0
    const stance = score > 0 ? '支持' : score < 0 ? '反对' : '中立'
    const priority = getEnginePriority(profile, r.engineName)
    lines.push(`  ${r.engineName}：评分=${score}（${stance}），权重=${r.weight.toFixed(2)}，优先级=${priority}，加权贡献=${(score * r.weight).toFixed(4)}`)
  }
  lines.push('')

  // 投票裁决
  lines.push('② Rule Voting 投票裁决：')
  lines.push(`  支持：${voteSummary.supportCount} 票`)
  lines.push(`  反对：${voteSummary.opposeCount} 票`)
  lines.push(`  中立：${voteSummary.neutralCount} 票`)
  lines.push(`  加权支持分：${voteSummary.weightedScore.toFixed(4)}`)
  lines.push(`  支持率：${(voteSummary.supportRate * 100).toFixed(0)}%`)
  if (voteSummary.hasConsensus) {
    lines.push(`  → 多数引擎共识支持 ${wuxing}`)
  }
  lines.push('')

  // 古籍支持度
  lines.push('③ Classic Support 古籍支持度：')
  if (classicSupport.classics.length > 0) {
    for (const c of classicSupport.classics) {
      lines.push(`  《${c.name}》引用 ${c.count} 次`)
    }
    lines.push(`  总引用：${classicSupport.totalRefCount} 次，涉及 ${classicSupport.classicCount} 部经典`)
    lines.push(`  支持度：${(classicSupport.supportScore * 100).toFixed(0)}%`)
  } else {
    lines.push(`  无直接古籍引用`)
  }
  lines.push('')

  // 最终裁决
  lines.push('④ 最终裁决：')
  lines.push(`  综合分 = 加权评分 + 投票分 + 古籍分 + 证据分 + 共识分 × 优先级因子 - 冲突惩罚`)
  lines.push(`  = ${steps[steps.length - 1].contributionValue}`)
  lines.push('')

  return lines.join('\n')
}
