/**
 * RC3-4: Cache 体系 - 六十四卦数据缓存
 *
 * 缓存六十四卦静态数据。TTL 无限（永不过期）。
 * 支持预加载所有卦象数据。
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { CacheManager } from './CacheManager'

// ══════════════════════════════════════════════════
//  类型定义
// ══════════════════════════════════════════════════

/** 卦象数据接口（与 src/lib/hexagram.ts Hexagram 兼容） */
export interface HexagramData {
  id: string
  number: number
  name: string
  symbol: string
  upper_trigram: string
  lower_trigram: string
  lines: string[]
  description: string
  fortune: string
  career: string
  wealth: string
  love: string
  health: string
  advice_do: string[]
  advice_dont: string[]
  [key: string]: unknown
}

// ══════════════════════════════════════════════════
//  缓存实例
// ══════════════════════════════════════════════════

/** 卦象数据缓存实例（TTL 无限，持久化到 localStorage） */
export var hexagramCache = new CacheManager('hexagram', { persist: true })

// ══════════════════════════════════════════════════
//  公开 API
// ══════════════════════════════════════════════════

/**
 * 预加载所有卦象数据
 * @param hexagrams 卦象数据数组
 */
export function preloadHexagrams(hexagrams: HexagramData[]): void {
  for (var i = 0; i < hexagrams.length; i++) {
    var h = hexagrams[i]
    // TTL = 0（永不过期）
    hexagramCache.set<HexagramData>(h.id, h)
  }
}

/**
 * 获取卦象数据
 * @param id 卦象 ID
 * @returns 卦象数据，不存在返回 undefined
 */
export function getHexagram(id: string): HexagramData | undefined {
  return hexagramCache.get<HexagramData>(id)
}

/**
 * 按卦号获取卦象数据
 * @param number 卦号（1-64）
 * @returns 卦象数据，不存在返回 undefined
 */
export function getHexagramByNumber(number: number): HexagramData | undefined {
  var key = 'num_' + number
  return hexagramCache.get<HexagramData>(key)
}

/**
 * 设置卦象数据（按卦号索引）
 * @param hexagram 卦象数据
 */
export function setHexagramByNumber(hexagram: HexagramData): void {
  var key = 'num_' + hexagram.number
  hexagramCache.set<HexagramData>(key, hexagram)
}

/**
 * 获取已缓存的卦象数量
 */
export function getHexagramCount(): number {
  return hexagramCache.size()
}
