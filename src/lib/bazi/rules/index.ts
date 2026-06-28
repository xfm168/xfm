/**
 * 命理规则引擎
 * 导出所有规则模块
 */

// 引擎核心
export { executeRules, createRule } from './engine'
export type { BaseRule, RuleContext, RuleResult, RuleMatchResult, RuleEngineOptions } from './engine'

// 格局规则
export {
  GEJU_RULES,
  determineGeJu,
  buildGeJuContext,
  type GeJuContext,
  type GeJuResult,
  type GeJuName,
  type GeJuCategory,
} from './gejuRules'

// 喜用神规则
export {
  XIYONG_RULES,
  determineXiYongShen,
  type XiYongContext,
  type XiYongResult,
} from './xiyongRules'

// 旺衰规则
export {
  WUXING_RULES,
  calculateStrengthV2,
  type WuXingContext,
  type StrengthResult,
  type StrengthBreakdown,
} from './wuxingRules'

// 十二长生规则
export {
  CHANGSHENG_RULES,
  CHANG_SHENG_NAMES,
  calcChangShengByRules,
  getChangShengStartZhi,
  getChangShengNames,
  type ChangShengContext,
  type ChangShengRule,
  type ChangShengRuleResult,
} from './changshengRules'

// 十神规则
export {
  SHISHEN_RULES,
  calculateShenShi,
  applyShiShenRules,
  getAllShenShi,
  type ShenShiContext,
  type ShenShiRule,
} from './shishenRules'

// 六亲规则
export {
  LIUQIN_MAPPINGS,
  LIUQIN_RULES,
  getLiuQin,
  type LiuQinContext,
  type LiuQinMapping,
  type LiuQinRule,
} from './liuqinRules'

// 大运规则
export {
  DAYUN_RULES,
  calcDaYunStart,
  generateDaYun,
  getLiuNian,
  getLiuYue,
  type DaYunStep,
  type QiYunResult,
  type DaYunRuleContext,
  type DaYunRuleResult,
  type DaYunRule,
} from './dashunRules'
