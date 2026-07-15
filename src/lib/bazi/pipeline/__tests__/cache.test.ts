import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryPipelineCache } from '../cache'

describe('MemoryPipelineCache', () => {
  let cache: MemoryPipelineCache

  beforeEach(() => {
    cache = new MemoryPipelineCache({ maxEntries: 3, defaultTTL: 60000 })
  })

  it('set() 和 get() 基本存取', () => {
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')
  })

  it('get() 未命中返回 undefined', () => {
    expect(cache.get('nonexistent')).toBeUndefined()
  })

  it('has() 存在返回 true', () => {
    cache.set('key1', 'value1')
    expect(cache.has('key1')).toBe(true)
    expect(cache.has('nonexistent')).toBe(false)
  })

  it('delete() 删除条目', () => {
    cache.set('key1', 'value1')
    expect(cache.delete('key1')).toBe(true)
    expect(cache.get('key1')).toBeUndefined()
    expect(cache.delete('nonexistent')).toBe(false)
  })

  it('clear() 清除所有', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    cache.clear()
    expect(cache.getStats().size).toBe(0)
    expect(cache.get('a')).toBeUndefined()
  })

  it('TTL 过期后 get 返回 undefined', async () => {
    const shortCache = new MemoryPipelineCache({ defaultTTL: 1 }) // 1ms TTL
    shortCache.set('expiring', 'data')
    // 等待过期
    await new Promise(r => setTimeout(r, 10))
    expect(shortCache.get('expiring')).toBeUndefined()
  })

  it('LRU 淘汰：超出 maxEntries 时删除最旧', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    cache.set('d', 4) // 超出容量，a 被淘汰
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBe(3)
    expect(cache.get('d')).toBe(4)
  })

  it('getStats() 统计正确', () => {
    cache.set('x', 1)
    cache.get('x')  // hit
    cache.get('x')  // hit
    cache.get('missing') // miss
    cache.get('missing2') // miss
    const stats = cache.getStats()
    expect(stats.size).toBe(1)
    expect(stats.hits).toBe(2)
    expect(stats.misses).toBe(2)
    expect(stats.clearCount).toBe(0)
  })

  it('clearCount 累计 clear() 调用次数', () => {
    cache.set('a', 1)
    cache.clear()
    expect(cache.getStats().clearCount).toBe(1)
    cache.set('b', 2)
    cache.clear()
    expect(cache.getStats().clearCount).toBe(2)
  })

  it('自定义 TTL 覆盖默认', async () => {
    const longCache = new MemoryPipelineCache({ defaultTTL: 100000 })
    longCache.set('short', 'data', 1) // 1ms TTL
    await new Promise(r => setTimeout(r, 10))
    expect(longCache.get('short')).toBeUndefined()
    longCache.set('long', 'data', 100000) // 100s TTL
    expect(longCache.get('long')).toBe('data')
  })
})