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
