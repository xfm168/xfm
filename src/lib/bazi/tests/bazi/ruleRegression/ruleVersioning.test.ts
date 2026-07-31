import { describe, it, expect } from 'vitest'
import type { RuleDefinition } from '../../../ruleEngine/types'

describe('C4 Rule 版本追溯字段', () => {
  it('RuleDefinition 包含 7 个 C4 字段', () => {
    const rule: RuleDefinition = {
      id: 'GEJU-TEST-001',
      version: '1.0.0',
      priority: 50,
      source: '滴天髓',
      description: '测试规则',
      condition: [{ description: '条件1', type: 'required' }],
      result: '测试结论',
      evidence: { rule: '测试', level: 'support', weight: 0.5, description: '测试证据' },
      confidence: { components: { geju: 0.5 } },
      conflictStrategy: 'priority-then-vote',
      evaluate: () => ({ items: [] }),
      // C4 字段
      ruleVersion: '2024-v1',
      effectiveDate: '2024-01-01',
      classicSource: '滴天髓·通神论',
      academicSource: '现代命理学教材',
      author: '张三',
      reviewer: '李四',
      lastReviewDate: '2024-06-15',
    }
    expect(rule.ruleVersion).toBe('2024-v1')
    expect(rule.effectiveDate).toBe('2024-01-01')
    expect(rule.classicSource).toContain('通神论')
    expect(rule.academicSource).toBeTruthy()
    expect(rule.author).toBe('张三')
    expect(rule.reviewer).toBe('李四')
    expect(rule.lastReviewDate).toBe('2024-06-15')
  })

  it('C4 字段全部可选，不填也能通过', () => {
    const rule: RuleDefinition = {
      id: 'GEJU-TEST-002',
      version: '1.0.0',
      priority: 50,
      source: '子平真诠',
      description: '无C4字段的规则',
      condition: [{ description: '条件', type: 'required' }],
      result: '结论',
      evidence: { rule: '测试', level: 'support', weight: 0.5, description: '证据' },
      confidence: { components: {} },
      conflictStrategy: 'priority-then-vote',
      evaluate: () => ({ items: [] }),
    }
    expect(rule.ruleVersion).toBeUndefined()
    expect(rule.effectiveDate).toBeUndefined()
  })
})
