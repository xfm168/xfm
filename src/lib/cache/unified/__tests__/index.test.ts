import { describe, it, expect } from 'vitest'
import {
  CacheKey, CacheNamespace, CACHE_VERSION,
  TTL, LRU_CAPACITY, CACHE_POLICIES, getPolicy,
  CacheMetrics,
  MemoryCache,
  PersistentCache,
  UnifiedCacheManager, globalCacheMetrics, createPipelineCache, createAnalysisCache, createAICache,
} from '../index'

describe('Unified Cache Index exports', () => {
  it('导出 CacheKey 和 CacheNamespace', () => {
    expect(CacheKey).toBeDefined()
    expect(CacheNamespace.Pipeline).toBe('pipeline')
  })

  it('导出 CACHE_VERSION', () => {
    expect(CACHE_VERSION).toBe('1.0.0')
  })

  it('导出 TTL 常量', () => {
    expect(TTL.ThirtyMin).toBe(30 * 60 * 1000)
  })

  it('导出 LRU_CAPACITY 常量', () => {
    expect(LRU_CAPACITY.Pipeline).toBe(50)
  })

  it('导出 CACHE_POLICIES 和 getPolicy', () => {
    expect(CACHE_POLICIES).toBeDefined()
    expect(typeof getPolicy).toBe('function')
  })

  it('导出 CacheMetrics', () => {
    expect(CacheMetrics).toBeDefined()
    const m = new CacheMetrics()
    expect(m.getSnapshot('memory')).toBeDefined()
  })

  it('导出 MemoryCache', () => {
    expect(MemoryCache).toBeDefined()
  })

  it('导出 PersistentCache', () => {
    expect(PersistentCache).toBeDefined()
  })

  it('导出 UnifiedCacheManager', () => {
    expect(UnifiedCacheManager).toBeDefined()
  })

  it('导出 globalCacheMetrics 单例', () => {
    expect(globalCacheMetrics).toBeInstanceOf(CacheMetrics)
  })

  it('导出工厂函数', () => {
    expect(typeof createPipelineCache).toBe('function')
    expect(typeof createAnalysisCache).toBe('function')
    expect(typeof createAICache).toBe('function')
  })

  it('createPipelineCache 返回正确 namespace', () => {
    const pc = createPipelineCache()
    expect(pc.buildKey({})).toContain('pipeline:')
  })

  it('createAnalysisCache 返回正确 namespace', () => {
    const ac = createAnalysisCache()
    expect(ac.buildKey({})).toContain('analysis:')
  })

  it('createAICache 返回正确 namespace', () => {
    const ac = createAICache()
    expect(ac.buildKey({})).toContain('ai:')
  })

  it('Pipeline H1 API 保持兼容', () => {
    // 确认 H1 PipelineCache 接口不被破坏
    // MemoryCache 有 get/set/delete/has/clear
    const mem = new MemoryCache({ maxEntries: 10, defaultTTL: 60000 }, new CacheMetrics())
    expect(typeof mem.get).toBe('function')
    expect(typeof mem.set).toBe('function')
    expect(typeof mem.delete).toBe('function')
    expect(typeof mem.has).toBe('function')
    expect(typeof mem.clear).toBe('function')
  })
})
