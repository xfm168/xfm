import { describe, it, expect } from 'vitest'
import { PROMPT_VERSION, setPromptVersion, getPromptVersion, getPromptVersionKey } from '../PromptVersion'

describe('PromptVersion', () => {
  it('PROMPT_VERSION 默认值', () => {
    expect(PROMPT_VERSION).toBe('1.0.0')
  })

  it('getPromptVersion 默认返回 PROMPT_VERSION', () => {
    expect(getPromptVersion('bazi', 'analysis')).toBe(PROMPT_VERSION)
  })

  it('setPromptVersion 覆盖默认值', () => {
    setPromptVersion('bazi', 'test-set', '2.0.0')
    expect(getPromptVersion('bazi', 'test-set')).toBe('2.0.0')
  })

  it('不同 category 独立管理版本', () => {
    setPromptVersion('fengshui', 'room', '3.0.0')
    expect(getPromptVersion('fengshui', 'room')).toBe('3.0.0')
    expect(getPromptVersion('bazi', 'other')).toBe(PROMPT_VERSION) // 不受影响
  })

  it('getPromptVersionKey 生成完整 key', () => {
    setPromptVersion('bazi', 'key-test', '2.0.0')
    const key = getPromptVersionKey('bazi', 'key-test')
    expect(key).toBe('bazi:key-test:2.0.0')
  })

  it('getPromptVersionKey 默认使用 PROMPT_VERSION', () => {
    const key = getPromptVersionKey('ziwei', 'unique-key')
    expect(key).toBe(`ziwei:unique-key:${PROMPT_VERSION}`)
  })
})
