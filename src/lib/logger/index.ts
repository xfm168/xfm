/**
 * RC3-2: 日志系统 - 统一导出
 *
 * 统一日志入口，所有模块通过此文件导入 logger。
 *
 * @example
 * import { logger, LogLevel } from '@/lib/logger'
 * logger.info('BaziEngine', '排盘完成')
 * logger.setLevel(LogLevel.DEBUG)
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

export { Logger, logger } from './Logger'
export { LogLevel } from './Logger'
export type { LogEntry } from './Logger'

export { anonymizeUserId, anonymizeIp, generateRequestId } from './anonymize'
