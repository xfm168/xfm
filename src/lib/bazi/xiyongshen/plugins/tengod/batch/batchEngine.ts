import { defaultTenGodClassifier, type TenGodClassifier } from '../tengodClassifier'
import { defaultTenGodEngine, type TenGodEngine } from '../tengodEngine'

export interface TenGodBatchResult {
  items: any[]
  totalCount: number
  durationMs: number
  avgMsPerItem: number
  withinBudget: boolean
}

export interface TenGodBenchmarkResult {
  iterations: number
  totalMs: number
  avgMs: number
  p50Ms: number
  p95Ms: number
  maxMs: number
  within5msBudget: boolean
}

const DEFAULT_SAMPLE_INPUT = {
  dayGan: '甲',
  monthZhi: '寅',
  fourPillars: [
    { gan: '甲', zhi: '子' },
    { gan: '丙', zhi: '寅' },
    { gan: '甲', zhi: '辰' },
    { gan: '戊', zhi: '午' },
  ],
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor(sorted.length * p)))
  return sorted[idx]
}

export class TenGodBatchEngine {
  constructor(
    private classifier: TenGodClassifier = defaultTenGodClassifier,
    private engine: TenGodEngine = defaultTenGodEngine,
  ) {}

  classifyBatch(inputs: any[]): TenGodBatchResult {
    const start = process.hrtime.bigint()
    const items: any[] = []
    let maxSingle = 0
    for (const input of inputs) {
      const t0 = process.hrtime.bigint()
      try {
        items.push(this.classifier.classify(input))
      } catch (e) {
        items.push({ error: (e as Error).message })
      }
      const t1 = process.hrtime.bigint()
      const singleMs = Number(t1 - t0) / 1e6
      if (singleMs > maxSingle) maxSingle = singleMs
    }
    const end = process.hrtime.bigint()
    const durationMs = Number(end - start) / 1e6
    const totalCount = inputs.length
    const avgMsPerItem = totalCount > 0 ? durationMs / totalCount : 0
    const withinBudget = avgMsPerItem < 5 && maxSingle <= 5
    return {
      items,
      totalCount,
      durationMs,
      avgMsPerItem,
      withinBudget,
    }
  }

  evaluateBatch(inputs: any[]): TenGodBatchResult {
    const start = process.hrtime.bigint()
    const items: any[] = []
    let maxSingle = 0
    for (const input of inputs) {
      const t0 = process.hrtime.bigint()
      try {
        items.push(this.engine.evaluate(input))
      } catch (e) {
        items.push({ error: (e as Error).message })
      }
      const t1 = process.hrtime.bigint()
      const singleMs = Number(t1 - t0) / 1e6
      if (singleMs > maxSingle) maxSingle = singleMs
    }
    const end = process.hrtime.bigint()
    const durationMs = Number(end - start) / 1e6
    const totalCount = inputs.length
    const avgMsPerItem = totalCount > 0 ? durationMs / totalCount : 0
    const withinBudget = avgMsPerItem < 5 && maxSingle <= 5
    return {
      items,
      totalCount,
      durationMs,
      avgMsPerItem,
      withinBudget,
    }
  }

  benchmark(iterations = 100): TenGodBenchmarkResult {
    const perIteration: number[] = []
    const start = process.hrtime.bigint()
    for (let i = 0; i < iterations; i++) {
      const t0 = process.hrtime.bigint()
      try {
        this.engine.evaluate(DEFAULT_SAMPLE_INPUT)
      } catch (_) {
      }
      const t1 = process.hrtime.bigint()
      perIteration.push(Number(t1 - t0) / 1e6)
    }
    const end = process.hrtime.bigint()
    perIteration.sort((a, b) => a - b)
    const totalMs = Number(end - start) / 1e6
    const avgMs = iterations > 0 ? totalMs / iterations : 0
    const p50Ms = percentile(perIteration, 0.5)
    const p95Ms = percentile(perIteration, 0.95)
    const maxMs = perIteration.length > 0 ? perIteration[perIteration.length - 1] : 0
    const within5msBudget = avgMs < 5 && p95Ms <= 5
    return {
      iterations,
      totalMs,
      avgMs,
      p50Ms,
      p95Ms,
      maxMs,
      within5msBudget,
    }
  }
}

export const defaultTenGodBatchEngine = new TenGodBatchEngine()
