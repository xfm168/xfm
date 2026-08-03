/**
 * P0-5A Foundation Core — Shared 层统一导出
 *
 * 汇总导出 errors / logger / interfaces 三个模块，
 * 供 Foundation Core 各子模块（eventbus / lifecycle / plugin / config）统一引用。
 *
 * 用法：
 *   import { FoundationError, globalLogger, Plugin } from '@/lib/bazi/foundation/shared'
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

// Kernel 核心抽象（Result / Option / Either / Observable 等）
export * from './kernel'

// 标准错误类型
export * from './errors'

// 轻量级日志器
export * from './logger'

// 共享接口契约
export * from './interfaces'
