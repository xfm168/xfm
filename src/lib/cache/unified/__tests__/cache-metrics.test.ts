import { describe, it, expect, beforeEach } from 'vitest'
import { CacheMetrics } from '../CacheMetrics'

describe('CacheMetrics', () => {
  let metrics: CacheMetrics

  beforeEach(() => {
    metrics = new CacheMetrics()
  })

  it('初始状态全为 0', () => {
    const snap = metrics.getSnapshot('memory')
    expect(snap.hits).toBe(0)
    expect(snap.misses).toBe(0)
    expect(snap.evictions).toBe(0)
    expect(snap.expired).toBe(0)
    expect(snap.size).toBe(0)
    expect(snap.hitRate).toBe(0)
    expect(snap.clearCount).toBe(0)
  })

  it('recordHit + recordMiss 正确统计', () => {
    metrics.recordHit('memory', 1)
    metrics.recordHit('memory', 2)
    metrics.recordMiss('memory', 3)
    const snap = metrics.getSnapshot('memory')
    expect(snap.hits).toBe(2)
    expect(snap.misses).toBe(1)
    expect(snap.hitRate).toBeCloseTo(2 / 3)
  })

  it('recordEviction 和 recordExpiration', () => {
    metrics.recordEviction('memory')
    metrics.recordEviction('memory')
    metrics.recordExpiration('memory')
    const snap = metrics.getSnapshot('memory')
    expect(snap.evictions).toBe(2)
    expect(snap.expired).toBe(1)
  })

  it('setSize 正确设置', () => {
    metrics.setSize('memory', 42)
    expect(metrics.getSnapshot('memory').size).toBe(42)
  })

  it('recordClear 统计 clear 调用次数', () => {
    metrics.recordClear('memory')
    metrics.recordClear('memory')
    metrics.recordClear('memory')
    expect(metrics.getSnapshot('memory').clearCount).toBe(3)
  })

  it('recordWrite 统计写入', () => {
    metrics.recordWrite('memory', 5)
    metrics.recordWrite('memory', 3)
    const snap = metrics.getSnapshot('memory')
    expect(snap.totalWriteTime).toBe(8)
    expect(snap.avgWriteTime).toBeCloseTo(4)
  })

  it('按 namespace 细分统计', () => {
    metrics.recordHit('memory', 1, 'pipeline')
    metrics.recordMiss('memory', 2, 'pipeline')
    metrics.recordHit('memory', 3, 'analysis')
    const mem = metrics.getSnapshot('memory')
    // 主统计包含所有
    expect(mem.hits).toBe(2)
    expect(mem.misses).toBe(1)
  })

  it('getAllSnapshots 返回三层', () => {
    const all = metrics.getAllSnapshots()
    expect(all.length).toBe(3)
    expect(all.map(s => s.tier)).toEqual(['memory', 'indexeddb', 'localstorage'])
  })

  it('reset 清零所有统计', () => {
    metrics.recordHit('memory', 1)
    metrics.recordMiss('memory', 1)
    metrics.reset()
    const snap = metrics.getSnapshot('memory')
    expect(snap.hits).toBe(0)
    expect(snap.misses).toBe(0)
  })

  it('avgReadTime 正确计算', () => {
    metrics.recordMiss('memory', 10)
    metrics.recordHit('memory', 20)
    const snap = metrics.getSnapshot('memory')
    expect(snap.avgReadTime).toBeCloseTo(15)
  })

  it('0 次读取时 avgReadTime 为 0', () => {
    const snap = metrics.getSnapshot('memory')
    expect(snap.avgReadTime).toBe(0)
  })

  it('跨 tier 独立统计', () => {
    metrics.recordHit('memory', 1)
    metrics.recordHit('memory', 2)
    metrics.recordHit('indexeddb', 5)
    const memSnap = metrics.getSnapshot('memory')
    const idbSnap = metrics.getSnapshot('indexeddb')
    expect(memSnap.hits).toBe(2)
    expect(idbSnap.hits).toBe(1)
    expect(memSnap.hitRate).toBeCloseTo(1.0)
    expect(idbSnap.hitRate).toBeCloseTo(1.0)
  })
})