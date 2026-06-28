/**
 * 喜用神判断（规则引擎驱动）
 * 综合身强身弱、格局、调候、病药、扶抑、通关、寒暖燥湿
 *
 * 所有规则定义在 rules/xiyongRules.ts
 * 本文件仅负责流程编排和对外暴露接口
 */

import type { FiveElement, WuXingWangShuai } from './types'
import type { GeJuName } from './geju'
import {
  determineXiYongShen as runXiYongRules,
  type XiYongResult,
  type XiYongContext,
  XIYONG_RULES,
} from './rules/xiyongRules'

export type { XiYongResult, XiYongContext }
export { XIYONG_RULES }

export interface XiYongShenResult {
  bestElement: FiveElement  // 第一喜神
  usageElement?: FiveElement // 第一用神
  firstHappy: FiveElement   // 第一喜神
  secondHappy: FiveElement  // 第二喜神
  thirdHappy: FiveElement   // 第三喜神
  firstUsage: FiveElement   // 第一用神
  secondUsage?: FiveElement // 第二用神
  avoidedElements: FiveElement[] // 忌神
  enemyElements: FiveElement[]  // 仇神
  idleElements: FiveElement[]  // 闲神
  description: string
  confidence: number        // 0-100
  reasons: string[]         // 判断依据
  matchedRules: string[]    // 命中的规则
}

/**
 * 判断喜用神
 * 内部通过规则引擎执行，新增规则只需在 xiyongRules.ts 添加
 */
export function determineXiYongShen(
  strengthScore: number,
  wangShuai: WuXingWangShuai,
  geJuName: GeJuName,
  dayElement: FiveElement,
): XiYongShenResult {
  // 简化上下文（完整上下文需要更多参数，后续扩展）
  const ctx: Partial<XiYongContext> = {
    dayElement,
    strengthScore,
    wangShuai,
    geJuName,
    geJuCategory: geJuName.includes('从') ? '从格'
      : geJuName.includes('专旺') || ['曲直格', '炎上格', '稼穑格', '从革格', '润下格'].includes(geJuName) ? '专旺格'
      : geJuName === '化气格' ? '化气格'
      : '正格',
    isSpecialGe: geJuName.includes('从') || geJuName === '化气格'
      || ['曲直格', '炎上格', '稼穑格', '从革格', '润下格'].includes(geJuName),
  }

  const result = runXiYongRules(ctx as XiYongContext)

  const firstHappy = result.firstHappy || '木'
  const secondHappy = result.secondHappy || '火'
  const thirdHappy = result.thirdHappy || '土'
  const firstUsage = result.firstUsage || '金'
  const secondUsage = result.secondUsage || undefined

  return {
    bestElement: firstHappy,
    usageElement: firstUsage,
    firstHappy,
    secondHappy,
    thirdHappy,
    firstUsage,
    secondUsage,
    avoidedElements: result.avoidedElements,
    enemyElements: result.enemyElements,
    idleElements: result.idleElements,
    description: result.explanation,
    confidence: result.confidence,
    reasons: result.reasons,
    matchedRules: result.matchedRules,
  }
}
