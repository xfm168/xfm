/**
 * DSL Formatter（规范格式化器）
 *
 * 对 DSL 定义和 AST 进行规范化输出：
 *   - 条件按 field 排序（组内递归排序）
 *   - support/oppose 数组按五行→分数降序排序
 *   - classicEvidence 按 classicName → chapter 排序
 *   - dependencies / tags 按字母排序
 *   - 数组去重（同五行重复条目合并求和）
 *   - 操作符归一化：'eq'→'==', 'gte'→'>=', 'lte'→'<=', 'lt'→'<', 'gt'→'>', 'ne'→'!='
 *   - 自动生成缺失的 description 字段
 *
 * 提供 JSON / YAML 两种序列化格式。
 */

import type {
  RuleDSLDefinition,
  DSLCondition,
  DSLConditionGroup,
  DSLConditionOperator,
  DSLWuxingAction,
} from '../../types'
import {
  ASTNodeType,
  type RuleASTNode,
  type ConditionGroupASTNode,
  type ConditionASTNode,
  type WuxingActionASTNode,
  type ClassicRefASTNode,
} from '../ast'

/** 操作符归一化映射 */
const OPERATOR_NORMALIZE_MAP: Record<string, DSLConditionOperator> = {
  eq: '==',
  gte: '>=',
  lte: '<=',
  lt: '<',
  gt: '>',
  ne: '!=',
}

/** 五行排序顺序 */
const WUXING_ORDER = ['金', '木', '水', '火', '土']

/**
 * 判断是否为条件组（DSLConditionGroup）
 */
function isConditionGroup(item: DSLCondition | DSLConditionGroup): item is DSLConditionGroup {
  return 'logic' in item && 'conditions' in item
}

/**
 * 归一化操作符
 */
function normalizeOperator(op: string): DSLConditionOperator {
  if (OPERATOR_NORMALIZE_MAP[op]) {
    return OPERATOR_NORMALIZE_MAP[op]
  }
  return op as DSLConditionOperator
}

/**
 * 为单个条件自动生成 description（若缺失）
 */
function autoConditionDescription(cond: DSLCondition): string {
  const opText: Record<string, string> = {
    '>=': '大于等于',
    '<=': '小于等于',
    '>': '大于',
    '<': '小于',
    '==': '等于',
    '!=': '不等于',
    in: '属于',
    not_in: '不属于',
    contains: '包含',
    not_contains: '不包含',
    and: '且',
    or: '或',
    not: '非',
  }
  const valueStr = Array.isArray(cond.value)
    ? `[${cond.value.join(', ')}]`
    : typeof cond.value === 'string'
      ? `"${cond.value}"`
      : String(cond.value)
  return `${cond.field} ${opText[cond.operator] ?? cond.operator} ${valueStr}`
}

/**
 * 合并五行数组：相同五行的条目分数求和，原因合并
 */
function mergeWuxingActions(actions: DSLWuxingAction[] | undefined): DSLWuxingAction[] {
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
 * 五行排序比较：先按五行顺序，再按分数降序
 */
function compareWuxingAction(a: DSLWuxingAction, b: DSLWuxingAction): number {
  const ai = WUXING_ORDER.indexOf(a.wuxing)
  const bi = WUXING_ORDER.indexOf(b.wuxing)
  if (ai !== bi) {
    const aIdx = ai === -1 ? 99 : ai
    const bIdx = bi === -1 ? 99 : bi
    return aIdx - bIdx
  }
  return b.score - a.score
}

/**
 * 古籍引用排序比较：classicName → chapter
 */
function compareClassicRef(
  a: { classicName: string; chapter?: string },
  b: { classicName: string; chapter?: string },
): number {
  if (a.classicName !== b.classicName) {
    return a.classicName.localeCompare(b.classicName, 'zh-CN')
  }
  const ac = a.chapter ?? ''
  const bc = b.chapter ?? ''
  return ac.localeCompare(bc, 'zh-CN')
}

/**
 * DSL Formatter 类
 */
export class DSLFormatter {
  /**
   * 递归排序条件组内的子条件（按 field 排序；组优先按组内第一个条件的 field）
   */
  formatConditions(group: DSLConditionGroup): DSLConditionGroup {
    const processedConditions = group.conditions
      .map((item) => {
        if (isConditionGroup(item)) {
          return this.formatConditions(item)
        }
        const op = normalizeOperator(item.operator)
        const desc = item.description ?? autoConditionDescription({ ...item, operator: op })
        return { ...item, operator: op, description: desc }
      })
      .sort((a, b) => {
        const aField = isConditionGroup(a)
          ? (a.conditions[0] && !isConditionGroup(a.conditions[0]) ? a.conditions[0].field : '')
          : a.field
        const bField = isConditionGroup(b)
          ? (b.conditions[0] && !isConditionGroup(b.conditions[0]) ? b.conditions[0].field : '')
          : b.field
        return aField.localeCompare(bField)
      })

    return {
      logic: group.logic,
      conditions: processedConditions,
    }
  }

  /**
   * 格式化 DSL：返回规范化后的 DSL 定义（新对象，不修改原输入）
   */
  formatDSL(dsl: RuleDSLDefinition): RuleDSLDefinition {
    const supportMerged = mergeWuxingActions(dsl.support).sort(compareWuxingAction)
    const opposeMerged = mergeWuxingActions(dsl.oppose).sort(compareWuxingAction)

    const classicEvidence = (dsl.classicEvidence ?? []).slice().sort(compareClassicRef)

    const dependencies = (dsl.dependencies ?? []).slice().sort((a, b) => a.localeCompare(b))

    const tags = [...new Set(dsl.tags ?? [])].sort((a, b) => a.localeCompare(b, 'zh-CN'))

    const conditions = this.formatConditions(dsl.conditions)

    return {
      ...dsl,
      conditions,
      support: supportMerged.length > 0 ? supportMerged : undefined,
      oppose: opposeMerged.length > 0 ? opposeMerged : undefined,
      classicEvidence: classicEvidence.length > 0 ? classicEvidence : undefined,
      dependencies: dependencies.length > 0 ? dependencies : undefined,
      tags: tags.length > 0 ? tags : undefined,
      description: dsl.description && dsl.description.length > 0 ? dsl.description : `${dsl.name}（${dsl.id}）`,
    }
  }

  /**
   * 排序 AST 中的 children（conditions、support、oppose、classicEvidence）
   */
  formatAST(ast: RuleASTNode): RuleASTNode {
    const sortConditions = (
      group: ConditionGroupASTNode,
    ): ConditionGroupASTNode => {
      const processed = group.conditions
        .map((c) => {
          if (c.type === ASTNodeType.ConditionGroup) {
            return sortConditions(c as ConditionGroupASTNode)
          }
          const cond = c as ConditionASTNode
          const op = normalizeOperator(cond.operator)
          const desc = cond.description ?? autoConditionDescription({
            field: cond.field,
            operator: op,
            value: cond.value,
          })
          return { ...cond, operator: op, description: desc }
        })
        .sort((a, b) => {
          const aField = a.type === ASTNodeType.ConditionGroup
            ? ((a as ConditionGroupASTNode).conditions[0]?.type === ASTNodeType.Condition
              ? ((a as ConditionGroupASTNode).conditions[0] as ConditionASTNode).field
              : '')
            : (a as ConditionASTNode).field
          const bField = b.type === ASTNodeType.ConditionGroup
            ? ((b as ConditionGroupASTNode).conditions[0]?.type === ASTNodeType.Condition
              ? ((b as ConditionGroupASTNode).conditions[0] as ConditionASTNode).field
              : '')
            : (b as ConditionASTNode).field
          return aField.localeCompare(bField)
        })
      return { ...group, conditions: processed }
    }

    const compareWuxingAST = (a: WuxingActionASTNode, b: WuxingActionASTNode): number => {
      const ai = WUXING_ORDER.indexOf(a.wuxing)
      const bi = WUXING_ORDER.indexOf(b.wuxing)
      if (ai !== bi) {
        const aIdx = ai === -1 ? 99 : ai
        const bIdx = bi === -1 ? 99 : bi
        return aIdx - bIdx
      }
      return b.score - a.score
    }

    const compareClassicAST = (a: ClassicRefASTNode, b: ClassicRefASTNode): number => {
      return compareClassicRef(a, b)
    }

    const support = (ast.support ?? []).slice().sort(compareWuxingAST)
    const oppose = (ast.oppose ?? []).slice().sort(compareWuxingAST)
    const classicEvidence = (ast.classicEvidence ?? []).slice().sort(compareClassicAST)
    const dependencies = (ast.dependencies ?? []).slice().sort((a, b) => a.localeCompare(b))
    const tags = ast.tags ? [...new Set(ast.tags)].sort((a, b) => a.localeCompare(b, 'zh-CN')) : undefined

    return {
      ...ast,
      conditions: sortConditions(ast.conditions),
      support,
      oppose,
      classicEvidence,
      dependencies,
      tags,
      description: ast.description && ast.description.length > 0 ? ast.description : `${ast.name}（${ast.id}）`,
    }
  }

  /**
   * 格式化为美观的 JSON 字符串
   */
  toPrettyJSON(dsl: RuleDSLDefinition, indent = 2): string {
    return JSON.stringify(this.formatDSL(dsl), null, indent)
  }

  /**
   * 简单 YAML 风格输出（2 空格缩进，数组以 "- " 开头）
   */
  toYAML(dsl: RuleDSLDefinition): string {
    const formatted = this.formatDSL(dsl)
    const lines: string[] = []

    const emit = (key: string, value: any, depth: number) => {
      const pad = '  '.repeat(depth)
      if (value === null || value === undefined) {
        lines.push(`${pad}${key}: null`)
        return
      }
      if (typeof value === 'string') {
        const needsQuote = /[:\n#&*!|>'"%@`\[\],?]/.test(value) || value === ''
        lines.push(`${pad}${key}: ${needsQuote ? `"${value.replace(/"/g, '\\"')}"` : value}`)
        return
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        lines.push(`${pad}${key}: ${value}`)
        return
      }
      if (Array.isArray(value)) {
        if (value.length === 0) {
          lines.push(`${pad}${key}: []`)
          return
        }
        lines.push(`${pad}${key}:`)
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            const firstKey = Object.keys(item)[0] as keyof typeof item
            const rest: any = { ...item }
            delete rest[firstKey]
            lines.push(`${pad}  - ${firstKey}: ${this._yamlScalar(item[firstKey])}`)
            for (const k of Object.keys(rest)) {
              emit(k as string, rest[k], depth + 2)
            }
          } else {
            lines.push(`${pad}  - ${this._yamlScalar(item)}`)
          }
        }
        return
      }
      if (typeof value === 'object') {
        lines.push(`${pad}${key}:`)
        for (const k of Object.keys(value)) {
          emit(k, (value as any)[k], depth + 1)
        }
      }
    }

    for (const k of Object.keys(formatted)) {
      emit(k, (formatted as any)[k], 0)
    }
    return lines.join('\n')
  }

  /** YAML 标量字符串化（内部辅助） */
  _yamlScalar(v: any): string {
    if (v === null || v === undefined) return 'null'
    if (typeof v === 'string') {
      const needsQuote = /[:\n#&*!|>'"%@`\[\],?]/.test(v) || v === ''
      return needsQuote ? `"${v.replace(/"/g, '\\"')}"` : v
    }
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
    return JSON.stringify(v)
  }
}

/** 全局 DSL Formatter 单例 */
export const globalDSLFormatter = new DSLFormatter()
