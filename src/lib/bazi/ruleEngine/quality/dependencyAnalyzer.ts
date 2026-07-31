import type { DependencyReport, DependencyGraphNode, CircularDependency } from './types'
import type { RuleDefinition } from '../types'

/**
 * C8-3 Rule Dependency（依赖分析）
 * 
 * 功能：
 * 1. 生成 Rule Dependency Graph
 * 2. 检测循环依赖（DFS）
 * 3. 检测孤立规则
 * 4. 拓扑排序（确定合法执行顺序）
 */
export class DependencyAnalyzer {
  /**
   * 分析规则依赖关系
   */
  analyze(rules: RuleDefinition[]): DependencyReport {
    const generatedAt = new Date().toISOString()
    
    // 构建依赖图
    const ruleMap = new Map<string, RuleDefinition>()
    for (const r of rules) ruleMap.set(r.id, r)
    
    const nodes: DependencyGraphNode[] = rules.map(rule => {
      const deps = rule.dependencies ?? []
      const dependents: string[] = []
      for (const other of rules) {
        if (other.id !== rule.id && (other.dependencies ?? []).includes(rule.id)) {
          dependents.push(other.id)
        }
      }
      return {
        ruleId: rule.id,
        ruleName: rule.name ?? rule.id,
        dependencies: deps,
        dependents,
        isIsolated: deps.length === 0 && dependents.length === 0,
      }
    })

    // 检测循环依赖（DFS）
    const circularDependencies = this.detectCircularDependencies(rules)

    // 检测孤立规则
    const isolatedRules = nodes
      .filter(n => n.isIsolated)
      .map(n => ({ ruleId: n.ruleId, ruleName: n.ruleName }))

    // 拓扑排序（Kahn 算法）
    const topologicalOrder = this.topologicalSort(rules)

    // 计算最大依赖深度
    const maxDepth = this.calculateMaxDepth(rules)

    // 统计
    let totalEdges = 0
    for (const n of nodes) totalEdges += n.dependencies.length

    return {
      generatedAt,
      nodes,
      circularDependencies,
      isolatedRules,
      topologicalOrder,
      maxDepth,
      stats: {
        totalNodes: nodes.length,
        totalEdges,
        isolatedCount: isolatedRules.length,
        circularCount: circularDependencies.length,
      },
    }
  }

  /** DFS 检测循环依赖 */
  private detectCircularDependencies(rules: RuleDefinition[]): CircularDependency[] {
    const cycles: CircularDependency[] = []
    const ruleMap = new Map<string, RuleDefinition>()
    for (const r of rules) ruleMap.set(r.id, r)
    
    const visited = new Set<string>()
    const recStack = new Set<string>()
    const path: string[] = []

    const dfs = (ruleId: string): void => {
      if (recStack.has(ruleId)) {
        // 发现循环
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

      const rule = ruleMap.get(ruleId)
      if (rule?.dependencies) {
        for (const dep of rule.dependencies) {
          if (ruleMap.has(dep)) dfs(dep)
        }
      }

      path.pop()
      recStack.delete(ruleId)
    }

    for (const r of rules) {
      if (!visited.has(r.id)) dfs(r.id)
    }

    return cycles
  }

  /** Kahn 拓扑排序 */
  private topologicalSort(rules: RuleDefinition[]): string[] {
    const inDegree = new Map<string, number>()
    const adjList = new Map<string, string[]>()
    
    for (const r of rules) {
      if (!inDegree.has(r.id)) inDegree.set(r.id, 0)
      if (!adjList.has(r.id)) adjList.set(r.id, [])
      for (const dep of (r.dependencies ?? [])) {
        if (!inDegree.has(dep)) inDegree.set(dep, 0)
        if (!adjList.has(dep)) adjList.set(dep, [])
        adjList.get(dep)!.push(r.id)
        inDegree.set(r.id, (inDegree.get(r.id) ?? 0) + 1)
      }
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

    return result
  }

  /** 计算最大依赖深度 */
  private calculateMaxDepth(rules: RuleDefinition[]): number {
    const ruleMap = new Map<string, RuleDefinition>()
    for (const r of rules) ruleMap.set(r.id, r)
    const depthCache = new Map<string, number>()

    const getDepth = (ruleId: string, visiting: Set<string>): number => {
      if (depthCache.has(ruleId)) return depthCache.get(ruleId)!
      if (visiting.has(ruleId)) return 0 // 循环依赖，返回 0 避免无限递归
      visiting.add(ruleId)
      
      const rule = ruleMap.get(ruleId)
      if (!rule || !rule.dependencies || rule.dependencies.length === 0) {
        visiting.delete(ruleId)
        depthCache.set(ruleId, 1)
        return 1
      }
      
      const maxDep = Math.max(...rule.dependencies.map(d => getDepth(d, visiting)), 0)
      visiting.delete(ruleId)
      const depth = maxDep + 1
      depthCache.set(ruleId, depth)
      return depth
    }

    let maxDepth = 0
    for (const r of rules) {
      maxDepth = Math.max(maxDepth, getDepth(r.id, new Set()))
    }
    return maxDepth
  }
}
