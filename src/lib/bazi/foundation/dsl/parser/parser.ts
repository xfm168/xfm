/**
 * RuleDSL Parser（Pipeline 第一阶段）
 *
 * 将声明式 RuleDSLDefinition（JSON/YAML-like 数据）解析为抽象语法树（AST）。
 *
 * 职责：
 *   - 接收 RuleDSLDefinition 声明式数据
 *   - 校验基本结构（id / name / version 必填）
 *   - 构建完整的 RuleASTNode 及其所有子节点
 *   - 跟踪源码位置（JSON 输入时为 0,0）
 *   - 解析失败时抛出 DSLError
 *
 * Pipeline：DSL 数据 → [Parser] → AST → [Validator] → [Compiler] → CompiledRule → [Runtime]
 */

import type {
  RuleDSLDefinition,
  DSLConditionGroup,
  DSLCondition,
  DSLWuxingAction,
} from '../../types'
import { DSLError } from '../../shared/errors'
import {
  ASTNodeType,
  type ASTLocation,
  type RuleASTNode,
  type ConditionASTNode,
  type ConditionGroupASTNode,
  type WuxingActionASTNode,
  type ClassicRefASTNode,
  type ConfidenceASTNode,
  createRuleNode,
  createConditionNode,
  createConditionGroupNode,
  createWuxingActionNode,
  createClassicRefNode,
  createConfidenceNode,
} from '../ast'

/** JSON 输入的默认源码位置（无行号信息） */
const DEFAULT_LOCATION: ASTLocation = { line: 0, column: 0 }

/**
 * 判断一个条件组成员是嵌套条件组还是单个条件
 *
 * 条件组拥有 `logic` 与 `conditions` 字段，单个条件拥有 `field` / `operator` 字段。
 */
function isConditionGroup(node: DSLCondition | DSLConditionGroup): node is DSLConditionGroup {
  return typeof (node as DSLConditionGroup).logic === 'string'
    && Array.isArray((node as DSLConditionGroup).conditions)
}

/**
 * 解析条件组：DSLConditionGroup → ConditionGroupASTNode
 *
 * 递归处理嵌套条件组。
 *
 * @param group DSL 条件组
 * @returns 条件组 AST 节点
 */
export function parseConditions(group: DSLConditionGroup): ConditionGroupASTNode {
  if (!group) {
    throw new DSLError('条件组（conditions）为空', { module: 'parser', code: 'FND-DSL-PARSE-001' })
  }

  const logic: 'and' | 'or' = group.logic === 'or' ? 'or' : 'and'

  if (!Array.isArray(group.conditions)) {
    throw new DSLError('条件组 conditions 必须是数组', { module: 'parser', code: 'FND-DSL-PARSE-002' })
  }

  const conditions = group.conditions.map((c) => {
    if (isConditionGroup(c)) {
      // 嵌套条件组：递归解析
      return parseConditions(c)
    }
    // 单个条件
    const cond = c as DSLCondition
    if (!cond.field) {
      throw new DSLError('条件缺少 field', { module: 'parser', code: 'FND-DSL-PARSE-003' })
    }
    if (!cond.operator) {
      throw new DSLError(`条件 (${cond.field}) 缺少 operator`, { module: 'parser', code: 'FND-DSL-PARSE-004' })
    }
    return createConditionNode(cond.field, cond.operator, cond.value, cond.description)
  })

  const node = createConditionGroupNode(logic, conditions)
  node.location = DEFAULT_LOCATION
  return node
}

/**
 * 解析五行动作列表：DSLWuxingAction[] → WuxingActionASTNode[]
 *
 * @param actions DSL 五行动作列表
 * @returns 五行动作 AST 节点列表
 */
export function parseWuxingActions(actions: DSLWuxingAction[] | undefined): WuxingActionASTNode[] {
  if (!actions || !Array.isArray(actions)) return []
  return actions.map((a) => {
    if (!a.wuxing) {
      throw new DSLError('五行动作缺少 wuxing', { module: 'parser', code: 'FND-DSL-PARSE-005' })
    }
    if (typeof a.score !== 'number') {
      throw new DSLError(`五行动作 (${a.wuxing}) 缺少数值型 score`, { module: 'parser', code: 'FND-DSL-PARSE-006' })
    }
    const node = createWuxingActionNode(a.wuxing, a.score, a.reason)
    node.location = DEFAULT_LOCATION
    return node
  })
}

/**
 * 解析古籍引用列表：RuleDSLDefinition['classicEvidence'] → ClassicRefASTNode[]
 *
 * @param refs DSL 古籍引用列表
 * @returns 古籍引用 AST 节点列表
 */
export function parseClassicRefs(refs: RuleDSLDefinition['classicEvidence']): ClassicRefASTNode[] {
  if (!refs || !Array.isArray(refs)) return []
  return refs.map((r) => {
    if (!r.classicName) {
      throw new DSLError('古籍引用缺少 classicName', { module: 'parser', code: 'FND-DSL-PARSE-007' })
    }
    if (!r.quotedText) {
      throw new DSLError(`古籍引用 (${r.classicName}) 缺少 quotedText`, { module: 'parser', code: 'FND-DSL-PARSE-008' })
    }
    const node = createClassicRefNode(r.classicName, r.quotedText, r.supports ?? '', r.chapter)
    node.location = DEFAULT_LOCATION
    return node
  })
}

/**
 * 解析置信度声明
 *
 * @param confidence DSL 置信度配置
 * @returns 置信度 AST 节点（无配置时返回 undefined）
 */
function parseConfidence(confidence: RuleDSLDefinition['confidence']): ConfidenceASTNode | undefined {
  if (!confidence) return undefined
  const node = createConfidenceNode(confidence.components ?? {}, confidence.note)
  node.location = DEFAULT_LOCATION
  return node
}

/**
 * 解析 RuleDSLDefinition 为 RuleASTNode（Pipeline 主入口）
 *
 * @param dsl 声明式 DSL 定义
 * @returns 规则 AST 根节点
 * @throws DSLError 当基本结构缺失或解析失败时
 */
export function parse(dsl: RuleDSLDefinition): RuleASTNode {
  // 基本结构校验
  if (!dsl || typeof dsl !== 'object') {
    throw new DSLError('DSL 定义为空或非对象', { module: 'parser', code: 'FND-DSL-PARSE-000' })
  }
  if (!dsl.id) {
    throw new DSLError('缺少规则 id', { module: 'parser', code: 'FND-DSL-PARSE-010' })
  }
  if (!dsl.name) {
    throw new DSLError(`规则 (${dsl.id}) 缺少 name`, { module: 'parser', code: 'FND-DSL-PARSE-011' })
  }
  if (!dsl.version) {
    throw new DSLError(`规则 (${dsl.id}) 缺少 version`, { module: 'parser', code: 'FND-DSL-PARSE-012' })
  }

  const location = DEFAULT_LOCATION

  // 解析各子节点
  const conditions = parseConditions(dsl.conditions)
  const support = parseWuxingActions(dsl.support)
  const oppose = parseWuxingActions(dsl.oppose)
  const classicEvidence = parseClassicRefs(dsl.classicEvidence)
  const confidence = parseConfidence(dsl.confidence)

  // 构建规则根节点
  const ruleNode = createRuleNode({
    id: dsl.id,
    name: dsl.name,
    version: dsl.version,
    source: Array.isArray(dsl.source) ? dsl.source : [],
    priority: typeof dsl.priority === 'number' ? dsl.priority : 0,
    category: dsl.category ?? 'general',
    description: dsl.description ?? '',
    conditions,
    support,
    oppose,
    result: dsl.result ?? '',
    confidence,
    dependencies: Array.isArray(dsl.dependencies) ? dsl.dependencies : [],
    conflictStrategy: dsl.conflictStrategy,
    classicEvidence,
    tags: dsl.tags,
    author: dsl.author,
    reviewer: dsl.reviewer,
    location,
    raw: JSON.stringify(dsl),
  })

  return ruleNode
}
