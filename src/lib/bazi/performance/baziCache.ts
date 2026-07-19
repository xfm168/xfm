/**
 * 八字命盘缓存 V4.4
 *
 * 基于出生数据哈希的命盘 / 分析结果缓存层。
 * 与 `baziPerformance.ts` 的 BaziAnalysisCache 互补：
 *  - BaziAnalysisCache：通用 KV 缓存（任意 key）
 *  - 本模块：基于 BirthData 的语义化缓存（命盘 / 分析专用）
 *
 * 缓存策略：
 *  - 命盘缓存 TTL 较长（同一出生数据排盘结果不变，默认 24h）
 *  - 分析缓存 TTL 较短（涉及规则版本，默认 30min）
 *  - 全部驻留内存（BaziAnalysisCache 实例），刷新页面后失效
 *
 * 设计原则：不修改排盘算法，仅在调用层缓存结果。
 */

import { BaziAnalysisCache } from './baziPerformance'
import type { BirthData } from '@/lib/core'
import type { BaZiChart } from '../types'

/* ------------------------------------------------------------------ *
 * 缓存键生成（基于出生数据哈希）
 * ------------------------------------------------------------------ */

/**
 * 将出生数据序列化为稳定字符串（字段排序，避免对象 key 顺序影响哈希）
 */
function serializeBirthData(birthData: BirthData): string {
  // 显式取核心字段，忽略 hash / trueSolarTime 等派生字段
  const core = {
    birthday: birthData.birthday,
    birthTime: birthData.birthTimeUnknown ? 'unknown' : birthData.birthTime,
    gender: birthData.gender,
    longitude: birthData.longitude,
    latitude: birthData.latitude,
    timezone: birthData.timezone,
    calendarType: birthData.calendarType,
    useTrueSolarTime: birthData.useTrueSolarTime,
    childHourStrategy: birthData.childHourStrategy,
    location: birthData.location,
  }
  return JSON.stringify(core)
}

/**
 * 简易稳定哈希（djb2 变体），无外部依赖
 * 仅用于缓存键，非密码学用途
 */
function hashString(str: string): string {
  let h1 = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h1 ^= str.charCodeAt(i)
    h1 = Math.imul(h1, 0x01000193)
  }
  // 转 16 进制无符号
  return (h1 >>> 0).toString(16)
}

/**
 * 根据出生数据生成缓存键
 *
 * @example
 * const key = getCacheKey(birthData) // 'bazi:chart:a1b2c3d4'
 */
export function getCacheKey(birthData: BirthData): string {
  // 复用已计算的 hash（如果存在），避免重复计算
  const seed = birthData.hash ?? serializeBirthData(birthData)
  return `bazi:chart:${hashString(seed)}`
}

/**
 * 分析结果缓存键（与命盘键区分，便于独立清理）
 */
export function getAnalysisCacheKey(birthData: BirthData): string {
  const seed = birthData.hash ?? serializeBirthData(birthData)
  return `bazi:analysis:${hashString(seed)}`
}

/* ------------------------------------------------------------------ *
 * 缓存实例（模块级单例）
 * ------------------------------------------------------------------ */

/** 命盘缓存：同出生数据排盘结果不变，TTL 较长（24h） */
const chartCache = new BaziAnalysisCache(30)

/** 分析结果缓存：涉及规则版本，TTL 较短（30min） */
const analysisCache = new BaziAnalysisCache(30)

/** 命盘默认 TTL：24 小时 */
export const CHART_CACHE_TTL = 24 * 60 * 60 * 1000
/** 分析默认 TTL：30 分钟 */
export const ANALYSIS_CACHE_TTL = 30 * 60 * 1000

/* ------------------------------------------------------------------ *
 * 命盘缓存
 * ------------------------------------------------------------------ */

/** 缓存命盘 */
export function cacheChart(birthData: BirthData, chart: BaZiChart): void {
  chartCache.set(getCacheKey(birthData), chart, CHART_CACHE_TTL)
}

/** 读取缓存的命盘（未命中返回 null） */
export function getCachedChart(birthData: BirthData): BaZiChart | null {
  return chartCache.get<BaZiChart>(getCacheKey(birthData))
}

/** 删除指定出生数据的命盘缓存 */
export function invalidateChart(birthData: BirthData): void {
  chartCache.delete(getCacheKey(birthData))
}

/* ------------------------------------------------------------------ *
 * 分析结果缓存
 * ------------------------------------------------------------------ */

/** 缓存分析结果 */
export function cacheAnalysis(birthData: BirthData, analysis: any): void {
  analysisCache.set(getAnalysisCacheKey(birthData), analysis, ANALYSIS_CACHE_TTL)
}

/** 读取缓存的分析结果（未命中返回 null） */
export function getCachedAnalysis(birthData: BirthData): any | null {
  return analysisCache.get(getAnalysisCacheKey(birthData))
}

/** 删除指定出生数据的分析缓存 */
export function invalidateAnalysis(birthData: BirthData): void {
  analysisCache.delete(getAnalysisCacheKey(birthData))
}

/* ------------------------------------------------------------------ *
 * 全局管理
 * ------------------------------------------------------------------ */

/** 清空所有命盘缓存 */
export function clearChartCache(): void {
  chartCache.clear()
}

/** 清空所有分析缓存 */
export function clearAnalysisCache(): void {
  analysisCache.clear()
}

/** 清空全部八字缓存 */
export function clearAllBaziCache(): void {
  chartCache.clear()
  analysisCache.clear()
}

/** 缓存命中统计（便于性能监控） */
export function getBaziCacheStats() {
  return {
    chart: chartCache.getStats(),
    analysis: analysisCache.getStats(),
  }
}

/* ------------------------------------------------------------------ *
 * 带缓存的排盘封装（推荐入口）
 * ------------------------------------------------------------------ */

/**
 * 带缓存的排盘调用
 *
 * 命中缓存时直接返回，未命中时调用 calculateFn 并写回缓存。
 * 用于在不修改原排盘函数的前提下为其叠加缓存能力。
 *
 * @example
 * import { calculateBaZiFromBirthData } from '../calculator'
 * const chart = cachedCalculate(birthData, calculateBaZiFromBirthData)
 */
export function cachedCalculate<T extends BaZiChart>(
  birthData: BirthData,
  calculateFn: (data: BirthData) => T
): T {
  const cached = getCachedChart(birthData)
  if (cached) return cached as T

  const result = calculateFn(birthData)
  cacheChart(birthData, result)
  return result
}

/**
 * 带缓存的分析调用（同步版本）
 */
export function cachedAnalyze<T>(
  birthData: BirthData,
  analyzeFn: () => T
): T {
  const cached = getCachedAnalysis(birthData)
  if (cached) return cached as T

  const result = analyzeFn()
  cacheAnalysis(birthData, result)
  return result
}
