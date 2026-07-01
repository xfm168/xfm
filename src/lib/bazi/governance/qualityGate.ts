/**
 * Quality Gate - 质量门
 * V4.8.1 Baseline
 *
 * CI 质量门：所有检查项必须通过，否则阻断 Merge。
 * 对应铁律：Regression First（回归未通过禁止 Merge）。
 */

export interface QualityCheck {
  /** 检查项ID */
  id: string
  /** 名称 */
  name: string
  /** 是否通过 */
  passed: boolean
  /** 详情 */
  detail: string
}

export interface QualityGateResult {
  /** 模块 */
  module: string
  /** 基线 */
  baseline: string
  /** 是否全部通过 */
  passed: boolean
  /** 检查项 */
  checks: QualityCheck[]
  /** 时间戳 */
  timestamp: number
}

/** 运行质量门 */
export function runQualityGate(
  module: string,
  baseline: string,
  checks: QualityCheck[],
): QualityGateResult {
  const passed = checks.every(c => c.passed)
  return {
    module,
    baseline,
    passed,
    checks,
    timestamp: Date.now(),
  }
}

/** 格式化质量门报告（用于CI日志） */
export function formatQualityGateReport(result: QualityGateResult): string {
  const lines: string[] = []
  lines.push(`========== Quality Gate: ${result.module} ==========`)
  lines.push(`Baseline: ${result.baseline}`)
  lines.push(`Result: ${result.passed ? 'PASSED ✓' : 'FAILED ✗'}`)
  lines.push('')
  for (const c of result.checks) {
    const mark = c.passed ? '✓' : '✗'
    lines.push(`  ${mark} ${c.name}: ${c.detail}`)
  }
  lines.push('')
  lines.push(result.passed ? '✓ Quality Gate PASSED' : '✗ Quality Gate FAILED — Merge Blocked')
  lines.push('===========================================')
  return lines.join('\n')
}
