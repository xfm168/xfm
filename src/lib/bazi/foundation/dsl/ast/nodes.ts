/**
 * RuleDSL 语言 AST 节点工厂函数
 *
 * 提供创建各类 AST 节点的便捷工厂方法，统一默认值与类型标记。
 * 同时提供调试用的 pretty-print 与深拷贝工具函数。
 */

import {
  ASTNodeType,
  type ASTNode,
  type ASTLocation,
  type RuleASTNode,
  type ConditionASTNode,
  type ConditionGroupASTNode,
  type WuxingActionASTNode,
  type ClassicRefASTNode,
  type ConfidenceASTNode,
} from './types'
import type { DSLConditionOperator } from '../../types'

/** JSON 输入的默认源码位置（无行号信息） */
const DEFAULT_LOCATION: ASTLocation = { line: 0, column: 0 }

/**
 * 创建规则 AST 根节点
 *
 * @param partial 部分字段，未提供的字段使用默认值
 */
export function createRuleNode(partial: Partial<RuleASTNode>): RuleASTNode {
  return {
    type: ASTNodeType.Rule,
    id: partial.id ?? '',
    name: partial.name ?? '',
    version: partial.version ?? '0.0.0',
    source: partial.source ?? [],
    priority: partial.priority ?? 0,
    category: partial.category ?? 'general',
    description: partial.description ?? '',
    conditions: partial.conditions ?? createConditionGroupNode('and', []),
    support: partial.support ?? [],
    oppose: partial.oppose ?? [],
    result: partial.result ?? '',
    confidence: partial.confidence,
    dependencies: partial.dependencies ?? [],
    conflictStrategy: partial.conflictStrategy,
    classicEvidence: partial.classicEvidence ?? [],
    tags: partial.tags,
    author: partial.author,
    reviewer: partial.reviewer,
    location: partial.location ?? DEFAULT_LOCATION,
    raw: partial.raw,
  }
}

/**
 * 创建单个条件 AST 节点
 *
 * @param field 字段路径
 * @param operator 操作符
 * @param value 比较值
 * @param description 自然语言描述（可选）
 */
export function createConditionNode(
  field: string,
  operator: DSLConditionOperator,
  value: any,
  description?: string,
): ConditionASTNode {
  return {
    type: ASTNodeType.Condition,
    field,
    operator,
    value,
    description,
    location: DEFAULT_LOCATION,
  }
}

/**
 * 创建条件组 AST 节点
 *
 * @param logic 组合方式（'and' | 'or'）
 * @param conditions 子条件列表
 */
export function createConditionGroupNode(
  logic: 'and' | 'or',
  conditions: Array<ConditionASTNode | ConditionGroupASTNode>,
): ConditionGroupASTNode {
  return {
    type: ASTNodeType.ConditionGroup,
    logic,
    conditions,
    location: DEFAULT_LOCATION,
  }
}

/**
 * 创建五行动作 AST 节点
 *
 * @param wuxing 五行（金木水火土）
 * @param score 权重/分数
 * @param reason 原因说明（可选）
 */
export function createWuxingActionNode(
  wuxing: string,
  score: number,
  reason?: string,
): WuxingActionASTNode {
  return {
    type: ASTNodeType.WuxingAction,
    wuxing,
    score,
    reason,
    location: DEFAULT_LOCATION,
  }
}

/**
 * 创建古籍引用 AST 节点
 *
 * @param classicName 古籍名称
 * @param quotedText 引用原文
 * @param supports 支持的结论
 * @param chapter 章节标题（可选）
 */
export function createClassicRefNode(
  classicName: string,
  quotedText: string,
  supports: string,
  chapter?: string,
): ClassicRefASTNode {
  return {
    type: ASTNodeType.ClassicRef,
    classicName,
    quotedText,
    supports,
    chapter,
    location: DEFAULT_LOCATION,
  }
}

/**
 * 创建置信度声明 AST 节点
 *
 * @param components 各维度权重
 * @param note 备注（可选）
 */
export function createConfidenceNode(
  components: Record<string, number>,
  note?: string,
): ConfidenceASTNode {
  return {
    type: ASTNodeType.ConfidenceDecl,
    components,
    note,
    location: DEFAULT_LOCATION,
  }
}

// ============================================================
// 调试与工具函数
// ============================================================

/**
 * 将 AST 节点格式化为可读字符串（用于调试）
 *
 * 使用 JSON 序列化并处理循环引用，保证打印安全。
 *
 * @param node AST 节点
 * @returns 缩进格式化的字符串
 */
export function astNodeToString(node: ASTNode): string {
  const seen = new WeakSet<object>()
  const replacer = (_key: string, value: any): any => {
    if (value !== null && typeof value === 'object') {
      if (seen.has(value)) return '[Circular]'
      seen.add(value)
    }
    return value
  }
  try {
    return JSON.stringify(node, replacer, 2)
  } catch {
    return String(node)
  }
}

/**
 * 深拷贝 AST 节点
 *
 * 递归复制节点及其所有子节点，返回完全独立的副本。
 * AST 节点为纯数据结构，不含函数引用，深拷贝安全。
 *
 * @param node AST 节点
 * @returns 深拷贝后的节点
 */
export function deepCloneAST<T extends ASTNode>(node: T): T {
  if (node === null || typeof node !== 'object') return node

  // 数组：逐项深拷贝
  if (Array.isArray(node)) {
    return node.map((item) => deepCloneAST(item as ASTNode) as ASTNode) as unknown as T
  }

  // 普通对象：逐字段深拷贝
  const clone: Record<string, unknown> = {}
  for (const key of Object.keys(node as object)) {
    const val = (node as Record<string, unknown>)[key]
    clone[key] = val !== null && typeof val === 'object' ? deepCloneAST(val as ASTNode) : val
  }
  return clone as T
}
