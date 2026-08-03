/**
 * DSL Optimizer（优化器）
 *
 * 对 DSL 定义与 AST 进行静态优化，提供可观测的变更报告。
 *
 * 优化策略：
 *   1. 死条件消除：移除 `field === 'always' && value === true`；
 *      `value === false` 标记整个组为失败（插入哑条件）。
 *   2. 扁平化嵌套 AND/OR 组：外层 AND 与内层 AND 合并（同逻辑）。
 *   3. 同组重复去除：同一组内 field+op+value 相同条件合并。
 *   4. 五行动作合并：support/oppose 相同五行条目分数求和并合并原因。
 *   5. 字面永真条件移除（如 `1 >= 0` 这类字面量恒真判断）。
 */

import type {
  RuleDSLDefinition,
  DSLCondition,
  DSLConditionGroup,
  DSLWuxingAction,
} from '../../types'
import {
  ASTNodeType,
  type RuleASTNode,
  type ConditionGroupASTNode,
  type ConditionASTNode,
  type WuxingActionASTNode,
} from '../ast'

/** 优化变更记录 */
export interface OptimizationChange {
  /** 变更类型 */
  type: string
  /** 变更描述 */
  description: string
}

/**
 * 判断 DSL 中是否为条件组
 */
function isDSLGroup(item: DSLCondition | DSLConditionGroup): item is DSLConditionGroup {
  return 'logic' in item && 'conditions' in item
}

/**
 * 判断 AST 中是否为条件组节点
 */
function isASTGroup(
  node: ConditionASTNode | ConditionGroupASTNode,
): node is ConditionGroupASTNode {
  return node.type === ASTNodeType.ConditionGroup
}

/**
 * 判断条件是否为"恒真"死条件（always === true）
 */
function isAlwaysTrue(cond: DSLCondition): boolean {
  return cond.field === 'always' && cond.value === true
}

/**
 * 判断条件是否为"恒假"死条件（always === false）
 */
function isAlwaysFalse(cond: DSLCondition): boolean {
  return cond.field === 'always' && cond.value === false
}

/**
 * 判断字面量条件是否恒真（如 1 >= 0、"a" == "a" 等纯字面比较）
 */
function isLiteralAlwaysTrue(cond: DSLCondition): boolean {
  const isLiteral = (v: any) =>
    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
  if (!isLiteral(cond.value) || !/^-?\d+(\.\d+)?$|^true$|^false$|^".*"$/.test(String(cond.field))) {
    return false
  }
  let a: any = cond.field
  let b: any = cond.value
  if (typeof a === 'string') {
    if (a === 'true') a = true
    else if (a === 'false') a = false
    else if (/^-?\d+(\.\d+)?$/.test(a)) a = Number(a)
    else if (a.startsWith('"') && a.endsWith('"')) a = a.slice(1, -1)
  }
  switch (cond.operator) {
    case '>=': return a >= b
    case '<=': return a <= b
    case '>': return a > b
    case '<': return a < b
    case '==': return a === b
    case '!=': return a !== b
    default: return false
  }
}

/**
 * DSL 条件指纹：用于同组去重
 */
function conditionKey(c: DSLCondition): string {
  return `${c.field}|${c.operator}|${JSON.stringify(c.value)}`
}

/**
 * AST 条件指纹
 */
function astConditionKey(c: ConditionASTNode): string {
  return `${c.field}|${c.operator}|${JSON.stringify(c.value)}`
}

/**
 * 合并五行数组（DSL 层）
 */
function mergeWuxingDSL(actions: DSLWuxingAction[] | undefined): DSLWuxingAction[] {
  if (!actions || actions.length === 0) return []
  const map = new Map<string, DSLWuxingAction>()
  for (const a of actions) {
    const existing = map.get(a.wuxing)
    if (existing) {
      existing.score += a.score
      if (a.reason) {
        existing.reason = existing.reason
          ? `${existing.reason}；${a.reason}`
          : a.reason
      }
    } else {
      map.set(a.wuxing, { ...a })
    }
  }
  return Array.from(map.values())
}

/**
 * 合并五行动作数组（AST 层）
 */
function mergeWuxingAST(actions: WuxingActionASTNode[]): WuxingActionASTNode[] {
  if (actions.length === 0) return []
  const map = new Map<string, WuxingActionASTNode>()
  for (const a of actions) {
    const existing = map.get(a.wuxing)
    if (existing) {
      existing.score += a.score
      if (a.reason) {
        existing.reason = existing.reason
          ? `${existing.reason}；${a.reason}`
          : a.reason
      }
    } else {
      map.set(a.wuxing, { ...a })
    }
  }
  return Array.from(map.values())
}

/**
 * DSL Optimizer 类
 */
export class DSLOptimizer {
  /**
   * 递归优化 DSL 条件组
   */
  private _optimizeDSLConditions(
    group: DSLConditionGroup,
    changes: OptimizationChange[],
  ): DSLConditionGroup {
    const newConditions: Array<DSLCondition | DSLConditionGroup> = []
    const seen = new Set<string>()
    let hasAutoFail = false

    for (const item of group.conditions) {
      if (isDSLGroup(item)) {
        const optimized = this._optimizeDSLConditions(item, changes)
        if (
          optimized.conditions.length === 1 &&
          !isDSLGroup(optimized.conditions[0]) &&
          isAlwaysFalse(optimized.conditions[0])
        ) {
          hasAutoFail = true
          continue
        }
        if (optimized.logic === group.logic) {
          for (const sub of optimized.conditions) {
            newConditions.push(sub)
          }
          changes.push({
            type: 'flatten_nested_group',
            description: `扁平化嵌套的 ${group.logic.toUpperCase()} 组（合并内层 ${optimized.conditions.length} 个条件）`,
          })
        } else {
          newConditions.push(optimized)
        }
        continue
      }

      if (isAlwaysTrue(item)) {
        changes.push({
          type: 'dead_condition_elimination',
          description: `移除恒真条件：always == true（${item.description ?? '无描述'}）`,
        })
        continue
      }

      if (isLiteralAlwaysTrue(item)) {
        changes.push({
          type: 'dead_condition_elimination',
          description: `移除字面量恒真条件：${item.field} ${item.operator} ${JSON.stringify(item.value)}`,
        })
        continue
      }

      if (isAlwaysFalse(item)) {
        if (group.logic === 'and') {
          hasAutoFail = true
          changes.push({
            type: 'dead_condition_elimination',
            description: '检测到恒假条件，AND 组标记为自动失败',
          })
        } else {
          changes.push({
            type: 'dead_condition_elimination',
            description: '移除 OR 组中无意义的恒假条件',
          })
        }
        continue
      }

      const key = conditionKey(item)
      if (seen.has(key)) {
        changes.push({
          type: 'duplicate_removal',
          description: `移除重复条件：${item.field} ${item.operator} ${JSON.stringify(item.value)}`,
        })
        continue
      }
      seen.add(key)
      newConditions.push(item)
    }

    if (hasAutoFail && group.logic === 'and') {
      return {
        logic: 'and',
        conditions: [{ field: '__auto_fail__', operator: '==', value: true, description: '自动失败：AND 组存在恒假条件' }],
      }
    }

    return { logic: group.logic, conditions: newConditions }
  }

  /**
   * 递归优化 AST 条件组
   */
  private _optimizeASTConditions(
    group: ConditionGroupASTNode,
    changes: OptimizationChange[],
  ): ConditionGroupASTNode {
    const newConditions: Array<ConditionASTNode | ConditionGroupASTNode> = []
    const seen = new Set<string>()
    let hasAutoFail = false

    for (const item of group.conditions) {
      if (isASTGroup(item)) {
        const optimized = this._optimizeASTConditions(item, changes)
        if (
          optimized.conditions.length === 1 &&
          !isASTGroup(optimized.conditions[0]) &&
          (optimized.conditions[0] as ConditionASTNode).field === '__auto_fail__'
        ) {
          hasAutoFail = true
          continue
        }
        if (optimized.logic === group.logic) {
          for (const sub of optimized.conditions) {
            newConditions.push(sub)
          }
          changes.push({
            type: 'flatten_nested_group',
            description: `扁平化嵌套的 ${group.logic.toUpperCase()} AST 组（合并内层 ${optimized.conditions.length} 个条件）`,
          })
        } else {
          newConditions.push(optimized)
        }
        continue
      }

      const cond = item as ConditionASTNode
      if (cond.field === 'always' && cond.value === true) {
        changes.push({
          type: 'dead_condition_elimination',
          description: `移除 AST 恒真条件：always == true（${cond.description ?? '无描述'}）`,
        })
        continue
      }
      if (cond.field === 'always' && cond.value === false) {
        if (group.logic === 'and') {
          hasAutoFail = true
          changes.push({
            type: 'dead_condition_elimination',
            description: '检测到 AST 恒假条件，AND 组标记为自动失败',
          })
        } else {
          changes.push({
            type: 'dead_condition_elimination',
            description: '移除 AST OR 组中无意义的恒假条件',
          })
        }
        continue
      }

      const key = astConditionKey(cond)
      if (seen.has(key)) {
        changes.push({
          type: 'duplicate_removal',
          description: `移除 AST 重复条件：${cond.field} ${cond.operator} ${JSON.stringify(cond.value)}`,
        })
        continue
      }
      seen.add(key)
      newConditions.push(item)
    }

    if (hasAutoFail && group.logic === 'and') {
      return {
        type: ASTNodeType.ConditionGroup,
        logic: 'and',
        location: group.location,
        conditions: [{
          type: ASTNodeType.Condition,
          field: '__auto_fail__',
          operator: '==',
          value: true,
          description: '自动失败：AND 组存在恒假条件',
        }],
      }
    }

    return { ...group, conditions: newConditions }
  }

  /**
   * 优化 DSL（返回新 DSL 与变更列表）
   */
  optimizeDSL(dsl: RuleDSLDefinition): { dsl: RuleDSLDefinition; changes: OptimizationChange[] } {
    const changes: OptimizationChange[] = []

    const conditions = this._optimizeDSLConditions(dsl.conditions, changes)

    const originalSupportLen = dsl.support?.length ?? 0
    const originalOpposeLen = dsl.oppose?.length ?? 0
    const support = mergeWuxingDSL(dsl.support)
    const oppose = mergeWuxingDSL(dsl.oppose)
    if (support.length !== originalSupportLen) {
      changes.push({
        type: 'combine_wuxing_actions',
        description: `合并 support 五行条目：${originalSupportLen} → ${support.length}`,
      })
    }
    if (oppose.length !== originalOpposeLen) {
      changes.push({
        type: 'combine_wuxing_actions',
        description: `合并 oppose 五行条目：${originalOpposeLen} → ${oppose.length}`,
      })
    }

    return {
      dsl: {
        ...dsl,
        conditions,
        support: support.length > 0 ? support : undefined,
        oppose: oppose.length > 0 ? oppose : undefined,
      },
      changes,
    }
  }

  /**
   * 优化 AST（返回新 AST 与变更列表）
   */
  optimize(ast: RuleASTNode): { ast: RuleASTNode; changes: OptimizationChange[] } {
    const changes: OptimizationChange[] = []

    const conditions = this._optimizeASTConditions(ast.conditions, changes)

    const originalSupportLen = ast.support?.length ?? 0
    const originalOpposeLen = ast.oppose?.length ?? 0
    const support = mergeWuxingAST(ast.support ?? [])
    const oppose = mergeWuxingAST(ast.oppose ?? [])
    if (support.length !== originalSupportLen) {
      changes.push({
        type: 'combine_wuxing_actions',
        description: `合并 AST support 五行条目：${originalSupportLen} → ${support.length}`,
      })
    }
    if (oppose.length !== originalOpposeLen) {
      changes.push({
        type: 'combine_wuxing_actions',
        description: `合并 AST oppose 五行条目：${originalOpposeLen} → ${oppose.length}`,
      })
    }

    return {
      ast: {
        ...ast,
        conditions,
        support,
        oppose,
      },
      changes,
    }
  }

  /**
   * 获取优化报告（再次扫描 AST 给出潜在优化项数量 + 应用可执行的优化）
   */
  getOptimizationReport(ast: RuleASTNode): {
    potentialOptimizations: number
    changes: OptimizationChange[]
  } {
    const result = this.optimize(ast)
    return {
      potentialOptimizations: result.changes.length,
      changes: result.changes,
    }
  }
}

/** 全局 DSL Optimizer 单例 */
export const globalDSLOptimizer = new DSLOptimizer()
