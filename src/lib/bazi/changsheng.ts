/**
 * 十二长生
 * 阳干顺行十二地支，阴干逆行十二地支
 * 内部通过规则引擎执行
 */

import type { HeavenlyStem, EarthlyBranch, ShiErChangSheng } from './types'
import {
  calcChangShengByRules,
  getChangShengStartZhi as getStartZhi,
  getChangShengNames as getChangShengNamesFromRules,
  CHANG_SHENG_NAMES,
} from './rules/changshengRules'

export type { ShiErChangSheng }
export { CHANG_SHENG_NAMES }

/**
 * 获取某天干在某地支的十二长生状态
 * @param gan 天干
 * @param zhi 地支
 * @returns 十二长生名称
 */
export function getChangSheng(gan: HeavenlyStem, zhi: EarthlyBranch): ShiErChangSheng {
  const result = calcChangShengByRules(gan, zhi)
  return result.changSheng
}

/**
 * 获取某天干的长生宫位地支
 */
export function getChangShengStartZhi(gan: HeavenlyStem): EarthlyBranch {
  return getStartZhi(gan)
}

/**
 * 获取十二长生名称列表
 */
export function getChangShengNames(): ShiErChangSheng[] {
  return getChangShengNamesFromRules()
}

