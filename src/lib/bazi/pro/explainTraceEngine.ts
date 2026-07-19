/**
 * V5.0 RC Phase 5 Batch 2 Module V: Explain Trace Engine
 *
 * 职责：纯数据转换，将技术步骤树转换为用户可读的追溯树、面包屑和摘要
 * 约束：不依赖实际引擎输出，不直接 import 现有引擎运行时函数
 */

import type {
  TraceNodeType,
  TraceDisplayStatus,
  TraceStepInput,
  TraceDisplayNode,
  TraceBreadcrumb,
  TracePathSummary,
  ExplainTraceOutput,
  TraceFilterOptions,
} from './explainTraceTypes'

import {
  EXPLAIN_TRACE_VERSION,
  DEFAULT_TRACE_FILTER,
} from './explainTraceTypes'

// ═══════════════════════════════════════════════════════════
// 版本号
// ═══════════════════════════════════════════════════════════

export const EXPLAIN_TRACE_ENGINE_VERSION = '1.0.0'

// ═══════════════════════════════════════════════════════════
// 内部辅助
// ═══════════════════════════════════════════════════════════

function clampScore(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function confidenceToStatus(confidence: number): TraceDisplayStatus {
  if (confidence >= 70) return 'strong'
  if (confidence >= 40) return 'moderate'
  return 'weak'
}

/**
 * 递归统计步骤总数
 */
function countStepsRecursive(steps: TraceStepInput[]): number {
  let count = 0
  for (const step of steps) {
    count += 1
    if (step.children && step.children.length > 0) {
      count += countStepsRecursive(step.children)
    }
  }
  return count
}

// ═══════════════════════════════════════════════════════════
// 公开函数
// ═══════════════════════════════════════════════════════════

/**
 * 根据 name/source 关键词自动分类步骤类型
 */
export function classifyStepType(step: TraceStepInput): TraceNodeType {
  const name = step.name ?? ''
  const source = step.source ?? ''
  const combined = name + source

  if (combined.includes('结论') || combined.includes('总评')) return 'conclusion'
  if (combined.includes('Module') || combined.includes('引擎')) return 'source-module'
  if (combined.includes('Rule') || combined.includes('规则')) return 'rule'
  if (combined.includes('三命通会') || combined.includes('滴天髓') || combined.includes('子平真诠')) return 'classic'
  if (combined.includes('专家') || combined.includes('验证')) return 'expert'
  return 'final'
}

/**
 * 递归转换步骤树为展示树
 */
export function stepsToDisplayTree(
  steps: TraceStepInput[],
  filter?: TraceFilterOptions,
  depth: number = 0,
): TraceDisplayNode[] {
  const f: TraceFilterOptions = filter ?? DEFAULT_TRACE_FILTER

  return steps
    .filter((step) => {
      // 深度过滤
      if (depth > f.maxDepth) return false
      // 类型过滤
      const nodeType = classifyStepType(step)
      if (f.excludeTypes.includes(nodeType)) return false
      // 置信度过滤
      const conf = step.confidence ?? 0
      if (conf < f.minConfidence) return false
      return true
    })
    .map((step) => {
      const formatted = formatStepForUser(step)
      const conf = clampScore(step.confidence ?? 0, 0, 100)
      const children = step.children
        ? stepsToDisplayTree(step.children, f, depth + 1)
        : []
      return {
        id: step.id,
        type: classifyStepType(step),
        label: formatted.label,
        description: formatted.description,
        confidence: conf,
        status: confidenceToStatus(conf),
        children,
        depth,
      }
    })
}

/**
 * 将步骤树转换为用户可读追溯树
 */
export function buildExplainTrace(
  steps: TraceStepInput[],
  options?: Partial<TraceFilterOptions>,
): ExplainTraceOutput {
  const f: TraceFilterOptions = { ...DEFAULT_TRACE_FILTER, ...options }
  const treeNodes = stepsToDisplayTree(steps, f, 0)
  const tree: TraceDisplayNode = {
    id: 'root',
    type: 'conclusion',
    label: '推理追溯根节点',
    description: '命理推理的完整追溯路径',
    confidence: clampScore(calculateOverallConfidence(steps), 0, 100),
    status: 'strong',
    children: treeNodes,
    depth: 0,
  }
  const breadcrumbs = generateBreadcrumbs(steps)
  const summary = summarizeTracePath(steps)
  const totalNodes = countTraceNodes(steps)
  return { tree, breadcrumbs, summary, totalNodes }
}

/**
 * 面包屑导航
 */
export function generateBreadcrumbs(steps: TraceStepInput[]): TraceBreadcrumb[] {
  const crumbs: TraceBreadcrumb[] = []
  let stepNum = 0

  function walk(list: TraceStepInput[]): void {
    for (const step of list) {
      stepNum += 1
      crumbs.push({
        step: stepNum,
        label: step.name,
        nodeId: step.id,
      })
      if (step.children) {
        walk(step.children)
      }
    }
  }

  walk(steps)
  return crumbs
}

/**
 * 提炼摘要
 */
export function summarizeTracePath(steps: TraceStepInput[]): TracePathSummary {
  const modules: string[] = []
  const rulesHit: string[] = []
  const classicsCited: string[] = []
  const expertsReferenced: string[] = []
  let conclusion = ''
  let totalSteps = 0
  const confidences: number[] = []

  function walk(list: TraceStepInput[], depth: number): void {
    for (const step of list) {
      totalSteps += 1
      const conf = step.confidence ?? 0
      confidences.push(conf)

      const nodeType = classifyStepType(step)
      if (nodeType === 'source-module' && step.source) {
        if (!modules.includes(step.source)) modules.push(step.source)
      }
      if (nodeType === 'rule' && step.ruleId) {
        if (!rulesHit.includes(step.ruleId)) rulesHit.push(step.ruleId)
      }
      if (nodeType === 'classic' && step.name) {
        if (!classicsCited.includes(step.name)) classicsCited.push(step.name)
      }
      if (nodeType === 'expert' && step.name) {
        if (!expertsReferenced.includes(step.name)) expertsReferenced.push(step.name)
      }
      if (nodeType === 'conclusion') {
        conclusion = step.name
      }
      if (depth === 0 && step.children) {
        walk(step.children, depth + 1)
      } else if (step.children) {
        walk(step.children, depth + 1)
      }
    }
  }

  walk(steps, 0)

  const overallConfidence = confidences.length > 0
    ? clampScore(confidences.reduce((a, b) => a + b, 0) / confidences.length, 0, 100)
    : 0

  return {
    conclusion,
    modules,
    rulesHit,
    classicsCited,
    expertsReferenced,
    totalSteps,
    overallConfidence,
  }
}

/**
 * 技术步骤格式化
 */
export function formatStepForUser(
  step: TraceStepInput,
): { label: string; description: string } {
  return {
    label: step.name,
    description: step.description ?? step.source ?? '',
  }
}

/**
 * 过滤追溯树
 */
export function filterTraceTree(
  nodes: TraceDisplayNode[],
  filter: TraceFilterOptions,
): TraceDisplayNode[] {
  return nodes
    .filter((node) => {
      if (filter.excludeTypes.includes(node.type)) return false
      if (node.confidence < filter.minConfidence) return false
      if (node.depth > filter.maxDepth) return false
      return true
    })
    .map((node) => ({
      ...node,
      children: filterTraceTree(node.children, filter),
    }))
}

/**
 * 加权平均置信度（递归，深层权重更低）
 */
export function calculateOverallConfidence(steps: TraceStepInput[], depth: number = 0): number {
  if (steps.length === 0) return 0

  const weight = 1 / (depth + 1)
  let totalWeight = 0
  let weightedSum = 0

  for (const step of steps) {
    const conf = step.confidence ?? 0
    weightedSum += conf * weight
    totalWeight += weight

    if (step.children && step.children.length > 0) {
      const childConf = calculateOverallConfidence(step.children, depth + 1)
      const childWeight = weight * 0.5
      weightedSum += childConf * childWeight
      totalWeight += childWeight
    }
  }

  return totalWeight > 0 ? clampScore(weightedSum / totalWeight, 0, 100) : 0
}

/**
 * 统计总节点数
 */
export function countTraceNodes(steps: TraceStepInput[]): number {
  return countStepsRecursive(steps)
}
