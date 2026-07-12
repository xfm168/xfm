/**
 * ReasoningStrategy — 推演策略接口
 *
 * 扶抑 / 调候 / 病药 / 通关 全部实现此接口
 * 以后任何新策略都可插拔
 */

import type { FiveElement } from '../../types'
import type { QiNode } from '../types'
import type { ReasoningContext, ExplainRecord, DecisionNode } from './types'
import type { CompetitionCandidate } from './competitionEngine'

export interface StrategyIntent {
  /** 策略名称 */
  name: string
  /** 策略类型 — 覆盖全部命理分析维度 */
  type: '扶抑' | '调候' | '病药' | '通关' | '格局' | '旺衰' | '用神'
  /** 候选方案 */
  candidates: CompetitionCandidate[]
  /** 证据列表 */
  evidence: string[]
  /** 推理记录 */
  explains: ExplainRecord[]
}

export interface StrategyResult {
  /** 是否成功应用 */
  applied: boolean
  /** 推荐五行 */
  recommendedElements?: FiveElement[]
  /** 推荐十神 */
  recommendedShiShen?: string[]
  /** 建议操作 */
  suggestions?: string[]
  /** 关联 Explain */
  explainIds: string[]
}

export interface ReasoningStrategy {
  /** 策略名称 */
  readonly name: string
  /** 策略优先级 */
  readonly priority: number

  /**
   * 分析命局，产生 Intent
   * 禁止修改 QiNode / ReasoningContext
   */
  analyze(qiNodes: QiNode[], ctx: ReasoningContext): StrategyIntent

  /**
   * 竞争评估后，应用策略
   * 禁止修改 QiNode
   * 只能通过 Context 统一结算
   */
  apply(intent: StrategyIntent, winner: CompetitionCandidate | null, ctx: ReasoningContext): StrategyResult
}

// ─── 策略注册表 ───

const strategies: ReasoningStrategy[] = []

export function registerStrategy(strategy: ReasoningStrategy): void {
  strategies.push(strategy)
  strategies.sort((a, b) => b.priority - a.priority)
}

export function getRegisteredStrategies(): ReasoningStrategy[] {
  return [...strategies]
}

export function clearStrategies(): void {
  strategies.length = 0
}
