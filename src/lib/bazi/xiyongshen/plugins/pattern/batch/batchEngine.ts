import { PatternClassifier, AdvancedPatternEngine } from '..'
import type { PatternClassifierResult } from '../types'
import type { SubEngineInput, SubEngineResult } from '../../engines/types'

export interface BatchResult<T> {
  items: T[]
  totalCount: number
  durationMs: number
  avgMsPerItem: number
  withinBudget: boolean
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)))
  return sorted[idx]
}

export class PatternBatchEngine {
  private maxMs: number

  constructor(
    private classifier = new PatternClassifier(),
    private engine = new AdvancedPatternEngine(classifier),
    opts?: { budgetMs?: number }
  ) {
    this.maxMs = opts?.budgetMs ?? 5
  }

  classifyBatch(inputs: any[]): BatchResult<PatternClassifierResult> {
    const items: PatternClassifierResult[] = []
    const perItemDurations: number[] = []
    const totalStart = performance.now()
    let anyOverBudget = false

    for (const input of inputs) {
      const t0 = performance.now()
      const result = this.classifier.classify(input)
      const t1 = performance.now()
      const dur = t1 - t0
      perItemDurations.push(dur)
      if (dur > this.maxMs) anyOverBudget = true
      items.push(result)
    }

    const durationMs = performance.now() - totalStart
    const totalCount = items.length
    const avgMsPerItem = totalCount > 0 ? durationMs / totalCount : 0
    const withinBudget = !anyOverBudget && avgMsPerItem < this.maxMs

    return { items, totalCount, durationMs, avgMsPerItem, withinBudget }
  }

  evaluateBatch(inputs: SubEngineInput[]): BatchResult<SubEngineResult> {
    const items: SubEngineResult[] = []
    const totalStart = performance.now()
    let anyOverBudget = false

    for (const input of inputs) {
      const t0 = performance.now()
      const result = this.engine.evaluate(input)
      const t1 = performance.now()
      if (t1 - t0 > this.maxMs) anyOverBudget = true
      items.push(result)
    }

    const durationMs = performance.now() - totalStart
    const totalCount = items.length
    const avgMsPerItem = totalCount > 0 ? durationMs / totalCount : 0
    const withinBudget = !anyOverBudget && avgMsPerItem < this.maxMs

    return { items, totalCount, durationMs, avgMsPerItem, withinBudget }
  }

  benchmark(iterations = 100): {
    iterations: number
    totalMs: number
    avgMs: number
    p50Ms: number
    p95Ms: number
    maxMs: number
    within5msBudget: boolean
  } {
    const sampleInput: SubEngineInput = {
      dayGanWuxing: '木',
      monthZhiWuxing: '木',
      count: { '木': 5, '火': 1, '土': 1, '金': 0, '水': 1 },
      dayGan: '甲',
      monthZhi: '寅',
      fourPillars: [
        { gan: '甲', zhi: '子', ganWx: '木', zhiWx: '水' },
        { gan: '丙', zhi: '寅', ganWx: '火', zhiWx: '木' },
        { gan: '甲', zhi: '辰', ganWx: '木', zhiWx: '土' },
        { gan: '庚', zhi: '午', ganWx: '金', zhiWx: '火' },
      ],
      dayStrength: 3,
      dayRootCount: 3,
      isWinterBorn: false,
      isSummerBorn: false,
    }

    const durations: number[] = []
    const totalStart = performance.now()

    for (let i = 0; i < iterations; i++) {
      const t0 = performance.now()
      this.classifier.classify(sampleInput as any)
      const t1 = performance.now()
      durations.push(t1 - t0)
    }

    durations.sort((a, b) => a - b)
    const totalMs = performance.now() - totalStart

    return {
      iterations,
      totalMs,
      avgMs: totalMs / iterations,
      p50Ms: percentile(durations, 50),
      p95Ms: percentile(durations, 95),
      maxMs: durations[durations.length - 1] ?? 0,
      within5msBudget: (totalMs / iterations) < 5 && (percentile(durations, 95) < 5),
    }
  }
}

export const defaultPatternBatchEngine = new PatternBatchEngine()
