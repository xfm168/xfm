/**
 * 八字模块日志系统 V4.4
 *
 * 提供分级日志、内存环形缓冲、批量上报与导出能力。
 * 专为八字命理模块设计：
 *  - 默认生产环境关闭 debug，减少开销
 *  - 日志驻留内存环形缓冲（默认 500 条），刷新页面后失效
 *  - 支持导出为纯文本，便于问题排查
 *  - 不耦合任何上报后端，上层可订阅日志事件自行上报
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: number
  /** 浏览器上下文（可选） */
  context?: {
    url?: string
    userAgent?: string
  }
}

export interface LoggerOptions {
  /** 最低输出级别，低于此级别不输出（仍可记录到缓冲） */
  level: LogLevel
  /** 环形缓冲容量 */
  bufferSize: number
  /** 是否输出到 console */
  console: boolean
  /** 是否在日志中附带浏览器上下文 */
  attachContext: boolean
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const LEVEL_LABEL: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: ' INFO',
  warn: ' WARN',
  error: 'ERROR',
}

const LEVEL_CONSOLE: Record<LogLevel, (...args: any[]) => void> = {
  debug: console.debug?.bind(console) ?? console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
}

/**
 * 八字模块日志器
 *
 * @example
 * const logger = new BaziLogger({ level: 'info' })
 * logger.info('命盘生成完成', { birthday: '1990-01-15' })
 * logger.error('排盘失败', err)
 * logger.exportLogs() // 导出纯文本
 */
export class BaziLogger {
  private buffer: LogEntry[] = []
  private options: LoggerOptions
  private listeners = new Set<(entry: LogEntry) => void>()

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = {
      level: this.defaultLevel(),
      bufferSize: 500,
      console: true,
      attachContext: true,
      ...options,
    }
  }

  /** 根据环境推断默认级别 */
  private defaultLevel(): LogLevel {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const mode = (import.meta as any).env.MODE
      if (mode === 'production') return 'warn'
      if (mode === 'test') return 'error'
    }
    return 'debug'
  }

  /* ---------------- 分级日志 ---------------- */

  debug(message: string, data?: any): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: any): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data)
  }

  error(message: string, data?: any): void {
    this.log('error', message, data)
  }

  /* ---------------- 级别控制 ---------------- */

  setLevel(level: LogLevel): void {
    this.options.level = level
  }

  getLevel(): LogLevel {
    return this.options.level
  }

  /** 是否启用某级别输出（考虑级别权重） */
  isEnabled(level: LogLevel): boolean {
    return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[this.options.level]
  }

  /* ---------------- 缓冲 / 导出 ---------------- */

  /** 订阅日志事件（用于上报） */
  subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** 获取内存中的日志条目 */
  getEntries(): LogEntry[] {
    return [...this.buffer]
  }

  /** 导出日志为纯文本（便于排查问题） */
  exportLogs(): string[] {
    return this.buffer.map(entry => this.formatEntry(entry))
  }

  /** 导出为完整文本块（含分隔） */
  exportAsString(): string {
    const header = [
      '# 玄风门八字模块日志导出',
      `> 导出时间：${new Date().toISOString()}`,
      `> 条目数：${this.buffer.length}`,
      `> 级别：${this.options.level}`,
      '',
      '```',
    ].join('\n')
    const body = this.exportLogs().join('\n')
    const footer = '\n```'
    return `${header}\n${body}${footer}`
  }

  /** 清空日志缓冲 */
  clear(): void {
    this.buffer = []
  }

  /** 调整缓冲容量（保留最新条目） */
  resize(size: number): void {
    this.options.bufferSize = size
    if (this.buffer.length > size) {
      this.buffer = this.buffer.slice(this.buffer.length - size)
    }
  }

  /* ---------------- 内部 ---------------- */

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: Date.now(),
      context: this.options.attachContext
        ? {
            url: typeof location !== 'undefined' ? location.href : undefined,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          }
        : undefined,
    }

    // 写入环形缓冲
    this.buffer.push(entry)
    if (this.buffer.length > this.options.bufferSize) {
      this.buffer.shift()
    }

    // 通知订阅者
    this.listeners.forEach(fn => {
      try {
        fn(entry)
      } catch {
        /* 订阅者异常不影响主流程 */
      }
    })

    // 控制台输出
    if (this.options.console && this.isEnabled(level)) {
      const fn = LEVEL_CONSOLE[level]
      const tag = `[八字][${LEVEL_LABEL[level]}]`
      if (data !== undefined) {
        fn(tag, message, data)
      } else {
        fn(tag, message)
      }
    }
  }

  private formatEntry(entry: LogEntry): string {
    const time = new Date(entry.timestamp).toISOString()
    const label = LEVEL_LABEL[entry.level]
    const base = `[${time}] [${label}] ${entry.message}`
    if (entry.data !== undefined) {
      try {
        const dataStr =
          typeof entry.data === 'string'
            ? entry.data
            : JSON.stringify(entry.data, null, 2)
        return `${base}\n  data: ${dataStr}`
      } catch {
        return `${base}\n  data: [unserializable]`
      }
    }
    return base
  }
}

/** 八字模块全局日志单例 */
export const baziLogger = new BaziLogger()

/**
 * 创建独立日志器实例（用于隔离场景，如测试）
 *
 * @example
 * const logger = createBaziLogger({ level: 'debug', bufferSize: 100 })
 */
export function createBaziLogger(options?: Partial<LoggerOptions>): BaziLogger {
  return new BaziLogger(options)
}
