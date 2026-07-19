/**
 * 八字模块安全与稳定入口
 *
 * 统一导出：
 *  - ErrorBoundary：渲染异常兜底
 *  - Logger：分级日志
 *  - Retry / Timeout / OfflineCache：网络与稳定性
 *  - Backup：数据备份与恢复
 */

export { BaziErrorBoundary, withBaziErrorBoundary } from './errorBoundary'
export type { BaziErrorBoundaryProps, BaziErrorBoundaryState } from './errorBoundary'

export { BaziLogger, baziLogger, createBaziLogger } from './logger'
export type { LogLevel, LogEntry, LoggerOptions } from './logger'

export {
  withRetry,
  withTimeout,
  withRetryAndTimeout,
  OfflineCache,
  offlineCache,
  isRetryableHttpError,
  TimeoutError,
} from './retry'
export type { RetryOptions, OfflineQueueItem } from './retry'

export {
  exportBaziData,
  importBaziData,
  autoBackup,
  restoreFromBackup,
  listBackups,
  deleteBackup,
  clearAllBackups,
  downloadBackup,
} from './backup'
export type { BaziBackupData, BackupRecord } from './backup'
