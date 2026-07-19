/**
 * Benchmark Dataset Engine
 *
 * 职责：
 *   - 创建不同规模的基准数据集
 *   - 运行基准测试并统计性能与通过率
 *   - 生成综合基准测试报告
 * 约束：
 *   - 不修改输入命例
 *   - 纯函数设计（除 runBenchmark 读取数据库外）
 */

import type { CaseEntryV2 } from './caseLibraryTypesV2'
import type {
  BenchmarkScale,
  BenchmarkDataset,
  BenchmarkRunResult,
  BenchmarkReport,
  BenchmarkCaseDetail,
  BenchmarkReportSummary,
} from './benchmarkDatasetTypes'
import { assignRegressionTier, getGoldCases, getSilverCases } from './regressionGoldEngine'
import { getCaseByIdV2 } from './caseDatabaseV2'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const BENCHMARK_DATASET_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 数据集创建
// ═══════════════════════════════════════════

/**
 * 创建基准数据集
 * @param scale - 数据集规模
 * @param cases - 可选命例池（不传则从数据库读取全部）
 * @returns BenchmarkDataset
 */
export function createBenchmarkDataset(
  scale: BenchmarkScale,
  cases?: CaseEntryV2[],
): BenchmarkDataset {
  const pool = cases ?? []
  const now = Date.now()

  let selected: CaseEntryV2[] = []

  switch (scale) {
    case 'top100': {
      // Gold + 高 reliability（>=80），按 qualityScore 降序取 100
      const candidates = pool.filter(
        (c) =>
          assignRegressionTier(c) === 'gold' ||
          c.reliability >= 80,
      )
      selected = candidates
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .slice(0, 100)
      break
    }
    case 'top500': {
      // Gold + Silver + reliability >= 60，按 qualityScore 降序取 500
      const tier = assignRegressionTier
      const candidates = pool.filter(
        (c) =>
          tier(c) === 'gold' ||
          tier(c) === 'silver' ||
          c.reliability >= 60,
      )
      selected = candidates
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .slice(0, 500)
      break
    }
    case 'top1000': {
      // 所有高质量案例（qualityScore >= 50），按 qualityScore 降序取 1000
      const candidates = pool.filter((c) => c.qualityScore >= 50)
      selected = candidates
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .slice(0, 1000)
      break
    }
  }

  return {
    scale,
    caseIds: selected.map((c) => c.caseId),
    createdAt: now,
    description: `Benchmark dataset: ${scale} with ${selected.length} cases`,
  }
}

// ═══════════════════════════════════════════
// 3. 基准运行
// ═══════════════════════════════════════════

/**
 * 引擎函数返回结果结构
 */
export interface EngineRunResult {
  passed: boolean
  result?: unknown
}

/**
 * 运行基准测试
 * @param dataset - 基准数据集
 * @param engineFn - 引擎函数，接受命例返回 { passed, result }
 * @returns BenchmarkRunResult
 */
export function runBenchmark(
  dataset: BenchmarkDataset,
  engineFn: (entry: CaseEntryV2) => EngineRunResult,
): BenchmarkRunResult {
  let passCount = 0
  let failCount = 0
  let totalTimeMs = 0
  const details: BenchmarkCaseDetail[] = []

  for (const caseId of dataset.caseIds) {
    const entry = getCaseByIdV2(caseId)
    const start = performance.now()

    if (!entry) {
      failCount++
      totalTimeMs += performance.now() - start
      details.push({
        caseId,
        passed: false,
        timeMs: 0,
        result: null,
        error: 'Case not found in database',
      })
      continue
    }

    try {
      const runResult = engineFn(entry)
      const timeMs = performance.now() - start
      totalTimeMs += timeMs

      if (runResult.passed) {
        passCount++
      } else {
        failCount++
      }

      details.push({
        caseId,
        passed: runResult.passed,
        timeMs: Math.round(timeMs),
        result: runResult.result ?? null,
      })
    } catch (error) {
      const timeMs = performance.now() - start
      totalTimeMs += timeMs
      failCount++
      details.push({
        caseId,
        passed: false,
        timeMs: Math.round(timeMs),
        result: null,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const totalCases = dataset.caseIds.length
  const passRate = totalCases > 0 ? Math.round((passCount / totalCases) * 1000) / 1000 : 0
  const avgTimeMs = totalCases > 0 ? Math.round(totalTimeMs / totalCases) : 0

  return {
    datasetScale: dataset.scale,
    totalCases,
    passCount,
    failCount,
    passRate,
    avgTimeMs,
    details,
  }
}

// ═══════════════════════════════════════════
// 4. 报告生成
// ═══════════════════════════════════════════

/**
 * 生成基准测试综合报告
 * @param results - 多次运行结果
 * @returns BenchmarkReport
 */
export function generateBenchmarkReport(results: BenchmarkRunResult[]): BenchmarkReport {
  const now = Date.now()

  let totalCases = 0
  let overallPassCount = 0
  let overallFailCount = 0
  let totalAvgTime = 0

  for (const r of results) {
    totalCases += r.totalCases
    overallPassCount += r.passCount
    overallFailCount += r.failCount
    totalAvgTime += r.avgTimeMs
  }

  const totalDatasets = results.length
  const overallPassRate = totalCases > 0
    ? Math.round((overallPassCount / totalCases) * 1000) / 1000
    : 0
  const avgTimeMs = totalDatasets > 0 ? Math.round(totalAvgTime / totalDatasets) : 0

  const summary: BenchmarkReportSummary = {
    totalDatasets,
    totalCases,
    overallPassCount,
    overallFailCount,
    overallPassRate,
    avgTimeMs,
  }

  return {
    version: BENCHMARK_DATASET_VERSION,
    runResults: results,
    summary,
    generatedAt: now,
  }
}

// ═══════════════════════════════════════════
// 5. 官方预设数据集
// ═══════════════════════════════════════════

/**
 * 获取官方预设基准数据集（基于当前数据库全部命例）
 * @returns Top100 / Top500 / Top1000 数据集数组
 */
export function getOfficialBenchmarkDatasets(): BenchmarkDataset[] {
  // 由于不引入额外依赖，使用空数组作为输入池
  // 调用方应自行传入全部命例后再创建
  return [
    createBenchmarkDataset('top100'),
    createBenchmarkDataset('top500'),
    createBenchmarkDataset('top1000'),
  ]
}

/**
 * 基于命例池获取官方预设基准数据集
 * @param cases - 命例池
 * @returns Top100 / Top500 / Top1000 数据集数组
 */
export function getOfficialBenchmarkDatasetsFromPool(cases: CaseEntryV2[]): BenchmarkDataset[] {
  return [
    createBenchmarkDataset('top100', cases),
    createBenchmarkDataset('top500', cases),
    createBenchmarkDataset('top1000', cases),
  ]
}
