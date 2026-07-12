/**
 * RC3-1: 全局错误处理工具
 *
 * 功能：
 * - setupGlobalErrorHandlers(): 注册 window.onerror 和 unhandledrejection
 * - captureError(error, context?): 手动捕获错误，输出到 logger
 * - getErrorId(): 生成唯一错误 ID（时间戳+随机数）
 *
 * 错误格式化为标准结构：
 * { id, timestamp, message, stack, module, userAgent, url, context }
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { logger } from '../lib/logger'

// ══════════════════════════════════════════════════
//  类型定义
// ══════════════════════════════════════════════════

/** 标准化错误结构 */
export interface StandardError {
  /** 唯一错误 ID */
  id: string
  /** ISO 8601 时间戳 */
  timestamp: string
  /** 错误消息 */
  message: string
  /** 错误堆栈（可选） */
  stack?: string
  /** 来源模块 */
  module: string
  /** User-Agent */
  userAgent: string
  /** 发生 URL */
  url: string
  /** 附加上下文 */
  context?: Record<string, unknown>
}

// ══════════════════════════════════════════════════
//  公开 API
// ══════════════════════════════════════════════════

/**
 * 生成唯一错误 ID（时间戳 + 随机数）
 *
 * @example
 * getErrorId() // 'err_lr2k3j_a1b2c3d4'
 */
export function getErrorId(): string {
  var ts = Date.now().toString(36)
  var rand = Math.random().toString(36).substring(2, 10)
  return 'err_' + ts + '_' + rand
}

/**
 * 手动捕获错误，格式化为标准结构并通过 logger.error 输出
 *
 * @param error 错误对象
 * @param context 附加上下文（可选，可包含 module 字段指定来源模块）
 * @returns 标准化错误结构（包含 errorId）
 *
 * @example
 * try {
 *   // ... risky code ...
 * } catch (e) {
 *   var standardError = captureError(e as Error, { module: 'BaziEngine' })
 *   // standardError.id 可用于用户报告
 * }
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>,
): StandardError {
  // 确定来源模块
  var module = 'GlobalErrorHandler'
  if (context && typeof context.module === 'string') {
    module = context.module
  }

  // 构建标准化错误
  var standardError: StandardError = {
    id: getErrorId(),
    timestamp: new Date().toISOString(),
    message: error.message || String(error),
    stack: error.stack,
    module,
    userAgent: getSafeUserAgent(),
    url: getSafeUrl(),
  }

  if (context) {
    standardError.context = context
  }

  // 通过 logger 输出
  logger.error('GlobalErrorHandler', standardError.message, standardError)

  return standardError
}

/** 是否已注册全局处理器（防止重复注册） */
var isSetup = false

/** 保存的清理函数引用 */
var cleanupFn: (() => void) | null = null

/**
 * 注册全局错误处理器
 *
 * 监听：
 * - window.onerror: 同步 JS 错误
 * - unhandledrejection: 未捕获的 Promise 拒绝
 *
 * @returns 清理函数（调用后移除所有监听）
 *
 * @example
 * // 应用启动时注册
 * var cleanup = setupGlobalErrorHandlers()
 * // 应用卸载时清理（如需要）
 * // cleanup()
 */
export function setupGlobalErrorHandlers(): () => void {
  if (isSetup) {
    return cleanupFn || function () {}
  }
  isSetup = true

  // ─── window.onerror ─────────────────────────────

  var originalOnError = window.onerror

  window.onerror = function (
    message: Event | string,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ): boolean {
    var err: Error
    if (error) {
      err = error
    } else {
      err = new Error(typeof message === 'string' ? message : 'Unknown error')
    }

    captureError(err, {
      source: source || 'unknown',
      lineno: lineno || 0,
      colno: colno || 0,
      type: 'window.onerror',
    })

    // 调用原始处理器
    if (typeof originalOnError === 'function') {
      return Boolean(originalOnError.call(window, message, source, lineno, colno, error))
    }
    return false
  }

  // ─── unhandledrejection ─────────────────────────

  var rejectionHandler = function (event: PromiseRejectionEvent): void {
    var reason = event.reason
    var error: Error
    if (reason instanceof Error) {
      error = reason
    } else {
      error = new Error(typeof reason === 'string' ? reason : 'Unhandled promise rejection')
    }

    captureError(error, {
      type: 'unhandledrejection',
    })
  }

  window.addEventListener('unhandledrejection', rejectionHandler)

  // ─── 清理函数 ───────────────────────────────────

  cleanupFn = function (): void {
    window.onerror = originalOnError
    window.removeEventListener('unhandledrejection', rejectionHandler)
    isSetup = false
    cleanupFn = null
  }

  return cleanupFn
}

// ══════════════════════════════════════════════════
//  内部工具
// ══════════════════════════════════════════════════

/** 安全获取 User-Agent（SSR 兼容） */
function getSafeUserAgent(): string {
  try {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent
    }
  } catch {
    // ignore
  }
  return 'unknown'
}

/** 安全获取当前 URL（SSR 兼容） */
function getSafeUrl(): string {
  try {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.href
    }
  } catch {
    // ignore
  }
  return 'unknown'
}
