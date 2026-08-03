/**
 * RuleDSL Runtime（Pipeline 第四阶段）
 *
 * 执行编译后的 CompiledRule，对输入命局数据求值。
 *
 * 职责：
 *   - 加载/卸载编译后的规则
 *   - 单条/批量/全量执行规则
 *   - 统计执行次数与时间
 *   - 通过 EventBus 发布 RuleCompiled 事件（加载时）
 *
 * Pipeline：DSL → [Parser] → AST → [Validator] → [Compiler] → CompiledRule → [Runtime]
 */

import { EventBus } from '../../core/eventbus/eventBus'
import type { CompiledRule, CompiledRuleResult } from '../compiler/compiler'

/** 单条规则执行结果（带规则 ID） */
export interface RuleExecutionOutcome {
  /** 规则 ID */
  ruleId: string
  /** 执行结果 */
  result: CompiledRuleResult
}

/** RuleCompiled 事件载荷（加载规则时发布） */
export interface RuleCompiledEvent {
  /** 规则 ID */
  ruleId: string
  /** 规则名称 */
  ruleName: string
  /** 编译时间戳 */
  compiledAt: number
}

/** 运行时统计信息 */
export interface RuntimeStats {
  /** 已加载规则数 */
  loaded: number
  /** 累计执行次数 */
  executed: number
  /** 最后一次执行时间戳 */
  lastExecutedAt: number
}

/**
 * RuleDSL 运行时
 *
 * 管理编译后规则的生命周期与执行。
 */
export class DSLRuntime {
  /** 已加载规则（按 ruleId 索引） */
  private rules: Map<string, CompiledRule> = new Map()
  /** 事件总线（发布 RuleCompiled 等事件） */
  private eventBus: EventBus
  /** 累计执行次数 */
  private executedCount = 0
  /** 最后一次执行时间戳 */
  private lastExecutedAt = 0

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus ?? new EventBus()
  }

  /**
   * 加载一条编译后的规则
   *
   * 加载成功后发布 RuleCompiled 事件。
   *
   * @param rule 编译后的规则
   * @returns 是否加载成功
   */
  load(rule: CompiledRule): boolean {
    if (!rule || !rule.ruleId) return false
    this.rules.set(rule.ruleId, rule)
    const payload: RuleCompiledEvent = {
      ruleId: rule.ruleId,
      ruleName: rule.ruleName,
      compiledAt: rule.compiledAt,
    }
    this.eventBus.emit('RuleCompiled', payload)
    return true
  }

  /**
   * 卸载一条规则
   *
   * @param ruleId 规则 ID
   * @returns 是否卸载成功（不存在则返回 false）
   */
  unload(ruleId: string): boolean {
    return this.rules.delete(ruleId)
  }

  /**
   * 执行单条规则
   *
   * @param ruleId 规则 ID
   * @param input 命局输入数据
   * @returns 执行结果
   * @throws Error 规则未加载时抛出
   */
  execute(ruleId: string, input: any): CompiledRuleResult {
    const rule = this.rules.get(ruleId)
    if (!rule) {
      throw new Error(`规则未加载: ${ruleId}`)
    }
    const result = rule.evaluate(input)
    this.executedCount++
    this.lastExecutedAt = Date.now()
    return result
  }

  /**
   * 执行所有已加载规则
   *
   * @param input 命局输入数据
   * @returns 各规则执行结果列表
   */
  executeAll(input: any): RuleExecutionOutcome[] {
    const outcomes: RuleExecutionOutcome[] = []
    for (const [ruleId, rule] of this.rules) {
      outcomes.push({ ruleId, result: rule.evaluate(input) })
    }
    this.executedCount += outcomes.length
    if (outcomes.length > 0) {
      this.lastExecutedAt = Date.now()
    }
    return outcomes
  }

  /**
   * 批量执行指定规则
   *
   * 未加载的规则会返回一条不满足的占位结果（不抛错）。
   *
   * @param ruleIds 规则 ID 列表
   * @param input 命局输入数据
   * @returns 各规则执行结果列表
   */
  executeBatch(ruleIds: string[], input: any): RuleExecutionOutcome[] {
    const outcomes: RuleExecutionOutcome[] = []
    for (const ruleId of ruleIds) {
      const rule = this.rules.get(ruleId)
      if (!rule) {
        outcomes.push({
          ruleId,
          result: {
            satisfied: false,
            scores: {},
            trace: [{ step: '加载检查', text: `规则未加载: ${ruleId}`, satisfied: false }],
          },
        })
        continue
      }
      outcomes.push({ ruleId, result: rule.evaluate(input) })
    }
    this.executedCount += outcomes.length
    if (outcomes.length > 0) {
      this.lastExecutedAt = Date.now()
    }
    return outcomes
  }

  /**
   * 获取已加载规则 ID 列表
   */
  getLoadedRules(): string[] {
    return Array.from(this.rules.keys())
  }

  /**
   * 判断某规则是否已加载
   */
  isLoaded(ruleId: string): boolean {
    return this.rules.has(ruleId)
  }

  /**
   * 清空所有已加载规则
   */
  clear(): void {
    this.rules.clear()
  }

  /**
   * 获取运行时统计
   */
  stats(): RuntimeStats {
    return {
      loaded: this.rules.size,
      executed: this.executedCount,
      lastExecutedAt: this.lastExecutedAt,
    }
  }

  /**
   * 获取事件总线（便于外部订阅 RuleCompiled 等事件）
   */
  getEventBus(): EventBus {
    return this.eventBus
  }
}

/** 全局 DSL 运行时单例 */
export const globalDSLRuntime = new DSLRuntime()
