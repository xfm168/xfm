// DSL Linter —— 规则静态检查器
// 比 Validator 更深入：检查逻辑层面的问题
// Validator 只检查语法/结构；Linter 检查语义/逻辑

import type { RuleDSLDefinition, DSLConditionGroup, DSLCondition, DSLWuxingAction } from '../../types'
import {
  ASTNodeType,
  type RuleASTNode,
  type ConditionGroupASTNode,
  type ConditionASTNode,
  type WuxingActionASTNode,
} from '../ast'

// ============================================================
// 类型定义
// ============================================================

/** 问题严重级别 */
export type LintSeverity = 'error' | 'warning' | 'info'

/** 单条 Lint 问题 */
export interface LintIssue {
  /** 规则 ID（或规则名） */
  rule: string
  /** 严重级别 */
  severity: LintSeverity
  /** 规则 ID（用于批量检查时归属） */
  message: string
  /** 相关字段 */
  field?: string
  /** 修复建议 */
  suggestion?: string
  /** 源码位置 */
  location?: { line: number; column: number }
}

/** 单规则 Lint 报告 */
export interface LintReport {
  /** 规则 ID */
  ruleId: string
  /** 问题列表 */
  issues: LintIssue[]
  /** error 数量 */
  errorCount: number
  /** warning 数量 */
  warningCount: number
  /** info 数量 */
  infoCount: number
  /** 是否通过（无 error） */
  passed: boolean
}

// ============================================================
// 内部规范化类型（DSL 与 AST 统一表示，便于复用检查逻辑）
// ============================================================

/** 规范化条件（DSL / AST 共用） */
interface LintCondition {
  field: string
  operator: string
  value: any
  weight?: number
  description?: string
  location?: { line: number; column: number }
}

/** 规范化条件组 */
interface LintConditionGroup {
  logic: 'and' | 'or'
  conditions: Array<LintCondition | LintConditionGroup>
}

/** 规范化五行动作 */
interface LintWuxingAction {
  wuxing: string
  score: number
  reason?: string
}

/** 合法操作符集合（标准比较操作符） */
const STANDARD_OPERATORS = new Set<string>([
  '==', '!=', '>', '<', '>=', '<=', 'in', 'contains',
])

// ============================================================
// 辅助函数：类型判断与遍历
// ============================================================

/** 判断规范化成员是否为条件组 */
function isLintGroup(item: LintCondition | LintConditionGroup): item is LintConditionGroup {
  return typeof (item as LintConditionGroup).logic === 'string'
    && Array.isArray((item as LintConditionGroup).conditions)
}

/** 判断 DSL 成员是否为条件组 */
function isDSLGroup(item: DSLCondition | DSLConditionGroup): item is DSLConditionGroup {
  return typeof (item as DSLConditionGroup).logic === 'string'
    && Array.isArray((item as DSLConditionGroup).conditions)
}

/** 递归遍历所有条件组（含自身） */
function walkGroups(group: LintConditionGroup, cb: (g: LintConditionGroup) => void): void {
  cb(group)
  for (const c of group.conditions) {
    if (isLintGroup(c)) walkGroups(c, cb)
  }
}

/** 递归遍历所有单个条件 */
function walkConditions(group: LintConditionGroup, cb: (c: LintCondition) => void): void {
  for (const c of group.conditions) {
    if (isLintGroup(c)) walkConditions(c, cb)
    else cb(c)
  }
}

/** 取条件组的直接条件（非嵌套组） */
function directConditions(group: LintConditionGroup): LintCondition[] {
  return group.conditions.filter(c => !isLintGroup(c)) as LintCondition[]
}

/** 值的稳定序列化（用于比较） */
function stableValue(v: any): string {
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

// ============================================================
// 规范化转换：DSL → Lint 结构
// ============================================================

function dslGroupToLint(group: DSLConditionGroup): LintConditionGroup {
  const logic: 'and' | 'or' = group.logic === 'or' ? 'or' : 'and'
  return {
    logic,
    conditions: (group.conditions ?? []).map(c => {
      if (isDSLGroup(c)) return dslGroupToLint(c)
      const cond = c as DSLCondition
      return {
        field: cond.field,
        operator: cond.operator,
        value: cond.value,
        weight: (cond as any).weight,
        description: cond.description,
      } as LintCondition
    }),
  }
}

function dslActionsToLint(actions: DSLWuxingAction[] | undefined): LintWuxingAction[] {
  if (!actions || !Array.isArray(actions)) return []
  return actions.map(a => ({ wuxing: a.wuxing, score: a.score, reason: a.reason }))
}

// ============================================================
// 规范化转换：AST → Lint 结构
// ============================================================

function astGroupToLint(node: ConditionGroupASTNode): LintConditionGroup {
  const logic: 'and' | 'or' = node.logic === 'or' ? 'or' : 'and'
  return {
    logic,
    conditions: (node.conditions ?? []).map(c => {
      if (c.type === ASTNodeType.ConditionGroup) {
        return astGroupToLint(c as ConditionGroupASTNode)
      }
      const cond = c as ConditionASTNode
      return {
        field: cond.field,
        operator: cond.operator,
        value: cond.value,
        weight: (cond as any).weight,
        description: cond.description,
        location: cond.location,
      } as LintCondition
    }),
  }
}

function astActionsToLint(nodes: WuxingActionASTNode[] | undefined): LintWuxingAction[] {
  if (!nodes || !Array.isArray(nodes)) return []
  return nodes.map(n => ({ wuxing: n.wuxing, score: n.score, reason: n.reason }))
}

// ============================================================
// DSLLinter 类
// ============================================================

/**
 * DSL Linter —— 规则静态检查器
 *
 * 比 Validator 更深入：Validator 只检查语法/结构；Linter 检查语义/逻辑。
 * 支持单规则 lint、AST lint、批量 lintBatch（含跨规则检查：循环依赖、重复 ID）。
 */
export class DSLLinter {
  // ---------- 单规则检查（每个返回 LintIssue[]） ----------

  /**
   * 检查 1：重复条件
   * - 同组中 field+operator+value 完全相同 → warning "重复条件"
   * - AND 组中同 field+operator 但 value 不同 → error "AND组中同字段同操作符但不同值，永远不成立"
   */
  checkDuplicateConditions(ruleId: string, group: LintConditionGroup): LintIssue[] {
    const issues: LintIssue[] = []
    walkGroups(group, g => {
      const conds = directConditions(g)
      // 完全重复检测
      for (let i = 0; i < conds.length; i++) {
        for (let j = i + 1; j < conds.length; j++) {
          const a = conds[i]
          const b = conds[j]
          if (
            a.field === b.field
            && a.operator === b.operator
            && stableValue(a.value) === stableValue(b.value)
          ) {
            issues.push({
              rule: ruleId,
              severity: 'warning',
              message: '重复条件',
              field: a.field,
              suggestion: `条件 ${a.field} ${a.operator} ${stableValue(a.value)} 重复出现，可合并`,
              location: a.location,
            })
          }
        }
      }
      // AND 组中同 field+operator 但 value 不同
      if (g.logic === 'and') {
        for (let i = 0; i < conds.length; i++) {
          for (let j = i + 1; j < conds.length; j++) {
            const a = conds[i]
            const b = conds[j]
            if (
              a.field === b.field
              && a.operator === b.operator
              && stableValue(a.value) !== stableValue(b.value)
            ) {
              issues.push({
                rule: ruleId,
                severity: 'error',
                message: 'AND组中同字段同操作符但不同值，永远不成立',
                field: a.field,
                suggestion: `条件 ${a.field} ${a.operator} 同时取 ${stableValue(a.value)} 与 ${stableValue(b.value)}，逻辑矛盾`,
                location: a.location,
              })
            }
          }
        }
      }
    })
    return issues
  }

  /**
   * 检查 2：恒真条件
   * - field === 'always' && value === true → info "恒真条件，可移除"
   * - operator === '>=' && value === 0（数值字段）→ info
   */
  checkAlwaysTrue(ruleId: string, group: LintConditionGroup): LintIssue[] {
    const issues: LintIssue[] = []
    walkConditions(group, c => {
      if (c.field === 'always' && c.value === true) {
        issues.push({
          rule: ruleId,
          severity: 'info',
          message: '恒真条件，可移除',
          field: c.field,
          suggestion: 'always === true 永远成立，可直接删除该条件',
          location: c.location,
        })
      } else if (c.operator === '>=' && typeof c.value === 'number' && c.value === 0) {
        issues.push({
          rule: ruleId,
          severity: 'info',
          message: '恒真条件，可移除',
          field: c.field,
          suggestion: `${c.field} >= 0 对数值字段恒真，可考虑移除`,
          location: c.location,
        })
      }
    })
    return issues
  }

  /**
   * 检查 3：恒假条件
   * - AND 组中 value === false → error "恒假条件，AND组永远不成立"
   * - operator === '==' && value === null → error
   */
  checkAlwaysFalse(ruleId: string, group: LintConditionGroup): LintIssue[] {
    const issues: LintIssue[] = []
    walkGroups(group, g => {
      if (g.logic !== 'and') return
      const conds = directConditions(g)
      for (const c of conds) {
        if (c.value === false) {
          issues.push({
            rule: ruleId,
            severity: 'error',
            message: '恒假条件，AND组永远不成立',
            field: c.field,
            suggestion: `条件 ${c.field} 值为 false，导致 AND 组恒假`,
            location: c.location,
          })
        }
        if (c.operator === '==' && c.value === null) {
          issues.push({
            rule: ruleId,
            severity: 'error',
            message: '恒假条件，AND组永远不成立',
            field: c.field,
            suggestion: `${c.field} == null 一般恒假，请确认意图`,
            location: c.location,
          })
        }
      }
    })
    return issues
  }

  /**
   * 检查 4：冲突条件
   * - AND 组中同 field、== 操作符、不同值 → error
   * - AND 组中 field >= X 与 field <= Y 且 X > Y（不可能区间）→ error
   */
  checkConflictingConditions(ruleId: string, group: LintConditionGroup): LintIssue[] {
    const issues: LintIssue[] = []
    walkGroups(group, g => {
      if (g.logic !== 'and') return
      const conds = directConditions(g)

      // 同 field、== 操作符、不同值
      for (let i = 0; i < conds.length; i++) {
        for (let j = i + 1; j < conds.length; j++) {
          const a = conds[i]
          const b = conds[j]
          if (
            a.field === b.field
            && a.operator === '==' && b.operator === '=='
            && stableValue(a.value) !== stableValue(b.value)
          ) {
            issues.push({
              rule: ruleId,
              severity: 'error',
              message: '冲突条件：同字段 == 不同值，AND组永远不成立',
              field: a.field,
              suggestion: `${a.field} == ${stableValue(a.value)} 与 ${a.field} == ${stableValue(b.value)} 冲突`,
              location: a.location,
            })
          }
        }
      }

      // 不可能区间：field >= X 与 field <= Y 且 X > Y
      const byField = new Map<string, LintCondition[]>()
      for (const c of conds) {
        if (!byField.has(c.field)) byField.set(c.field, [])
        byField.get(c.field)!.push(c)
      }
      for (const [field, list] of byField) {
        const ge = list.filter(c => c.operator === '>=' && typeof c.value === 'number')
        const le = list.filter(c => c.operator === '<=' && typeof c.value === 'number')
        for (const g1 of ge) {
          for (const l1 of le) {
            if ((g1.value as number) > (l1.value as number)) {
              issues.push({
                rule: ruleId,
                severity: 'error',
                message: '冲突条件：不可能区间，AND组永远不成立',
                field,
                suggestion: `${field} >= ${g1.value} 与 ${field} <= ${l1.value} 区间为空`,
                location: g1.location,
              })
            }
          }
        }
      }
    })
    return issues
  }

  /**
   * 检查 5：非法操作符
   * - 操作符不在标准集合 (==, !=, >, <, >=, <=, in, contains) 中 → error
   */
  checkInvalidOperator(ruleId: string, group: LintConditionGroup): LintIssue[] {
    const issues: LintIssue[] = []
    walkConditions(group, c => {
      if (!STANDARD_OPERATORS.has(c.operator)) {
        issues.push({
          rule: ruleId,
          severity: 'error',
          message: `非法操作符 "${c.operator}"`,
          field: c.field,
          suggestion: `合法操作符：${Array.from(STANDARD_OPERATORS).join(', ')}`,
          location: c.location,
        })
      }
    })
    return issues
  }

  /**
   * 检查 6：空条件组
   * - conditions 数组为空 → warning "空条件组"
   */
  checkEmptyGroup(ruleId: string, group: LintConditionGroup): LintIssue[] {
    const issues: LintIssue[] = []
    walkGroups(group, g => {
      if (!g.conditions || g.conditions.length === 0) {
        issues.push({
          rule: ruleId,
          severity: 'warning',
          message: '空条件组',
          suggestion: '条件组无任何条件，建议补充或移除',
        })
      }
    })
    return issues
  }

  /**
   * 检查 7：缺少 weight
   * - 条件无 weight 字段 → info "条件缺少 weight，默认为 1"
   */
  checkMissingWeight(ruleId: string, group: LintConditionGroup): LintIssue[] {
    const issues: LintIssue[] = []
    walkConditions(group, c => {
      if (c.weight === undefined) {
        issues.push({
          rule: ruleId,
          severity: 'info',
          message: '条件缺少 weight，默认为 1',
          field: c.field,
          suggestion: `建议为条件 ${c.field} 显式声明 weight`,
          location: c.location,
        })
      }
    })
    return issues
  }

  /**
   * 检查 8：五行冲突
   * - 同一五行同时出现在 support 与 oppose 中 → error "五行同时出现在 support 和 oppose 中"
   */
  checkWuxingConflict(ruleId: string, support: LintWuxingAction[], oppose: LintWuxingAction[]): LintIssue[] {
    const issues: LintIssue[] = []
    const supportSet = new Set(support.map(s => s.wuxing))
    for (const o of oppose) {
      if (supportSet.has(o.wuxing)) {
        issues.push({
          rule: ruleId,
          severity: 'error',
          message: '五行同时出现在 support 和 oppose 中',
          field: o.wuxing,
          suggestion: `五行 ${o.wuxing} 既支持又反对，逻辑矛盾，请移除其一`,
        })
      }
    }
    return issues
  }

  /**
   * 检查 9：循环依赖（需要全部规则）
   * - 规则 A 依赖 B，B 依赖 A → error
   * 返回 Map<ruleId, LintIssue[]>，便于批量检查时归属
   */
  checkCircularDependency(rules: RuleDSLDefinition[]): Map<string, LintIssue[]> {
    const result = new Map<string, LintIssue[]>()
    // 仅在当前批次内构建依赖图（外部依赖不参与环检测）
    const idSet = new Set(rules.map(r => r.id))
    const graph = new Map<string, string[]>()
    for (const r of rules) {
      graph.set(r.id, (r.dependencies ?? []).filter(d => idSet.has(d)))
    }

    const WHITE = 0, GRAY = 1, BLACK = 2
    const color = new Map<string, number>()
    for (const id of graph.keys()) color.set(id, WHITE)
    const inCycle = new Set<string>()
    const path: string[] = []

    const dfs = (u: string): void => {
      color.set(u, GRAY)
      path.push(u)
      for (const v of graph.get(u) ?? []) {
        if (!color.has(v)) continue
        const cv = color.get(v)!
        if (cv === GRAY) {
          // 发现环：从 v 到 u 的路径均在环上
          const idx = path.indexOf(v)
          for (let i = idx; i < path.length; i++) inCycle.add(path[i])
        } else if (cv === WHITE) {
          dfs(v)
        }
      }
      path.pop()
      color.set(u, BLACK)
    }

    for (const id of graph.keys()) {
      if (color.get(id) === WHITE) dfs(id)
    }

    for (const id of inCycle) {
      const issue: LintIssue = {
        rule: id,
        severity: 'error',
        message: '循环依赖：规则间存在依赖环',
        suggestion: '请打破依赖环（移除或调整 dependencies）',
      }
      if (!result.has(id)) result.set(id, [])
      result.get(id)!.push(issue)
    }
    return result
  }

  /**
   * 检查 10：不可达动作
   * - support/oppose 中 score === 0 → warning "五行动作分值为0，不会产生效果"
   */
  checkUnreachableAction(ruleId: string, support: LintWuxingAction[], oppose: LintWuxingAction[]): LintIssue[] {
    const issues: LintIssue[] = []
    for (const a of support) {
      if (a.score === 0) {
        issues.push({
          rule: ruleId,
          severity: 'warning',
          message: '五行动作分值为0，不会产生效果',
          field: a.wuxing,
          suggestion: `support 中 ${a.wuxing} score=0，建议设置非零分值或移除`,
        })
      }
    }
    for (const a of oppose) {
      if (a.score === 0) {
        issues.push({
          rule: ruleId,
          severity: 'warning',
          message: '五行动作分值为0，不会产生效果',
          field: a.wuxing,
          suggestion: `oppose 中 ${a.wuxing} score=0，建议设置非零分值或移除`,
        })
      }
    }
    return issues
  }

  // ---------- 内部聚合：单规则 lint ----------

  /** 对规范化后的单规则结构执行所有单规则检查，聚合为报告 */
  private lintNormalized(
    ruleId: string,
    group: LintConditionGroup,
    support: LintWuxingAction[],
    oppose: LintWuxingAction[],
  ): LintReport {
    const issues: LintIssue[] = []
    issues.push(...this.checkDuplicateConditions(ruleId, group))
    issues.push(...this.checkAlwaysTrue(ruleId, group))
    issues.push(...this.checkAlwaysFalse(ruleId, group))
    issues.push(...this.checkConflictingConditions(ruleId, group))
    issues.push(...this.checkInvalidOperator(ruleId, group))
    issues.push(...this.checkEmptyGroup(ruleId, group))
    issues.push(...this.checkMissingWeight(ruleId, group))
    issues.push(...this.checkWuxingConflict(ruleId, support, oppose))
    issues.push(...this.checkUnreachableAction(ruleId, support, oppose))

    return this.buildReport(ruleId, issues)
  }

  /** 由问题列表构建报告（统计 error/warning/info 数量与 passed） */
  private buildReport(ruleId: string, issues: LintIssue[]): LintReport {
    let errorCount = 0
    let warningCount = 0
    let infoCount = 0
    for (const i of issues) {
      if (i.severity === 'error') errorCount++
      else if (i.severity === 'warning') warningCount++
      else infoCount++
    }
    return {
      ruleId,
      issues,
      errorCount,
      warningCount,
      infoCount,
      passed: errorCount === 0,
    }
  }

  // ---------- 公共入口 ----------

  /** 对单条 DSL 规则进行 lint */
  lint(dsl: RuleDSLDefinition): LintReport {
    const ruleId = dsl?.id ?? '<unknown>'
    const group = dslGroupToLint(dsl.conditions)
    const support = dslActionsToLint(dsl.support)
    const oppose = dslActionsToLint(dsl.oppose)
    return this.lintNormalized(ruleId, group, support, oppose)
  }

  /** 对 AST 根节点进行 lint */
  lintAST(ast: RuleASTNode): LintReport {
    const ruleId = ast?.id ?? '<unknown>'
    const group = astGroupToLint(ast.conditions)
    const support = astActionsToLint(ast.support)
    const oppose = astActionsToLint(ast.oppose)
    return this.lintNormalized(ruleId, group, support, oppose)
  }

  /**
   * 批量 lint：对每条规则执行单规则 lint，并补充跨规则检查
   * - 循环依赖（checkCircularDependency）
   * - 重复规则 ID
   */
  lintBatch(rules: RuleDSLDefinition[]): LintReport[] {
    // 1. 单规则 lint
    const reports = rules.map(r => this.lint(r))
    const reportById = new Map<string, LintReport>()
    // 注意：可能存在重复 ID，使用第一个遇到的 report 作为归属目标
    for (const rep of reports) {
      if (!reportById.has(rep.ruleId)) reportById.set(rep.ruleId, rep)
    }

    // 2. 重复规则 ID 检查
    const idCounts = new Map<string, number>()
    for (const r of rules) idCounts.set(r.id, (idCounts.get(r.id) ?? 0) + 1)
    for (const [id, count] of idCounts) {
      if (count > 1) {
        const rep = reportById.get(id)
        if (rep) {
          rep.issues.push({
            rule: id,
            severity: 'error',
            message: `重复规则 ID：${id} 出现 ${count} 次`,
            suggestion: '规则 ID 必须全局唯一，请重命名冲突规则',
          })
        }
      }
    }

    // 3. 循环依赖检查
    const cycleIssues = this.checkCircularDependency(rules)
    for (const [id, issues] of cycleIssues) {
      const rep = reportById.get(id)
      if (rep) rep.issues.push(...issues)
    }

    // 4. 重新统计各 report
    for (const rep of reports) {
      const rebuilt = this.buildReport(rep.ruleId, rep.issues)
      rep.errorCount = rebuilt.errorCount
      rep.warningCount = rebuilt.warningCount
      rep.infoCount = rebuilt.infoCount
      rep.passed = rebuilt.passed
    }

    return reports
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局 DSL Linter 单例 */
export const globalDSLLinter = new DSLLinter()
