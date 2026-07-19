/**
 * Release Checklist Engine — 发布检查清单核心引擎
 *
 * 职责：
 *   - 执行 12 项自动化发布检查
 *   - 评估 Release Gate（release / hold / conditional）
 *   - 生成人类可读检查报告
 *   - 支持自定义自动化规则注册与模拟失败
 * 约束：
 *   - 默认 12 项处理器使用模拟数据（不触发真实编译/测试）
 *   - 不修改已有引擎数据（只读）
 */

import type {
  ChecklistItem,
  ChecklistItemStatus,
  ChecklistAutomationRule,
  ReleaseChecklist,
  ChecklistSummary,
  GateDecision,
  ReleaseGateOptions,
} from './releaseChecklistTypes'

import {
  DEFAULT_CHECKLIST_ITEMS,
} from './releaseChecklistTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const RELEASE_CHECKLIST_ENGINE_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 内部存储
// ═══════════════════════════════════════════

/** 自定义自动化检查规则 */
const automationRules: Map<string, ChecklistAutomationRule> = new Map()

/** 当前检查结果 */
let currentChecklist: ReleaseChecklist | null = null

/** 模拟失败的 itemId 集合 */
const simulatedFailures: Set<string> = new Set()

// ═══════════════════════════════════════════
// 3. 默认 12 项自动化处理器
// ═══════════════════════════════════════════

const DEFAULT_HANDLERS: Map<string, () => ChecklistItem> = new Map([
  ['chk-001', () => ({
    id: 'chk-001', name: 'TypeScript 编译零错误', category: 'quality',
    description: 'TS 编译器报告 0 错误', status: 'passed',
    required: true, automated: true, result: '0 errors found', durationMs: 0,
  })],
  ['chk-002', () => ({
    id: 'chk-002', name: 'Health Score >= 95', category: 'quality',
    description: '9 维健康评分 >= 95', status: 'passed',
    required: true, automated: true, result: 'Health Score: 95.0', durationMs: 0,
  })],
  ['chk-003', () => ({
    id: 'chk-003', name: '测试覆盖率达标', category: 'quality',
    description: '所有测试文件通过率 100%', status: 'passed',
    required: true, automated: true, result: 'All tests passed', durationMs: 0,
  })],
  ['chk-004', () => ({
    id: 'chk-004', name: '回归测试全通过', category: 'algorithm',
    description: 'Gold/Silver/Bronze 回归案例一致率 100%', status: 'passed',
    required: true, automated: true, result: 'Regression: 100%', durationMs: 0,
  })],
  ['chk-005', () => ({
    id: 'chk-005', name: '性能不低于基线', category: 'performance',
    description: '单次排盘耗时 <= 基线 +10%', status: 'passed',
    required: true, automated: true, result: 'Perf within baseline', durationMs: 0,
  })],
  ['chk-006', () => ({
    id: 'chk-006', name: 'Module 1~8 无修改', category: 'compliance',
    description: '冻结模块无任何代码变更', status: 'passed',
    required: true, automated: true, result: 'Module 1~8 unchanged', durationMs: 0,
  })],
  ['chk-007', () => ({
    id: 'chk-007', name: '缓存版本一致性', category: 'quality',
    description: '所有引擎缓存版本号一致', status: 'passed',
    required: true, automated: true, result: 'Cache versions consistent', durationMs: 0,
  })],
  ['chk-008', () => ({
    id: 'chk-008', name: '许可证检查', category: 'security',
    description: '企业版许可证密钥有效', status: 'passed',
    required: true, automated: true, result: 'Enterprise license valid', durationMs: 0,
  })],
  ['chk-009', () => ({
    id: 'chk-009', name: '多语言覆盖率 >= 95%', category: 'documentation',
    description: '各 locale 翻译覆盖率 >= 95%', status: 'passed',
    required: false, automated: true, result: 'Translation coverage: 96%', durationMs: 0,
  })],
  ['chk-010', () => ({
    id: 'chk-010', name: 'API 接口稳定性', category: 'compliance',
    description: 'index.ts 导出无 breaking change', status: 'passed',
    required: true, automated: true, result: 'No breaking changes', durationMs: 0,
  })],
  ['chk-011', () => ({
    id: 'chk-011', name: '专家验证通过率 >= 90%', category: 'quality',
    description: '专家审核通过率 >= 90%', status: 'passed',
    required: true, automated: true, result: 'Expert pass rate: 95%', durationMs: 0,
  })],
  ['chk-012', () => ({
    id: 'chk-012', name: '发布说明完整', category: 'documentation',
    description: 'ARCHITECTURE.md 版本行已更新', status: 'passed',
    required: true, automated: true, result: 'ARCHITECTURE.md updated', durationMs: 0,
  })],
])

// ═══════════════════════════════════════════
// 4. 核心函数
// ═══════════════════════════════════════════

/**
 * 执行 12 项发布检查
 *
 * 遍历 DEFAULT_CHECKLIST_ITEMS，对每项调用对应自动化处理器。
 * 如果 itemId 在 automationRules 中有自定义处理器则优先使用自定义。
 * 如果 itemId 在 simulatedFailures 中则强制 status = 'failed'。
 * skipCategories 中的 category 项标记为 'skipped'。
 *
 * @param options - Release Gate 选项
 * @returns ReleaseChecklist 完整检查结果
 */
export function runReleaseChecklist(options: ReleaseGateOptions): ReleaseChecklist {
  const { strictMode, skipCategories, version } = options
  const items: ChecklistItem[] = []

  for (const def of DEFAULT_CHECKLIST_ITEMS) {
    // 如果该 category 需要跳过
    if (skipCategories.includes(def.category)) {
      items.push({
        id: def.id,
        name: def.name,
        category: def.category,
        description: def.description,
        status: 'skipped',
        required: def.required,
        automated: def.automated,
        result: 'Skipped',
        durationMs: 0,
      })
      continue
    }

    // 优先使用自定义处理器，否则使用默认处理器
    const rule = automationRules.get(def.id)
    const handler = rule ? rule.handler : DEFAULT_HANDLERS.get(def.id)

    const startMs = Date.now()
    let item: ChecklistItem

    if (handler) {
      item = handler()
    } else {
      item = {
        id: def.id,
        name: def.name,
        category: def.category,
        description: def.description,
        status: 'pending',
        required: def.required,
        automated: def.automated,
        result: 'No handler registered',
        durationMs: 0,
      }
    }

    const elapsed = Date.now() - startMs
    item.durationMs = elapsed

    // 模拟失败覆盖
    if (simulatedFailures.has(def.id)) {
      item.status = 'failed'
      item.result = `[SIMULATED FAILURE] ${item.result}`
    }

    items.push(item)
  }

  // 计算汇总
  const summary = computeSummary(items)
  const failedItems = items.filter((i) => i.status === 'failed')
  const passedItems = items.filter((i) => i.status === 'passed')
  const activeItems = items.filter((i) => i.status !== 'skipped')
  const passRate = activeItems.length > 0
    ? Math.round((passedItems.length / activeItems.length) * 10000) / 100
    : 0
  const overallPassed = failedItems.length === 0
  const gateDecision = evaluateReleaseGate(
    { version, generatedAt: Date.now(), items, overallPassed, passRate, failedItems, gateDecision: 'release', summary },
    strictMode,
  )

  const checklist: ReleaseChecklist = {
    version,
    generatedAt: Date.now(),
    items,
    overallPassed,
    passRate,
    failedItems,
    gateDecision,
    summary,
  }

  currentChecklist = checklist
  return checklist
}

/**
 * 评估 Release Gate 决策
 *
 * - release: 全部 required 项 passed
 * - conditional: 有非 required 项 failed 但全部 required passed
 * - hold: 有 required 项 failed
 * - strictMode 下 conditional 也变为 hold
 *
 * @param checklist - 检查结果
 * @param strictMode - 是否严格模式
 * @returns GateDecision
 */
export function evaluateReleaseGate(checklist: ReleaseChecklist, strictMode: boolean): GateDecision {
  const requiredItems = checklist.items.filter((i) => i.required)
  const requiredFailed = requiredItems.filter((i) => i.status === 'failed')
  const nonRequiredFailed = checklist.items.filter((i) => !i.required && i.status === 'failed')

  if (requiredFailed.length > 0) {
    return 'hold'
  }

  if (nonRequiredFailed.length > 0) {
    return strictMode ? 'hold' : 'conditional'
  }

  return 'release'
}

/**
 * 获取单项检查状态
 *
 * @param checklist - 检查结果
 * @param itemId - 检查项 ID
 * @returns ChecklistItemStatus
 */
export function getChecklistItemStatus(checklist: ReleaseChecklist, itemId: string): ChecklistItemStatus {
  const item = checklist.items.find((i) => i.id === itemId)
  return item ? item.status : 'pending'
}

/**
 * 获取所有失败的检查项
 *
 * @param checklist - 检查结果
 * @returns ChecklistItem[]
 */
export function getFailedItems(checklist: ReleaseChecklist): ChecklistItem[] {
  return checklist.items.filter((i) => i.status === 'failed')
}

/**
 * 生成人类可读的检查报告
 *
 * @param checklist - 检查结果
 * @returns 格式化文本报告
 */
export function generateChecklistReport(checklist: ReleaseChecklist): string {
  const lines: string[] = []
  lines.push(`=== Release Checklist Report ===`)
  lines.push(`Version: ${checklist.version}`)
  lines.push(`Generated: ${new Date(checklist.generatedAt).toISOString()}`)
  lines.push(`Gate Decision: ${checklist.gateDecision}`)
  lines.push(`Overall Passed: ${checklist.overallPassed}`)
  lines.push(`Pass Rate: ${checklist.passRate}%`)
  lines.push(``)
  lines.push(`--- Summary ---`)
  lines.push(`Total: ${checklist.summary.total}`)
  lines.push(`Passed: ${checklist.summary.passed}`)
  lines.push(`Failed: ${checklist.summary.failed}`)
  lines.push(`Skipped: ${checklist.summary.skipped}`)
  lines.push(`Pending: ${checklist.summary.pending}`)
  lines.push(``)

  for (const item of checklist.items) {
    const statusMark = item.status === 'passed' ? '[PASS]'
      : item.status === 'failed' ? '[FAIL]'
      : item.status === 'skipped' ? '[SKIP]'
      : '[PEND]'
    const reqMark = item.required ? '*' : ' '
    lines.push(`${statusMark}${reqMark} ${item.id}: ${item.name}`)
    lines.push(`    ${item.result}`)
  }

  lines.push(``)
  lines.push(`=== End of Report ===`)
  return lines.join('\n')
}

/**
 * 注册自定义自动化检查规则
 *
 * 如果 itemId 已存在则覆盖。
 *
 * @param rule - 自动化规则
 */
export function registerChecklistAutomation(rule: ChecklistAutomationRule): void {
  automationRules.set(rule.itemId, rule)
}

/**
 * 获取检查汇总
 *
 * @param checklist - 检查结果
 * @returns ChecklistSummary
 */
export function getChecklistSummary(checklist: ReleaseChecklist): ChecklistSummary {
  return computeSummary(checklist.items)
}

/**
 * 模拟某项检查失败（测试辅助）
 *
 * @param itemId - 要模拟失败的检查项 ID
 */
export function simulateFailure(itemId: string): void {
  simulatedFailures.add(itemId)
}

/**
 * 重置所有模拟状态
 */
export function resetSimulation(): void {
  simulatedFailures.clear()
  automationRules.clear()
  currentChecklist = null
}

/**
 * 获取当前检查结果
 *
 * @returns ReleaseChecklist | null
 */
export function getCurrentChecklist(): ReleaseChecklist | null {
  return currentChecklist
}

// ═══════════════════════════════════════════
// 5. 内部辅助函数
// ═══════════════════════════════════════════

function computeSummary(items: ChecklistItem[]): ChecklistSummary {
  let passed = 0
  let failed = 0
  let skipped = 0
  let pending = 0

  for (const item of items) {
    switch (item.status) {
      case 'passed':
        passed++
        break
      case 'failed':
        failed++
        break
      case 'skipped':
        skipped++
        break
      case 'pending':
        pending++
        break
    }
  }

  return {
    total: items.length,
    passed,
    failed,
    skipped,
    pending,
  }
}
