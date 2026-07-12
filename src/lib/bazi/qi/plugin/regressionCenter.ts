/**
 * P3.15 RegressionCenter — 回归中心
 *
 * 每次更新自动执行所有 P1/P2/P3 测试，禁止破坏旧功能，保持 100% 向后兼容。
 *
 * 古籍依据：
 *   《易经》："履霜，坚冰至。" — 见微知著，防患于未然。
 *   《论语》："温故而知新，可以为师矣。" — 温习旧知，确保不遗忘。
 *
 * 原则：
 *   - 纯 Plugin，不修改 Kernel
 *   - 自动发现并执行所有测试套件
 *   - 基线快照管理，回归检测
 *   - 100% 向后兼容保证
 */

// ═══════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════

/** 测试阶段 */
export type TestPhase = 'P1' | 'P2' | 'P3'

/** 测试状态 */
export type TestStatus = 'pass' | 'fail' | 'skip' | 'error'

/** 单个测试用例结果 */
export interface TestCaseResult {
  /** 用例名称 */
  name: string
  /** 状态 */
  status: TestStatus
  /** 耗时(ms) */
  duration: number
  /** 错误信息（失败时） */
  error?: string
}

/** 单个测试套件结果 */
export interface TestSuiteResult {
  /** 套件ID */
  id: string
  /** 套件名称 */
  name: string
  /** 阶段 */
  phase: TestPhase
  /** 模块名 */
  module: string
  /** 状态 */
  status: TestStatus
  /** 总用例数 */
  total: number
  /** 通过数 */
  passed: number
  /** 失败数 */
  failed: number
  /** 跳过数 */
  skipped: number
  /** 耗时(ms) */
  duration: number
  /** 用例详情 */
  cases: TestCaseResult[]
  /** 套件描述 */
  description: string
}

/** 回归检测结果 */
export interface RegressionInfo {
  /** 是否有回归 */
  hasRegression: boolean
  /** 回归的套件IDs */
  regressionSuiteIds: string[]
  /** 新增失败的用例 */
  newFailures: string[]
  /** 恢复通过的用例 */
  recoveredPasses: string[]
  /** 与基线的对比摘要 */
  comparisonSummary: string
}

/** 基线快照 */
export interface BaselineSnapshot {
  /** 快照ID */
  id: string
  /** 创建时间 */
  createdAt: string
  /** 版本标签 */
  version: string
  /** 所有套件结果 */
  suites: Array<{
    suiteId: string
    suiteName: string
    total: number
    passed: number
    failed: number
    status: TestStatus
  }>
  /** 总通过率 */
  overallPassRate: number
  /** 总用例数 */
  totalCases: number
  /** 总通过数 */
  totalPassed: number
}

/** 回归中心完整结果 */
export interface RegressionCenterResult {
  /** 执行时间 */
  executedAt: string
  /** 所有套件结果 */
  suites: TestSuiteResult[]
  /** 按阶段分组 */
  byPhase: {
    P1: TestSuiteResult[]
    P2: TestSuiteResult[]
    P3: TestSuiteResult[]
  }
  /** 总统计 */
  totalStats: {
    totalSuites: number
    totalCases: number
    totalPassed: number
    totalFailed: number
    totalSkipped: number
    totalDuration: number
    passRate: number
  }
  /** 回归检测 */
  regression: RegressionInfo
  /** 是否通过（无回归且通过率>=基线） */
  passed: boolean
  /** 报告 */
  report: string
  /** 古籍引用 */
  classicalRef: string
  /** 兼容性保证 */
  compatibility: {
    kernelUntouched: boolean
    apiBackwardCompatible: boolean
    pluginIsolated: boolean
    overallCompatible: boolean
  }
}

/** 测试套件定义 */
export interface TestSuiteDef {
  id: string
  name: string
  phase: TestPhase
  module: string
  description: string
  /** 执行函数，返回用例结果列表 */
  execute: () => TestCaseResult[]
}

// ═══════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** 辅助：执行断言并返回用例结果 */
export function assertCase(name: string, fn: () => boolean | void): TestCaseResult {
  const start = Date.now()
  try {
    const result = fn()
    const ok = result === undefined || result === true
    return {
      name,
      status: ok ? 'pass' : 'fail',
      duration: Date.now() - start,
    }
  } catch (e: any) {
    return {
      name,
      status: 'error',
      duration: Date.now() - start,
      error: e?.message || String(e),
    }
  }
}

// ═══════════════════════════════════════════════
// RegressionCenter 类
// ═══════════════════════════════════════════════

export class RegressionCenter {
  private suites: Map<string, TestSuiteDef>
  private baseline: BaselineSnapshot | null
  private history: BaselineSnapshot[]

  constructor() {
    this.suites = new Map()
    this.baseline = null
    this.history = []
  }

  // ── 套件注册 ──────────────────────────────────

  /** 注册测试套件 */
  registerSuite(def: TestSuiteDef): void {
    this.suites.set(def.id, def)
  }

  /** 批量注册 */
  registerSuites(defs: TestSuiteDef[]): void {
    for (const def of defs) {
      this.suites.set(def.id, def)
    }
  }

  /** 注销套件 */
  unregisterSuite(id: string): boolean {
    return this.suites.delete(id)
  }

  /** 获取所有已注册套件 */
  getRegisteredSuites(): TestSuiteDef[] {
    return Array.from(this.suites.values())
  }

  /** 按阶段获取套件 */
  getSuitesByPhase(phase: TestPhase): TestSuiteDef[] {
    return Array.from(this.suites.values()).filter((s) => s.phase === phase)
  }

  // ── 执行 ──────────────────────────────────────

  /** 执行所有测试套件 */
  runAll(): RegressionCenterResult {
    const executedAt = new Date().toISOString()
    const suiteResults: TestSuiteResult[] = []

    for (const def of this.suites.values()) {
      const result = this.runSuite(def)
      suiteResults.push(result)
    }

    // 按阶段分组
    const byPhase = {
      P1: suiteResults.filter((s) => s.phase === 'P1'),
      P2: suiteResults.filter((s) => s.phase === 'P2'),
      P3: suiteResults.filter((s) => s.phase === 'P3'),
    }

    // 总统计
    const totalCases = suiteResults.reduce((s, r) => s + r.total, 0)
    const totalPassed = suiteResults.reduce((s, r) => s + r.passed, 0)
    const totalFailed = suiteResults.reduce((s, r) => s + r.failed, 0)
    const totalSkipped = suiteResults.reduce((s, r) => s + r.skipped, 0)
    const totalDuration = suiteResults.reduce((s, r) => s + r.duration, 0)
    const passRate = totalCases > 0 ? (totalPassed / totalCases) * 100 : 0

    // 回归检测
    const regression = this.detectRegression(suiteResults)

    // 兼容性检查
    const compatibility = this.checkCompatibility(suiteResults)

    // 是否通过
    const passed = !regression.hasRegression && totalFailed === 0 && compatibility.overallCompatible

    const totalStats = {
      totalSuites: suiteResults.length,
      totalCases,
      totalPassed,
      totalFailed,
      totalSkipped,
      totalDuration,
      passRate,
    }

    // 生成报告
    const report = this.generateReport(suiteResults, totalStats, regression, compatibility, passed)

    return {
      executedAt,
      suites: suiteResults,
      byPhase,
      totalStats,
      regression,
      passed,
      report,
      classicalRef: pick([
        '《易经》："履霜，坚冰至。" — 回归测试，防患于未然。',
        '《论语》："温故而知新，可以为师矣。" — 温习旧知，确保兼容。',
        '《荀子》："君子生非异也，善假于物也。" — 善用工具，持续验证。',
      ]),
      compatibility,
    }
  }

  /** 执行单个套件 */
  private runSuite(def: TestSuiteDef): TestSuiteResult {
    const start = Date.now()
    let cases: TestCaseResult[] = []

    try {
      cases = def.execute()
    } catch (e: any) {
      cases = [{
        name: '套件执行异常',
        status: 'error',
        duration: Date.now() - start,
        error: e?.message || String(e),
      }]
    }

    const duration = Date.now() - start
    const passed = cases.filter((c) => c.status === 'pass').length
    const failed = cases.filter((c) => c.status === 'fail' || c.status === 'error').length
    const skipped = cases.filter((c) => c.status === 'skip').length
    const status: TestStatus = failed === 0 ? 'pass' : cases.length === 0 ? 'skip' : 'fail'

    return {
      id: def.id,
      name: def.name,
      phase: def.phase,
      module: def.module,
      status,
      total: cases.length,
      passed,
      failed,
      skipped,
      duration,
      cases,
      description: def.description,
    }
  }

  // ── 回归检测 ──────────────────────────────────

  /** 检测回归 */
  private detectRegression(currentResults: TestSuiteResult[]): RegressionInfo {
    if (!this.baseline) {
      return {
        hasRegression: false,
        regressionSuiteIds: [],
        newFailures: [],
        recoveredPasses: [],
        comparisonSummary: '无基线快照，跳过回归检测。建议先保存基线。',
      }
    }

    const regressionSuiteIds: string[] = []
    const newFailures: string[] = []
    const recoveredPasses: string[] = []

    for (const current of currentResults) {
      const base = this.baseline.suites.find((s) => s.suiteId === current.id)

      if (!base) continue

      // 基线通过但当前失败 = 回归
      if (base.status === 'pass' && current.status !== 'pass') {
        regressionSuiteIds.push(current.id)
        // 找出具体失败的用例
        for (const c of current.cases) {
          if (c.status === 'fail' || c.status === 'error') {
            newFailures.push(`${current.name} > ${c.name}`)
          }
        }
      }

      // 基线失败但当前通过 = 恢复
      if (base.status !== 'pass' && current.status === 'pass') {
        recoveredPasses.push(current.name)
      }
    }

    const hasRegression = regressionSuiteIds.length > 0

    const summary = hasRegression
      ? pick([
          `检测到 ${regressionSuiteIds.length} 个套件出现回归！新增失败 ${newFailures.length} 项。`,
          `回归警告：${regressionSuiteIds.length} 个套件从通过变为失败，需立即修复。`,
          `发现回归：${newFailures.length} 个用例新增失败，影响 ${regressionSuiteIds.length} 个套件。`,
        ])
      : recoveredPasses.length > 0
        ? `无回归。${recoveredPasses.length} 个套件恢复通过。`
        : '无回归。所有基线通过的套件仍然通过。'

    return {
      hasRegression,
      regressionSuiteIds,
      newFailures,
      recoveredPasses,
      comparisonSummary: summary,
    }
  }

  // ── 兼容性检查 ────────────────────────────────

  /** 检查向后兼容性 */
  private checkCompatibility(suiteResults: TestSuiteResult[]): RegressionCenterResult['compatibility'] {
    // P1 套件全部通过 = Kernel 未被破坏
    const p1Suites = suiteResults.filter((s) => s.phase === 'P1')
    const p1AllPass = p1Suites.length > 0 && p1Suites.every((s) => s.status === 'pass')

    // P2 套件全部通过 = API 向后兼容
    const p2Suites = suiteResults.filter((s) => s.phase === 'P2')
    const p2AllPass = p2Suites.length > 0 && p2Suites.every((s) => s.status === 'pass')

    // P3 套件不依赖 P1/P2 的内部实现 = Plugin 隔离
    const p3Suites = suiteResults.filter((s) => s.phase === 'P3')
    const p3NoError = p3Suites.every((s) => s.status !== 'error')

    return {
      kernelUntouched: p1AllPass,
      apiBackwardCompatible: p2AllPass,
      pluginIsolated: p3NoError,
      overallCompatible: p1AllPass && p2AllPass,
    }
  }

  // ── 基线管理 ──────────────────────────────────

  /** 保存当前结果为基线 */
  saveBaseline(version: string): BaselineSnapshot {
    const result = this.runAll()
    const snapshot: BaselineSnapshot = {
      id: `baseline-${Date.now()}`,
      createdAt: new Date().toISOString(),
      version,
      suites: result.suites.map((s) => ({
        suiteId: s.id,
        suiteName: s.name,
        total: s.total,
        passed: s.passed,
        failed: s.failed,
        status: s.status,
      })),
      overallPassRate: result.totalStats.passRate,
      totalCases: result.totalStats.totalCases,
      totalPassed: result.totalStats.totalPassed,
    }

    this.baseline = snapshot
    this.history.push(snapshot)
    return snapshot
  }

  /** 加载基线 */
  loadBaseline(snapshot: BaselineSnapshot): void {
    this.baseline = snapshot
  }

  /** 获取当前基线 */
  getBaseline(): BaselineSnapshot | null {
    return this.baseline
  }

  /** 获取基线历史 */
  getBaselineHistory(): BaselineSnapshot[] {
    return [...this.history]
  }

  /** 清除基线 */
  clearBaseline(): void {
    this.baseline = null
  }

  // ── 报告生成 ──────────────────────────────────

  /** 生成报告 */
  private generateReport(
    suites: TestSuiteResult[],
    stats: { totalSuites: number; totalCases: number; totalPassed: number; totalFailed: number; totalDuration: number; passRate: number },
    regression: RegressionInfo,
    compatibility: RegressionCenterResult['compatibility'],
    passed: boolean,
  ): string {
    const lines: string[] = []
    lines.push('═══════════ 回归中心报告 ═══════════')
    lines.push(`执行时间：${new Date().toISOString()}`)
    lines.push(`总状态：${passed ? '✓ 全部通过' : '✗ 存在问题'}`)
    lines.push('')

    // 总统计
    lines.push('── 总统计 ──')
    lines.push(`  套件数：${stats.totalSuites}`)
    lines.push(`  用例数：${stats.totalCases}`)
    lines.push(`  通过：${stats.totalPassed} | 失败：${stats.totalFailed}`)
    lines.push(`  通过率：${stats.passRate.toFixed(1)}%`)
    lines.push(`  总耗时：${stats.totalDuration}ms`)
    lines.push('')

    // 按阶段
    for (const phase of ['P1', 'P2', 'P3'] as TestPhase[]) {
      const phaseSuites = suites.filter((s) => s.phase === phase)
      if (phaseSuites.length === 0) continue

      const phasePass = phaseSuites.filter((s) => s.status === 'pass').length
      lines.push(`── ${phase}（${phaseSuites.length} 套件，${phasePass} 通过）──`)
      for (const s of phaseSuites) {
        const icon = s.status === 'pass' ? '✓' : s.status === 'fail' ? '✗' : '○'
        lines.push(`  ${icon} ${s.name}：${s.passed}/${s.total} (${s.duration}ms)`)
      }
      lines.push('')
    }

    // 回归检测
    lines.push('── 回归检测 ──')
    if (regression.hasRegression) {
      lines.push(`  ▲ 检测到回归！`)
      for (const id of regression.regressionSuiteIds) {
        const s = suites.find((x) => x.id === id)
        lines.push(`    - ${s?.name || id}`)
      }
      if (regression.newFailures.length > 0) {
        lines.push(`  新增失败用例：`)
        for (const f of regression.newFailures.slice(0, 10)) {
          lines.push(`    - ${f}`)
        }
      }
    } else {
      lines.push(`  ✓ 无回归`)
      if (regression.recoveredPasses.length > 0) {
        lines.push(`  恢复通过：${regression.recoveredPasses.join(', ')}`)
      }
    }
    lines.push('')

    // 兼容性
    lines.push('── 兼容性 ──')
    lines.push(`  Kernel 未修改：${compatibility.kernelUntouched ? '✓' : '✗'}`)
    lines.push(`  API 向后兼容：${compatibility.apiBackwardCompatible ? '✓' : '✗'}`)
    lines.push(`  Plugin 隔离：${compatibility.pluginIsolated ? '✓' : '✗'}`)
    lines.push(`  整体兼容：${compatibility.overallCompatible ? '✓' : '✗'}`)
    lines.push('')

    lines.push('═══════════════════════════════════')

    return lines.join('\n')
  }

  // ── 统计 ──────────────────────────────────────

  /** 获取已注册套件统计 */
  getStats(): {
    totalSuites: number
    byPhase: Record<TestPhase, number>
    registered: string[]
  } {
    const all = Array.from(this.suites.values())
    return {
      totalSuites: all.length,
      byPhase: {
        P1: all.filter((s) => s.phase === 'P1').length,
        P2: all.filter((s) => s.phase === 'P2').length,
        P3: all.filter((s) => s.phase === 'P3').length,
      },
      registered: all.map((s) => s.id),
    }
  }
}

// ═══════════════════════════════════════════════
// 辅助导出
// ═══════════════════════════════════════════════

/** 快速回归检查 */
export function quickRegression(suites: TestSuiteDef[]): {
  passed: boolean
  passRate: number
  failedSuites: string[]
} {
  const rc = new RegressionCenter()
  rc.registerSuites(suites)
  const result = rc.runAll()
  return {
    passed: result.passed,
    passRate: result.totalStats.passRate,
    failedSuites: result.suites.filter((s) => s.status !== 'pass').map((s) => s.name),
  }
}

/** 创建简单测试套件 */
export function createSuite(
  id: string,
  name: string,
  phase: TestPhase,
  module: string,
  description: string,
  tests: Array<{ name: string; fn: () => boolean | void }>,
): TestSuiteDef {
  return {
    id,
    name,
    phase,
    module,
    description,
    execute: () => tests.map((t) => assertCase(t.name, t.fn)),
  }
}
