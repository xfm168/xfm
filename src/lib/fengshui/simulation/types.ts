/**
 * @deprecated
 * 保留用于未来 Premium / 实验功能。
 * 当前正式版不会调用。
 * 若未来未重新启用，可在 V5 删除。
 */

import type { FengShuiContext } from '../types'
import type { RuleExecutionInput, FengShuiRuleResult } from '../rules/types'
import type { ScoreEngineInput, ScoreEngineResult } from '../score-engine/types'

export interface SimulationParams {
  baseContext: FengShuiContext
  changes: SimulationChange[]
  iterations?: number
}

export interface SimulationChange {
  type: 'furniture' | 'layout' | 'color' | 'direction'
  target: string
  action: 'add' | 'remove' | 'move' | 'modify'
  value?: unknown
}

export interface SimulationResult {
  originalScore: number
  modifiedScore: number
  scoreChange: number
  context: FengShuiContext
  scoreResult: ScoreEngineResult
  changesApplied: SimulationChange[]
}

export interface OptimizationSuggestion {
  id: string
  title: string
  description: string
  expectedImprovement: number
  difficulty: 'easy' | 'medium' | 'hard'
  changes: SimulationChange[]
}

export type { RuleExecutionInput, FengShuiRuleResult, ScoreEngineInput, ScoreEngineResult }
