/**
 * P0-5A Foundation Core — 事件总线（Event Bus）
 *
 * Foundation 各模块之间的解耦通信枢纽。
 *
 * 设计原则：
 *   - 发布/订阅模式：模块通过事件类型而非直接引用进行通信
 *   - 异步优先：emit() 等待所有 async handler 完成；emitSync() 触发即忘
 *   - 容错隔离：单个 handler 抛错不会阻塞其他 handler，错误会被 catch 并记录
 *   - 通配符：emit('*') 会通知所有订阅者，便于全局观测/调试
 *   - once：支持一次性订阅，触发后自动注销
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

import type { EventHandler } from '../../shared'
import { globalLogger } from '../../shared'

// ============================================================
// Foundation 事件常量
// ============================================================

/**
 * Foundation 标准事件类型
 *
 * 命名约定：动词 + 名词（如 RuleLoaded 表示规则加载完成）
 */
export const FoundationEvents = {
  /** 规则加载完成 */
  RuleLoaded: 'foundation:rule:loaded',
  /** 规则被拒绝（未通过 Gate/审核） */
  RuleRejected: 'foundation:rule:rejected',
  /** 决策完成（Unified Decision Core 输出最终结论） */
  DecisionFinished: 'foundation:decision:finished',
  /** 命例匹配完成（CaseSimilarity 找到相似案例） */
  CaseMatched: 'foundation:case:matched',
  /** Benchmark 评估完成 */
  BenchmarkFinished: 'foundation:benchmark:finished',
  /** Explain 生成完成 */
  ExplainGenerated: 'foundation:explain:generated',
  /** 插件加载完成 */
  PluginLoaded: 'foundation:plugin:loaded',
  /** 插件卸载完成 */
  PluginUnloaded: 'foundation:plugin:unloaded',
  /** 配置变更 */
  ConfigChanged: 'foundation:config:changed',
  /** 规则编译完成（DSL → 可执行规则） */
  RuleCompiled: 'foundation:rule:compiled',
  /** 知识图谱查询完成 */
  KnowledgeQueried: 'foundation:knowledge:queried',
} as const

/** 事件类型字符串字面量联合 */
export type FoundationEventType = typeof FoundationEvents[keyof typeof FoundationEvents]

/** 通配符事件类型，触发后通知所有订阅者 */
export const WILDCARD_EVENT = '*'

// ============================================================
// 订阅记录
// ============================================================

/** 单条订阅的内部记录 */
interface Subscription {
  /** 事件类型 */
  eventType: string
  /** 处理器 */
  handler: EventHandler<any>
  /** 是否一次性订阅（触发后自动移除） */
  once: boolean
}

// ============================================================
// EventBus 类
// ============================================================

/**
 * Foundation 事件总线
 *
 * @example
 * import { globalEventBus, FoundationEvents } from '@/lib/bazi/foundation/core'
 *
 * // 订阅
 * globalEventBus.on(FoundationEvents.RuleLoaded, (event) => {
 *   console.log('规则已加载', event)
 * })
 *
 * // 发布（异步）
 * await globalEventBus.emit(FoundationEvents.RuleLoaded, { ruleId: 'BALANCE-001' })
 *
 * // 一次性订阅
 * globalEventBus.once(FoundationEvents.PluginLoaded, (event) => {
 *   console.log('首次插件加载', event)
 * })
 */
export class EventBus {
  /** 订阅记录表（按事件类型分组） */
  private subscriptions = new Map<string, Subscription[]>()

  /**
   * 订阅事件
   * @param eventType 事件类型（字符串）
   * @param handler 处理器
   */
  on(eventType: string, handler: EventHandler<any>): void {
    const list = this.subscriptions.get(eventType) ?? []
    list.push({ eventType, handler, once: false })
    this.subscriptions.set(eventType, list)
  }

  /**
   * 取消订阅
   * 仅移除与给定 handler 引用相等的记录
   * @param eventType 事件类型
   * @param handler 处理器
   */
  off(eventType: string, handler: EventHandler<any>): void {
    const list = this.subscriptions.get(eventType)
    if (!list) return
    const filtered = list.filter(sub => sub.handler !== handler)
    if (filtered.length === 0) {
      this.subscriptions.delete(eventType)
    } else {
      this.subscriptions.set(eventType, filtered)
    }
  }

  /**
   * 一次性订阅
   * 触发后自动注销
   * @param eventType 事件类型
   * @param handler 处理器
   */
  once(eventType: string, handler: EventHandler<any>): void {
    const list = this.subscriptions.get(eventType) ?? []
    list.push({ eventType, handler, once: true })
    this.subscriptions.set(eventType, list)
  }

  /**
   * 异步发布事件
   * 依次 await 所有 async handler，单个 handler 抛错不会阻塞其他 handler。
   * @param eventType 事件类型；传入 '*' 触发所有订阅者
   * @param payload 事件负载
   */
  async emit(eventType: string, payload?: any): Promise<void> {
    const targets = this.collectTargets(eventType)
    if (targets.length === 0) return

    // 标记 once 订阅为待移除
    const toRemove: Subscription[] = []

    for (const sub of targets) {
      try {
        await sub.handler(payload)
      } catch (err) {
        // 单个 handler 抛错不阻塞其他 handler
        globalLogger.error('EventBus handler 抛错', {
          eventType,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        })
      }
      if (sub.once) {
        toRemove.push(sub)
      }
    }

    // 清理 once 订阅
    if (toRemove.length > 0) {
      this.removeOnceSubscriptions(toRemove)
    }
  }

  /**
   * 同步发布事件（触发即忘）
   * 异步 handler 不会被 await，仅启动后立即返回。
   * @param eventType 事件类型
   * @param payload 事件负载
   */
  emitSync(eventType: string, payload?: any): void {
    const targets = this.collectTargets(eventType)
    if (targets.length === 0) return

    const toRemove: Subscription[] = []

    for (const sub of targets) {
      try {
        const ret = sub.handler(payload)
        // 若 handler 返回 Promise，挂载 catch 防止未处理 rejection
        if (ret && typeof (ret as Promise<void>).then === 'function') {
          (ret as Promise<void>).catch(err => {
            globalLogger.error('EventBus handler 异步抛错', {
              eventType,
              error: err instanceof Error ? err.message : String(err),
            })
          })
        }
      } catch (err) {
        globalLogger.error('EventBus handler 同步抛错', {
          eventType,
          error: err instanceof Error ? err.message : String(err),
        })
      }
      if (sub.once) {
        toRemove.push(sub)
      }
    }

    if (toRemove.length > 0) {
      this.removeOnceSubscriptions(toRemove)
    }
  }

  /**
   * 清空所有订阅
   */
  clear(): void {
    this.subscriptions.clear()
  }

  /**
   * 获取指定事件类型的订阅数（不含通配符 '*' 的订阅）
   * @param eventType 事件类型
   */
  listenerCount(eventType: string): number {
    const list = this.subscriptions.get(eventType)
    return list ? list.length : 0
  }

  // ─── 内部实现 ───────────────────────────────────

  /**
   * 收集目标订阅
   * 任何 emit 都会同时触发：
   *   1. 该事件类型的订阅
   *   2. 通配符 '*' 的订阅（若 eventType 本身就是 '*'，则触发全部）
   */
  private collectTargets(eventType: string): Subscription[] {
    const result: Subscription[] = []

    if (eventType === WILDCARD_EVENT) {
      // 通配符：触发全部订阅
      for (const list of this.subscriptions.values()) {
        result.push(...list)
      }
      return result
    }

    // 该事件类型的订阅
    const direct = this.subscriptions.get(eventType)
    if (direct) {
      result.push(...direct)
    }
    // 通配符订阅
    const wildcard = this.subscriptions.get(WILDCARD_EVENT)
    if (wildcard) {
      result.push(...wildcard)
    }

    return result
  }

  /**
   * 移除已触发的 once 订阅
   */
  private removeOnceSubscriptions(toRemove: Subscription[]): void {
    // 按 eventType 分组以批量处理
    const byType = new Map<string, Subscription[]>()
    for (const sub of toRemove) {
      const list = byType.get(sub.eventType) ?? []
      list.push(sub)
      byType.set(sub.eventType, list)
    }

    for (const [eventType, subs] of byType) {
      const list = this.subscriptions.get(eventType)
      if (!list) continue
      const filtered = list.filter(sub => !subs.includes(sub))
      if (filtered.length === 0) {
        this.subscriptions.delete(eventType)
      } else {
        this.subscriptions.set(eventType, filtered)
      }
    }
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局事件总线单例 */
export const globalEventBus = new EventBus()

export default globalEventBus
