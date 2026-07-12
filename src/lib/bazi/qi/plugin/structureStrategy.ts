/**
 * StructureStrategy — 格局检测策略插件（P2-1）
 *
 * 通过 Plugin 方式将格局检测集成到推演流程。
 * 所有格局规则来自 rules/gejuRules.ts（Rule Engine 驱动）。
 * 本插件不修改 Kernel，只返回 StrategyIntent。
 */

import type { FiveElement, ShenShi, SixLines } from '../../types'
import type { QiNode } from '../types'
import type {
  ReasoningContext, ExplainRecord,
  ExplainSection, ExplainConclusion,
} from '../reasoning/types'
import type { ReasoningStrategy, StrategyIntent } from '../reasoning/strategy'
import type { CompetitionCandidate } from '../reasoning/competitionEngine'
import {
  createExplainSection, createUnifiedExplain,
} from '../reasoning/explainEngine'

// 从已有的规则引擎引入
import {
  buildGeJuContext,
  determineGeJu,
  type GeJuResult,
  type GeJuName,
  type GeJuCategory,
} from '../../rules/gejuRules'

// ─── 格局检测结果（纯输出，无状态） ───

export interface StructureDetectionInput {
  sixLines: SixLines
  relatedShens: Record<string, ShenShi>
  strengthScore: number
  dayGan: string
  monthZhi: string
  fiveElementCount: Record<FiveElement, number>
}

export interface StructureDetectionOutput {
  result: GeJuResult
  /** 格局竞争候选（用于 Competition Engine） */
  competitionCandidates: CompetitionCandidate[]
  /** Explain 记录 */
  explains: ExplainRecord[]
  /** 证据列表 */
  evidence: string[]
}

// ─── 纯函数：格局检测（Stateless） ───

/**
 * detectStructure — 纯函数格局检测
 *
 * 输入 → 输出，无副作用，无全局状态。
 * 所有规则来自 gejuRules.ts。
 */
export function detectStructure(input: StructureDetectionInput): StructureDetectionOutput {
  // 1. 调用现有格局规则引擎
  const gejuResult = determineGeJu(
    input.sixLines,
    input.relatedShens,
    input.strengthScore,
    input.dayGan,
    input.monthZhi,
    input.fiveElementCount,
  )

  // 2. 构建竞争候选（主格、副格、兼格、冲突格全部参与竞争）
  const candidates: CompetitionCandidate[] = []

  // 主格候选
  candidates.push({
    id: `structure-main-${gejuResult.name}`,
    name: gejuResult.name,
    type: '格局',
    score: gejuResult.score,
    factors: {
      baseScore: gejuResult.score,
      monthZhiBonus: 0, deLingBonus: 0, siLingBonus: 0, touGanBonus: 0,
      genQiBonus: 0, huaShenStrength: 0, kongWangPenalty: 0,
      chongPenalty: 0, xingHaiPenalty: 0, muQiPenalty: 0,
      distanceBonus: 0, initiativeBonus: 0,
    },
    chain: gejuResult.reasons.map((r, i) => ({
      order: i + 1,
      name: `格局判定步骤${i + 1}`,
      description: r,
      factors: [],
      partialConclusion: r,
    })),
    relatedNodes: [],
  })

  // 副格候选
  for (const assist of gejuResult.assistGeJu) {
    candidates.push({
      id: `structure-assist-${assist.name}`,
      name: assist.name,
      type: '格局',
      score: assist.score,
      factors: {
        baseScore: assist.score,
        monthZhiBonus: 0, deLingBonus: 0, siLingBonus: 0, touGanBonus: 0,
        genQiBonus: 0, huaShenStrength: 0, kongWangPenalty: 0,
        chongPenalty: 0, xingHaiPenalty: 0, muQiPenalty: 0,
        distanceBonus: 0, initiativeBonus: 0,
      },
      chain: assist.reasons.map((r, i) => ({
        order: i + 1,
        name: `副格判定步骤${i + 1}`,
        description: r,
        factors: [],
        partialConclusion: r,
      })),
      relatedNodes: [],
    })
  }

  // 冲突格候选（破格）
  for (const conflict of gejuResult.conflictGeJu) {
    candidates.push({
      id: `structure-conflict-${conflict.name}`,
      name: conflict.name,
      type: '格局',
      score: conflict.score * 0.5, // 破格降权
      factors: {
        baseScore: conflict.score * 0.5,
        monthZhiBonus: 0, deLingBonus: 0, siLingBonus: 0, touGanBonus: 0,
        genQiBonus: 0, huaShenStrength: 0, kongWangPenalty: 0,
        chongPenalty: 0, xingHaiPenalty: 0, muQiPenalty: 0,
        distanceBonus: 0, initiativeBonus: 0,
      },
      chain: conflict.reasons.map((r, i) => ({
        order: i + 1,
        name: `破格判定步骤${i + 1}`,
        description: r,
        factors: [],
        partialConclusion: r,
      })),
      relatedNodes: [],
    })
  }

  // 3. 构建 Explain（统一七段式）
  const whyMatchedText = gejuResult.explain?.whyMatched?.join('；') ?? ''

  const sections: ExplainSection[] = [
    createExplainSection('Evidence', '证据',
      `月令${input.monthZhi}，日主${input.dayGan}，强度${input.strengthScore}分。${whyMatchedText}`),
    createExplainSection('Rule', '规则',
      `命中规则：${gejuResult.matchedRules.join('、') || '无特殊格局'}`,
      gejuResult.caseReference?.source ? [gejuResult.caseReference.source] : undefined),
    createExplainSection('Reason', '推理',
      `格局判定：${gejuResult.name}（${gejuResult.category}），成格评分${gejuResult.score}，可信度${gejuResult.confidence}。` +
      (gejuResult.poGe ? `破格：${gejuResult.poGeReason}` : '')),
    createExplainSection('Competition', '竞争评估',
      `主格${gejuResult.name}${gejuResult.score}分，` +
      `副格${gejuResult.assistGeJu.length}个，` +
      `冲突格${gejuResult.conflictGeJu.length}个。`),
    createExplainSection('Decision', '决策结论',
      `最终格局：${gejuResult.name}（${gejuResult.grade}），清纯度${gejuResult.pureScore}。`),
  ]

  const conclusion: ExplainConclusion = {
    text: `格局判定为「${gejuResult.name}」，${gejuResult.category}，${gejuResult.grade}，评分${gejuResult.score}/100`,
    confidence: gejuResult.confidence / 100,
  }

  const explain = createUnifiedExplain({
    phase: 'AfterStructure',
    step: '格局检测',
    subject: `格局判定：${gejuResult.name}`,
    sections,
    conclusion,
    scores: {
      '成格': gejuResult.score,
      '清纯度': gejuResult.pureScore,
      '贵气': gejuResult.nobilityScore,
      '富气': gejuResult.wealthScore,
    },
  })

  // 4. 构建证据列表
  const evidence: string[] = [
    `月令为${input.monthZhi}`,
    `日主${input.dayGan}，强度${input.strengthScore}`,
    ...(gejuResult.explain?.whyMatched ?? []),
  ]

  return {
    result: gejuResult,
    competitionCandidates: candidates,
    explains: [explain],
    evidence,
  }
}

// ─── ReasoningStrategy 实现 ───

export class StructureStrategy implements ReasoningStrategy {
  readonly name = '格局检测'
  readonly priority = 100

  private lastInput: StructureDetectionInput | null = null

  /**
   * 分析命局，产生 Intent
   * 注意：需要先调用 setInput() 传入必要数据
   */
  analyze(qiNodes: QiNode[], ctx: ReasoningContext): StrategyIntent {
    if (!this.lastInput) {
      return {
        name: this.name,
        type: '格局',
        candidates: [],
        evidence: ['未提供格局检测输入数据'],
        explains: [],
      }
    }

    const detection = detectStructure(this.lastInput)

    return {
      name: this.name,
      type: '格局',
      candidates: detection.competitionCandidates,
      evidence: detection.evidence,
      explains: detection.explains,
    }
  }

  /**
   * 竞争评估后，应用策略
   * 格局策略：将主格信息写入 Context
   */
  apply(intent: StrategyIntent, winner: CompetitionCandidate | null, ctx: ReasoningContext): import('../reasoning/strategy').StrategyResult {
    if (!this.lastInput || intent.candidates.length === 0) {
      return { applied: false, explainIds: [] }
    }

    const detection = detectStructure(this.lastInput)
    const gejuResult = detection.result

    // 注意：这里我们只返回结果，不直接修改 Context
    // 实际写入 Context 由 Settlement 负责
    return {
      applied: true,
      suggestions: [
        `格局：${gejuResult.name}（${gejuResult.category}）`,
        gejuResult.poGe ? `破格：${gejuResult.poGeReason}` : '格局完整',
        `清纯度${gejuResult.pureScore}，贵气${gejuResult.nobilityScore}，富气${gejuResult.wealthScore}`,
      ],
      explainIds: detection.explains.map(e => e.id),
    }
  }

  /**
   * 设置输入数据（Stateless 的入口）
   */
  setInput(input: StructureDetectionInput): void {
    this.lastInput = input
  }
}
