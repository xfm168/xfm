/**
 * Pipeline Hook 生命周期 — V4.4 Enterprise
 * 
 * 提供扩展点，统计/日志/埋点/AI 监控不用修改 Step。
 */

import type { BaZiPipelineResult, BaZiPipelineStep } from './types'
import type { StepDefinition } from './steps'
import type { PipelineCache } from './cache'

export interface PipelineRunContext {
  birthData: unknown
  cache: PipelineCache
  traceId: string
}

export interface PipelineStepHookContext {
  step: StepDefinition
  result: BaZiPipelineResult
  context: PipelineRunContext
}

export interface PipelineHooks {
  beforePipeline?: (ctx: PipelineRunContext) => void
  afterPipeline?: (ctx: PipelineRunContext, result: BaZiPipelineResult) => void
  beforeStep?: (ctx: PipelineStepHookContext) => void
  afterStep?: (ctx: PipelineStepHookContext, stepRecord: BaZiPipelineStep, elapsed: number) => void
  onError?: (ctx: PipelineStepHookContext, error: Error, elapsed: number) => void
}

/** 默认空 Hook */
export const emptyHooks: PipelineHooks = {}

/** 合并多个 Hook（后面的覆盖前面的） */
export function mergeHooks(...hooks: PipelineHooks[]): PipelineHooks {
  const merged: PipelineHooks = {}
  for (const h of hooks) {
    if (h.beforePipeline) merged.beforePipeline = h.beforePipeline
    if (h.afterPipeline) merged.afterPipeline = h.afterPipeline
    if (h.beforeStep) merged.beforeStep = h.beforeStep
    if (h.afterStep) merged.afterStep = h.afterStep
    if (h.onError) merged.onError = h.onError
  }
  return merged
}