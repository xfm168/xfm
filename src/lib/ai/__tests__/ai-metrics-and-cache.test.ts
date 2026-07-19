import { describe, it, expect, beforeEach } from 'vitest'
import { AIUsageMetrics } from '../AIUsageMetrics'
import { AITokenCounter } from '../AITokenCounter'
import { AIResponseCache } from '../AIResponseCache'

describe('AIUsageMetrics', () => {
  let metrics: AIUsageMetrics

  beforeEach(() => {
    metrics = new AIUsageMetrics()
  })

  it('初始状态全为 0', () => {
    const snap = metrics.getSnapshot()
    expect(snap.totalRequests).toBe(0)
    expect(snap.successfulRequests).toBe(0)
    expect(snap.failedRequests).toBe(0)
    expect(snap.cacheHits).toBe(0)
    expect(snap.fallbackCount).toBe(0)
    expect(snap.avgResponseTimeMs).toBe(0)
  })

  it('recordRequest 统计成功请求', () => {
    metrics.recordRequest('gemini', 'gemini-2.0-flash', 100)
    const snap = metrics.getSnapshot()
    expect(snap.totalRequests).toBe(1)
    expect(snap.successfulRequests).toBe(1)
    expect(snap.avgResponseTimeMs).toBe(100)
  })

  it('recordFailure 统计失败', () => {
    metrics.recordFailure('gemini', 'rate_limit')
    metrics.recordFailure('gemini', 'timeout')
    const snap = metrics.getSnapshot()
    expect(snap.failedRequests).toBe(2)
    expect(snap.failuresByCode['rate_limit']).toBe(1)
    expect(snap.failuresByCode['timeout']).toBe(1)
  })

  it('recordCacheHit 统计缓存命中', () => {
    metrics.recordCacheHit('gemini')
    metrics.recordCacheHit('openai')
    const snap = metrics.getSnapshot()
    expect(snap.cacheHits).toBe(2)
  })

  it('recordFallback 统计 fallback', () => {
    metrics.recordFallback('gemini', 'openai', 200)
    const snap = metrics.getSnapshot()
    expect(snap.fallbackCount).toBe(1)
  })

  it('avgResponseTime 计算平均', () => {
    metrics.recordRequest('gemini', 'gemini-2.0-flash', 100)
    metrics.recordRequest('gemini', 'gemini-2.0-flash', 200)
    metrics.recordRequest('gemini', 'gemini-2.0-flash', 300)
    expect(metrics.getSnapshot().avgResponseTimeMs).toBe(200)
  })

  it('reset 清零', () => {
    metrics.recordRequest('gemini', 'gemini-2.0-flash', 100)
    metrics.recordFailure('openai', 'auth')
    metrics.reset()
    const snap = metrics.getSnapshot()
    expect(snap.totalRequests).toBe(0)
    expect(snap.failedRequests).toBe(0)
  })
})

describe('AITokenCounter', () => {
  let counter: AITokenCounter

  beforeEach(() => {
    counter = new AITokenCounter()
  })

  it('record 记录 token 使用', () => {
    counter.record('gemini-2.0-flash', { promptTokens: 100, completionTokens: 50 })
    expect(counter.getTotalTokens()).toBe(150)
  })

  it('record 无 usage 时记录 0', () => {
    counter.record('gemini-2.0-flash')
    expect(counter.getTotalTokens()).toBe(0)
  })

  it('estimateCost 计算成本', () => {
    counter.record('gemini-2.0-flash', { promptTokens: 1_000_000, completionTokens: 1_000_000 })
    const cost = counter.getTotalCost()
    expect(cost).toBeCloseTo(0.075 + 0.3) // 0.375
  })

  it('getAverageTokens 计算平均', () => {
    counter.record('gemini-2.0-flash', { totalTokens: 100 })
    counter.record('gemini-2.0-flash', { totalTokens: 200 })
    expect(counter.getAverageTokens()).toBe(150)
  })

  it('getByModel 按模型分组', () => {
    counter.record('gemini-2.0-flash', { totalTokens: 100 })
    counter.record('gemini-2.0-flash', { totalTokens: 50 })
    counter.record('gpt-4o', { totalTokens: 200 })
    const gemini = counter.getByModel('gemini-2.0-flash')
    expect(gemini.tokens).toBe(150)
    expect(gemini.count).toBe(2)
    const gpt = counter.getByModel('gpt-4o')
    expect(gpt.tokens).toBe(200)
  })

  it('getSummary 返回汇总', () => {
    counter.record('gemini-2.0-flash', { promptTokens: 500, completionTokens: 200 })
    const summary = counter.getSummary()
    expect(summary.totalTokens).toBe(700)
    expect(summary.requestCount).toBe(1)
  })

  it('reset 清零', () => {
    counter.record('gemini-2.0-flash', { totalTokens: 100 })
    counter.reset()
    expect(counter.getTotalTokens()).toBe(0)
    expect(counter.getSummary().requestCount).toBe(0)
  })
})

describe('AIResponseCache', () => {
  let cache: AIResponseCache

  beforeEach(() => {
    cache = new AIResponseCache(60000)
  })

  it('set + get 缓存命中', () => {
    const messages = [{ role: 'user' as const, content: 'hello' }]
    const options = { model: 'gemini-2.0-flash' as const, temperature: 0.7 }
    const response = {
      content: 'Hi there!',
      model: 'gemini-2.0-flash' as const,
      provider: 'gemini' as const,
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    }
    cache.set(messages, options, response)
    const cached = cache.get(messages, options)
    expect(cached).toBeDefined()
    expect(cached!.content).toBe('Hi there!')
  })

  it('不同消息缓存未命中', () => {
    cache.set(
      [{ role: 'user' as const, content: 'hello' }],
      {},
      { content: 'A', model: 'gemini-2.0-flash' as const, provider: 'gemini' as const },
    )
    const cached = cache.get([{ role: 'user' as const, content: 'different' }], {})
    expect(cached).toBeUndefined()
  })

  it('clear 清空缓存', () => {
    cache.set(
      [{ role: 'user' as const, content: 'hello' }],
      {},
      { content: 'A', model: 'gemini-2.0-flash' as const, provider: 'gemini' as const },
    )
    cache.clear()
    expect(cache.size).toBe(0)
  })

  it('不同 model 不同缓存', () => {
    const messages = [{ role: 'user' as const, content: 'test' }]
    cache.set(messages, { model: 'gemini-2.0-flash' as const }, { content: 'gemini response', model: 'gemini-2.0-flash' as const, provider: 'gemini' as const })
    cache.set(messages, { model: 'gpt-4o' as const }, { content: 'gpt response', model: 'gpt-4o' as const, provider: 'openai' as const })
    const r1 = cache.get(messages, { model: 'gemini-2.0-flash' })
    const r2 = cache.get(messages, { model: 'gpt-4o' })
    expect(r1!.content).toBe('gemini response')
    expect(r2!.content).toBe('gpt response')
  })
})
