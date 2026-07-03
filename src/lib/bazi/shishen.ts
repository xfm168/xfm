/**
 * 十神计算
 * 基于五行生克关系和阴阳同异判断
 * 内部通过规则引擎执行
 */

import type { HeavenlyStem, ShenShi, FiveElement, GanZhi, EarthlyBranch } from './types'
import {
  calcShenShiByRules,
  getAllShenShi,
  getShenShiPowers,
  analyzeShenShiCombinations,
  SHISHEN_RULES,
} from './rules/shishenRules'

// ─── 统一从 Core 导入基础常量 ───
import {
  HEAVENLY_STEMS,
  STEM_ELEMENT,
  STEM_YINYANG,
  getStemElement,
  getStemYinYang,
} from '@/lib/core'

export type { ShenShi }

/**
 * 计算两个天干之间的十神关系
 * @param dayGan 日主天干
 * @param targetGan 目标天干
 * @returns 十神名称
 */
export function calculateShenShi(dayGan: HeavenlyStem, targetGan: HeavenlyStem): ShenShi {
  const result = calcShenShiByRules(dayGan, targetGan)
  return result.shenShi
}

/**
 * 获取日主天干对应的所有十神关系
 * @param dayGan 日主天干
 * @returns 10个天干对应的十神
 */
export function getRelatedShens(dayGan: HeavenlyStem): Record<HeavenlyStem, ShenShi> {
  return getAllShenShi(dayGan) as Record<HeavenlyStem, ShenShi>
}

/**
 * 获取所有天干列表
 */
export function getAllStems(): HeavenlyStem[] {
  return [...HEAVENLY_STEMS]
}

/**
 * 十神力量分析
 */
export function getShenShiPower(
  sixLines: { year: GanZhi; month: GanZhi; day: GanZhi; hour: GanZhi },
  dayGan: HeavenlyStem,
  cangGanData: Record<EarthlyBranch, { ben: string; zhong: string | null; yao: string | null }>,
): Record<string, { count: number; touGan: number; cangGan: number; power: number }> {
  return getShenShiPowers(sixLines as any, dayGan, cangGanData as any) as any
}

/**
 * 十神组合分析
 */
export function getShenShiCombinations(
  sixLines: { year: GanZhi; month: GanZhi; day: GanZhi; hour: GanZhi },
  dayGan: HeavenlyStem,
  cangGanData: Record<EarthlyBranch, { ben: string; zhong: string | null; yao: string | null }>,
): { name: string; description: string; auspicious: boolean; strength: number; confidence: number }[] {
  return analyzeShenShiCombinations(sixLines as any, dayGan, cangGanData as any)
}

export { SHISHEN_RULES }
