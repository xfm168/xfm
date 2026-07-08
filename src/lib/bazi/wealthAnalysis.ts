import type { SixLines, HeavenlyStem, EarthlyBranch, ShenShi, FiveElement } from './types'
import type { ShenShiAnalysisResult } from './shishenAnalysis'
import type { DaYunAnalysisResult } from './dayunAnalysis'
import type { LiuNianAnalysisResult } from './liunianAnalysis'
import type { GeJuResult } from './geju'

export interface WealthShiShen {
  name: ShenShi
  power: number
  description: string
}

export interface CaiKu {
  hasCaiKu: boolean
  caiKuZhi: EarthlyBranch | null
  description: string
}

export interface WealthRiskYear {
  year: number
  ganZhi: string
  riskType: string
  level: 'high' | 'medium' | 'low'
  description: string
}

export interface InvestmentDirection {
  direction: string
  score: number
  reason: string
  suitable: boolean
}

export interface WealthAnalysisResult {
  score: number
  zhengCai: WealthShiShen | null
  pianCai: WealthShiShen | null
  caiKu: CaiKu
  louCai: boolean
  poCai: boolean
  moneyMakingStyle: string
  riskYears: WealthRiskYear[]
  investmentDirections: InvestmentDirection[]
  suggestions: string[]
  summary: string
}

const CAIS: ShenShi[] = ['正财', '偏财']

const CAI_KU_MAP: Record<EarthlyBranch, string> = {
  '子': '',
  '丑': '金库',
  '寅': '',
  '卯': '',
  '辰': '水库',
  '巳': '',
  '午': '',
  '未': '木库',
  '申': '',
  '酉': '',
  '戌': '火库',
  '亥': '',
}

function getCaiElement(cai: ShenShi, dayGan: HeavenlyStem): FiveElement {
  const dayEl = getDayElement(dayGan)
  const overcome: Record<FiveElement, FiveElement> = {
    '木': '土', '土': '水', '水': '火', '火': '金', '金': '木'
  }
  return overcome[dayEl]
}

function getDayElement(gan: HeavenlyStem): FiveElement {
  const map: Record<HeavenlyStem, FiveElement> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
  }
  return map[gan]
}

function analyzeZhengCai(shenShiAnalysis: ShenShiAnalysisResult): WealthShiShen | null {
  const zc = shenShiAnalysis.details.find(d => d.name === '正财')
  if (!zc || zc.power <= 0) return null
  return {
    name: '正财',
    power: zc.power,
    description: zc.power > 50
      ? '正财有力，财源稳定，适合踏实工作积累财富。'
      : '正财一般，收入来源较单一，需开拓多元收入。'
  }
}

function analyzePianCai(shenShiAnalysis: ShenShiAnalysisResult): WealthShiShen | null {
  const pc = shenShiAnalysis.details.find(d => d.name === '偏财')
  if (!pc || pc.power <= 0) return null
  return {
    name: '偏财',
    power: pc.power,
    description: pc.power > 50
      ? '偏财有力，投资眼光好，容易获得意外之财。'
      : '偏财一般，投资需谨慎，不宜高风险操作。'
  }
}

function analyzeCaiKu(sixLines: SixLines, dayGan: HeavenlyStem): CaiKu {
  const caiElement = getCaiElement('正财', dayGan)
  const kuMap: Record<FiveElement, { zhi: EarthlyBranch; desc: string }> = {
    '木': { zhi: '未', desc: '木库在未' },
    '火': { zhi: '戌', desc: '火库在戌' },
    '土': { zhi: '辰', desc: '水库在辰（土以水为财）' },
    '金': { zhi: '丑', desc: '金库在丑' },
    '水': { zhi: '辰', desc: '水库在辰' },
  }
  const ku = kuMap[caiElement]

  const allZhi = [sixLines.year.zhi, sixLines.month.zhi, sixLines.day.zhi, sixLines.hour.zhi]
  const hasKu = allZhi.includes(ku.zhi)

  return {
    hasCaiKu: hasKu,
    caiKuZhi: hasKu ? ku.zhi : null,
    description: hasKu
      ? `命带财库（${ku.zhi}），能聚财守财，财富积累能力强。`
      : `命中无财库（${ku.zhi}），财来财去，需注意理财储蓄。`
  }
}

function analyzeLouCai(shenShiAnalysis: ShenShiAnalysisResult): boolean {
  const biJie = shenShiAnalysis.details.find(d => d.name === '比肩' || d.name === '劫财')
  if (!biJie) return false
  // 比劫旺则容易漏财
  return biJie.power > 60
}

function analyzePoCai(shenShiAnalysis: ShenShiAnalysisResult, sixLines: SixLines): boolean {
  // 看是否有冲克财星的情况
  const cai = shenShiAnalysis.details.find(d => d.name === '正财' || d.name === '偏财')
  if (!cai) return false
  // 财星被严重克制（如财星所在柱被冲）
  return cai.power < 20 && analyzeLouCai(shenShiAnalysis)
}

function determineMoneyMakingStyle(
  zhengCai: WealthShiShen | null,
  pianCai: WealthShiShen | null,
  hasCaiKu: boolean
): string {
  let parts: string[] = []

  if (zhengCai && zhengCai.power > 50) {
    parts.push('正财为主，适合通过稳定工作或专业技能获取收入。')
  }
  if (pianCai && pianCai.power > 50) {
    parts.push('偏财有力，可适当进行投资理财、副业经营增加收入。')
  }
  if (!zhengCai && !pianCai) {
    parts.push('财星较弱，赚钱需靠技术或服务，不宜投机。')
  }
  if (hasCaiKu) {
    parts.push('命带财库，聚财能力强，适合长期储蓄和稳健投资。')
  } else {
    parts.push('无财库，需注意控制开支，避免不必要的消费。')
  }

  return parts.join('')
}

function analyzeRiskYears(
  liuNian: LiuNianAnalysisResult,
  shenShiAnalysis: ShenShiAnalysisResult
): WealthRiskYear[] {
  const risks: WealthRiskYear[] = []

  for (const year of liuNian.years.slice(0, 30)) {
    let riskLevel: 'high' | 'medium' | 'low' | null = null
    let riskType = ''
    let desc = ''

    // 比劫年容易破财
    if (year.shenShi.gan === '比肩' || year.shenShi.gan === '劫财') {
      riskLevel = 'high'
      riskType = '比劫夺财'
      desc = '比劫之年易破财，不宜借贷或大额投资。'
    }
    // 冲太岁年
    if (year.chong.length > 0) {
      riskLevel = riskLevel || 'medium'
      riskType = riskType || '冲太岁'
      desc = desc || '流年冲克，财务波动较大，需谨慎理财。'
    }
    // 偏官/七杀年压力大
    if (year.shenShi.gan === '偏官' && !riskLevel) {
      riskLevel = 'medium'
      riskType = '偏官压身'
      desc = '偏官之年压力大，开支增加，需预留应急资金。'
    }

    if (riskLevel) {
      risks.push({
        year: year.year,
        ganZhi: `${year.ganZhi.gan}${year.ganZhi.zhi}`,
        riskType,
        level: riskLevel,
        description: desc
      })
    }
  }

  return risks.slice(0, 8)
}

function analyzeInvestmentDirections(
  zhengCai: WealthShiShen | null,
  pianCai: WealthShiShen | null,
  hasCaiKu: boolean,
  shenShiAnalysis: ShenShiAnalysisResult
): InvestmentDirection[] {
  const directions: InvestmentDirection[] = []

  // 稳健理财
  const stableScore = (zhengCai?.power || 0) + (hasCaiKu ? 20 : 0)
  directions.push({
    direction: '稳健理财（储蓄/国债/定期）',
    score: Math.min(95, stableScore + 40),
    reason: zhengCai ? '正财有力，适合稳健型投资' : '财星一般，稳健为上',
    suitable: stableScore >= 40
  })

  // 股票投资
  const stockScore = (pianCai?.power || 0) + (hasCaiKu ? 10 : 0)
  directions.push({
    direction: '股票投资',
    score: Math.min(95, stockScore + 30),
    reason: pianCai ? '偏财有力，可适当参与股市' : '偏财较弱，股市风险大',
    suitable: stockScore >= 40
  })

  // 房产投资
  const houseScore = (zhengCai?.power || 0) + (hasCaiKu ? 25 : 0)
  directions.push({
    direction: '房产/不动产',
    score: Math.min(95, houseScore + 35),
    reason: hasCaiKu ? '命带财库，不动产能聚财' : '可考虑房产作为保值手段',
    suitable: houseScore >= 40
  })

  // 副业/创业
  const bizScore = (pianCai?.power || 0) + ((zhengCai?.power || 0) * 0.5)
  directions.push({
    direction: '副业/创业',
    score: Math.min(95, bizScore + 30),
    reason: pianCai && zhengCai ? '正偏财皆旺，适合多元收入' : '需谨慎评估风险',
    suitable: bizScore >= 45
  })

  // 基金定投
  const fundScore = ((zhengCai?.power || 0) + (pianCai?.power || 0)) * 0.5 + (hasCaiKu ? 15 : 0)
  directions.push({
    direction: '基金定投',
    score: Math.min(95, fundScore + 35),
    reason: '基金定投适合大多数命局，分散风险',
    suitable: fundScore >= 30
  })

  return directions.sort((a, b) => b.score - a.score)
}

function generateWealthSuggestions(
  zhengCai: WealthShiShen | null,
  pianCai: WealthShiShen | null,
  louCai: boolean,
  poCai: boolean,
  hasCaiKu: boolean
): string[] {
  const suggestions: string[] = []

  if (zhengCai && zhengCai.power > 50) {
    suggestions.push('正财有力，本职工作收入稳定，应专注于提升专业技能。')
  }
  if (pianCai && pianCai.power > 50) {
    suggestions.push('偏财有力，可适当进行副业或投资理财，但需控制风险。')
  }
  if (louCai) {
    suggestions.push('比劫旺易漏财，避免借钱给他人，合伙需谨慎。')
    suggestions.push('建议购买保险或进行强制储蓄，防止意外破财。')
  }
  if (poCai) {
    suggestions.push('财星受克严重，投资需极度谨慎，不宜大额借贷。')
  }
  if (hasCaiKu) {
    suggestions.push('命带财库，适合长期储蓄和稳健投资，财富会逐步积累。')
  } else {
    suggestions.push('命中无财库，建议养成记账习惯，控制非必要开支。')
  }
  if (!zhengCai && !pianCai) {
    suggestions.push('财星较弱，赚钱需靠技术和努力，不宜投机取巧。')
  }
  suggestions.push('把握大运中财星旺的年份，是积累财富的关键时机。')

  return suggestions
}

function generateWealthSummary(
  score: number,
  zhengCai: WealthShiShen | null,
  pianCai: WealthShiShen | null,
  hasCaiKu: boolean
): string {
  const parts: string[] = []
  parts.push(`财富综合评分${score}分。`)

  if (zhengCai && pianCai) {
    parts.push('正偏财皆旺，财源广进，既有稳定收入也有投资机会。')
  } else if (zhengCai) {
    parts.push('以正财为主，适合踏实工作，靠专业技能获取财富。')
  } else if (pianCai) {
    parts.push('以偏财为主，投资眼光好，但需注意风险控制。')
  } else {
    parts.push('财星较弱，赚钱需付出更多努力，不宜投机取巧。')
  }

  if (hasCaiKu) {
    parts.push('命带财库，聚财守财能力强。')
  }

  if (score >= 80) {
    parts.push('财富运势较旺，把握机遇可获丰厚回报。')
  } else if (score >= 60) {
    parts.push('财富有积累空间，需合理规划理财。')
  } else {
    parts.push('财富积累需循序渐进，稳扎稳打为上策。')
  }

  return parts.join('')
}

export function analyzeWealth(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  shenShiAnalysis: ShenShiAnalysisResult,
  liuNian: LiuNianAnalysisResult,
  geJu: GeJuResult
): WealthAnalysisResult {
  const zhengCai = analyzeZhengCai(shenShiAnalysis)
  const pianCai = analyzePianCai(shenShiAnalysis)
  const caiKu = analyzeCaiKu(sixLines, dayGan)
  const louCai = analyzeLouCai(shenShiAnalysis)
  const poCai = analyzePoCai(shenShiAnalysis, sixLines)
  const moneyMakingStyle = determineMoneyMakingStyle(zhengCai, pianCai, caiKu.hasCaiKu)
  const riskYears = analyzeRiskYears(liuNian, shenShiAnalysis)
  const investmentDirections = analyzeInvestmentDirections(zhengCai, pianCai, caiKu.hasCaiKu, shenShiAnalysis)

  // 财富综合评分
  let score = 50
  if (zhengCai) score += zhengCai.power * 0.2
  if (pianCai) score += pianCai.power * 0.2
  if (caiKu.hasCaiKu) score += 10
  if (louCai) score -= 10
  if (poCai) score -= 15
  if (!geJu.poGe) score += 5
  score = Math.min(95, Math.max(30, score))

  const suggestions = generateWealthSuggestions(zhengCai, pianCai, louCai, poCai, caiKu.hasCaiKu)
  const summary = generateWealthSummary(score, zhengCai, pianCai, caiKu.hasCaiKu)

  return {
    score,
    zhengCai,
    pianCai,
    caiKu,
    louCai,
    poCai,
    moneyMakingStyle,
    riskYears,
    investmentDirections,
    suggestions,
    summary
  }
}
