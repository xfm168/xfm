/**
 * RC3-4: Cache 体系 - 会话级缓存
 *
 * 页面切换时保持数据。存储当前会话的分析状态。
 * TTL: 30 分钟
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { CacheManager } from './CacheManager'

// ══════════════════════════════════════════════════
//  常量
// ══════════════════════════════════════════════════

/** 30 分钟（毫秒） */
var TTL_30M = 30 * 60 * 1000

// ══════════════════════════════════════════════════
//  缓存实例
// ══════════════════════════════════════════════════

/** 会话级缓存实例（持久化到 localStorage，支持页面刷新恢复） */
export var sessionCache = new CacheManager('session', { persist: true })

// ══════════════════════════════════════════════════
//  公开 API
// ══════════════════════════════════════════════════

/** 会话状态 key 常量 */
export var SESSION_KEYS = {
  CURRENT_ANALYSIS: 'current-analysis',
  CURRENT_BAZI_CHART: 'current-bazi-chart',
  CURRENT_FENGSHUI: 'current-fengshui',
  CURRENT_DIVINATION: 'current-divination',
  FORM_DRAFT: 'form-draft',
  SCROLL_POSITION: 'scroll-position',
} as const

/**
 * 获取会话状态
 * @param key 会话状态 key（推荐使用 SESSION_KEYS 常量）
 * @returns 缓存的会话状态，不存在或过期返回 undefined
 */
export function getSessionState<T = unknown>(key: string): T | undefined {
  return sessionCache.get<T>(key)
}

/**
 * 设置会话状态（TTL 30 分钟）
 * @param key 会话状态 key
 * @param value 会话状态数据
 */
export function setSessionState<T = unknown>(key: string, value: T): void {
  sessionCache.set<T>(key, value, TTL_30M)
}

/**
 * 删除会话状态
 */
export function deleteSessionState(key: string): boolean {
  return sessionCache.delete(key)
}

/**
 * 清空所有会话状态
 */
export function clearSessionState(): void {
  sessionCache.clear()
}

/**
 * 刷新会话状态 TTL（重新计时 30 分钟）
 * @param key 会话状态 key
 */
export function refreshSessionState<T = unknown>(key: string): T | undefined {
  var value = sessionCache.get<T>(key)
  if (value !== undefined) {
    sessionCache.set<T>(key, value, TTL_30M)
  }
  return value
}
