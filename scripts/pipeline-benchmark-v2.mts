/**
 * Pipeline v1.0.0-h1 增强版 Benchmark
 * 分项测量：AnalysisCenter / Registry / Hook / Cache / Metadata / Freeze
 */
import { PipelineRegistry } from '../src/lib/bazi/pipeline/registry'
import { MemoryPipelineCache } from '../src/lib/bazi/pipeline/cache'
import { deepFreeze } from '../src/lib/bazi/pipeline/immutable'
import { emptyHooks } from '../src/lib/bazi/pipeline/hooks'
import type { PipelineHooks } from '../src/lib/bazi/pipeline/hooks'
import { PIPELINE_VERSION } from '../src/lib/bazi/pipeline/types'
import { getAnalysis } from '../src/lib/bazi/analysisCenter'
import type { BaZiPipelineStep } from '../src/lib/bazi/pipeline/types'
import type { StepContext } from '../src/lib/bazi/pipeline/steps'
import type { BaZiChart, BirthInfo } from '../src/lib/bazi/types'
import type { BirthData } from '../src/lib/core'
import '../src/lib/bazi/pipeline/steps'

const birthData: BirthData = {
  birthday: '1990-01-15', birthTime: '08:30',
  gender: 'male', timezone: 'Asia/Shanghai', location: '上海', useTrueSolarTime: true,
}

function bench(label: string, fn: () => void): number {
  const start = performance.now()
  fn()
  return performance.now() - start
}

async function main() {
  const totalStart = performance.now()

  // 1. Cache 初始化
  const cacheInitMs = bench('Cache Init', () => {
    new MemoryPipelineCache({ maxEntries: 50, defaultTTL: 30 * 60 * 1000 })
  })
  const cache = new MemoryPipelineCache({ maxEntries: 50, defaultTTL: 30 * 60 * 1000 })

  // 2. Hook 初始化
  const hookInitMs = bench('Hook Init', () => { emptyHooks })

  // 3. AnalysisCenter
  const acMs = bench('AnalysisCenter', () => { getAnalysis(birthData) })
  const analysis = getAnalysis(birthData)
  const chart: BaZiChart = analysis.chart

  // 4. Registry 校验
  const regMs = bench('Registry validate', () => { PipelineRegistry.validateDependencyGraph() })
  const { valid } = PipelineRegistry.validateDependencyGraph()

  // 5. Context + result 初始化
  const result: any = {
    success: true, birthData, chart, geJu: analysis.raw.geJu, xiYongShen: analysis.raw.xiYongShen,
    score: { overall: 60, strength: 50, balance: 50, pattern: 0 },
    knowledge: [], steps: [], aiReport: null, includeAI: false, detailed: true,
    createdAt: Date.now(), version: PIPELINE_VERSION, duration: 0,
  }

  const ctx: StepContext = {
    chart, analysis, geJu: analysis.raw.geJu, xiYong: analysis.raw.xiYongShen,
    birthData, options: { detailed: true }, result, cache,
  }

  // 6. Steps 执行
  const stepTimings: { id: string; name: string; ms: number; ok: boolean }[] = []
  const allSteps = PipelineRegistry.getAll()

  for (const stepDef of allSteps) {
    if (stepDef.enabled && !stepDef.enabled(ctx)) continue
    const ms = bench(`Step:${stepDef.id}`, () => {
      const r = stepDef.execute(ctx)
      if (r.success && r.data) {
        for (const [k, v] of Object.entries(r.data as Record<string, unknown>)) {
          ;(result as any)[k] = v
        }
      }
    })
    stepTimings.push({ id: stepDef.id, name: stepDef.name, ms, ok: true })
  }

  // 7. Metadata 构建
  const metaStart = performance.now()
  const metadata: any = {
    pipelineVersion: PIPELINE_VERSION, stepVersions: {}, executedSteps: [], skippedSteps: [], totalTime: 0,
    pipelineStart: Date.now(), pipelineEnd: Date.now(), stepCount: 0,
    cacheHits: 0, cacheMisses: 0, memoryUsage: 0, retryCount: 0,
  }
  const cacheStats = cache.getStats()
  metadata.cacheHits = cacheStats.hits
  metadata.cacheMisses = cacheStats.misses
  metadata.stepCount = stepTimings.length
  const metaMs = performance.now() - metaStart

  // 8. deepFreeze
  result.metadata = metadata
  const freezeMs = bench('deepFreeze', () => { deepFreeze(result) })

  const totalMs = performance.now() - totalStart

  // 统计
  const sorted = [...stepTimings].sort((a, b) => a.ms - b.ms)
  const fastest = sorted[0]
  const slowest = sorted[sorted.length - 1]
  const avgMs = stepTimings.reduce((s, t) => s + t.ms, 0) / stepTimings.length
  const stepsTotalMs = stepTimings.reduce((s, t) => s + t.ms, 0)
  let memUsage = 0
  try { memUsage = (performance as any).memory?.usedJSHeapSize || 0 } catch {}

  // JSON 输出
  console.log(JSON.stringify({
    _benchmark: 'Pipeline v1.0.0-h1 Enhanced Benchmark',
    _date: '2026-07-15',
    summary: {
      pipelineTotalMs: +totalMs.toFixed(3),
      analysisCenterMs: +acMs.toFixed(3),
      registryMs: +regMs.toFixed(3),
      hookInitMs: +hookInitMs.toFixed(3),
      cacheInitMs: +cacheInitMs.toFixed(3),
      metadataMs: +metaMs.toFixed(3),
      deepFreezeMs: +freezeMs.toFixed(3),
      stepsTotalMs: +stepsTotalMs.toFixed(3),
    },
    performance: {
      stepCount: stepTimings.length,
      fastest: { id: fastest.id, name: fastest.name, ms: +fastest.ms.toFixed(3) },
      slowest: { id: slowest.id, name: slowest.name, ms: +slowest.ms.toFixed(3) },
      avgStepMs: +avgMs.toFixed(3),
      cacheHits: cacheStats.hits,
      cacheMisses: cacheStats.misses,
      memoryUsageMB: memUsage > 0 ? +(memUsage / 1024 / 1024).toFixed(2) : null,
    },
    stepRanking: stepTimings
      .sort((a, b) => b.ms - a.ms)
      .map((t, i) => ({ rank: i + 1, id: t.id, name: t.name, ms: +t.ms.toFixed(3), pct: +(t.ms / stepsTotalMs * 100).toFixed(1) })),
  }, null, 2))
}

main().catch(console.error)
