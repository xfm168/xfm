import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PipelineRegistry, PipelineRegistryError } from '../registry'
import type { StepDefinition } from '../steps'

const mockStep = (id: string, dependsOn: string[] = []): StepDefinition => ({
  id,
  name: `Step ${id}`,
  version: 1,
  dependsOn,
  enabled: () => true,
  execute: () => ({ success: true, data: undefined, warnings: [] }),
})

describe('PipelineRegistry', () => {
  beforeEach(() => {
    PipelineRegistry.clear()
  })

  it('register() 添加单个 Step', () => {
    PipelineRegistry.register(mockStep('a'))
    expect(PipelineRegistry.size).toBe(1)
    expect(PipelineRegistry.has('a')).toBe(true)
    expect(PipelineRegistry.get('a')?.id).toBe('a')
  })

  it('registerAll() 批量注册', () => {
    PipelineRegistry.registerAll([mockStep('a'), mockStep('b'), mockStep('c')])
    expect(PipelineRegistry.size).toBe(3)
    expect(PipelineRegistry.getAll().length).toBe(3)
    expect(PipelineRegistry.getAll().map(s => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('get() 返回 undefined 当 Step 不存在', () => {
    expect(PipelineRegistry.get('nonexistent')).toBeUndefined()
  })

  it('getAll() 返回按注册顺序排列', () => {
    PipelineRegistry.registerAll([mockStep('x'), mockStep('y')])
    const all = PipelineRegistry.getAll()
    expect(all[0].id).toBe('x')
    expect(all[1].id).toBe('y')
  })

  it('clear() 清除所有注册', () => {
    PipelineRegistry.registerAll([mockStep('a'), mockStep('b')])
    PipelineRegistry.clear()
    expect(PipelineRegistry.size).toBe(0)
    expect(PipelineRegistry.getAll()).toEqual([])
  })

  it('register() 重复 ID 抛出 PipelineRegistryError', () => {
    PipelineRegistry.register(mockStep('dup'))
    expect(() => PipelineRegistry.register(mockStep('dup'))).toThrow(PipelineRegistryError)
    expect(() => PipelineRegistry.register(mockStep('dup'))).toThrow('Duplicate step id: "dup"')
  })

  describe('validateDependencyGraph()', () => {
    it('正常依赖图返回 valid: true', () => {
      PipelineRegistry.registerAll([
        mockStep('a'),
        mockStep('b', ['a']),
        mockStep('c', ['b']),
      ])
      const result = PipelineRegistry.validateDependencyGraph()
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('缺失依赖返回错误', () => {
      PipelineRegistry.registerAll([
        mockStep('a', ['nonexistent']),
      ])
      const result = PipelineRegistry.validateDependencyGraph()
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('nonexistent')
    })

    it('循环依赖返回错误', () => {
      PipelineRegistry.registerAll([
        mockStep('a', ['b']),
        mockStep('b', ['c']),
        mockStep('c', ['a']),
      ])
      const result = PipelineRegistry.validateDependencyGraph()
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Circular'))).toBe(true)
    })

    it('孤立节点产生 warnings', () => {
      PipelineRegistry.registerAll([
        mockStep('a'),
        mockStep('b', ['a']),
        mockStep('isolated'),
      ])
      const result = PipelineRegistry.validateDependencyGraph()
      expect(result.warnings.some(w => w.includes('isolated'))).toBe(true)
    })

    it('空注册表返回 valid', () => {
      const result = PipelineRegistry.validateDependencyGraph()
      expect(result.valid).toBe(true)
    })
  })

  describe('getTopologicalOrder()', () => {
    it('按依赖顺序排序', () => {
      PipelineRegistry.registerAll([
        mockStep('a'),
        mockStep('b', ['a']),
        mockStep('c', ['a', 'b']),
        mockStep('d', ['c']),
      ])
      const sorted = PipelineRegistry.getTopologicalOrder()
      expect(sorted).not.toBeNull()
      if (sorted) {
        const ids = sorted.map(s => s.id)
        expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'))
        expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('c'))
        expect(ids.indexOf('c')).toBeLessThan(ids.indexOf('d'))
      }
    })

    it('循环依赖返回 null', () => {
      PipelineRegistry.registerAll([
        mockStep('a', ['b']),
        mockStep('b', ['a']),
      ])
      expect(PipelineRegistry.getTopologicalOrder()).toBeNull()
    })

    it('无依赖的 Step 全部排在前面', () => {
      PipelineRegistry.registerAll([
        mockStep('c', ['a']),
        mockStep('b'),
        mockStep('a'),
      ])
      const sorted = PipelineRegistry.getTopologicalOrder()
      expect(sorted).not.toBeNull()
      if (sorted) {
        const ids = sorted.map(s => s.id)
        expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('c'))
      }
    })
  })
})