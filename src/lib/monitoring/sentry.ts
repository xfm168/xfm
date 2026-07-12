/**
 * Sentry 监控集成封装
 *
 * 正式使用时需安装 @sentry/react 并替换本文件的实现。
 * 当前版本为接口封装（no-op），所有函数在缺少 DSN 时不执行任何操作。
 */

/** Sentry 初始化配置 */
interface SentryInitOptions {
  dsn: string
  environment: string
  release: string
  sampleRate: number
  tracesSampleRate: number
  maxValueLength: number
}

/** Sentry 用户信息 */
interface SentryUser {
  id?: string
  email?: string
  username?: string
  [key: string]: unknown
}

/** 上下文信息 */
type SentryContext = Record<string, unknown>

/** Sentry 日志级别 */
type SentryLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal'

/** 缓存初始化状态 */
let initialized = false

/**
 * 初始化 Sentry
 *
 * 从环境变量读取配置：
 * - VITE_SENTRY_DSN: Sentry 数据源名称，为空时所有函数为 no-op
 * - MODE: 当前环境标识（development / production 等）
 * - VITE_APP_VERSION: 应用版本号
 *
 * 配置项:
 * - sampleRate: 1.0（全部采样）
 * - tracesSampleRate: 0.1（10% 性能追踪）
 * - maxValueLength: 1000
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string || ''

  if (!dsn) {
    return
  }

  /*
   * 正式使用时替换为:
   * import * as Sentry from '@sentry/react'
   * Sentry.init({ dsn, environment, release, sampleRate, tracesSampleRate, maxValueLength })
   */

  const options: SentryInitOptions = {
    dsn: dsn,
    environment: import.meta.env.MODE as string || 'unknown',
    release: 'xuanfengmen@' + (import.meta.env.VITE_APP_VERSION as string || '0.0.0'),
    sampleRate: 1.0,
    tracesSampleRate: 0.1,
    maxValueLength: 1000,
  }

  // eslint-disable-next-line no-console
  console.debug('[Sentry] init options:', JSON.stringify(options))

  initialized = true
}

/**
 * 手动捕获异常
 *
 * @param error - 错误对象或字符串
 * @param context - 附加上下文信息
 */
export function captureException(error: unknown, context?: SentryContext): void {
  if (!initialized) {
    return
  }

  /*
   * 正式使用时替换为:
   * Sentry.captureException(error, { extra: context })
   */

  // eslint-disable-next-line no-console
  console.error('[Sentry] captured exception:', error, context ? JSON.stringify(context) : '')
}

/**
 * 手动捕获消息
 *
 * @param message - 消息文本
 * @param level - 日志级别（默认 'info'）
 * @param context - 附加上下文信息
 */
export function captureMessage(
  message: string,
  level: SentryLevel = 'info',
  context?: SentryContext
): void {
  if (!initialized) {
    return
  }

  /*
   * 正式使用时替换为:
   * Sentry.captureMessage(message, { level, extra: context })
   */

  // eslint-disable-next-line no-console
  console.log('[Sentry] captured message (' + level + '):', message, context ? JSON.stringify(context) : '')
}

/**
 * 设置用户信息
 *
 * @param user - 用户对象，包含 id、email、username 等字段
 */
export function setUser(user: SentryUser | null): void {
  if (!initialized) {
    return
  }

  /*
   * 正式使用时替换为:
   * Sentry.setUser(user)
   */

  // eslint-disable-next-line no-console
  console.debug('[Sentry] set user:', user ? JSON.stringify(user) : 'null')
}
