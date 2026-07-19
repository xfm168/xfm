import { describe, it, expect, beforeEach } from 'vitest'
import { AICostManager } from '../AICostManager'
import { AIQueue } from '../AIQueue'
import { batchGenerate } from '../AIBatchRequest'
import { AIAnalytics } from '../AIAnalytics'

// ============ AICostManager ============
describe('AICostManager', () => {
  let cm: AICostManager

  beforeEach(() => {
    cm = new AICostManager({ monthlyBudget: 100, warnThreshold: 0.8, stopThreshold: 1.0 })
  })

  it('record + snapshot', () => {
    cm.record({ provider: 'gemini', model: 'gemini-2.0-flash', tokens: 100, cost: 0.01, timestamp: Date.now(), traceId: 't1' })
    const snap = cm.getSnapshot()
    expect(snap.totalCost).toBeCloseTo(0.01)
    expect(snap.totalTokens).toBe(100)
  })

  it('byProvider 统计', () => {
    cm.record({ provider: 'gemini', model: 'm1', tokens: 50, cost: 0.005, timestamp: Date.now(), traceId: 't1' })
    cm.record({ provider: 'gemini', model: 'm1', tokens: 50, cost: 0.005, timestamp: Date.now(), traceId: 't2' })
    cm.record({ provider: 'openai', model: 'm2', tokens: 100, cost: 0.02, timestamp: Date.now(), traceId: 't3' })
    const snap = cm.getSnapshot()
    expect(snap.byProvider['gemini'].cost).toBeCloseTo(0.01)
    expect(snap.byProvider['openai'].cost).toBeCloseTo(0.02)
  })

  it('budgetWarning', () => {
    // 模拟当月消费 85
    for (let i = 0; i < 85; i++) {
      cm.record({ provider: 'gemini', model: 'm', tokens: 0, cost: 1, timestamp: Date.now(), traceId: `w${i}` })
    }
    expect(cm.getSnapshot().budgetWarning).toBe(true)  // 85/100 = 0.85 >= 0.8
  })

  it('budgetExceeded', () => {
    for (let i = 0; i < 101; i++) {
      cm.record({ provider: 'gemini', model: 'm', tokens: 0, cost: 1, timestamp: Date.now(), traceId: `e${i}` })
    }
    expect(cm.getSnapshot().budgetExceeded).toBe(true)
  })

  it('shouldStop', () => {
    for (let i = 0; i < 105; i++) {
      cm.record({ provider: 'gemini', model: 'm', tokens: 0, cost: 1, timestamp: Date.now(), traceId: `s${i}` })
    }
    expect(cm.shouldStop()).toBe(true)
  })

  it('reset', () => {
    cm.record({ provider: 'gemini', model: 'm', tokens: 10, cost: 0.01, timestamp: Date.now(), traceId: 'r' })
    cm.reset()
    expect(cm.getSnapshot().totalCost).toBe(0)
  })

  it('setBudget', () => {
    cm.setBudget({ monthlyBudget: 50 })
    for (let i = 0; i < 45; i++) {
      cm.record({ provider: 'gemini', model: 'm', tokens: 0, cost: 1, timestamp: Date.now(), traceId: `b${i}` })
    }
    expect(cm.getSnapshot().budgetWarning).toBe(true)
  })
})

// ============ AIQueue ============
describe('AIQueue', () => {
  it('enqueue + resolve', async () => {
    const q = new AIQueue(1, 0)
    const result = await q.enqueue(() => Promise.resolve('done'))
    expect(result).toBe('done')
  })

  it('enqueue + reject', async () => {
    const q = new AIQueue(1, 0)
    await expect(q.enqueue(() => Promise.reject(new Error('fail')))).rejects.toThrow()
  })

  it('priority 顺序执行', async () => {
    const q = new AIQueue(1, 0) // concurrency=1 保证顺序
    const order: string[] = []
    const p1 = q.enqueue(async () => { order.push('low'); return 'l' }, 'low')
    const p2 = q.enqueue(async () => { order.push('high'); return 'h' }, 'high')
    const p3 = q.enqueue(async () => { order.push('normal'); return 'n' }, 'normal')
    await Promise.all([p1, p2, p3])
    // queueMicrotask ensures all items are enqueued before processing starts
    expect(order[0]).toBe('high')
  })

  it('cancel', async () => {
    const q = new AIQueue(1, 10000)
    const p = q.enqueue(() => new Promise(() => {}), 'low')
    expect(q.size).toBeGreaterThanOrEqual(0)
    q.cancelAll()
    // The promise should be rejected - catch it to prevent unhandled rejection
    await p.catch(() => {})
  })

  it('cancelAll', async () => {
    const q = new AIQueue(1, 0)
    q.cancelAll()
    expect(q.size).toBe(0)
  })

  it('activeCount', () => {
    const q = new AIQueue(1, 0)
    expect(q.activeCount).toBe(0)
  })
})

// ============ batchGenerate ============
describe('batchGenerate', () => {
  it('批量执行', async () => {
    const executor = async (_msgs: any) => ({
      content: 'ok', model: 'gemini-2.0-flash' as const, provider: 'gemini' as const,
    })
    const result = await batchGenerate(
      [{ messages: [{ role: 'user' as const, content: '1' }] }],
      executor as any,
      { concurrency: 2 },
    )
    expect(result.successCount).toBe(1)
    expect(result.failureCount).toBe(0)
  })

  it('部分失败', async () => {
    let count = 0
    const executor = async (_msgs: any) => {
      count++
      if (count === 2) throw new Error('fail')
      return { content: 'ok', model: 'gemini-2.0-flash' as const, provider: 'gemini' as const }
    }
    const result = await batchGenerate(
      [{ messages: [{ role: 'user', content: '1' }] }, { messages: [{ role: 'user', content: '2' }] }],
      executor as any,
      { stopOnError: false },
    )
    expect(result.successCount).toBe(1)
    expect(result.failureCount).toBe(1)
  })

  it('stopOnError', async () => {
    const executor = async () => { throw new Error('always fail') }
    const result = await batchGenerate(
      [{ messages: [{ role: 'user', content: '1' }] }, { messages: [{ role: 'user', content: '2' }] }, { messages: [{ role: 'user', content: '3' }] }],
      executor as any,
      { stopOnError: true, concurrency: 1 },
    )
    expect(result.failureCount).toBeGreaterThanOrEqual(1)
  })

  it('onProgress callback', async () => {
    const progress: number[] = []
    await batchGenerate(
      [{ messages: [{ role: 'user', content: '1' }] }, { messages: [{ role: 'user', content: '2' }] }],
      async (_msgs: any) => ({ content: 'ok', model: 'gemini-2.0-flash' as const, provider: 'gemini' as const }),
      { onProgress: (c) => progress.push(c) },
    )
    expect(progress.length).toBe(2)
    expect(progress[1]).toBe(2)
  })
})

// ============ AIAnalytics ============
describe('AIAnalytics', () => {
  let analytics: AIAnalytics

  beforeEach(() => { analytics = new AIAnalytics() })

  it('空状态', () => {
    const snap = analytics.getSnapshot()
    expect(snap.totalRequests).toBe(0)
    expect(snap.successRate).toBe(0)
  })

  it('记录 + 快照', () => {
    analytics.record({
      provider: 'gemini', model: 'gemini-2.0-flash', latencyMs: 100,
      success: true, cached: false, retried: false, fallback: false,
      tokens: 50, cost: 0.01, timestamp: Date.now(),
    })
    analytics.record({
      provider: 'openai', model: 'gpt-4o', latencyMs: 200,
      success: true, cached: true, retried: false, fallback: false,
      tokens: 100, cost: 0.05, timestamp: Date.now(),
    })
    analytics.record({
      provider: 'gemini', model: 'gemini-2.0-flash', latencyMs: 50,
      success: false, cached: false, retried: true, fallback: true,
      tokens: 0, cost: 0, errorCode: 'rate_limit', timestamp: Date.now(),
    })
    const snap = analytics.getSnapshot()
    expect(snap.totalRequests).toBe(3)
    expect(snap.successRate).toBeCloseTo(2 / 3)
    expect(snap.cacheHitRate).toBeCloseTo(1 / 3)
    expect(snap.retryRate).toBeCloseTo(1 / 3)
    expect(snap.fallbackRate).toBeCloseTo(1 / 3)
    expect(snap.totalTokens).toBe(150)
    expect(snap.totalCost).toBeCloseTo(0.06)
    expect(snap.byProvider['gemini'].requests).toBe(2)
  })

  it('p50/p95 latency', () => {
    for (let i = 1; i <= 10; i++) {
      analytics.record({
        provider: 'gemini', model: 'm', latencyMs: i * 10,
        success: true, cached: false, retried: false, fallback: false,
        tokens: 0, cost: 0, timestamp: Date.now(),
      })
    }
    const snap = analytics.getSnapshot()
    expect(snap.p50LatencyMs).toBe(50) // 5th value
    expect(snap.p95LatencyMs).toBe(100) // ~9.5th value
  })

  it('reset', () => {
    analytics.record({
      provider: 'gemini', model: 'm', latencyMs: 10,
      success: true, cached: false, retried: false, fallback: false,
      tokens: 0, cost: 0, timestamp: Date.now(),
    })
    analytics.reset()
    expect(analytics.getSnapshot().totalRequests).toBe(0)
  })
})
