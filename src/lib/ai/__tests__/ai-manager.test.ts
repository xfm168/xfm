import { describe, it, expect, beforeEach } from 'vitest'
import { AIManager } from '../AIManager'
import type { AIProviderConfig } from '../AIProvider'
import { PromptCache } from '../PromptCache'

describe('AIManager', () => {
  let manager: AIManager

  const mockProviders: AIProviderConfig[] = [
    { type: 'gemini', name: 'Gemini', enabled: true, priority: 1, models: ['gemini-2.0-flash'] },
    { type: 'openai', name: 'OpenAI', enabled: true, priority: 2, models: ['gpt-4o'] },
    { type: 'deepseek', name: 'DeepSeek', enabled: true, priority: 3, models: ['deepseek-v3'] },
  ]

  beforeEach(() => {
    manager = new AIManager({ providers: mockProviders, defaultProvider: 'gemini' })
  })

  it('创建 manager', () => {
    expect(manager.metrics).toBeDefined()
    expect(manager.cache).toBeDefined()
    expect(manager.tokenCounter).toBeDefined()
  })

  it('generate 使用 mock provider', async () => {
    manager.registerProvider('gemini', async () => ({
      content: 'Hello from Gemini!',
      model: 'gemini-2.0-flash',
      provider: 'gemini',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    }))

    const response = await manager.generate([{ role: 'user', content: 'Hello' }])
    expect(response.content).toBe('Hello from Gemini!')
    expect(response.provider).toBe('gemini')
  })

  it('generateJson 提取 JSON', async () => {
    manager.registerProvider('gemini', async () => ({
      content: 'Here is the result: {"score": 85, "level": "good"}',
      model: 'gemini-2.0-flash',
      provider: 'gemini',
    }))

    const result = await manager.generateJson<{ score: number; level: string }>(
      [{ role: 'user', content: 'Analyze' }],
    )
    expect(result.score).toBe(85)
    expect(result.level).toBe('good')
  })

  it('generateJson 无 JSON 时抛错', async () => {
    manager.registerProvider('gemini', async () => ({
      content: 'No JSON here',
      model: 'gemini-2.0-flash',
      provider: 'gemini',
    }))

    await expect(
      manager.generateJson([{ role: 'user', content: 'Test' }]),
    ).rejects.toThrow()
  })

  it('generateStream 降级为非流式', async () => {
    manager.registerProvider('gemini', async () => ({
      content: 'Stream content',
      model: 'gemini-2.0-flash',
      provider: 'gemini',
    }))

    const chunks: string[] = []
    for await (const chunk of manager.generateStream([{ role: 'user', content: 'Hi' }])) {
      chunks.push(chunk.content)
    }
    expect(chunks).toEqual(['Stream content'])
  })

  it('generateVision 构造图片消息', async () => {
    let receivedImages: string[] = []
    manager.registerProvider('gemini', async (msgs) => {
      receivedImages = msgs[0].images || []
      return {
        content: 'Image analysis',
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      }
    })

    await manager.generateVision(['data:image/png;base64,abc'], 'Analyze this')
    expect(receivedImages).toEqual(['data:image/png;base64,abc'])
  })

  it('Response Cache 命中', async () => {
    manager.registerProvider('gemini', async () => ({
      content: 'Cached response',
      model: 'gemini-2.0-flash',
      provider: 'gemini',
    }))

    const msgs = [{ role: 'user' as const, content: 'Cached question' }]
    await manager.generate(msgs)
    const r2 = await manager.generate(msgs)
    expect(r2.content).toBe('Cached response')
    // Metrics should show a cache hit
    expect(manager.metrics.getSnapshot().cacheHits).toBeGreaterThanOrEqual(1)
  })

  it('Fallback 到备用 provider', async () => {
    manager.registerProvider('gemini', async () => {
      throw new Error('Gemini down')
    })
    manager.registerProvider('openai', async () => ({
      content: 'Fallback response',
      model: 'gpt-4o',
      provider: 'openai',
    }))

    const response = await manager.generate([{ role: 'user', content: 'Hello' }])
    expect(response.content).toBe('Fallback response')
    expect(response.provider).toBe('openai')
  })

  it('Metrics 统计正确', async () => {
    manager.registerProvider('gemini', async () => ({
      content: 'OK',
      model: 'gemini-2.0-flash',
      provider: 'gemini',
    }))

    await manager.generate([{ role: 'user', content: 'Test' }])
    const snap = manager.metrics.getSnapshot()
    expect(snap.totalRequests).toBeGreaterThanOrEqual(1)
    expect(snap.successfulRequests).toBeGreaterThanOrEqual(1)
  })
})

describe('PromptCache', () => {
  let cache: PromptCache

  beforeEach(() => {
    cache = new PromptCache(60000)
  })

  it('set + get 缓存命中', () => {
    cache.set(
      { promptVersion: '1.0.0', promptHash: 'abc', model: 'gemini' },
      { content: 'cached', model: 'gemini', provider: 'gemini' },
    )
    const result = cache.get({ promptVersion: '1.0.0', promptHash: 'abc', model: 'gemini' })
    expect(result).toBeDefined()
    expect(result!.content).toBe('cached')
  })

  it('不同 promptVersion 缓存未命中', () => {
    cache.set(
      { promptVersion: '1.0.0', promptHash: 'abc' },
      { content: 'v1', model: 'gemini', provider: 'gemini' },
    )
    const result = cache.get({ promptVersion: '2.0.0', promptHash: 'abc' })
    expect(result).toBeUndefined()
  })

  it('clear 清空', () => {
    cache.set(
      { promptVersion: '1.0.0', promptHash: 'x' },
      { content: 'data', model: 'm', provider: 'p' },
    )
    cache.clear()
    expect(cache.size).toBe(0)
  })

  it('TTL 过期', async () => {
    const shortCache = new PromptCache(1)
    shortCache.set(
      { promptVersion: '1.0.0', promptHash: 'exp' },
      { content: 'data', model: 'm', provider: 'p' },
    )
    await new Promise(r => setTimeout(r, 10))
    expect(shortCache.get({ promptVersion: '1.0.0', promptHash: 'exp' })).toBeUndefined()
  })

  it('getStats 返回 metrics', () => {
    cache.set(
      { promptVersion: '1.0.0', promptHash: 'h' },
      { content: 'd', model: 'm', provider: 'p' },
    )
    cache.get({ promptVersion: '1.0.0', promptHash: 'h' }) // hit
    cache.get({ promptVersion: '1.0.0', promptHash: 'miss' }) // miss
    const stats = cache.getStats()
    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
  })
})
