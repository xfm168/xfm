/**
 * P1 Pipeline Steps — P1 规则的 PipelineStep 定义
 *
 * P1 原则：Engine 永远不改，所有新功能通过 pipeline.addStep() 注册
 *
 * 使用方式（在 engine.ts 外部）：
 *   import { createP1Steps } from './detector/pipelineSteps'
 *   const p1Steps = createP1Steps()
 *   for (const step of p1Steps) pipeline.addStep(step)
 *
 * 执行顺序：
 * 1. ConflictDetector（冲 > 刑 > 害 > 破）
 * 2. HeHuaDetector（三会 > 三合 > 半合 > 六合 > 天干五合）
 * 3. QiTransformer 执行所有命令
 */

import type { PipelineStep, QiPipelineContext, QiNode, SeasonCommand } from '../types'
import { detectConflicts } from './conflictDetector'
import { detectHeHua } from './heHuaDetector'
import { evaluateCompetition } from './competitionEvaluator'
import { transformAll } from './qiTransformer'
import { transformSeasonCommands } from './seasonTransformer'

/**
 * 创建 P1 全部 Pipeline Steps
 *
 * 返回 5 个步骤：
 * Step 1: ConflictDetect   — 检测冲刑害破，存入 cache
 * Step 2: HeHuaDetect      — 检测合化，存入 cache
 * Step 3: CompetitionEvaluate — 评估竞争关系，确定生效命令
 * Step 4: SeasonTransform  — 执行月令司令命令（得令/退令/墓气）
 * Step 5: P1Transform      — 统一转换+执行冲刑害破与合化
 */
export function createP1Steps(): PipelineStep[] {
  return [
    {
      name: 'ConflictDetect',
      run: (qiNodes: QiNode[], pCtx: QiPipelineContext) => {
        const commands = detectConflicts(qiNodes)
        pCtx.cache.set('conflictCommands', commands)
        return qiNodes  // 只检测，不修改
      },
    },
    {
      name: 'HeHuaDetect',
      run: (qiNodes: QiNode[], pCtx: QiPipelineContext) => {
        const commands = detectHeHua(qiNodes, pCtx.ctx)
        pCtx.cache.set('heHuaCommands', commands)
        return qiNodes  // 只检测，不修改
      },
    },
    {
      name: 'CompetitionEvaluate',
      run: (qiNodes: QiNode[], pCtx: QiPipelineContext) => {
        const conflictCommands = (pCtx.cache.get('conflictCommands') as any[]) || []
        const heHuaCommands = (pCtx.cache.get('heHuaCommands') as any[]) || []
        const seasonCommands = (pCtx.cache.get('seasonCommands') as SeasonCommand[]) || []
        const pillarBranchMap = (pCtx.cache.get('pillarBranchMap') as Map<string, string>) || undefined

        const result = evaluateCompetition(conflictCommands, heHuaCommands, qiNodes, seasonCommands, pillarBranchMap)
        pCtx.cache.set('activeConflicts', result.activeConflicts)
        pCtx.cache.set('activeHeHuas', result.activeHeHuas)
        pCtx.cache.set('suppressedCommands', result.suppressed)
        pCtx.cache.set('scoreBreakdowns', result.scoreBreakdowns)

        return qiNodes  // 只检测，不修改
      },
    },
    {
      name: 'SeasonTransform',
      run: (qiNodes: QiNode[], pCtx: QiPipelineContext) => {
        const exec = pCtx.executor
        exec.begin()

        const seasonCommands = (pCtx.cache.get('seasonCommands') as SeasonCommand[]) || []
        const operations = transformSeasonCommands(seasonCommands, qiNodes)
        if (operations.length > 0) {
          const result = exec.execute(operations, 'SeasonTransform')
          exec.commit()
          return result
        }

        exec.commit()
        return qiNodes
      },
    },
    {
      name: 'P1Transform',
      run: (qiNodes: QiNode[], pCtx: QiPipelineContext) => {
        const exec = pCtx.executor
        exec.begin()

        const conflictCommands = (pCtx.cache.get('activeConflicts') as any[]) || []
        const heHuaCommands = (pCtx.cache.get('activeHeHuas') as any[]) || []

        const operations = transformAll(heHuaCommands, conflictCommands, qiNodes)
        const result = exec.execute(operations, 'P1Transform')
        exec.commit()

        return result
      },
    },
  ]
}
