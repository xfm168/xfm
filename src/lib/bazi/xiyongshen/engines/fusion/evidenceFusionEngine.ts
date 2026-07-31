/**
 * EvidenceFusionDecisionEngine - 多证据融合决策引擎
 *
 * 这是整个玄风门命理核心的大脑。
 *
 * 核心原则：
 * 1. 不简单加权平均：score × weight → 最大值即用神（禁止！）
 * 2. Evidence Fusion Decision：融合 7 个子引擎 Evidence + 古籍支持度 + 流派共识 + Evidence 完整度 + Confidence + Rule Priority + Conflict Penalty
 * 3. 支持多用神：Primary / Secondary / Assistant / Avoid / Idle
 * 4. 支持 SchoolProfile 流派模式
 * 5. 完整 DecisionTrace 决策回溯
 * 6. Rule Voting 规则投票
 * 7. Evidence 冲突解释
 * 8. 统一 DecisionResult 输出，为紫微/奇门/六爻预留接口
 *
 * FinalDecisionScore = (
 *   weightedScore        (score × weight × confidence)
 * + voteScore            (Rule Voting 投票分)
 * + classicScore         (Classic Support 古籍支持分)
 * + evidenceScore        (Evidence 完整度分)
 * + consensusScore      (School Consensus 流派共识分)
 * ) × priorityFactor    (Rule Priority 优先级因子)
 * - conflictPenalty     (Conflict Penalty 冲突惩罚)
 */

import type { Wuxing, ShenType } from '../../types'
import type { SubEngineInput, SubEngineResult } from '../types'
import type { ClassicEvidenceRef } from '../../../ruleEngine/types'
import type {
  DecisionResult, YongShenVerdict, SchoolProfile,
  FinalDecisionScoreBreakdown, EvidenceTree, EvidenceNode,
  ConflictReport, DecisionTrace, ClassicSupport, SchoolConsensus,
  RuleVoteSummary, YongShenRole,
} from './types'
import {
  StrengthEngine, PatternEngine, ClimateEngine, BalanceEngine,
  MedicineEngine, BridgeEngine, SeasonEngine,
} from '../index'
import { DEFAULT_SCHOOL, getSchoolProfile, getEngineWeight, getEnginePriority, getClassicWeight } from './schoolProfile'
import { collectVotes, summarizeVotes, calculateVoteScore, getAllVoteSummaries } from './ruleVote'
import { buildConflictReport } from './conflictReport'
import { buildDecisionTrace } from './decisionTrace'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']

/**
 * Evidence Fusion Decision Engine
 */
export class EvidenceFusionDecisionEngine {
  readonly name = 'EvidenceFusionDecisionEngine'
  readonly version = '2.0.0'
  readonly system = 'bazi' as const

  private engines: SubEngineInstance[]

  constructor(private profile: SchoolProfile = DEFAULT_SCHOOL) {
    this.engines = [
      new StrengthEngine(),
      new PatternEngine(),
      new ClimateEngine(),
      new BalanceEngine(),
      new MedicineEngine(),
      new BridgeEngine(),
      new SeasonEngine(),
    ]
  }

  /**
   * 综合决策（Evidence Fusion Decision）
   */
  decide(input: SubEngineInput, profile?: SchoolProfile): DecisionResult {
    const activeProfile = profile ?? this.profile

    // ===== 1. 调用所有子引擎，收集 Evidence =====
    const subResults: SubEngineResult[] = this.engines.map(e => e.evaluate(input))

    // ===== 2. 构建 Evidence Tree =====
    const evidenceTree = this.buildEvidenceTree(subResults)

    // ===== 3. 构建冲突报告 =====
    const conflictReport = buildConflictReport(subResults, activeProfile)

    // ===== 4. 收集所有五行的投票 =====
    const allVoteSummaries = getAllVoteSummaries(subResults, activeProfile)

    // ===== 5. 计算古籍支持度（按五行） =====
    const classicSupportMap = this.buildClassicSupportMap(subResults, activeProfile)

    // ===== 6. 计算流派共识（按五行） =====
    const schoolConsensusMap = this.buildSchoolConsensusMap(input, subResults, activeProfile)

    // ===== 7. 计算 FinalDecisionScore（每个五行） =====
    const scoreBreakdown = WUXING_LIST.map(wx => {
      const voteSummary = allVoteSummaries[wx]
      const classicSupport = classicSupportMap[wx]
      const schoolConsensus = schoolConsensusMap[wx]

      // 7.1 加权评分（score × weight × confidence）
      const weightedScore = this.calculateWeightedScore(wx, subResults, activeProfile)

      // 7.2 投票分
      const { voteScore } = calculateVoteScore(wx, subResults, activeProfile)

      // 7.3 古籍支持分
      const classicScore = classicSupport.supportScore * activeProfile.evidenceWeights.classicWeight

      // 7.4 证据完整度分
      const evidenceScore = evidenceTree.completeness * activeProfile.evidenceWeights.evidenceWeight

      // 7.5 流派共识分
      const consensusScore = schoolConsensus.consensusRate * activeProfile.evidenceWeights.consensusWeight

      // 7.6 规则优先级因子（根据支持该五行的引擎优先级加权平均）
      const priorityFactor = this.calculatePriorityFactor(wx, subResults, activeProfile)

      // 7.7 冲突惩罚分（如果有冲突涉及该五行）
      const conflictPenalty = this.calculateConflictPenalty(wx, conflictReport, activeProfile)

      // 7.8 最终综合分 = (加权 + 投票 + 古籍 + 证据 + 共识) × 优先级 - 冲突惩罚
      const baseScore = weightedScore + voteScore + classicScore + evidenceScore + consensusScore
      const finalScore = Number((baseScore * priorityFactor - conflictPenalty).toFixed(4))

      return {
        wuxing: wx,
        weightedScore: Number(weightedScore.toFixed(4)),
        voteScore: Number(voteScore.toFixed(4)),
        classicScore: Number(classicScore.toFixed(4)),
        evidenceScore: Number(evidenceScore.toFixed(4)),
        consensusScore: Number(consensusScore.toFixed(4)),
        priorityFactor: Number(priorityFactor.toFixed(4)),
        conflictPenalty: Number(conflictPenalty.toFixed(4)),
        finalScore,
      } as FinalDecisionScoreBreakdown
    })

    // ===== 8. 排序并确定用神（支持多用神） =====
    const sorted = [...scoreBreakdown].sort((a, b) => b.finalScore - a.finalScore)
    const top = sorted[0]
    const second = sorted[1]
    const third = sorted[2]
    const last = sorted[sorted.length - 1]
    const secondLast = sorted[sorted.length - 2]

    // 8.1 判定是否多用神（Top 2 差值 <= multiYongShenThreshold 且都 >= yongShenThreshold）
    const isMultiYongShen =
      top.finalScore >= activeProfile.yongShenThreshold &&
      Math.abs(top.finalScore - second.finalScore) <= activeProfile.multiYongShenThreshold &&
      second.finalScore >= activeProfile.yongShenThreshold * 0.8

    // 8.2 多用神模式判定
    const multiYongShenPattern = isMultiYongShen
      ? this.getMultiYongShenPattern(top.wuxing, second.wuxing)
      : undefined

    // ===== 9. 构建每个五行的 Verdict 和 DecisionTrace =====
    const verdicts: YongShenVerdict[] = WUXING_LIST.map(wx => {
      const breakdown = scoreBreakdown.find(b => b.wuxing === wx)!
      const voteSummary = allVoteSummaries[wx]
      const classicSupport = classicSupportMap[wx]
      const trace = buildDecisionTrace(wx, subResults, breakdown, voteSummary, classicSupport, activeProfile)

      // 确定角色
      let role: YongShenRole
      if (wx === top.wuxing) {
        role = 'primary'
      } else if (isMultiYongShen && wx === second.wuxing) {
        role = 'secondary'
      } else if (wx === third.wuxing) {
        role = 'assistant'
      } else if (wx === last.wuxing) {
        role = 'avoid'
      } else if (wx === secondLast.wuxing) {
        role = 'avoid'
      } else {
        role = 'idle'
      }

      // 综合可信度
      const confidence = this.calculateElementConfidence(wx, voteSummary, classicSupport, evidenceTree, conflictReport)

      // 并用关系
      const combinedWith = isMultiYongShen && (wx === top.wuxing || wx === second.wuxing)
        ? [top.wuxing, second.wuxing].filter(w => w !== wx)
        : undefined

      return {
        wuxing: wx,
        role,
        finalScore: breakdown.finalScore,
        confidence,
        vote: voteSummary,
        classicSupport,
        trace,
        combinedWith,
      }
    })

    // ===== 10. 确定最终用神 =====
    const primaryYongShen = top.wuxing
    const secondaryYongShen = isMultiYongShen ? second.wuxing : undefined
    const assistantGod = third.wuxing
    const avoidGod = last.wuxing
    const idleGod = isMultiYongShen
      ? sorted.find(s => s.wuxing !== top.wuxing && s.wuxing !== second.wuxing)?.wuxing ?? third.wuxing
      : sorted[2].wuxing

    // ===== 11. 计算综合 Confidence =====
    const confidence = this.calculateOverallConfidence(
      primaryYongShen, subResults, evidenceTree, conflictReport, allVoteSummaries, activeProfile,
    )

    // ===== 12. 构建 explain 和 strategy =====
    const explain = this.buildExplain(
      primaryYongShen, secondaryYongShen, assistantGod, avoidGod, idleGod,
      isMultiYongShen, multiYongShenPattern,
      scoreBreakdown, subResults, conflictReport, activeProfile,
    )
    const strategy = this.buildStrategy(
      primaryYongShen, secondaryYongShen, assistantGod, avoidGod,
      isMultiYongShen, multiYongShenPattern, activeProfile,
    )
    const summary = this.buildSummary(
      primaryYongShen, secondaryYongShen, assistantGod, avoidGod, idleGod,
      isMultiYongShen, confidence.overall,
    )

    // ===== 13. 构建 DecisionTraces =====
    const decisionTraces: DecisionTrace[] = verdicts.map(v => v.trace)

    return {
      system: this.system,
      school: activeProfile.key,
      engineVersion: this.version,

      primaryYongShen,
      secondaryYongShen,
      assistantGod,
      avoidGod,
      idleGod,
      isMultiYongShen,
      multiYongShenPattern,
      verdicts,

      scoreBreakdown,

      confidence: confidence.overall,
      confidenceBreakdown: confidence,

      evidenceTree,
      decisionTraces,
      conflictReport,

      classicSupport: classicSupportMap,
      schoolConsensus: schoolConsensusMap,

      subEngineResults: subResults,

      explain,
      strategy,
      summary,
    }
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /** 加权评分 = Σ(score × weight × confidence) */
  private calculateWeightedScore(
    wuxing: Wuxing,
    subResults: SubEngineResult[],
    profile: SchoolProfile,
  ): number {
    let sum = 0
    for (const r of subResults) {
      if (!r.applicable || r.weight <= 0) continue
      const score = r.scores[wuxing] ?? 0
      sum += score * r.weight * r.confidence
    }
    return sum * profile.evidenceWeights.scoreWeight
  }

  /** 规则优先级因子 */
  private calculatePriorityFactor(
    wuxing: Wuxing,
    subResults: SubEngineResult[],
    profile: SchoolProfile,
  ): number {
    const supporting = subResults.filter(r => r.applicable && (r.scores[wuxing] ?? 0) > 0)
    if (supporting.length === 0) return 1.0

    const avgPriority = supporting.reduce((sum, r) => {
      return sum + getEnginePriority(profile, r.engineName)
    }, 0) / supporting.length

    // 归一化到 [0.8, 1.2] 区间
    return 0.8 + (avgPriority / 5) * 0.4
  }

  /** 冲突惩罚分（针对某五行） */
  private calculateConflictPenalty(
    wuxing: Wuxing,
    conflictReport: ConflictReport,
    profile: SchoolProfile,
  ): number {
    const wxConflicts = conflictReport.conflicts.filter(c => c.wuxing === wuxing)
    if (wxConflicts.length === 0) return 0

    const totalIntensity = wxConflicts.reduce((sum, c) => sum + c.conflictIntensity, 0)
    return Math.min(
      wxConflicts.length * profile.conflictPenaltyFactor * 0.5 + totalIntensity * 0.01,
      0.3,
    )
  }

  /** 构建 Evidence Tree */
  private buildEvidenceTree(subResults: SubEngineResult[]): EvidenceTree {
    const nodes: EvidenceNode[] = subResults.map(r => ({
      engineName: r.engineName,
      applicable: r.applicable,
      skipReason: r.skipReason,
      evidence: r.evidence,
      classicEvidence: r.classicEvidence,
      confidence: r.confidence,
      weight: r.weight,
      scores: r.scores,
      summary: r.summary,
    }))

    const totalEvidence = subResults.reduce((sum, r) => sum + r.evidence.length, 0)
    const satisfiedEvidence = subResults.reduce(
      (sum, r) => sum + r.evidence.filter(e => e.satisfied).length, 0,
    )
    const completeness = totalEvidence > 0 ? satisfiedEvidence / totalEvidence : 0

    const classicsSet = new Set<string>()
    let totalClassicRefs = 0
    for (const r of subResults) {
      for (const ce of r.classicEvidence) {
        classicsSet.add(ce.classicName)
        totalClassicRefs++
      }
    }

    return {
      nodes,
      totalEvidence,
      satisfiedEvidence,
      completeness: Number(completeness.toFixed(4)),
      classics: [...classicsSet],
      totalClassicRefs,
    }
  }

  /** 构建古籍支持度（按五行） */
  private buildClassicSupportMap(
    subResults: SubEngineResult[],
    profile: SchoolProfile,
  ): Record<Wuxing, ClassicSupport> {
    const result = {} as Record<Wuxing, ClassicSupport>

    for (const wx of WUXING_LIST) {
      const classicsMap = new Map<string, { ref: ClassicEvidenceRef; count: number }>()

      for (const r of subResults) {
        if (!r.applicable) continue
        const score = r.scores[wx] ?? 0
        if (score <= 0) continue // 只统计支持该五行的古籍

        for (const ce of r.classicEvidence) {
          const existing = classicsMap.get(ce.classicName)
          if (existing) {
            existing.count++
          } else {
            classicsMap.set(ce.classicName, { ref: ce, count: 1 })
          }
        }
      }

      const classics = [...classicsMap.entries()].map(([name, { ref, count }]) => ({
        name,
        ref,
        count,
      }))

      const totalRefCount = classics.reduce((sum, c) => sum + c.count, 0)
      const classicCount = classics.length

      // 古籍支持度 = Σ(引用次数 × 古籍权重) / maxPossible
      const weightedSum = classics.reduce(
        (sum, c) => sum + c.count * getClassicWeight(profile, c.name),
        0,
      )
      const maxPossible = 10 // 假设最大引用 10 次
      const supportScore = Math.min(weightedSum / maxPossible, 1)

      result[wx] = {
        classics,
        totalRefCount,
        classicCount,
        supportScore: Number(supportScore.toFixed(4)),
      }
    }

    return result
  }

  /** 构建流派共识（按五行） */
  private buildSchoolConsensusMap(
    input: SubEngineInput,
    subResults: SubEngineResult[],
    activeProfile: SchoolProfile,
  ): Record<Wuxing, SchoolConsensus> {
    // 在多个流派下重新计算各五行得分，检查一致性
    const schools = ['ziping', 'qiongtong', 'modern', 'balanced']
    const result = {} as Record<Wuxing, SchoolConsensus>

    for (const wx of WUXING_LIST) {
      const bySchool = schools.map(school => {
        const profile = getSchoolProfile(school)
        const score = this.calculateWeightedScore(wx, subResults, profile)
        return {
          school,
          score: Number(score.toFixed(4)),
          stance: score > 0 ? 'support' as const : score < 0 ? 'oppose' as const : 'neutral' as const,
        }
      })

      // 共识度 = 1 - 标准差/极差
      const scores = bySchool.map(s => s.score)
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length
      const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length
      const std = Math.sqrt(variance)
      const range = Math.max(...scores) - Math.min(...scores)
      const consensusRate = range > 0 ? 1 - std / range : 1

      // 跨流派共识 = 所有流派立场一致
      const stances = new Set(bySchool.map(s => s.stance))
      const hasCrossSchoolConsensus = stances.size === 1 && !stances.has('neutral')

      result[wx] = {
        bySchool,
        consensusRate: Number(consensusRate.toFixed(4)),
        hasCrossSchoolConsensus,
      }
    }

    return result
  }

  /** 计算某五行的综合可信度 */
  private calculateElementConfidence(
    wuxing: Wuxing,
    voteSummary: RuleVoteSummary,
    classicSupport: ClassicSupport,
    evidenceTree: EvidenceTree,
    conflictReport: ConflictReport,
  ): number {
    const voteConf = voteSummary.supportRate
    const classicConf = Math.min(classicSupport.supportScore, 1)
    const evidenceConf = evidenceTree.completeness
    const conflictConf = 1 - conflictReport.conflictPenalty
    return Number(((voteConf + classicConf + evidenceConf + conflictConf) / 4).toFixed(4))
  }

  /** 计算综合 Confidence */
  private calculateOverallConfidence(
    primaryYongShen: Wuxing,
    subResults: SubEngineResult[],
    evidenceTree: EvidenceTree,
    conflictReport: ConflictReport,
    allVoteSummaries: Record<Wuxing, RuleVoteSummary>,
    profile: SchoolProfile,
  ): {
    overall: number
    evidenceCoverage: number
    engineConsensus: number
    classicSupport: number
    schoolConsistency: number
    conflictPenalty: number
  } {
    const applicableCount = subResults.filter(r => r.applicable).length
    const evidenceCoverage = Math.min(applicableCount / 7, 1)

    const primaryVote = allVoteSummaries[primaryYongShen]
    const engineConsensus = primaryVote.supportRate

    const primaryClassic = this.buildClassicSupportMap(subResults, profile)[primaryYongShen]
    const classicSupport = primaryClassic.supportScore

    // 流派一致性 = 主要用神在不同流派下的共识度
    const schoolConsistency = this.buildSchoolConsensusMap(
      {} as SubEngineInput, subResults, profile,
    )[primaryYongShen].consensusRate

    const conflictPenalty = conflictReport.conflictPenalty

    const overall = Number((
      evidenceCoverage * 0.2 +
      engineConsensus * 0.3 +
      classicSupport * 0.2 +
      schoolConsistency * 0.15 +
      (1 - conflictPenalty) * 0.15
    ).toFixed(4))

    return { overall, evidenceCoverage, engineConsensus, classicSupport, schoolConsistency, conflictPenalty }
  }

  /** 获取多用神模式名称 */
  private getMultiYongShenPattern(a: Wuxing, b: Wuxing): string {
    const patterns: Record<string, string> = {
      '木-火': '木火同用（木火通明）',
      '火-木': '木火同用（木火通明）',
      '火-土': '火土并用',
      '土-火': '火土并用',
      '土-金': '土金并用',
      '金-土': '土金并用',
      '金-水': '金水两神成象',
      '水-金': '金水两神成象',
      '水-木': '水木同用',
      '木-水': '水木同用',
    }
    const key = `${a}-${b}`
    return patterns[key] ?? `${a}${b}并用`
  }

  /** 构建策略 */
  private buildStrategy(
    primary: Wuxing, secondary: Wuxing | undefined, assistant: Wuxing, avoid: Wuxing,
    isMulti: boolean, pattern: string | undefined, profile: SchoolProfile,
  ): string {
    if (isMulti && secondary) {
      return `以${primary}${secondary}并用为用（${pattern}），佐${assistant}，避${avoid}。流派：${profile.name}`
    }
    return `以${primary}为用，佐${assistant}，避${avoid}。流派：${profile.name}`
  }

  /** 构建摘要 */
  private buildSummary(
    primary: Wuxing, secondary: Wuxing | undefined, assistant: Wuxing,
    avoid: Wuxing, idle: Wuxing, isMulti: boolean, confidence: number,
  ): string {
    const yongShenPart = isMulti && secondary
      ? `用神=${primary}${secondary}并用`
      : `用神=${primary}`
    return `${yongShenPart} 喜神=${assistant} 忌神=${avoid} 闲神=${idle} confidence=${confidence.toFixed(2)}`
  }

  /** 构建完整说明 */
  private buildExplain(
    primary: Wuxing, secondary: Wuxing | undefined, assistant: Wuxing,
    avoid: Wuxing, idle: Wuxing, isMulti: boolean, pattern: string | undefined,
    scoreBreakdown: FinalDecisionScoreBreakdown[],
    subResults: SubEngineResult[],
    conflictReport: ConflictReport,
    profile: SchoolProfile,
  ): string {
    const lines: string[] = []
    lines.push('【Evidence Fusion Decision 多证据融合决策说明】')
    lines.push('')
    lines.push(`流派：${profile.name}（${profile.description}）`)
    lines.push('')
    lines.push('一、最终结论：')
    if (isMulti && secondary) {
      lines.push(`  主用神：${primary}`)
      lines.push(`  次用神：${secondary}（${pattern}）`)
    } else {
      lines.push(`  用神：${primary}`)
    }
    lines.push(`  辅助神（喜神）：${assistant}`)
    lines.push(`  忌神：${avoid}`)
    lines.push(`  闲神：${idle}`)
    lines.push('')

    lines.push('二、推演过程（Evidence Fusion）：')
    lines.push('')
    lines.push('  Step 1 - 各子引擎 Evidence 收集：')
    for (const r of subResults) {
      if (!r.applicable) {
        lines.push(`    [${r.engineName}] 不适用：${r.skipReason ?? '未知'}（仍保留跳过 Evidence）`)
        continue
      }
      lines.push(`    [${r.engineName}] ${r.summary}`)
    }
    lines.push('')

    lines.push('  Step 2 - Rule Voting 规则投票：')
    for (const wx of WUXING_LIST) {
      const bd = scoreBreakdown.find(b => b.wuxing === wx)!
      const votes = subResults.filter(r => r.applicable).map(r => ({
        engine: r.engineName.replace('Engine', ''),
        score: r.scores[wx] ?? 0,
      }))
      const support = votes.filter(v => v.score > 0).map(v => v.engine).join(',') || '—'
      const oppose = votes.filter(v => v.score < 0).map(v => v.engine).join(',') || '—'
      lines.push(`    ${wx}：支持[${support}] 反对[${oppose}] → 投票分=${bd.voteScore.toFixed(4)}`)
    }
    lines.push('')

    lines.push('  Step 3 - Classic Support 古籍支持度：')
    for (const wx of WUXING_LIST) {
      const bd = scoreBreakdown.find(b => b.wuxing === wx)!
      lines.push(`    ${wx}：古籍支持分=${bd.classicScore.toFixed(4)}`)
    }
    lines.push('')

    lines.push('  Step 4 - Conflict 冲突检测与裁决：')
    if (conflictReport.totalConflicts === 0) {
      lines.push('    无引擎间冲突，决策一致性良好')
    } else {
      lines.push(`    检测到 ${conflictReport.totalConflicts} 处冲突，最大强度=${conflictReport.maxIntensity}`)
      for (const c of conflictReport.conflicts) {
        lines.push(`    ${c.wuxing}：${c.engineA}(${c.scoreA},${c.stanceA}) vs ${c.engineB}(${c.scoreB},${c.stanceB})`)
        lines.push(`      → 采用：${c.adoptionReason}`)
        lines.push(`      → 舍弃：${c.rejectionReason}`)
      }
    }
    lines.push('')

    lines.push('  Step 5 - FinalDecisionScore 最终综合评分：')
    for (const bd of scoreBreakdown) {
      lines.push(`    ${bd.wuxing}：`)
      lines.push(`      加权=${bd.weightedScore.toFixed(4)} + 投票=${bd.voteScore.toFixed(4)} + 古籍=${bd.classicScore.toFixed(4)} + 证据=${bd.evidenceScore.toFixed(4)} + 共识=${bd.consensusScore.toFixed(4)}`)
      lines.push(`      × 优先级=${bd.priorityFactor.toFixed(4)} - 冲突=${bd.conflictPenalty.toFixed(4)} = 最终=${bd.finalScore.toFixed(4)}`)
    }
    lines.push('')

    lines.push('三、决策回溯（DecisionTrace）：')
    lines.push('  每个五行的完整决策过程详见 decisionTraces 字段，包含：')
    lines.push('  - 各引擎评分贡献及 Evidence 引用')
    lines.push('  - Rule Voting 投票统计')
    lines.push('  - Classic Support 古籍支持度')
    lines.push('  - Conflict Penalty 冲突惩罚')
    lines.push('  - 最终综合分构成')
    lines.push('')

    lines.push('四、流派共识（School Consensus）：')
    lines.push(`  在 ${profile.name} 流派下，主用神 ${primary} 的跨流派共识度详见 schoolConsensus 字段`)
    lines.push('')

    return lines.join('\n')
  }
}

/** 辅助类型 */
interface SubEngineInstance {
  readonly name: string
  readonly version: string
  evaluate(input: SubEngineInput): SubEngineResult
}

// 让 7 个子引擎类满足 SubEngineInstance 接口
// （它们已经有 name/version/evaluate）

/** 全局默认实例（使用 ModernProfile） */
export const globalEvidenceFusionEngine = new EvidenceFusionDecisionEngine()

/** 创建指定流派的实例 */
export function createFusionEngine(profileKey: string): EvidenceFusionDecisionEngine {
  return new EvidenceFusionDecisionEngine(getSchoolProfile(profileKey))
}
