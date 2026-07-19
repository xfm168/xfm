import { describe, it, expect } from 'vitest'
import { runPerformanceBenchmark, PERF_BENCHMARK_VERSION } from '../performanceBenchmarkEngine'
import type { PerformanceBenchmarkReport } from '../performanceBenchmarkTypes'
import { getBenchmarkGrade, calculatePercentile, calculateStdDev } from '../performanceBenchmarkTypes'

describe('V5.0 RC Phase 2: Performance Benchmark', () => {
  it('版本号应为 1.0.0', () => {
    expect(PERF_BENCHMARK_VERSION).toBe('1.0.0')
  })

  it('calculatePercentile 正确', () => {
    const sorted = [1, 2, 3, 4, 5]
    expect(calculatePercentile(sorted, 50)).toBe(3)
    expect(calculatePercentile(sorted, 95)).toBe(5)
  })

  it('calculateStdDev 正确', () => {
    const times = [10, 10, 10, 10, 10]
    expect(calculateStdDev(times, 10)).toBe(0)
  })

  it('getBenchmarkGrade 分级正确', () => {
    expect(getBenchmarkGrade(95)).toBe('excellent')
    expect(getBenchmarkGrade(80)).toBe('good')
    expect(getBenchmarkGrade(65)).toBe('acceptable')
    expect(getBenchmarkGrade(50)).toBe('poor')
  })

  it('runPerformanceBenchmark 返回完整报告', () => {
    const report = runPerformanceBenchmark({ warmupIterations: 3 })
    expect(report.version).toBe('1.0.0')
    expect(report.environment).toBeDefined()
    expect(report.environment.nodeVersion).toBeTruthy()
    expect(report.singleBenchmark).toBeDefined()
    expect(report.batch100Benchmark).toBeDefined()
    expect(report.batch1000Benchmark).toBeDefined()
    expect(report.concurrencyBenchmarks.length).toBeGreaterThan(0)
    expect(report.cacheBenchmark).toBeDefined()
    expect(report.summary).toBeDefined()
  })

  it('单命盘基准有结果', () => {
    const report = runPerformanceBenchmark({ warmupIterations: 3 })
    expect(report.singleBenchmark.iterations).toBe(1)
    expect(report.singleBenchmark.totalTimeMs).toBeGreaterThan(0)
    expect(report.singleBenchmark.results.length).toBeGreaterThan(0)
  })

  it('批量 100 基准有结果', () => {
    const report = runPerformanceBenchmark({ warmupIterations: 3 })
    expect(report.batch100Benchmark.iterations).toBe(100)
    expect(report.batch100Benchmark.totalTimeMs).toBeGreaterThan(0)
    expect(report.batch100Benchmark.throughputPerSecond).toBeGreaterThan(0)
  })

  it('批量 1000 基准有结果', () => {
    const report = runPerformanceBenchmark({ warmupIterations: 3 })
    expect(report.batch1000Benchmark.iterations).toBe(1000)
    expect(report.batch1000Benchmark.totalTimeMs).toBeGreaterThan(0)
    expect(report.batch1000Benchmark.throughputPerSecond).toBeGreaterThan(0)
  })

  it('并发基准有结果', () => {
    const report = runPerformanceBenchmark({ warmupIterations: 3 })
    for (const cb of report.concurrencyBenchmarks) {
      expect(cb.totalRequests).toBeGreaterThan(0)
      expect(cb.avgLatencyMs).toBeGreaterThan(0)
      expect(cb.errors).toBe(0)
    }
  })

  it('缓存基准有结果', () => {
    const report = runPerformanceBenchmark({ warmupIterations: 3 })
    expect(report.cacheBenchmark.engine).toBe('module3-ten-gods')
    expect(report.cacheBenchmark.cacheSize).toBeGreaterThanOrEqual(0)
  })

  it('总结数据正确', () => {
    const report = runPerformanceBenchmark({ warmupIterations: 3 })
    expect(report.summary.totalTests).toBeGreaterThan(0)
    expect(report.summary.totalIterations).toBeGreaterThan(0)
    expect(report.summary.slowestEngine).toBeTruthy()
    expect(report.summary.fastestEngine).toBeTruthy()
    expect(report.summary.avgPipelineTimeMs).toBeGreaterThan(0)
    expect(report.summary.baselineRecommended).toBe(true)
    expect(['excellent', 'good', 'acceptable', 'poor']).toContain(report.summary.grade)
  })
})
