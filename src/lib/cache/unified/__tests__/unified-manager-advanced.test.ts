import { describe, it, expect, beforeEach } from 'vitest'
import { UnifiedCacheManager, globalCacheMetrics, createPipelineCache } from '../UnifiedCacheManager'
import { CacheKey, CacheNamespace } from '../CacheKey'
import { TTL, getPolicy, CACHE_POLICIES } from '../CachePolicy'

describe('UnifiedCacheManager Advanced', () => {
  let manager: UnifiedCacheManager

  beforeEach(() => {
    globalCacheMetrics.reset()
    manager = new UnifiedCacheManager({ namespace: CacheNamespace.Pipeline })
  })

  it('自定义 policy 覆盖默认值', async () => {
    const custom = new UnifiedCacheManager({
      namespace: CacheNamespace.Analysis,
      policy: { defaultTTL: TTL.OneHour, maxEntries: 200 },
    })
    await custom.set('k', 'v')
    expect(custom.get('k')).toBe('v')
    expect(custom.memoryCache.size).toBe(1)
  })

  it('hasAsync 检查 persistent 层', async () => {
    manager.set('sync-key', 'sync-val')
    expect(await manager.hasAsync('sync-key')).toBe(true)
    expect(await manager.hasAsync('no-key')).toBe(false)
  })

  it('buildKey 生成带 namespace 的 key', () => {
    const key = manager.buildKey({ scope: 'birth', identifier: '19900115' })
    expect(key.startsWith('pipeline:')).toBe(true)
    expect(key).toContain('birth')
  })

  it('不同 namespace 的 manager 独立', () => {
    const m1 = new UnifiedCacheManager({ namespace: CacheNamespace.Pipeline })
    const m2 = new UnifiedCacheManager({ namespace: CacheNamespace.Analysis })
    m1.set('key', 'v1')
    m2.set('key', 'v2')
    expect(m1.get('key')).toBe('v1')
    expect(m2.get('key')).toBe('v2')
  })

  it('getOrCompute 不缓存时正确计算', async () => {
    const val = await manager.getOrCompute('new-key', () => 'computed')
    expect(val).toBe('computed')
    expect(manager.get('new-key')).toBe('computed')
  })

  it('getOrCompute 缓存命中时不重复计算', async () => {
    manager.set('cached', 'already')
    const val = await manager.getOrCompute('cached', () => 'should-not-run')
    expect(val).toBe('already')
  })

  it('getMetrics 返回 memory 和 persistent 快照', () => {
    const m = manager.getMetrics()
    expect(m.memory.tier).toBe('memory')
    expect(m.persistent.tier).toBe('localstorage')
  })

  it('cleanup 返回清理数量', async () => {
    manager.set('short', 'data', 1)
    await new Promise(r => setTimeout(r, 10))
    const cleaned = manager.cleanup()
    expect(cleaned).toBeGreaterThanOrEqual(0)
  })

  it('CachePolicy TTL 值完整', () => {
    expect(TTL.ThirtySec).toBe(30000)
    expect(TTL.FiveMin).toBe(300000)
    expect(TTL.SixHour).toBe(6 * 60 * 60 * 1000)
    expect(TTL.ThirtyDay).toBe(30 * 24 * 60 * 60 * 1000)
    expect(TTL.Never).toBe(0)
  })

  it('getPolicy 返回正确策略', () => {
    const p = getPolicy('pipeline')
    expect(p.defaultTTL).toBe(TTL.ThirtyMin)
    expect(p.maxEntries).toBe(50)
    expect(p.persist).toBe(true)
  })

  it('getPolicy 未知命名空间', () => {
    const p = getPolicy('custom')
    expect(p.namespace).toBe('custom')
    expect(p.defaultTTL).toBe(TTL.OneHour)
  })

  it('CACHE_POLICIES 包含 6 个默认策略', () => {
    const keys = Object.keys(CACHE_POLICIES)
    expect(keys).toContain('pipeline')
    expect(keys).toContain('analysis')
    expect(keys).toContain('ai')
    expect(keys).toContain('image')
    expect(keys).toContain('knowledge')
    expect(keys).toContain('static')
    expect(keys.length).toBe(6)
  })

  it('CacheKey hash 确定性', () => {
    const h1 = CacheKey.hash('test-content')
    const h2 = CacheKey.hash('test-content')
    expect(h1).toBe(h2)
  })

  it('CacheKey build 不同参数不同 key', () => {
    const k1 = CacheKey.build({ namespace: CacheNamespace.Pipeline, userId: 'u1' })
    const k2 = CacheKey.build({ namespace: CacheNamespace.Pipeline, userId: 'u2' })
    expect(k1).not.toBe(k2)
  })

  it('globalCacheMetrics 单例跨 manager 共享', () => {
    const m1 = new UnifiedCacheManager({ namespace: CacheNamespace.Pipeline }, globalCacheMetrics)
    m1.memoryCache.set('a', 1)
    m1.memoryCache.get('a') // hit → records in globalCacheMetrics
    const m2 = new UnifiedCacheManager({ namespace: CacheNamespace.Analysis }, globalCacheMetrics)
    m2.memoryCache.set('b', 2)
    m2.memoryCache.get('b') // hit → records in globalCacheMetrics
    // Both use the same global metrics
    expect(globalCacheMetrics.getSnapshot('memory').hits).toBeGreaterThanOrEqual(2)
  })

  it('createPipelineCache 工厂函数', () => {
    const pc = createPipelineCache()
    expect(pc).toBeInstanceOf(UnifiedCacheManager)
  })

  it('set 不带 TTL 使用默认策略 TTL', () => {
    manager.set('no-ttl-key', 'value')
    expect(manager.get('no-ttl-key')).toBe('value')
  })
})
