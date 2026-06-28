/**
 * 五行旺衰规则引擎 V2
 * 基于月令权重、透干、藏干、通根、同党异党等因素计算五行力量
 */

import type { BaseRule, RuleContext, RuleResult } from './engine'
import type {
  SixLines,
  FiveElement,
  HeavenlyStem,
  EarthlyBranch,
  YinYang,
  WuXingWangShuai,
  CangGan,
} from '../types'

// ========== 类型定义 ==========

export interface WuXingContext extends RuleContext {
  sixLines: SixLines
  dayGan: HeavenlyStem
  dayElement: FiveElement
  dayYinYang: YinYang
  monthZhi: EarthlyBranch
  monthElement: FiveElement
  cangGanData: Record<EarthlyBranch, CangGan>
}

export interface StrengthBreakdown {
  yueLingWeight: number
  touGanWeight: number
  cangGanWeight: number
  tongGenDepth: number
  sameParty: number
  diffParty: number
  heHuaChongKe: number
}

export interface StrengthResult {
  strengthScore: number
  level: '极弱' | '偏弱' | '中和' | '偏强' | '极强'
  wangShuai: WuXingWangShuai
  fiveElementScores: Record<FiveElement, number>
  reasons: string[]
  matchedRules: string[]
  confidence: number
  breakdown: StrengthBreakdown
}

export interface WuXingRuleResult extends RuleResult {
  scoreAdjustment: number
  reason: string
}

export type WuXingRule = BaseRule<WuXingContext, WuXingRuleResult>

// ========== 基础数据 ==========

const STEM_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
}

const STEM_YINYANG: Record<HeavenlyStem, YinYang> = {
  甲: '阳', 丙: '阳', 戊: '阳', 庚: '阳', 壬: '阳',
  乙: '阴', 丁: '阴', 己: '阴', 辛: '阴', 癸: '阴',
}

const BRANCH_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木',
  辰: '土', 巳: '火', 午: '火', 未: '土',
  申: '金', 酉: '金', 戌: '土', 亥: '水',
}

const WANG_SHUAI_TABLE: Record<FiveElement, Record<FiveElement, WuXingWangShuai>> = {
  木: { 木: '旺', 火: '相', 土: '死', 金: '囚', 水: '休' },
  火: { 木: '休', 火: '旺', 土: '相', 金: '死', 水: '囚' },
  土: { 木: '死', 火: '囚', 土: '旺', 金: '相', 水: '休' },
  金: { 木: '囚', 火: '休', 土: '死', 金: '旺', 水: '相' },
  水: { 木: '相', 火: '死', 土: '囚', 金: '休', 水: '旺' },
}

const GENERATE: Record<FiveElement, FiveElement> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
}

const OVERCOME: Record<FiveElement, FiveElement> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
}

// ========== 辅助函数 ==========

function getGanElement(gan: HeavenlyStem): FiveElement {
  return STEM_ELEMENT[gan]
}

function getZhiElement(zhi: EarthlyBranch): FiveElement {
  return BRANCH_ELEMENT[zhi]
}

function getWangShuai(monthElement: FiveElement, dayElement: FiveElement): WuXingWangShuai {
  return WANG_SHUAI_TABLE[monthElement][dayElement]
}

function getSamePartyElements(dayElement: FiveElement): FiveElement[] {
  const yinElement = Object.entries(GENERATE).find(([_, v]) => v === dayElement)?.[0] as FiveElement
  return [dayElement, yinElement]
}

// ========== 五行分数计算 ==========

interface ElementScoreDetail {
  fromStems: number
  fromMonthBen: number
  fromMonthZhong: number
  fromMonthYao: number
  fromOtherBen: number
  fromOtherZhong: number
  fromOtherYao: number
  tongGenBen: number
  tongGenZhong: number
  tongGenYao: number
  total: number
}

function calculateElementScores(
  ctx: WuXingContext,
): Record<FiveElement, ElementScoreDetail> {
  const elements: FiveElement[] = ['木', '火', '土', '金', '水']
  const scores: Partial<Record<FiveElement, ElementScoreDetail>> = {}

  for (const el of elements) {
    scores[el] = {
      fromStems: 0,
      fromMonthBen: 0,
      fromMonthZhong: 0,
      fromMonthYao: 0,
      fromOtherBen: 0,
      fromOtherZhong: 0,
      fromOtherYao: 0,
      tongGenBen: 0,
      tongGenZhong: 0,
      tongGenYao: 0,
      total: 0,
    }
  }

  // 天干权重：每个天干 10 分
  const pillars = [ctx.sixLines.year, ctx.sixLines.month, ctx.sixLines.day, ctx.sixLines.hour]
  for (const pillar of pillars) {
    const ganEl = getGanElement(pillar.gan)
    scores[ganEl]!.fromStems += 10
  }

  // 月令权重：本气 20，中气 10，余气 5
  const monthCangGan = ctx.cangGanData[ctx.monthZhi]
  if (monthCangGan) {
    const benEl = getGanElement(monthCangGan.ben)
    scores[benEl]!.fromMonthBen += 20
    if (monthCangGan.zhong) {
      const zhongEl = getGanElement(monthCangGan.zhong)
      scores[zhongEl]!.fromMonthZhong += 10
    }
    if (monthCangGan.yao) {
      const yaoEl = getGanElement(monthCangGan.yao)
      scores[yaoEl]!.fromMonthYao += 5
    }
  }

  // 其他地支：本气 6，中气 3，余气 1
  for (const pillar of pillars) {
    if (pillar.zhi === ctx.monthZhi) continue
    const cangGan = ctx.cangGanData[pillar.zhi]
    if (!cangGan) continue

    const benEl = getGanElement(cangGan.ben)
    scores[benEl]!.fromOtherBen += 6
    if (cangGan.zhong) {
      const zhongEl = getGanElement(cangGan.zhong)
      scores[zhongEl]!.fromOtherZhong += 3
    }
    if (cangGan.yao) {
      const yaoEl = getGanElement(cangGan.yao)
      scores[yaoEl]!.fromOtherYao += 1
    }
  }

  // 通根加分：日主在地支中的根气
  const dayEl = ctx.dayElement
  for (const pillar of pillars) {
    const cangGan = ctx.cangGanData[pillar.zhi]
    if (!cangGan) continue

    if (getGanElement(cangGan.ben) === dayEl) {
      scores[dayEl]!.tongGenBen += 10
    } else if (cangGan.zhong && getGanElement(cangGan.zhong) === dayEl) {
      scores[dayEl]!.tongGenZhong += 5
    } else if (cangGan.yao && getGanElement(cangGan.yao) === dayEl) {
      scores[dayEl]!.tongGenYao += 2
    }
  }

  // 计算总分
  for (const el of elements) {
    const s = scores[el]!
    s.total = s.fromStems
      + s.fromMonthBen + s.fromMonthZhong + s.fromMonthYao
      + s.fromOtherBen + s.fromOtherZhong + s.fromOtherYao
      + s.tongGenBen + s.tongGenZhong + s.tongGenYao
  }

  return scores as Record<FiveElement, ElementScoreDetail>
}

// ========== 旺衰规则集 ==========

export const WUXING_RULES: WuXingRule[] = [
  // ===== 月令得令（最高优先级）=====
  {
    id: 'de-ling-wang',
    name: '得令旺',
    category: '月令',
    priority: 200,
    weight: 90,
    description: '日主五行与月令五行相同，得令而旺',
    reference: '《子平真诠》得令篇',
    condition: (ctx) => ctx.monthElement === ctx.dayElement,
    result: {
      scoreAdjustment: 15,
      reason: '日主得令，月令助力强旺',
    },
  },
  {
    id: 'de-ling-xiang',
    name: '得令相',
    category: '月令',
    priority: 190,
    weight: 70,
    description: '日主五行为月令所生，得令相气',
    reference: '《子平真诠》旺相休囚死篇',
    condition: (ctx) => {
      const shengWo = Object.entries(GENERATE).find(([_, v]) => v === ctx.dayElement)?.[0] as FiveElement
      return ctx.monthElement === shengWo
    },
    result: {
      scoreAdjustment: 8,
      reason: '日主得月令生扶，为相气',
    },
  },
  {
    id: 'shi-ling-si',
    name: '失令死',
    category: '月令',
    priority: 180,
    weight: 80,
    description: '日主五行被月令克制，失令而死',
    reference: '《子平真诠》旺相休囚死篇',
    condition: (ctx) => OVERCOME[ctx.monthElement] === ctx.dayElement,
    result: {
      scoreAdjustment: -12,
      reason: '日主被月令克制，失令衰弱',
    },
  },
  {
    id: 'shi-ling-qiu',
    name: '失令囚',
    category: '月令',
    priority: 170,
    weight: 60,
    description: '日主五行克制月令，失令而囚',
    reference: '《子平真诠》旺相休囚死篇',
    condition: (ctx) => OVERCOME[ctx.dayElement] === ctx.monthElement,
    result: {
      scoreAdjustment: -6,
      reason: '日主克制月令，耗力而囚',
    },
  },

  // ===== 透干规则 =====
  {
    id: 'tou-gan-duoge',
    name: '透干多',
    category: '透干',
    priority: 150,
    weight: 75,
    description: '天干中同五行出现3个及以上',
    reference: '《滴天髓》透干篇',
    condition: (ctx) => {
      const pillars = [ctx.sixLines.year, ctx.sixLines.month, ctx.sixLines.day, ctx.sixLines.hour]
      let count = 0
      for (const p of pillars) {
        if (getGanElement(p.gan) === ctx.dayElement) count++
      }
      return count >= 3
    },
    result: {
      scoreAdjustment: 10,
      reason: '天干透干多，助力强劲',
    },
  },
  {
    id: 'tou-gan-shuang',
    name: '双透干',
    category: '透干',
    priority: 140,
    weight: 60,
    description: '天干中同五行出现2个',
    reference: '《滴天髓》透干篇',
    condition: (ctx) => {
      const pillars = [ctx.sixLines.year, ctx.sixLines.month, ctx.sixLines.day, ctx.sixLines.hour]
      let count = 0
      for (const p of pillars) {
        if (getGanElement(p.gan) === ctx.dayElement) count++
      }
      return count === 2
    },
    result: {
      scoreAdjustment: 5,
      reason: '天干双透，助力有加',
    },
  },

  // ===== 通根规则 =====
  {
    id: 'tong-gen-benqi-duoge',
    name: '本气根多',
    category: '通根',
    priority: 160,
    weight: 85,
    description: '地支中有2个及以上本气根',
    reference: '《滴天髓》通根篇',
    condition: (ctx) => {
      const pillars = [ctx.sixLines.year, ctx.sixLines.month, ctx.sixLines.day, ctx.sixLines.hour]
      let count = 0
      for (const p of pillars) {
        const cang = ctx.cangGanData[p.zhi]
        if (cang && getGanElement(cang.ben) === ctx.dayElement) count++
      }
      return count >= 2
    },
    result: {
      scoreAdjustment: 12,
      reason: '本气根多，根基深厚',
    },
  },
  {
    id: 'tong-gen-benqi-yi',
    name: '本气根一',
    category: '通根',
    priority: 155,
    weight: 70,
    description: '地支中有1个本气根',
    reference: '《滴天髓》通根篇',
    condition: (ctx) => {
      const pillars = [ctx.sixLines.year, ctx.sixLines.month, ctx.sixLines.day, ctx.sixLines.hour]
      let count = 0
      for (const p of pillars) {
        const cang = ctx.cangGanData[p.zhi]
        if (cang && getGanElement(cang.ben) === ctx.dayElement) count++
      }
      return count === 1
    },
    result: {
      scoreAdjustment: 6,
      reason: '有本气根，根基扎实',
    },
  },
  {
    id: 'tong-gen-zhongqi',
    name: '中气根',
    category: '通根',
    priority: 150,
    weight: 50,
    description: '地支中有中气根但无本气根',
    reference: '《滴天髓》通根篇',
    condition: (ctx) => {
      const pillars = [ctx.sixLines.year, ctx.sixLines.month, ctx.sixLines.day, ctx.sixLines.hour]
      let hasBen = false
      let hasZhong = false
      for (const p of pillars) {
        const cang = ctx.cangGanData[p.zhi]
        if (!cang) continue
        if (getGanElement(cang.ben) === ctx.dayElement) {
          hasBen = true
          break
        }
        if (cang.zhong && getGanElement(cang.zhong) === ctx.dayElement) {
          hasZhong = true
        }
      }
      return !hasBen && hasZhong
    },
    result: {
      scoreAdjustment: 3,
      reason: '有中气根，略有根基',
    },
  },
  {
    id: 'wu-gen',
    name: '无根',
    category: '通根',
    priority: 145,
    weight: 75,
    description: '地支中无任何根气（本气、中气、余气均无）',
    reference: '《滴天髓》通根篇',
    condition: (ctx) => {
      const pillars = [ctx.sixLines.year, ctx.sixLines.month, ctx.sixLines.day, ctx.sixLines.hour]
      for (const p of pillars) {
        const cang = ctx.cangGanData[p.zhi]
        if (!cang) continue
        if (getGanElement(cang.ben) === ctx.dayElement) return false
        if (cang.zhong && getGanElement(cang.zhong) === ctx.dayElement) return false
        if (cang.yao && getGanElement(cang.yao) === ctx.dayElement) return false
      }
      return true
    },
    result: {
      scoreAdjustment: -10,
      reason: '地支无根，虚浮无力',
    },
  },

  // ===== 同党异党规则 =====
  {
    id: 'tong-dang-jue-duo',
    name: '同党极多',
    category: '同党异党',
    priority: 130,
    weight: 80,
    description: '同党（比劫+印星）数量远多于异党',
    reference: '《子平真诠》衰旺篇',
    condition: (ctx) => {
      const sameParty = getSamePartyElements(ctx.dayElement)
      let sameCount = 0
      let diffCount = 0
      const pillars = [ctx.sixLines.year, ctx.sixLines.month, ctx.sixLines.day, ctx.sixLines.hour]
      for (const p of pillars) {
        const ganEl = getGanElement(p.gan)
        if (sameParty.includes(ganEl)) sameCount++
        else diffCount++
      }
      return sameCount - diffCount >= 2
    },
    result: {
      scoreAdjustment: 8,
      reason: '同党势众，助力强大',
    },
  },
  {
    id: 'yi-dang-jue-duo',
    name: '异党极多',
    category: '同党异党',
    priority: 125,
    weight: 80,
    description: '异党（财官食伤）数量远多于同党',
    reference: '《子平真诠》衰旺篇',
    condition: (ctx) => {
      const sameParty = getSamePartyElements(ctx.dayElement)
      let sameCount = 0
      let diffCount = 0
      const pillars = [ctx.sixLines.year, ctx.sixLines.month, ctx.sixLines.day, ctx.sixLines.hour]
      for (const p of pillars) {
        const ganEl = getGanElement(p.gan)
        if (sameParty.includes(ganEl)) sameCount++
        else diffCount++
      }
      return diffCount - sameCount >= 2
    },
    result: {
      scoreAdjustment: -8,
      reason: '异党势众，克泄交加',
    },
  },

  // ===== 合化冲克规则（简化版）=====
  {
    id: 'wu-he-hua-shen',
    name: '五合化神',
    category: '合化冲克',
    priority: 110,
    weight: 60,
    description: '日主与月干或时干五合，且月令为化神',
    reference: '《三命通会》五合篇',
    condition: (ctx) => {
      const heCombos: Partial<Record<HeavenlyStem, { pair: HeavenlyStem; hua: FiveElement }>> = {
        甲: { pair: '己', hua: '土' },
        己: { pair: '甲', hua: '土' },
        乙: { pair: '庚', hua: '金' },
        庚: { pair: '乙', hua: '金' },
        丙: { pair: '辛', hua: '水' },
        辛: { pair: '丙', hua: '水' },
        丁: { pair: '壬', hua: '木' },
        壬: { pair: '丁', hua: '木' },
        戊: { pair: '癸', hua: '火' },
        癸: { pair: '戊', hua: '火' },
      }
      const combo = heCombos[ctx.dayGan]
      if (!combo) return false
      const monthGan = ctx.sixLines.month.gan
      const hourGan = ctx.sixLines.hour.gan
      if (monthGan !== combo.pair && hourGan !== combo.pair) return false
      return ctx.monthElement === combo.hua
    },
    result: {
      scoreAdjustment: 5,
      reason: '天干五合得化，化神有助',
    },
  },
]

// ========== 核心计算函数 ==========

/**
 * 计算日主旺衰 V2 版本
 * 基于规则引擎和分项得分计算
 */
export function calculateStrengthV2(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  monthZhi: EarthlyBranch,
  cangGanData: Record<EarthlyBranch, CangGan>,
): StrengthResult {
  const dayElement = getGanElement(dayGan)
  const dayYinYang = STEM_YINYANG[dayGan]
  const monthElement = getZhiElement(monthZhi)
  const wangShuai = getWangShuai(monthElement, dayElement)

  const ctx: WuXingContext = {
    sixLines,
    dayGan,
    dayElement,
    dayYinYang,
    monthZhi,
    monthElement,
    cangGanData,
  }

  // 1. 计算各五行基础分数
  const elementScores = calculateElementScores(ctx)
  const fiveElementScores: Record<FiveElement, number> = {
    木: elementScores.木.total,
    火: elementScores.火.total,
    土: elementScores.土.total,
    金: elementScores.金.total,
    水: elementScores.水.total,
  }

  // 2. 计算日主基础得分
  const dayScore = elementScores[dayElement]

  // 3. 执行规则引擎，获取分数调整
  const matchedRules: string[] = []
  const reasons: string[] = []
  let ruleAdjustment = 0
  let totalWeight = 0

  const sortedRules = [...WUXING_RULES].sort((a, b) => b.priority - a.priority)
  for (const rule of sortedRules) {
    try {
      if (rule.condition(ctx)) {
        matchedRules.push(rule.name)
        reasons.push(rule.result.reason)
        ruleAdjustment += rule.result.scoreAdjustment * (rule.weight / 100)
        totalWeight += rule.weight
      }
    } catch (_e) {
      // 跳过错误规则
    }
  }

  // 4. 计算分项得分
  const breakdown: StrengthBreakdown = {
    yueLingWeight: dayScore.fromMonthBen + dayScore.fromMonthZhong + dayScore.fromMonthYao,
    touGanWeight: dayScore.fromStems,
    cangGanWeight: dayScore.fromOtherBen + dayScore.fromOtherZhong + dayScore.fromOtherYao,
    tongGenDepth: dayScore.tongGenBen + dayScore.tongGenZhong + dayScore.tongGenYao,
    sameParty: 0,
    diffParty: 0,
    heHuaChongKe: 0,
  }

  // 计算同党异党调整
  const samePartyEls = getSamePartyElements(dayElement)
  let samePartyScore = 0
  let diffPartyScore = 0
  const pillars = [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]
  for (const p of pillars) {
    const ganEl = getGanElement(p.gan)
    if (samePartyEls.includes(ganEl)) {
      samePartyScore += 10
    } else {
      diffPartyScore += 10
    }
  }
  breakdown.sameParty = samePartyScore > diffPartyScore ? (samePartyScore - diffPartyScore) * 0.5 : 0
  breakdown.diffParty = diffPartyScore > samePartyScore ? -(diffPartyScore - samePartyScore) * 0.5 : 0

  // 合化冲克调整（从规则中提取）
  for (const rule of sortedRules) {
    if (rule.category === '合化冲克' && matchedRules.includes(rule.name)) {
      breakdown.heHuaChongKe += rule.result.scoreAdjustment
    }
  }

  // 5. 归一化到 0-100
  // 理论最高分：天干40 + 月令35 + 其他地支24 + 通根40 = 约139
  // 基准分 50 为中和，上下浮动
  const maxTheoretical = 140
  const baseScore = (dayScore.total / maxTheoretical) * 60 + 20

  // 加上规则调整
  let finalScore = baseScore + ruleAdjustment

  // 加入旺相休囚死调整
  const wangShuaiAdjust: Record<WuXingWangShuai, number> = {
    旺: 10,
    相: 5,
    休: 0,
    囚: -5,
    死: -10,
  }
  finalScore += wangShuaiAdjust[wangShuai]

  // 确保在 0-100 范围内
  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)))

  // 6. 判断等级
  let level: StrengthResult['level']
  if (finalScore < 20) {
    level = '极弱'
  } else if (finalScore < 40) {
    level = '偏弱'
  } else if (finalScore < 60) {
    level = '中和'
  } else if (finalScore < 80) {
    level = '偏强'
  } else {
    level = '极强'
  }

  // 7. 计算可信度
  const confidence = Math.min(100, 50 + Math.round(totalWeight / WUXING_RULES.length * 50))

  return {
    strengthScore: finalScore,
    level,
    wangShuai,
    fiveElementScores,
    reasons,
    matchedRules,
    confidence,
    breakdown,
  }
}
