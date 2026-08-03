/**
 * P0-5 最终预冻结 — 服务容器（Service Container）
 *
 * 统一注册 Core 所有服务为单例，禁止各模块 new XXX()。
 * 任何模块应通过 container.resolve('EventBus') 获取服务实例。
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

import { globalDIContainer } from '../di/container'
import { globalEventBus, EventBus } from '../eventbus/eventBus'
import { globalConfigCenter, ConfigCenter } from '../config/configCenter'
import { globalLogger } from '../../shared/logger'
import { globalPluginManager } from '../plugin/pluginManager'
import { globalScheduler } from '../scheduler/scheduler'
import { globalCache } from '../cache/cache'
import { globalRuleSandbox } from '../../rule/runtime/sandbox'
import { globalRuleRuntime } from '../../rule/runtime/ruleRuntime'

// ============================================================
// 服务令牌
// ============================================================

// 服务容器 —— 统一注册 Core 所有服务，禁止 new XXX()
export const ServiceTokens = {
  EventBus: 'EventBus',
  ConfigCenter: 'ConfigCenter',
  Logger: 'Logger',
  PluginManager: 'PluginManager',
  Scheduler: 'Scheduler',
  Cache: 'Cache',
  RuleSandbox: 'RuleSandbox',
  RuleRuntime: 'RuleRuntime',
} as const

export type ServiceToken = keyof typeof ServiceTokens

// ============================================================
// 初始化与解析
// ============================================================

/**
 * 初始化：预注册所有 Core 服务为单例
 * 只注册一次，防止重复注册覆盖实例。
 */
export function initServiceContainer(): void {
  // 只注册一次，防止重复
  if (globalDIContainer.has(ServiceTokens.EventBus)) return
  globalDIContainer.registerSingleton(ServiceTokens.EventBus, globalEventBus)
  globalDIContainer.registerSingleton(ServiceTokens.ConfigCenter, globalConfigCenter)
  globalDIContainer.registerSingleton(ServiceTokens.Logger, globalLogger)
  globalDIContainer.registerSingleton(ServiceTokens.PluginManager, globalPluginManager)
  globalDIContainer.registerSingleton(ServiceTokens.Scheduler, globalScheduler)
  globalDIContainer.registerSingleton(ServiceTokens.Cache, globalCache)
  globalDIContainer.registerSingleton(ServiceTokens.RuleSandbox, globalRuleSandbox)
  globalDIContainer.registerSingleton(ServiceTokens.RuleRuntime, globalRuleRuntime)
}

/**
 * 便捷解析函数
 * 自动确保容器已初始化，并按令牌解析服务实例。
 */
export function resolveService<T>(token: ServiceToken): T {
  initServiceContainer()
  return globalDIContainer.resolveOrThrow<T>(token)
}

// ============================================================
// 自动初始化
// ============================================================

// 模块加载即预注册所有服务，确保任意 import 后即可 resolve
initServiceContainer()

// 保留类型引用，便于 IDE 类型推导与服务令牌校验
export type {
  EventBus,
  ConfigCenter,
}
