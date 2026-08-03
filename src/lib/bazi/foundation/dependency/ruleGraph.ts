/**
 * P0-5 Part 3: Rule Dependency Graph — 规则依赖图
 *
 * 在既有 DependencyAnalyzer（ruleEngine/quality/dependencyAnalyzer.ts）之上扩展：
 *   1. 同时支持 RuleDefinition（代码规则）与 RuleDSLDefinition（DSL 规则）
 *   2. 提供可变图（addRule / addDependency），而不是一次性 analyze
 *   3. 集成拓扑排序、循环依赖检测、孤立规则、最大深度、依赖反向查询
 *   4. 输出标准化的 RuleGraphReport 报告
 *
 * 设计原则：
 *   - 复用 DependencyAnalyzer 的 DFS 循环检测与 Kahn 拓扑排序思想
 *   - 不直接继承（避免与 RuleDefinition 强耦合），而是组合使用
 *   - 通过 normalizeRuleId() 同时容纳两种规则类型
 */

import type { RuleDefinition } from '../../ruleEngine/types'
import type { RuleDSLDefinition } from '../types'
import type { CircularDependency } from '../../ruleEngine/quality/types'

// ============================================================
// 内部类型定义
// ============================================================

/** 规则来源类型 */
export type RuleSourceType = 'code' | 'dsl'

/** 规则图节点 */
export interface RuleGraphNode {
  /** 规则 ID */
  ruleId: string
  /** 规则名称 */
  ruleName: string
  /** 规则来源类型 */
  source: RuleSourceType
  /** 该规则依赖的规则 ID 列表 */
  dependencies: string[]
  /** 依赖该规则的规则 ID 列表（反向依赖） */
  dependents: string[]
  /** 是否为孤立节点 */
  isIsolated: boolean
  /** 依赖深度（最深链长度，从无依赖的叶子算起为 1） */
  depth: number
  /** 元数据 */
  meta?: {
    version?: string
    category?: string
    priority?: number
    source?: string | string[]
  }
}

/** 规则图边 */
export interface RuleGraphEdge {
  /** 边 ID */
  id: string
  /** 依赖方（from 依赖于 to） */
  from: string
  /** 被依赖方 */
  to: string
  /** 边类型，目前只有 depends_on */
  type: 'depends_on'
}

/** 规则图报告 */
export interface RuleGraphReport {
  /** 报告生成时间戳 */
  generatedAt: number
  /** 全部节点 */
  nodes: RuleGraphNode[]
  /** 全部边 */
  edges: RuleGraphEdge[]
  /** 检测到的循环依赖 */
  cycles: CircularDependency[]
  /** 拓扑排序结果（合法执行顺序） */
  topologicalOrder: string[]
  /** 规则执行顺序（带规则名） */
  executionOrder: Array<{ ruleId: string; ruleName: string; source: RuleSourceType }>
  /** 孤立规则（无依赖也无被依赖） */
  isolatedRules: Array<{ ruleId: string; ruleName: string }>
  /** 最大依赖深度 */
  maxDepth: number
  /** 统计 */
  stats: {
    totalNodes: number
    totalEdges: number
    codeRuleCount: number
    dslRuleCount: number
    isolatedCount: number
    circularCount: number
  }
}

// ============================================================
// RuleGraph 引擎
// ============================================================

/**
 * 规则依赖图
 *
 * 维护规则之间的依赖关系，支持动态添加，并输出完整的依赖分析报告。
 * 兼容 RuleDefinition（代码规则）与 RuleDSLDefinition（DSL 规则）两种格式。
 */
export class RuleGraph {
  /** 节点表：ruleId → 节点信息 */
  private nodes = new Map<string, RuleGraphNode>()
  /** 边表：edgeId → 边 */
  private edges = new Map<string, RuleGraphEdge>()
  /** 按 from 索引边（出边：依赖了哪些） */
  private edgesByFrom = new Map<string, Set<string>>()
  /** 按 to 索引边（入边：被哪些依赖） */
  private edgesByTo = new Map<string, Set<string>>()
  /** 规则来源类型记录 */
  private ruleSources = new Map<string, RuleSourceType>()

  // ---------- 规则管理 ----------

  /**
   * 添加规则（兼容 RuleDefinition 与 RuleDSLDefinition）
   */
  addRule(rule: RuleDefinition | RuleDSLDefinition): void {
    const isDSL = this.isDSLRule(rule)
    const ruleId = rule.id
    const ruleName = rule.name ?? rule.id
    const sourceType: RuleSourceType = isDSL ? 'dsl' : 'code'

    this.ruleSources.set(ruleId, sourceType)

    // 若已存在则更新基本信息（保留已建立的依赖关系）
    const existing = this.nodes.get(ruleId)
    if (existing) {
      existing.ruleName = ruleName
      existing.source = sourceType
      existing.meta = this.extractMeta(rule, isDSL)
      // 同步规则自带的 dependencies
      const deps = (rule.dependencies ?? []) as string[]
      for (const dep of deps) {
        this.addDependencyInternal(ruleId, dep)
      }
      return
    }

    // 新建节点
    const node: RuleGraphNode = {
      ruleId,
      ruleName,
      source: sourceType,
      dependencies: [],
      dependents: [],
      isIsolated: true,
      depth: 1,
      meta: this.extractMeta(rule, isDSL),
    }
    this.nodes.set(ruleId, node)

    // 注册规则自带 dependencies
    const deps = (rule.dependencies ?? []) as string[]
    for (const dep of deps) {
      this.addDependencyInternal(ruleId, dep)
    }
  }

  /**
   * 添加依赖关系：ruleId 依赖于 dependsOnId
   */
  addDependency(ruleId: string, dependsOnId: string): void {
    this.addDependencyInternal(ruleId, dependsOnId)
  }

  /** 内部添加依赖 */
  private addDependencyInternal(ruleId: string, dependsOnId: string): void {
    if (ruleId === dependsOnId) {
      console.warn(`[RuleGraph] 规则 ${ruleId} 不能依赖自身，已忽略`)
      return
    }

    // 自动补全节点（依赖的规则尚未注册时，先以占位形式注册）
    if (!this.nodes.has(ruleId)) {
      this.nodes.set(ruleId, {
        ruleId,
        ruleName: ruleId,
        source: this.ruleSources.get(ruleId) ?? 'code',
        dependencies: [],
        dependents: [],
        isIsolated: true,
        depth: 1,
      })
    }
    if (!this.nodes.has(dependsOnId)) {
      this.nodes.set(dependsOnId, {
        ruleId: dependsOnId,
        ruleName: dependsOnId,
        source: this.ruleSources.get(dependsOnId) ?? 'code',
        dependencies: [],
        dependents: [],
        isIsolated: true,
        depth: 1,
      })
    }

    const edgeId = `e:${ruleId}->${dependsOnId}`
    if (this.edges.has(edgeId)) return // 已存在，幂等

    const edge: RuleGraphEdge = {
      id: edgeId,
      from: ruleId,
      to: dependsOnId,
      type: 'depends_on',
    }
    this.edges.set(edgeId, edge)

    if (!this.edgesByFrom.has(ruleId)) this.edgesByFrom.set(ruleId, new Set())
    this.edgesByFrom.get(ruleId)!.add(edgeId)
    if (!this.edgesByTo.has(dependsOnId)) this.edgesByTo.set(dependsOnId, new Set())
    this.edgesByTo.get(dependsOnId)!.add(edgeId)

    // 更新节点关系
    const fromNode = this.nodes.get(ruleId)!
    const toNode = this.nodes.get(dependsOnId)!
    if (!fromNode.dependencies.includes(dependsOnId)) fromNode.dependencies.push(dependsOnId)
    if (!toNode.dependents.includes(ruleId)) toNode.dependents.push(ruleId)
    fromNode.isIsolated = false
    toNode.isIsolated = false
  }

  /** 移除规则 */
  removeRule(ruleId: string): boolean {
    if (!this.nodes.has(ruleId)) return false

    // 删除所有相关边（出边 + 入边）
    const outEdges = this.edgesByFrom.get(ruleId) ?? new Set()
    const inEdges = this.edgesByTo.get(ruleId) ?? new Set()
    for (const eid of [...outEdges, ...inEdges]) {
      const e = this.edges.get(eid)
      if (!e) continue
      this.edges.delete(eid)
      // 从另一端节点的索引中移除
      if (e.from === ruleId) {
        this.edgesByTo.get(e.to)?.delete(eid)
        const target = this.nodes.get(e.to)
        if (target) {
          target.dependents = target.dependents.filter(id => id !== ruleId)
          if (target.dependencies.length === 0 && target.dependents.length === 0) {
            target.isIsolated = true
          }
        }
      } else {
        this.edgesByFrom.get(e.from)?.delete(eid)
        const target = this.nodes.get(e.from)
        if (target) {
          target.dependencies = target.dependencies.filter(id => id !== ruleId)
          if (target.dependencies.length === 0 && target.dependents.length === 0) {
            target.isIsolated = true
          }
        }
      }
    }
    this.edgesByFrom.delete(ruleId)
    this.edgesByTo.delete(ruleId)

    this.nodes.delete(ruleId)
    this.ruleSources.delete(ruleId)
    return true
  }

  // ---------- 查询 ----------

  /** 获取节点 */
  getNode(ruleId: string): RuleGraphNode | undefined {
    return this.nodes.get(ruleId)
  }

  /** 获取某规则依赖的所有规则（出边） */
  getDependencies(ruleId: string): string[] {
    return this.nodes.get(ruleId)?.dependencies ?? []
  }

  /** 获取所有依赖某规则的规则（入边，反向依赖） */
  getDependents(ruleId: string): string[] {
    return this.nodes.get(ruleId)?.dependents ?? []
  }

  /** 获取所有孤立规则 */
  getIsolatedRules(): Array<{ ruleId: string; ruleName: string }> {
    const out: Array<{ ruleId: string; ruleName: string }> = []
    for (const n of this.nodes.values()) {
      if (n.isIsolated) out.push({ ruleId: n.ruleId, ruleName: n.ruleName })
    }
    return out
  }

  /** 获取全部规则 ID */
  getAllRuleIds(): string[] {
    return Array.from(this.nodes.keys())
  }

  // ---------- 核心算法 ----------

  /**
   * 拓扑排序（Kahn 算法）
   * 依赖关系：ruleId → dependsOnId 表示 ruleId 依赖于 dependsOnId
   * 执行顺序：被依赖者先执行（叶子优先）
   */
  topologicalSort(): string[] {
    const inDegree = new Map<string, number>()
    const adjList = new Map<string, string[]>() // 被依赖者 → 依赖者

    for (const id of this.nodes.keys()) {
      inDegree.set(id, 0)
      adjList.set(id, [])
    }
    for (const e of this.edges.values()) {
      // from 依赖于 to → to 完成后才能执行 from → to → from 的邻接
      adjList.get(e.to)!.push(e.from)
      inDegree.set(e.from, (inDegree.get(e.from) ?? 0) + 1)
    }

    const queue: string[] = []
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id)
    }

    const result: string[] = []
    while (queue.length > 0) {
      const cur = queue.shift()!
      result.push(cur)
      for (const next of (adjList.get(cur) ?? [])) {
        inDegree.set(next, (inDegree.get(next) ?? 1) - 1)
        if (inDegree.get(next) === 0) queue.push(next)
      }
    }

    // 若 result 长度小于节点数，说明存在循环依赖，剩余节点不输出
    return result
  }

  /**
   * 检测循环依赖（DFS）
   * 沿 ruleId → dependsOnId 方向遍历，发现回到 recStack 中的节点即成环
   */
  detectCycles(): CircularDependency[] {
    const cycles: CircularDependency[] = []
    const visited = new Set<string>()
    const recStack = new Set<string>()
    const path: string[] = []

    const dfs = (ruleId: string): void => {
      if (recStack.has(ruleId)) {
        const cycleStart = path.indexOf(ruleId)
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart).concat(ruleId)
          cycles.push({
            cycle,
            length: cycle.length - 1,
          })
        }
        return
      }
      if (visited.has(ruleId)) return

      visited.add(ruleId)
      recStack.add(ruleId)
      path.push(ruleId)

      const deps = this.nodes.get(ruleId)?.dependencies ?? []
      for (const dep of deps) {
        if (this.nodes.has(dep)) dfs(dep)
      }

      path.pop()
      recStack.delete(ruleId)
    }

    for (const id of this.nodes.keys()) {
      if (!visited.has(id)) dfs(id)
    }

    return cycles
  }

  /**
   * 计算最大依赖深度
   * 叶子节点（无依赖）深度为 1，每多一层依赖 +1
   * 循环依赖部分返回 0 避免无限递归
   */
  getMaxDepth(): number {
    const depthCache = new Map<string, number>()

    const getDepth = (ruleId: string, visiting: Set<string>): number => {
      if (depthCache.has(ruleId)) return depthCache.get(ruleId)!
      if (visiting.has(ruleId)) return 0 // 循环依赖，避免无限递归
      visiting.add(ruleId)

      const node = this.nodes.get(ruleId)
      if (!node || node.dependencies.length === 0) {
        visiting.delete(ruleId)
        depthCache.set(ruleId, 1)
        return 1
      }

      let maxDep = 0
      for (const dep of node.dependencies) {
        if (this.nodes.has(dep)) {
          maxDep = Math.max(maxDep, getDepth(dep, visiting))
        }
      }
      visiting.delete(ruleId)
      const depth = maxDep + 1
      depthCache.set(ruleId, depth)
      return depth
    }

    let maxDepth = 0
    for (const id of this.nodes.keys()) {
      maxDepth = Math.max(maxDepth, getDepth(id, new Set()))
    }
    return maxDepth
  }

  /**
   * 获取执行顺序（带规则名）
   * 等同于 topologicalSort()，但返回更丰富的信息
   */
  getExecutionOrder(): Array<{ ruleId: string; ruleName: string; source: RuleSourceType }> {
    const order = this.topologicalSort()
    return order.map(ruleId => {
      const node = this.nodes.get(ruleId)
      return {
        ruleId,
        ruleName: node?.ruleName ?? ruleId,
        source: node?.source ?? 'code',
      }
    })
  }

  /**
   * 生成完整的规则图报告
   */
  toReport(): RuleGraphReport {
    // 计算每个节点的 depth
    const depthCache = new Map<string, number>()
    const getDepth = (ruleId: string, visiting: Set<string>): number => {
      if (depthCache.has(ruleId)) return depthCache.get(ruleId)!
      if (visiting.has(ruleId)) return 0
      visiting.add(ruleId)
      const node = this.nodes.get(ruleId)
      if (!node || node.dependencies.length === 0) {
        visiting.delete(ruleId)
        depthCache.set(ruleId, 1)
        return 1
      }
      let maxDep = 0
      for (const dep of node.dependencies) {
        if (this.nodes.has(dep)) {
          maxDep = Math.max(maxDep, getDepth(dep, visiting))
        }
      }
      visiting.delete(ruleId)
      const depth = maxDep + 1
      depthCache.set(ruleId, depth)
      return depth
    }
    for (const n of this.nodes.values()) {
      n.depth = getDepth(n.ruleId, new Set())
    }

    const cycles = this.detectCycles()
    const topologicalOrder = this.topologicalSort()
    const executionOrder = this.getExecutionOrder()
    const isolatedRules = this.getIsolatedRules()
    const maxDepth = this.getMaxDepth()

    let codeRuleCount = 0
    let dslRuleCount = 0
    for (const src of this.ruleSources.values()) {
      if (src === 'code') codeRuleCount += 1
      else dslRuleCount += 1
    }

    return {
      generatedAt: Date.now(),
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      cycles,
      topologicalOrder,
      executionOrder,
      isolatedRules,
      maxDepth,
      stats: {
        totalNodes: this.nodes.size,
        totalEdges: this.edges.size,
        codeRuleCount,
        dslRuleCount,
        isolatedCount: isolatedRules.length,
        circularCount: cycles.length,
      },
    }
  }

  // ---------- 辅助方法 ----------

  /** 判断是否为 DSL 规则（DSL 有 conditions 字段，RuleDefinition 有 evaluate 字段） */
  private isDSLRule(rule: RuleDefinition | RuleDSLDefinition): rule is RuleDSLDefinition {
    return !('evaluate' in rule) && 'conditions' in rule
  }

  /** 提取规则元数据 */
  private extractMeta(rule: RuleDefinition | RuleDSLDefinition, isDSL: boolean): RuleGraphNode['meta'] {
    if (isDSL) {
      const dsl = rule as RuleDSLDefinition
      return {
        version: dsl.version,
        category: dsl.category,
        priority: dsl.priority,
        source: dsl.source,
      }
    }
    const r = rule as RuleDefinition
    return {
      version: r.version,
      category: r.category,
      priority: r.priority,
      source: r.source,
    }
  }

  /** 重置图（清空所有节点与边） */
  clear(): void {
    this.nodes.clear()
    this.edges.clear()
    this.edgesByFrom.clear()
    this.edgesByTo.clear()
    this.ruleSources.clear()
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局规则依赖图单例 */
export const globalRuleGraph = new RuleGraph()
