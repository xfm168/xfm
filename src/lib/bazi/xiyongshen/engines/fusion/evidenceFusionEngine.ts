/**
 * EvidenceFusionDecisionEngine V2 - 玄风门统一命理决策核心
 *
 * Unified Decision Core 架构：
 *   7 Evidence Engine
 *         ↓
 *   RulePriorityResolver（动态优先级矩阵 · 非固定Weight）
 *         ↓
 *   RuleGate（准入机制 · Confidence/Evidence/Classic/Applicable/Health 过滤）
 *         ↓
 *   RuleKill（淘汰 · 连续冲突/证据不足/置信度过低 退出Fusion）
 *         ↓
 *   RuleVoting V2（Weighted Voting · SupportLevel+Priority+Confidence+Classic+Evidence）
 *         ↓
 *   ConflictResolver V2（完整链路 Source→Evidence→Classic→Priority→Decision→Discard/Adopt）
 *         ↓
 *   MetaDecision（元决策 · 多用神/单用神 · 调候优先/扶抑优先/病药优先/通关优先/格局优先）
 *         ↓
 *   DecisionResult V2（含 PriorityMatrix/GateReport/KillReport/VotingSummary/Meta/EngineHealth/EvidenceTreeV2）
 *         ↓
 *   AI（禁止再次推理 · 仅润色 ExplainBuilder 输出）
 *
 * 未来：八字 / 紫微 / 奇门 / 六爻 / 风水 → 全部共用这一套
 */

import type { Wuxing } from '../../types'
import type { SubEngineInput, SubEngineResult } from '../types'
import type { ClassicEvidenceRef } from '../../../ruleEngine/types'
import type {
  DecisionResult, YongShenVerdict, SchoolProfile,
  FinalDecisionScoreBreakdown, EvidenceTree, EvidenceNode,
  ConflictReport, DecisionTrace, ClassicSupport, SchoolConsensus,
  RuleVoteSummary, YongShenRole, RulePriorityMatrix,
  GateReport, KillReport, MetaDecision, EngineHealthReport,
  MingjuPatternType,
} from './types'
import {
  StrengthEngine, PatternEngine, ClimateEngine, BalanceEngine,
  MedicineEngine, BridgeEngine, SeasonEngine,
} from '../index'
import { DEFAULT_SCHOOL, getSchoolProfile, getEngineWeight, getEnginePriority, getClassicWeight } from './schoolProfile'
import {
  calculateVoteScoreV2, getAllVoteSummariesV2,
} from './ruleVote'
import { buildConflictReport } from './conflictReport'
import { buildDecisionTrace } from './decisionTrace'
import { globalRulePriorityResolver } from './rulePriorityResolver'
import {
  globalRuleGate, globalRuleKill, globalMetaDecisionEngine,
} from './ruleGateAndMeta'
import {
  globalEngineHealthEvaluator, globalEvidenceTreeV2Builder, globalExplainBuilder,
} from './healthTreeExplain'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']

/**
 * DecisionResult Post Processor 钩子
 *
 * 用于 Sprint3-5 注入 AccuracyScore / ExplainScore / RuleBenchmark /
 * CaseSimilarity 等 DecisionResult V3 字段，避免 evidenceFusionEngine
 * 直接依赖 quality 模块造成循环依赖（accuracy.ts 会 import fusion 模块）。
 *
 * quality 模块初始化时注册 enricher，engine 每次 decide 结束后自动调用。
 */
export type DecisionResultPostProcessor = (ctx: {
  result: DecisionResult
  input: SubEngineInput
  subResults: SubEngineResult[]
}) => DecisionResult

const _postProcessors: DecisionResultPostProcessor[] = []

export function registerDecisionResultPostProcessor(fn: DecisionResultPostProcessor) {
  _postProcessors.push(fn)
}

/**
 * Evidence Fusion Decision Engine V2 - Unified Decision Core
 */
export class EvidenceFusionDecisionEngine {
  readonly name = 'EvidenceFusionDecisionEngine'
  readonly version = '3.5.0' // Sprint3-5 DecisionResult V3
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
   * 综合决策（Unified Decision Core 完整链路）
   */
  decide(input: SubEngineInput, profile?: SchoolProfile): DecisionResult {
    const activeProfile = profile ?? this.profile

    // ============================================================
    // Step 1: 调用所有子引擎，收集 Evidence
    // ============================================================
    const subResults: SubEngineResult[] = this.engines.map(e => e.evaluate(input))

    // ============================================================
    // Step 2: RulePriorityResolver → 动态优先级矩阵（非固定 Weight）
    // ============================================================
    const priorityMatrix: RulePriorityMatrix = globalRulePriorityResolver.resolve(
      input, subResults, activeProfile,
    )

    // ============================================================
    // Step 3: RuleGate → 准入机制（Confidence/Evidence/Classic/Applicable/Health 过滤）
    // ============================================================
    const gateReport: GateReport = globalRuleGate.checkAll(subResults, activeProfile)

    // ============================================================
    // Step 4: 早期 Conflict 检测（用于 RuleKill 的连续冲突判断）
    // ============================================================
    const conflictReportEarly: ConflictReport = buildConflictReport(
      subResults, activeProfile, priorityMatrix,
    )

    // ============================================================
    // Step 5: RuleKill → 淘汰（连续冲突/证据不足/置信度过低 退出Fusion）
    // ============================================================
    const killReport: KillReport = globalRuleKill.evaluateAll(
      subResults, conflictReportEarly.conflicts, activeProfile, gateReport,
    )

    // ============================================================
    // Step 6: RuleVoting V2 → Weighted Voting（基于 Gate 通过 + Kill 存活）
    // ============================================================
    const votingSummary: Record<Wuxing, RuleVoteSummary> = getAllVoteSummariesV2(
      subResults, activeProfile, priorityMatrix, gateReport, killReport,
    )

    // ============================================================
    // Step 7: MetaDecision（元决策 · 玄风门大脑）
    // ============================================================
    const metaDecision: MetaDecision = globalMetaDecisionEngine.decide(
      priorityMatrix.detectedPatterns as MingjuPatternType[],
      priorityMatrix, subResults, gateReport,
    )

    // ============================================================
    // Step 8: 正式 Conflict Report V2（含 RulePriority 完整链路裁决）
    // ============================================================
    const conflictReport: ConflictReport = buildConflictReport(
      subResults, activeProfile, priorityMatrix,
    )

    // ============================================================
    // Step 9: EngineHealth（引擎健康度评估）
    // ============================================================
    const engineHealth: EngineHealthReport = globalEngineHealthEvaluator.evaluate(
      subResults, gateReport, killReport, priorityMatrix, conflictReport,
    )

    // ============================================================
    // Step 10: 古籍支持度（按五行）
    // ============================================================
    const classicSupportMap = this.buildClassicSupportMap(subResults, activeProfile)

    // ============================================================
    // Step 11: 流派共识（按五行）
    // ============================================================
    const schoolConsensusMap = this.buildSchoolConsensusMap(input, subResults, activeProfile)

    // ============================================================
    // Step 12: FinalDecisionScore（每个五行，基于动态 Priority & 存活引擎）
    // ============================================================
    const scoreBreakdown = WUXING_LIST.map(wx => {
      const voteSummary = votingSummary[wx]
      const classicSupport = classicSupportMap[wx]
      const schoolConsensus = schoolConsensusMap[wx]

      // 12.1 加权评分（仅 Gate 通过 + Kill 存活的引擎 · 使用动态 priority 替代固定 weight）
      const weightedScore = this.calculateWeightedScoreV2(wx, subResults, priorityMatrix, gateReport, killReport, activeProfile)

      // 12.2 投票分 V2
      const { voteScore } = calculateVoteScoreV2(
        wx, subResults, activeProfile, priorityMatrix, gateReport, killReport,
      )

      // 12.3 古籍支持分
      const classicScore = classicSupport.supportScore * activeProfile.evidenceWeights.classicWeight

      // 12.4 证据完整度分
      const { totalEvidence, satisfiedEvidence } = this.computeEvidenceStats(subResults, gateReport)
      const evidenceCompleteness = totalEvidence > 0 ? satisfiedEvidence / totalEvidence : 0
      const evidenceScore = evidenceCompleteness * activeProfile.evidenceWeights.evidenceWeight

      // 12.5 流派共识分
      const consensusScore = schoolConsensus.consensusRate * activeProfile.evidenceWeights.consensusWeight

      // 12.6 规则优先级因子 V2（动态 Priority 加权）
      const priorityFactor = this.calculatePriorityFactorV2(wx, subResults, priorityMatrix, gateReport, killReport)

      // 12.7 冲突惩罚分（针对该五行）
      const conflictPenalty = this.calculateConflictPenalty(wx, conflictReport, activeProfile)

      // 12.8 MetaDecision 加持（若命局特征命中，主推荐五行额外加成）
      const metaBoost = this.computeMetaBoost(wx, metaDecision, subResults, priorityMatrix)

      // 12.9 最终综合分 = (加权 + 投票 + 古籍 + 证据 + 共识) × Priority × MetaBoost - 冲突惩罚
      const baseScore = weightedScore + voteScore + classicScore + evidenceScore + consensusScore
      const finalScore = Number(((baseScore * priorityFactor * metaBoost) - conflictPenalty).toFixed(4))

      return {
        wuxing: wx,
        weightedScore: Number(weightedScore.toFixed(4)),
        voteScore: Number(voteScore.toFixed(4)),
        classicScore: Number(classicScore.toFixed(4)),
        evidenceScore: Number(evidenceScore.toFixed(4)),
        consensusScore: Number(consensusScore.toFixed(4)),
        priorityFactor: Number(priorityFactor.toFixed(4)),
        metaBoost: Number(metaBoost.toFixed(4)),
        conflictPenalty: Number(conflictPenalty.toFixed(4)),
        finalScore,
      } as FinalDecisionScoreBreakdown
    })

    // ============================================================
    // Step 13: 确定用神（结合 MetaDecision 多用神策略）
    // ============================================================
    const sorted = [...scoreBreakdown].sort((a, b) => b.finalScore - a.finalScore)
    const top = sorted[0]
    const second = sorted[1]
    const third = sorted[2]
    const last = sorted[sorted.length - 1]
    const secondLast = sorted[sorted.length - 2]

    // 是否多用神：MetaDecision 指示 OR 评分接近
    const shouldUseMultiByMeta = metaDecision.shouldUseMultiYongShen
    const topCloseEnough =
      top.finalScore >= activeProfile.yongShenThreshold &&
      Math.abs(top.finalScore - second.finalScore) <= Math.max(activeProfile.multiYongShenThreshold, top.finalScore * 0.2) &&
      second.finalScore >= activeProfile.yongShenThreshold * 0.75
    const isMultiYongShen = shouldUseMultiByMeta || topCloseEnough

    const multiYongShenPattern = isMultiYongShen
      ? this.getMultiYongShenPattern(top.wuxing, second.wuxing, metaDecision)
      : undefined

    // ============================================================
    // Step 14: Verdict & DecisionTrace
    // ============================================================
    const verdicts: YongShenVerdict[] = WUXING_LIST.map(wx => {
      const breakdown = scoreBreakdown.find(b => b.wuxing === wx)!
      const voteSummary = votingSummary[wx]
      const classicSupport = classicSupportMap[wx]
      const trace = buildDecisionTrace(wx, subResults, breakdown, voteSummary, classicSupport, activeProfile)

      // 角色（结合 MetaDecision）
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

      const confidence = this.calculateElementConfidence(wx, voteSummary, classicSupport, evidenceCompletenessGlobal(subResults, gateReport), conflictReport)

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

    // ============================================================
    // Step 15: 用神结果
    // ============================================================
    const primaryYongShen = top.wuxing
    const secondaryYongShen: string = isMultiYongShen ? second.wuxing : ''
    const assistantGod = third.wuxing
    const avoidGod = last.wuxing
    const idleGod = isMultiYongShen
      ? sorted.find(s => s.wuxing !== top.wuxing && s.wuxing !== second.wuxing)?.wuxing ?? third.wuxing
      : sorted[2].wuxing

    // ============================================================
    // Step 16: 综合 Confidence
    // ============================================================
    const confidence = this.calculateOverallConfidence(
      primaryYongShen, subResults, gateReport, conflictReport, votingSummary, activeProfile, classicSupportMap, priorityMatrix,
    )

    // ============================================================
    // Step 17: EvidenceTree V2（先临时构造，稍后 ExplainBuilder 后再补全 root 标签）
    // ============================================================
    let evidenceTree: EvidenceTree = globalEvidenceTreeV2Builder.build(subResults, priorityMatrix, null)

    // ============================================================
    // Step 18: Strategy + Summary
    // ============================================================
    const strategy = this.buildStrategyV2(
      primaryYongShen, secondaryYongShen, assistantGod, avoidGod,
      isMultiYongShen, multiYongShenPattern, metaDecision, activeProfile,
    )
    const summary = this.buildSummary(
      primaryYongShen, secondaryYongShen, assistantGod, avoidGod, idleGod,
      isMultiYongShen, confidence.overall,
    )

    // ============================================================
    // Step 19: 组装 DecisionResult（先不含 explain）
    // ============================================================
    const result: DecisionResult = {
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

      // V2 新增模块
      priorityMatrix,
      gateReport,
      killReport,
      metaDecision,
      engineHealth,
      votingSummary,

      evidenceTree,
      decisionTraces: verdicts.map(v => v.trace),
      conflictReport,

      classicSupport: classicSupportMap,
      schoolConsensus: schoolConsensusMap,

      subEngineResults: subResults,

      explain: '', // 下一步填
      strategy,
      summary,
    }

    // ============================================================
    // Step 20: ExplainBuilder 自动生成自然语言（AI 仅润色，绝不重新推理）
    // ============================================================
    const explain = globalExplainBuilder.build({
      result,
      priorityMatrix,
      gateReport,
      killReport,
      metaDecision,
      scoreBreakdown,
      votingSummary,
      subResults,
      profile: activeProfile,
    })
    result.explain = explain

    // 再补一次 EvidenceTree 的根节点（带最终决策标签）
    evidenceTree = globalEvidenceTreeV2Builder.build(subResults, priorityMatrix, result)
    result.evidenceTree = evidenceTree

    // ============================================================
    // Step 21: DecisionResult V3 — Quality 字段注入（Post Processors）
    //   避免循环依赖：accuracy.ts 引用 fusion，因此 quality 侧注册 enricher
    // ============================================================
    result.version = '3.5.0' // Sprint3-5 Quality System
    let enriched: DecisionResult = result
    for (const fn of _postProcessors) {
      try {
        enriched = fn({ result: enriched, input, subResults })
      } catch (err) {
        // Post processor 错误不影响主决策流程
        console.warn('[DecisionResult V3] post-processor failed:', err)
      }
    }

    return enriched
  }

  // ============================================================
  // 私有辅助：加权评分 V2（仅存活引擎 · 动态 Priority）
  // ============================================================
  private calculateWeightedScoreV2(
    wuxing: Wuxing,
    subResults: SubEngineResult[],
    pm: RulePriorityMatrix,
    gate: GateReport,
    kill: KillReport,
    profile: SchoolProfile,
  ): number {
    let sum = 0
    for (const r of subResults) {
      // Gate 未通过 OR 被 Kill → 不参与加权（避免 0 分拉低平均）
      if (!gate.results[r.engineName]?.passed) continue
      if (kill.entries[r.engineName]?.killed) continue

      const score = r.scores[wuxing] ?? 0
      // 使用 RulePriorityMatrix 的动态 priority（而不是固定 weight）
      const priority = pm.byEngine[r.engineName]?.priority ?? getEngineWeight(profile, r.engineName)
      const confidence = r.confidence
      sum += score * priority * confidence
    }
    return sum * profile.evidenceWeights.scoreWeight
  }

  /** 规则优先级因子 V2（动态 Priority） */
  private calculatePriorityFactorV2(
    wuxing: Wuxing,
    subResults: SubEngineResult[],
    pm: RulePriorityMatrix,
    gate: GateReport,
    kill: KillReport,
  ): number {
    const supporting = subResults.filter(r =>
      gate.results[r.engineName]?.passed
      && !kill.entries[r.engineName]?.killed
      && (r.scores[wuxing] ?? 0) > 0,
    )
    if (supporting.length === 0) return 1.0

    // 按动态 priority 加权平均
    const weightedSum = supporting.reduce((s, r) => {
      const pri = pm.byEngine[r.engineName]?.priority ?? 0
      return s + pri * Math.abs(r.scores[wuxing] ?? 0)
    }, 0)
    const totalWeight = supporting.reduce((s, r) => s + (pm.byEngine[r.engineName]?.priority ?? 0), 0)
    const avgPriority = totalWeight > 0 ? weightedSum / totalWeight : 0.2

    // 归一化：avgPriority 理论范围 [0, 1] → factor [0.75, 1.30]
    return Number((0.75 + avgPriority * 0.55).toFixed(4))
  }

  /** MetaDecision 加持分（命中策略的引擎支持的五行有加成） */
  private computeMetaBoost(
    wx: Wuxing,
    md: MetaDecision,
    subResults: SubEngineResult[],
    pm: RulePriorityMatrix,
  ): number {
    let boost = 1.0
    // 调候优先：ClimateEngine/SeasonEngine 推荐的五行略微加分
    if (md.shouldPrioritizeClimate) {
      const climate = subResults.find(r => r.engineName === 'ClimateEngine')
      const season = subResults.find(r => r.engineName === 'SeasonEngine')
      const climateS = (climate?.scores[wx] ?? 0) * (pm.byEngine['ClimateEngine']?.priority ?? 0)
      const seasonS = (season?.scores[wx] ?? 0) * (pm.byEngine['SeasonEngine']?.priority ?? 0)
      if (climateS + seasonS > 0) boost += 0.06
    }
    // 扶抑优先：BalanceEngine 加分
    if (md.shouldPrioritizeBalance) {
      const bal = subResults.find(r => r.engineName === 'BalanceEngine')
      if ((bal?.scores[wx] ?? 0) > 0) boost += 0.05
    }
    // 病药优先：MedicineEngine 加分
    if (md.shouldPrioritizeMedicine) {
      const med = subResults.find(r => r.engineName === 'MedicineEngine')
      if ((med?.scores[wx] ?? 0) > 0) boost += 0.06
    }
    // 通关优先：BridgeEngine 加分
    if (md.shouldPrioritizeBridge) {
      const br = subResults.find(r => r.engineName === 'BridgeEngine')
      if ((br?.scores[wx] ?? 0) > 0) boost += 0.07
    }
    // 格局优先：PatternEngine 加分
    if (md.shouldPrioritizePattern) {
      const ptn = subResults.find(r => r.engineName === 'PatternEngine')
      if ((ptn?.scores[wx] ?? 0) > 0) boost += 0.06
    }
    return Number(boost.toFixed(4))
  }

  /** 冲突惩罚（针对某五行） */
  private calculateConflictPenalty(
    wuxing: Wuxing,
    conflictReport: ConflictReport,
    profile: SchoolProfile,
  ): number {
    const wxConflicts = conflictReport.conflicts.filter(c => c.wuxing === wuxing)
    if (wxConflicts.length === 0) return 0
    const totalIntensity = wxConflicts.reduce((sum, c) => sum + c.conflictIntensity, 0)
    return Number(Math.min(
      wxConflicts.length * profile.conflictPenaltyFactor * 0.5 + totalIntensity * 0.01,
      0.3,
    ).toFixed(4))
  }

  /** 构建古籍支持度 */
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
        if (score <= 0) continue
        for (const ce of r.classicEvidence) {
          const existing = classicsMap.get(ce.classicName)
          if (existing) existing.count++
          else classicsMap.set(ce.classicName, { ref: ce, count: 1 })
        }
      }
      const classics = [...classicsMap.entries()].map(([name, { ref, count }]) => ({ name, ref, count }))
      const totalRefCount = classics.reduce((s, c) => s + c.count, 0)
      const classicCount = classics.length
      const weightedSum = classics.reduce((s, c) => s + c.count * getClassicWeight(profile, c.name), 0)
      const maxPossible = 10
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

  /** 构建流派共识 */
  private buildSchoolConsensusMap(
    input: SubEngineInput,
    subResults: SubEngineResult[],
    activeProfile: SchoolProfile,
  ): Record<Wuxing, SchoolConsensus> {
    const schools = ['ziping', 'qiongtong', 'modern', 'balanced']
    const result = {} as Record<Wuxing, SchoolConsensus>
    const pm = globalRulePriorityResolver.resolve(input, subResults, activeProfile)
    const emptyGate = globalRuleGate.checkAll(subResults, activeProfile)
    const emptyKill = globalRuleKill.evaluateAll(subResults, [], activeProfile, emptyGate)
    for (const wx of WUXING_LIST) {
      const bySchool = schools.map(school => {
        const p = getSchoolProfile(school)
        const s = this.calculateWeightedScoreV2(wx, subResults, pm, emptyGate, emptyKill, p)
        return {
          school,
          score: Number(s.toFixed(4)),
          stance: s > 0 ? 'support' as const : s < 0 ? 'oppose' as const : 'neutral' as const,
        }
      })
      const scores = bySchool.map(s => s.score)
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length
      const variance = scores.reduce((s, sc) => s + (sc - mean) ** 2, 0) / scores.length
      const std = Math.sqrt(variance)
      const range = Math.max(...scores) - Math.min(...scores)
      const consensusRate = range > 0 ? 1 - std / range : 1
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

  /** 元素级 Confidence */
  private calculateElementConfidence(
    wuxing: Wuxing,
    voteSummary: RuleVoteSummary,
    classicSupport: ClassicSupport,
    evidenceCompleteness: number,
    conflictReport: ConflictReport,
  ): number {
    const voteConf = voteSummary.supportRate
    const classicConf = Math.min(classicSupport.supportScore, 1)
    const evidenceConf = evidenceCompleteness
    const conflictConf = 1 - Math.min(conflictReport.conflictPenalty * 1.5, 1)
    return Number(((voteConf + classicConf + evidenceConf + conflictConf) / 4).toFixed(4))
  }

  /** 综合 Confidence */
  private calculateOverallConfidence(
    primary: Wuxing,
    subResults: SubEngineResult[],
    gate: GateReport,
    conflictReport: ConflictReport,
    votingSummary: Record<Wuxing, RuleVoteSummary>,
    profile: SchoolProfile,
    classicSupportMap: Record<Wuxing, ClassicSupport>,
    pm: RulePriorityMatrix,
  ): {
    overall: number
    evidenceCoverage: number
    engineConsensus: number
    classicSupport: number
    schoolConsistency: number
    conflictPenalty: number
  } {
    const applicableCount = subResults.filter(r => r.applicable).length
    const passedCount = gate.passedCount
    const evidenceCoverage = Number((Math.min(passedCount / Math.max(applicableCount, 1), 1)).toFixed(4))

    const primaryVote = votingSummary[primary]
    const engineConsensus = Number(primaryVote.supportRate.toFixed(4))

    const primaryClassic = classicSupportMap[primary]
    const classicSupport = Number(primaryClassic.supportScore.toFixed(4))

    const schoolConsistency = this.buildSchoolConsensusMapLite(primary, subResults, profile, pm)

    const conflictPenalty = Number(Math.min(conflictReport.conflictPenalty, 1).toFixed(4))

    const overall = Number((
      evidenceCoverage * 0.2 +
      engineConsensus * 0.30 +
      classicSupport * 0.20 +
      schoolConsistency * 0.15 +
      (1 - conflictPenalty) * 0.15
    ).toFixed(4))

    return { overall, evidenceCoverage, engineConsensus, classicSupport, schoolConsistency, conflictPenalty }
  }

  /** 简化版：仅学校一致性 */
  private buildSchoolConsensusMapLite(
    primary: Wuxing,
    subResults: SubEngineResult[],
    activeProfile: SchoolProfile,
    pm: RulePriorityMatrix,
  ): number {
    const schools = ['ziping', 'qiongtong', 'modern', 'balanced']
    const emptyGate = globalRuleGate.checkAll(subResults, activeProfile)
    const emptyKill = globalRuleKill.evaluateAll(subResults, [], activeProfile, emptyGate)
    const scores = schools.map(s => {
      const p = getSchoolProfile(s)
      return this.calculateWeightedScoreV2(primary, subResults, pm, emptyGate, emptyKill, p)
    })
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const variance = scores.reduce((s, sc) => s + (sc - mean) ** 2, 0) / scores.length
    const std = Math.sqrt(variance)
    const range = Math.max(...scores) - Math.min(...scores)
    return Number((range > 0 ? Math.max(0, 1 - std / range) : 1).toFixed(4))
  }

  /** Evidence 全局统计 */
  private computeEvidenceStats(subResults: SubEngineResult[], gate: GateReport): { totalEvidence: number; satisfiedEvidence: number } {
    const passed = subResults.filter(r => gate.results[r.engineName]?.passed)
    const totalEvidence = passed.reduce((s, r) => s + r.evidence.length, 0)
    const satisfiedEvidence = passed.reduce((s, r) => s + r.evidence.filter(e => e.satisfied).length, 0)
    return { totalEvidence, satisfiedEvidence }
  }

  /** 多用神模式名称（结合 MetaDecision） */
  private getMultiYongShenPattern(a: Wuxing, b: Wuxing, md: MetaDecision): string {
    // 命局特征优先
    if (md.multiYongShenMode === 'bridge_use') return `${a}${b}并用（通关调和）`
    if (md.multiYongShenMode === 'climate_assist') return `${a}${b}并用（调候+辅助）`
    if (md.multiYongShenMode === 'dual_image') return `${a}${b}两神成象`
    if (md.multiYongShenMode === 'mutual_generation') return `${a}${b}相生并用`
    // 经典组合表
    const patterns: Record<string, string> = {
      '木-火': '木火同用（木火通明）', '火-木': '木火同用（木火通明）',
      '火-土': '火土并用', '土-火': '火土并用',
      '土-金': '土金并用', '金-土': '土金并用',
      '金-水': '金水两神成象', '水-金': '金水两神成象',
      '水-木': '水木同用', '木-水': '水木同用',
    }
    const key = `${a}-${b}`
    return patterns[key] ?? `${a}${b}并用`
  }

  /** 策略文本 V2（包含 MetaDecision 信息） */
  private buildStrategyV2(
    primary: Wuxing, secondary: Wuxing | undefined, assistant: Wuxing, avoid: Wuxing,
    isMulti: boolean, pattern: string | undefined,
    md: MetaDecision, profile: SchoolProfile,
  ): string {
    const strategies: string[] = []
    if (md.shouldPrioritizeClimate) strategies.push('调候优先')
    if (md.shouldPrioritizeBalance) strategies.push('扶抑优先')
    if (md.shouldPrioritizePattern) strategies.push('格局优先')
    if (md.shouldPrioritizeMedicine) strategies.push('病药优先')
    if (md.shouldPrioritizeBridge) strategies.push('通关优先')
    const strat = strategies.length > 0 ? strategies.join('·') : '综合权衡'

    if (isMulti && secondary) {
      return `【${strat}】以${primary}${secondary}并用为用（${pattern ?? '多用神'}），佐${assistant}，避${avoid}。流派：${profile.name}。命局特征：${md.strategyBasis.join('+')}`
    }
    return `【${strat}】以${primary}为用，佐${assistant}，避${avoid}。流派：${profile.name}。命局特征：${md.strategyBasis.join('+')}`
  }

  /** 摘要 */
  private buildSummary(
    primary: Wuxing, secondary: Wuxing | undefined, assistant: Wuxing,
    avoid: Wuxing, idle: Wuxing, isMulti: boolean, confidence: number,
  ): string {
    const yongShenPart = isMulti && secondary
      ? `用神=${primary}${secondary}并用`
      : `用神=${primary}`
    return `${yongShenPart} 喜神=${assistant} 忌神=${avoid} 闲神=${idle} confidence=${confidence.toFixed(2)}`
  }
}

/** 子引擎实例类型 */
interface SubEngineInstance {
  readonly name: string
  readonly version: string
  evaluate(input: SubEngineInput): SubEngineResult
}

/** 全局辅助函数：evidence 完整度 */
function evidenceCompletenessGlobal(subResults: SubEngineResult[], gate: GateReport): number {
  const passed = subResults.filter(r => gate.results[r.engineName]?.passed)
  const total = passed.reduce((s, r) => s + r.evidence.length, 0)
  const satisfied = passed.reduce((s, r) => s + r.evidence.filter(e => e.satisfied).length, 0)
  return total > 0 ? satisfied / total : 0
}

/** 全局默认实例（ModernProfile） */
export const globalEvidenceFusionEngine = new EvidenceFusionDecisionEngine()

/** 创建指定流派的实例 */
export function createFusionEngine(profileKey: string): EvidenceFusionDecisionEngine {
  return new EvidenceFusionDecisionEngine(getSchoolProfile(profileKey))
}

// 避免 unused 警告
export type { EvidenceNode }
