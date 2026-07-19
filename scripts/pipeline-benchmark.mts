/**
 * Pipeline v1.0.0-h1 性能基准测试
 */
import { PipelineRegistry } from '../src/lib/bazi/pipeline/registry'
import { MemoryPipelineCache } from '../src/lib/bazi/pipeline/cache'
import { deepFreeze } from '../src/lib/bazi/pipeline/immutable'
import { PIPELINE_VERSION } from '../src/lib/bazi/pipeline/types'
import { getAnalysis } from '../src/lib/bazi/analysisCenter'
import type { BaZiPipelineStep, StepResult } from '../src/lib/bazi/pipeline/types'
import type { StepContext } from '../src/lib/bazi/pipeline/steps'
import type { BaZiChart, BirthInfo } from '../src/lib/bazi/types'
import type { BirthData } from '../src/lib/core'
// 触发 Steps 注册
import '../src/lib/bazi/pipeline/steps'

const birthData: BirthData = {
  birthday: '1990-01-15', birthTime: '08:30',
  gender: 'male', timezone: 'Asia/Shanghai', location: '上海', useTrueSolarTime: true,
}

async function runBenchmark() {
  const pipelineTotalStart = performance.now()

  // Step 0: AnalysisCenter
  const acStart = performance.now()
  const analysis = getAnalysis(birthData)
  const acTime = performance.now() - acStart

  // 依赖校验
  const { valid, errors } = PipelineRegistry.validateDependencyGraph()
  if (!valid) { console.error('Dependency validation failed:', errors); process.exit(1); }

  const cache = new MemoryPipelineCache({ maxEntries: 50, defaultTTL: 30 * 60 * 1000 })
  const chart: BaZiChart = analysis.chart

  const result: any = {
    success: true, birthData, chart, geJu: analysis.raw.geJu, xiYongShen: analysis.raw.xiYongShen,
    score: { overall: 60, strength: 50, balance: 50, pattern: 0 },
    knowledge: [],
    steps: [{ id: 'analysis-center', name: '排盘分析', status: 'completed', duration: acTime }],
    aiReport: null, includeAI: false, detailed: true, createdAt: Date.now(), version: PIPELINE_VERSION, duration: 0,
  }

  const ctx: StepContext = {
    chart, analysis, geJu: analysis.raw.geJu, xiYong: analysis.raw.xiYongShen,
    birthData, options: { detailed: true }, result, cache,
  }

  const stepTimings: { id: string; name: string; time: number; success: boolean }[] = []
  const allSteps = PipelineRegistry.getAll()

  for (const stepDef of allSteps) {
    if (stepDef.enabled && !stepDef.enabled(ctx)) continue
    const stepStart = performance.now()
    try {
      const stepResult = stepDef.execute(ctx)
      const elapsed = performance.now() - stepStart
      if (stepResult.success && stepResult.data) {
        for (const [key, value] of Object.entries(stepResult.data as Record<string, unknown>)) {
          ;(result as any)[key] = value
        }
      }
      stepTimings.push({ id: stepDef.id, name: stepDef.name, time: elapsed, success: true })
    } catch (err) {
      stepTimings.push({ id: stepDef.id, name: stepDef.name, time: performance.now() - stepStart, success: false })
    }
  }

  const totalTime = performance.now() - pipelineTotalStart
  const cacheStats = cache.getStats()
  const sorted = [...stepTimings].sort((a, b) => a.time - b.time)
  const fastest = sorted[0]
  const slowest = sorted[sorted.length - 1]
  const avgTime = stepTimings.reduce((s, t) => s + t.time, 0) / stepTimings.length
  let memUsage = 0
  try { memUsage = (performance as any).memory?.usedJSHeapSize || 0 } catch {}

  // JSON output
  const report = {
    pipelineVersion: PIPELINE_VERSION,
    pipelineTotalMs: +totalTime.toFixed(2),
    analysisCenterMs: +acTime.toFixed(2),
    stepCount: stepTimings.length,
    fastest: { id: fastest.id, name: fastest.name, ms: +fastest.time.toFixed(3) },
    slowest: { id: slowest.id, name: slowest.name, ms: +slowest.time.toFixed(3) },
    avgStepMs: +avgTime.toFixed(3),
    cacheHits: cacheStats.hits,
    cacheMisses: cacheStats.misses,
    memoryUsageMB: memUsage > 0 ? +(memUsage / 1024 / 1024).toFixed(2) : null,
    steps: stepTimings.map(t => ({ id: t.id, name: t.name, ms: +t.time.toFixed(3), success: t.success })),
  }
  console.log(JSON.stringify(report, null, 2))
}

runBenchmark().catch(console.error)
