/**
 * RC3-4: Cache 体系 - 规则引擎结果缓存
 *
 * 缓存规则引擎的计算结果，避免重复计算。
 *
 * Key: 规则输入参数的哈希
 * TTL: 1 小时
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { CacheManager, hashString } from './CacheManager'

// ══════════════════════════════════════════════════
//  常量
// ══════════════════════════════════════════════════

/** 1 小时（毫秒） */
var TTL_1H = 60 * 60 * 1000

// ══════════════════════════════════════════════════
//  缓存实例
// ══════════════════════════════════════════════════

/** 规则引擎结果缓存实例（内存存储，不持久化） */
export var ruleCache = new CacheManager('rule', { persist: false })

// ══════════════════════════════════════════════════
//  公开 API
// ══════════════════════════════════════════════════

/**
 * 生成规则缓存 key
 *
 * 基于规则输入参数的 JSON 序列化哈希
 *
 * @param params 规则输入参数（任意可序列化对象）
 * @returns 8 字符十六进制哈希 key
 */
export function generateRuleKey(params: unknown): string {
  var raw: string
  try {
    raw = JSON.stringify(params)
  } catch {
    raw = String(params)
  }
  return hashString(raw)
}

/**
 * 获取规则引擎结果
 * @param key generateRuleKey 生成的 key
 * @returns 缓存的规则结果，不存在或过期返回 undefined
 */
export function getRuleResult<T = unknown>(key: string): T | undefined {
  return ruleCache.get<T>(key)
}

/**
 * 设置规则引擎结果（TTL 1 小时）
 * @param key generateRuleKey 生成的 key
 * @param result 规则计算结果
 */
export function setRuleResult<T = unknown>(key: string, result: T): void {
  ruleCache.set<T>(key, result, TTL_1H)
}

/**
 * 删除规则引擎结果
 */
export function deleteRuleResult(key: string): boolean {
  return ruleCache.delete(key)
}
