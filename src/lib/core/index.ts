/**
 * Core Domain — 玄风门项目唯一领域核心
 *
 * Single Source of Truth for:
 * - 常量 (constants)
 * - 类型 (types)
 * - 工具函数 (utils)
 * - 错误定义 (errors)
 * - 统一 Result<T> (result)
 * - 基础接口 (interfaces)
 * - 基础配置 (config)
 * - 基础值对象 (base)
 *
 * 所有模块必须从此导入基础数据，禁止重复定义。
 */

// ─── 类型 ───
export * from './types'

// ─── 常量 ───
export * from './constants'

// ─── 工具函数 ───
export * from './utils'

// ─── 统一 Result<T> ───
export { ok, fail, warn } from './result'
export type { Result, ErrorInfo, WarningInfo } from './result'

// ─── 错误定义 ───
export { createError, ERROR_CODES } from './errors'
export type { DomainError, DomainErrorCode } from './errors'

// ─── 接口 ───
export type {
  ICalculator,
  IAnalyzer,
  IPipeline,
  IRuleEngine,
  ICache,
  IKnowledgeEngine,
} from './interfaces'

// ─── 配置 ───
export {
  CORE_VERSION,
  DEFAULT_LONGITUDE,
  DEFAULT_LATITUDE,
  DEFAULT_STANDARD_LONGITUDE,
  DEFAULT_TIMEZONE,
  DEFAULT_CALENDAR_TYPE,
  DEFAULT_ZISHI_STRATEGY,
  DEFAULT_USE_TRUE_SOLAR_TIME,
} from './config'

// ─── Adapter ───
export {
  BirthInfoAdapter,
  ChartAdapter,
  ApiRequestBodyAdapter,
} from './adapters/birthDataAdapter'

// ─── 基础值对象 ───
export type { GanZhi, SixLines, FiveElementCount, CangGanMap } from './base'
