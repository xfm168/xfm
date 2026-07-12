/**
 * UseGodEngine — P2-2 喜用神系统
 * 
 * 综合评分模型，非单一算法。
 * 
 * 考量维度（按权重）：
 *   1. 旺衰（40%）：身弱喜印比，身旺喜食财
 *   2. 格局（25%）：格局用神
 *   3. 调候（20%）：调候用神
 *   4. 病药（10%）：命局之药
 *   5. 通关（5%）：通关五行
 * 
 * 输出：用神、喜神、忌神、仇神、闲神
 */

import type { FiveElement, HeavenlyStem, EarthlyBranch, SixLines } from '../../types'
import type { DayMasterStrengthResult } from './dayMasterStrengthEngine'
import type { ClimateAdjustmentResult } from './climateAdjustmentEngine'
import type { DiseaseMedicineResult } from './diseaseMedicineEngine'
import type { TongGuanResult } from './tongGuanEngine'
import { GENERATE, OVERCOME } from '../../../core'

// ─── 类型定义 ───

export interface UseGodResult {
  /** 用神（最需要的五行） */
  yongShen: FiveElement
  /** 用神得分 */
  yongScore: number
  /** 喜神（次需要的五行） */
  xiShen: FiveElement
  /** 忌神（最不利的五行） */
  jiShen: FiveElement
  /** 仇神（生忌神的五行） */
  chouShen: FiveElement
  /** 闲神（无关紧要的五行） */
  xianShen: FiveElement
  /** 各五行综合评分 */
  scores: Record<FiveElement, number>
  /** 各维度贡献说明 */
  dimensionContributions: {
    strength: { element: FiveElement; reason: string }
    climate: { element?: FiveElement; reason: string }
    disease: { element?: FiveElement; reason: string }
    tongGuan: { element?: FiveElement; reason: string }
  }
  /** 古籍引用 */
  classicalQuote: string
  /** 综合建议 */
  advice: string
}

// ─── 五行关系 ───

const ELEMENT_NAMES: Record<FiveElement, string> = { '木': '木', '火': '火', '土': '土', '金': '金', '水': '水' }
const ALL_ELEMENTS: FiveElement[] = ['木', '火', '土', '金', '水']

// ─── 核心引擎 ───

export function calculateUseGod(
  dayElement: FiveElement,
  strength: DayMasterStrengthResult,
  climate: ClimateAdjustmentResult,
  disease: DiseaseMedicineResult,
  tongGuan: TongGuanResult,
): UseGodResult {
  const scores: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }

  // ─── 维度①：旺衰（权重 40%） ───
  const strengthContrib = calcStrengthContribution(dayElement, strength)
  for (const el of ALL_ELEMENTS) {
    scores[el] += strengthContrib[el] * 0.40
  }

  // ─── 维度②：调候（权重 20%） ───
  const climateContrib = calcClimateContribution(climate)
  for (const el of ALL_ELEMENTS) {
    scores[el] += climateContrib[el] * 0.20
  }

  // ─── 维度③：病药（权重 10%） ───
  const diseaseContrib = calcDiseaseContribution(disease)
  for (const el of ALL_ELEMENTS) {
    scores[el] += diseaseContrib[el] * 0.10
  }

  // ─── 维度④：通关（权重 5%） ───
  const tongGuanContrib = calcTongGuanContribution(tongGuan)
  for (const el of ALL_ELEMENTS) {
    scores[el] += tongGuanContrib[el] * 0.05
  }

  // ─── 维度⑤：格局（权重 25%） ───
  const geJuContrib = calcGeJuContribution(dayElement, strength)
  for (const el of ALL_ELEMENTS) {
    scores[el] += geJuContrib[el] * 0.25
  }

  // 归一化到 0-100
  const maxScore = Math.max(...Object.values(scores))
  const minScore = Math.min(...Object.values(scores))
  for (const el of ALL_ELEMENTS) {
    if (maxScore > minScore) {
      scores[el] = Math.round((scores[el] - minScore) / (maxScore - minScore) * 100)
    } else {
      scores[el] = 50
    }
  }

  // 排序确定用喜忌仇闲
  const sorted = (Object.entries(scores) as [FiveElement, number][])
    .sort((a, b) => b[1] - a[1])

  const yongShen = sorted[0][0]
  const xiShen = sorted[1][0]
  const jiShen = sorted[4][0]
  // 仇神 = 生忌神的五行
  const chouShen = GENERATE[jiShen]
  // 闲神 = 剩余的
  const used = new Set([yongShen, xiShen, jiShen, chouShen])
  const xianShen = ALL_ELEMENTS.find(e => !used.has(e)) || '木'

  return {
    yongShen,
    yongScore: scores[yongShen],
    xiShen,
    jiShen,
    chouShen,
    xianShen,
    scores,
    dimensionContributions: {
      strength: strengthContrib,
      climate: climateContrib,
      disease: diseaseContrib,
      tongGuan: tongGuanContrib,
    },
    classicalQuote: '《滴天髓》："旺者宜抑，衰者宜扶。扶抑得中，命局平和。"',
    advice: `日主${dayElement}${strength.strengthLevelCN}，用神${yongShen}，喜神${xiShen}。宜补${yongShen}${xiShen}，忌${jiShen}${chouShen}。`,
  }
}

// ─── 各维度贡献计算 ───

function calcStrengthContribution(dayElement: FiveElement, strength: DayMasterStrengthResult): Record<FiveElement, number> {
  const contrib: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }

  if (strength.strengthScore >= 65) {
    // 身旺：喜食伤泄秀 + 财星耗力
    contrib[GENERATE[dayElement]] = 80   // 我生（食伤）
    contrib[OVERCOME[dayElement]] = 70   // 我克（财星）
    contrib[dayElement] = -50            // 自身过多
    contrib[GENERATE[OVERCOME[dayElement]]] = -30 // 生忌神者
  } else if (strength.strengthScore >= 45) {
    // 中和：喜平衡
    contrib[GENERATE[dayElement]] = 30
    contrib[GENERATE[OVERCOME[dayElement]]] = 30
    contrib[dayElement] = 20
  } else {
    // 身弱：喜印星生扶 + 比劫帮身
    contrib[GENERATE[dayElement]] = -30  // 食伤泄身
    contrib[OVERCOME[dayElement]] = -40  // 财星耗身
    contrib[dayElement] = 80             // 比劫帮身
    contrib[OVERCOME[OVERCOME[dayElement]]] = 70  // 印星生身
  }

  return contrib
}

function calcClimateContribution(climate: ClimateAdjustmentResult): Record<FiveElement, number> {
  const contrib: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }

  if (climate.needsAdjustment) {
    for (const need of climate.needs) {
      contrib[need.element] += 80
    }
  } else {
    // 不需调候，各五行均匀
    for (const el of ALL_ELEMENTS) {
      contrib[el] = 20
    }
  }

  return contrib
}

function calcDiseaseContribution(disease: DiseaseMedicineResult): Record<FiveElement, number> {
  const contrib: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }

  if (disease.hasDisease) {
    for (const med of disease.medicines) {
      contrib[med.element] += 80
    }
  }

  return contrib
}

function calcTongGuanContribution(tongGuan: TongGuanResult): Record<FiveElement, number> {
  const contrib: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }

  if (tongGuan.tongGuanElement) {
    contrib[tongGuan.tongGuanElement] += 80
  }

  return contrib
}

function calcGeJuContribution(dayElement: FiveElement, strength: DayMasterStrengthResult): Record<FiveElement, number> {
  const contrib: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }

  // 格局用神的基础逻辑：
  // 身旺格：食伤生财路线
  // 身弱格：印比帮身路线
  if (strength.strengthScore >= 65) {
    contrib[GENERATE[dayElement]] = 60   // 食伤
    contrib[OVERCOME[dayElement]] = 50   // 财星
  } else if (strength.strengthScore < 45) {
    contrib[dayElement] = 60              // 比劫
    contrib[OVERCOME[OVERCOME[dayElement]]] = 50  // 印星
  } else {
    // 中和：看格局类型灵活处理
    contrib[GENERATE[dayElement]] = 30
    contrib[dayElement] = 30
  }

  return contrib
}
