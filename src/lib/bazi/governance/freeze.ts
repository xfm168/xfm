/**
 * Freeze - 最终冻结
 * V4.8.1 Final 补充规范
 *
 * 模块通过 Acceptance Gate 后执行：
 *   - Git Tag（版本标记）
 *   - Snapshot Freeze（版本快照冻结）
 *   - Rule Freeze（规则冻结）
 *   - Rule Pack Freeze（规则包冻结）
 *
 * 冻结后任何修改统一走 Patch（如 P0-①-p1），禁止直接修改正式版本。
 */

export interface FreezeResult {
  /** 模块 */
  module: string
  /** 版本标签 */
  tag: string
  /** Git Tag 是否成功（无git环境时为 skip） */
  gitTagged: boolean | 'skipped'
  /** Snapshot 是否已冻结 */
  snapshotFrozen: boolean
  /** 全部 Rule 是否已冻结 */
  rulesFrozen: boolean
  /** Rule Pack 是否已冻结 */
  packFrozen: boolean
  /** 是否完成冻结 */
  frozen: boolean
  /** 时间戳 */
  timestamp: number
}

/**
 * 执行模块冻结
 *
 * 注意：Git Tag 需在 CI 环境由 release 脚本执行；
 * 本函数验证冻结前置条件是否全部满足。
 */
export function freezeModule(params: {
  module: string
  tag: string
  snapshotFrozen: boolean
  rulesFrozen: boolean
  packFrozen: boolean
  gitTagged?: boolean | 'skipped'
}): FreezeResult {
  const gitTagged = params.gitTagged ?? 'skipped'
  const frozen = params.snapshotFrozen && params.rulesFrozen && params.packFrozen
  return {
    module: params.module,
    tag: params.tag,
    gitTagged,
    snapshotFrozen: params.snapshotFrozen,
    rulesFrozen: params.rulesFrozen,
    packFrozen: params.packFrozen,
    frozen,
    timestamp: Date.now(),
  }
}

/** 格式化冻结报告 */
export function formatFreezeReport(result: FreezeResult): string {
  const lines: string[] = []
  lines.push(`========== Freeze: ${result.module} ==========`)
  lines.push(`Tag:              ${result.tag}`)
  lines.push(`Git Tag:          ${result.gitTagged === true ? '✓ tagged' : result.gitTagged === 'skipped' ? '— skipped (no CI)' : '✗ failed'}`)
  lines.push(`Snapshot Freeze:  ${result.snapshotFrozen ? '✓' : '✗'}`)
  lines.push(`Rule Freeze:      ${result.rulesFrozen ? '✓' : '✗'}`)
  lines.push(`Rule Pack Freeze: ${result.packFrozen ? '✓' : '✗'}`)
  lines.push('')
  lines.push(result.frozen ? '✓ FREEZE COMPLETE — 版本已冻结，后续修改走 Patch' : '✗ FREEZE INCOMPLETE')
  lines.push('=======================================')
  return lines.join('\n')
}
