/**
 * Pipeline Step 注册中心 — V4.4 Enterprise
 *
 * 所有 Step 通过 register() 注册，Pipeline 不认识任何具体 Step。
 * 支持插件化扩展：VIP模块、地区版、海外版只需 register 新 Step。
 */

import type { StepDefinition } from './steps'

/** 注册中心错误 */
export class PipelineRegistryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PipelineRegistryError'
  }
}

/** Pipeline Step 注册中心 */
export class PipelineRegistry {
  private static steps = new Map<string, StepDefinition>()
  private static order: string[] = []

  /** 注册一个 Step */
  static register(step: StepDefinition): void {
    if (this.steps.has(step.id)) {
      throw new PipelineRegistryError(`Duplicate step id: "${step.id}"`)
    }
    this.steps.set(step.id, step)
    this.order.push(step.id)
  }

  /** 批量注册 */
  static registerAll(steps: StepDefinition[]): void {
    for (const step of steps) {
      this.register(step)
    }
  }

  /** 获取所有已注册 Step（按注册顺序） */
  static getAll(): StepDefinition[] {
    return this.order.map(id => this.steps.get(id)!).filter(Boolean)
  }

  /** 根据 ID 获取 Step */
  static get(id: string): StepDefinition | undefined {
    return this.steps.get(id)
  }

  /** 检查是否存在 */
  static has(id: string): boolean {
    return this.steps.has(id)
  }

  /** 获取注册数量 */
  static get size(): number {
    return this.steps.size
  }

  /** 清除所有注册（仅用于测试） */
  static clear(): void {
    this.steps.clear()
    this.order = []
  }

  /**
   * 校验依赖图
   * @throws PipelineRegistryError 如果存在循环依赖、缺失依赖或孤立节点
   */
  static validateDependencyGraph(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    const allIds = new Set(this.order)

    for (const step of this.getAll()) {
      // 检查缺失依赖
      if (step.dependsOn) {
        for (const depId of step.dependsOn) {
          if (!allIds.has(depId)) {
            errors.push(`Step "${step.id}" depends on "${depId}" which is not registered`)
          }
        }
      }
    }

    // 检查循环依赖（DFS）
    const WHITE = 0, GRAY = 1, BLACK = 2
    const color = new Map<string, number>()
    for (const id of this.order) color.set(id, WHITE)

    const hasCycle = (node: string, path: string[]): boolean => {
      color.set(node, GRAY)
      const step = this.steps.get(node)
      if (step?.dependsOn) {
        for (const dep of step.dependsOn) {
          if (color.get(dep) === GRAY) {
            errors.push(`Circular dependency: ${[...path, dep].map(s => `"${s}"`).join(' → ')}`)
            return true
          }
          if (color.get(dep) === WHITE) {
            if (hasCycle(dep, [...path, dep])) return true
          }
        }
      }
      color.set(node, BLACK)
      return false
    }

    for (const id of this.order) {
      if (color.get(id) === WHITE) {
        hasCycle(id, [id])
      }
    }

    // 检查孤立节点（无依赖且无被依赖）
    for (const step of this.getAll()) {
      const isDependedOn = this.getAll().some(s =>
        s.dependsOn?.includes(step.id)
      )
      const isLeaf = !step.dependsOn || step.dependsOn.length === 0
      if (isLeaf && !isDependedOn && this.order.length > 1) {
        warnings.push(`Step "${step.id}" is isolated (no dependencies and not depended on)`)
      }
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * 获取拓扑排序后的 Step 列表（基于 dependsOn）
   * 如果存在循环依赖，返回 null
   */
  static getTopologicalOrder(): StepDefinition[] | null {
    const { valid } = this.validateDependencyGraph()
    if (!valid) return null

    const inDegree = new Map<string, number>()
    const dependents = new Map<string, string[]>()

    for (const id of this.order) {
      inDegree.set(id, 0)
      dependents.set(id, [])
    }

    for (const step of this.getAll()) {
      if (step.dependsOn) {
        for (const dep of step.dependsOn) {
          inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1)
          dependents.get(dep)?.push(step.id)
        }
      }
    }

    const queue: string[] = []
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id)
    }

    const sorted: StepDefinition[] = []
    while (queue.length > 0) {
      const id = queue.shift()!
      const step = this.steps.get(id)
      if (step) sorted.push(step)

      for (const depId of dependents.get(id) || []) {
        inDegree.set(depId, (inDegree.get(depId) || 0) - 1)
        if (inDegree.get(depId) === 0) queue.push(depId)
      }
    }

    return sorted.length === this.order.length ? sorted : null
  }
}
