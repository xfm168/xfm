/**
 * Acceptance Gate - 最终验收门
 * V4.8.1 Final 补充规范
 *
 * 每个模块完成后必须通过 6 项验收才能进入下一模块（Acceptance First 原则）：
 *   ① Accuracy Report       算法准确率报告
 *   ② Boundary Acceptance   边界专项验收
 *   ③ Performance           性能验收
 *   ④ Code Review           代码审计
 *   ⑤ Documentation         文档验收
 *   ⑥ Freeze                最终冻结
 *
 * 研发流程：Requirement → Design → Implementation → Testing → Benchmark
 *           → Regression → Documentation → Acceptance → Freeze → Next Phase
 *
 * 任何模块不得跳阶段。
 */

export type AcceptanceCheckId =
  | 'accuracy'
  | 'boundary'
  | 'performance'
  | 'code-review'
  | 'documentation'
  | 'freeze'

export interface AcceptanceCheck {
  /** 验收项ID */
  id: AcceptanceCheckId
  /** 名称 */
  name: string
  /** 是否通过 */
  passed: boolean
  /** 详情 */
  detail: string
  /** 关键指标 */
  metrics?: Record<string, string | number | boolean>
}

export interface AcceptanceGateResult {
  /** 模块 */
  module: string
  /** 基线 */
  baseline: string
  /** 版本（Patch号） */
  version: string
  /** 是否全部通过（Acceptance Gate） */
  accepted: boolean
  /** 验收项 */
  checks: AcceptanceCheck[]
  /** 时间戳 */
  timestamp: number
}

/** 验收项顺序（不可跳阶段） */
export const ACCEPTANCE_CHECK_ORDER: AcceptanceCheckId[] = [
  'accuracy',
  'boundary',
  'performance',
  'code-review',
  'documentation',
  'freeze',
]

/** 运行验收门 */
export function runAcceptanceGate(
  module: string,
  baseline: string,
  version: string,
  checks: AcceptanceCheck[],
): AcceptanceGateResult {
  // 验证验收项齐全（6项不得跳阶段）
  const presentIds = new Set(checks.map(c => c.id))
  const missing = ACCEPTANCE_CHECK_ORDER.filter(id => !presentIds.has(id))
  const allPassed = checks.every(c => c.passed) && missing.length === 0

  return {
    module,
    baseline,
    version,
    accepted: allPassed,
    checks,
    timestamp: Date.now(),
  }
}

/** 格式化验收报告（用于CI日志/交付文档） */
export function formatAcceptanceReport(result: AcceptanceGateResult): string {
  const lines: string[] = []
  lines.push(`========== Acceptance Gate: ${result.module} ==========`)
  lines.push(`Baseline: ${result.baseline}`)
  lines.push(`Version:  ${result.version}`)
  lines.push(`Result:   ${result.accepted ? 'ACCEPTED ✓ → 可进入下一模块' : 'REJECTED ✗ → 禁止进入下一模块'}`)
  lines.push('')
  for (const id of ACCEPTANCE_CHECK_ORDER) {
    const c = result.checks.find(x => x.id === id)
    if (!c) {
      lines.push(`  ✗ [缺失] ${id}（跳阶段，违反 Acceptance First）`)
      continue
    }
    const mark = c.passed ? '✓' : '✗'
    lines.push(`  ${mark} ${c.name}: ${c.detail}`)
    if (c.metrics) {
      for (const [k, v] of Object.entries(c.metrics)) {
        lines.push(`      - ${k}: ${v}`)
      }
    }
  }
  lines.push('')
  if (result.accepted) {
    lines.push('✓ Acceptance Gate PASSED — 模块正式完成，可执行 Freeze 并进入下一阶段')
  } else {
    lines.push('✗ Acceptance Gate FAILED — 禁止进入下一模块')
  }
  lines.push('=================================================')
  return lines.join('\n')
}
