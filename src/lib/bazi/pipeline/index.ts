/** 八字 Pipeline — V4.4 Enterprise 注册式调度器 */
import { logger } from '../../../utils/logger'
import type {
  BaZiAnalysisOptions, BaZiPipelineResult, BaZiPipelineStep, BaZiPipelineInput,
  PipelineProgressCallback, PipelineProgressEvent, PipelineMetadata, StepResult,
} from './types'
import { getAnalysis } from '../analysisCenter'
import type { BirthInfo, BaZiChart } from '../types'
import type { BirthData } from '@/lib/core'
import { PipelineRegistry } from './registry'
import type { PipelineCache } from './cache'
import { MemoryPipelineCache } from './cache'
import { deepFreeze } from './immutable'
import { emptyHooks, type PipelineHooks } from './hooks'
import { PIPELINE_VERSION } from './types'
import type { StepContext } from './steps'

// Re-export 公共接口
export type {
  BaZiAnalysisOptions, BaZiPipelineResult, BaZiPipelineStep, BaZiScore, BaZiAIReport,
  PipelineProgressCallback, PipelineProgressEvent, PipelineMetadata, StepResult,
} from './types'
export { PipelineRegistry } from './registry'
export type { PipelineCache } from './cache'
export type { PipelineHooks } from './hooks'
export { emptyHooks } from './hooks'
export { PIPELINE_VERSION } from './types'
const pipelineLogger = logger.child('BaziPipeline')

/** 向后兼容入口 */
export async function runBaZiPipeline(
  birthInfo: BirthInfo, options: BaZiAnalysisOptions = {},
): Promise<BaZiPipelineResult> {
  const birthData: BirthData = {
    birthday: birthInfo.birthDate, birthTime: birthInfo.birthTime,
    gender: birthInfo.gender, timezone: birthInfo.timezone,
    location: birthInfo.region, useTrueSolarTime: birthInfo.solarTime,
  }
  return runBaZiPipelineFromBirthData({ birthData, options })
}

/** Pipeline 主入口 — 注册式 Step 调度 + hooks + 缓存 + 依赖校验 + 冻结 */
export async function runBaZiPipelineFromBirthData(
  input: BaZiPipelineInput,
  onProgress?: PipelineProgressCallback,
  hooks: PipelineHooks = emptyHooks,
): Promise<BaZiPipelineResult> {
  const { birthData, options = {} } = input
  const startTime = Date.now()
  const traceId = `bz-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const cache = new MemoryPipelineCache({ maxEntries: 50, defaultTTL: 30 * 60 * 1000 })

  hooks.beforePipeline?.({ birthData, cache, traceId })
  pipelineLogger.debug(`[${traceId}] Pipeline started`)

  // Step 1: 统一分析中心
  const analysis = getAnalysis(birthData)
  const chart: BaZiChart = analysis.chart

  // 依赖校验
  const { valid, errors } = PipelineRegistry.validateDependencyGraph()
  if (!valid) throw new Error(`Pipeline dependency validation failed: ${errors.join('; ')}`)

  // 初始化结果
  const result: BaZiPipelineResult = {
    success: true, birthData, chart, geJu: analysis.raw.geJu, xiYongShen: analysis.raw.xiYongShen,
    score: { overall: 60, strength: 50, balance: 50, pattern: 0 },
    knowledge: [],
    steps: [{ id: 'analysis-center', name: '排盘分析', status: 'completed', duration: Date.now() - startTime }],
    aiReport: null, includeAI: options.includeAI ?? false, detailed: options.detailed ?? false,
    createdAt: Date.now(), version: PIPELINE_VERSION, duration: 0,
  }
  const metadata: BaZiPipelineResult['metadata'] = {
    pipelineVersion: PIPELINE_VERSION, stepVersions: {}, executedSteps: ['analysis-center'], skippedSteps: [], totalTime: 0,
  }

  // 上下文
  const ctx: StepContext = { chart, analysis, geJu: analysis.raw.geJu, xiYong: analysis.raw.xiYongShen, birthData, options, result, cache }

  // 统计启用的 Step 数
  let enabledCount = 0
  const allSteps = PipelineRegistry.getAll()
  for (const stepDef of allSteps) {
    if (!stepDef.enabled || stepDef.enabled(ctx)) enabledCount++
  }
  if (enabledCount === 0) enabledCount = 1

  let completedSteps = 0
  const stepVersions: Record<string, number> = {}

  // Step 调度循环
  for (const stepDef of allSteps) {
    if (stepDef.enabled && !stepDef.enabled(ctx)) {
      metadata.skippedSteps.push(stepDef.id)
      continue
    }
    const stepStart = performance.now()
    const stepRecord: BaZiPipelineStep = { id: stepDef.id, name: stepDef.name, status: 'running', duration: 0 }
    result.steps.push(stepRecord)
    stepVersions[stepDef.id] = stepDef.version

    const hookCtx = { step: stepDef, result, context: { birthData, cache, traceId } }
    hooks.beforeStep?.(hookCtx)

    try {
      const stepResult = stepDef.execute(ctx)
      if (stepResult.success && stepResult.data) {
        for (const [key, value] of Object.entries(stepResult.data as Record<string, unknown>)) {
          ;(result as any)[key] = value
        }
      }
      if (stepResult.warnings?.length > 0) {
        pipelineLogger.debug(`[${traceId}][${stepDef.id}] warnings: ${stepResult.warnings.join(', ')}`)
      }
      const elapsed = Math.round(performance.now() - stepStart)
      stepRecord.status = 'completed'
      stepRecord.duration = elapsed
      metadata.executedSteps.push(stepDef.id)
      pipelineLogger.debug(`[${traceId}][${stepDef.id}] ${stepDef.name} ${elapsed}ms`)
      hooks.afterStep?.(hookCtx, stepRecord, elapsed)

      completedSteps++
      const progress = Math.round(5 + completedSteps / enabledCount * 95)
      onProgress?.({ stepId: stepDef.id, stepName: stepDef.name, progress, elapsed })
    } catch (err: unknown) {
      const elapsed = Math.round(performance.now() - stepStart)
      stepRecord.status = 'error'
      stepRecord.duration = elapsed
      const errMsg = err instanceof Error ? err.message : String(err)
      stepRecord.error = errMsg
      result.success = false
      result.error = `[${stepDef.id}] ${stepDef.name}: ${errMsg}`
      pipelineLogger.warn(`[${traceId}][${stepDef.id}] ${stepDef.name} 失败 ${elapsed}ms`, errMsg)
      hooks.onError?.(hookCtx, err instanceof Error ? err : new Error(errMsg), elapsed)
    }
  }

  // AI 报告占位
  if (options.includeAI) {
    result.steps.push({ id: 'ai-report', name: 'AI 报告', status: 'pending', duration: 0 })
  }

  // Metadata + 冻结
  const cacheStats = cache.getStats()
  metadata.totalTime = Date.now() - startTime
  metadata.pipelineStart = startTime
  metadata.pipelineEnd = Date.now()
  metadata.stepCount = metadata.executedSteps.length + metadata.skippedSteps.length
  metadata.cacheHits = cacheStats.hits
  metadata.cacheMisses = cacheStats.misses
  try { metadata.memoryUsage = (performance as any).memory?.usedJSHeapSize } catch {}
  result.metadata = metadata
  result.duration = metadata.totalTime

  deepFreeze(result)
  hooks.afterPipeline?.({ birthData, cache, traceId }, result)

  pipelineLogger.info(`[${traceId}] Pipeline completed`, `steps: ${metadata.executedSteps.length}, time: ${metadata.totalTime}ms`)
  return result
}
