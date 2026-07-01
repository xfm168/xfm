/**
 * Benchmark - 基准对比
 * V4.8.1 Baseline
 *
 * 将算法输出与权威参考数据对比，计算一致率。
 * Error Code BZ-009: Benchmark 一致率低于阈值。
 */

export interface BenchmarkCase {
  /** 命例ID */
  id: string
  /** 算法输出 */
  actual: string | number
  /** 权威参考值 */
  expected: string | number
  /** 是否一致 */
  passed: boolean
  /** 偏差说明 */
  diff?: string
}

export interface BenchmarkResult {
  /** 基准名称 */
  name: string
  /** 总数 */
  total: number
  /** 通过数 */
  passed: number
  /** 失败数 */
  failed: number
  /** 一致率 0-100 */
  agreement: number
  /** 阈值（低于此值触发 BZ-009） */
  threshold: number
  /** 是否达标 */
  isHealthy: boolean
  /** 明细 */
  cases: BenchmarkCase[]
}

/** 运行基准对比 */
export function runBenchmark(
  name: string,
  cases: BenchmarkCase[],
  threshold: number = 100,
): BenchmarkResult {
  const passed = cases.filter(c => c.passed).length
  const failed = cases.length - passed
  const agreement = cases.length > 0 ? Math.round((passed / cases.length) * 100) : 0
  return {
    name,
    total: cases.length,
    passed,
    failed,
    agreement,
    threshold,
    isHealthy: agreement >= threshold,
    cases,
  }
}
