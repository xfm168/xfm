import { describe, it, expect } from 'vitest'
import { CacheKey, CacheNamespace, CACHE_VERSION } from '../CacheKey'

describe('CacheKey', () => {
  it('build() 生成标准格式 key', () => {
    const key = CacheKey.build({
      namespace: CacheNamespace.Pipeline,
      userId: 'user123',
      scope: 'birth',
      identifier: '19900115',
    })
    expect(key).toBe(`pipeline:${CACHE_VERSION}:user123:birth:19900115`)
  })

  it('build() 使用默认 version', () => {
    const key = CacheKey.build({
      namespace: CacheNamespace.Analysis,
    })
    expect(key).toBe(`analysis:${CACHE_VERSION}:::`)
  })

  it('parse() 正确解析 key', () => {
    const key = CacheKey.build({
      namespace: CacheNamespace.AI,
      userId: 'u1',
      scope: 'gemini',
      identifier: 'hash123',
    })
    const parsed = CacheKey.parse(key)
    expect(parsed).not.toBeNull()
    expect(parsed!.namespace).toBe(CacheNamespace.AI)
    expect(parsed!.userId).toBe('u1')
    expect(parsed!.scope).toBe('gemini')
    expect(parsed!.identifier).toBe('hash123')
  })

  it('parse() 返回 null 对无效 key', () => {
    expect(CacheKey.parse('')).toBeNull()
    expect(CacheKey.parse('noparts')).toBeNull()
  })

  it('hash() 生成确定性哈希', () => {
    const h1 = CacheKey.hash('hello')
    const h2 = CacheKey.hash('hello')
    const h3 = CacheKey.hash('world')
    expect(h1).toBe(h2)
    expect(h1).not.toBe(h3)
    expect(typeof h1).toBe('string')
    expect(h1.length).toBeGreaterThan(0)
  })

  it('build() + parse() 往返一致', () => {
    const params = {
      namespace: CacheNamespace.Image,
      userId: 'me',
      scope: 'thumb',
      identifier: 'abc',
      version: '2.0.0',
    }
    const key = CacheKey.build(params)
    const parsed = CacheKey.parse(key)
    expect(parsed!.namespace).toBe(params.namespace)
    expect(parsed!.version).toBe('2.0.0')
    expect(parsed!.userId).toBe('me')
    expect(parsed!.scope).toBe('thumb')
    expect(parsed!.identifier).toBe('abc')
  })
})