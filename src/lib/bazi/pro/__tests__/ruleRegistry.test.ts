/**
 * H3 Module 1.1: RuleRegistry 测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { RuleRegistry, defaultRuleRegistry } from '../index'
import type { RuleEntry, RuleCategory } from '../index'

describe('RuleRegistry', () => {
  let registry: RuleRegistry

  beforeEach(() => {
    registry = new RuleRegistry()
  })

  it('register + get + has', () => {
    const entry: RuleEntry = {
      id: 'test-rule', name: '测试规则', category: 'pillar',
      algorithmVersion: 'v1.0-classic', source: '三命通会',
      enabled: true, priority: 10, module: 'test',
    }
    registry.register(entry)
    expect(registry.has('test-rule')).toBe(true)
    expect(registry.get('test-rule')?.name).toBe('测试规则')
  })

  it('registerAll 批量注册', () => {
    registry.registerAll([
      { id: 'r1', name: 'R1', category: 'pillar', algorithmVersion: 'v1.0-classic', source: '三命通会', enabled: true, priority: 1, module: 'test' },
      { id: 'r2', name: 'R2', category: 'pillar', algorithmVersion: 'v1.0-classic', source: '三命通会', enabled: true, priority: 2, module: 'test' },
    ])
    expect(registry.size).toBe(2)
    expect(registry.has('r1')).toBe(true)
    expect(registry.has('r2')).toBe(true)
  })

  it('重复注册抛错', () => {
    const entry: RuleEntry = {
      id: 'dup', name: 'Dup', category: 'pillar',
      algorithmVersion: 'v1.0-classic', source: '三命通会',
      enabled: true, priority: 1, module: 'test',
    }
    registry.register(entry)
    expect(() => registry.register(entry)).toThrow('already registered')
  })

  it('unregister 注销', () => {
    const entry: RuleEntry = {
      id: 'remove-me', name: 'Remove', category: 'pillar',
      algorithmVersion: 'v1.0-classic', source: '三命通会',
      enabled: true, priority: 1, module: 'test',
    }
    registry.register(entry)
    expect(registry.unregister('remove-me')).toBe(true)
    expect(registry.has('remove-me')).toBe(false)
    expect(registry.unregister('nonexist')).toBe(false)
  })

  it('findByCategory 按分类查找', () => {
    registry.registerAll([
      { id: 'p1', name: 'P1', category: 'pillar', algorithmVersion: 'v1.0-classic', source: '三命通会', enabled: true, priority: 1, module: 'm1' },
      { id: 's1', name: 'S1', category: 'shensha', algorithmVersion: 'v1.0-classic', source: '三命通会', enabled: true, priority: 1, module: 'm2' },
      { id: 'p2', name: 'P2', category: 'pillar', algorithmVersion: 'v1.0-classic', source: '三命通会', enabled: false, priority: 1, module: 'm1' },
    ])
    const pillarRules = registry.findByCategory('pillar')
    expect(pillarRules).toHaveLength(2)
    const shenshaRules = registry.findByCategory('shensha')
    expect(shenshaRules).toHaveLength(1)
  })

  it('findByModule 按模块查找', () => {
    registry.registerAll([
      { id: 'a', name: 'A', category: 'pillar', algorithmVersion: 'v1.0-classic', source: '三命通会', enabled: true, priority: 1, module: 'module1' },
      { id: 'b', name: 'B', category: 'shensha', algorithmVersion: 'v1.0-classic', source: '三命通会', enabled: true, priority: 1, module: 'module2' },
    ])
    expect(registry.findByModule('module1')).toHaveLength(1)
    expect(registry.findByModule('module2')).toHaveLength(1)
    expect(registry.findByModule('module3')).toHaveLength(0)
  })

  it('list / listEnabled', () => {
    registry.registerAll([
      { id: 'e1', name: 'E1', category: 'pillar', algorithmVersion: 'v1.0-classic', source: '三命通会', enabled: true, priority: 1, module: 'test' },
      { id: 'd1', name: 'D1', category: 'pillar', algorithmVersion: 'v1.0-classic', source: '三命通会', enabled: false, priority: 1, module: 'test' },
    ])
    expect(registry.list()).toHaveLength(2)
    expect(registry.listEnabled()).toHaveLength(1)
    expect(registry.listEnabled()[0].id).toBe('e1')
  })

  it('enable / disable', () => {
    const entry: RuleEntry = {
      id: 'toggle', name: 'Toggle', category: 'pillar',
      algorithmVersion: 'v1.0-classic', source: '三命通会',
      enabled: true, priority: 1, module: 'test',
    }
    registry.register(entry)
    expect(registry.get('toggle')?.enabled).toBe(true)
    registry.disable('toggle')
    expect(registry.get('toggle')?.enabled).toBe(false)
    registry.enable('toggle')
    expect(registry.get('toggle')?.enabled).toBe(true)
    expect(registry.enable('nonexist')).toBe(false)
    expect(registry.disable('nonexist')).toBe(false)
  })

  it('size 计数', () => {
    expect(registry.size).toBe(0)
    registry.register({
      id: 'a', name: 'A', category: 'pillar',
      algorithmVersion: 'v1.0-classic', source: '三命通会',
      enabled: true, priority: 1, module: 'test',
    })
    expect(registry.size).toBe(1)
  })

  it('clear 清空', () => {
    registry.registerAll([
      { id: 'x', name: 'X', category: 'pillar', algorithmVersion: 'v1.0-classic', source: '三命通会', enabled: true, priority: 1, module: 'test' },
    ])
    registry.clear()
    expect(registry.size).toBe(0)
  })
})

describe('defaultRuleRegistry 默认实例', () => {
  it('已注册 Module 1 内置规则', () => {
    expect(defaultRuleRegistry.size).toBeGreaterThanOrEqual(10)
  })

  it('包含命宫/身宫/胎元/胎息', () => {
    expect(defaultRuleRegistry.has('minggong')).toBe(true)
    expect(defaultRuleRegistry.has('shengong')).toBe(true)
    expect(defaultRuleRegistry.has('taiyuan')).toBe(true)
    expect(defaultRuleRegistry.has('taixi')).toBe(true)
  })

  it('包含纳音/空亡/十二长生/藏干/五行/十神', () => {
    expect(defaultRuleRegistry.has('nayin')).toBe(true)
    expect(defaultRuleRegistry.has('kongwang')).toBe(true)
    expect(defaultRuleRegistry.has('changsheng')).toBe(true)
    expect(defaultRuleRegistry.has('hidden-stem')).toBe(true)
    expect(defaultRuleRegistry.has('five-element')).toBe(true)
    expect(defaultRuleRegistry.has('shishen')).toBe(true)
  })

  it('每条规则都有完整字段', () => {
    for (const rule of defaultRuleRegistry.list()) {
      expect(rule.id).toBeTruthy()
      expect(rule.name).toBeTruthy()
      expect(rule.category).toBeTruthy()
      expect(rule.algorithmVersion).toBeTruthy()
      expect(rule.source).toBeTruthy()
      expect(rule.priority).toBeGreaterThan(0)
      expect(rule.module).toBeTruthy()
    }
  })

  it('每条规则都有 configKey 或不需要', () => {
    // 有 configKey 的规则
    const withConfig = defaultRuleRegistry.list().filter(r => r.configKey)
    expect(withConfig.length).toBeGreaterThanOrEqual(7) // minggong/shengong/taiyuan/taixi/kongwang/changsheng/hidden-stem
  })

  it('按 pillar 分类查找', () => {
    const pillarRules = defaultRuleRegistry.findByCategory('pillar')
    expect(pillarRules.length).toBeGreaterThanOrEqual(9) // minggong/shengong/taiyuan/taixi/nayin/kongwang/changsheng/hidden-stem/five-element
  })

  it('按 shishen 分类查找', () => {
    const ssRules = defaultRuleRegistry.findByCategory('shishen')
    expect(ssRules.length).toBeGreaterThanOrEqual(1)
  })

  it('按 module1 分类查找', () => {
    const m1Rules = defaultRuleRegistry.findByModule('module1-four-pillars')
    expect(m1Rules.length).toBeGreaterThanOrEqual(9)
  })
})
