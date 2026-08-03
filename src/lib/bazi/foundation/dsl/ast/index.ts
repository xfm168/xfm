/**
 * RuleDSL AST 模块入口
 *
 * 统一导出 AST 类型定义与节点工厂函数。
 */

// 类型定义
export {
  ASTNodeType,
  type ASTNode,
  type ASTLocation,
  type RuleASTNode,
  type ConditionASTNode,
  type ConditionGroupASTNode,
  type WuxingActionASTNode,
  type ClassicRefASTNode,
  type ConfidenceASTNode,
  type MetadataASTNode,
  type ASTValidationResult,
  type ASTValidationError,
} from './types'

// 节点工厂函数
export {
  createRuleNode,
  createConditionNode,
  createConditionGroupNode,
  createWuxingActionNode,
  createClassicRefNode,
  createConfidenceNode,
} from './nodes'

// 调试与工具函数
export { astNodeToString, deepCloneAST } from './nodes'
