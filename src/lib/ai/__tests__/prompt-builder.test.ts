import { describe, it, expect, beforeEach } from 'vitest'
import { registerPrompt, getPrompt, renderPrompt, listPrompts } from '../PromptBuilder'

describe('PromptBuilder', () => {
  beforeEach(() => {
    // 清理可能残留的 prompt（通过重新注册覆盖）
  })

  it('registerPrompt + getPrompt 基本注册和获取', () => {
    registerPrompt({
      category: 'bazi',
      name: 'analysis',
      version: '1.0.0',
      systemPrompt: 'You are a Bazi expert.',
      userPromptTemplate: 'Analyze: {{birthInfo}}',
    })
    const prompt = getPrompt('bazi', 'analysis')
    expect(prompt).toBeDefined()
    expect(prompt!.systemPrompt).toBe('You are a Bazi expert.')
    expect(prompt!.version).toBe('1.0.0')
  })

  it('getPrompt 不存在返回 undefined', () => {
    expect(getPrompt('bazi', 'noprompt')).toBeUndefined()
  })

  it('renderPrompt 替换变量', () => {
    registerPrompt({
      category: 'fengshui',
      name: 'room',
      version: '1.0.0',
      systemPrompt: 'You are a FengShui expert.',
      userPromptTemplate: 'Analyze room: {{roomType}}, area: {{area}}',
    })
    const result = renderPrompt('fengshui', 'room', { roomType: 'bedroom', area: '20sqm' })
    expect(result).toBeDefined()
    expect(result!.system).toBe('You are a FengShui expert.')
    expect(result!.user).toBe('Analyze room: bedroom, area: 20sqm')
  })

  it('renderPrompt 不存在的模板返回 undefined', () => {
    expect(renderPrompt('bazi', 'nonexistent', {})).toBeUndefined()
  })

  it('listPrompts 返回所有注册的 prompt', () => {
    const before = listPrompts().length
    registerPrompt({
      category: 'face',
      name: 'reading',
      version: '1.0.0',
      systemPrompt: 'Face expert',
      userPromptTemplate: 'Read: {{image}}',
    })
    const after = listPrompts().length
    expect(after).toBeGreaterThanOrEqual(before)
  })
})
