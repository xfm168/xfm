import { defaultTenGodBatchEngine, defaultTenGodClassifier, defaultTenGodEngine, TenGodClassifierInput } from '..'
import type { PerfReport, PerfReportItem } from './types'

const GANS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const ZHIS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const WUXING_MAP: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
  寅: '木', 卯: '木', 巳: '火', 午: '火', 辰: '土', 戌: '土', 丑: '土', 未: '土', 申: '金', 酉: '金', 亥: '水', 子: '水',
}
const WINTER_ZHIS = new Set(['子', '丑', '亥'])
const SUMMER_ZHIS = new Set(['巳', '午', '未'])

function mulberry32(seed: number) {
  let t = seed >>> 0
  return function () {
    t = (t + 0x6D2B79F5) >>> 0
    let r = t
    r = Math.imul(r ^ (r >>> 15), r | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor(sorted.length * p)))
  return sorted[idx]
}

export class PerfRunner {
  static makeSampleInput(seed: number): TenGodClassifierInput {
    const rand = mulberry32(seed)
    const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
    const fourPillars = Array.from({ length: 4 }, () => {
      const gan = pick(GANS)
      const zhi = pick(ZHIS)
      return { gan, zhi, ganWx: WUXING_MAP[gan], zhiWx: WUXING_MAP[zhi] }
    })
    const dayGan = fourPillars[2].gan
    const monthZhi = fourPillars[1].zhi
    const dayGanWuxing = WUXING_MAP[dayGan]
    const monthZhiWuxing = WUXING_MAP[monthZhi]
    return {
      dayGan,
      monthZhi,
      fourPillars,
      dayGanWuxing,
      monthZhiWuxing,
      dayStrength: Math.floor(rand() * 7) - 3,
      dayRootCount: Math.floor(rand() * 5),
      isWinterBorn: WINTER_ZHIS.has(monthZhi),
      isSummerBorn: SUMMER_ZHIS.has(monthZhi),
    }
  }

  static runPerfBatch(size: 100 | 500 | 1000 | 10000, label = 'classify'): PerfReportItem {
    const inputs = Array.from({ length: size }, (_, i) => PerfRunner.makeSampleInput(i))
    const timings: number[] = []
    const hasHrtime = typeof process !== 'undefined' && process.hrtime && process.hrtime.bigint

    let totalStart: bigint | number
    if (hasHrtime) totalStart = process.hrtime.bigint()
    else totalStart = Date.now()

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      let t0: bigint | number
      if (hasHrtime) t0 = process.hrtime.bigint()
      else t0 = Date.now()

      try {
        if (label === 'classify') {
          defaultTenGodClassifier.classify(input)
        } else {
          defaultTenGodEngine.evaluate(input)
        }
      } catch (_) {}

      let t1: bigint | number
      if (hasHrtime) {
        t1 = process.hrtime.bigint()
        timings.push(Number(t1 - (t0 as bigint)) / 1e6)
      } else {
        t1 = Date.now()
        timings.push((t1 as number) - (t0 as number))
      }
    }

    let totalMs: number
    if (hasHrtime) {
      const totalEnd = process.hrtime.bigint()
      totalMs = Number(totalEnd - (totalStart as bigint)) / 1e6
    } else {
      totalMs = Date.now() - (totalStart as number)
    }

    timings.sort((a, b) => a - b)
    const avgMs = size > 0 ? totalMs / size : 0
    const p50Ms = percentile(timings, 0.5)
    const p95Ms = percentile(timings, 0.95)
    const p99Ms = percentile(timings, 0.99)
    const maxMs = timings.length > 0 ? timings[timings.length - 1] : 0
    const withinBudget5ms = avgMs < 5 && p95Ms <= 5 && maxMs <= 50

    return {
      label: `${label}-${size}`,
      iterations: size,
      totalMs,
      avgMs,
      p50Ms,
      p95Ms,
      p99Ms,
      maxMs,
      withinBudget5ms,
    }
  }

  static runAll(): PerfReport {
    const sizes = [100, 500, 1000, 10000] as const
    const items: PerfReportItem[] = sizes.flatMap(n => [
      PerfRunner.runPerfBatch(n, 'classify'),
      PerfRunner.runPerfBatch(n, 'evaluate'),
    ])

    let overallVerdict: PerfReport['overallVerdict']
    const allPass = items.every(i => i.withinBudget5ms)
    const anyFail = items.some(i => i.avgMs > 50 || i.maxMs > 500)
    if (allPass) overallVerdict = 'PASS'
    else if (anyFail) overallVerdict = 'FAIL'
    else overallVerdict = 'WARN'

    return { items, generatedAt: new Date().toISOString(), overallVerdict }
  }
}

export default PerfRunner
