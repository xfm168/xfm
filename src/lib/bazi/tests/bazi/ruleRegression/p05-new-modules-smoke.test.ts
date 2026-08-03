import { describe, it, expect, beforeEach } from 'vitest'

import {
  globalDSLFormatter,
  globalDSLOptimizer,
  parse,
  type RuleDSLDefinition,
} from '../../../../bazi/foundation'

import {
  globalSemanticEngine,
  SEED_SEMANTIC_MAPPINGS,
} from '../../../../bazi/foundation'

import {
  globalPerformanceCenter,
  type PerformanceMetricType,
} from '../../../../bazi/foundation'

const TEST_DSL: RuleDSLDefinition = {
  id: 'BALANCE-STRONG-001',
  name: '身强宜泄',
  version: '1.0.0',
  source: ['子平真诠'],
  priority: 80,
  category: 'fuyi',
  description: '',
  conditions: {
    logic: 'and',
    conditions: [
      { field: 'dayStrength', operator: 'gte' as any, value: 2, description: '日主身强' },
      { field: 'always', operator: '==', value: true },
      { field: 'z_count', operator: 'lt' as any, value: 1 },
    ],
  },
  support: [
    { wuxing: '火', score: 2, reason: '食伤泄秀' },
    { wuxing: '火', score: 1, reason: '额外加乘' },
    { wuxing: '土', score: 1, reason: '财星耗身' },
  ],
  oppose: [
    { wuxing: '木', score: 2, reason: '比劫助身' },
  ],
  result: '身强宜泄耗',
  dependencies: ['RULE-Z', 'RULE-A'],
  tags: ['balance', 'fuyi', 'balance'],
  classicEvidence: [
    { classicName: '滴天髓', chapter: '理气', quotedText: '强则宜泄', supports: '泄' },
    { classicName: '子平真诠', chapter: '论用神', quotedText: '身强则宜泄之耗之', supports: '身强宜泄' },
  ],
}

describe('新增模块冒烟测试', () => {
  describe('DSLFormatter', () => {
    it('formatDSL 排序、归一化、去重、生成description', () => {
      const formatted = globalDSLFormatter.formatDSL(TEST_DSL)
      const fields = formatted.conditions.conditions.map((c: any) => c.field)
      expect(fields).toEqual(['always', 'dayStrength', 'z_count'])
      const operators = formatted.conditions.conditions.map((c: any) => c.operator)
      expect(operators).toContain('>=')
      expect(operators).toContain('<')
      const firstRealCond = formatted.conditions.conditions.find(
        (c: any) => c.field === 'dayStrength'
      ) as any
      expect(firstRealCond.operator).toBe('>=')
      expect(firstRealCond.description).toBeTruthy()
      expect(formatted.support?.find((s) => s.wuxing === '火')?.score).toBe(3)
      expect(formatted.dependencies).toEqual(['RULE-A', 'RULE-Z'])
      expect(formatted.tags).toEqual(['balance', 'fuyi'])
      expect(formatted.classicEvidence?.[0].classicName).toBe('滴天髓')
      expect(formatted.classicEvidence?.[1].classicName).toBe('子平真诠')
      expect(formatted.description).toBeTruthy()
    })

    it('toPrettyJSON 与 toYAML 输出字符串', () => {
      const json = globalDSLFormatter.toPrettyJSON(TEST_DSL)
      expect(typeof json).toBe('string')
      expect(json.includes('"id":')).toBe(true)
      const yaml = globalDSLFormatter.toYAML(TEST_DSL)
      expect(typeof yaml).toBe('string')
      expect(yaml.includes('id:')).toBe(true)
    })
  })

  describe('DSLOptimizer', () => {
    it('optimizeDSL 去除死条件、扁平化、合并五行动作', () => {
      const { dsl, changes } = globalDSLOptimizer.optimizeDSL(TEST_DSL)
      const removedDead = changes.some((c) => c.type === 'dead_condition_elimination')
      expect(removedDead).toBe(true)
      const hasAlwaysTrue = dsl.conditions.conditions.some(
        (c: any) => c.field === 'always' && c.value === true
      )
      expect(hasAlwaysTrue).toBe(false)
      expect(dsl.support?.find((s) => s.wuxing === '火')?.score).toBe(3)
    })

    it('getOptimizationReport 返回潜在优化项', () => {
      const ast = parse(TEST_DSL)
      const report = globalDSLOptimizer.getOptimizationReport(ast)
      expect(typeof report.potentialOptimizations).toBe('number')
      expect(report.potentialOptimizations).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(report.changes)).toBe(true)
    })
  })

  describe('SemanticEngine', () => {
    it('种子映射表有 12+ 个条目,每个至少 2 个变体', () => {
      expect(SEED_SEMANTIC_MAPPINGS.length).toBeGreaterThanOrEqual(12)
      const all2Variants = SEED_SEMANTIC_MAPPINGS.every((m) => m.variants.length >= 2)
      expect(all2Variants).toBe(true)
    })

    it('resolve 能匹配 木火通明 等经典概念', () => {
      const res = globalSemanticEngine.resolve('木火通明 文章盖世')
      expect(res.matched).not.toBeNull()
      expect(res.matched?.unifiedConcept).toBe('木火通明')
      expect(res.confidence).toBeGreaterThan(0)
    })

    it('resolveForClassic 优先匹配指定古籍的变体', () => {
      const res = globalSemanticEngine.resolveForClassic(
        '子平真诠',
        '有病方为贵，无伤不是奇'
      )
      expect(res.matched).not.toBeNull()
      expect(res.matched?.unifiedConcept).toBe('病药')
    })

    it('getControversial 返回争议>0.5 的概念', () => {
      const controversial = globalSemanticEngine.getControversial()
      expect(controversial.length).toBeGreaterThan(0)
      expect(controversial.every((c) => c.controversyLevel > 0.5)).toBe(true)
    })

    it('getMappingsByCategory 能按类别筛选', () => {
      const patterns = globalSemanticEngine.getMappingsByCategory('pattern')
      expect(patterns.length).toBeGreaterThan(0)
      expect(patterns.every((p) => p.category === 'pattern')).toBe(true)
    })
  })

  describe('PerformanceCenter', () => {
    beforeEach(() => {
      globalPerformanceCenter.reset()
    })

    it('startTiming → stop 记录样本', () => {
      const stop = globalPerformanceCenter.startTiming('rule_parse', 'TEST-RULE')
      const sample = stop()
      expect(sample.type).toBe('rule_parse')
      expect(sample.durationMs).toBeGreaterThanOrEqual(0)
      expect(sample.startedAt).toBeGreaterThan(0)
    })

    it('getReport 8 种类型齐全，无样本时 count=0', () => {
      const r = globalPerformanceCenter.getReport()
      const types: PerformanceMetricType[] = [
        'rule_parse', 'rule_validate', 'rule_compile', 'rule_runtime_execute',
        'fusion_decision', 'explain_generate', 'dashboard_render', 'api_request',
      ]
      for (const t of types) {
        expect(r[t]).toBeDefined()
        expect(r[t].count).toBe(0)
      }
    })

    it('getSummary ASCII 表返回字符串且包含样本数', () => {
      for (let i = 0; i < 3; i++) {
        const stop = globalPerformanceCenter.startTiming('rule_compile')
        stop()
      }
      const summary = globalPerformanceCenter.getSummary()
      expect(typeof summary).toBe('string')
      expect(summary).toMatch(/rule_compile/)
      expect(summary).toMatch(/3 个样本/)
    })

    it('getSlowest 返回最慢 N 条', () => {
      const stopA = globalPerformanceCenter.startTiming('api_request')
      stopA()
      const slowest = globalPerformanceCenter.getSlowest(5)
      expect(Array.isArray(slowest)).toBe(true)
      expect(slowest.length).toBeLessThanOrEqual(5)
    })

    it('getByType 按类型筛选', () => {
      globalPerformanceCenter.startTiming('rule_parse')()
      globalPerformanceCenter.startTiming('api_request')()
      const parseSamples = globalPerformanceCenter.getByType('rule_parse')
      expect(parseSamples.length).toBe(1)
      expect(parseSamples[0].type).toBe('rule_parse')
    })
  })
})
