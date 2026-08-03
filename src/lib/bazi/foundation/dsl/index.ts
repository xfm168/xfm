/**
 * P0-5 Part 1: RuleDSL 入口
 *
 * 声明式规则描述语言：让规则脱离代码，成为可管理、可审计、可迭代的数据资产
 *
 * 完整 Pipeline：AST → Parser → Validator → Compiler → Runtime
 *
 *   DSL 数据
 *     │
 *     ▼  parse()
 *   AST 节点
 *     │
 *     ▼  validate()
 *   校验结果
 *     │
 *     ▼  compile()
 *   CompiledRule（含 evaluate 闭包）
 *     │
 *     ▼  load() / execute()
 *   执行结果（CompiledRuleResult + trace）
 */

// ============================================================
// 新版 Pipeline：AST → Parser → Validator → Compiler → Runtime
// ============================================================
export * from './ast'
export * from './parser/parser'
export * from './validator/validator'
export * from './compiler/compiler'
export * from './runtime/runtime'

// ============================================================
// 向后兼容：旧版 parser（parseDSLRule / serializeToDSL / loadDSLRules /
//           validateDSLRule / evaluateConditionGroup）
// ============================================================
export {
  evaluateConditionGroup,
  parseDSLRule,
  serializeToDSL,
  loadDSLRules,
  validateDSLRule,
} from './parser'

// ============================================================
// 统一类型导出
// ============================================================
export type {
  DSLConditionOperator,
  DSLCondition,
  DSLConditionGroup,
  DSLWuxingAction,
  RuleDSLDefinition,
} from '../types'
export type { RuleDefinition } from '../../ruleEngine/types'
