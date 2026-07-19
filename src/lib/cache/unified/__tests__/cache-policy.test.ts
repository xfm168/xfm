import { describe, it, expect } from 'vitest'
import { TTL, LRU_CAPACITY, CACHE_POLICIES, getPolicy } from '../CachePolicy'

describe('CachePolicy', () => {
  it('TTL 常量值正确', () => {
    expect(TTL.ThirtyMin).toBe(30 * 60 * 1000)
    expect(TTL.OneHour).toBe(60 * 60 * 1000)
    expect(TTL.OneDay).toBe(24 * 60 * 60 * 1000)
    expect(TTL.SevenDay).toBe(7 * 24 * 60 * 60 * 1000)
    expect(TTL.Never).toBe(0)
  })

  it('LRU_CAPACITY 常量值正确', () => {
    expect(LRU_CAPACITY.Pipeline).toBe(50)
    expect(LRU_CAPACITY.Analysis).toBe(100)
    expect(LRU_CAPACITY.Knowledge).toBe(500)
  })

  it('CACHE_POLICIES 包含所有命名空间策略', () => {
    expect(CACHE_POLICIES['pipeline']).toBeDefined()
    expect(CACHE_POLICIES['analysis']).toBeDefined()
    expect(CACHE_POLICIES['ai']).toBeDefined()
    expect(CACHE_POLICIES['image']).toBeDefined()
    expect(CACHE_POLICIES['knowledge']).toBeDefined()
    expect(CACHE_POLICIES['static']).toBeDefined()
  })

  it('pipeline 策略 TTL 为 30min', () => {
    expect(CACHE_POLICIES['pipeline'].defaultTTL).toBe(TTL.ThirtyMin)
    expect(CACHE_POLICIES['pipeline'].maxEntries).toBe(50)
    expect(CACHE_POLICIES['pipeline'].persist).toBe(true)
  })

  it('analysis 策略 TTL 为 7 天', () => {
    expect(CACHE_POLICIES['analysis'].defaultTTL).toBe(TTL.SevenDay)
  })

  it('knowledge 策略 TTL 为 Never', () => {
    expect(CACHE_POLICIES['knowledge'].defaultTTL).toBe(TTL.Never)
  })

  it('getPolicy 返回已知策略', () => {
    const p = getPolicy('pipeline')
    expect(p.namespace).toBe('pipeline')
    expect(p.defaultTTL).toBe(TTL.ThirtyMin)
  })

  it('getPolicy 对未知命名空间返回默认策略', () => {
    const p = getPolicy('unknown')
    expect(p.namespace).toBe('unknown')
    expect(p.defaultTTL).toBe(TTL.OneHour)
    expect(p.maxEntries).toBe(100)
    expect(p.persist).toBe(false)
  })

  it('ai 策略包含压缩阈值', () => {
    expect(CACHE_POLICIES['ai'].compressThreshold).toBe(100 * 1024)
  })
})