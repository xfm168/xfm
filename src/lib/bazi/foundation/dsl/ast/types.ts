/**
 * RuleDSL 语言 AST 类型定义
 *
 * 定义 RuleDSL 抽象语法树（Abstract Syntax Tree）的节点类型体系。
 * 这些类型是整个 DSL Pipeline（AST → Parser → Validator → Compiler → Runtime）的基础数据契约。
 *
 * 设计原则：
 *   - AST 是 DSL 的中间表示（IR），与具体源码格式（JSON/YAML）解耦
 *   - 每个节点携带 type 与可选 location（源码位置，便于错误定位）
 *   - 节点为纯数据结构，不含方法，便于序列化与深拷贝
 */

import type { DSLConditionOperator } from '../../types'

// ============================================================
// Part 1: AST 节点类型枚举
// ============================================================

/**
 * AST 节点类型枚举
 *
 * 每种节点类型对应 DSL 语言的一个语法结构。
 */
export enum ASTNodeType {
  /** 规则根节点 */
  Rule = 'Rule',
  /** 单个条件（field op value） */
  Condition = 'Condition',
  /** 条件组（AND/OR 组合，可嵌套） */
  ConditionGroup = 'ConditionGroup',
  /** 五行动作（支持/反对的五行打分） */
  WuxingAction = 'WuxingAction',
  /** 古籍引用 */
  ClassicRef = 'ClassicRef',
  /** 置信度声明 */
  ConfidenceDecl = 'ConfidenceDecl',
  /** 来源声明（source） */
  SourceDecl = 'SourceDecl',
  /** 元数据键值对（tags/author/reviewer 等） */
  Metadata = 'Metadata',
}

// ============================================================
// Part 2: AST 节点基类
// ============================================================

/** 源码位置信息（行号/列号，从 1 开始；JSON 输入时为 0,0） */
export interface ASTLocation {
  line: number
  column: number
}

/**
 * AST 节点基接口
 * 所有具体节点类型均继承此接口。
 */
export interface ASTNode {
  /** 节点类型 */
  type: ASTNodeType
  /** 源码位置（用于错误定位；JSON 输入时为 { line: 0, column: 0 }） */
  location?: ASTLocation
  /** 原始文本（调试用，可选） */
  raw?: string
}

// ============================================================
// Part 3: 具体节点接口
// ============================================================

/**
 * 规则 AST 根节点
 *
 * 对应一条完整的 RuleDSL 规则。
 */
export interface RuleASTNode extends ASTNode {
  type: ASTNodeType.Rule
  /** 规则 ID（全局唯一） */
  id: string
  /** 规则名称 */
  name: string
  /** 版本号（语义化） */
  version: string
  /** 来源古籍列表 */
  source: string[]
  /** 优先级（0-100） */
  priority: number
  /** 规则类别 */
  category: string
  /** 规则描述 */
  description: string
  /** 成立条件（条件组） */
  conditions: ConditionGroupASTNode
  /** 支持的五行（喜用） */
  support: WuxingActionASTNode[]
  /** 反对的五行（忌） */
  oppose: WuxingActionASTNode[]
  /** 结论说明 */
  result: string
  /** 置信度声明 */
  confidence?: ConfidenceASTNode
  /** 依赖的规则 ID 列表 */
  dependencies: string[]
  /** 冲突策略 */
  conflictStrategy?: string
  /** 古籍引用列表 */
  classicEvidence: ClassicRefASTNode[]
  /** 标签 */
  tags?: string[]
  /** 作者 */
  author?: string
  /** 审核人 */
  reviewer?: string
}

/**
 * 单个条件 AST 节点
 *
 * 形如：field operator value（如 dayStrength >= 2）
 */
export interface ConditionASTNode extends ASTNode {
  type: ASTNodeType.Condition
  /** 字段路径（如 'dayStrength' / 'count.木'） */
  field: string
  /** 操作符 */
  operator: DSLConditionOperator
  /** 比较值 */
  value: any
  /** 自然语言描述（UI 可读） */
  description?: string
}

/**
 * 条件组 AST 节点（AND/OR 组合，可嵌套）
 */
export interface ConditionGroupASTNode extends ASTNode {
  type: ASTNodeType.ConditionGroup
  /** 组合方式 */
  logic: 'and' | 'or'
  /** 子条件（可以是 ConditionASTNode 或嵌套 ConditionGroupASTNode） */
  conditions: Array<ConditionASTNode | ConditionGroupASTNode>
}

/**
 * 五行动作 AST 节点
 *
 * 表示对某五行的支持/反对打分。
 */
export interface WuxingActionASTNode extends ASTNode {
  type: ASTNodeType.WuxingAction
  /** 五行（金木水火土） */
  wuxing: string
  /** 权重/分数 */
  score: number
  /** 原因说明 */
  reason?: string
}

/**
 * 古籍引用 AST 节点
 *
 * 精确到句子级别的经典引用。
 */
export interface ClassicRefASTNode extends ASTNode {
  type: ASTNodeType.ClassicRef
  /** 古籍名称（如 '子平真诠'） */
  classicName: string
  /** 章节标题（可选） */
  chapter?: string
  /** 引用原文 */
  quotedText: string
  /** 该引用支持的结论 */
  supports: string
}

/**
 * 置信度声明 AST 节点
 *
 * 拆分多维度权重。
 */
export interface ConfidenceASTNode extends ASTNode {
  type: ASTNodeType.ConfidenceDecl
  /** 各维度权重（维度名 → 权重值） */
  components: Record<string, number>
  /** 备注 */
  note?: string
}

/**
 * 元数据 AST 节点（通用键值对）
 *
 * 用于 tags / author / reviewer 等附加信息。
 */
export interface MetadataASTNode extends ASTNode {
  type: ASTNodeType.Metadata
  /** 键名 */
  key: string
  /** 键值 */
  value: any
}

// ============================================================
// Part 4: AST 校验结果
// ============================================================

/**
 * AST 校验结果
 */
export interface ASTValidationResult {
  /** 是否通过 */
  valid: boolean
  /** 错误列表（为空表示通过） */
  errors: ASTValidationError[]
}

/**
 * AST 校验错误
 */
export interface ASTValidationError {
  /** 出错的节点类型 */
  nodeType: ASTNodeType
  /** 错误信息 */
  message: string
  /** 源码位置（可选） */
  location?: ASTLocation
}
