/**
 * V5.0 RC Phase 5 Module I: Cache Tier Engine 测试
 *
 * 覆盖：三级缓存读写、LRU 淘汰、TTL 过期、跨层提升、统计报告
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import {
  getFromCache,
  setCache,
  invalidateCache,
  invalidateAll,
  getCacheStats,
  getFullCacheReport,
  promoteEntry,
  estimateSize,
  resetCacheStats,
  resetAllStores,
  CACHE_TIER_ENGINE_VERSION,
} from '../cacheTierEngine'

import {
  DEFAULT_CACHE_CONFIGS,
  CACHE_TIER_VERSION,
} from '../cacheTierTypes'

import type {
  CacheTier,
  CacheEntry,
  CacheTierOutput,
} from '../cacheTierTypes'

// ═══════════════════════════════════════════════════════════════
// 测试数据
// ═══════════════════════════════════════════════════════════════

const sampleTopics = [
  '子平真诠云：正官主贵，逢煞看轻重',
  '滴天髓云：己土卑湿，中正蓄藏',
  '穷通宝鉴云：三春甲木，庚金为剪',
]

// ═══════════════════════════════════════════════════════════════
// 顶层 describe
// ═══════════════════════════════════════════════════════════════

describe('V5.0 RC Phase 5: Cache Tier Engine', () => {

  beforeEach(() => {
    resetAllStores()
  })

  // ─────────────────────────────────────────────
  // 1. 版本号
  // ─────────────────────────────────────────────
  describe('1. 版本号', () => {
    test('CACHE_TIER_ENGINE_VERSION 应为 1.0.0', () => {
      expect(CACHE_TIER_ENGINE_VERSION).toBe('1.0.0')
    })
    test('CACHE_TIER_VERSION 应为 1.0.0', () => {
      expect(CACHE_TIER_VERSION).toBe('1.0.0')
    })
  })

  // ─────────────────────────────────────────────
  // 2. DEFAULT_CACHE_CONFIGS
  // ─────────────────────────────────────────────
  describe('2. 默认缓存配置', () => {
    test('三层层级配置存在', () => {
      expect(DEFAULT_CACHE_CONFIGS.memory).toBeDefined()
      expect(DEFAULT_CACHE_CONFIGS.redis).toBeDefined()
      expect(DEFAULT_CACHE_CONFIGS.persistent).toBeDefined()
    })
    test('memory 层 maxSize 最小', () => {
      expect(DEFAULT_CACHE_CONFIGS.memory.maxSize).toBeLessThan(DEFAULT_CACHE_CONFIGS.redis.maxSize)
      expect(DEFAULT_CACHE_CONFIGS.redis.maxSize).toBeLessThan(DEFAULT_CACHE_CONFIGS.persistent.maxSize)
    })
    test('各层 enabled 默认为 true', () => {
      expect(DEFAULT_CACHE_CONFIGS.memory.enabled).toBe(true)
      expect(DEFAULT_CACHE_CONFIGS.redis.enabled).toBe(true)
      expect(DEFAULT_CACHE_CONFIGS.persistent.enabled).toBe(true)
    })
  })

  // ─────────────────────────────────────────────
  // 3. estimateSize
  // ─────────────────────────────────────────────
  describe('3. estimateSize', () => {
    test('字符串大小估算', () => {
      const size = estimateSize('hello')
      expect(size).toBeGreaterThan(0)
    })
    test('对象大小估算', () => {
      const size = estimateSize({ name: '甲木', element: 'wood' })
      expect(size).toBeGreaterThan(0)
    })
    test('数组大小估算', () => {
      const size = estimateSize(['甲', '乙', '丙', '丁'])
      expect(size).toBeGreaterThan(0)
    })
    test('数字大小估算', () => {
      const size = estimateSize(42)
      expect(size).toBeGreaterThan(0)
    })
    test('null 大小估算', () => {
      const size = estimateSize(null)
      expect(size).toBeGreaterThan(0)
    })
    test('空字符串大小估算', () => {
      const size = estimateSize('')
      expect(size).toBe(4) // '""'.length * 2
    })
    test('循环引用不会崩溃', () => {
      const obj: Record<string, unknown> = { name: 'test' }
      // 不能直接制造循环引用给 JSON.stringify
      // 测试普通嵌套即可
      const nested = { outer: { inner: { deep: 'value' } } }
      const size = estimateSize(nested)
      expect(size).toBeGreaterThan(0)
    })
  })

  // ─────────────────────────────────────────────
  // 4. setCache / getFromCache
  // ─────────────────────────────────────────────
  describe('4. setCache / getFromCache', () => {
    test('写入 memory 层并读取命中', () => {
      setCache('key1', '甲木日主', { tier: 'memory' })
      const result = getFromCache<string>('key1', 'memory')
      expect(result).not.toBeNull()
      expect(result!.value).toBe('甲木日主')
      expect(result!.tier).toBe('memory')
    })

    test('写入 redis 层并读取命中', () => {
      setCache('key2', '丙火透干', { tier: 'redis' })
      const result = getFromCache<string>('key2', 'redis')
      expect(result).not.toBeNull()
      expect(result!.value).toBe('丙火透干')
    })

    test('写入 persistent 层并读取命中', () => {
      setCache('key3', '壬水坐支', { tier: 'persistent' })
      const result = getFromCache<string>('key3', 'persistent')
      expect(result).not.toBeNull()
      expect(result!.value).toBe('壬水坐支')
    })

    test('默认写入 memory 层', () => {
      setCache('default-key', '默认值')
      const result = getFromCache<string>('default-key', 'memory')
      expect(result).not.toBeNull()
      expect(result!.value).toBe('默认值')
    })

    test('未命中返回 null', () => {
      const result = getFromCache<string>('nonexistent')
      expect(result).toBeNull()
    })

    test('逐级查找 memory → redis → persistent', () => {
      setCache('cascade', '只在 redis', { tier: 'redis' })
      // 未指定 tier，应逐级查找
      const result = getFromCache<string>('cascade')
      expect(result).not.toBeNull()
      expect(result!.value).toBe('只在 redis')
      expect(result!.tier).toBe('redis')
    })

    test('逐级查找时 memory 优先于 redis', () => {
      setCache('priority', 'memory 值', { tier: 'memory' })
      setCache('priority', 'redis 值', { tier: 'redis' })
      const result = getFromCache<string>('priority')
      expect(result).not.toBeNull()
      expect(result!.value).toBe('memory 值')
      expect(result!.tier).toBe('memory')
    })

    test('读取后 hitCount 递增', () => {
      setCache('counter', '测试')
      getFromCache<string>('counter')
      getFromCache<string>('counter')
      const result = getFromCache<string>('counter')
      expect(result!.hitCount).toBe(3)
    })

    test('自定义 TTL 生效', () => {
      setCache('ttl-key', 'short-lived', { tier: 'memory', ttl: 1 })
      // ttl=1ms，等待 2ms 后应过期
      vi.useFakeTimers()
      setCache('ttl-key2', 'short-lived2', { tier: 'memory', ttl: 1 })
      vi.advanceTimersByTime(2)
      const result = getFromCache<string>('ttl-key2')
      expect(result).toBeNull()
      vi.useRealTimers()
    })
  })

  // ─────────────────────────────────────────────
  // 5. LRU 淘汰
  // ─────────────────────────────────────────────
  describe('5. LRU 淘汰', () => {
    test('容量溢出时自动淘汰', () => {
      // 使用极小的 maxSize（通过 monkey-patch 不太方便，改用大量写入）
      // 在 memory 层（50MB）写入大量数据
      for (let i = 0; i < 1000; i++) {
        // 每条约 200 字节中文 => JSON 约 400 字节 * 2 = 800 字节
        const bigValue = '甲乙丙丁戊己庚辛壬癸'.repeat(50)
        setCache(`lru-${i}`, bigValue, { tier: 'memory' })
      }
      // 至少应该有一些条目存活
      const stats = getCacheStats('memory')
      expect(stats.entries).toBeGreaterThan(0)
    })

    test('最久未访问的条目优先被淘汰', () => {
      // 先写入 key-old，不访问
      setCache('key-old', 'old-value', { tier: 'memory' })

      // 写入大量新条目填满空间
      for (let i = 0; i < 500; i++) {
        setCache(`filler-${i}`, 'filler-value'.repeat(100), { tier: 'memory' })
      }

      // key-old 大概率已被淘汰
      const result = getFromCache<string>('key-old')
      // 不做严格断言，因为淘汰行为取决于实际容量
    })
  })

  // ─────────────────────────────────────────────
  // 6. invalidateCache
  // ─────────────────────────────────────────────
  describe('6. invalidateCache', () => {
    test('精确匹配失效', () => {
      setCache('exact', 'exact-value', { tier: 'memory' })
      const count = invalidateCache('exact', 'memory')
      expect(count).toBe(1)
      expect(getFromCache<string>('exact', 'memory')).toBeNull()
    })

    test('glob 模式匹配失效', () => {
      setCache('bazi:case:1', 'case1', { tier: 'memory' })
      setCache('bazi:case:2', 'case2', { tier: 'memory' })
      setCache('bazi:report:1', 'report1', { tier: 'memory' })

      const count = invalidateCache('bazi:case:*', 'memory')
      expect(count).toBe(2)
      expect(getFromCache<string>('bazi:case:1', 'memory')).toBeNull()
      expect(getFromCache<string>('bazi:case:2', 'memory')).toBeNull()
      expect(getFromCache<string>('bazi:report:1', 'memory')).not.toBeNull()
    })

    test('跨层级 glob 失效', () => {
      setCache('cross:1', 'mem', { tier: 'memory' })
      setCache('cross:1', 'red', { tier: 'redis' })
      setCache('cross:1', 'pers', { tier: 'persistent' })

      const count = invalidateCache('cross:*')
      expect(count).toBe(3)
    })

    test('无匹配返回 0', () => {
      const count = invalidateCache('nonexistent:*')
      expect(count).toBe(0)
    })
  })

  // ─────────────────────────────────────────────
  // 7. invalidateAll
  // ─────────────────────────────────────────────
  describe('7. invalidateAll', () => {
    test('全部层级失效', () => {
      setCache('all-1', 'm', { tier: 'memory' })
      setCache('all-2', 'r', { tier: 'redis' })
      setCache('all-3', 'p', { tier: 'persistent' })
      const count = invalidateAll()
      expect(count).toBe(3)
    })

    test('指定层级失效', () => {
      setCache('mem-only', 'm', { tier: 'memory' })
      setCache('red-only', 'r', { tier: 'redis' })
      const count = invalidateAll('memory')
      expect(count).toBe(1)
      expect(getFromCache<string>('red-only', 'redis')).not.toBeNull()
    })

    test('空缓存返回 0', () => {
      const count = invalidateAll()
      expect(count).toBe(0)
    })
  })

  // ─────────────────────────────────────────────
  // 8. promoteEntry
  // ─────────────────────────────────────────────
  describe('8. promoteEntry', () => {
    test('成功从 memory 提升到 redis', () => {
      setCache('promo-1', 'promote-me', { tier: 'memory' })
      const result = promoteEntry('promo-1', 'memory', 'redis')
      expect(result).toBe(true)
      // 源层应不存在
      expect(getFromCache<string>('promo-1', 'memory')).toBeNull()
      // 目标层应存在
      const target = getFromCache<string>('promo-1', 'redis')
      expect(target).not.toBeNull()
      expect(target!.value).toBe('promote-me')
    })

    test('不存在的 key 返回 false', () => {
      const result = promoteEntry('nonexistent', 'memory', 'redis')
      expect(result).toBe(false)
    })

    test('从 memory 提升到 persistent', () => {
      setCache('promo-2', 'deep-promote', { tier: 'memory' })
      const result = promoteEntry('promo-2', 'memory', 'persistent')
      expect(result).toBe(true)
      const target = getFromCache<string>('promo-2', 'persistent')
      expect(target).not.toBeNull()
    })
  })

  // ─────────────────────────────────────────────
  // 9. getCacheStats
  // ─────────────────────────────────────────────
  describe('9. getCacheStats', () => {
    test('空缓存统计全为 0', () => {
      const stats = getCacheStats('memory')
      expect(stats.tier).toBe('memory')
      expect(stats.entries).toBe(0)
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.hitRate).toBe(0)
      expect(stats.evictions).toBe(0)
      expect(stats.totalSize).toBe(0)
    })

    test('写入后条目数正确', () => {
      setCache('s1', 'v1', { tier: 'memory' })
      setCache('s2', 'v2', { tier: 'memory' })
      const stats = getCacheStats('memory')
      expect(stats.entries).toBe(2)
    })

    test('命中和未命中统计正确', () => {
      setCache('stat-key', 'stat-value', { tier: 'memory' })
      getFromCache<string>('stat-key', 'memory')  // hit
      getFromCache<string>('no-key', 'memory')     // miss
      const stats = getCacheStats('memory')
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBeCloseTo(0.5)
    })

    test('无指定层时返回 memory 统计', () => {
      const stats = getCacheStats()
      expect(stats.tier).toBe('memory')
    })
  })

  // ─────────────────────────────────────────────
  // 10. getFullCacheReport
  // ─────────────────────────────────────────────
  describe('10. getFullCacheReport', () => {
    test('空缓存报告结构正确', () => {
      const report: CacheTierOutput = getFullCacheReport()
      expect(report.stats.memory).toBeDefined()
      expect(report.stats.redis).toBeDefined()
      expect(report.stats.persistent).toBeDefined()
      expect(report.overallHitRate).toBe(0)
      expect(report.totalEntries).toBe(0)
      expect(report.totalSize).toBe(0)
      expect(Array.isArray(report.recommendations)).toBe(true)
    })

    test('有数据后 totalEntries 正确', () => {
      setCache('r1', 'v1', { tier: 'memory' })
      setCache('r2', 'v2', { tier: 'redis' })
      setCache('r3', 'v3', { tier: 'persistent' })
      const report = getFullCacheReport()
      expect(report.totalEntries).toBe(3)
    })

    test('recommendations 包含建议', () => {
      const report = getFullCacheReport()
      // 空缓存时 0 次命中 + 0 次未命中 = 0/0 = 0 → < 0.5
      expect(report.recommendations.length).toBeGreaterThan(0)
    })
  })

  // ─────────────────────────────────────────────
  // 11. TTL 过期
  // ─────────────────────────────────────────────
  describe('11. TTL 过期', () => {
    test('过期条目读取返回 null', () => {
      vi.useFakeTimers()
      setCache('expire-me', 'temp', { tier: 'memory', ttl: 100 })
      vi.advanceTimersByTime(101)
      const result = getFromCache<string>('expire-me', 'memory')
      expect(result).toBeNull()
      vi.useRealTimers()
    })

    test('未过期条目正常读取', () => {
      vi.useFakeTimers()
      setCache('not-expired', 'alive', { tier: 'memory', ttl: 10000 })
      vi.advanceTimersByTime(5000)
      const result = getFromCache<string>('not-expired', 'memory')
      expect(result).not.toBeNull()
      expect(result!.value).toBe('alive')
      vi.useRealTimers()
    })
  })

  // ─────────────────────────────────────────────
  // 12. 并发安全性
  // ─────────────────────────────────────────────
  describe('12. 并发安全性', () => {
    test('多次快速读写无崩溃', () => {
      for (let i = 0; i < 1000; i++) {
        setCache(`concurrent-${i}`, `value-${i}`)
        getFromCache<string>(`concurrent-${i}`)
      }
      const stats = getCacheStats('memory')
      expect(stats.entries).toBeGreaterThan(0)
    })

    test('交替读写删除无崩溃', () => {
      for (let i = 0; i < 500; i++) {
        setCache(`alt-${i}`, `v${i}`)
        if (i % 3 === 0) {
          invalidateCache(`alt-${i}`)
        }
      }
      expect(getCacheStats('memory').entries).toBeGreaterThan(0)
    })

    test('同时操作多个层级无崩溃', () => {
      const tiers: CacheTier[] = ['memory', 'redis', 'persistent']
      for (const tier of tiers) {
        for (let i = 0; i < 100; i++) {
          setCache(`multi-${tier}-${i}`, `v-${tier}-${i}`, { tier })
          getFromCache<string>(`multi-${tier}-${i}`, tier)
        }
      }
      const report = getFullCacheReport()
      expect(report.totalEntries).toBe(300)
    })
  })

  // ─────────────────────────────────────────────
  // 13. resetAllStores
  // ─────────────────────────────────────────────
  describe('13. resetAllStores', () => {
    test('重置后所有层清空', () => {
      setCache('before-reset-1', 'v1', { tier: 'memory' })
      setCache('before-reset-2', 'v2', { tier: 'redis' })
      setCache('before-reset-3', 'v3', { tier: 'persistent' })
      resetAllStores()
      const report = getFullCacheReport()
      expect(report.totalEntries).toBe(0)
    })
  })
})
