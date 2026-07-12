/**
 * RC3-2: 日志系统 - Logger 核心类
 *
 * 功能：
 * - 分级日志（DEBUG / INFO / WARN / ERROR / PERFORMANCE）
 * - 内存缓冲区（最近 1000 条）
 * - 同时输出到 console 和内存
 * - flush() 持久化到 localStorage（key: xuanfengmen_logs）
 * - 请求 ID / 匿名用户 ID 追踪
 * - 生产环境默认 INFO，开发环境默认 DEBUG
 *
 * 日志格式: [TIMESTAMP] [LEVEL] [MODULE] message {data}
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { anonymizeUserId, generateRequestId } from './anonymize'

// ══════════════════════════════════════════════════
//  类型定义
// ══════════════════════════════════════════════════

/** 日志级别枚举（数值越大优先级越高） */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  PERFORMANCE = 4,
}

/** 日志条目接口 */
export interface LogEntry {
  /** ISO 8601 时间戳 */
  timestamp: string
  /** 日志级别 */
  level: LogLevel
  /** 模块名称 */
  module: string
  /** 引擎名称（可选，如 BaziEngine / FengShuiEngine） */
  engine?: string
  /** 请求 ID */
  requestId?: string
  /** 匿名化用户 ID（SHA-256 前 8 位） */
  userId?: string
  /** 耗时（毫秒，可选） */
  duration?: number
  /** 内存使用（MB，可选） */
  memory?: number
  /** 日志消息 */
  message: string
  /** 附加数据 */
  data?: unknown
}

// ══════════════════════════════════════════════════
//  常量
// ══════════════════════════════════════════════════

/** 内存缓冲区最大条目数 */
var MAX_ENTRIES = 1000

/** localStorage 持久化 key */
var STORAGE_KEY = 'xuanfengmen_logs'

/** 是否开发环境 */
var IS_DEV = (function (): boolean {
  try {
    return Boolean(import.meta && (import.meta as any).env && (import.meta as any).env.DEV)
  } catch {
    return false
  }
})()

/** 级别名称映射 */
var LEVEL_NAMES: Record<number, string> = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR',
  4: 'PERF',
}

// ══════════════════════════════════════════════════
//  Logger 类
// ══════════════════════════════════════════════════

/**
 * 统一日志记录器
 *
 * @example
 * import { logger } from '@/lib/logger'
 * logger.info('BaziEngine', '排盘完成', { duration: 120 })
 * logger.error('GlobalErrorHandler', '捕获异常', { stack: error.stack })
 */
export class Logger {
  /** 内存缓冲区 */
  private entries: LogEntry[] = []

  /** 最小日志级别（低于此级别不记录） */
  private minLevel: LogLevel

  /** 当前请求 ID */
  private requestId: string | undefined

  /** 匿名化用户 ID */
  private userId: string | undefined

  /** 当前引擎名称 */
  private engine: string | undefined

  constructor() {
    // 生产环境默认 INFO，开发环境默认 DEBUG
    this.minLevel = IS_DEV ? LogLevel.DEBUG : LogLevel.INFO
    this.requestId = generateRequestId()
  }

  // ─── 分级日志方法 ───────────────────────────────

  /**
   * DEBUG 级别日志
   * 仅在开发环境或 minLevel <= DEBUG 时输出
   */
  debug(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, module, message, data)
  }

  /**
   * INFO 级别日志
   */
  info(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, module, message, data)
  }

  /**
   * WARN 级别日志
   */
  warn(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.WARN, module, message, data)
  }

  /**
   * ERROR 级别日志
   */
  error(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, module, message, data)
  }

  /**
   * PERFORMANCE 级别日志
   * @param module 模块名称
   * @param duration 耗时（毫秒）
   * @param data 附加数据
   */
  performance(module: string, duration: number, data?: unknown): void {
    this.log(LogLevel.PERFORMANCE, module, '性能记录', data, { duration })
  }

  // ─── 上下文设置 ─────────────────────────────────

  /**
   * 设置当前请求 ID
   */
  setRequestId(id: string): void {
    this.requestId = id
  }

  /**
   * 设置匿名用户 ID（内部自动 SHA-256 哈希）
   */
  setUserId(id: string): void {
    this.userId = anonymizeUserId(id)
  }

  /**
   * 设置当前引擎名称（后续日志自动附加）
   */
  setEngine(engine: string | undefined): void {
    this.engine = engine
  }

  /**
   * 设置最小日志级别
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level
  }

  // ─── 数据访问 ───────────────────────────────────

  /**
   * 获取内存中的日志条目（最近 1000 条）
   */
  getEntries(): LogEntry[] {
    return this.entries.slice()
  }

  /**
   * 将日志写入 localStorage（key: xuanfengmen_logs）
   * 写入失败时静默忽略（避免影响主流程）
   */
  flush(): void {
    try {
      var payload = JSON.stringify({
        flushedAt: new Date().toISOString(),
        count: this.entries.length,
        entries: this.entries,
      })
      localStorage.setItem(STORAGE_KEY, payload)
    } catch (e) {
      // localStorage 不可用或配额超限，静默忽略
    }
  }

  /**
   * 从 localStorage 加载日志（用于调试时恢复）
   */
  load(): LogEntry[] {
    try {
      var raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      var parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.entries)) {
        return parsed.entries as LogEntry[]
      }
      return []
    } catch {
      return []
    }
  }

  /**
   * 清空内存缓冲区
   */
  clear(): void {
    this.entries = []
  }

  // ─── 内部实现 ───────────────────────────────────

  /**
   * 核心日志方法
   */
  private log(
    level: LogLevel,
    module: string,
    message: string,
    data?: unknown,
    extra?: { duration?: number },
  ): void {
    // 级别过滤
    if (level < this.minLevel) {
      return
    }

    // 构建日志条目
    var entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
    }

    if (this.engine) {
      entry.engine = this.engine
    }
    if (this.requestId) {
      entry.requestId = this.requestId
    }
    if (this.userId) {
      entry.userId = this.userId
    }
    if (extra && typeof extra.duration === 'number') {
      entry.duration = extra.duration
    }
    if (data !== undefined) {
      entry.data = data
    }

    // 内存使用（Chrome performance.memory）
    var mem = this.getMemoryUsage()
    if (mem > 0) {
      entry.memory = mem
    }

    // 写入内存缓冲区
    this.entries.push(entry)
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.shift()
    }

    // 输出到 console
    this.outputToConsole(entry)
  }

  /**
   * 输出到 console（使用合适的 console 方法）
   */
  private outputToConsole(entry: LogEntry): void {
    var formatted = this.formatEntry(entry)
    var level = entry.level

    if (level === LogLevel.ERROR) {
      console.error(formatted, entry.data !== undefined ? entry.data : '')
    } else if (level === LogLevel.WARN) {
      console.warn(formatted, entry.data !== undefined ? entry.data : '')
    } else if (level === LogLevel.INFO) {
      console.info(formatted, entry.data !== undefined ? entry.data : '')
    } else if (level === LogLevel.DEBUG) {
      console.debug(formatted, entry.data !== undefined ? entry.data : '')
    } else if (level === LogLevel.PERFORMANCE) {
      console.log(formatted, entry.data !== undefined ? entry.data : '')
    }
  }

  /**
   * 格式化日志条目为字符串
   * 格式: [TIMESTAMP] [LEVEL] [MODULE] message {data}
   */
  private formatEntry(entry: LogEntry): string {
    var parts: string[] = []
    parts.push('[' + entry.timestamp + ']')
    parts.push('[' + (LEVEL_NAMES[entry.level] || 'LOG') + ']')

    var modulePart = entry.module
    if (entry.engine) {
      modulePart = modulePart + '/' + entry.engine
    }
    parts.push('[' + modulePart + ']')

    var msg = entry.message
    if (typeof entry.duration === 'number') {
      msg = msg + ' (' + entry.duration + 'ms)'
    }
    if (entry.requestId) {
      msg = msg + ' [req:' + entry.requestId.substring(0, 8) + ']'
    }
    parts.push(msg)

    var result = parts.join(' ')

    if (entry.data !== undefined) {
      var dataStr: string
      try {
        dataStr = JSON.stringify(entry.data)
      } catch {
        dataStr = String(entry.data)
      }
      result = result + ' ' + dataStr
    }

    return result
  }

  /**
   * 获取当前内存使用（MB）
   * 仅 Chrome 支持 performance.memory
   */
  private getMemoryUsage(): number {
    try {
      var perf = performance as any
      if (perf && perf.memory && perf.memory.usedJSHeapSize) {
        return Math.round(perf.memory.usedJSHeapSize / 1048576 * 100) / 100
      }
    } catch {
      // ignore
    }
    return 0
  }
}

// ══════════════════════════════════════════════════
//  默认实例
// ══════════════════════════════════════════════════

/** 默认 logger 实例（全局单例） */
export var logger = new Logger()

export default logger
