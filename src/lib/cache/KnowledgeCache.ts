/**
 * RC3-4: Cache 体系 - 知识库缓存
 *
 * 缓存知识库静态数据（八字知识、风水知识等）。
 * TTL: 永久（静态数据不过期）。
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { CacheManager } from './CacheManager'

// ══════════════════════════════════════════════════
//  缓存实例
// ══════════════════════════════════════════════════

/** 知识库缓存实例（TTL 永久，持久化到 localStorage） */
export var knowledgeCache = new CacheManager('knowledge', { persist: true })

// ══════════════════════════════════════════════════
//  公开 API
// ══════════════════════════════════════════════════

/**
 * 获取知识库条目
 * @param key 知识条目 key（如 '十神-正官'）
 * @returns 缓存的知识条目，不存在返回 undefined
 */
export function getKnowledge<T = unknown>(key: string): T | undefined {
  return knowledgeCache.get<T>(key)
}

/**
 * 设置知识库条目（TTL 永久）
 * @param key 知识条目 key
 * @param value 知识条目数据
 */
export function setKnowledge<T = unknown>(key: string, value: T): void {
  // TTL = 0 表示永不过期
  knowledgeCache.set<T>(key, value)
}

/**
 * 批量设置知识库条目
 * @param entries 键值对映射
 */
export function setKnowledgeBatch<T = unknown>(entries: Record<string, T>): void {
  var keys = Object.keys(entries)
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    knowledgeCache.set<T>(key, entries[key])
  }
}

/**
 * 检查知识库条目是否存在
 */
export function hasKnowledge(key: string): boolean {
  return knowledgeCache.has(key)
}

/**
 * 获取知识库条目数量
 */
export function getKnowledgeCount(): number {
  return knowledgeCache.size()
}
