/**
 * LuckModifierEngine — P2-3.8 大运流年修正引擎
 *
 * 古籍依据（源自《三命通会》《渊海子平》《滴天髓》）：
 *   大运为命局之枢纽，十年一变，主宰阶段性运势。
 *   《渊海子平》云："大运者，人生之枢纽也。大运顺行，则顺其势而行；
 *   大运逆行，则逆其势而动。"
 *   流年者，岁运之加临，一年之吉凶。
 *   《三命通会》云："流年者，岁君也。吉则助吉，凶则助凶。"
 *
 * 修正维度（权重 10%，作为 Plugin 层叠修正）：
 *   1. 大运天干与喜用神关系（+15/-15）
 *   2. 大运地支与日主十二长生关系（+10/-10）
 *   3. 流年天干与喜用神关系（+5/-5）
 *   4. 流年地支与日支冲合关系（-8/+5）
 *
 * 原则：
 *   - Plugin 方式接入，不修改 Kernel
 *   - 大运为主修正源，流年为辅助修正源
 *   - 所有算法引用古籍来源
 *   - weight 属性标注神煞权重 10%
 */

import type { FiveElement, HeavenlyStem, EarthlyBranch, ShiErChangSheng } from '../../types'
import { STEM_ELEMENT, BRANCH_ELEMENT, GENERATE, OVERCOME, getStemElement, getBranchElement } from '../../../core'
import { getChangSheng } from '../../changsheng'

// ─── 类型定义 ───

export interface LuckModifierResult {
  /** 原局评分 */
  originalScore: number
  /** 修正后评分 */
  modifiedScore: number
  /** 大运影响等级 */
  luckEffect: '大吉' | '吉' | '平' | '凶' | '大凶'
  /** 变化量（正数=提升，负数=降低） */
  luckChange: number
  /** 大运影响描述 */
  description: string
  /** 流年影响（可选） */
  yearEffect?: {
    yearGan: string
    yearZhi: string
    effect: string
    score: number
  }
  /** 建议 */
  advice: string
}

// ─── 权重标注 ───

/** 大运流年修正权重（Plugin 层叠修正占比 10%） */
export const LUCK_MODIFIER_WEIGHT = 0.10

// ─── 地支六冲 ───
// 《三命通会》："子午相冲，丑未相冲，寅申相冲，卯酉相冲，辰戌相冲，巳亥相冲。"

const LIU_CHONG: [string, string][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

// ─── 地支六合 ───
// 《三命通会》："子丑合土，寅亥合木，卯戌合火，辰酉合金，巳申合水，午未合火。"

const LIU_HE: [string, string][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'],
  ['辰', '酉'], ['巳', '申'], ['午', '未'],
]

// ─── 有利十二长生状态 ───
// 《滴天髓》："长生帝旺，身强之象；死墓绝地，身弱之征。"

const BENEFICIAL_STATES: ShiErChangSheng[] = ['长生', '帝旺', '临官']
const HARMFUL_STATES: ShiErChangSheng[] = ['死', '墓', '绝']

// ─── 辅助函数 ───

/**
 * 获取天干对应的五行
 * 优先使用 Core 的 getStemElement，回退到内部映射
 */
function resolveStemElement(gan: string): FiveElement {
  try {
    return getStemElement(gan as HeavenlyStem)
  } catch {
    return (STEM_ELEMENT as any)[gan] ?? '土'
  }
}

/**
 * 获取地支对应的五行
 * 优先使用 Core 的 getBranchElement，回退到内部映射
 */
function resolveBranchElement(zhi: string): FiveElement {
  try {
    return getBranchElement(zhi as EarthlyBranch)
  } catch {
    return (BRANCH_ELEMENT as any)[zhi] ?? '土'
  }
}

/**
 * 判断两个地支是否相冲
 * 《渊海子平》论六冲
 */
function isClash(zhi1: string, zhi2: string): boolean {
  return LIU_CHONG.some(([a, b]) =>
    (zhi1 === a && zhi2 === b) || (zhi1 === b && zhi2 === a),
  )
}

/**
 * 判断两个地支是否相合
 * 《三命通会》论六合
 */
function isHarmony(zhi1: string, zhi2: string): boolean {
  return LIU_HE.some(([a, b]) =>
    (zhi1 === a && zhi2 === b) || (zhi1 === b && zhi2 === a),
  )
}

/**
 * 计算大运天干对喜用神的影响
 * 《渊海子平》："大运干支，喜用相逢则发，忌仇相遇则困。"
 */
function calcLuckGanEffect(
  luckGanElement: FiveElement,
  useGodElement: FiveElement,
  jiShenElement: FiveElement,
): { score: number; description: string } {
  // 大运天干五行 = 用神：大吉
  if (luckGanElement === useGodElement) {
    return {
      score: 15,
      description: `大运天干五行为${useGodElement}，正逢用神，如鱼得水，运势大增。`,
    }
  }

  // 大运天干五行 = 喜神（用神所生）：吉
  if (GENERATE[useGodElement] === luckGanElement) {
    return {
      score: 10,
      description: `大运天干五行为${luckGanElement}，为用神${useGodElement}所生之喜神，源远流长。`,
    }
  }

  // 大运天干五行 = 忌神：凶
  if (luckGanElement === jiShenElement) {
    return {
      score: -15,
      description: `大运天干五行为${jiShenElement}，正逢忌神，如临深渊，需谨慎行事。`,
    }
  }

  // 大运天干五行 = 仇神（忌神所生）：小凶
  if (GENERATE[jiShenElement] === luckGanElement) {
    return {
      score: -10,
      description: `大运天干五行为${luckGanElement}，为忌神${jiShenElement}之源头（仇神），暗耗运势。`,
    }
  }

  // 大运天干冲克用神：凶
  if (OVERCOME[luckGanElement] === useGodElement || OVERCOME[useGodElement] === luckGanElement) {
    return {
      score: -8,
      description: `大运天干${luckGanElement}与用神${useGodElement}相克，运势受阻。`,
    }
  }

  // 大运天干生用神：小吉
  if (GENERATE[luckGanElement] === useGodElement) {
    return {
      score: 5,
      description: `大运天干${luckGanElement}生用神${useGodElement}，暗中助力。`,
    }
  }

  return {
    score: 0,
    description: `大运天干${luckGanElement}与用神${useGodElement}无直接吉凶关系，运势平稳。`,
  }
}

/**
 * 计算大运地支对日主的十二长生影响
 * 《滴天髓》："长生帝旺，身旺之地；死墓绝地，身衰之方。"
 */
function calcLuckZhiEffect(
  dayGan: string,
  luckZhi: string,
  dayElement: FiveElement,
): { score: number; description: string; changSheng: ShiErChangSheng } {
  try {
    const changSheng = getChangSheng(dayGan as HeavenlyStem, luckZhi as EarthlyBranch)

    if (BENEFICIAL_STATES.includes(changSheng)) {
      return {
        score: 10,
        changSheng,
        description: `大运地支${luckZhi}，日主${dayGan}逢${changSheng}之地，气数充沛，如虎添翼。`,
      }
    }

    if (HARMFUL_STATES.includes(changSheng)) {
      return {
        score: -10,
        changSheng,
        description: `大运地支${luckZhi}，日主${dayGan}处${changSheng}之境，气数衰减，宜守不宜攻。`,
      }
    }

    // 其他状态（沐浴、冠带、衰、病、胎、养）小影响
    return {
      score: 0,
      changSheng,
      description: `大运地支${luckZhi}，日主${dayGan}处${changSheng}之位，影响中性。`,
    }
  } catch {
    // 无法计算十二长生时，用地支五行与日主关系判断
    const luckElement = resolveBranchElement(luckZhi)
    if (GENERATE[luckElement] === dayElement) {
      return {
        score: 5,
        changSheng: '胎',
        description: `大运地支${luckZhi}五行${luckElement}生日主${dayElement}，略有助益。`,
      }
    }
    if (OVERCOME[luckElement] === dayElement) {
      return {
        score: -5,
        changSheng: '病',
        description: `大运地支${luckZhi}五行${luckElement}克日主${dayElement}，略有损耗。`,
      }
    }
    return {
      score: 0,
      changSheng: '养',
      description: `大运地支${luckZhi}与日主${dayElement}无明显影响。`,
    }
  }
}

/**
 * 计算流年修正
 * 《三命通会》："流年者，岁君也。吉则助吉，凶则助凶。"
 */
function calcYearEffect(
  yearGan: string,
  yearZhi: string,
  dayZhi: string,
  useGodElement: FiveElement,
  jiShenElement: FiveElement,
): { yearScore: number; effect: string } {
  let yearScore = 0
  const effects: string[] = []

  const yearGanElement = resolveStemElement(yearGan)

  // 流年天干 = 用神：+5
  if (yearGanElement === useGodElement) {
    yearScore += 5
    effects.push(`流年天干${yearGan}五行为${useGodElement}（用神），锦上添花（+5分）`)
  }
  // 流年天干 = 忌神：-5
  else if (yearGanElement === jiShenElement) {
    yearScore -= 5
    effects.push(`流年天干${yearGan}五行为${jiShenElement}（忌神），雪上加霜（-5分）`)
  }

  // 流年冲命局日支：-8
  // 《渊海子平》："岁运冲日支，动荡不安。"
  if (isClash(yearZhi, dayZhi)) {
    yearScore -= 8
    effects.push(`流年地支${yearZhi}冲日支${dayZhi}，动荡多变（-8分）`)
  }

  // 流年合命局日支：+5
  // 《三命通会》："岁运合日支，贵人相助。"
  else if (isHarmony(yearZhi, dayZhi)) {
    yearScore += 5
    effects.push(`流年地支${yearZhi}合日支${dayZhi}，贵人扶持（+5分）`)
  }

  const effect = effects.length > 0
    ? effects.join('；')
    : `流年${yearGan}${yearZhi}与命局无重大冲合，平稳过渡。`

  return { yearScore, effect }
}

/**
 * 判定运势等级
 * 《渊海子平》分五等：大吉、吉、平、凶、大凶
 */
function determineLuckEffect(totalChange: number): '大吉' | '吉' | '平' | '凶' | '大凶' {
  if (totalChange >= 20) return '大吉'
  if (totalChange >= 10) return '吉'
  if (totalChange >= -5) return '平'
  if (totalChange >= -15) return '凶'
  return '大凶'
}

/**
 * 生成综合建议
 */
function generateAdvice(
  luckEffect: '大吉' | '吉' | '平' | '凶' | '大凶',
  luckGanElement: FiveElement,
  luckZhi: string,
  dayElement: FiveElement,
): string {
  switch (luckEffect) {
    case '大吉':
      return (
        `此大运大吉，${luckGanElement}气当权，宜大展宏图、积极进取。` +
        `《滴天髓》云："旺极宜泄"，可在${GENERATE[dayElement]}方面开拓新局。`
      )
    case '吉':
      return (
        `此大运吉顺，${luckGanElement}气助身，可稳中求进、把握机遇。` +
        `《三命通会》云："吉运当权，逢凶化吉。"宜顺势而为，不宜急躁冒进。`
      )
    case '平':
      return (
        `此大运平缓，${luckGanElement}气与日主${dayElement}无大碍亦无大助，宜守常待变。` +
        `《渊海子平》云："运平则守成，不可妄动。"适合积累内力、静待时机。`
      )
    case '凶':
      return (
        `此大运多阻，${luckGanElement}气不利日主，宜谨慎行事、保守经营。` +
        `《三命通会》云："凶运当权，宜修德以禳灾。"多读书修身、少争强好胜。`
      )
    case '大凶':
      return (
        `此大运凶险，${luckGanElement}气克耗日主${dayElement}，宜韬光养晦、以退为进。` +
        `《渊海子平》云："大凶之运，唯有修心养性，方可转危为安。"` +
        `建议多亲近印星五行${GENERATE[dayElement]}属性之人事物，以增助力。`
      )
  }
}

// ─── 核心引擎 ───

/**
 * 大运流年修正函数
 *
 * 根据《三命通会》《渊海子平》《滴天髓》理论，
 * 修正原局评分以反映大运和流年的影响。
 *
 * @param originalScore  原局评分（0-100）
 * @param dayElement     日主五行
 * @param dayGan          日主天干
 * @param useGodElement   用神五行
 * @param jiShen          喜神五行
 * @param jiElement       忌神五行
 * @param luckGan         大运天干
 * @param luckZhi         大运地支
 * @param yearGan         流年天干（可选）
 * @param yearZhi         流年地支（可选）
 * @returns LuckModifierResult
 */
export function modifyByLuck(
  originalScore: number,
  dayElement: string,
  dayGan: string,
  useGodElement: string,
  jiShen: string,
  jiElement: string,
  luckGan: string,
  luckZhi: string,
  yearGan?: string,
  yearZhi?: string,
): LuckModifierResult {
  const dayEl = dayElement as FiveElement
  const useGodEl = useGodElement as FiveElement
  const jiShenEl = jiShen as FiveElement
  const jiEl = jiElement as FiveElement

  // ─── 大运天干修正 ───
  const luckGanElement = resolveStemElement(luckGan)
  const luckGanResult = calcLuckGanEffect(luckGanElement, useGodEl, jiEl)

  // ─── 大运地支修正（十二长生） ───
  const luckZhiResult = calcLuckZhiEffect(dayGan, luckZhi, dayEl)

  // ─── 大运总变化量 ───
  const luckChange = luckGanResult.score + luckZhiResult.score

  // ─── 流年修正（可选） ───
  let yearChange = 0
  let yearEffect: LuckModifierResult['yearEffect'] = undefined

  if (yearGan && yearZhi) {
    const yearResult = calcYearEffect(yearGan, yearZhi, luckZhi, useGodEl, jiEl)
    yearChange = yearResult.yearScore
    yearEffect = {
      yearGan,
      yearZhi,
      effect: yearResult.effect,
      score: yearChange,
    }
  }

  // ─── 最终分数 ───
  // 《渊海子平》："运好不如命好，命好不如运好。"大运可改命局定数。
  const totalChange = luckChange + yearChange
  const modifiedScore = Math.max(0, Math.min(100, originalScore + totalChange))

  // ─── 等级判定 ───
  const luckEffect = determineLuckEffect(totalChange)

  // ─── 组合描述 ───
  const description = [
    luckGanResult.description,
    luckZhiResult.description,
  ].join('')

  // ─── 建议 ───
  const advice = generateAdvice(luckEffect, luckGanElement, luckZhi, dayEl)

  return {
    originalScore,
    modifiedScore,
    luckEffect,
    luckChange: totalChange,
    description,
    yearEffect,
    advice,
  }
}
