/**
 * P0-5 Part 1: RuleDSL 入口
 *
 * 声明式规则描述语言：让规则脱离代码，成为可管理、可审计、可迭代的数据资产
 */

export type {
  DSLConditionOperator,
  DSLCondition,
  DSLConditionGroup,
  DSLWuxingAction,
  RuleDSLDefinition,
} from '../types'

export {
  evaluateConditionGroup,
  parseDSLRule,
  serializeToDSL,
  loadDSLRules,
  validateDSLRule,
} from './parser'

export type { RuleDefinition } from '../../ruleEngine/types'
