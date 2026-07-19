import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryCache } from '../MemoryCache'
import { CacheMetrics } from '../CacheMetrics'

describe('MemoryCache', () => {
  let cache: MemoryCache<string>
  let metrics: CacheMetrics

  beforeEach(() => {
    metrics = new CacheMetrics()
    cache = new MemoryCache({ maxEntries: 3, defaultTTL: 60000 }, metrics)
  })

  it('set + get 基本存取', () => {
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')
  })

  it('get miss 返回 undefined', () => {
    expect(cache.get('nonexistent')).toBeUndefined()
  })

  it('LRU 淘汰：超出容量删除最旧', () => {
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3')
    cache.set('d', '4') // 超出容量，a 被淘汰
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe('2')
    expect(cache.get('d')).toBe('4')
  })

  it('LRU：get 后变为最近使用', () => {
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3')
    cache.get('a') // a 变为最近
    cache.set('d', '4') // b 被淘汰（最旧）
    expect(cache.get('a')).toBe('1')
    expect(cache.get('b')).toBeUndefined()
  })

  it('has 返回 boolean', () => {
    cache.set('x', 'val')
    expect(cache.has('x')).toBe(true)
    expect(cache.has('no')).toBe(false)
  })

  it('delete 删除条目', () => {
    cache.set('k', 'v')
    expect(cache.delete('k')).toBe(true)
    expect(cache.get('k')).toBeUndefined()
    expect(cache.delete('k')).toBe(false)
  })

  it('clear 清空所有', () => {
    cache.set('a', '1')
    cache.set('b', '2')
    cache.clear()
    expect(cache.size).toBe(0)
    expect(cache.get('a')).toBeUndefined()
  })

  it('clearCount 累计', () => {
    cache.clear()
    cache.clear()
    expect(cache.clearCount).toBe(2)
  })

  it('TTL 过期返回 undefined', async () => {
    const shortCache = new MemoryCache<string>(
      { maxEntries: 10, defaultTTL: 1 },
      metrics,
    )
    shortCache.set('exp', 'data')
    await new Promise(r => setTimeout(r, 10))
    expect(shortCache.get('exp')).toBeUndefined()
  })

  it('自定义 TTL 覆盖默认', async () => {
    cache.set('short', 'data', 1)
    await new Promise(r => setTimeout(r, 10))
    expect(cache.get('short')).toBeUndefined()
    cache.set('long', 'data', 100000)
    expect(cache.get('long')).toBe('data')
  })

  it('cleanup 清理过期条目', async () => {
    const c = new MemoryCache<string>({ maxEntries: 10, defaultTTL: 1 }, metrics)
    c.set('a', '1')
    c.set('b', '2')
    await new Promise(r => setTimeout(r, 10))
    const cleaned = c.cleanup()
    expect(cleaned).toBe(2)
    expect(c.size).toBe(0)
  })

  it('keys 返回所有 key', () => {
    cache.set('a', '1')
    cache.set('b', '2')
    expect(cache.keys().sort()).toEqual(['a', 'b'])
  })

  it('Metrics 正确记录 hit/miss', () => {
    cache.set('x', '1')
    cache.get('x') // hit
    cache.get('missing') // miss
    const snap = metrics.getSnapshot('memory')
    expect(snap.hits).toBe(1)
    expect(snap.misses).toBe(1)
  })

  it('Metrics 记录 eviction', () => {
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3')
    cache.set('d', '4') // eviction
    expect(metrics.getSnapshot('memory').evictions).toBe(1)
  })

  it('永不过期 TTL=0', async () => {
    const forever = new MemoryCache<string>(
      { maxEntries: 10, defaultTTL: 0 },
      metrics,
    )
    forever.set('k', 'v')
    await new Promise(r => setTimeout(r, 5))
    expect(forever.get('k')).toBe('v')
  })
})