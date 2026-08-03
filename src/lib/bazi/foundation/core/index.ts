/**
 * P0-5A Foundation Core — Core 层统一导出
 *
 * XuanFeng Core OS 内核模块入口：
 *   Shared（错误/日志/接口）→ EventBus → Lifecycle → PluginManager → ConfigCenter
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

export * from '../shared'
export * from './eventbus/eventBus'
export * from './lifecycle/lifecycle'
export * from './plugin/pluginManager'
export * from './config/configCenter'

// DI container
export * from './di'

// Cache
export * from './cache'

// Scheduler
export * from './scheduler'

// 服务容器 —— 统一注册 Core 所有服务，禁止 new XXX()
export * from './container'
