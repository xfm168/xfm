/**
 * @deprecated
 * 保留用于未来 Premium / 实验功能。
 * 当前正式版不会调用。
 * 若未来未重新启用，可在 V5 删除。
 */

import type { FengShuiContext } from '../types'
import type {
  SimulationParams,
  SimulationResult,
  SimulationChange,
  OptimizationSuggestion,
} from './types'
import { executeRules } from '../rules/executor'
import { calculateScore } from '../score-engine'

/**
 * 风水模拟引擎
 * 
 * @deprecated 实验性功能，当前版本未启用。
 */
export class SimulationEngine {
  /**
   * 执行单次模拟
   * 
   * @deprecated 实验性功能
   */
  async simulate(params: SimulationParams): Promise<SimulationResult> {
    const { baseContext, changes } = params

    const modifiedContext = this.applyChanges(baseContext, changes)

    const modifiedRuleResults = executeRules({ context: modifiedContext as any })
    const modifiedScoreResult = calculateScore({ ruleResults: modifiedRuleResults } as any)

    const originalRuleResults = executeRules({ context: baseContext as any })
    const originalScoreResult = calculateScore({ ruleResults: originalRuleResults } as any)

    return {
      originalScore: originalScoreResult.overall.score,
      modifiedScore: modifiedScoreResult.overall.score,
      scoreChange: modifiedScoreResult.overall.score - originalScoreResult.overall.score,
      context: modifiedContext,
      scoreResult: modifiedScoreResult,
      changesApplied: changes,
    }
  }

  /**
   * 批量生成优化建议
   * 
   * @deprecated 实验性功能
   */
  async generateOptimizations(
    _context: FengShuiContext
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = []
    return suggestions
  }

  /**
   * 应用变更到上下文
   */
  private applyChanges(
    context: FengShuiContext,
    _changes: SimulationChange[]
  ): FengShuiContext {
    const modified = JSON.parse(JSON.stringify(context)) as FengShuiContext
    return modified
  }
}

/**
 * @deprecated 实验性功能，请使用 SimulationEngine 类
 */
export async function simulate(
  params: SimulationParams
): Promise<SimulationResult> {
  const engine = new SimulationEngine()
  return engine.simulate(params)
}
