import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerToSandbox,
  runSandbox,
  runAllSandboxRules,
} from '../../../ruleEngine/sandbox/sandboxRunner'
import {
  getSandboxRules,
  promoteRule,
  demoteRule,
  registerRule,
  registry,
} from '../../../ruleEngine/ruleRegistry'
import type { RuleDefinition, RuleCategory, EvidenceBundle } from '../../../ruleEngine/types'

function makeSandboxRule(overrides: Partial<RuleDefinition> = {}): RuleDefinition {
  return {
    id: `sb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '沙箱测试规则',
    category: 'hehua' as RuleCategory,
    description: '仅用于 sandboxSanity 测试',
    priority: 50,
    tags: ['sandbox', 'test'],
    version: '0.1.0',
    evaluate: async (_input: any): Promise<EvidenceBundle> => ({
      conclusion: 'sandbox-ok',
      direction: 'neutral',
      items: [],
      coreSatisfied: 1,
      coreTotal: 1,
      counterHits: 0,
      counterThreshold: 1,
    }),
    ...overrides,
  }
}

describe('ruleRegression/sandboxSanity - Sandbox 沙箱健全性验证', () => {
  beforeEach(() => {
    registry.rules.clear()
    registry.sandbox.clear()
    registry.executionOrderCache.clear()
  })

  it('registerToSandbox 成功：规则进入 sandbox，status=sandbox', () => {
    const rule = makeSandboxRule({ id: 'sb-register-1' })
    registerToSandbox(rule)
    const sandbox = getSandboxRules()
    expect(sandbox.length).toBe(1)
    expect(sandbox[0].id).toBe(rule.id)
    expect(sandbox[0].status).toBe('sandbox')
  })

  it('runSandbox minPassRate=0：任何情况都通过并自动 promote', async () => {
    const rule = makeSandboxRule({ id: 'sb-run-0' })
    registerToSandbox(rule)
    const testCases = [
      { id: 'tc-1', input: { a: 1 } },
      { id: 'tc-2', input: { b: 2 } },
    ]
    const result = await runSandbox(rule.id, testCases, { minPassRate: 0 })
    expect(result.passed).toBe(true)
    expect(result.totalCases).toBe(2)
    expect(result.passedCases).toBe(2)
    expect(registry.rules.has(rule.id)).toBe(true)
    expect(registry.sandbox.has(rule.id)).toBe(false)
  })

  it('runSandbox 找到规则并 promote 成功', async () => {
    const rule = makeSandboxRule({ id: 'sb-run-promote' })
    registerToSandbox(rule)
    const testCases = [{ id: 'tc-ok', input: { x: 1 } }]
    const result = await runSandbox(rule.id, testCases, { minPassRate: 1.0 })
    expect(result.passed).toBe(true)
    expect(result.ruleId).toBe(rule.id)
    expect(result.summary).toContain('通过')
  })

  it('runSandbox 规则不存在：passed=false', async () => {
    const result = await runSandbox('nonexistent-sb-rule', [{ id: 't1', input: {} }])
    expect(result.passed).toBe(false)
    expect(result.summary).toContain('不在沙箱中')
  })

  it('promoteRule 沙箱→正式 成功后：getSandboxRules().length 减少 1', () => {
    const rule = makeSandboxRule({ id: 'sb-prom-len' })
    registerToSandbox(rule)
    expect(getSandboxRules().length).toBe(1)
    const ok = promoteRule(rule.id)
    expect(ok).toBe(true)
    expect(getSandboxRules().length).toBe(0)
  })

  it('demoteRule 正式→沙箱 成功后：getSandboxRules().length 增加 1', () => {
    const rule = makeSandboxRule({ id: 'sb-dem-len' })
    registerRule(rule)
    expect(getSandboxRules().length).toBe(0)
    const ok = demoteRule(rule.id)
    expect(ok).toBe(true)
    expect(getSandboxRules().length).toBe(1)
  })

  it('registerToSandbox 5 条规则：getSandboxRules().length == 5', () => {
    for (let i = 0; i < 5; i++) {
      const rule = makeSandboxRule({ id: `sb-batch-${i}` })
      registerToSandbox(rule)
    }
    expect(getSandboxRules().length).toBe(5)
  })

  it('registerToSandbox 5 条后 promote 2 条：剩下 3 条', () => {
    const ids: string[] = []
    for (let i = 0; i < 5; i++) {
      const id = `sb-5-2-${i}`
      ids.push(id)
      registerToSandbox(makeSandboxRule({ id }))
    }
    promoteRule(ids[0])
    promoteRule(ids[2])
    expect(getSandboxRules().length).toBe(3)
    expect(registry.rules.has(ids[0])).toBe(true)
    expect(registry.rules.has(ids[2])).toBe(true)
  })

  it('runAllSandboxRules：批量执行所有沙箱规则', async () => {
    for (let i = 0; i < 3; i++) {
      const rule = makeSandboxRule({ id: `sb-all-${i}` })
      registerToSandbox(rule)
    }
    const testCases = [{ id: 't1', input: {} }]
    const results = await runAllSandboxRules(testCases, { minPassRate: 1.0 })
    expect(results.length).toBe(3)
    for (const r of results) {
      expect(r.passed).toBe(true)
    }
  })

  it('SandboxTestCase.validate 函数：返回 true 算通过', async () => {
    const rule = makeSandboxRule({ id: 'sb-validate-1' })
    registerToSandbox(rule)
    const testCases = [
      {
        id: 'validate-true',
        input: {},
        validate: (_res: EvidenceBundle) => true,
      },
    ]
    const result = await runSandbox(rule.id, testCases, { minPassRate: 1.0 })
    expect(result.passed).toBe(true)
    expect(result.passedCases).toBe(1)
  })

  it('SandboxTestCase.validate 函数：返回 false 算失败', async () => {
    const rule = makeSandboxRule({ id: 'sb-validate-2' })
    registerToSandbox(rule)
    const testCases = [
      {
        id: 'validate-false',
        input: {},
        validate: (_res: EvidenceBundle) => false,
      },
    ]
    const result = await runSandbox(rule.id, testCases, { minPassRate: 1.0 })
    expect(result.passed).toBe(false)
    expect(result.failedCases).toBe(1)
    expect(result.failures.length).toBe(1)
    expect(result.failures[0].caseId).toBe('validate-false')
  })

  it('evaluate 抛错：失败并记录 error 字段', async () => {
    const rule = makeSandboxRule({
      id: 'sb-throw-1',
      evaluate: async () => {
        throw new Error('模拟 evaluate 错误')
      },
    })
    registerToSandbox(rule)
    const testCases = [{ id: 'throw-case', input: {} }]
    const result = await runSandbox(rule.id, testCases, { minPassRate: 1.0 })
    expect(result.passed).toBe(false)
    expect(result.failures.length).toBe(1)
    expect(result.failures[0].error).toBeDefined()
  })

  it('runSandbox 返回 durationMs 为正数', async () => {
    const rule = makeSandboxRule({ id: 'sb-duration' })
    registerToSandbox(rule)
    const result = await runSandbox(rule.id, [{ id: 't1', input: {} }])
    expect(typeof result.durationMs).toBe('number')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('runSandbox 返回 timestamp 为 ISO 格式字符串', async () => {
    const rule = makeSandboxRule({ id: 'sb-timestamp' })
    registerToSandbox(rule)
    const result = await runSandbox(rule.id, [{ id: 't1', input: {} }])
    expect(typeof result.timestamp).toBe('string')
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp)
  })
})
