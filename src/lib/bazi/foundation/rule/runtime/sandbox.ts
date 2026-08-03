/**
 * P0-5B Rule Sandbox — 规则沙箱隔离
 *
 * 为规则执行提供资源隔离与熔断保护：
 *   1. 执行超时保护（同步/异步执行计时与超时中止）
 *   2. 错误隔离（try/catch + 包装）
 *   3. 熔断隔离（失败次数超过阈值后进入 quarantine，防止恶意规则拖垮系统
 *   4. 统计指标（总执行次数、失败次数、平均耗时、隔离规则数）
 *
 * 与 RuleRuntime 配合使用：RuleRuntime 调 sandbox.execute() 包裹每条规则的 evaluate 调用。
 *
 * 七层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

// ============================================================
// 配置与结果类型
// ============================================================

/**
 * 规则沙箱配置
 */
export interface RuleSandboxConfig {
  /** 单条规则最大允许的执行时长（毫秒），默认 500ms。超过后异步执行会被标记为超时失败 */
  maxExecutionTimeMs?: number
  /** 单条规则连续失败次数阈值，超过后进入隔离（quarantine），默认 5 次 */
  maxFailuresBeforeQuarantine?: number
  /** 是否允许不安全操作（预留字段，当前未使用），默认 false */
  allowUnsafe?: boolean
}

/**
 * 沙箱执行结果
 *
 * 成功时返回 result 与 executionTimeMs；
 * 失败时返回 error（消息）与 errorType（如 'timeout'/'exception'/'quarantined'）。
 */
export type SandboxExecutionResult<T> =
  | {
      success: true
      result: T
      executionTimeMs: number
    }
  | {
      success: false
      error: string
      errorType: string
      executionTimeMs: number
    }

// ============================================================
// RuleSandbox 类
// ============================================================

/**
 * 规则沙箱
 *
 * 使用方式：
 *   const sandbox = new RuleSandbox({ maxExecutionTimeMs: 300 })
 *   const r = sandbox.execute(() => rule.evaluate(input), rule.id)
 *   if (r.success) ...
 */
export class RuleSandbox {
  /** 实际生效的配置 */
  private readonly config: Required<RuleSandboxConfig>

  /** 每条规则的累计失败次数 */
  private readonly failureCounts = new Map<string, number>()

  /** 已被隔离（quarantine）的规则 ID 集合 */
  private readonly quarantined = new Set<string>()

  /** 总执行次数 */
  private totalExecutions = 0

  /** 总失败次数 */
  private totalFailures = 0

  /** 累计执行耗时（毫秒），用于计算平均值 */
  private totalExecutionTimeMs = 0

  // ============================================================
  // 构造与配置
  // ============================================================

  /**
   * 构造规则沙箱
   * @param config 沙箱配置（可缺省，默认 maxExecutionTimeMs=500, maxFailuresBeforeQuarantine=5）
   */
  constructor(config: RuleSandboxConfig = {}) {
    this.config = {
      maxExecutionTimeMs: 500,
      maxFailuresBeforeQuarantine: 5,
      allowUnsafe: false,
      ...config,
    }
  }

  // ============================================================
  // 同步执行
  // ============================================================

  /**
   * 同步执行函数并进行错误隔离与耗时统计
   *
   * 若规则已被隔离，直接返回 success=false 的 quarantine 错误，不再实际执行。
   *
   * @param fn 待执行的同步函数
   * @param ruleId 规则 ID（可选，用于隔离统计与熔断计数）
   * @returns SandboxExecutionResult
   */
  execute<T>(fn: () => T, ruleId?: string): SandboxExecutionResult<T> {
    // 隔离检查
    if (ruleId && this.isQuarantined(ruleId)) {
      return {
        success: false,
        error: `规则 ${ruleId} 已被隔离（连续失败次数超过阈值）`,
        errorType: 'quarantined',
        executionTimeMs: 0,
      }
    }

    const startTs = Date.now()
    this.totalExecutions += 1

    try {
      const result = fn()
      const executionTimeMs = Date.now() - startTs
      this.totalExecutionTimeMs += executionTimeMs

      // 执行成功，重置该规则的失败计数
      if (ruleId) this.failureCounts.delete(ruleId)

      return {
        success: true,
        result,
        executionTimeMs,
      }
    } catch (err) {
      const executionTimeMs = Date.now() - startTs
      this.totalExecutionTimeMs += executionTimeMs
      this.totalFailures += 1

      // 统计失败次数，若超过阈值则隔离
      if (ruleId) {
        const count = (this.failureCounts.get(ruleId) ?? 0) + 1
        this.failureCounts.set(ruleId, count)
        if (count >= this.config.maxFailuresBeforeQuarantine) {
          this.quarantined.add(ruleId)
        }
      }

      const error = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        error,
        errorType: 'exception',
        executionTimeMs,
      }
    }
  }

  // ============================================================
  // 异步执行（含超时保护）
  // ============================================================

  /**
   * 异步执行函数，支持超时保护（Promise.race + setTimeout）
   *
   * 超过 maxExecutionTimeMs 未完成时返回 success=false，errorType='timeout'。
   *
   * @param fn 待执行的异步函数（返回 Promise）
   * @param ruleId 规则 ID（可选，用于隔离统计与熔断计数）
   */
  async executeAsync<T>(
    fn: () => Promise<T>,
    ruleId?: string,
  ): Promise<SandboxExecutionResult<T>> {
    // 隔离检查
    if (ruleId && this.isQuarantined(ruleId)) {
      return {
        success: false,
        error: `规则 ${ruleId} 已被隔离（连续失败次数超过阈值）`,
        errorType: 'quarantined',
        executionTimeMs: 0,
      }
    }

    const startTs = Date.now()
    this.totalExecutions += 1

    // 构造超时 Promise（超时后 reject，标记为 timeout 失败）
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('timeout'))
      }, this.config.maxExecutionTimeMs)
    })

    try {
      const result = await Promise.race([fn(), timeoutPromise])
      const executionTimeMs = Date.now() - startTs
      this.totalExecutionTimeMs += executionTimeMs
      if (timeoutId) clearTimeout(timeoutId)

      // 执行成功，重置该规则的失败计数
      if (ruleId) this.failureCounts.delete(ruleId)

      return {
        success: true,
        result,
        executionTimeMs,
      }
    } catch (err) {
      const executionTimeMs = Date.now() - startTs
      this.totalExecutionTimeMs += executionTimeMs
      this.totalFailures += 1
      if (timeoutId) clearTimeout(timeoutId)

      const isTimeout =
        (err instanceof Error && err.message === 'timeout')

      // 统计失败次数，若超过阈值则隔离
      if (ruleId) {
        const count = (this.failureCounts.get(ruleId) ?? 0) + 1
        this.failureCounts.set(ruleId, count)
        if (count >= this.config.maxFailuresBeforeQuarantine) {
          this.quarantined.add(ruleId)
        }
      }

      const error = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        error: isTimeout ? `规则执行超时（>${this.config.maxExecutionTimeMs}ms）` : error,
        errorType: isTimeout ? 'timeout' : 'exception',
        executionTimeMs,
      }
    }
  }

  // ============================================================
  // 隔离（Quarantine）管理
  // ============================================================

  /**
   * 判断指定规则是否已被隔离
   */
  isQuarantined(ruleId: string): boolean {
    return this.quarantined.has(ruleId)
  }

  /**
   * 重置指定规则的失败计数并解除隔离
   */
  resetQuarantine(ruleId: string): void {
    this.quarantined.delete(ruleId)
    this.failureCounts.delete(ruleId)
  }

  /**
   * 获取所有已被隔离的规则 ID 列表
   */
  getQuarantinedRules(): string[] {
    return Array.from(this.quarantined)
  }

  // ============================================================
  // 统计指标
  // ============================================================

  /**
   * 获取沙箱运行统计
   *
   * @returns 总执行次数、失败次数、平均耗时、隔离规则数
   */
  stats(): {
    totalExecutions: number
    failedExecutions: number
    avgExecutionTimeMs: number
    quarantinedCount: number
  } {
    return {
      totalExecutions: this.totalExecutions,
      failedExecutions: this.totalFailures,
      avgExecutionTimeMs:
        this.totalExecutions > 0
          ? Number((this.totalExecutionTimeMs / this.totalExecutions).toFixed(4))
          : 0,
      quarantinedCount: this.quarantined.size,
    }
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局规则沙箱单例（默认配置） */
export const globalRuleSandbox = new RuleSandbox()
