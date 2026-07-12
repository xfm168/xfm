/**
 * PatternValidator — P2-3 格局校验器
 * 
 * 在 gejuRules.ts 已有成格/真格/破格/清纯规则基础上，
 * 构建统一的五星评级和100分制评分系统。
 * 
 * 评级维度：
 *   1. 格局完整度（是否真格、成格验证通过）
 *   2. 月令得气（得令/透干/通根）
 *   3. 清纯度（无官杀混杂、无刑冲破害）
 *   4. 十神配合（格局用神是否到位）
 *   5. 调候完成度（寒暖适中）
 * 
 * 星级输出：
 *   ★★★★★ 极品（90+）
 *   ★★★★  上等（75-89）
 *   ★★★   中等（60-74）
 *   ★★    普通（45-59）
 *   ★     破格（<45）
 */

import type { FiveElement } from '../../types'
import type { GeJuResult } from '../rules/gejuRules'
import type { DayMasterStrengthResult } from './dayMasterStrengthEngine'
import type { ClimateAdjustmentResult } from './climateAdjustmentEngine'
import type { DiseaseMedicineResult } from './diseaseMedicineEngine'

// ─── 类型定义 ───

export type PatternStarLevel = 5 | 4 | 3 | 2 | 1
export type PatternRank = '极品' | '上等' | '中等' | '普通' | '破格'

export interface PatternValidationDimension {
  name: string
  score: number      // 0-100
  weight: number      // 权重
  weightedScore: number
  reason: string
}

export interface PatternValidationResult {
  /** 总分 0-100 */
  totalScore: number
  /** 星级 1-5 */
  starLevel: PatternStarLevel
  /** 等级名称 */
  rank: PatternRank
  /** 是否破格 */
  isPoGe: boolean
  /** 是否真格 */
  isZhenGe: boolean
  /** 破格原因 */
  poGeReasons: string[]
  /** 格局缺陷 */
  defects: string[]
  /** 格局优势 */
  strengths: string[]
  /** 各维度评分 */
  dimensions: PatternValidationDimension[]
  /** 格局评分描述 */
  description: string
  /** 古籍引用 */
  classicalQuote: string
}

// ─── 核心引擎 ───

export function validatePattern(
  geJu: GeJuResult,
  strength: DayMasterStrengthResult,
  climate: ClimateAdjustmentResult,
  disease: DiseaseMedicineResult,
): PatternValidationResult {
  const dimensions: PatternValidationDimension[] = []
  const defects: string[] = []
  const strengths: string[] = []
  const poGeReasons: string[] = []

  // ─── 维度①：格局完整度（权重 30%） ───
  const integrity = calcIntegrity(geJu, strengths, defects, poGeReasons)
  dimensions.push(integrity)

  // ─── 维度②：月令得气（权重 25%） ───
  const yueLing = calcYueLingQi(geJu, strength, strengths, defects)
  dimensions.push(yueLing)

  // ─── 维度③：清纯度（权重 20%） ───
  const purity = calcPurity(geJu, strengths, defects)
  dimensions.push(purity)

  // ─── 维度④：十神配合（权重 15%） ───
  const shiShen = calcShiShenMatch(geJu, strength, strengths, defects)
  dimensions.push(shiShen)

  // ─── 维度⑤：调候+病药完成度（权重 10%） ───
  const tiaoHou = calcTiaoHouBingYao(climate, disease, strengths, defects)
  dimensions.push(tiaoHou)

  // 综合评分
  const totalScore = Math.round(Math.min(100, Math.max(0,
    dimensions.reduce((sum, d) => sum + d.weightedScore, 0)
  )))

  // 星级和等级
  const { starLevel, rank, description } = determineStarRank(totalScore, geJu.poGe)

  // 是否真格
  const isZhenGe = geJu.matchedRules.some(r => r.includes('真'))

  return {
    totalScore,
    starLevel,
    rank,
    isPoGe: geJu.poGe,
    isZhenGe,
    poGeReasons,
    defects,
    strengths,
    dimensions,
    description,
    classicalQuote: geJu.caseReference?.originalText ||
      '《子平真诠》论格局："成格必有真机，破格必有实据。格之成败，关乎一生穷通。"',
  }
}

// ─── 维度计算函数 ───

function calcIntegrity(
  geJu: GeJuResult,
  strengths: string[],
  defects: string[],
  poGeReasons: string[],
): PatternValidationDimension {
  let score = 50  // 基础分

  // 真格加分
  if (geJu.matchedRules.some(r => r.includes('真'))) {
    score += 20
    strengths.push('真格成格')
  }

  // 成格验证通过加分
  if (geJu.matchedRules.some(r => r.includes('成格'))) {
    score += 15
    strengths.push('成格验证通过')
  }

  // 上格加分
  if (geJu.matchedRules.some(r => r.includes('上格'))) {
    score += 15
    strengths.push('格局上等')
  }

  // 破格扣分
  if (geJu.poGe) {
    score -= 25
    if (geJu.poGeReason) {
      poGeReasons.push(geJu.poGeReason)
      defects.push(`破格：${geJu.poGeReason}`)
    }
  }

  // 破格原因扣分
  for (const r of geJu.matchedRules) {
    if (r.includes('破格') || r.includes('poge')) {
      score -= 10
    }
    if (r.includes('混杂') || r.includes('不清')) {
      score -= 8
      defects.push('格局混杂不清')
    }
  }

  // 下格/败格扣分
  if (geJu.grade === '败格') score -= 20
  if (geJu.grade === '下格') score -= 10

  score = Math.max(0, Math.min(100, score))

  return {
    name: '格局完整度',
    score,
    weight: 0.30,
    weightedScore: score * 0.30,
    reason: score >= 80 ? '真格成格，格局完整度高' :
      score >= 60 ? '格局基本成立，但略有瑕疵' :
      score >= 40 ? '格局有缺陷，需化解' : '格局破败严重',
  }
}

function calcYueLingQi(
  geJu: GeJuResult,
  strength: DayMasterStrengthResult,
  strengths: string[],
  defects: string[],
): PatternValidationDimension {
  let score = 50

  // 得令加分
  if (strength.deLing) {
    score += 20
    strengths.push('月令得令')
  } else {
    score -= 10
    defects.push('月令失令')
  }

  // 通根加分
  if (strength.deDi) {
    score += 15
    strengths.push('格局通根')
  } else {
    score -= 10
    defects.push('格局无根')
  }

  // 透干加分
  if (strength.touGan) {
    score += 10
    strengths.push('格局透干')
  }

  score = Math.max(0, Math.min(100, score))

  return {
    name: '月令得气',
    score,
    weight: 0.25,
    weightedScore: score * 0.25,
    reason: score >= 80 ? '得令得地，月令有力' :
      score >= 60 ? '月令得气尚可' : '月令失令失气',
  }
}

function calcPurity(
  geJu: GeJuResult,
  strengths: string[],
  defects: string[],
): PatternValidationDimension {
  let score = 70  // 基础清纯分

  // pureScore 已有，直接参考
  score = Math.round(geJu.pureScore * 0.6 + 40)  // 映射到合理范围

  // 官杀混杂扣分
  if (geJu.matchedRules.some(r => r.includes('混杂') || r.includes('官杀'))) {
    score -= 15
    defects.push('官杀混杂不清')
  }

  // 冲突格局扣分
  if (geJu.conflictGeJu.length > 0) {
    score -= 10 * geJu.conflictGeJu.length
    defects.push(`有${geJu.conflictGeJu.length}个冲突格`)
  }

  // 副格太多扣分
  if (geJu.assistGeJu.length > 2) {
    score -= 10
    defects.push('副格过多，格局不清')
  }

  score = Math.max(0, Math.min(100, score))

  if (score >= 80) strengths.push('格局清纯')
  else if (score < 50) defects.push('格局驳杂')

  return {
    name: '清纯度',
    score,
    weight: 0.20,
    weightedScore: score * 0.20,
    reason: score >= 80 ? '格局清纯不杂' :
      score >= 60 ? '格局基本清纯' : '格局驳杂，清纯度不足',
  }
}

function calcShiShenMatch(
  geJu: GeJuResult,
  strength: DayMasterStrengthResult,
  strengths: string[],
  defects: string[],
): PatternValidationDimension {
  let score = 50

  // 检查格局用神是否到位
  const hasSpecialPattern = geJu.matchedRules.some(r =>
    r.includes('食神制杀') || r.includes('杀印相生') ||
    r.includes('伤官佩印') || r.includes('财官双美') ||
    r.includes('食伤生财') || r.includes('官印相生')
  )

  if (hasSpecialPattern) {
    score += 30
    strengths.push('十神配合精妙')
  }

  // 贵气加分
  if (geJu.nobilityScore >= 60) {
    score += 15
    strengths.push('贵气充足')
  }

  // 富气加分
  if (geJu.wealthScore >= 60) {
    score += 10
    strengths.push('富气较旺')
  }

  // 破格扣分
  if (geJu.poGe) {
    score -= 15
    defects.push('格局破败，十神配合失衡')
  }

  score = Math.max(0, Math.min(100, score))

  return {
    name: '十神配合',
    score,
    weight: 0.15,
    weightedScore: score * 0.15,
    reason: score >= 80 ? '十神配合精妙，用神到位' :
      score >= 60 ? '十神配合尚可' : '十神配合不佳',
  }
}

function calcTiaoHouBingYao(
  climate: ClimateAdjustmentResult,
  disease: DiseaseMedicineResult,
  strengths: string[],
  defects: string[],
): PatternValidationDimension {
  let score = 60

  // 调候不需要 = 好事
  if (!climate.needsAdjustment) {
    score += 20
    strengths.push('调候适中')
  } else {
    score -= 10
    defects.push('需要调候')
  }

  // 无大病加分
  if (!disease.hasDisease) {
    score += 15
    strengths.push('五行平衡无大病')
  } else {
    score -= 5 * Math.min(disease.diseases.length, 3)
  }

  score = Math.max(0, Math.min(100, score))

  return {
    name: '调候+病药完成度',
    score,
    weight: 0.10,
    weightedScore: score * 0.10,
    reason: score >= 80 ? '寒暖适中，五行调和' :
      score >= 60 ? '基本调和' : '需要调候或病药化解',
  }
}

// ─── 星级/等级判定 ───

function determineStarRank(totalScore: number, isPoGe: boolean): {
  starLevel: PatternStarLevel
  rank: PatternRank
  description: string
} {
  // poGe 是扣分因素（已在维度中扣分），但不强制判定为破格
  // 仅当综合评分极低时才判定破格
  if (totalScore < 40) {
    return {
      starLevel: 1,
      rank: '破格',
      description: `格局评分${totalScore}分，格局破败，需化解后论命。`,
    }
  }
  // poGe 且评分不高，降一星
  if (isPoGe && totalScore < 55) {
    return {
      starLevel: 1,
      rank: '破格',
      description: `格局评分${totalScore}分，格局破败，需化解后论命。`,
    }
  }
  // poGe 但评分中等，最高★★★
  if (isPoGe && totalScore < 70) {
    return {
      starLevel: 2,
      rank: '普通',
      description: `格局评分${totalScore}分，格局有破，但仍有可取之处。`,
    }
  }
  // poGe 但评分较高，最高★★★★
  if (isPoGe && totalScore >= 70) {
    const desc = totalScore >= 85
      ? `格局评分${totalScore}分，虽有小破，格局仍佳。`
      : `格局评分${totalScore}分，格局有破，但基本成立。`
    return {
      starLevel: totalScore >= 85 ? 4 : 3,
      rank: totalScore >= 85 ? '上等' : '中等',
      description: desc,
    }
  }
  if (totalScore >= 90) {
    return {
      starLevel: 5,
      rank: '极品',
      description: `格局评分${totalScore}分，★★★★★极品格局，格局清纯、十神配合精妙，主大贵之命。`,
    }
  }
  if (totalScore >= 75) {
    return {
      starLevel: 4,
      rank: '上等',
      description: `格局评分${totalScore}分，★★★★上等格局，格局基本清纯，用神到位，主富贵之命。`,
    }
  }
  if (totalScore >= 60) {
    return {
      starLevel: 3,
      rank: '中等',
      description: `格局评分${totalScore}分，★★★中等格局，格局有瑕疵但可化解，主小康之命。`,
    }
  }
  if (totalScore >= 45) {
    return {
      starLevel: 2,
      rank: '普通',
      description: `格局评分${totalScore}分，★★普通格局，格局缺陷较多，需注意化解。`,
    }
  }
  return {
    starLevel: 1,
    rank: '破格',
    description: `格局评分${totalScore}分，格局破败严重，需化解后论命。`,
  }
}
