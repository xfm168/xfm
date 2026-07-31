/**
 * RuleGate + RuleKill - 规则准入与淘汰机制
 *
 * RuleGate（准入）：不是所有 Engine 都应该参与 Fusion
 *   Applicable=false / Confidence<0.21 / Evidence<3 / Classic=0
 *   → Gate Reject，保留 Trace + Evidence，但不参与最终决策（不要 0 分参与平均）
 *
 * RuleKill（淘汰）：低质量 Engine 直接退出本轮 Fusion
 *   连续冲突 / Evidence不足 / Confidence过低
 *   → Kill，避免污染最终结果
 */

import type { Wuxing } from '../../types'
import type { SubEngineResult } from '../types'
import type {
  GateReport, GateResult, GateCheckDimension,
  KillReport, KillEntry, KillReasonType,
  RulePriorityMatrix, SchoolProfile, EngineConflictV2,
} from './types'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']

/** 默认 Gate 阈值（可通过 SchoolProfile 扩展） */
const DEFAULT_GATE_THRESHOLDS = {
  minConfidence: 0.25,
  minEvidenceCount: 1,
  minClassicCount: 0,
  requireApplicable: true,
  minEngineHealth: 0.4,
}

/** 默认 Kill 阈值 */
const DEFAULT_KILL_THRESHOLDS = {
  maxContinuousConflicts: 3,
  minEvidenceBeforeKill: 0,
  minConfidenceBeforeKill: 0.10,
}

// ============================================================
// RuleGate：规则准入
// ============================================================

export class RuleGate {
  /**
   * 对所有子引擎做 Gate 检查，产出 GateReport
   */
  checkAll(
    subResults: SubEngineResult[],
    profile: SchoolProfile,
    overrides?: Partial<typeof DEFAULT_GATE_THRESHOLDS>,
  ): GateReport {
    const thresholds = { ...DEFAULT_GATE_THRESHOLDS, ...overrides }

    const results: Record<string, GateResult> = {}
    let passedCount = 0

    for (const r of subResults) {
      const result = this.checkOne(r, thresholds)
      results[r.engineName] = result
      if (result.passed) passedCount++
    }

    const totalEngines = subResults.length
    const rejectedCount = totalEngines - passedCount

    const summary = passedCount === totalEngines
      ? `全部 ${totalEngines} 个引擎通过 Rule Gate 准入`
      : `${passedCount}/${totalEngines} 个引擎通过 Rule Gate，${rejectedCount} 个被拒绝（保留 Evidence Trace 但不参与 Fusion）`

    return {
      totalEngines,
      passedCount,
      rejectedCount,
      passRate: totalEngines > 0 ? Number((passedCount / totalEngines).toFixed(4)) : 0,
      results,
      thresholds,
      summary,
    }
  }

  /** 对单个引擎做 Gate 检查 */
  private checkOne(
    r: SubEngineResult,
    th: typeof DEFAULT_GATE_THRESHOLDS,
  ): GateResult {
    const evidenceCount = r.evidence.length
    const satisfiedCount = r.evidence.filter(e => e.satisfied).length
    const classicCount = r.classicEvidence.length
    const applicable = r.applicable ? 1 : 0
    const confidence = r.confidence
    // health 暂时通过 confidence + evidence 估算
    const engineHealth = Number(((confidence * 0.6) + (Math.min(satisfiedCount / 5, 1) * 0.4)).toFixed(4))

    const applicableCheck: GateCheckDimension = {
      name: 'applicable',
      value: applicable,
      threshold: th.requireApplicable ? 1 : 0,
      passed: th.requireApplicable ? r.applicable : true,
      description: r.applicable ? '引擎适用' : `引擎不适用：${r.skipReason ?? '未知原因'}`,
    }
    const confidenceCheck: GateCheckDimension = {
      name: 'confidence',
      value: Number(confidence.toFixed(4)),
      threshold: th.minConfidence,
      passed: confidence >= th.minConfidence,
      description: `置信度 ${confidence.toFixed(4)} ${confidence >= th.minConfidence ? '≥' : '<'} 阈值 ${th.minConfidence}`,
    }
    const evidenceCountCheck: GateCheckDimension = {
      name: 'evidenceCount',
      value: satisfiedCount,
      threshold: th.minEvidenceCount,
      passed: satisfiedCount >= th.minEvidenceCount,
      description: `满足 Evidence 数=${satisfiedCount}（总 ${evidenceCount}） ${satisfiedCount >= th.minEvidenceCount ? '≥' : '<'} 阈值 ${th.minEvidenceCount}`,
    }
    const classicCountCheck: GateCheckDimension = {
      name: 'classicCount',
      value: classicCount,
      threshold: th.minClassicCount,
      passed: classicCount >= th.minClassicCount,
      description: `古籍引用数=${classicCount} ${classicCount >= th.minClassicCount ? '≥' : '<'} 阈值 ${th.minClassicCount}`,
    }
    const engineHealthCheck: GateCheckDimension = {
      name: 'engineHealth',
      value: engineHealth,
      threshold: th.minEngineHealth,
      passed: engineHealth >= th.minEngineHealth,
      description: `引擎健康度=${engineHealth.toFixed(4)} ${engineHealth >= th.minEngineHealth ? '≥' : '<'} 阈值 ${th.minEngineHealth}`,
    }

    const allPassed =
      applicableCheck.passed &&
      confidenceCheck.passed &&
      evidenceCountCheck.passed &&
      classicCountCheck.passed &&
      engineHealthCheck.passed

    // 找第一个失败的维度作为 rejectReason
    let rejectReason: string | undefined
    if (!allPassed) {
      const failed = [applicableCheck, confidenceCheck, evidenceCountCheck, classicCountCheck, engineHealthCheck]
        .find(c => !c.passed)
      rejectReason = failed ? `[${failed.name}] ${failed.description}` : undefined
    }

    return {
      engineName: r.engineName,
      passed: allPassed,
      rejectReason,
      checks: {
        applicable: applicableCheck,
        confidence: confidenceCheck,
        evidenceCount: evidenceCountCheck,
        classicCount: classicCountCheck,
        engineHealth: engineHealthCheck,
      },
      // 即使未通过 Gate，也保留 Trace（保留 Evidence 供展示）
      traceKept: true,
    }
  }

  /** 快速获取通过 Gate 的引擎列表 */
  getPassedEngines(gate: GateReport, subResults: SubEngineResult[]): SubEngineResult[] {
    return subResults.filter(r => gate.results[r.engineName]?.passed)
  }
}

// ============================================================
// RuleKill：规则淘汰（比 Gate 更严厉，本轮 Fusion 中直接排除）
// ============================================================

export class RuleKill {
  /**
   * 根据引擎表现 + Conflict 情况，决定哪些引擎被 Kill（退出本轮 Fusion）
   */
  evaluateAll(
    subResults: SubEngineResult[],
    conflicts: EngineConflictV2[],
    profile: SchoolProfile,
    gate: GateReport,
    overrides?: Partial<typeof DEFAULT_KILL_THRESHOLDS>,
  ): KillReport {
    const thresholds = { ...DEFAULT_KILL_THRESHOLDS, ...overrides }

    const entries: Record<string, KillEntry> = {}
    let killedCount = 0

    // 统计每个引擎的冲突次数
    const conflictCounts: Record<string, number> = {}
    for (const c of conflicts) {
      conflictCounts[c.engineA] = (conflictCounts[c.engineA] ?? 0) + 1
      conflictCounts[c.engineB] = (conflictCounts[c.engineB] ?? 0) + 1
    }

    for (const r of subResults) {
      const entry = this.evaluateOne(r, conflictCounts[r.engineName] ?? 0, thresholds, gate)
      entries[r.engineName] = entry
      if (entry.killed) killedCount++
    }

    const totalEngines = subResults.length
    const aliveCount = totalEngines - killedCount

    const summary = killedCount === 0
      ? `Rule Kill：全部 ${totalEngines} 个引擎存活，无淘汰`
      : `Rule Kill：${killedCount}/${totalEngines} 个引擎被淘汰（退出本轮 Fusion 避免污染结果），${aliveCount} 个存活`

    return {
      totalEngines,
      killedCount,
      aliveCount,
      entries,
      thresholds,
      summary,
    }
  }

  /** 评估单个引擎是否被 Kill */
  private evaluateOne(
    r: SubEngineResult,
    conflictCount: number,
    th: typeof DEFAULT_KILL_THRESHOLDS,
    gate: GateReport,
  ): KillEntry {
    const engineName = r.engineName
    const satisfiedCount = r.evidence.filter(e => e.satisfied).length
    const classicCount = r.classicEvidence.length

    // 1. 连续冲突（与其他引擎连续冲突 ≥ maxContinuousConflicts）
    if (conflictCount >= th.maxContinuousConflicts) {
      return {
        engineName,
        killed: true,
        killReason: 'conflict_chain',
        killDescription: `该引擎与其他引擎发生 ${conflictCount} 次冲突（≥阈值 ${th.maxContinuousConflicts}），观点反复无常，本轮淘汰`,
        triggerValue: conflictCount,
        killThreshold: th.maxContinuousConflicts,
        lastScoresSnapshot: { ...r.scores },
      }
    }

    // 2. Evidence 严重不足（Gate 已 failed 且 Evidence 0）
    if (satisfiedCount <= th.minEvidenceBeforeKill && !gate.results[engineName]?.passed) {
      return {
        engineName,
        killed: true,
        killReason: 'evidence_insufficient',
        killDescription: `满足的 Evidence 仅 ${satisfiedCount} 条（≤阈值 ${th.minEvidenceBeforeKill}），且未通过 Gate，本轮淘汰`,
        triggerValue: satisfiedCount,
        killThreshold: th.minEvidenceBeforeKill,
        lastScoresSnapshot: { ...r.scores },
      }
    }

    // 3. 置信度过低
    if (r.confidence < th.minConfidenceBeforeKill) {
      return {
        engineName,
        killed: true,
        killReason: 'confidence_too_low',
        killDescription: `置信度 ${r.confidence.toFixed(4)} < 阈值 ${th.minConfidenceBeforeKill}，判断质量过低，本轮淘汰`,
        triggerValue: Number(r.confidence.toFixed(4)),
        killThreshold: th.minConfidenceBeforeKill,
        lastScoresSnapshot: { ...r.scores },
      }
    }

    // 4. 古籍完全无引用 + 低 confidence（联合触发）
    if (classicCount === 0 && r.confidence < 0.30) {
      return {
        engineName,
        killed: true,
        killReason: 'classic_empty',
        killDescription: `无任何古籍引用且置信度仅 ${r.confidence.toFixed(4)}，缺乏经典依据，本轮淘汰`,
        triggerValue: classicCount,
        killThreshold: 0,
        lastScoresSnapshot: { ...r.scores },
      }
    }

    return {
      engineName,
      killed: false,
    }
  }

  /** 快速获取存活引擎（Gate 通过 + Kill 未命中） */
  getAliveEngines(
    gate: GateReport,
    kill: KillReport,
    subResults: SubEngineResult[],
  ): SubEngineResult[] {
    return subResults.filter(r =>
      gate.results[r.engineName]?.passed && !kill.entries[r.engineName]?.killed,
    )
  }
}

// ============================================================
// MetaDecision：元决策层 - 玄风门大脑
// ============================================================

import type {
  MetaDecision, DecisionStrategy, MultiYongShenMode, MingjuPatternType,
} from './types'

export class MetaDecisionEngine {
  /**
   * 基于命局特征 + RulePriorityMatrix + 引擎评分分布，产出 MetaDecision
   * - 是否多用神 / 单用神
   * - 格局优先 / 调候优先 / 扶抑优先 / 病药优先 / 通关优先
   */
  decide(
    patterns: MingjuPatternType[],
    priorityMatrix: RulePriorityMatrix,
    subResults: SubEngineResult[],
    gate: GateReport,
  ): MetaDecision {
    // Step 1: 基于命局特征 → 候选策略评分
    const candidates = this.scoreCandidates(patterns, priorityMatrix, subResults)
    // 取分最高的为主策略
    const sortedCandidates = [...candidates].sort((a, b) => b.score - a.score)
    const primaryStrategy = sortedCandidates[0].strategy
    // 次策略：主策略之外且 score >= 0.6 * 主策略分 的
    const secondaryStrategies = sortedCandidates
      .slice(1)
      .filter(s => s.score >= sortedCandidates[0].score * 0.6)
      .map(s => s.strategy)

    // Step 2: 是否多用神
    const { shouldUseMulti, mode } = this.determineMultiYongShen(patterns, subResults)

    // Step 3: 六个优先开关
    const shouldPrioritizePattern = this.isStrategyInTop('pattern_first', primaryStrategy, secondaryStrategies, patterns, ['special_pattern'])
    const shouldPrioritizeClimate = this.isStrategyInTop('climate_first', primaryStrategy, secondaryStrategies, patterns, ['winter_fire', 'summer_water'])
    const shouldPrioritizeBalance = this.isStrategyInTop('balance_first', primaryStrategy, secondaryStrategies, patterns, ['extreme_strong', 'extreme_weak'])
    const shouldPrioritizeMedicine = this.isStrategyInTop('medicine_first', primaryStrategy, secondaryStrategies, patterns, ['medicine_pattern'])
    const shouldPrioritizeBridge = this.isStrategyInTop('bridge_first', primaryStrategy, secondaryStrategies, patterns, ['bridge_war'])

    // Step 4: 主策略文本说明
    const strategyExplanation = this.buildStrategyExplanation(
      primaryStrategy, patterns, shouldUseMulti, mode,
    )

    return {
      primaryStrategy,
      secondaryStrategies,
      multiYongShenMode: shouldUseMulti ? mode : undefined,
      shouldUseMultiYongShen: shouldUseMulti,
      shouldPrioritizePattern,
      shouldPrioritizeClimate,
      shouldPrioritizeBalance,
      shouldPrioritizeMedicine,
      shouldPrioritizeBridge,
      maxYongShenCount: shouldUseMulti ? 2 : 1,
      allowCombinedUse: shouldUseMulti,
      strategyBasis: patterns,
      strategyExplanation,
      strategyCandidates: candidates,
    }
  }

  /** 八大决策策略候选评分 */
  private scoreCandidates(
    patterns: MingjuPatternType[],
    priorityMatrix: RulePriorityMatrix,
    subResults: SubEngineResult[],
  ): Array<{ strategy: DecisionStrategy; score: number; reason: string }> {
    const hasP = (p: MingjuPatternType) => patterns.includes(p)
    const by = priorityMatrix.byEngine

    const candidates: Array<{ strategy: DecisionStrategy; score: number; reason: string }> = []

    // 1. climate_first
    {
      const score = this.s(
        hasP('winter_fire') * 1.0 +
        hasP('summer_water') * 1.0 +
        (by['ClimateEngine']?.priority ?? 0) * 4.0 +
        (by['SeasonEngine']?.priority ?? 0) * 3.5,
      )
      candidates.push({
        strategy: 'climate_first',
        score,
        reason: score > 0.4
          ? `调候优先级高：Climate/Season 引擎 priority=${(by['ClimateEngine']?.priority ?? 0).toFixed(3)}/${(by['SeasonEngine']?.priority ?? 0).toFixed(3)}，命局特征=${patterns.filter(p => ['winter_fire', 'summer_water'].includes(p)).join(',')}`
          : '调候非第一优先',
      })
    }

    // 2. balance_first
    {
      const score = this.s(
        hasP('extreme_strong') * 1.0 +
        hasP('extreme_weak') * 1.0 +
        (by['BalanceEngine']?.priority ?? 0) * 4.0,
      )
      candidates.push({
        strategy: 'balance_first',
        score,
        reason: score > 0.4
          ? `扶抑优先级高：Balance 引擎 priority=${(by['BalanceEngine']?.priority ?? 0).toFixed(3)}，命局特征=${patterns.filter(p => ['extreme_strong', 'extreme_weak'].includes(p)).join(',')}`
          : '扶抑非第一优先',
      })
    }

    // 3. pattern_first
    {
      const score = this.s(
        hasP('special_pattern') * 1.1 +
        (by['PatternEngine']?.priority ?? 0) * 4.0,
      )
      candidates.push({
        strategy: 'pattern_first',
        score,
        reason: score > 0.4
          ? `格局优先级高：Pattern 引擎 priority=${(by['PatternEngine']?.priority ?? 0).toFixed(3)}，命局特征=${hasP('special_pattern') ? '特殊格局' : '普通'}`
          : '格局非第一优先',
      })
    }

    // 4. medicine_first
    {
      const score = this.s(
        hasP('medicine_pattern') * 1.1 +
        (by['MedicineEngine']?.priority ?? 0) * 4.0,
      )
      candidates.push({
        strategy: 'medicine_first',
        score,
        reason: score > 0.4
          ? `病药优先级高：Medicine 引擎 priority=${(by['MedicineEngine']?.priority ?? 0).toFixed(3)}，命局特征=${hasP('medicine_pattern') ? '病药格' : '普通'}`
          : '病药非第一优先',
      })
    }

    // 5. bridge_first
    {
      const score = this.s(
        hasP('bridge_war') * 1.2 +
        (by['BridgeEngine']?.priority ?? 0) * 4.0,
      )
      candidates.push({
        strategy: 'bridge_first',
        score,
        reason: score > 0.4
          ? `通关优先级高：Bridge 引擎 priority=${(by['BridgeEngine']?.priority ?? 0).toFixed(3)}，命局特征=${hasP('bridge_war') ? '两神交战' : '普通'}`
          : '通关非第一优先',
      })
    }

    // 6. season_first
    {
      const score = this.s(
        (by['SeasonEngine']?.priority ?? 0) * 3.8,
      )
      candidates.push({
        strategy: 'season_first',
        score,
        reason: score > 0.3
          ? `寒暖燥湿 priority=${(by['SeasonEngine']?.priority ?? 0).toFixed(3)}`
          : '寒暖燥湿非第一优先',
      })
    }

    // 7. multi_yongshen（多用神策略）
    {
      // 通过看 Top 2 五行的评分差距判断
      const topDiffs = this.assessMultiYongShenLikelihood(subResults)
      const score = this.s(topDiffs.score)
      candidates.push({
        strategy: 'multi_yongshen',
        score,
        reason: topDiffs.reason,
      })
    }

    // 8. comprehensive（综合权衡 - 默认候选，保证有一兜底策略）
    {
      const base = hasP('balanced') ? 0.7 : 0.4
      const score = this.s(base)
      candidates.push({
        strategy: 'comprehensive',
        score,
        reason: hasP('balanced')
          ? '中和命局：七路均衡，综合权衡'
          : '作为兜底综合策略',
      })
    }

    return candidates
  }

  /** 评估多用神可能性（返回 0~1 分数和原因） */
  private assessMultiYongShenLikelihood(subResults: SubEngineResult[]): { score: number; reason: string } {
    // 聚合各引擎对五行的评分（取绝对值和加权和，简单版本）
    const aggregate = new Map<Wuxing, number>()
    for (const wx of WUXING_LIST) aggregate.set(wx, 0)

    for (const r of subResults) {
      if (!r.applicable) continue
      for (const wx of WUXING_LIST) {
        const s = r.scores[wx] ?? 0
        if (s > 0) {
          aggregate.set(wx, (aggregate.get(wx) ?? 0) + s * r.weight * r.confidence)
        }
      }
    }

    const sorted = [...aggregate.entries()].sort((a, b) => b[1] - a[1])
    const top = sorted[0]?.[1] ?? 0
    const second = sorted[1]?.[1] ?? 0
    const third = sorted[2]?.[1] ?? 0

    if (top <= 0) return { score: 0.1, reason: '五行评分全为负/零，难分主次' }

    const ratio = second / top
    const diff = top - second

    // Top 2 比值 ≥ 0.75 且差值较小 → 多用神
    if (ratio >= 0.75 && diff <= top * 0.3) {
      return {
        score: 0.82,
        reason: `Top2 五行[${sorted[0]?.[0]}/${sorted[1]?.[0]}]评分接近：top=${top.toFixed(2)} second=${second.toFixed(2)} ratio=${ratio.toFixed(2)}，建议多用神`,
      }
    }
    // Top 3 接近 → 也考虑
    if (third / top >= 0.6 && second / top >= 0.7) {
      return {
        score: 0.68,
        reason: `前三五行评分接近[${sorted[0]?.[0]}/${sorted[1]?.[0]}/${sorted[2]?.[0]}]，倾向多用神`,
      }
    }
    return {
      score: 0.25,
      reason: `主五行[${sorted[0]?.[0]}]得分明显领先（top=${top.toFixed(2)} vs second=${second.toFixed(2)}，ratio=${ratio.toFixed(2)}），建议单用神`,
    }
  }

  /** 实际判定 shouldUseMultiYongShen + MultiYongShenMode */
  private determineMultiYongShen(
    patterns: MingjuPatternType[],
    subResults: SubEngineResult[],
  ): { shouldUseMulti: boolean; mode?: MultiYongShenMode } {
    const { score, reason } = this.assessMultiYongShenLikelihood(subResults)

    // 聚合评分，找 Top 2 五行
    const aggregate = new Map<Wuxing, number>()
    for (const wx of WUXING_LIST) aggregate.set(wx, 0)
    for (const r of subResults) {
      if (!r.applicable) continue
      for (const wx of WUXING_LIST) {
        const s = r.scores[wx] ?? 0
        if (s > 0) aggregate.set(wx, (aggregate.get(wx) ?? 0) + s)
      }
    }
    const sorted = [...aggregate.entries()].sort((a, b) => b[1] - a[1])
    const topWx = sorted[0]?.[0] as Wuxing
    const secWx = sorted[1]?.[0] as Wuxing

    if (score < 0.55) return { shouldUseMulti: false }

    // 判定 mode
    let mode: MultiYongShenMode = 'combined_use'
    if (patterns.includes('bridge_war')) {
      mode = 'bridge_use'
    } else if (patterns.includes('winter_fire') || patterns.includes('summer_water')) {
      mode = 'climate_assist'
    } else {
      // 根据五行关系判断
      const relationMap: Record<string, MultiYongShenMode> = {
        '木火': 'mutual_generation', '火土': 'mutual_generation',
        '土金': 'mutual_generation', '金水': 'dual_image',
        '水木': 'mutual_generation', '火木': 'mutual_generation',
        '土火': 'mutual_generation', '金土': 'mutual_generation',
        '水金': 'dual_image', '木水': 'mutual_generation',
      }
      mode = relationMap[`${topWx}${secWx}`] ?? 'combined_use'
    }

    return { shouldUseMulti: true, mode }
  }

  /** 主策略是否属于优先列表 */
  private isStrategyInTop(
    strategy: DecisionStrategy,
    primary: DecisionStrategy,
    secondary: DecisionStrategy[],
    patterns: MingjuPatternType[],
    triggerPatterns: MingjuPatternType[],
  ): boolean {
    if (primary === strategy) return true
    if (secondary.includes(strategy)) return true
    return triggerPatterns.some(p => patterns.includes(p))
  }

  /** 构建元决策说明文本 */
  private buildStrategyExplanation(
    primary: DecisionStrategy,
    patterns: MingjuPatternType[],
    shouldUseMulti: boolean,
    mode?: MultiYongShenMode,
  ): string {
    const strategyMap: Record<DecisionStrategy, string> = {
      climate_first: '调候优先：先调气候，后论扶抑格局',
      balance_first: '扶抑优先：日主强弱为首务，克泄耗或生扶',
      pattern_first: '格局优先：以月令取格，成格破格定用神',
      medicine_first: '病药优先：有病则有药，药到病除为用',
      bridge_first: '通关优先：两神交战，以通关调和为急',
      season_first: '寒暖燥湿优先：季节平衡为要',
      multi_yongshen: '多用神策略：数神并用，不可偏废',
      single_yongshen: '单用神策略：一神定乾坤',
      comprehensive: '综合权衡：七路并举，全面考量',
    }
    const modeMap: Record<MultiYongShenMode, string> = {
      combined_use: '并用模式',
      dual_image: '两神成象模式',
      mutual_generation: '相生并用模式',
      bridge_use: '通关并用模式',
      climate_assist: '调候+辅助并用模式',
    }
    const base = `元决策：采用【${strategyMap[primary]}】`
    const multiPart = shouldUseMulti
      ? `；多用神=${mode ? modeMap[mode] : '并用'}`
      : '；单用神为主'
    const patternPart = patterns.length > 0
      ? `；命局特征：${patterns.join(' + ')}`
      : ''
    return `${base}${multiPart}${patternPart}`
  }

  /** 归一化辅助：压缩到 [0,1]，上限 3 对应 1.0 */
  private s(raw: number): number {
    return Number(Math.min(raw / 3.0, 1.0).toFixed(4))
  }
}

/** 全局默认实例 */
export const globalRuleGate = new RuleGate()
export const globalRuleKill = new RuleKill()
export const globalMetaDecisionEngine = new MetaDecisionEngine()
