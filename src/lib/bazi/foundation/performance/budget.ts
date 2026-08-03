// 性能预算 —— 规定各模块耗时上限，CI 自动检查
// 超出预算 → 警告/失败

import { globalPerformanceCenter } from './center'

// ============================================================
// 类型定义
// ============================================================

/** 单条性能预算 */
export interface PerformanceBudget {
  /** 操作名（如 'paipan'、'fusion'、'decision'、'explain'、'total'） */
  operation: string
  /** 耗时上限（毫秒） */
  maxLatencyMs: number
  /** 警告阈值（毫秒，通常为上限的 80%） */
  warningThresholdMs: number
  /** 描述 */
  description: string
  /** 分类：critical / important / normal */
  category: 'critical' | 'important' | 'normal'
}

/** 单条预算检查结果 */
export interface BudgetCheckResult {
  /** 关联的预算 */
  budget: PerformanceBudget
  /** 实际耗时（毫秒） */
  actualMs: number
  /** 是否通过（含警告） */
  passed: boolean
  /** 状态：ok / warning / exceeded */
  status: 'ok' | 'warning' | 'exceeded'
  /** 人类可读消息 */
  message: string
}

/** 预算检查报告 */
export interface BudgetReport {
  /** 全部检查结果 */
  results: BudgetCheckResult[]
  /** 是否全部通过（含警告也算通过） */
  allPassed: boolean
  /** 关键失败列表（critical 类别且超出预算） */
  criticalFailures: BudgetCheckResult[]
  /** 警告列表 */
  warnings: BudgetCheckResult[]
  /** 汇总文字 */
  summary: string
}

// ============================================================
// 默认预算表
// ============================================================

/**
 * 默认性能预算表
 *
 * 数值来源：玄风 Core OS V1.0 性能基线（CI 自动检查）
 * - 排盘：30ms（用户感知临界）
 * - 总耗时：120ms（一次完整八字分析上限）
 */
export const DEFAULT_BUDGETS: PerformanceBudget[] = [
  {
    operation: 'paipan',
    maxLatencyMs: 30,
    warningThresholdMs: 24,
    description: '排盘（四柱 + 大运 + 流年 + 神煞）',
    category: 'critical',
  },
  {
    operation: 'rule_parse',
    maxLatencyMs: 50,
    warningThresholdMs: 40,
    description: '规则 DSL → AST 解析',
    category: 'important',
  },
  {
    operation: 'rule_compile',
    maxLatencyMs: 20,
    warningThresholdMs: 16,
    description: 'AST → CompiledRule 编译',
    category: 'important',
  },
  {
    operation: 'fusion',
    maxLatencyMs: 20,
    warningThresholdMs: 16,
    description: '引擎融合层（七子引擎加权融合）',
    category: 'critical',
  },
  {
    operation: 'decision',
    maxLatencyMs: 10,
    warningThresholdMs: 8,
    description: '决策裁决（Strategy → FinalDecision）',
    category: 'critical',
  },
  {
    operation: 'explain',
    maxLatencyMs: 30,
    warningThresholdMs: 24,
    description: '解释生成（解释层 + 证据树）',
    category: 'important',
  },
  {
    operation: 'knowledge_query',
    maxLatencyMs: 15,
    warningThresholdMs: 12,
    description: '知识查询（本体 / 典籍 / 图谱）',
    category: 'normal',
  },
  {
    operation: 'api_request',
    maxLatencyMs: 100,
    warningThresholdMs: 80,
    description: 'API 请求端到端耗时',
    category: 'normal',
  },
  {
    operation: 'total',
    maxLatencyMs: 120,
    warningThresholdMs: 100,
    description: '总耗时（一次完整八字分析）',
    category: 'critical',
  },
]

// ============================================================
// 性能预算管理器
// ============================================================

/**
 * 性能预算管理器
 *
 * - 加载默认预算
 * - 支持自定义 / 覆盖
 * - 与 PerformanceCenter 联动：自动拉取实际耗时并对比
 */
export class PerformanceBudgetManager {
  /** 按操作名索引的预算表 */
  private budgets: Map<string, PerformanceBudget> = new Map()

  constructor() {
    for (const b of DEFAULT_BUDGETS) {
      this.budgets.set(b.operation, { ...b })
    }
  }

  /**
   * 设置 / 覆盖一条预算
   */
  setBudget(budget: PerformanceBudget): void {
    this.budgets.set(budget.operation, { ...budget })
  }

  /**
   * 取某操作的预算；不存在返回 undefined
   */
  getBudget(operation: string): PerformanceBudget | undefined {
    return this.budgets.get(operation)
  }

  /**
   * 检查单条操作的实际耗时是否在预算内
   */
  check(operation: string, actualMs: number): BudgetCheckResult {
    const budget = this.budgets.get(operation)
    if (!budget) {
      return {
        budget: {
          operation,
          maxLatencyMs: 0,
          warningThresholdMs: 0,
          description: '(未注册的预算)',
          category: 'normal',
        },
        actualMs,
        passed: false,
        status: 'exceeded',
        message: `操作 "${operation}" 未注册预算`,
      }
    }

    let status: BudgetCheckResult['status']
    let passed: boolean
    if (actualMs > budget.maxLatencyMs) {
      status = 'exceeded'
      passed = false
    } else if (actualMs > budget.warningThresholdMs) {
      status = 'warning'
      passed = true
    } else {
      status = 'ok'
      passed = true
    }

    const message = this._formatMessage(budget, actualMs, status)

    return { budget, actualMs, passed, status, message }
  }

  /**
   * 批量检查：传入 PerformanceCenter 风格的报告
   * （形如 { paipan: { avgMs: 12 }, fusion: { avgMs: 8 } }）
   */
  checkAll(metrics: Record<string, { avgMs: number }>): BudgetReport {
    const results: BudgetCheckResult[] = []
    const criticalFailures: BudgetCheckResult[] = []
    const warnings: BudgetCheckResult[] = []

    for (const [operation, stat] of Object.entries(metrics)) {
      const actualMs = typeof stat?.avgMs === 'number' ? stat.avgMs : 0
      const result = this.check(operation, actualMs)
      results.push(result)
      if (result.status === 'exceeded' && result.budget.category === 'critical') {
        criticalFailures.push(result)
      } else if (result.status === 'warning') {
        warnings.push(result)
      } else if (result.status === 'exceeded') {
        // 非关键的超出也计入警告列表，便于汇总
        warnings.push(result)
      }
    }

    const allPassed = criticalFailures.length === 0
    const summary = this._buildSummary(results, criticalFailures, warnings)

    return { results, allPassed, criticalFailures, warnings, summary }
  }

  /**
   * 自动从 globalPerformanceCenter 拉取报告并检查
   *
   * 注意：PerformanceCenter 的 metric 类型与 budget 的 operation 名并非 1:1，
   * 这里把已采集到的类型映射到对应预算：
   *   - rule_parse → rule_parse
   *   - rule_compile → rule_compile
   *   - fusion_decision → fusion
   *   - explain_generate → explain
   *   - api_request → api_request
   * 另外始终检查 total（取所有样本累计耗时）。
   */
  getReport(): BudgetReport {
    const pcReport = globalPerformanceCenter.getReport()

    // operation → avgMs 映射
    const metrics: Record<string, { avgMs: number }> = {}

    const mapping: Record<string, string> = {
      rule_parse: 'rule_parse',
      rule_compile: 'rule_compile',
      fusion_decision: 'fusion',
      explain_generate: 'explain',
      api_request: 'api_request',
    }

    let totalMs = 0
    let totalCount = 0
    for (const [metricType, op] of Object.entries(mapping)) {
      const r = (pcReport as any)[metricType]
      if (r && typeof r.avgMs === 'number' && r.count > 0) {
        metrics[op] = { avgMs: r.avgMs }
        totalMs += r.totalMs ?? 0
        totalCount += r.count ?? 0
      }
    }

    // 总耗时：用累计耗时做近似（如果完全没有样本，记 0）
    if (totalCount > 0) {
      metrics['total'] = { avgMs: totalMs / Math.max(1, totalCount) }
    }

    return this.checkAll(metrics)
  }

  /**
   * 列出全部预算（按默认顺序）
   */
  listBudgets(): PerformanceBudget[] {
    return Array.from(this.budgets.values()).map((b) => ({ ...b }))
  }

  /**
   * 导出配置（JSON 字符串）
   */
  exportConfig(): string {
    return JSON.stringify({ budgets: this.listBudgets() }, null, 2)
  }

  /**
   * 导入配置（JSON 字符串）；解析失败抛错
   */
  importConfig(json: string): void {
    const parsed = JSON.parse(json)
    const arr: any[] = Array.isArray(parsed) ? parsed : parsed?.budgets ?? []
    for (const b of arr) {
      if (b && typeof b.operation === 'string') {
        this.setBudget({
          operation: b.operation,
          maxLatencyMs: Number(b.maxLatencyMs) || 0,
          warningThresholdMs: Number(b.warningThresholdMs) || 0,
          description: String(b.description ?? ''),
          category: (['critical', 'important', 'normal'].includes(b.category)
            ? b.category
            : 'normal') as PerformanceBudget['category'],
        })
      }
    }
  }

  // ----------------------------------------------------------
  // 内部辅助
  // ----------------------------------------------------------

  private _formatMessage(
    budget: PerformanceBudget,
    actualMs: number,
    status: BudgetCheckResult['status'],
  ): string {
    const pct = budget.maxLatencyMs > 0
      ? ((actualMs / budget.maxLatencyMs) * 100).toFixed(1)
      : '∞'
    if (status === 'ok') {
      return `[OK] ${budget.operation}: ${actualMs.toFixed(2)}ms / ${budget.maxLatencyMs}ms (${pct}%) — ${budget.description}`
    } else if (status === 'warning') {
      return `[WARN] ${budget.operation}: ${actualMs.toFixed(2)}ms 超过警告阈值 ${budget.warningThresholdMs}ms（上限 ${budget.maxLatencyMs}ms，${pct}%）— ${budget.description}`
    } else {
      return `[FAIL] ${budget.operation}: ${actualMs.toFixed(2)}ms 超出预算 ${budget.maxLatencyMs}ms（${pct}%）— ${budget.description}`
    }
  }

  private _buildSummary(
    results: BudgetCheckResult[],
    criticalFailures: BudgetCheckResult[],
    warnings: BudgetCheckResult[],
  ): string {
    const okCount = results.filter((r) => r.status === 'ok').length
    const warnCount = warnings.length
    const failCount = criticalFailures.length + results.filter((r) => r.status === 'exceeded' && r.budget.category !== 'critical').length
    const lines: string[] = []
    lines.push('===== 性能预算检查报告 =====')
    lines.push(`总计 ${results.length} 项检查：通过 ${okCount} / 警告 ${warnCount} / 失败 ${failCount}`)
    if (criticalFailures.length > 0) {
      lines.push('')
      lines.push('【关键失败】')
      for (const f of criticalFailures) {
        lines.push(`  - ${f.message}`)
      }
    }
    if (warnings.length > 0) {
      lines.push('')
      lines.push('【警告】')
      for (const w of warnings) {
        lines.push(`  - ${w.message}`)
      }
    }
    lines.push('')
    lines.push(criticalFailures.length === 0 ? '结论：全部关键预算通过。' : '结论：存在关键预算超限，需立即优化。')
    return lines.join('\n')
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局性能预算管理器单例 */
export const globalBudgetManager = new PerformanceBudgetManager()
