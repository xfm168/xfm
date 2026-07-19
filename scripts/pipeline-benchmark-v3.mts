/**
 * Pipeline v1.0.0-h1 Benchmark — 20 次运行取统计值
 */
import { PipelineRegistry } from '../src/lib/bazi/pipeline/registry'
import { MemoryPipelineCache } from '../src/lib/bazi/pipeline/cache'
import { deepFreeze } from '../src/lib/bazi/pipeline/immutable'
import { emptyHooks } from '../src/lib/bazi/pipeline/hooks'
import { PIPELINE_VERSION } from '../src/lib/bazi/pipeline/types'
import { getAnalysis } from '../src/lib/bazi/analysisCenter'
import type { StepContext } from '../src/lib/bazi/pipeline/steps'
import type { BaZiChart } from '../src/lib/bazi/types'
import type { BirthData } from '../src/lib/core'
import '../src/lib/bazi/pipeline/steps'

const birthData: BirthData = {
  birthday: '1990-01-15', birthTime: '08:30',
  gender: 'male', timezone: 'Asia/Shanghai', location: '上海', useTrueSolarTime: true,
}

function runOnce(): number {
  const start = performance.now()
  const analysis = getAnalysis(birthData)
  const chart = analysis.chart
  const cache = new MemoryPipelineCache({ maxEntries: 50, defaultTTL: 30 * 60 * 1000 })
  PipelineRegistry.validateDependencyGraph()

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
  for (const stepDef of PipelineRegistry.getAll()) {
    if (stepDef.enabled && !stepDef.enabled(ctx)) continue
    try {
      const r = stepDef.execute(ctx)
      if (r.success && r.data) {
        for (const [k, v] of Object.entries(r.data as Record<string, unknown>)) (result as any)[k] = v
      }
    } catch {}
  }
  deepFreeze(result)
  return performance.now() - start
}

// Warmup
for (let i = 0; i < 3; i++) runOnce()

// Benchmark 20 runs
const N = 20
const times: number[] = []
for (let i = 0; i < N; i++) times.push(runOnce())

times.sort((a, b) => a - b)
const sum = times.reduce((s, t) => s + t, 0)
const avg = sum / N
const min = times[0]
const max = times[N - 1]
const p50 = times[Math.floor(N * 0.5)]
const p95 = times[Math.floor(N * 0.95)]

console.log(JSON.stringify({
  runs: N,
  min: +min.toFixed(2),
  max: +max.toFixed(2),
  avg: +avg.toFixed(2),
  p50: +p50.toFixed(2),
  p95: +p95.toFixed(2),
  allTimes: times.map(t => +t.toFixed(2)),
  env: {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpu: process.cpuUsage ? 'available' : 'unknown',
  },
}, null, 2))
