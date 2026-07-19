import { describe, it, expect } from 'vitest'
import { AIError } from '../AIProvider'

describe('AIError', () => {
  it('创建 retryable error', () => {
    const err = AIError.retryable('Rate limited', 'rate_limit', 'gemini', 429)
    expect(err.message).toBe('Rate limited')
    expect(err.code).toBe('rate_limit')
    expect(err.provider).toBe('gemini')
    expect(err.statusCode).toBe(429)
    expect(err.retryable).toBe(true)
    expect(err.name).toBe('AIError')
    expect(err).toBeInstanceOf(Error)
  })

  it('创建 fatal error', () => {
    const err = AIError.fatal('Auth failed', 'auth', 'openai', 401)
    expect(err.retryable).toBe(false)
    expect(err.code).toBe('auth')
  })

  it('直接构造 AIError', () => {
    const err = new AIError('timeout', 'timeout', true)
    expect(err.retryable).toBe(true)
    expect(err.code).toBe('timeout')
    expect(err.provider).toBeUndefined()
  })
})
