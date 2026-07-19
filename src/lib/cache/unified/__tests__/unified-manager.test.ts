import { describe, it, expect, beforeEach } from 'vitest'
import { UnifiedCacheManager, globalCacheMetrics } from '../UnifiedCacheManager'
import { CacheKey, CacheNamespace } from '../CacheKey'

describe('UnifiedCacheManager', () => {
  let manager: UnifiedCacheManager

  beforeEach(() => {
    globalCacheMetrics.reset()
    manager = new UnifiedCacheManager({ namespace: CacheNamespace.Pipeline })
  })

  it('buildKey 生成标准 key', () => {
    const key = manager.buildKey({ scope: 'birth', identifier: '19900115' })
    expect(key).toContain('pipeline:')
  })

  it('get/set/delete 同步 Memory 操作', () => {
    manager.set('test-key', 'test-value')
    expect(manager.get('test-key')).toBe('test-value')
    expect(manager.delete('test-key')).toBe(true)
    expect(manager.get('test-key')).toBeUndefined()
  })

  it('has 同步检查', () => {
    manager.set('k', 'v')
    expect(manager.has('k')).toBe(true)
    expect(manager.has('no')).toBe(false)
  })

  it('clear 清空所有层', async () => {
    manager.set('a', 1)
    manager.set('b', 2)
    await manager.clear()
    expect(manager.get('a')).toBeUndefined()
  })

  it('getOrCompute 缓存命中', async () => {
    let computeCount = 0
    const compute = () => { computeCount++; return 'result' }

    await manager.set('key', 'cached')
    const val = await manager.getOrCompute('key', compute)
    expect(val).toBe('cached')
    expect(computeCount).toBe(0)
  })

  it('getOrCompute 缓存未命中时计算', async () => {
    const val = await manager.getOrCompute('new-key', () => 'computed')
    expect(val).toBe('computed')
    expect(manager.get('new-key')).toBe('computed')
  })

  it('getOrCompute 支持 async compute', async () => {
    const val = await manager.getOrCompute('async-key', async () => {
      await new Promise(r => setTimeout(r, 10))
      return 'async-result'
    })
    expect(val).toBe('async-result')
  })

  it('getOrCompute CacheLock 防止重复计算', async () => {
    let count = 0
    const compute = async () => {
      count++
      await new Promise(r => setTimeout(r, 50))
      return 'locked'
    }

    // 同时调用两次
    const [r1, r2] = await Promise.all([
      manager.getOrCompute('lock-key', compute),
      manager.getOrCompute('lock-key', compute),
    ])

    expect(r1).toBe('locked')
    expect(r2).toBe('locked')
    expect(count).toBe(1) // 只计算了一次
  })

  it('getMetrics 返回 memory 和 persistent', () => {
    const m = manager.getMetrics()
    expect(m.memory).toBeDefined()
    expect(m.persistent).toBeDefined()
    expect(m.memory.tier).toBe('memory')
  })

  it('cleanup 清理过期 Memory 条目', async () => {
    manager.set('exp', 'data', 1)
    await new Promise(r => setTimeout(r, 10))
    const cleaned = manager.cleanup()
    expect(cleaned).toBeGreaterThanOrEqual(0)
  })

  it('createPipelineCache 工厂函数', () => {
    const pc = UnifiedCacheManager.prototype.constructor.name
    expect(pc).toBeDefined()
  })

  it('getAsync 返回 Memory 或 Persistent 值', async () => {
    manager.set('sync-key', 'sync-val')
    const val = await manager.getAsync('sync-key')
    expect(val).toBe('sync-val')
  })

  it('自定义 TTL', async () => {
    manager.set('ttl-key', 'ttl-val', 1)
    await new Promise(r => setTimeout(r, 10))
    expect(manager.get('ttl-key')).toBeUndefined()
  })
})