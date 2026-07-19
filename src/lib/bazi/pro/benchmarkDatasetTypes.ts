/**
 * Benchmark Dataset Types
 *
 * 定义基准数据集相关类型
 */

/** 基准数据集规模 */
export type BenchmarkScale = 'top100' | 'top500' | 'top1000'

/** 基准数据集 */
export interface BenchmarkDataset {
  scale: BenchmarkScale
  caseIds: string[]
  createdAt: number
  description: string
}

/** 单次基准运行结果 */
export interface BenchmarkRunResult {
  datasetScale: BenchmarkScale
  totalCases: number
  passCount: number
  failCount: number
  passRate: number
  avgTimeMs: number
  details: BenchmarkCaseDetail[]
}

/** 单个案例的基准运行详情 */
export interface BenchmarkCaseDetail {
  caseId: string
  passed: boolean
  timeMs: number
  result: unknown
  error?: string
}

/** 基准测试综合报告 */
export interface BenchmarkReport {
  version: string
  runResults: BenchmarkRunResult[]
  summary: BenchmarkReportSummary
  generatedAt: number
}

/** 基准报告摘要 */
export interface BenchmarkReportSummary {
  totalDatasets: number
  totalCases: number
  overallPassCount: number
  overallFailCount: number
  overallPassRate: number
  avgTimeMs: number
}
