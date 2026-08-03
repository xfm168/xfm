/**
 * P0-5A Foundation Core — 轻量级日志器
 *
 * 为 Foundation 各模块（EventBus / Lifecycle / PluginManager / ConfigCenter）
 * 提供统一的日志输出能力。
 *
 * 设计原则：
 *   - 不依赖外部日志库，仅使用 console + 内存缓冲
 *   - 支持分级：debug / info / warn / error
 *   - 支持 child(module) 创建带默认模块名的子 logger
 *   - 日志条目结构化：timestamp / level / module / message / 可选 data
 *   - 通过 setLevel 控制最小输出级别
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

// ============================================================
// 类型定义
// ============================================================

/** 日志级别（数值越大优先级越高） */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/** 级别名称映射（用于输出格式化） */
const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
}

/** 单条日志条目结构 */
export interface LogEntry {
  /** 时间戳（毫秒） */
  timestamp: number
  /** 日志级别 */
  level: LogLevel
  /** 模块名 */
  module: string
  /** 日志消息 */
  message: string
  /** 附加数据（可选） */
  data?: unknown
}

// ============================================================
// 默认配置
// ============================================================

/** 内存缓冲区最大条目数 */
const MAX_ENTRIES = 1000

/**
 * 探测是否处于开发环境
 * 兼容浏览器（import.meta.env.DEV）与 Node 环境
 */
function detectDev(): boolean {
  // 浏览器/Vite 环境：通过 import.meta.env.DEV 判断
  try {
    const meta = (import.meta as unknown as { env?: { DEV?: boolean } })
    if (meta && meta.env && typeof meta.env.DEV === 'boolean') {
      return meta.env.DEV
    }
  } catch {
    // import.meta 不可用（非 ES 模块上下文），忽略
  }
  // Node 环境：通过 NODE_ENV 判断
  try {
    if (typeof process !== 'undefined' && typeof process.env === 'object') {
      return process.env.NODE_ENV !== 'production'
    }
  } catch {
    // ignore
  }
  return false
}

// ============================================================
// FoundationLogger 类
// ============================================================

/**
 * Foundation 统一日志记录器
 *
 * @example
 * import { globalLogger as logger } from '@/lib/bazi/foundation/shared'
 * logger.info('eventBus', '事件订阅成功', { eventType: 'RuleLoaded' })
 *
 * const childLogger = logger.child('pluginManager')
 * childLogger.warn('插件依赖缺失', { pluginId: 'bazi' })
 */
export class FoundationLogger {
  /** 内存缓冲区（最近 MAX_ENTRIES 条） */
  private entries: LogEntry[] = []
  /** 最小日志级别（低于此级别不输出） */
  private minLevel: LogLevel
  /** 默认模块名（用于 child logger） */
  private readonly defaultModule?: string

  constructor(options: { minLevel?: LogLevel; defaultModule?: string } = {}) {
    this.minLevel = options.minLevel ?? (detectDev() ? LogLevel.DEBUG : LogLevel.INFO)
    this.defaultModule = options.defaultModule
  }

  // ─── 分级日志方法 ───────────────────────────────

  /** DEBUG 级别日志 */
  debug(message: string, data?: unknown, module?: string): void {
    this.log(LogLevel.DEBUG, message, data, module)
  }

  /** INFO 级别日志 */
  info(message: string, data?: unknown, module?: string): void {
    this.log(LogLevel.INFO, message, data, module)
  }

  /** WARN 级别日志 */
  warn(message: string, data?: unknown, module?: string): void {
    this.log(LogLevel.WARN, message, data, module)
  }

  /** ERROR 级别日志 */
  error(message: string, data?: unknown, module?: string): void {
    this.log(LogLevel.ERROR, message, data, module)
  }

  // ─── 配置方法 ───────────────────────────────────

  /** 设置最小日志级别 */
  setLevel(level: LogLevel): void {
    this.minLevel = level
  }

  /** 获取当前最小日志级别 */
  getLevel(): LogLevel {
    return this.minLevel
  }

  /**
   * 创建子 logger（携带默认模块名）
   * 子 logger 输出日志时会自动填充模块名
   */
  child(module: string): FoundationLogger {
    const childLogger = new FoundationLogger({
      minLevel: this.minLevel,
      defaultModule: module,
    })
    // 共享同一份内存缓冲区（便于全局聚合）
    childLogger.entries = this.entries
    return childLogger
  }

  // ─── 数据访问 ───────────────────────────────────

  /** 获取内存中的日志条目（最近 MAX_ENTRIES 条） */
  getEntries(): LogEntry[] {
    return this.entries.slice()
  }

  /** 清空内存缓冲区 */
  clear(): void {
    this.entries = []
  }

  // ─── 内部实现 ───────────────────────────────────

  /** 核心日志方法 */
  private log(level: LogLevel, message: string, data: unknown, moduleOverride?: string): void {
    // 级别过滤
    if (level < this.minLevel) {
      return
    }

    const module = moduleOverride ?? this.defaultModule ?? 'foundation'

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      module,
      message,
    }

    if (data !== undefined) {
      entry.data = data
    }

    // 写入内存缓冲区
    this.entries.push(entry)
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.shift()
    }

    // 输出到 console
    this.outputToConsole(entry)
  }

  /** 输出到 console（使用合适的 console 方法） */
  private outputToConsole(entry: LogEntry): void {
    const formatted = this.formatEntry(entry)

    if (entry.level === LogLevel.ERROR) {
      console.error(formatted, entry.data !== undefined ? entry.data : '')
    } else if (entry.level === LogLevel.WARN) {
      console.warn(formatted, entry.data !== undefined ? entry.data : '')
    } else if (entry.level === LogLevel.INFO) {
      console.info(formatted, entry.data !== undefined ? entry.data : '')
    } else {
      console.debug(formatted, entry.data !== undefined ? entry.data : '')
    }
  }

  /** 格式化日志条目为字符串 */
  private formatEntry(entry: LogEntry): string {
    const time = new Date(entry.timestamp).toISOString()
    const level = LEVEL_NAMES[entry.level] ?? 'LOG'
    let result = `[${time}] [${level}] [${entry.module}] ${entry.message}`

    if (entry.data !== undefined) {
      let dataStr: string
      try {
        dataStr = JSON.stringify(entry.data)
      } catch {
        dataStr = String(entry.data)
      }
      result = `${result} ${dataStr}`
    }

    return result
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局 Foundation Logger 单例 */
export const globalLogger = new FoundationLogger()

export default globalLogger
