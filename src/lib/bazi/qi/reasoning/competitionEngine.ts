/**
 * UniversalCompetitionEngine — 通用竞争引擎（Freeze+1）
 *
 * 服务范围：合/冲/刑/害/破/格局/旺衰/用神/调候/病药/神煞
 * 核心原则：全系统只有一个 Competition Engine
 *
 * 抽象层级：
 *   CompetitionCandidate → CompetitionStrategy → CompetitionEngine → CompetitionResult
 */

import type { FiveElement } from '../../types'
import type { QiNode, SeasonCommand } from '../types'
import type { CompetitionFactors, ReasoningStep, ClassicalSource } from './types'

// ─── 通用候选接口 ───

export interface CompetitionCandidate {
  /** 唯一标识 */
  id: string
  /** 候选名称（如"寅午戌三合火"、"正官格"、"扶抑用神"） */
  name: string
  /** 候选类型 */
  type: '合' | '冲' | '刑' | '害' | '破' | '格局' | '旺衰' | '用神' | '调候' | '病药' | '神煞'
  /** 竞争评分 */
  score: number
  /** 评分分解 */
  factors: CompetitionFactors
  /** 推理链 */
  chain: ReasoningStep[]
  /** 关联的Qi节点 */
  relatedNodes: string[]
  /** 古籍依据 */
  references?: ClassicalSource[]
}

/** 候选淘汰记录 */
export interface EliminationRecord {
  candidateId: string
  candidateName: string
  rank: number
  score: number
  reason: string
}

/** 胜出详情 */
export interface WinnerDetail {
  candidateId: string
  candidateName: string
  score: number
  margin: number // 与第二名的分差
  reason: string
}

/** 嵌套竞争 — Competition Tree 节点 */
export interface NestedCompetition {
  /** 嵌套竞争 ID */
  id: string
  /** 嵌套竞争名称 */
  name: string
  /** 竞争类型 */
  type: CompetitionCandidate['type']
  /** 竞争结果 */
  result: CompetitionResult
  /** 父竞争的胜出候选 ID */
  parentWinnerId: string
  /** TraceID */
  traceId: string
  /** 父竞争ID（顶层为空） */
  parentId?: string
  /** 在 Competition Tree 中的深度（根=0） */
  depth: number
  /** 路径（如 "/格局/正官格/用神"） */
  path: string
}

export interface CompetitionResult {
  /** 胜出者 */
  winner: CompetitionCandidate | null
  /** 胜出详情 */
  winnerDetail?: WinnerDetail
  /** 所有候选（按分数排序） */
  allCandidates: CompetitionCandidate[]
  /** 被抑制的候选 */
  suppressed: CompetitionCandidate[]
  /** 淘汰记录（全程记录） */
  eliminationRecords: EliminationRecord[]
  /** 平局标记 */
  isTie: boolean
  /** 子竞争结果（嵌套竞争，如格局竞争→用神竞争→调候竞争） */
  children: NestedCompetition[]
  /** 父竞争ID（顶层为空） */
  parentId?: string
  /** 在 Competition Tree 中的深度（根=0） */
  depth: number
  /** 路径 */
  path: string
  /** TraceID */
  traceId: string
}

// ─── CompetitionStrategy 接口（Freeze+1） ───

export interface CompetitionStrategy {
  /** 策略名称 */
  readonly name: string
  /** 支持的候选类型 */
  readonly supportedTypes: CompetitionCandidate['type'][]
  /**
   * 为该策略计算候选分数
   */
  calculateScore(
    candidate: CompetitionCandidate,
    qiNodes: QiNode[],
    seasonCommands?: SeasonCommand[],
  ): { score: number; factors: CompetitionFactors }
}

// ─── 通用评分函数 ───

export function calculateUniversalScore(
  candidate: CompetitionCandidate,
  qiNodes: QiNode[],
  seasonCommands?: SeasonCommand[],
): { score: number; factors: CompetitionFactors } {
  // 复用 competitionEvaluator.ts 的核心逻辑
  // 但将其包装为通用接口

  const baseScore = candidate.type === '合' ? 60
    : candidate.type === '冲' ? 50
    : candidate.type === '刑' ? 40
    : candidate.type === '害' ? 25
    : candidate.type === '破' ? 15
    : candidate.type === '格局' ? 70
    : candidate.type === '旺衰' ? 60
    : candidate.type === '用神' ? 65
    : candidate.type === '调候' ? 55
    : candidate.type === '病药' ? 50
    : 30

  const factors: CompetitionFactors = {
    baseScore,
    monthZhiBonus: 0, deLingBonus: 0, siLingBonus: 0,
    touGanBonus: 0, genQiBonus: 0, huaShenStrength: 0,
    kongWangPenalty: 0, chongPenalty: 0, xingHaiPenalty: 0, muQiPenalty: 0,
    distanceBonus: 0, initiativeBonus: 0,
  }

  // 月令加成
  if (seasonCommands) {
    for (const sc of seasonCommands) {
      if (sc.type === '得令') {
        factors.deLingBonus = 10
        factors.siLingBonus = 8
      }
    }
  }

  // 根气加成
  const uniqueRoots = new Set(candidate.relatedNodes.map(nid => {
    const node = qiNodes.find(n => n.id === nid)
    return node?.rootId
  }).filter(Boolean))
  factors.genQiBonus = uniqueRoots.size * 2

  // 化神/力量加成
  let totalStrength = 0
  for (const nid of candidate.relatedNodes) {
    const node = qiNodes.find(n => n.id === nid)
    if (node?.active) totalStrength += node.strength
  }
  factors.huaShenStrength = totalStrength / 10

  // 汇总
  const score = Object.values(factors).reduce((s, v) => s + v, 0)
  return { score, factors }
}

// ─── Strategy Registry（Freeze+1） ───

const strategies: CompetitionStrategy[] = []

export function registerCompetitionStrategy(strategy: CompetitionStrategy): void {
  strategies.push(strategy)
}

export function getRegisteredCompetitionStrategies(): CompetitionStrategy[] {
  return [...strategies]
}

export function clearCompetitionStrategies(): void {
  strategies.length = 0
}

// ─── 通用竞争评估 ───

export function evaluateUniversalCompetition(
  candidates: CompetitionCandidate[],
  qiNodes: QiNode[],
  seasonCommands?: SeasonCommand[],
): CompetitionResult {
  // 为每个候选计算分数
  const scored = candidates.map(c => {
    // 优先查找注册的 Strategy
    const strategy = strategies.find(s => s.supportedTypes.includes(c.type))
    if (strategy) {
      const { score, factors } = strategy.calculateScore(c, qiNodes, seasonCommands)
      return { ...c, score, factors }
    }
    // 回退到默认评分
    const { score, factors } = calculateUniversalScore(c, qiNodes, seasonCommands)
    return { ...c, score, factors }
  })

  // 按分数排序
  scored.sort((a, b) => b.score - a.score)

  const winner = scored.length > 0 && scored[0].score > 0 ? scored[0] : null
  const threshold = winner ? winner.score * 0.7 : 0
  const suppressed = scored.filter(c => c.score < threshold)
  const isTie = scored.length >= 2 && Math.abs(scored[0].score - scored[1].score) < 5

  // 全程记录：淘汰原因
  const eliminationRecords: EliminationRecord[] = scored.map((c, idx) => ({
    candidateId: c.id,
    candidateName: c.name,
    rank: idx + 1,
    score: c.score,
    reason: idx === 0
      ? '胜出'
      : c.score < threshold
        ? `低于阈值(${threshold.toFixed(1)})`
        : '竞争力不足',
  }))

  // 胜出详情
  const winnerDetail: WinnerDetail | undefined = winner ? {
    candidateId: winner.id,
    candidateName: winner.name,
    score: winner.score,
    margin: scored.length >= 2 ? winner.score - scored[1].score : 0,
    reason: isTie ? '平局（分差<5）' : `领先第2名 ${scored.length >= 2 ? (winner.score - scored[1].score).toFixed(1) : 'N/A'} 分`,
  } : undefined

  return {
    winner,
    winnerDetail,
    allCandidates: scored,
    suppressed,
    eliminationRecords,
    isTie,
    children: [],
    depth: 0,
    path: '/',
    traceId: `COMP-${Date.now()}`,
  }
}

// ─── 统一入口（Freeze+1） ───

/**
 * evaluateCompetition — 全系统唯一竞争入口
 *
 * 格局竞争 / 旺衰竞争 / 用神竞争 / 调候竞争 / 病药竞争 / 神煞竞争
 * 全部通过此函数统一评分。
 */
export function evaluateCompetition(
  candidates: CompetitionCandidate[],
  qiNodes: QiNode[],
  seasonCommands?: SeasonCommand[],
): CompetitionResult {
  const result = evaluateUniversalCompetition(candidates, qiNodes, seasonCommands)
  return result
}
