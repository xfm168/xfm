import { describe, it, expect, beforeEach } from 'vitest'
import { PersistentCache } from '../PersistentCache'
import { CacheMetrics } from '../CacheMetrics'

describe('PersistentCache', () => {
  let cache: PersistentCache
  let metrics: CacheMetrics

  beforeEach(() => {
    metrics = new CacheMetrics()
    cache = new PersistentCache(
      { dbName: 'test-db', storeName: 'test-store', defaultTTL: 60000, maxEntries: 10 },
      metrics,
    )
  })

  it('tierName 为 localstorage（Node.js 降级）', () => {
    expect(cache.tierName).toBe('localstorage')
  })

  it('async set + get 基本存取', async () => {
    await cache.set('key1', { foo: 'bar' })
    const val = await cache.get('key1')
    expect(val).toEqual({ foo: 'bar' })
  })

  it('get miss 返回 undefined', async () => {
    const val = await cache.get('nonexistent')
    expect(val).toBeUndefined()
  })

  it('has 返回 boolean', async () => {
    await cache.set('k', 'v')
    expect(await cache.has('k')).toBe(true)
    expect(await cache.has('no')).toBe(false)
  })

  it('delete 删除条目', async () => {
    await cache.set('k', 'v')
    const existed = await cache.delete('k')
    expect(existed).toBe(true)
    expect(await cache.get('k')).toBeUndefined()
  })

  it('clear 清空所有', async () => {
    await cache.set('a', 1)
    await cache.set('b', 2)
    await cache.clear()
    expect(await cache.get('a')).toBeUndefined()
    expect(await cache.get('b')).toBeUndefined()
  })

  it('clearCount 累计', async () => {
    await cache.clear()
    await cache.clear()
    expect(cache.clearCount).toBe(2)
  })

  it('TTL 过期', async () => {
    const shortCache = new PersistentCache(
      { dbName: 'short-db', storeName: 'short-store', defaultTTL: 1, maxEntries: 10 },
      metrics,
    )
    await shortCache.set('exp', 'data')
    await new Promise(r => setTimeout(r, 10))
    expect(await shortCache.get('exp')).toBeUndefined()
  })

  it('自定义 TTL 覆盖默认', async () => {
    await cache.set('short', 'data', 1)
    await new Promise(r => setTimeout(r, 10))
    expect(await cache.get('short')).toBeUndefined()
  })

  it('永不过期 TTL=0', async () => {
    const forever = new PersistentCache(
      { dbName: 'forever-db', storeName: 'forever-store', defaultTTL: 0, maxEntries: 10 },
      metrics,
    )
    await forever.set('k', 'v')
    await new Promise(r => setTimeout(r, 5))
    expect(await forever.get('k')).toBe('v')
  })

  it('Metrics 记录 hit/miss', async () => {
    await cache.set('x', '1')
    await cache.get('x') // hit
    await cache.get('missing') // miss
    const snap = metrics.getSnapshot('localstorage')
    expect(snap.hits).toBe(1)
    expect(snap.misses).toBe(1)
  })

  it('Metrics 记录 write', async () => {
    await cache.set('a', 1)
    await cache.set('b', 2)
    const snap = metrics.getSnapshot('localstorage')
    expect(snap.totalWriteTime).toBeGreaterThanOrEqual(0)
  })

  it('Metrics 记录 clear', async () => {
    await cache.clear()
    expect(metrics.getSnapshot('localstorage').clearCount).toBe(1)
  })
})
