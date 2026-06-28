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

export type { ShenShi }

const STEMS: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

const STEM_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
}

const STEM_YINYANG: Record<HeavenlyStem, '阳' | '阴'> = {
  甲: '阳', 丙: '阳', 戊: '阳', 庚: '阳', 壬: '阳',
  乙: '阴', 丁: '阴', 己: '阴', 辛: '阴', 癸: '阴',
}

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
 * 获取天干的五行属性
 */
export function getStemElement(gan: HeavenlyStem): FiveElement {
  return STEM_ELEMENT[gan]
}

/**
 * 获取天干的阴阳属性
 */
export function getStemYinYang(gan: HeavenlyStem): '阳' | '阴' {
  return STEM_YINYANG[gan]
}

/**
 * 获取所有天干列表
 */
export function getAllStems(): HeavenlyStem[] {
  return [...STEMS]
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
