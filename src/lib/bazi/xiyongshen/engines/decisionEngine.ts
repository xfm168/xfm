import type { Wuxing, ShenType } from '../types'
import type { SubEngineInput, SubEngineResult } from './types'
import type { ClassicEvidenceRef } from '../../ruleEngine/types'
import type { Confidence } from '../../ruleEngine/types'
import {
  StrengthEngine, PatternEngine, ClimateEngine, BalanceEngine,
  MedicineEngine, BridgeEngine, SeasonEngine,
} from './index'
import { buildConfidence5D } from '../../ruleEngine'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']

/** 单个五行的综合评分明细 */
export interface WuxingScoreBreakdown {
  wuxing: Wuxing
  totalScore: number
  /** 各引擎对该五行的评分贡献 */
  byEngine: Array<{
    engineName: string
    score: number
    weight: number
    weightedScore: number
  }>
  finalType: ShenType
}

/** YongShenDecisionEngine 最终输出 */
export interface YongShenDecision {
  /** 用神 */
  usefulGod: Wuxing
  /** 喜神 */
  favorableGod: Wuxing
  /** 忌神 */
  unfavorableGod: Wuxing
  /** 仇神 */
  enemyGod: Wuxing
  /** 闲神 */
  idleGod: Wuxing
  /** 策略说明 */
  strategy: string
  /** 五行评分明细 */
  breakdown: WuxingScoreBreakdown[]
  /** 证据集合（来自所有子引擎） */
  evidence: Array<{
    engineName: string
    items: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }>
  }>
  /** 可信度 */
  confidence: Confidence
  /** 经典引用（来自所有子引擎） */
  classicEvidence: ClassicEvidenceRef[]
  /** 可解释说明 */
  explain: string
  /** 各子引擎结果 */
  subEngineResults: SubEngineResult[]
  /** 综合摘要 */
  summary: string
}

/**
 * YongShenDecisionEngine（喜用神综合决策引擎）
 *
 * 核心设计原则：
 * 1. Rule（子引擎）只负责提供 Evidence（评分 + trace + classicEvidence）
 * 2. DecisionEngine 综合所有 Evidence 后给出最终结论
 * 3. 新增子引擎或规则，只需要增加 Evidence，不需要推翻整个决策逻辑
 *
 * 决策流程：
 * 1. 调用 7 个子引擎，收集所有 SubEngineResult
 * 2. 对每个五行，按各引擎 weight 加权汇总 scores
 * 3. 按总分排序，分档确定用神/喜神/忌神/仇神/闲神
 * 4. 合并所有 evidence/classicEvidence
 * 5. 计算 5 维 Confidence
 * 6. 生成 explain 说明
 */
export class YongShenDecisionEngine {
  private engines: Array<{ instance: any; weight: number }>

  constructor() {
    this.engines = [
      { instance: new StrengthEngine(), weight: 0 },    // 不参与评分加权
      { instance: new PatternEngine(), weight: 0.1 },
      { instance: new ClimateEngine(), weight: 0.2 },
      { instance: new BalanceEngine(), weight: 0.25 },
      { instance: new MedicineEngine(), weight: 0.15 },
      { instance: new BridgeEngine(), weight: 0.1 },
      { instance: new SeasonEngine(), weight: 0.2 },
    ]
  }

  /**
   * 综合决策
   */
  decide(input: SubEngineInput): YongShenDecision {
    // 1. 调用所有子引擎
    const subResults: SubEngineResult[] = this.engines.map(({ instance }) => instance.evaluate(input))

    // 2. 对每个五行加权汇总
    const breakdown: WuxingScoreBreakdown[] = WUXING_LIST.map(wx => {
      const byEngine = subResults
        .filter(r => r.applicable && r.weight > 0)
        .map(r => {
          const score = r.scores[wx] ?? 0
          const weight = r.weight
          const weightedScore = score * weight
          return { engineName: r.engineName, score, weight, weightedScore }
        })
      const totalScore = byEngine.reduce((sum, e) => sum + e.weightedScore, 0)
      return { wuxing: wx, totalScore: Number(totalScore.toFixed(4)), byEngine, finalType: '闲神' as ShenType }
    })

    // 3. 分档
    const sorted = [...breakdown].sort((a, b) => b.totalScore - a.totalScore)
    for (const item of breakdown) {
      if (item.totalScore >= 0.5) item.finalType = '用神'
      else if (item.totalScore >= 0.15) item.finalType = '喜神'
      else if (item.totalScore <= -0.5) item.finalType = '忌神'
      else if (item.totalScore <= -0.15) item.finalType = '仇神'
      else item.finalType = '闲神'
    }

    // 4. 确定用神/喜神/忌神/仇神/闲神
    const usefulGod = sorted[0].wuxing
    const unfavorableGod = sorted[sorted.length - 1].wuxing
    const favorableGod = sorted[1].wuxing
    const enemyGod = sorted[sorted.length - 2].wuxing
    // 闲神 = 中间的
    const idleGod = sorted.find(s => s.finalType === '闲神')?.wuxing ?? sorted[2].wuxing

    // 5. 合并 evidence
    const evidence = subResults.map(r => ({
      engineName: r.engineName,
      items: r.evidence,
    }))

    // 6. 合并 classicEvidence
    const classicEvidence: ClassicEvidenceRef[] = subResults
      .filter(r => r.applicable)
      .flatMap(r => r.classicEvidence)

    // 7. 计算 5 维 Confidence
    const applicableCount = subResults.filter(r => r.applicable).length
    const consensusRate = applicableCount > 0
      ? subResults.filter(r => r.applicable && r.scores[usefulGod] > 0).length / applicableCount
      : 0
    const confidence = buildConfidence5D({
      calendar: { preciseProvider: true, trueSolarTimeUsed: true, ziHourStrategy: 'true-solar', termPrecisionLevel: 2 },
      geju: { conditions: [] },
      xiyongshen: { consensusRate },
      shensha: {},
    })

    // 8. 生成 strategy 和 explain
    const strategy = this.buildStrategy(usefulGod, favorableGod, unfavorableGod, breakdown, subResults)
    const explain = this.buildExplain(usefulGod, favorableGod, unfavorableGod, breakdown, subResults)

    const summary = `用神=${usefulGod} 喜神=${favorableGod} 忌神=${unfavorableGod} ` +
      `综合分：${breakdown.map(b => `${b.wuxing}:${b.totalScore}`).join(' ')}`

    return {
      usefulGod,
      favorableGod,
      unfavorableGod,
      enemyGod,
      idleGod,
      strategy,
      breakdown,
      evidence,
      confidence,
      classicEvidence,
      explain,
      subEngineResults: subResults,
      summary,
    }
  }

  private buildStrategy(
    usefulGod: Wuxing, favorableGod: Wuxing, unfavorableGod: Wuxing,
    breakdown: WuxingScoreBreakdown[], subResults: SubEngineResult[],
  ): string {
    const applicableEngines = subResults.filter(r => r.applicable).map(r => r.engineName)
    const useScore = breakdown.find(b => b.wuxing === usefulGod)?.totalScore ?? 0
    const unfavScore = breakdown.find(b => b.wuxing === unfavorableGod)?.totalScore ?? 0
    return [
      `综合 ${applicableEngines.length} 个引擎的 Evidence：`,
      `用神=${usefulGod}(综合分${useScore})，喜神=${favorableGod}，忌神=${unfavorableGod}(综合分${unfavScore})。`,
      `参与引擎：${applicableEngines.join('、')}。`,
      `策略：以${usefulGod}为用，佐${favorableGod}，避${unfavorableGod}。`,
    ].join('')
  }

  private buildExplain(
    usefulGod: Wuxing, favorableGod: Wuxing, unfavorableGod: Wuxing,
    breakdown: WuxingScoreBreakdown[], subResults: SubEngineResult[],
  ): string {
    const lines: string[] = []
    lines.push(`【喜用神综合推演说明】`)
    lines.push(``)
    lines.push(`最终结论：`)
    lines.push(`  用神：${usefulGod}`)
    lines.push(`  喜神：${favorableGod}`)
    lines.push(`  忌神：${unfavorableGod}`)
    lines.push(``)
    lines.push(`推演过程：`)
    for (const r of subResults) {
      if (!r.applicable) {
        lines.push(`  [${r.engineName}] 不适用：${r.skipReason ?? '未知原因'}`)
        continue
      }
      lines.push(`  [${r.engineName}] ${r.summary}`)
      // 列出该引擎对用神和忌神的评分
      const useScore = r.scores[usefulGod] ?? 0
      const unfavScore = r.scores[unfavorableGod] ?? 0
      lines.push(`    → ${usefulGod}评分=${useScore}，${unfavorableGod}评分=${unfavScore}`)
      // 列出经典引用
      if (r.classicEvidence.length > 0) {
        lines.push(`    → 经典依据：${r.classicEvidence.map(ce => `《${ce.classicName}》"${ce.quotedText.slice(0, 20)}..."`).join('；')}`)
      }
    }
    lines.push(``)
    lines.push(`五行综合评分：`)
    for (const b of breakdown) {
      lines.push(`  ${b.wuxing}：${b.totalScore} → ${b.finalType}`)
    }
    return lines.join('\n')
  }
}

/** 全局单例 */
export const globalYongShenDecisionEngine = new YongShenDecisionEngine()
