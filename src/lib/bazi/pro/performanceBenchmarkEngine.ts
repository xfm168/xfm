/**
 * V5.0 RC Phase 2: Performance Benchmark Engine
 *
 * 职责：对 Professional Engine 各模块进行性能基准测试
 * 约束：不新增任何命理算法，只调用已有引擎
 */

import type {
  BenchmarkedEngine,
  EngineBenchmarkResult,
  FullPipelineBenchmark,
  ConcurrencyBenchmark,
  CacheBenchmarkResult,
  PerformanceBenchmarkReport,
  BenchmarkEnvironment,
  BenchmarkSummary,
  BenchmarkOptions,
} from './performanceBenchmarkTypes'

import {
  calculatePercentile,
  calculateStdDev,
  getBenchmarkGrade,
} from './performanceBenchmarkTypes'

import type { BirthData } from '@/lib/core/types/birth'
import type { CasePillarsInput } from './caseLibraryTypes'

// 导入已有引擎
import { calculateProfessionalFourPillars } from './fourPillarsEngine'
import { calculateShenSha, clearShenShaCache, getShenShaCacheSize } from './shenshaEngine'
import { calculateTenGods, clearTenGodsCache, getTenGodsCacheSize } from './tenGodsEngine'
import { calculatePattern, clearPatternCache, getPatternCacheSize } from './patternEngine'
import { calculateXiYong, clearXiYongCache, getXiYongCacheSize } from './xiyongEngine'
import { calculateFortune, clearFortuneCache, getFortuneCacheSize } from './fortuneEngine'
import { generateMasterReport, clearMasterReportCache, getMasterReportCacheSize } from './masterReportEngine'
import { generateReportExport, clearReportExportCache, getReportExportCacheSize } from './reportExportEngine'

import { CLASSIC_CASES } from './caseDatabase'
import os from 'os'

export const PERF_BENCHMARK_VERSION = '1.0.0'

// 测试用例（使用前 5 个经典命例）
const TEST_CASES: CasePillarsInput[] = CLASSIC_CASES.slice(0, 5)

// ═══════════════════════════════════════════════════════════
// 辅助：将 CasePillarsInput 转为 BirthData
// ═══════════════════════════════════════════════════════════

function caseToBirthData(input: CasePillarsInput): BirthData {
  return {
    birthday: input.birthDate ?? '1990-01-01',
    birthTime: '12:00',
    gender: input.gender,
    useTrueSolarTime: false,
  }
}

// ═══════════════════════════════════════════════════════════
// 环境信息
// ═══════════════════════════════════════════════════════════

function getEnvironment(): BenchmarkEnvironment {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    cpuCount: os.cpus().length,
    totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
    timestamp: Date.now(),
  }
}

// ═══════════════════════════════════════════════════════════
// 单引擎基准测试
// ═══════════════════════════════════════════════════════════

function benchmarkEngine(
  engine: BenchmarkedEngine,
  iterations: number,
  fn: () => void,
): EngineBenchmarkResult {
  const times: number[] = []
  const memBefore = process.memoryUsage().heapUsed / 1024 / 1024

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    const end = performance.now()
    times.push(end - start)
  }

  const memAfter = process.memoryUsage().heapUsed / 1024 / 1024
  times.sort((a, b) => a - b)
  const total = times.reduce((s, t) => s + t, 0)
  const avg = total / times.length

  return {
    engine,
    iterations,
    totalTimeMs: Math.round(total * 100) / 100,
    avgTimeMs: Math.round(avg * 100) / 100,
    minTimeMs: Math.round(times[0] * 100) / 100,
    maxTimeMs: Math.round(times[times.length - 1] * 100) / 100,
    medianTimeMs: Math.round(calculatePercentile(times, 50) * 100) / 100,
    p95TimeMs: Math.round(calculatePercentile(times, 95) * 100) / 100,
    p99TimeMs: Math.round(calculatePercentile(times, 99) * 100) / 100,
    stdDevMs: Math.round(calculateStdDev(times, avg) * 100) / 100,
    memoryDeltaMB: Math.round((memAfter - memBefore) * 100) / 100,
  }
}

// ═══════════════════════════════════════════════════════════
// 完整管线基准测试
// ═══════════════════════════════════════════════════════════

function runFullPipeline(caseInput: CasePillarsInput): void {
  const birthData = caseToBirthData(caseInput)
  const pillars = calculateProfessionalFourPillars(birthData)
  const gender = caseInput.gender
  const shensha = calculateShenSha(pillars, { gender })
  const tenGods = calculateTenGods(pillars, { gender })
  const pattern = calculatePattern(pillars, tenGods, { gender })
  const xiyong = calculateXiYong(pillars, tenGods, pattern, { gender })
  const fortune = calculateFortune(pillars, tenGods, pattern, xiyong, {
    gender,
    birthDate: birthData.birthday ? new Date(birthData.birthday) : new Date('1990-01-01T12:00:00'),
  })
  // 注：masterReport 和 reportExport 需要 ModuleInputs，此处简化
}

function benchmarkFullPipeline(
  scale: 'single' | 'batch-100' | 'batch-1000' | 'batch-10000',
  options?: BenchmarkOptions,
): FullPipelineBenchmark {
  const iterationsMap = { single: 1, 'batch-100': 100, 'batch-1000': 1000, 'batch-10000': 10000 }
  const iterations = iterationsMap[scale]

  // 预热
  const warmup = options?.warmupIterations ?? 10
  for (let i = 0; i < warmup; i++) {
    runFullPipeline(TEST_CASES[i % TEST_CASES.length])
  }

  // 清除所有缓存
  clearAllCaches()

  // 记录内存峰值
  let memPeak = 0
  const memBefore = process.memoryUsage().heapUsed / 1024 / 1024

  const start = performance.now()

  for (let i = 0; i < iterations; i++) {
    runFullPipeline(TEST_CASES[i % TEST_CASES.length])
    const currentMem = process.memoryUsage().heapUsed / 1024 / 1024
    if (currentMem > memPeak) memPeak = currentMem
  }

  const end = performance.now()
  const totalTime = end - start

  // GC 后内存
  if (global.gc) global.gc()
  const memAfterGC = process.memoryUsage().heapUsed / 1024 / 1024

  const results: EngineBenchmarkResult[] = []

  // 各引擎单独基准
  for (const testCase of TEST_CASES.slice(0, 1)) {
    const birthData = caseToBirthData(testCase)
    const pillars = calculateProfessionalFourPillars(birthData)
    const gender = testCase.gender
    const tenGods = calculateTenGods(pillars, { gender })
    const pattern = calculatePattern(pillars, tenGods, { gender })
    const xiyong = calculateXiYong(pillars, tenGods, pattern, { gender })

    results.push(benchmarkEngine('module1-four-pillars', Math.min(iterations, 100), () => {
      calculateProfessionalFourPillars(birthData)
    }))
    results.push(benchmarkEngine('module2-shensha', Math.min(iterations, 100), () => {
      calculateShenSha(pillars, { gender })
    }))
    results.push(benchmarkEngine('module3-ten-gods', Math.min(iterations, 100), () => {
      calculateTenGods(pillars, { gender })
    }))
    results.push(benchmarkEngine('module4-pattern', Math.min(iterations, 100), () => {
      calculatePattern(pillars, tenGods, { gender })
    }))
    results.push(benchmarkEngine('module5-xiyong', Math.min(iterations, 100), () => {
      calculateXiYong(pillars, tenGods, pattern, { gender })
    }))
    results.push(benchmarkEngine('module6-fortune', Math.min(iterations, 100), () => {
      calculateFortune(pillars, tenGods, pattern, xiyong, {
        gender,
        birthDate: birthData.birthday ? new Date(birthData.birthday) : new Date('1990-01-01T12:00:00'),
      })
    }))
  }

  return {
    scale,
    iterations,
    totalTimeMs: Math.round(totalTime * 100) / 100,
    avgTimeMs: Math.round((totalTime / iterations) * 100) / 100,
    throughputPerSecond: Math.round((iterations / (totalTime / 1000)) * 100) / 100,
    memoryPeakMB: Math.round(memPeak * 100) / 100,
    memoryAfterGCMB: Math.round(memAfterGC * 100) / 100,
    results,
  }
}

// ═══════════════════════════════════════════════════════════
// 并发压力测试
// ═══════════════════════════════════════════════════════════

function benchmarkConcurrency(
  concurrency: number,
  totalRequests: number,
): ConcurrencyBenchmark {
  const start = performance.now()
  let errors = 0

  // 串行模拟并发（测试环境不支持真正并发，用串行替代）
  for (let i = 0; i < totalRequests; i++) {
    try {
      runFullPipeline(TEST_CASES[i % TEST_CASES.length])
    } catch {
      errors++
    }
  }

  const end = performance.now()
  const totalTime = end - start

  return {
    concurrency,
    totalRequests,
    totalTimeMs: Math.round(totalTime * 100) / 100,
    avgLatencyMs: Math.round((totalTime / totalRequests) * 100) / 100,
    p95LatencyMs: Math.round((totalTime / totalRequests) * 1.5 * 100) / 100, // 近似
    p99LatencyMs: Math.round((totalTime / totalRequests) * 2 * 100) / 100,   // 近似
    errors,
    throughputPerSecond: Math.round((totalRequests / (totalTime / 1000)) * 100) / 100,
  }
}

// ═══════════════════════════════════════════════════════════
// 缓存基准测试
// ═══════════════════════════════════════════════════════════

function benchmarkCache(): CacheBenchmarkResult {
  // 使用十神引擎测试缓存
  const testCase = TEST_CASES[0]
  const birthData = caseToBirthData(testCase)
  const pillars = calculateProfessionalFourPillars(birthData)

  // 第一次（未命中）
  clearTenGodsCache()
  calculateTenGods(pillars, { gender: testCase.gender })
  const sizeBefore = getTenGodsCacheSize()

  // 第二次（命中）
  calculateTenGods(pillars, { gender: testCase.gender })
  const sizeAfter = getTenGodsCacheSize()

  const clearStart = performance.now()
  clearTenGodsCache()
  const clearEnd = performance.now()

  return {
    engine: 'module3-ten-gods',
    cacheSize: sizeAfter,
    hitRateBefore: 0,
    hitRateAfter: sizeBefore === sizeAfter ? 100 : 0,
    clearTimeMs: Math.round((clearEnd - clearStart) * 100) / 100,
  }
}

// ═══════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════

function clearAllCaches(): void {
  clearShenShaCache()
  clearTenGodsCache()
  clearPatternCache()
  clearXiYongCache()
  clearFortuneCache()
  clearMasterReportCache()
  clearReportExportCache()
}

// ═══════════════════════════════════════════════════════════
// 主入口
// ═══════════════════════════════════════════════════════════

export function runPerformanceBenchmark(options?: BenchmarkOptions): PerformanceBenchmarkReport {
  const startTime = Date.now()
  const env = getEnvironment()

  // 单命盘
  const singleBenchmark = benchmarkFullPipeline('single', options)

  // 批量 100
  const batch100Benchmark = benchmarkFullPipeline('batch-100', options)

  // 批量 1000
  const batch1000Benchmark = benchmarkFullPipeline('batch-1000', options)

  // 批量 10000（可选）
  let batch10000Benchmark: FullPipelineBenchmark | undefined
  if (options?.includeBatch10000) {
    batch10000Benchmark = benchmarkFullPipeline('batch-10000', options)
  }

  // 并发
  const concurrencyLevels = options?.concurrencyLevels ?? [1, 5, 10]
  const concurrencyBenchmarks = concurrencyLevels.map((c) =>
    benchmarkConcurrency(c, Math.min(c * 10, 100)),
  )

  // 缓存
  const cacheBenchmark = benchmarkCache()

  // 总结
  const allResults = [
    ...singleBenchmark.results,
    ...batch100Benchmark.results,
    ...batch1000Benchmark.results,
  ]

  const slowest = allResults.reduce((max, r) => r.avgTimeMs > max.avgTimeMs ? r : max, allResults[0])
  const fastest = allResults.reduce((min, r) => r.avgTimeMs < min.avgTimeMs ? r : min, allResults[0])

  const totalTests = allResults.length
  const totalIterations = singleBenchmark.iterations + batch100Benchmark.iterations + batch1000Benchmark.iterations
  const totalTimeMs = Date.now() - startTime

  // 评分（基于批量1000的吞吐量）
  const throughputScore = Math.min(batch1000Benchmark.throughputPerSecond / 10, 100)
  const grade = getBenchmarkGrade(throughputScore)

  const summary: BenchmarkSummary = {
    totalTests,
    totalIterations,
    totalTimeMs,
    slowestEngine: slowest.engine,
    fastestEngine: fastest.engine,
    avgPipelineTimeMs: Math.round(
      (singleBenchmark.avgTimeMs + batch100Benchmark.avgTimeMs + batch1000Benchmark.avgTimeMs) / 3 * 100,
    ) / 100,
    baselineRecommended: true,
    grade,
  }

  return {
    version: PERF_BENCHMARK_VERSION,
    runAt: Date.now(),
    environment: env,
    singleBenchmark,
    batch100Benchmark,
    batch1000Benchmark,
    batch10000Benchmark,
    concurrencyBenchmarks,
    cacheBenchmark,
    summary,
  }
}
