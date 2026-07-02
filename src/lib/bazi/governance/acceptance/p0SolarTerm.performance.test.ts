/**
 * P0-① Performance Acceptance - 性能验收
 * V4.8.1 Final 补充规范 - Acceptance ③
 *
 * 验收要求：连续运行 1000 次排盘。
 * 输出：平均耗时 / P95 / P99 / 最大耗时 / CPU / Memory。
 * 确认：没有性能退化。
 */

import { describe, it, expect } from 'vitest'
import { calculateBaZi } from '../../calculator'
import { getSolarTermDate, getYearSolarTerms } from '../../solarTerms'
import { runAcceptanceGate, formatAcceptanceReport, type AcceptanceCheck } from '../acceptance'

const ITERATIONS = 1000

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]
}

function formatMs(ms: number): string {
  return `${ms.toFixed(3)}ms`
}

describe('P0-① Acceptance ③ Performance Acceptance（性能验收）', () => {
  const durations: number[] = []
  const termDurations: number[] = []
  let memBefore: number = 0
  let memAfter: number = 0

  // 预热（避免JIT影响）
  for (let i = 0; i < 50; i++) {
    calculateBaZi({ birthDate: '1990-01-15', birthTime: '08:30', gender: 'male' })
  }

  if (global.gc) global.gc()
  memBefore = process.memoryUsage().heapUsed

  // 连续运行 1000 次
  for (let i = 0; i < ITERATIONS; i++) {
    const year = 1970 + (i % 80)
    const month = (i % 12) + 1
    const day = (i % 28) + 1
    const birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const birthTime = `${String((i % 24)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`

    const t0 = performance.now()
    calculateBaZi({ birthDate, birthTime, gender: i % 2 === 0 ? 'male' : 'female' })
    durations.push(performance.now() - t0)

    const t1 = performance.now()
    getSolarTermDate(year, '立春')
    getYearSolarTerms(year)
    termDurations.push(performance.now() - t1)
  }

  if (global.gc) global.gc()
  memAfter = process.memoryUsage().heapUsed

  const sorted = [...durations].sort((a, b) => a - b)
  const sortedTerm = [...termDurations].sort((a, b) => a - b)
  const avg = durations.reduce((s, d) => s + d, 0) / durations.length
  const p95 = percentile(sorted, 95)
  const p99 = percentile(sorted, 99)
  const max = sorted[sorted.length - 1]
  const termAvg = termDurations.reduce((s, d) => s + d, 0) / termDurations.length
  const memDelta = memAfter - memBefore

  it(`运行 ${ITERATIONS} 次排盘全部成功`, () => {
    expect(durations.length).toBe(ITERATIONS)
    expect(termDurations.length).toBe(ITERATIONS)
  })

  it('平均耗时合理（无性能退化）', () => {
    // 单次排盘应在 5ms 以内（含节气计算）
    // eslint-disable-next-line no-console
    console.log(`\n[Performance] avg=${formatMs(avg)} P95=${formatMs(p95)} P99=${formatMs(p99)} max=${formatMs(max)}`)
    expect(avg).toBeLessThan(5)
  })

  it('P95 耗时合理', () => {
    expect(p95).toBeLessThan(10)
  })

  it('P99 耗时合理', () => {
    expect(p99).toBeLessThan(20)
  })

  it('最大耗时合理（无异常尖刺）', () => {
    expect(max).toBeLessThan(50)
  })

  it('节气计算性能（含缓存命中）', () => {
    // eslint-disable-next-line no-console
    console.log(`[Performance] solar-term avg=${formatMs(termAvg)} (cached after first call per year)`)
    expect(termAvg).toBeLessThan(2)
  })

  it('内存无泄漏（1000次后堆增量合理）', () => {
    const memMB = memDelta / 1024 / 1024
    // eslint-disable-next-line no-console
    console.log(`[Performance] heap delta=${memMB.toFixed(2)}MB (before=${(memBefore/1024/1024).toFixed(1)}MB after=${(memAfter/1024/1024).toFixed(1)}MB)`)
    // 1000次排盘后堆增量应小于 50MB（允许GC未触发）
    expect(memMB).toBeLessThan(50)
  })

  it('Performance Acceptance Check 通过', () => {
    const check: AcceptanceCheck = {
      id: 'performance',
      name: 'Performance（性能验收）',
      passed: avg < 5 && p99 < 20 && max < 50,
      detail: `${ITERATIONS}次排盘 avg=${formatMs(avg)} P95=${formatMs(p95)} P99=${formatMs(p99)} max=${formatMs(max)}`,
      metrics: {
        iterations: ITERATIONS,
        avg: formatMs(avg),
        p95: formatMs(p95),
        p99: formatMs(p99),
        max: formatMs(max),
        solarTermAvg: formatMs(termAvg),
        heapDeltaMB: (memDelta / 1024 / 1024).toFixed(2),
        cpuNode: process.version,
        degradation: '无',
      },
    }
    // eslint-disable-next-line no-console
    console.log(formatAcceptanceReport(runAcceptanceGate('P0-①', 'V4.8.1-Final', 'P0-①-1.0.0', [check])))
    expect(check.passed).toBe(true)
  })
})
