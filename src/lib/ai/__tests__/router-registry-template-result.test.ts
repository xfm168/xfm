import { describe, it, expect, beforeEach } from 'vitest'
import { AIRouter, type TaskType, type RouterStrategy } from '../AIRouter'
import { PromptRegistry } from '../PromptRegistry'
import type { PromptEntry } from '../PromptRegistry'
import { PromptTemplate } from '../PromptTemplate'
import { aiSuccess, aiFailure, mergeResults } from '../AIResult'
import type { AIResult } from '../AIResult'

// ============ AIRouter ============
describe('AIRouter', () => {
  let router: AIRouter

  beforeEach(() => { router = new AIRouter() })

  it('默认规则包含所有任务类型', () => {
    const rules = router.listRules()
    const taskTypes = rules.map(r => r.taskType)
    expect(taskTypes).toContain('vision')
    expect(taskTypes).toContain('json')
    expect(taskTypes).toContain('bazi')
    expect(taskTypes).toContain('general')
  })

  it('route() 返回可用 provider', () => {
    const result = router.route('vision', ['gemini', 'openai'])
    expect(result).toBe('gemini')
  })

  it('route() 降级到可用 provider', () => {
    const result = router.route('vision', ['openai'])
    expect(result).toBe('openai')
  })

  it('route() 不可用时返回 undefined', () => {
    expect(router.route('vision', [])).toBeUndefined()
  })

  it('strategy=speed 选择最快 provider', () => {
    const result = router.route('general', ['claude', 'gemini', 'deepseek'], 'speed')
    expect(result).toBe('gemini')
  })

  it('strategy=cost 选择最便宜 provider', () => {
    const result = router.route('general', ['claude', 'gemini', 'qwen'], 'cost')
    expect(result).toBe('qwen')
  })

  it('strategy=quality 选择最高质量 provider', () => {
    const result = router.route('general', ['gemini', 'claude', 'deepseek'], 'quality')
    expect(result).toBe('claude')
  })

  it('setRule() 自定义规则', () => {
    router.setRule({ taskType: 'general' as TaskType, providers: ['deepseek'], strategy: 'cost' as RouterStrategy })
    const result = router.route('general', ['gemini', 'deepseek'])
    expect(result).toBe('deepseek')
  })

  it('removeRule() 移除规则', () => {
    router.removeRule('vision' as TaskType)
    expect(router.route('vision', ['gemini', 'openai'])).toBe('gemini') // falls back to any available
  })

  it('listRules() 返回所有规则', () => {
    expect(router.listRules().length).toBeGreaterThanOrEqual(10)
  })
})

// ============ PromptRegistry ============
describe('PromptRegistry', () => {
  let registry: PromptRegistry

  const makeEntry = (id: string, version = '1.0.0'): PromptEntry => ({
    id, version, author: 'test', updatedAt: Date.now(),
    description: `Prompt ${id}`, tags: ['test'],
    category: 'bazi', systemPrompt: `System for ${id}`, userTemplate: `Hello {{name}}`,
  })

  beforeEach(() => { registry = new PromptRegistry() })

  it('register + get', () => {
    registry.register(makeEntry('test-1'))
    expect(registry.get('test-1')).toBeDefined()
    expect(registry.get('test-1')!.version).toBe('1.0.0')
  })

  it('unregister', () => {
    registry.register(makeEntry('test-2'))
    expect(registry.unregister('test-2')).toBe(true)
    expect(registry.get('test-2')).toBeUndefined()
  })

  it('getVersion', () => {
    registry.register(makeEntry('p1', '1.0.0'))
    registry.register(makeEntry('p1', '2.0.0'))
    expect(registry.getVersion('p1', '1.0.0')).toBeDefined()
    expect(registry.getVersion('p1', '2.0.0')).toBeDefined()
    expect(registry.getVersion('p1', '3.0.0')).toBeUndefined()
  })

  it('rollback', () => {
    registry.register(makeEntry('r1', '1.0.0'))
    registry.register(makeEntry('r1', '2.0.0'))
    const restored = registry.rollback('r1', '1.0.0')
    expect(restored).toBeDefined()
    expect(restored!.version).toBe('1.0.0')
  })

  it('getHistory', () => {
    registry.register(makeEntry('h1', '1.0.0'))
    registry.register(makeEntry('h1', '1.1.0'))
    expect(registry.getHistory('h1').length).toBe(2)
  })

  it('diff 两个版本', () => {
    registry.register({ ...makeEntry('d1', '1.0.0'), systemPrompt: 'v1 system' })
    registry.register({ ...makeEntry('d1', '2.0.0'), systemPrompt: 'v2 system' })
    const diffs = registry.diff('d1', '1.0.0', '2.0.0')
    expect(diffs.length).toBeGreaterThanOrEqual(1)
  })

  it('findByCategory', () => {
    registry.register(makeEntry('c1'))
    registry.register({ ...makeEntry('c2'), category: 'fengshui' })
    const results = registry.findByCategory('bazi')
    expect(results.length).toBe(1)
  })

  it('findByTag', () => {
    registry.register({ ...makeEntry('t1'), tags: ['test', 'important'] })
    registry.register({ ...makeEntry('t2'), tags: ['other'] })
    expect(registry.findByTag('important').length).toBe(1)
  })

  it('list', () => {
    registry.register(makeEntry('l1'))
    registry.register(makeEntry('l2'))
    expect(registry.list().length).toBe(2)
  })

  it('clear', () => {
    registry.register(makeEntry('x1'))
    registry.clear()
    expect(registry.size).toBe(0)
  })

  it('size', () => {
    registry.register(makeEntry('s1'))
    expect(registry.size).toBe(1)
  })
})

// ============ PromptTemplate ============
describe('PromptTemplate', () => {
  let tmpl: PromptTemplate

  beforeEach(() => {
    tmpl = new PromptTemplate()
  })

  it('变量替换', () => {
    expect(tmpl.render('Hello {{name}}!', { name: 'World' })).toBe('Hello World!')
  })

  it('未定义变量替换为空', () => {
    expect(tmpl.render('{{greeting}} {{name}}', { greeting: 'Hi' })).toBe('Hi ')
  })

  it('if/else 条件', () => {
    const tpl = '{{#if show}}Visible{{else}}Hidden{{/if}}'
    expect(tmpl.render(tpl, { show: true })).toBe('Visible')
    expect(tmpl.render(tpl, { show: false })).toBe('Hidden')
  })

  it('if/else 无 else', () => {
    const tpl = '{{#if show}}Visible{{/if}}'
    expect(tmpl.render(tpl, { show: false })).toBe('')
  })

  it('each 循环', () => {
    const tpl = '{{#each items}}- {{item}}{{/each}}'
    expect(tmpl.render(tpl, { items: ['a', 'b', 'c'] })).toBe('- a\n- b\n- c')
  })

  it('each 循环空数组', () => {
    const tpl = '{{#each items}}{{item}}{{/each}}'
    expect(tmpl.render(tpl, { items: [] })).toBe('')
  })

  it('each with @index', () => {
    const tpl = '{{#each items}}{{@index}}:{{item}}{{/each}}'
    expect(tmpl.render(tpl, { items: ['x', 'y'] })).toBe('0:x\n1:y')
  })

  it('partial', () => {
    tmpl.registerPartial('greeting', 'Hello {{name}}!')
    expect(tmpl.render('{{> greeting}}', { name: 'Test' })).toBe('Hello Test!')
  })

  it('missing partial', () => {
    expect(tmpl.render('{{> missing}}', {})).toBe('[missing partial: missing]')
  })

  it('嵌套: partial + if', () => {
    tmpl.registerPartial('block', '{{#if active}}ACTIVE{{else}}inactive{{/if}}')
    expect(tmpl.render('{{> block}}', { active: true })).toBe('ACTIVE')
  })

  it('布尔值渲染', () => {
    expect(tmpl.render('{{val}}', { val: true })).toBe('true')
    expect(tmpl.render('{{val}}', { val: false })).toBe('false')
  })

  it('数字渲染', () => {
    expect(tmpl.render('{{num}}', { num: 42 })).toBe('42')
  })
})

// ============ AIResult ============
describe('AIResult', () => {
  it('aiSuccess 创建成功结果', () => {
    const r: AIResult<string> = aiSuccess({
      data: 'hello', provider: 'gemini', model: 'gemini-2.0-flash',
      latencyMs: 100, tokens: { prompt: 10, completion: 5 }, cost: 0.01, traceId: 't1',
    })
    expect(r.success).toBe(true)
    expect(r.data).toBe('hello')
    expect(r.tokens.total).toBe(15)
    expect(r.cached).toBe(false)
  })

  it('aiFailure 创建失败结果', () => {
    const r = aiFailure({
      provider: 'openai', model: 'gpt-4o', latencyMs: 50, error: 'timeout', traceId: 't2',
    })
    expect(r.success).toBe(false)
    expect(r.error).toBe('timeout')
    expect(r.tokens.total).toBe(0)
  })

  it('mergeResults 合并批量', () => {
    const r1 = aiSuccess({ data: 'a', provider: 'gemini', model: 'gemini-2.0-flash', latencyMs: 10, tokens: { prompt: 1, completion: 1 }, cost: 0.01 })
    const r2 = aiFailure({ provider: 'openai', model: 'gpt-4o', latencyMs: 20, error: 'fail' })
    const merged = mergeResults([r1, r2])
    expect(merged.totalCount).toBe(2)
    expect(merged.successCount).toBe(1)
    expect(merged.failureCount).toBe(1)
    expect(merged.totalCost).toBeCloseTo(0.01)
  })
})
