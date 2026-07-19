/**
 * H3 Module 1: 工具函数
 *
 * 统一引用 Core SSoT 常量，不重复定义。
 */

import {
  HEAVENLY_STEMS, STEM_ELEMENT, STEM_YINYANG,
  EARTHLY_BRANCHES, BRANCH_ELEMENT,
  CANG_GAN,
  CHANG_SHENG_NAMES, CHANG_SHENG_START,
  NA_YIN_TABLE,
} from '@/lib/core/constants'
import type {
  HeavenlyStem, EarthlyBranch, FiveElement, NaYin, ShiErChangSheng,
} from '@/lib/core/types/base'
import { CLASSIC_CONFIG } from './config'

// ─── 索引查找 ───

export function stemIndex(gan: HeavenlyStem): number {
  return HEAVENLY_STEMS.indexOf(gan)
}

export function branchIndex(zhi: EarthlyBranch): number {
  return EARTHLY_BRANCHES.indexOf(zhi)
}

// ─── 纳音查找 ───

/** 根据天干地支查纳音（仅限六十甲子有效组合） */
export function getNaYin(gan: HeavenlyStem, zhi: EarthlyBranch): NaYin {
  const gi = stemIndex(gan)
  const zi = branchIndex(zhi)
  for (let i = 0; i < 60; i++) {
    if (i % 10 === gi && i % 12 === zi) return NA_YIN_TABLE[i]
  }
  // 非六十甲子组合（如胎元/胎息可能产生），标记为未知
  return ''
}

/** 获取六十甲子序号，非有效组合返回 -1 */
export function getGanZhiIndex(gan: HeavenlyStem, zhi: EarthlyBranch): number {
  const gi = stemIndex(gan)
  const zi = branchIndex(zhi)
  for (let i = 0; i < 60; i++) {
    if (i % 10 === gi && i % 12 === zi) return i
  }
  return -1
}

/** 根据六十甲子序号查纳音 */
export function getNaYinByIndex(index: number): NaYin {
  return NA_YIN_TABLE[index % 60]
}

// ─── 十二长生 ───

/** 根据天干和地支计算十二长生 */
export function getChangSheng(gan: HeavenlyStem, zhi: EarthlyBranch): ShiErChangSheng {
  const startIdx = CHANG_SHENG_START[gan]
  const zhiIdx = branchIndex(zhi)
  const ganIdx = stemIndex(gan)
  const isYang = ganIdx % 2 === 0

  let offset: number
  if (isYang) {
    offset = (zhiIdx - startIdx + 12) % 12
  } else {
    offset = (startIdx - zhiIdx + 12) % 12
  }
  return CHANG_SHENG_NAMES[offset]
}

/** 获取天干长生起点地支 */
export function getChangShengStartZhi(gan: HeavenlyStem): EarthlyBranch {
  return EARTHLY_BRANCHES[CHANG_SHENG_START[gan]]
}

// ─── 五行 ───

export function getStemElement(gan: HeavenlyStem): FiveElement {
  return STEM_ELEMENT[gan]
}

export function getBranchElement(zhi: EarthlyBranch): FiveElement {
  return BRANCH_ELEMENT[zhi]
}

// ─── 五行生克公共常量 ───

/** 我生 → 五行映射（木生火、火生土、土生金、金生水、水生木） */
export const FIVE_ELEMENT_SHENG: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

/** 我克 → 五行映射（木克土、火克金、土克水、金克木、水克火） */
export const FIVE_ELEMENT_KE: Record<FiveElement, FiveElement> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
}

/** 我被生 → 五行映射（木被水生、火被木生、土被火生、金被土生、水被金生） */
export const FIVE_ELEMENT_BE_SHENG: Record<FiveElement, FiveElement> = {
  '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
}

/** 我被克 → 五行映射（木被金克、火被水克、土被木克、金被火克、水被土克） */
export const FIVE_ELEMENT_BE_KE: Record<FiveElement, FiveElement> = {
  '木': '金', '火': '水', '土': '木', '金': '火', '水': '土',
}

// ─── 五行统计（含藏干加权：本气0.6, 中气0.3, 余气0.1） ───

export function calculateFiveElementCount(sixLines: {
  year: { gan: HeavenlyStem; zhi: EarthlyBranch }
  month: { gan: HeavenlyStem; zhi: EarthlyBranch }
  day: { gan: HeavenlyStem; zhi: EarthlyBranch }
  hour: { gan: HeavenlyStem; zhi: EarthlyBranch }
}): Record<FiveElement, number> {
  const count: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }

  const { benWeight = 0.6, zhongWeight = 0.3, yaoWeight = 0.1 } = CLASSIC_CONFIG.hiddenStem

  const pillars = [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]
  for (const pillar of pillars) {
    // 天干 1.0
    count[getStemElement(pillar.gan)] += 1.0
    // 地支本气 + 中气 + 余气（权重来自 config）
    const cg = CANG_GAN[pillar.zhi]
    count[getStemElement(cg.ben)] += benWeight
    if (cg.zhong) count[getStemElement(cg.zhong)] += zhongWeight
    if (cg.yao) count[getStemElement(cg.yao)] += yaoWeight
  }

  return count
}

// ─── 空亡 ───

/** 计算空亡地支（日柱空亡 + 年柱空亡） */
export function getKongWang(
  sixLines: { year: { gan: HeavenlyStem; zhi: EarthlyBranch }; day: { gan: HeavenlyStem; zhi: EarthlyBranch } },
): EarthlyBranch[] {
  const result: EarthlyBranch[] = []

  // 日柱空亡
  const dayGanIdx = stemIndex(sixLines.day.gan)
  const dayZhiIdx = branchIndex(sixLines.day.zhi)
  const dayOffset = (dayZhiIdx - dayGanIdx + 12) % 12
  result.push(EARTHLY_BRANCHES[(dayOffset + 10) % 12])
  result.push(EARTHLY_BRANCHES[(dayOffset + 11) % 12])

  // 年柱空亡
  const yearGanIdx = stemIndex(sixLines.year.gan)
  const yearZhiIdx = branchIndex(sixLines.year.zhi)
  const yearOffset = (yearZhiIdx - yearGanIdx + 12) % 12
  const yk1 = EARTHLY_BRANCHES[(yearOffset + 10) % 12]
  const yk2 = EARTHLY_BRANCHES[(yearOffset + 11) % 12]
  if (!result.includes(yk1)) result.push(yk1)
  if (!result.includes(yk2)) result.push(yk2)

  return result
}

// ─── 十神 ───

const SHI_SHEN_MAP: Record<string, Record<string, string>> = {
  '甲': { '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财', '己': '正财', '庚': '偏官', '辛': '正官', '壬': '偏印', '癸': '正印' },
  '乙': { '甲': '劫财', '乙': '比肩', '丙': '伤官', '丁': '食神', '戊': '正财', '己': '偏财', '庚': '正官', '辛': '偏官', '壬': '正印', '癸': '偏印' },
  '丙': { '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财', '戊': '食神', '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '偏官', '癸': '正官' },
  '丁': { '甲': '正印', '乙': '偏印', '丙': '劫财', '丁': '比肩', '戊': '伤官', '己': '食神', '庚': '正财', '辛': '偏财', '壬': '正官', '癸': '偏官' },
  '戊': { '甲': '偏官', '乙': '正官', '丙': '偏印', '丁': '正印', '戊': '比肩', '己': '劫财', '庚': '食神', '辛': '伤官', '壬': '偏财', '癸': '正财' },
  '己': { '甲': '正官', '乙': '偏官', '丙': '正印', '丁': '偏印', '戊': '劫财', '己': '比肩', '庚': '伤官', '辛': '食神', '壬': '正财', '癸': '偏财' },
  '庚': { '甲': '正财', '乙': '偏财', '丙': '偏官', '丁': '正官', '戊': '偏印', '己': '正印', '庚': '比肩', '辛': '劫财', '壬': '食神', '癸': '伤官' },
  '辛': { '甲': '偏财', '乙': '正财', '丙': '正官', '丁': '偏官', '戊': '正印', '己': '偏印', '庚': '劫财', '辛': '比肩', '壬': '伤官', '癸': '食神' },
  '壬': { '甲': '食神', '乙': '伤官', '丙': '正财', '丁': '偏财', '戊': '偏官', '己': '正官', '庚': '偏印', '辛': '正印', '壬': '比肩', '癸': '劫财' },
  '癸': { '甲': '伤官', '乙': '食神', '丙': '偏财', '丁': '正财', '戊': '正官', '己': '偏官', '庚': '正印', '辛': '偏印', '壬': '劫财', '癸': '比肩' },
}

/** 获取天干与日主的十神关系 */
export function getShenShi(dayGan: HeavenlyStem, targetGan: HeavenlyStem): string {
  return SHI_SHEN_MAP[dayGan]?.[targetGan] ?? '未知'
}

// ─── 数值工具 ───

/** 数值钳位（公共工具函数） */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
