/**
 * Sprint3-5 阶段①⑤⑥：AccuracyCenter + RuleBenchmark + SchoolBenchmark
 *
 * 每一次推演后自动计算：
 *  ① Rule Accuracy   — 每条规则命中/误判/贡献
 *  ② Engine Accuracy — 每个引擎与最终决策一致率
 *  ③ Decision Accuracy — 当前命局自评估（Confidence + 内部一致 + 古籍一致 + 流派一致）
 *  ⑤ RuleBenchmark   — 规则价值评估（命中率/误判率/冲突率/贡献/淘汰）
 *  ⑥ SchoolBenchmark — 八大流派准确率排名
 *
 * 以后每次改代码：立刻知道是提高了准确率 OR 降低了准确率
 */

import type { Wuxing } from '../../types'
import type { SubEngineResult } from '../types'
import type { DecisionResult } from '../engines/fusion/types'
import type { Rule } from '../../../ruleEngine/types'
import type {
  RuleAccuracy, EngineAccuracy, DecisionAccuracy, AccuracyReport,
  RuleBenchmarkEntry, RuleBenchmarkReport,
  SchoolBenchmarkEntry, SchoolBenchmarkReport,
  BaziCase,
} from './types'
import {
  SCHOOL_PROFILES, EvidenceFusionDecisionEngine,
} from '../engines/fusion'
import { getSchoolProfile, getEngineWeight } from '../engines/fusion/schoolProfile'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']
const SAMPLE_ENGINE_NAMES = [
  'StrengthEngine', 'PatternEngine', 'ClimateEngine', 'BalanceEngine',
  'MedicineEngine', 'BridgeEngine', 'SeasonEngine',
] as const

// ============================================================
// ① AccuracyCenter 核心逻辑
// ============================================================

export class AccuracyCenter {
  /** 累计评估的命例数（用于 RuleBenchmark 统计样本） */
  private _totalCases = 0
  /** 每条规则的累计统计（运行中聚合，可持久化） */
  private _ruleStats: Record<string, {
    run: number; hit: number; misjudge: number; contribution: number;
    conflict: number; citation: number; kill: number;
  }> = {}
  /** 每个引擎的累计统计 */
  private _engineStats: Record<string, {
    run: number; primaryHit: number; assistantHit: number; avoidHit: number;
    agreement: number;
  }> = {}

  /** 对单命例进行一次评估（DecisionResult + 子引擎结果） */
  evaluate(
    result: DecisionResult,
    subResults: SubEngineResult[],
    executedRules?: Rule[],
    groundTruth?: Pick<BaziCase['groundTruth'], 'primaryYongShen' | 'assistantGod' | 'avoidGod'>,
  ): AccuracyReport {
    this._totalCases += 1

    // 1) Rule Level 准确率
    const ruleAccuracy: Record<string, RuleAccuracy> = {}
    if (executedRules && executedRules.length) {
      for (const rule of executedRules) {
        const id = rule.id
        const agg = this._ruleStats[id] ??= { run: 0, hit: 0, misjudge: 0, contribution: 0, conflict: 0, citation: 0, kill: 0 }
        agg.run += 1

        // 命中率：规则 result 建议的五行 ∈ 最终 primary/assistant → 命中
        let hit = 0
        let misjudge = 0
        let contrib = 0
        const supportedWuxing = extractRuleSupportedWuxing(rule)
        if (supportedWuxing.length) {
          const primaryHit = supportedWuxing.includes(result.primaryYongShen)
          const assistantHit = result.assistantGod && supportedWuxing.includes(result.assistantGod)
          const hitAny = primaryHit || assistantHit
          if (hitAny) { hit = 1; contrib = 1 }
          const avoidHit = supportedWuxing.includes(result.avoidGod)
          if (avoidHit && !hitAny) { misjudge = 1 }
        } else if (rule.applicable === false) {
          // 规则 applicable=false 不算命中也不算误判
        } else {
          // 拿不到支持的五行，看引擎分数
          const engineName = findEngineOfRule(rule, subResults)
          const e = subResults.find(r => r.engineName === engineName)
          if (e) {
            const primaryScore = e.scores[result.primaryYongShen] ?? 0
            if (primaryScore > 0) { hit = 1; contrib = 0.5 }
          }
        }
        agg.hit += hit
        agg.misjudge += misjudge
        agg.contribution += contrib
        if (agg.citation === 0) agg.citation = 1

        ruleAccuracy[id] = {
          ruleId: id,
          hitCount: agg.hit,
          runCount: agg.run,
          hitRate: safeDiv(agg.hit, agg.run),
          misjudgeCount: agg.misjudge,
          misjudgeRate: safeDiv(agg.misjudge, agg.run),
          contributionRate: safeDiv(agg.contribution, agg.run),
          lastEvaluatedAt: Date.now(),
        }
      }
    } else {
      // 无执行规则时，基于 subResult 分数生成 aggregated 规则统计，
      // 确保 RuleBenchmark / buildRuleBenchmark 有实际数据可计算
      for (const r of subResults) {
        const id = `${r.engineName}::aggregated`
        const agg = this._ruleStats[id] ??= { run: 0, hit: 0, misjudge: 0, contribution: 0, conflict: 0, citation: 0, kill: 0 }
        agg.run += 1

        // 基于引擎对最终决策的支持程度计算命中
        const primaryScore = r.scores[result.primaryYongShen] ?? 0
        const avoidScore = r.scores[result.avoidGod] ?? 0
        const assistantScore = result.assistantGod ? (r.scores[result.assistantGod] ?? 0) : 0
        const hitAny = primaryScore > 0.1 || assistantScore > 0.05
        if (hitAny) { agg.hit += 1; agg.contribution += Math.max(0.1, primaryScore) }
        const misjudge = avoidScore > 0 && primaryScore <= 0.05
        if (misjudge) agg.misjudge += 1
        if (agg.citation === 0) agg.citation = 1

        ruleAccuracy[id] = {
          ruleId: id,
          hitCount: agg.hit,
          runCount: agg.run,
          hitRate: safeDiv(agg.hit, agg.run),
          misjudgeCount: agg.misjudge,
          misjudgeRate: safeDiv(agg.misjudge, agg.run),
          contributionRate: safeDiv(agg.contribution, agg.run),
          lastEvaluatedAt: Date.now(),
        }
      }
    }

    // 2) Engine Level 准确率
    const engineAccuracy: Record<string, EngineAccuracy> = {}
    for (const r of subResults) {
      const stat = this._engineStats[r.engineName] ??= { run: 0, primaryHit: 0, assistantHit: 0, avoidHit: 0, agreement: 0 }
      stat.run += 1

      const primaryScore = r.scores[result.primaryYongShen] ?? 0
      const assistantScore = result.assistantGod ? (r.scores[result.assistantGod] ?? 0) : 0
      const avoidScore = r.scores[result.avoidGod] ?? 0

      const primaryHit = primaryScore > 0.2
      const assistantHit = assistantScore > 0
      const avoidHit = avoidScore < 0
      if (primaryHit) stat.primaryHit += 1
      if (assistantHit) stat.assistantHit += 1
      if (avoidHit) stat.avoidHit += 1

      // 主用神 + 喜神 + 忌神 三者一致 → 算该命例对引擎整体一致
      const agreement = [primaryHit, assistantHit, avoidHit].filter(Boolean).length / 3
      stat.agreement += agreement

      engineAccuracy[r.engineName] = {
        engineName: r.engineName,
        primaryAgreement: Number(agreement.toFixed(4)),
        primaryHitRate: safeDiv(stat.primaryHit, stat.run),
        assistantHitRate: safeDiv(stat.assistantHit, stat.run),
        avoidHitRate: safeDiv(stat.avoidHit, stat.run),
        overallAccuracy: Number(((stat.primaryHit + stat.assistantHit + stat.avoidHit) / (stat.run * 3)).toFixed(4)),
        sampleSize: this._totalCases,
        runCount: stat.run,
      }
    }

    // 3) Decision Level 自评估
    const passedCount = result.gateReport?.passedCount ?? subResults.filter(r => r.applicable).length
    const totalCount = subResults.length
    const internalConsistency = passedCount > 0
      ? subResults.filter(r => {
          const primary = r.scores[result.primaryYongShen] ?? 0
          const avoid = r.scores[result.avoidGod] ?? 0
          return primary > 0.1 || avoid < -0.1
        }).length / totalCount
      : 0

    const classicConsistency =
      result.classicSupport?.[result.primaryYongShen]?.supportScore ?? 0.5

    const schoolConsistency =
      result.schoolConsensus?.[result.primaryYongShen]?.consensusRate ?? 0.5

    // 冲突惩罚
    const conflictFactor = 1 - Math.min((result.conflictReport?.conflictPenalty ?? 0) * 2, 0.6)

    // groundTruth 加成（如提供权威答案，命中可以大幅提高 Accuracy Score
    let gtBonus = 1
    if (groundTruth) {
      let matches = 0, total = 0
      if (groundTruth.primaryYongShen) { total += 1; if (groundTruth.primaryYongShen === result.primaryYongShen) matches += 1 }
      if (groundTruth.assistantGod) { total += 1; if (groundTruth.assistantGod === result.assistantGod) matches += 1 }
      if (groundTruth.avoidGod) { total += 1; if (groundTruth.avoidGod === result.avoidGod) matches += 1 }
      gtBonus = total > 0 ? 0.7 + 0.3 * (matches / total) : 1
    }

    const baseAcc = (
      (result.confidence ?? 0.7) * 0.25 +
      Math.max(0.2, Math.min(1, internalConsistency)) * 0.30 +
      Math.max(0.2, Math.min(1, classicConsistency)) * 0.20 +
      Math.max(0.2, Math.min(1, schoolConsistency)) * 0.15 +
      conflictFactor * 0.10
    )

    const overallAccuracyScore = Number(Math.max(0, Math.min(1, baseAcc * gtBonus)).toFixed(4))

    const decisionAccuracy: DecisionAccuracy = {
      selfConfidence: Number((result.confidence ?? 0.7).toFixed(4)),
      internalConsistency: Number(internalConsistency.toFixed(4)),
      classicConsistency: Number(classicConsistency.toFixed(4)),
      schoolConsistency: Number(schoolConsistency.toFixed(4)),
      overallAccuracyScore,
    }

    return {
      ruleAccuracy,
      engineAccuracy,
      decisionAccuracy,
      evaluatedAt: Date.now(),
      version: '3.5.0',
    }
  }

  /** 批量评估（CaseDatabase 所有命例，计算真正的准确率） */
  evaluateBatch(
    cases: BaziCase[],
    engine: EvidenceFusionDecisionEngine,
    subEngineFactory: (c: BaziCase) => SubEngineResult[],
    inputFactory: (c: BaziCase) => any,
  ): { accuracy: AccuracyReport; benchmark: RuleBenchmarkReport } {
    let lastAcc: AccuracyReport | null = null
    for (const c of cases) {
      const input = inputFactory(c)
      const result = engine.decide(input)
      const subResults = subEngineFactory(c)
      lastAcc = this.evaluate(result, subResults, [], c.groundTruth)
    }
    const benchmark = this.buildRuleBenchmark()
    return { accuracy: lastAcc!, benchmark }
  }

  // ============================================================
  // ⑤ RuleBenchmark
  // ============================================================
  buildRuleBenchmark(): RuleBenchmarkReport {
    const entries: Record<string, RuleBenchmarkEntry> = {}
    let keepCount = 0, reviewCount = 0, demoteCount = 0, deprecateCount = 0
    let hitSum = 0, misSum = 0, total = 0

    for (const id of Object.keys(this._ruleStats)) {
      const s = this._ruleStats[id]
      total += 1
      const hitRate = safeDiv(s.hit, s.run)
      const misjudgeRate = safeDiv(s.misjudge, s.run)
      const conflictRate = safeDiv(s.conflict, s.run)
      const contributionRate = safeDiv(s.contribution, s.run)
      const killRate = safeDiv(s.kill, s.run)
      hitSum += hitRate
      misSum += misjudgeRate

      // 评估建议
      let recommendation: RuleBenchmarkEntry['recommendation'] = 'review'
      let reason = ''
      if (s.run < 5) {
        recommendation = 'review'
        reason = `样本不足（${s.run}），需要更多命例`
      } else if (hitRate >= 0.75 && misjudgeRate <= 0.1) {
        recommendation = 'keep'
        reason = `命中率高（${(hitRate*100).toFixed(0)}%），误判率低（${(misjudgeRate*100).toFixed(0)}%）`
        keepCount += 1
      } else if (misjudgeRate >= 0.35 || killRate >= 0.5) {
        recommendation = 'deprecate'
        reason = `高误判（${(misjudgeRate*100).toFixed(0)}%）或高淘汰率（${(killRate*100).toFixed(0)}%），建议弃用`
        deprecateCount += 1
      } else if (hitRate >= 0.5 && contributionRate >= 0.3) {
        recommendation = 'keep'
        reason = `表现中规中矩（命中${(hitRate*100).toFixed(0)}% / 贡献${(contributionRate*100).toFixed(0)}%），暂保留`
        keepCount += 1
      } else if (hitRate >= 0.3) {
        recommendation = 'demote'
        reason = `命中偏低（${(hitRate*100).toFixed(0)}%），建议降权优化`
        demoteCount += 1
      } else {
        recommendation = 'review'
        reason = `命中过低（${(hitRate*100).toFixed(0)}%），需要复核规则`
        reviewCount += 1
      }

      entries[id] = {
        ruleId: id,
        executionCount: s.run,
        hitCount: s.hit,
        misjudgeCount: s.misjudge,
        hitRate: Number(hitRate.toFixed(4)),
        misjudgeRate: Number(misjudgeRate.toFixed(4)),
        conflictRate: Number(conflictRate.toFixed(4)),
        citationCount: s.citation,
        contributionRate: Number(contributionRate.toFixed(4)),
        killRate: Number(killRate.toFixed(4)),
        recommendation,
        reason,
      }
    }

    return {
      entries,
      summary: {
        totalRules: total,
        keepCount, reviewCount, demoteCount, deprecateCount,
        averageHitRate: total > 0 ? Number((hitSum / total).toFixed(4)) : 0,
        averageMisjudgeRate: total > 0 ? Number((misSum / total).toFixed(4)) : 0,
      },
      generatedAt: Date.now(),
    }
  }

  // ============================================================
  // ⑥ SchoolBenchmark
  // ============================================================
  /** 计算 8 流派在给定 Case 集上的准确率排名 */
  buildSchoolBenchmark(
    cases: BaziCase[],
    inputFactory: (c: BaziCase) => any,
  ): SchoolBenchmarkReport {
    const schools = Object.keys(SCHOOL_PROFILES)
    const agg: Record<string, { primaryHits: number; assistantHits: number; avoidHits: number; total: number; diverge: number; agree: number; }> = {}
    for (const s of schools) agg[s] = { primaryHits: 0, assistantHits: 0, avoidHits: 0, total: 0, diverge: 0, agree: 0 }

    for (const c of cases) {
      const input = inputFactory(c)
      const resultsBySchool: Record<string, DecisionResult> = {}
      for (const school of schools) {
        const eng = new EvidenceFusionDecisionEngine(getSchoolProfile(school))
        resultsBySchool[school] = eng.decide(input)
      }

      for (const school of schools) {
        const r = resultsBySchool[school]
        const a = agg[school]
        a.total += 1
        if (c.groundTruth.primaryYongShen && r.primaryYongShen === c.groundTruth.primaryYongShen) a.primaryHits += 1
        if (c.groundTruth.assistantGod && r.assistantGod === c.groundTruth.assistantGod) a.assistantHits += 1
        if (c.groundTruth.avoidGod && r.avoidGod === c.groundTruth.avoidGod) a.avoidHits += 1

        // 跨流派一致率
        const primaries = schools.map(s2 => resultsBySchool[s2].primaryYongShen)
        const commonest = modeOf(primaries)
        if (r.primaryYongShen === commonest) a.agree += 1
      }

      // 分歧率：8 流派主用神不一致数 / 8
      const primarySet = new Set(schools.map(s => resultsBySchool[s].primaryYongShen))
      const divergeRate = (primarySet.size - 1) / schools.length
      for (const s of schools) agg[s].diverge += divergeRate
    }

    const entries: Record<string, SchoolBenchmarkEntry> = {}
    for (const school of schools) {
      const a = agg[school]
      const n = Math.max(a.total, 1)
      const primaryAccuracy = safeDiv(a.primaryHits, a.total)
      const assistantAccuracy = safeDiv(a.assistantHits, a.total)
      const avoidAccuracy = safeDiv(a.avoidHits, a.total)
      const consistencyRate = safeDiv(a.agree, a.total)
      const divergenceRate = Number((a.diverge / n).toFixed(4))
      const overallScore = Number(((
        primaryAccuracy * 0.4 +
        assistantAccuracy * 0.25 +
        avoidAccuracy * 0.2 +
        consistencyRate * 0.15
      ) * 100).toFixed(2))
      entries[school] = {
        school,
        schoolName: SCHOOL_PROFILES[school as keyof typeof SCHOOL_PROFILES]?.name ?? school,
        sampleSize: a.total,
        primaryAccuracy: Number(primaryAccuracy.toFixed(4)),
        assistantAccuracy: Number(assistantAccuracy.toFixed(4)),
        avoidAccuracy: Number(avoidAccuracy.toFixed(4)),
        overallScore,
        divergenceRate,
        consistencyRate: Number(consistencyRate.toFixed(4)),
        rank: 0,
      }
    }

    // 排名：按 overallScore 排序
    const sorted = Object.values(entries).sort((a, b) => b.overallScore - a.overallScore)
    sorted.forEach((e, i) => { entries[e.school].rank = i + 1 })
    const ranking = sorted.map(e => e.school)

    return { entries, ranking, generatedAt: Date.now() }
  }

  /** 重置累计统计（调试用） */
  reset() {
    this._totalCases = 0
    this._ruleStats = {}
    this._engineStats = {}
  }

  /** 样本规模 */
  get totalCases() { return this._totalCases }
}

// ============================================================
// 辅助函数
// ============================================================

function safeDiv(a: number, b: number): number {
  return b > 0 ? Number((a / b).toFixed(4)) : 0
}

function modeOf<T>(arr: T[]): T | undefined {
  if (!arr.length) return
  const freq = new Map<T, number>()
  for (const x of arr) freq.set(x, (freq.get(x) ?? 0) + 1)
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}

/** 从规则结果中抽取推荐的五行列表 */
function extractRuleSupportedWuxing(rule: Rule): Wuxing[] {
  const text = [rule.result, rule.evidence, (rule as any).text ?? '']
    .filter(Boolean).join(' ')
  const out: Wuxing[] = []
  for (const w of WUXING_LIST) {
    if (text.includes(w) && !out.includes(w)) {
      // 只有正面词才加
      const posHit = text.includes(`${w}为用`) || text.includes(`喜${w}`) || text.includes(`用${w}`)
        || text.includes(`${w}为喜`) || text.includes(`${w}生`)
      const negHit = text.includes(`忌${w}`) || text.includes(`${w}为忌`)
      if (posHit && !negHit) out.push(w)
    }
  }
  return out
}

function findEngineOfRule(_rule: Rule, subResults: SubEngineResult[]): string {
  // 默认取最相关的引擎（第一个适用）
  return subResults.find(r => r.applicable)?.engineName ?? subResults[0]?.engineName ?? 'StrengthEngine'
}

/** 全局 AccuracyCenter 单例（全项目共享累计统计） */
export const globalAccuracyCenter = new AccuracyCenter()
