/**
 * Core 基础配置
 * 全局默认值与版本信息
 */

// 项目版本
export const CORE_VERSION = '2.0.0'

// 默认经度（北京 116.4°E）
export const DEFAULT_LONGITUDE = 116.4

// 默认纬度（北京 39.9°N）
export const DEFAULT_LATITUDE = 39.9

// 默认标准经度（中国统一使用东经 120°）
export const DEFAULT_STANDARD_LONGITUDE = 120

// 默认时区
export const DEFAULT_TIMEZONE = 'Asia/Shanghai'

// 默认历法
export const DEFAULT_CALENDAR_TYPE = 'solar' as const

// 默认子时策略
export const DEFAULT_ZISHI_STRATEGY = 'late' as const

// 默认是否启用真太阳时（玄风门默认开启，以专业排盘精度优先）
export const DEFAULT_USE_TRUE_SOLAR_TIME = true
