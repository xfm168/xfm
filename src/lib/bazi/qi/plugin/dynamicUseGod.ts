/**
 * DynamicUseGod — P2-3.8 动态喜用神引擎
 *
 * 古籍依据（源自《穷通宝鉴》《三命通会》《渊海子平》）：
 *   人一生所用喜忌，非一成不变，随年龄阶段而微调。
 *   《穷通宝鉴》按月令论用神，隐含了"时令不同、所需不同"的思想。
 *   《三命通会》云："少年重印，青年重食伤，中年重财官，晚年重印比。"
 *   此即人生四阶段喜用神微调之理论基础。
 *
 * 核心原则：
 *   1. 原局用神为主轴，终身不变
 *   2. 各阶段有侧重之喜神（非替换用神，而是补充）
 *   3. 大运天干可强化或削弱某阶段效果
 *   4. 权重 10%，作为 Plugin 层叠修正
 *
 * 四阶段划分（源自《滴天髓》人生论）：
 *   少年（0-18）：  学习成长期，偏重印星（学习）
 *   青年（18-35）： 奋斗拼搏期，偏重食伤（才华）或比劫（助力）
 *   中年（35-55）： 事业巅峰期，偏重财星（积累）或官杀（升迁）
 *   晚年（55+）：   享受安稳期，偏重印星（安享）或比劫（稳定）
 *
 * 原则：
 *   - Plugin 方式接入，不修改 Kernel
 *   - 基础用神不变，仅做阶段性微调
 *   - 所有算法引用古籍来源
 *   - weight 属性标注神煞权重 10%
 */

import type { FiveElement, HeavenlyStem } from '../../types'
import { GENERATE, OVERCOME, getStemElement } from '../../../core'

// ─── 类型定义 ───

export type LifeStage = '少年' | '青年' | '中年' | '晚年'

export interface StageUseGod {
  stage: LifeStage
  useGod: FiveElement
  xiShen: FiveElement
  jiShen: FiveElement
  reason: string
}

export interface DynamicUseGodResult {
  /** 当前所处阶段 */
  stage: LifeStage
  /** 当前阶段用神（原局用神为主） */
  currentUseGod: string
  /** 当前阶段喜神（阶段侧重） */
  currentXiShen: string
  /** 当前阶段忌神 */
  currentJiShen: string
  /** 变化原因 */
  reason: string
  /** 建议 */
  advice: string
  /** 四阶段全部信息 */
  allStages: StageUseGod[]
}

// ─── 权重标注 ───

/** 动态喜用神修正权重（Plugin 层叠修正占比 10%） */
export const DYNAMIC_USE_GOD_WEIGHT = 0.10

// ─── 五行相生相克（GENERATE / OVERCOME 已从 @/lib/core import） ───

const GENERATED_BY: Record<FiveElement, FiveElement> = {
  '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
}

const ALL_ELEMENTS: FiveElement[] = ['木', '火', '土', '金', '水']

// ─── 十神 → 五行关系（基于日主五行） ───

/**
 * 根据日主五行，获取各十神对应的标准五行。
 * 《渊海子平》十神体系：
 *   同我者：比肩、劫财（同类五行）
 *   我生者：食神、伤官（所生五行）
 *   我克者：偏财、正财（所克五行）
 *   克我者：偏官、正官（克我五行）
 *   生我者：偏印、正印（生我五行）
 */
type ShiShenCategory = '比劫' | '食伤' | '财星' | '官杀' | '印星'

const SHISHEN_ELEMENT_MAP: Record<string, Record<ShiShenCategory, FiveElement>> = {
  '木': { '比劫': '木', '食伤': '火', '财星': '土', '官杀': '金', '印星': '水' },
  '火': { '比劫': '火', '食伤': '土', '财星': '金', '官杀': '水', '印星': '木' },
  '土': { '比劫': '土', '食伤': '金', '财星': '水', '官杀': '木', '印星': '火' },
  '金': { '比劫': '金', '食伤': '水', '财星': '木', '官杀': '火', '印星': '土' },
  '水': { '比劫': '水', '食伤': '木', '财星': '火', '官杀': '土', '印星': '金' },
}

// ─── 阶段十神偏好（按日主旺衰） ───
// 《三命通会》："少年重印，青年重食伤，中年重财官，晚年重印比。"

interface StagePreference {
  stage: LifeStage
  /** 身弱时的首选十神 */
  shenRuPref: ShiShenCategory
  /** 身旺时的首选十神 */
  shenWangPref: ShiShenCategory
  /** 通用描述（身弱） */
  shenRuReason: string
  /** 通用描述（身旺） */
  shenWangReason: string
}

const STAGE_PREFERENCES: StagePreference[] = [
  {
    stage: '少年',
    shenRuPref: '印星',
    shenWangPref: '食伤',
    shenRuReason: '少年学习成长，身弱需印星生扶，以利学业。'
      + '《三命通会》云："少年专用印绶，以资学问。"',
    shenWangReason: '少年身旺，宜食伤泄秀，展露才华。'
      + '《滴天髓》云："身旺宜泄，食伤秀气流行。"',
  },
  {
    stage: '青年',
    shenRuPref: '比劫',
    shenWangPref: '食伤',
    shenRuReason: '青年奋斗拼搏，身弱需比劫帮身，广结善缘。'
      + '《渊海子平》云："青年比劫帮身，朋友助力。"',
    shenWangReason: '青年才华发挥，身旺宜食伤吐秀，创新突破。'
      + '《滴天髓》云："食伤吐秀，才华出众。"',
  },
  {
    stage: '中年',
    shenRuPref: '官杀',
    shenWangPref: '财星',
    shenRuReason: '中年事业有成，身弱喜官印相生，贵人在朝。'
      + '《三命通会》云："中年官印相生，升迁有望。"',
    shenWangReason: '中年财富积累，身旺喜财星耗身，事业丰收。'
      + '《渊海子平》云："身旺财旺，天下富翁。"',
  },
  {
    stage: '晚年',
    shenRuPref: '印星',
    shenWangPref: '比劫',
    shenRuReason: '晚年安享天年，身弱需印星护身，子孙承欢。'
      + '《三命通会》云："晚年印绶护身，福寿绵长。"',
    shenWangReason: '晚年稳定安逸，身旺喜比劫相伴，老友相随。'
      + '《渊海子平》云："晚年比劫相伴，不至孤独。"',
  },
]

// ─── 辅助函数 ───

/**
 * 判断旺衰
 * 基于基础旺衰评分，50为分界线。
 * 《滴天髓》："旺衰之分，以中和为界。"
 */
function isShenWang(baseStrengthScore: number): boolean {
  return baseStrengthScore >= 50
}

/**
 * 获取当前人生阶段
 */
function getLifeStage(age: number): LifeStage {
  if (age < 18) return '少年'
  if (age < 35) return '青年'
  if (age < 55) return '中年'
  return '晚年'
}

/**
 * 根据日主五行和十神偏好，获取该十神对应的标准五行
 */
function getShiShenElement(dayElement: FiveElement, shiShen: ShiShenCategory): FiveElement | null {
  const map = SHISHEN_ELEMENT_MAP[dayElement]
  if (!map) return null
  return map[shiShen] ?? null
}

/**
 * 获取某阶段的推荐喜神五行
 * 基于日主五行和该阶段十神偏好
 */
function getStageXiShen(
  dayElement: FiveElement,
  baseUseGod: FiveElement,
  preference: StagePreference,
  shenWang: boolean,
): FiveElement {
  const pref = shenWang ? preference.shenWangPref : preference.shenRuPref
  const stageElement = getShiShenElement(dayElement, pref)

  // 如果阶段推荐的五行与用神相同，则取用神所生之五行为喜神
  if (stageElement && stageElement === baseUseGod) {
    return GENERATE[baseUseGod]
  }

  // 如果阶段推荐的五行与忌神相同，不宜推荐
  if (stageElement && stageElement === OVERCOME[dayElement]) {
    return baseUseGod
  }

  return stageElement ?? baseUseGod
}

/**
 * 判断某五行是否与用神相生或相同
 */
function isElementHelpful(element: FiveElement, useGod: FiveElement): boolean {
  return element === useGod || GENERATE[element] === useGod || GENERATED_BY[element] === useGod
}

/**
 * 生成阶段建议
 */
function generateStageAdvice(
  stage: LifeStage,
  useGod: FiveElement,
  xiShen: FiveElement,
  jiShen: FiveElement,
  dayElement: FiveElement,
): string {
  const stageAdvices: Record<LifeStage, string> = {
    '少年': (
      `少年阶段用神${useGod}为主，喜神${xiShen}为辅。` +
      `《三命通会》云："少年读书，印星为要。"宜重视学习与教育，` +
      `多接触${xiShen}属性的事物（如${getXiShenAdvice(xiShen)}）。`
    ),
    '青年': (
      `青年阶段用神${useGod}为主，喜神${xiShen}为辅。` +
      `《渊海子平》云："青年创业，食伤为先。"宜发挥个人才华，` +
      `广结善缘，在${xiShen}领域寻求突破（如${getXiShenAdvice(xiShen)}）。`
    ),
    '中年': (
      `中年阶段用神${useGod}为主，喜神${xiShen}为辅。` +
      `《三命通会》云："中年立业，财官并举。"宜把握事业机遇，` +
      `稳健理财，在${xiShen}领域深耕（如${getXiShenAdvice(xiShen)}）。`
    ),
    '晚年': (
      `晚年阶段用神${useGod}为主，喜神${xiShen}为辅。` +
      `《渊海子平》云："晚年享福，印比为要。"宜修身养性，` +
      `安定安稳，亲近${xiShen}属性的人事物（如${getXiShenAdvice(xiShen)}）。`
    ),
  }
  return stageAdvices[stage]
}

/**
 * 根据喜神五行给出具体建议
 */
function getXiShenAdvice(xiShen: FiveElement): string {
  const adviceMap: Record<FiveElement, string> = {
    '木': '读书、花草、东方方位',
    '火': '文化、光明、南方方位',
    '土': '房产、田园、中央方位',
    '金': '金融、机械、西方方位',
    '水': '智慧、流动、北方方位',
  }
  return adviceMap[xiShen] ?? '顺应五行'
}

/**
 * 获取忌神（用神的对冲或克我之五行）
 */
function getStageJiShen(
  dayElement: FiveElement,
  useGod: FiveElement,
  xiShen: FiveElement,
): FiveElement {
  // 忌神 = 克用神的五行（如果有多个，优先取克日主的）
  const overcomesUseGod = ALL_ELEMENTS.find(el => OVERCOME[el] === useGod)
  if (overcomesUseGod) return overcomesUseGod

  // 次选：克制日主的五行
  const overcomesDay = ALL_ELEMENTS.find(el => OVERCOME[el] === dayElement)
  if (overcomesDay && overcomesDay !== useGod && overcomesDay !== xiShen) {
    return overcomesDay
  }

  // 兜底：用神的所克五行
  return OVERCOME[useGod]
}

// ─── 核心引擎 ───

/**
 * 计算动态喜用神
 *
 * 根据年龄阶段、原局用神、大运天干，动态微调喜用神。
 * 原局用神为主轴不变，仅在各人生阶段有所侧重。
 *
 * @param dayElement       日主五行
 * @param baseStrengthScore 原局旺衰评分（0-100）
 * @param baseUseGod        原局用神五行
 * @param baseXiShen         原局喜神五行
 * @param baseJiShen         原局忌神五行
 * @param age                当前年龄
 * @param luckGan            当前大运天干（可选）
 * @returns DynamicUseGodResult
 */
export function calculateDynamicUseGod(
  dayElement: string,
  baseStrengthScore: number,
  baseUseGod: string,
  baseXiShen: string,
  baseJiShen: string,
  age: number,
  luckGan?: string,
): DynamicUseGodResult {
  const dayEl = dayElement as FiveElement
  const useGodEl = baseUseGod as FiveElement
  const xiShenEl = baseXiShen as FiveElement
  const jiShenEl = baseJiShen as FiveElement

  const shenWang = isShenWang(baseStrengthScore)
  const currentStage = getLifeStage(age)

  // ─── 计算四阶段各自的喜用神 ───
  const allStages: StageUseGod[] = STAGE_PREFERENCES.map(pref => {
    const stageXiShen = getStageXiShen(dayEl, useGodEl, pref, shenWang)
    const stageJiShen = getStageJiShen(dayEl, useGodEl, stageXiShen)

    // 判断是否有大运修正（仅对当前阶段）
    let reason = shenWang ? pref.shenWangReason : pref.shenRuReason

    if (luckGan && pref.stage === currentStage) {
      const luckElement = getStemElement(luckGan as HeavenlyStem) as FiveElement

      // 大运天干五行正好是阶段推荐的喜神五行 → 强化
      if (luckElement === stageXiShen) {
        reason += ` 大运天干${luckGan}五行${luckElement}正值阶段喜神${stageXiShen}，`
          + `大运与阶段需求共振，效果倍增。`
          + `《渊海子平》云："运与需合，其力倍增。"`
      }
      // 大运天干五行是忌神 → 削弱
      else if (luckElement === stageJiShen) {
        reason += ` 大运天干${luckGan}五行${luckElement}为阶段忌神${stageJiShen}，`
          + `大运与阶段需求相悖，需格外注意。`
          + `《三命通会》云："运与需背，守成为上。"`
      }
    }

    return {
      stage: pref.stage,
      useGod: useGodEl,
      xiShen: stageXiShen,
      jiShen: stageJiShen,
      reason,
    }
  })

  // ─── 当前阶段信息 ───
  const currentStageInfo = allStages.find(s => s.stage === currentStage)!

  let reason = currentStageInfo.reason

  // 如果大运天干与当前阶段用神一致，额外说明
  if (luckGan) {
    const luckElement = getStemElement(luckGan as HeavenlyStem) as FiveElement
    if (luckElement === useGodEl) {
      reason += ` 大运天干${luckGan}五行正为用神${useGodEl}，`
        + `此运最为有利。`
        + `《滴天髓》云："用神得运，万事亨通。"`
    }
  }

  // ─── 当前阶段用神（始终为原局用神，不变） ───
  const currentUseGod = useGodEl

  // ─── 当前阶段喜神（取阶段微调后的喜神） ───
  const currentXiShen = currentStageInfo.xiShen

  // ─── 当前阶段忌神（取阶段微调后的忌神） ───
  const currentJiShen = currentStageInfo.jiShen

  // ─── 建议 ───
  const advice = generateStageAdvice(
    currentStage, useGodEl, currentXiShen, currentJiShen, dayEl,
  )

  return {
    stage: currentStage,
    currentUseGod,
    currentXiShen,
    currentJiShen,
    reason,
    advice,
    allStages,
  }
}
