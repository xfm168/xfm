import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerRule,
  getRulesByCategory,
  getRuleById,
  getExecutionOrder,
  getSandboxRules,
  promoteRule,
  demoteRule,
  clearCache,
  getRulesByTags,
  registerSandboxRule,
  registry,
} from '../../../ruleEngine/ruleRegistry'
import type { RuleDefinition, RuleCategory } from '../../../ruleEngine/types'

function makeRule(overrides: Partial<RuleDefinition> = {}): RuleDefinition {
  return {
    id: `test-rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '测试规则',
    category: 'hehua' as RuleCategory,
    description: '仅用于 registrySanity 测试的临时规则',
    priority: 100,
    tags: ['test-tag', 'sanity-check'],
    version: '1.0.0',
    status: 'active',
    evaluate: async (_input: any) => ({
      conclusion: 'ok',
      direction: 'neutral',
      items: [],
      coreSatisfied: 0,
      coreTotal: 0,
      counterHits: 0,
      counterThreshold: 0,
    }),
    ...overrides,
  }
}

describe('ruleRegression/registrySanity - RuleRegistry API 健全性验证', () => {
  beforeEach(() => {
    registry.rules.clear()
    registry.sandbox.clear()
    registry.executionOrderCache.clear()
  })

  it('registerRule 成功：规则存在于 registry.rules Map', () => {
    const rule = makeRule({ id: 'sanity-r1', category: 'geju' })
    registerRule(rule)
    expect(registry.rules.has(rule.id)).toBe(true)
    expect(registry.rules.get(rule.id)!.id).toBe(rule.id)
  })

  it('getRulesByCategory：按分类正确过滤规则', () => {
    const r1 = makeRule({ id: 'sanity-cat-r1', category: 'hehua' })
    const r2 = makeRule({ id: 'sanity-cat-r2', category: 'xiyongshen' })
    const r3 = makeRule({ id: 'sanity-cat-r3', category: 'hehua' })
    registerRule(r1)
    registerRule(r2)
    registerRule(r3)
    const hehua = getRulesByCategory('hehua')
    const xiyong = getRulesByCategory('xiyongshen')
    expect(hehua.length).toBe(2)
    expect(xiyong.length).toBe(1)
    expect(hehua.every(r => r.category === 'hehua')).toBe(true)
    expect(xiyong[0].id).toBe(r2.id)
  })

  it('getRuleById：存在的规则返回定义，不存在返回 undefined', () => {
    const rule = makeRule({ id: 'sanity-byid-r1', category: 'shensha' })
    registerRule(rule)
    expect(getRuleById(rule.id)?.id).toBe(rule.id)
    expect(getRuleById('non-existent-rule-xyz')).toBeUndefined()
  })

  it('getRuleById：sandbox 中的规则也能查到', () => {
    const rule = makeRule({ id: 'sanity-sandbox-find', category: 'geju', status: 'sandbox' })
    registerSandboxRule(rule)
    expect(getRuleById(rule.id)?.id).toBe(rule.id)
  })

  it('getExecutionOrder：返回字符串数组，顺序合法', () => {
    const r1 = makeRule({ id: 'sanity-ord-r1', category: 'tongguan', priority: 100 })
    const r2 = makeRule({ id: 'sanity-ord-r2', category: 'tongguan', priority: 50 })
    const r3 = makeRule({ id: 'sanity-ord-r3', category: 'tongguan', priority: 200 })
    registerRule(r1)
    registerRule(r2)
    registerRule(r3)
    const order = getExecutionOrder('tongguan')
    expect(Array.isArray(order)).toBe(true)
    expect(order.length).toBe(3)
    expect(order.includes(r1.id)).toBe(true)
    expect(order.includes(r2.id)).toBe(true)
    expect(order.includes(r3.id)).toBe(true)
  })

  it('getSandboxRules：初始为空，registerSandboxRule 后增加', () => {
    expect(getSandboxRules().length).toBe(0)
    const r1 = makeRule({ id: 'sanity-sb-1', category: 'hehua' })
    const r2 = makeRule({ id: 'sanity-sb-2', category: 'geju' })
    registerSandboxRule(r1)
    registerSandboxRule(r2)
    expect(getSandboxRules().length).toBe(2)
  })

  it('promoteRule：sandbox → rules 成功，返回 true', () => {
    const rule = makeRule({ id: 'sanity-promote-1', category: 'tiaohou' })
    registerSandboxRule(rule)
    expect(registry.sandbox.has(rule.id)).toBe(true)
    expect(registry.rules.has(rule.id)).toBe(false)
    const ok = promoteRule(rule.id)
    expect(ok).toBe(true)
    expect(registry.sandbox.has(rule.id)).toBe(false)
    expect(registry.rules.has(rule.id)).toBe(true)
  })

  it('promoteRule：规则不在 sandbox 中返回 false', () => {
    const ok = promoteRule('non-existent-sandbox-rule')
    expect(ok).toBe(false)
  })

  it('demoteRule：rules → sandbox 成功，返回 true', () => {
    const rule = makeRule({ id: 'sanity-demote-1', category: 'bingyao' })
    registerRule(rule)
    expect(registry.rules.has(rule.id)).toBe(true)
    expect(registry.sandbox.has(rule.id)).toBe(false)
    const ok = demoteRule(rule.id)
    expect(ok).toBe(true)
    expect(registry.rules.has(rule.id)).toBe(false)
    expect(registry.sandbox.has(rule.id)).toBe(true)
  })

  it('demoteRule：规则不在 rules 中返回 false', () => {
    const ok = demoteRule('non-existent-active-rule')
    expect(ok).toBe(false)
  })

  it('clearCache：清空 executionOrderCache', () => {
    const rule = makeRule({ id: 'sanity-cache-1', category: 'fuyi' })
    registerRule(rule)
    getRulesByCategory('fuyi')
    expect(registry.executionOrderCache.size).toBeGreaterThan(0)
    clearCache()
    expect(registry.executionOrderCache.size).toBe(0)
  })

  it('getRulesByTags：按标签正确匹配', () => {
    const r1 = makeRule({ id: 'sanity-tag-1', category: 'wuxing', tags: ['test-tag', 'alpha'] })
    const r2 = makeRule({ id: 'sanity-tag-2', category: 'wuxing', tags: ['beta', 'gamma'] })
    const r3 = makeRule({ id: 'sanity-tag-3', category: 'wuxing', tags: ['alpha', 'gamma'] })
    registerRule(r1)
    registerRule(r2)
    registerRule(r3)
    expect(getRulesByTags(['alpha']).length).toBe(2)
    expect(getRulesByTags(['beta']).length).toBe(1)
    expect(getRulesByTags(['nonexistent']).length).toBe(0)
    expect(getRulesByTags([]).length).toBe(0)
  })

  it('getRulesByCategory：deprecated 规则被过滤', () => {
    const r1 = makeRule({ id: 'sanity-dep-1', category: 'hehua', status: 'active' })
    const r2 = makeRule({ id: 'sanity-dep-2', category: 'hehua', status: 'deprecated' })
    registerRule(r1)
    registerRule(r2)
    const result = getRulesByCategory('hehua')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe(r1.id)
  })

  it('执行顺序：priority 高的先执行', () => {
    const rLow = makeRule({ id: 'sanity-pri-low', category: 'shensha', priority: 10 })
    const rHigh = makeRule({ id: 'sanity-pri-high', category: 'shensha', priority: 900 })
    const rMid = makeRule({ id: 'sanity-pri-mid', category: 'shensha', priority: 100 })
    registerRule(rLow)
    registerRule(rHigh)
    registerRule(rMid)
    const order = getExecutionOrder('shensha')
    const idxHigh = order.indexOf(rHigh.id)
    const idxMid = order.indexOf(rMid.id)
    const idxLow = order.indexOf(rLow.id)
    expect(idxHigh).toBeLessThan(idxMid)
    expect(idxMid).toBeLessThan(idxLow)
  })
})
