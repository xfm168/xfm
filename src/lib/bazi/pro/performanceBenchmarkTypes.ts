/**
 * V5.0 RC Phase 2: Performance Benchmark Engine — 类型定义
 *
 * 职责：定义性能测试指标、基准报告、压力测试配置
 */

/** 测试规模 */
export type BenchmarkScale = 'single' | 'batch-100' | 'batch-1000' | 'batch-10000'

/** 引擎名称 */
export type BenchmarkedEngine =
  | 'module1-four-pillars'
  | 'module2-shensha'
  | 'module3-ten-gods'
  | 'module4-pattern'
  | 'module5-xiyong'
  | 'module6-fortune'
  | 'module7-master-report'
  | 'module8-report-export'
  | 'full-pipeline'

/** 单项引擎测试结果 */
export interface EngineBenchmarkResult {
  engine: BenchmarkedEngine
  iterations: number
  totalTimeMs: number
  avgTimeMs: number
  minTimeMs: number
  maxTimeMs: number
  medianTimeMs: number
  p95TimeMs: number
  p99TimeMs: number
  stdDevMs: number
  memoryDeltaMB: number
  cacheHitRate?: number
}

/** 完整管线基准结果 */
export interface FullPipelineBenchmark {
  scale: BenchmarkScale
  iterations: number
  totalTimeMs: number
  avgTimeMs: number
  throughputPerSecond: number
  memoryPeakMB: number
  memoryAfterGCMB: number
  results: EngineBenchmarkResult[]
}

/** 并发压力测试结果 */
export interface ConcurrencyBenchmark {
  concurrency: number
  totalRequests: number
  totalTimeMs: number
  avgLatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  errors: number
  throughputPerSecond: number
}

/** 性能基准报告 */
export interface PerformanceBenchmarkReport {
  version: string
  runAt: number
  environment: BenchmarkEnvironment
  singleBenchmark: FullPipelineBenchmark
  batch100Benchmark: FullPipelineBenchmark
  batch1000Benchmark: FullPipelineBenchmark
  batch10000Benchmark?: FullPipelineBenchmark  // 可选，如果太耗时不做
  concurrencyBenchmarks: ConcurrencyBenchmark[]
  cacheBenchmark: CacheBenchmarkResult
  summary: BenchmarkSummary
}

/** 缓存基准结果 */
export interface CacheBenchmarkResult {
  engine: string
  cacheSize: number
  hitRateBefore: number
  hitRateAfter: number
  clearTimeMs: number
}

/** 基准环境信息 */
export interface BenchmarkEnvironment {
  nodeVersion: string
  platform: string
  cpuCount: number
  totalMemoryMB: number
  timestamp: number
}

/** 基准总结 */
export interface BenchmarkSummary {
  totalTests: number
  totalIterations: number
  totalTimeMs: number
  slowestEngine: string
  fastestEngine: string
  avgPipelineTimeMs: number
  baselineRecommended: boolean
  grade: 'excellent' | 'good' | 'acceptable' | 'poor'
}

/** 基准测试选项 */
export interface BenchmarkOptions {
  includeBatch10000?: boolean
  concurrencyLevels?: number[]
  warmupIterations?: number
}

/** 工具函数 */
export function calculatePercentile(sortedTimes: number[], percentile: number): number {
  const index = Math.ceil((percentile / 100) * sortedTimes.length) - 1
  return sortedTimes[Math.max(0, index)]
}

export function calculateStdDev(times: number[], mean: number): number {
  const variance = times.reduce((s, t) => s + (t - mean) ** 2, 0) / times.length
  return Math.sqrt(variance)
}

export function getBenchmarkGrade(score: number): BenchmarkSummary['grade'] {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'acceptable'
  return 'poor'
}
