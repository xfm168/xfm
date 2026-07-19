/**
 * V5.0 RC Phase 5 Batch 2 Module V: Explain Trace Engine 测试
 *
 * 覆盖：classifyStepType、stepsToDisplayTree、buildExplainTrace、generateBreadcrumbs、
 *       summarizeTracePath、formatStepForUser、filterTraceTree、calculateOverallConfidence、
 *       countTraceNodes、常量验证、边界情况
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import {
  classifyStepType,
  stepsToDisplayTree,
  buildExplainTrace,
  generateBreadcrumbs,
  summarizeTracePath,
  formatStepForUser,
  filterTraceTree,
  calculateOverallConfidence,
  countTraceNodes,
  EXPLAIN_TRACE_ENGINE_VERSION,
} from '../explainTraceEngine'

import {
  EXPLAIN_TRACE_VERSION,
  DEFAULT_TRACE_FILTER,
} from '../explainTraceTypes'

import type {
  TraceStepInput,
  TraceDisplayNode,
  TraceFilterOptions,
} from '../explainTraceTypes'

// ═══════════════════════════════════════════════════════════════
// 测试数据
// ═══════════════════════════════════════════════════════════════

const sampleSteps: TraceStepInput[] = [
  {
    id: 'step-1',
    name: '结论：命主财运亨通',
    type: 'conclusion',
    confidence: 85,
    description: '综合分析结果',
    children: [
      {
        id: 'step-1-1',
        name: 'PatternModule 分析完成',
        type: 'source-module',
        source: 'patternEngine',
        confidence: 80,
        description: '格局分析模块',
        children: [
          {
            id: 'step-1-1-1',
            name: 'Rule: 食神生财',
            type: 'rule',
            ruleId: 'rule-001',
            confidence: 90,
            description: '规则命中',
          },
        ],
      },
      {
        id: 'step-1-2',
        name: '三命通会引用',
        type: 'classic',
        source: '三命通会',
        confidence: 75,
        description: '古籍引用',
      },
      {
        id: 'step-1-3',
        name: '专家验证：李大师',
        type: 'expert',
        source: '专家库',
        confidence: 70,
        description: '专家意见',
      },
    ],
  },
  {
    id: 'step-2',
    name: '最终审核步骤',
    type: 'final',
    confidence: 65,
    description: '最终审核',
  },
]

// ═══════════════════════════════════════════════════════════════
// 顶层 describe
// ═══════════════════════════════════════════════════════════════

describe('V5.0 RC Phase 5 Batch 2: Explain Trace Engine', () => {

  // ─── 常量验证 ───────────────────────────────────────────────
  describe('常量', () => {
    test('EXPLAIN_TRACE_VERSION 应为 1.0.0', () => {
      expect(EXPLAIN_TRACE_VERSION).toBe('1.0.0')
    })
    test('EXPLAIN_TRACE_ENGINE_VERSION 应为 1.0.0', () => {
      expect(EXPLAIN_TRACE_ENGINE_VERSION).toBe('1.0.0')
    })
    test('DEFAULT_TRACE_FILTER 字段正确', () => {
      expect(DEFAULT_TRACE_FILTER.maxDepth).toBe(10)
      expect(DEFAULT_TRACE_FILTER.excludeTypes).toEqual([])
      expect(DEFAULT_TRACE_FILTER.minConfidence).toBe(0)
    })
  })

  // ─── classifyStepType ──────────────────────────────────────
  describe('classifyStepType', () => {
    test('含 结论 返回 conclusion', () => {
      expect(classifyStepType({ id: '1', name: '结论：财运亨通' })).toBe('conclusion')
    })
    test('含 总评 返回 conclusion', () => {
      expect(classifyStepType({ id: '2', name: '总评分析' })).toBe('conclusion')
    })
    test('含 Module 返回 source-module', () => {
      expect(classifyStepType({ id: '3', name: 'PatternModule 分析' })).toBe('source-module')
    })
    test('含 引擎 返回 source-module', () => {
      expect(classifyStepType({ id: '4', name: '四柱引擎运算' })).toBe('source-module')
    })
    test('含 Rule 返回 rule', () => {
      expect(classifyStepType({ id: '5', name: 'Rule: 食神生财' })).toBe('rule')
    })
    test('含 规则 返回 rule', () => {
      expect(classifyStepType({ id: '6', name: '规则校验完成' })).toBe('rule')
    })
    test('含 三命通会 返回 classic', () => {
      expect(classifyStepType({ id: '7', name: '三命通会引用' })).toBe('classic')
    })
    test('含 滴天髓 返回 classic', () => {
      expect(classifyStepType({ id: '8', name: '滴天髓论断' })).toBe('classic')
    })
    test('含 子平真诠 返回 classic', () => {
      expect(classifyStepType({ id: '9', name: '子平真诠引文' })).toBe('classic')
    })
    test('含 专家 返回 expert', () => {
      expect(classifyStepType({ id: '10', name: '专家验证' })).toBe('expert')
    })
    test('含 验证 返回 expert', () => {
      expect(classifyStepType({ id: '11', name: '交叉验证' })).toBe('expert')
    })
    test('source 中含关键词也生效', () => {
      expect(classifyStepType({ id: '12', name: 'xxx', source: 'patternModule' })).toBe('source-module')
    })
    test('无关键词返回 final', () => {
      expect(classifyStepType({ id: '13', name: '普通步骤' })).toBe('final')
    })
  })

  // ─── stepsToDisplayTree ────────────────────────────────────
  describe('stepsToDisplayTree', () => {
    test('递归转换生成正确的树结构', () => {
      const result = stepsToDisplayTree(sampleSteps)
      expect(result).toHaveLength(2)
      // 第一个节点有 3 个子节点
      expect(result[0].children).toHaveLength(3)
      // 子节点的子节点
      expect(result[0].children[0].children).toHaveLength(1)
    })

    test('depth 正确赋值', () => {
      const result = stepsToDisplayTree(sampleSteps)
      expect(result[0].depth).toBe(0)
      expect(result[0].children[0].depth).toBe(1)
      expect(result[0].children[0].children[0].depth).toBe(2)
    })

    test('confidence 和 status 正确映射', () => {
      const result = stepsToDisplayTree(sampleSteps)
      expect(result[0].confidence).toBe(85)
      expect(result[0].status).toBe('strong')
    })

    test('depth 控制过滤', () => {
      const result = stepsToDisplayTree(sampleSteps, { maxDepth: 0, excludeTypes: [], minConfidence: 0 }, 0)
      // depth=0 的不应被过滤（depth > maxDepth 才过滤）
      expect(result).toHaveLength(2)
      // 但子节点 depth=1 > maxDepth=0，应被过滤
      expect(result[0].children).toHaveLength(0)
    })

    test('excludeTypes 过滤', () => {
      const result = stepsToDisplayTree(sampleSteps, { maxDepth: 10, excludeTypes: ['conclusion'], minConfidence: 0 })
      expect(result).toHaveLength(1) // conclusion 被排除
      expect(result[0].id).toBe('step-2') // final 保留
    })

    test('minConfidence 过滤', () => {
      const result = stepsToDisplayTree(sampleSteps, { maxDepth: 10, excludeTypes: [], minConfidence: 80 })
      // step-1 conf=85 OK, step-2 conf=65 filtered
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('step-1')
    })

    test('空输入返回空数组', () => {
      expect(stepsToDisplayTree([])).toEqual([])
    })
  })

  // ─── buildExplainTrace ───────────────────────────────────
  describe('buildExplainTrace', () => {
    test('完整流程生成正确结构', () => {
      const result = buildExplainTrace(sampleSteps)
      expect(result.tree.id).toBe('root')
      expect(result.breadcrumbs.length).toBeGreaterThan(0)
      expect(result.summary.totalSteps).toBeGreaterThan(0)
      expect(result.totalNodes).toBeGreaterThan(0)
    })

    test('面包屑数量等于总节点数', () => {
      const result = buildExplainTrace(sampleSteps)
      expect(result.breadcrumbs.length).toBe(result.totalNodes)
    })

    test('选项控制过滤', () => {
      const result = buildExplainTrace(sampleSteps, { excludeTypes: ['expert'] })
      // expert 子节点应被过滤
      const expertChild = result.tree.children[0].children.find((n: TraceDisplayNode) => n.type === 'expert')
      expect(expertChild).toBeUndefined()
    })

    test('空输入返回最小结构', () => {
      const result = buildExplainTrace([])
      expect(result.tree.id).toBe('root')
      expect(result.tree.children).toHaveLength(0)
      expect(result.breadcrumbs).toEqual([])
      expect(result.summary.totalSteps).toBe(0)
      expect(result.totalNodes).toBe(0)
    })
  })

  // ─── generateBreadcrumbs ───────────────────────────────────
  describe('generateBreadcrumbs', () => {
    test('生成正确的面包屑列表', () => {
      const result = generateBreadcrumbs(sampleSteps)
      // step-1, step-1-1, step-1-1-1, step-1-2, step-1-3, step-2 = 6
      expect(result).toHaveLength(6)
    })

    test('step 编号递增', () => {
      const result = generateBreadcrumbs(sampleSteps)
      for (let i = 0; i < result.length; i++) {
        expect(result[i].step).toBe(i + 1)
      }
    })

    test('label 和 nodeId 正确', () => {
      const result = generateBreadcrumbs(sampleSteps)
      expect(result[0].label).toBe('结论：命主财运亨通')
      expect(result[0].nodeId).toBe('step-1')
    })

    test('空输入返回空', () => {
      expect(generateBreadcrumbs([])).toEqual([])
    })
  })

  // ─── summarizeTracePath ───────────────────────────────────
  describe('summarizeTracePath', () => {
    test('提取摘要信息正确', () => {
      const result = summarizeTracePath(sampleSteps)
      expect(result.conclusion).toBe('结论：命主财运亨通')
      expect(result.totalSteps).toBe(6)
      expect(result.modules).toContain('patternEngine')
      expect(result.rulesHit).toContain('rule-001')
      expect(result.classicsCited).toContain('三命通会引用')
      expect(result.expertsReferenced).toContain('专家验证：李大师')
    })

    test('overallConfidence 在 0~100 之间', () => {
      const result = summarizeTracePath(sampleSteps)
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0)
      expect(result.overallConfidence).toBeLessThanOrEqual(100)
    })

    test('空输入返回默认摘要', () => {
      const result = summarizeTracePath([])
      expect(result.conclusion).toBe('')
      expect(result.totalSteps).toBe(0)
      expect(result.overallConfidence).toBe(0)
      expect(result.modules).toEqual([])
      expect(result.rulesHit).toEqual([])
      expect(result.classicsCited).toEqual([])
      expect(result.expertsReferenced).toEqual([])
    })
  })

  // ─── formatStepForUser ────────────────────────────────────
  describe('formatStepForUser', () => {
    test('有 description 时使用 description', () => {
      const result = formatStepForUser({ id: '1', name: '测试步骤', description: '详细描述' })
      expect(result.label).toBe('测试步骤')
      expect(result.description).toBe('详细描述')
    })

    test('无 description 时回退到 source', () => {
      const result = formatStepForUser({ id: '2', name: '步骤', source: 'patternEngine' })
      expect(result.description).toBe('patternEngine')
    })

    test('无 description 和 source 时为空字符串', () => {
      const result = formatStepForUser({ id: '3', name: '最小步骤' })
      expect(result.description).toBe('')
    })
  })

  // ─── filterTraceTree ─────────────────────────────────────
  describe('filterTraceTree', () => {
    const sampleDisplayNodes: TraceDisplayNode[] = [
      {
        id: 'd-1',
        type: 'conclusion',
        label: '结论',
        description: '',
        confidence: 90,
        status: 'strong',
        children: [
          {
            id: 'd-1-1',
            type: 'rule',
            label: '规则',
            description: '',
            confidence: 60,
            status: 'moderate',
            children: [],
            depth: 1,
          },
        ],
        depth: 0,
      },
      {
        id: 'd-2',
        type: 'final',
        label: '最终',
        description: '',
        confidence: 30,
        status: 'weak',
        children: [],
        depth: 0,
      },
    ]

    test('过滤指定类型', () => {
      const result = filterTraceTree(sampleDisplayNodes, { maxDepth: 10, excludeTypes: ['final'], minConfidence: 0 })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('d-1')
    })

    test('过滤低置信度节点', () => {
      const result = filterTraceTree(sampleDisplayNodes, { maxDepth: 10, excludeTypes: [], minConfidence: 50 })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('d-1')
    })

    test('过滤超深节点', () => {
      const result = filterTraceTree(sampleDisplayNodes, { maxDepth: 0, excludeTypes: [], minConfidence: 0 })
      expect(result).toHaveLength(2)
      expect(result[0].children).toHaveLength(0)
    })

    test('无过滤条件时保留所有节点', () => {
      const result = filterTraceTree(sampleDisplayNodes, { maxDepth: 10, excludeTypes: [], minConfidence: 0 })
      expect(result).toHaveLength(2)
      expect(result[0].children).toHaveLength(1)
    })
  })

  // ─── calculateOverallConfidence ────────────────────────────
  describe('calculateOverallConfidence', () => {
    test('加权平均计算', () => {
      const conf = calculateOverallConfidence(sampleSteps)
      expect(conf).toBeGreaterThanOrEqual(0)
      expect(conf).toBeLessThanOrEqual(100)
    })

    test('深层节点权重更低', () => {
      const shallowSteps: TraceStepInput[] = [
        { id: 's1', name: '浅层', confidence: 100 },
        { id: 's2', name: '浅层2', confidence: 100, children: [
          { id: 's2-1', name: '深层', confidence: 0 },
        ] },
      ]
      const conf = calculateOverallConfidence(shallowSteps)
      // 浅层节点权重更高，结果应 > 0
      expect(conf).toBeGreaterThan(0)
    })

    test('空输入返回 0', () => {
      expect(calculateOverallConfidence([])).toBe(0)
    })

    test('单节点置信度等于其 confidence', () => {
      const single: TraceStepInput[] = [{ id: 's', name: '单个', confidence: 75 }]
      const conf = calculateOverallConfidence(single)
      expect(conf).toBe(75)
    })

    test('置信度不超出 0~100', () => {
      const extreme: TraceStepInput[] = [
        { id: 'e', name: '极高', confidence: 200 },
      ]
      const conf = calculateOverallConfidence(extreme)
      expect(conf).toBeLessThanOrEqual(100)
    })
  })

  // ─── countTraceNodes ──────────────────────────────────────
  describe('countTraceNodes', () => {
    test('统计递归节点数', () => {
      // step-1 + step-1-1 + step-1-1-1 + step-1-2 + step-1-3 + step-2 = 6
      expect(countTraceNodes(sampleSteps)).toBe(6)
    })

    test('单节点', () => {
      expect(countTraceNodes([{ id: 's', name: 'single' }])).toBe(1)
    })

    test('空输入返回 0', () => {
      expect(countTraceNodes([])).toBe(0)
    })

    test('深层嵌套', () => {
      const deep: TraceStepInput[] = [{
        id: 'd0', name: 'root', children: [{
          id: 'd1', name: 'child', children: [{
            id: 'd2', name: 'grandchild', children: [{
              id: 'd3', name: 'great-grandchild',
            }],
          }],
        }],
      }]
      expect(countTraceNodes(deep)).toBe(4)
    })
  })
})
