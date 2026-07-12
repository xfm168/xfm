/**
 * RC3-4: Cache 体系 - 分析结果缓存
 *
 * 缓存八字排盘结果、AI 分析结果等。
 *
 * Key 生成: birthDate + birthTime + gender + zishiStrategy 的哈希
 * TTL: 24 小时
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { CacheManager, hashString } from './CacheManager'

// ══════════════════════════════════════════════════
//  常量
// ══════════════════════════════════════════════════

/** 24 小时（毫秒） */
var TTL_24H = 24 * 60 * 60 * 1000

// ══════════════════════════════════════════════════
//  缓存实例
// ══════════════════════════════════════════════════

/** 分析结果缓存实例 */
export var analysisCache = new CacheManager('analysis', { persist: true })

// ══════════════════════════════════════════════════
//  公开 API
// ══════════════════════════════════════════════════

/** 分析缓存 key 生成参数 */
export interface AnalysisKeyParams {
  /** 出生日期（如 '1990-01-15'） */
  birthDate: string
  /** 出生时间（如 '08:30'） */
  birthTime: string
  /** 性别 */
  gender: string
  /** 子时策略（可选，默认 'late'） */
  zishiStrategy?: string
}

/**
 * 生成分析缓存 key
 *
 * 基于 birthDate + birthTime + gender + zishiStrategy 的哈希
 *
 * @example
 * var key = generateAnalysisKey({
 *   birthDate: '1990-01-15',
 *   birthTime: '08:30',
 *   gender: 'male',
 *   zishiStrategy: 'late',
 * })
 */
export function generateAnalysisKey(params: AnalysisKeyParams): string {
  var raw = params.birthDate + '|' +
    params.birthTime + '|' +
    params.gender + '|' +
    (params.zishiStrategy || 'late')
  return hashString(raw)
}

/**
 * 获取分析结果
 * @param key generateAnalysisKey 生成的 key
 * @returns 缓存的分析结果，不存在或过期返回 undefined
 */
export function getAnalysis<T = unknown>(key: string): T | undefined {
  return analysisCache.get<T>(key)
}

/**
 * 设置分析结果（TTL 24 小时）
 * @param key generateAnalysisKey 生成的 key
 * @param result 分析结果
 */
export function setAnalysis<T = unknown>(key: string, result: T): void {
  analysisCache.set<T>(key, result, TTL_24H)
}

/**
 * 删除分析结果
 */
export function deleteAnalysis(key: string): boolean {
  return analysisCache.delete(key)
}
