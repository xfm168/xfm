/**
 * Rule Pack - 规则包
 * V4.8.1 Baseline
 *
 * 将一个模块的全部 Rule Meta 打包，统一版本、统一生命周期。
 * 每个 Rule Pack 对应一个交付模块（如 P0-① 节气精确到时分秒）。
 */

import type { RuleMeta } from '../rules/meta'

export interface RulePack {
  /** 包ID，如 PACK-P0-01 */
  id: string
  /** 模块标识，如 P0-① */
  module: string
  /** 包名称 */
  name: string
  /** 包版本 */
  version: string
  /** 基线 */
  baseline: string
  /** 包含的规则元数据 */
  rules: RuleMeta[]
  /** 全部规则是否已冻结(Stable) */
  allFrozen: boolean
}

/** 创建规则包 */
export function createRulePack(params: {
  id: string
  module: string
  name: string
  version: string
  baseline: string
  rules: RuleMeta[]
}): RulePack {
  return {
    id: params.id,
    module: params.module,
    name: params.name,
    version: params.version,
    baseline: params.baseline,
    rules: params.rules,
    allFrozen: params.rules.every(r => r.frozen),
  }
}

/** 获取包内规则数量 */
export function getPackRuleCount(pack: RulePack): number {
  return pack.rules.length
}

/** 获取包内未冻结规则 */
export function getUnfrozenRules(pack: RulePack): RuleMeta[] {
  return pack.rules.filter(r => !r.frozen)
}
