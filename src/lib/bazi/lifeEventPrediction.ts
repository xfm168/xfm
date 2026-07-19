/**
 * 玄风门 V4.3 — 人生事件预测模块
 *
 * 基于命局 + 大运 + 流年联合推演，预测 15 类人生重大事件的概率、
 * 最佳/风险年份、详细分析和建议，并生成可视化时间线。
 */

import type { BaZiChart, FiveElement, ShenShi, HeavenlyStem, EarthlyBranch, GanZhi } from './types'
import { getStemElement, getBranchElement, getBranchIndex, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '@/lib/core'

// ──────────────────────── 类型定义 ────────────────────────

export type LifeEventType =
  | 'promotion'         // 晋升
  | 'entrepreneurship'  // 创业
  | 'career_change'     // 转行
  | 'love'              // 恋爱
  | 'marriage'          // 结婚
  | 'divorce'           // 离婚
  | 'peach_blossom'     // 桃花
  | 'investment'        // 投资
  | 'buy_house'         // 买房
  | 'buy_car'           // 买车
  | 'surgery'           // 手术
  | 'illness'           // 疾病
  | 'childbirth'        // 添丁
  | 'relocation'        // 搬迁
  | 'travel'            // 旅行

export interface LifeEventPrediction {
  eventType: LifeEventType
  probability: number     // 0-100
  bestYears: number[]     // 最佳年份
  riskYears: number[]     // 风险年份
  description: string     // 约 200 字分析
  advice: string[]        // 建议 2-4 条
}

export interface EventTimelineItem {
  year: number
  age: number
  events: string[]        // 该年可能发生的事件
  score: number           // 年度综合评分
}

export interface LifeEventPredictionResult {
  events: LifeEventPrediction[]
  timeline: EventTimelineItem[]
  summary: string         // 总述约 300 字
}

// ──────────────────────── 常量表 ────────────────────────

/** 桃花星地支 */
const PEACH_BLOSSOM_BRANCHES: Record<string, EarthlyBranch[]> = {
  '申子辰': ['酉'],
  '亥卯未': ['子'],
  '寅午戌': ['卯'],
  '巳酉丑': ['午'],
}

/** 驿马星地支 */
const YI_MA_BRANCHES: Record<string, EarthlyBranch[]> = {
  '申子辰': ['寅'],
  '寅午戌': ['申'],
  '巳酉丑': ['亥'],
  '亥卯未': ['巳'],
}

/** 红鸾天干 */
const HONG_LUAN_GAN: Set<HeavenlyStem> = new Set(['甲', '丙', '戊', '庚', '壬'])

/** 羊刃地支（日主阳干禄位进一位） */
const YANG_REN_MAP: Record<string, EarthlyBranch> = {
  '甲': '卯', '乙': '辰', '丙': '午', '丁': '未',
  '戊': '午', '己': '未', '庚': '酉', '辛': '戌',
  '壬': '子', '癸': '丑',
}

/** 六冲 */
const LIU_CHONG: Record<EarthlyBranch, EarthlyBranch> = {
  '子': '午', '午': '子',
  '丑': '未', '未': '丑',
  '寅': '申', '申': '寅',
  '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰',
  '巳': '亥', '亥': '巳',
}

/** 六合 */
const LIU_HE: Partial<Record<EarthlyBranch, EarthlyBranch>> = {
  '子': '丑', '丑': '子',
  '寅': '亥', '亥': '寅',
  '卯': '戌', '戌': '卯',
  '辰': '酉', '酉': '辰',
  '巳': '申', '申': '巳',
  '午': '未', '未': '午',
}

/** 事件类型中文标签 */
const EVENT_LABELS: Record<LifeEventType, string> = {
  promotion: '晋升',
  entrepreneurship: '创业',
  career_change: '转行',
  love: '恋爱',
  marriage: '结婚',
  divorce: '离婚',
  peach_blossom: '桃花',
  investment: '投资',
  buy_house: '买房',
  buy_car: '买车',
  surgery: '手术',
  illness: '疾病',
  childbirth: '添丁',
  relocation: '搬迁',
  travel: '旅行',
}

/** 五行相生 */
const WUXING_SHENG: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

/** 五行相克 */
const WUXING_KE: Record<FiveElement, FiveElement> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
}

// ──────────────────────── 辅助函数 ────────────────────────

/** 获取日主五行 */
function getDayMasterElement(chart: BaZiChart): FiveElement {
  return chart.dayMaster.dayGanElement
}

/** 获取日主天干 */
function getDayMasterStem(chart: BaZiChart): HeavenlyStem {
  return chart.sixLines.day.gan
}

/** 判断流年干支是否含某五行 */
function yearHasElement(yearGan: HeavenlyStem, yearZhi: EarthlyBranch, element: FiveElement): boolean {
  return getStemElement(yearGan) === element || getBranchElement(yearZhi) === element
}

/** 判断大运干支是否含某五行 */
function daYunHasElement(daYunGan: HeavenlyStem, daYunZhi: EarthlyBranch, element: FiveElement): boolean {
  return getStemElement(daYunGan) === element || getBranchElement(daYunZhi) === element
}

/** 判断地支是否相冲 */
function isChong(branch1: EarthlyBranch, branch2: EarthlyBranch): boolean {
  return LIU_CHONG[branch1] === branch2
}

/** 判断地支是否相合 */
function isHe(branch1: EarthlyBranch, branch2: EarthlyBranch): boolean {
  return LIU_HE[branch1] === branch2
}

/** 获取三合局组（日支所在组） */
function getSanHeGroup(dayZhi: EarthlyBranch): string {
  for (const [group, branches] of Object.entries({
    '申子辰': ['申', '子', '辰'] as EarthlyBranch[],
    '亥卯未': ['亥', '卯', '未'] as EarthlyBranch[],
    '寅午戌': ['寅', '午', '戌'] as EarthlyBranch[],
    '巳酉丑': ['巳', '酉', '丑'] as EarthlyBranch[],
  })) {
    if (branches.includes(dayZhi)) return group
  }
  return '申子辰'
}

/** 根据流年获取天干地支 */
function getYearGanZhi(year: number): { gan: HeavenlyStem; zhi: EarthlyBranch } {
  const stemIndex = (year - 4) % 10
  const branchIndex = (year - 4) % 12
  return {
    gan: HEAVENLY_STEMS[stemIndex >= 0 ? stemIndex : stemIndex + 10],
    zhi: EARTHLY_BRANCHES[branchIndex >= 0 ? branchIndex : branchIndex + 12],
  }
}

/** 获取十神类型（简化版） */
function getShenShiType(dayGanElement: FiveElement, targetElement: FiveElement, samePolarity: boolean): ShenShi | null {
  if (targetElement === dayGanElement) return samePolarity ? '比肩' : '劫财'
  if (targetElement === WUXING_SHENG[dayGanElement]) return samePolarity ? '食神' : '伤官'
  if (targetElement === WUXING_KE[dayGanElement]) return samePolarity ? '偏财' : '正财'
  if (WUXING_SHENG[targetElement] === dayGanElement) return samePolarity ? '偏印' : '正印'
  if (WUXING_KE[targetElement] === dayGanElement) return samePolarity ? '偏官' : '正官'
  return null
}

/** 判断流年十神是否包含指定类型 */
function yearHasShenShi(dayGanElement: FiveElement, yearGan: HeavenlyStem, targetShenShi: ShenShi): boolean {
  const yearElement = getStemElement(yearGan)
  const dayYinYang = (dayGanElement === '木' || dayGanElement === '火' || dayGanElement === '水') ? '阳' : '阴'
  const yearYinYang = getStemYinYangSafe(yearGan)
  const samePolarity = dayYinYang === yearYinYang
  const shenShi = getShenShiType(dayGanElement, yearElement, samePolarity)
  return shenShi === targetShenShi
}

function getStemYinYangSafe(stem: HeavenlyStem): '阳' | '阴' {
  return (['甲', '丙', '戊', '庚', '壬'] as HeavenlyStem[]).includes(stem) ? '阳' : '阴'
}

/** 获取当前大运信息 */
function getCurrentDaYun(daYun: any): { gan: HeavenlyStem; zhi: EarthlyBranch; startYear: number; endYear: number; isXi: boolean; isJi: boolean } | null {
  if (!daYun) return null
  // 兼容 DaYunAnalysisResult 和 DaYunStep
  if (daYun.steps && daYun.currentStepIndex !== undefined) {
    const step = daYun.steps[daYun.currentStepIndex]
    if (!step) return null
    return {
      gan: step.ganZhi.gan,
      zhi: step.ganZhi.zhi,
      startYear: step.startYear,
      endYear: step.endYear,
      isXi: step.isXi,
      isJi: step.isJi,
    }
  }
  if (daYun.ganZhi) {
    return {
      gan: daYun.ganZhi.gan,
      zhi: daYun.ganZhi.zhi,
      startYear: daYun.startYear || 2020,
      endYear: daYun.endYear || 2030,
      isXi: daYun.isXi ?? false,
      isJi: daYun.isJi ?? false,
    }
  }
  return null
}

/** 获取命主出生年份 */
function getBirthYear(chart: BaZiChart): number {
  // 从 sixLines.year 反推
  const yearGanIdx = HEAVENLY_STEMS.indexOf(chart.sixLines.year.gan)
  if (yearGanIdx < 0) return 1990
  // 天干序号 → 最近可能的年份（假设 1920-2030）
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= 1920; y--) {
    const idx = (y - 4) % 10
    if ((idx >= 0 ? idx : idx + 10) === yearGanIdx) return y
  }
  return 1990
}

/** 简易 clamp */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ──────────────────────── 预测核心 ────────────────────────

/**
 * 人生事件预测主函数
 * @param chart   八字命盘
 * @param daYun   大运分析结果（DaYunAnalysisResult 或 DaYunStep）
 * @param years   预测年数，默认 10
 */
export function predictLifeEvents(
  chart: BaZiChart,
  daYun: any,
  years: number = 10,
): LifeEventPredictionResult {
  const birthYear = getBirthYear(chart)
  const startYear = new Date().getFullYear()
  const dayGanElement = getDayMasterElement(chart)
  const dayGan = getDayMasterStem(chart)
  const dayZhi = chart.sixLines.day.zhi
  const monthZhi = chart.sixLines.month.zhi
  const yearZhi = chart.sixLines.year.zhi
  const curDaYun = getCurrentDaYun(daYun)
  const xiYong = chart.xiYongShen
  const sanHeGroup = getSanHeGroup(dayZhi)
  const peachBranches = PEACH_BLOSSOM_BRANCHES[sanHeGroup] || []
  const yiMaBranches = YI_MA_BRANCHES[sanHeGroup] || []

  // ── 收集每年的分析数据 ──
  const yearDataList: Array<{
    year: number
    age: number
    gan: HeavenlyStem
    zhi: EarthlyBranch
    hasGuanXing: boolean       // 逢官星
    hasYinXing: boolean        // 逢印星
    hasCaiXing: boolean        // 逢财星
    hasShiShang: boolean       // 逢食伤
    hasQiSha: boolean          // 逢七杀
    isPeachBlossom: boolean    // 桃花年
    isHongLuan: boolean        // 红鸾年
    isYiMa: boolean            // 驿马年
    chongDayZhi: boolean       // 冲日支
    chongMonthZhi: boolean     // 冲月柱
    chongYearZhi: boolean      // 冲年柱
    heDayZhi: boolean         // 合日支
    hasYangRen: boolean        // 羊刃年
    isXiDaYun: boolean         // 喜用大运
    daYunHasGuanYin: boolean   // 大运官印运
    daYunHasShiShang: boolean  // 大运食伤运
    daYunHasCai: boolean       // 大运财星运
    daYunIsJi: boolean         // 大运忌神
    score: number              // 年度基础分
  }> = []

  for (let i = 0; i < years; i++) {
    const yr = startYear + i
    const age = yr - birthYear
    const { gan, zhi } = getYearGanZhi(yr)

    const hasGuanXing = yearHasShenShi(dayGanElement, gan, '正官') || yearHasShenShi(dayGanElement, gan, '偏官')
    const hasYinXing = yearHasShenShi(dayGanElement, gan, '正印') || yearHasShenShi(dayGanElement, gan, '偏印')
    const hasCaiXing = yearHasShenShi(dayGanElement, gan, '正财') || yearHasShenShi(dayGanElement, gan, '偏财')
    const hasShiShang = yearHasShenShi(dayGanElement, gan, '食神') || yearHasShenShi(dayGanElement, gan, '伤官')
    const hasQiSha = yearHasShenShi(dayGanElement, gan, '偏官')
    const isPeachBlossom = peachBranches.includes(zhi)
    const isHongLuan = HONG_LUAN_GAN.has(gan)
    const isYiMa = yiMaBranches.includes(zhi)
    const chongDayZhi = isChong(zhi, dayZhi)
    const chongMonthZhi = isChong(zhi, monthZhi)
    const chongYearZhi = isChong(zhi, yearZhi)
    const heDayZhi = !!isHe(zhi, dayZhi)
    const hasYangRen = YANG_REN_MAP[dayGan] === zhi

    // 大运判定
    const inDaYun = !!(curDaYun && yr >= curDaYun.startYear && yr <= curDaYun.endYear)
    const isXiDaYun = !!(inDaYun && curDaYun!.isXi)
    const daYunGan = curDaYun?.gan
    const daYunZhi = curDaYun?.zhi
    const daYunHasGuanYin = !!(inDaYun && daYunGan && (yearHasShenShi(dayGanElement, daYunGan, '正官') || yearHasShenShi(dayGanElement, daYunGan, '正印')))
    const daYunHasShiShang = !!(inDaYun && daYunGan && (yearHasShenShi(dayGanElement, daYunGan, '食神') || yearHasShenShi(dayGanElement, daYunGan, '伤官')))
    const daYunHasCai = !!(inDaYun && daYunGan && (yearHasShenShi(dayGanElement, daYunGan, '正财') || yearHasShenShi(dayGanElement, daYunGan, '偏财')))
    const daYunIsJi = !!(inDaYun && curDaYun!.isJi)

    // 年度基础分：综合喜忌
    let score = 50
    if (isXiDaYun) score += 15
    if (daYunIsJi) score -= 15
    if (yearHasElement(gan, zhi, xiYong.bestElement)) score += 10
    if (xiYong.avoidedElements.some(e => yearHasElement(gan, zhi, e))) score -= 10
    score = clamp(score, 10, 95)

    yearDataList.push({
      year: yr, age, gan, zhi,
      hasGuanXing, hasYinXing, hasCaiXing, hasShiShang, hasQiSha,
      isPeachBlossom, isHongLuan, isYiMa,
      chongDayZhi, chongMonthZhi, chongYearZhi,
      heDayZhi, hasYangRen,
      isXiDaYun, daYunHasGuanYin, daYunHasShiShang, daYunHasCai, daYunIsJi,
      score,
    })
  }

  // ── 分类事件预测 ──

  const events: LifeEventPrediction[] = []

  // ===== 1. 事业类 =====

  // 晋升
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    for (const yd of yearDataList) {
      if (yd.daYunHasGuanYin && yd.hasGuanXing) { bestYears.push(yd.year); hitCount += 2 }
      else if (yd.hasGuanXing && yd.isXiDaYun) { bestYears.push(yd.year); hitCount++ }
      else if (yd.daYunIsJi && yd.chongDayZhi) { riskYears.push(yd.year) }
    }
    const probability = clamp(Math.round(30 + hitCount * 8), 10, 90)
    events.push({
      eventType: 'promotion',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('promotion', chart, probability, bestYears),
      advice: generateEventAdvice('promotion', probability, bestYears),
    })
  }

  // 创业
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    for (const yd of yearDataList) {
      if (yd.daYunHasShiShang && yd.hasCaiXing) { bestYears.push(yd.year); hitCount += 2 }
      else if (yd.hasShiShang && yd.hasCaiXing && yd.isXiDaYun) { bestYears.push(yd.year); hitCount++ }
      else if (yd.daYunIsJi && yd.hasQiSha) { riskYears.push(yd.year) }
    }
    const probability = clamp(Math.round(20 + hitCount * 10), 10, 85)
    events.push({
      eventType: 'entrepreneurship',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('entrepreneurship', chart, probability, bestYears),
      advice: generateEventAdvice('entrepreneurship', probability, bestYears),
    })
  }

  // 转行
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    for (const yd of yearDataList) {
      if (yd.chongMonthZhi && yd.hasShiShang) { bestYears.push(yd.year); hitCount += 2 }
      else if (yd.chongMonthZhi) { bestYears.push(yd.year); hitCount++ }
      else if (yd.daYunIsJi && yd.hasGuanXing) { riskYears.push(yd.year) }
    }
    const probability = clamp(Math.round(15 + hitCount * 12), 5, 75)
    events.push({
      eventType: 'career_change',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('career_change', chart, probability, bestYears),
      advice: generateEventAdvice('career_change', probability, bestYears),
    })
  }

  // ===== 2. 婚姻类 =====

  // 恋爱
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    for (const yd of yearDataList) {
      if (yd.isPeachBlossom && yd.isHongLuan && yd.isXiDaYun) { bestYears.push(yd.year); hitCount += 3 }
      else if (yd.isPeachBlossom && yd.isXiDaYun) { bestYears.push(yd.year); hitCount += 2 }
      else if (yd.isPeachBlossom) { bestYears.push(yd.year); hitCount++ }
      else if (yd.daYunIsJi && yd.chongDayZhi) { riskYears.push(yd.year) }
    }
    const probability = clamp(Math.round(25 + hitCount * 7), 10, 90)
    events.push({
      eventType: 'love',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('love', chart, probability, bestYears),
      advice: generateEventAdvice('love', probability, bestYears),
    })
  }

  // 结婚
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    for (const yd of yearDataList) {
      if (yd.heDayZhi && yd.isPeachBlossom && yd.isXiDaYun) { bestYears.push(yd.year); hitCount += 3 }
      else if (yd.heDayZhi && yd.isXiDaYun) { bestYears.push(yd.year); hitCount += 2 }
      else if (yd.isPeachBlossom && yd.hasYinXing) { bestYears.push(yd.year); hitCount++ }
      else if (yd.chongDayZhi && yd.daYunIsJi) { riskYears.push(yd.year) }
    }
    const probability = clamp(Math.round(15 + hitCount * 10), 5, 85)
    events.push({
      eventType: 'marriage',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('marriage', chart, probability, bestYears),
      advice: generateEventAdvice('marriage', probability, bestYears),
    })
  }

  // 离婚
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    for (const yd of yearDataList) {
      if (yd.chongDayZhi && yd.daYunIsJi) { riskYears.push(yd.year); hitCount += 3 }
      else if (yd.chongDayZhi && !yd.isXiDaYun) { riskYears.push(yd.year); hitCount += 2 }
      else if (yd.daYunIsJi && yd.hasQiSha) { riskYears.push(yd.year); hitCount++ }
      else if (yd.heDayZhi && yd.isXiDaYun) { bestYears.push(yd.year) }
    }
    const probability = clamp(Math.round(hitCount * 8), 5, 70)
    events.push({
      eventType: 'divorce',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('divorce', chart, probability, riskYears),
      advice: generateEventAdvice('divorce', probability, riskYears),
    })
  }

  // 桃花
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    for (const yd of yearDataList) {
      if (yd.isPeachBlossom) { bestYears.push(yd.year); hitCount += 2 }
      else if (yd.isHongLuan) { bestYears.push(yd.year); hitCount++ }
      else if (yd.chongDayZhi && yd.daYunIsJi) { riskYears.push(yd.year) }
    }
    const probability = clamp(Math.round(30 + hitCount * 6), 15, 90)
    events.push({
      eventType: 'peach_blossom',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('peach_blossom', chart, probability, bestYears),
      advice: generateEventAdvice('peach_blossom', probability, bestYears),
    })
  }

  // ===== 3. 财富类 =====

  // 投资
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    for (const yd of yearDataList) {
      if (yd.daYunHasCai && yd.hasCaiXing && yd.isXiDaYun) { bestYears.push(yd.year); hitCount += 3 }
      else if (yd.daYunHasCai && yd.hasCaiXing) { bestYears.push(yd.year); hitCount += 2 }
      else if (yd.hasCaiXing && yd.isXiDaYun) { bestYears.push(yd.year); hitCount++ }
      else if (yd.daYunIsJi && yd.chongDayZhi) { riskYears.push(yd.year) }
    }
    const probability = clamp(Math.round(20 + hitCount * 8), 10, 80)
    events.push({
      eventType: 'investment',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('investment', chart, probability, bestYears),
      advice: generateEventAdvice('investment', probability, bestYears),
    })
  }

  // 买房
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    for (const yd of yearDataList) {
      if (yd.hasYinXing && yd.hasCaiXing && yd.isXiDaYun) { bestYears.push(yd.year); hitCount += 3 }
      else if (yd.hasYinXing && yd.hasCaiXing) { bestYears.push(yd.year); hitCount += 2 }
      else if (yd.hasYinXing) { bestYears.push(yd.year); hitCount++ }
      else if (yd.daYunIsJi && yd.chongDayZhi) { riskYears.push(yd.year) }
    }
    const probability = clamp(Math.round(15 + hitCount * 9), 10, 80)
    events.push({
      eventType: 'buy_house',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('buy_house', chart, probability, bestYears),
      advice: generateEventAdvice('buy_house', probability, bestYears),
    })
  }

  // 买车
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    for (const yd of yearDataList) {
      if (yd.isYiMa && yd.hasCaiXing && yd.isXiDaYun) { bestYears.push(yd.year); hitCount += 3 }
      else if (yd.isYiMa && yd.hasCaiXing) { bestYears.push(yd.year); hitCount += 2 }
      else if (yd.isYiMa) { bestYears.push(yd.year); hitCount++ }
      else if (yd.daYunIsJi) { riskYears.push(yd.year) }
    }
    const probability = clamp(Math.round(20 + hitCount * 7), 10, 75)
    events.push({
      eventType: 'buy_car',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('buy_car', chart, probability, bestYears),
      advice: generateEventAdvice('buy_car', probability, bestYears),
    })
  }

  // ===== 4. 健康类 =====

  // 手术
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    for (const yd of yearDataList) {
      if (yd.hasQiSha && yd.hasYangRen && yd.chongDayZhi) { riskYears.push(yd.year); hitCount += 3 }
      else if (yd.hasQiSha && yd.chongDayZhi) { riskYears.push(yd.year); hitCount += 2 }
      else if (yd.hasYangRen && yd.daYunIsJi) { riskYears.push(yd.year); hitCount++ }
      else if (yd.isXiDaYun && yd.hasYinXing) { bestYears.push(yd.year) }
    }
    const probability = clamp(Math.round(hitCount * 10), 5, 65)
    events.push({
      eventType: 'surgery',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('surgery', chart, probability, riskYears),
      advice: generateEventAdvice('surgery', probability, riskYears),
    })
  }

  // 疾病
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    // 五行缺失
    const missingElements: FiveElement[] = (['木', '火', '土', '金', '水'] as FiveElement[]).filter(
      e => chart.fiveElementCount[e] === 0
    )
    for (const yd of yearDataList) {
      const flowHitsMissing = missingElements.some(e => yearHasElement(yd.gan, yd.zhi, e))
      const chongOrJi = yd.chongDayZhi || yd.daYunIsJi
      if (flowHitsMissing && chongOrJi) { riskYears.push(yd.year); hitCount += 2 }
      else if (yd.daYunIsJi && yd.chongDayZhi) { riskYears.push(yd.year); hitCount++ }
      else if (yd.isXiDaYun && yd.hasYinXing) { bestYears.push(yd.year) }
    }
    const probability = clamp(Math.round(15 + hitCount * 8 + missingElements.length * 5), 5, 75)
    events.push({
      eventType: 'illness',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('illness', chart, probability, riskYears),
      advice: generateEventAdvice('illness', probability, riskYears),
    })
  }

  // ===== 5. 家庭类 =====

  // 添丁
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    for (const yd of yearDataList) {
      if (yd.hasShiShang && yd.heDayZhi && yd.isXiDaYun) { bestYears.push(yd.year); hitCount += 3 }
      else if (yd.hasShiShang && yd.isXiDaYun) { bestYears.push(yd.year); hitCount += 2 }
      else if (yd.hasShiShang && yd.isPeachBlossom) { bestYears.push(yd.year); hitCount++ }
      else if (yd.daYunIsJi && yd.chongDayZhi) { riskYears.push(yd.year) }
    }
    const probability = clamp(Math.round(10 + hitCount * 10), 5, 80)
    events.push({
      eventType: 'childbirth',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('childbirth', chart, probability, bestYears),
      advice: generateEventAdvice('childbirth', probability, bestYears),
    })
  }

  // 搬迁
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    for (const yd of yearDataList) {
      if (yd.isYiMa && yd.chongYearZhi) { bestYears.push(yd.year); hitCount += 3 }
      else if (yd.isYiMa && yd.chongMonthZhi) { bestYears.push(yd.year); hitCount += 2 }
      else if (yd.isYiMa) { bestYears.push(yd.year); hitCount++ }
      else if (yd.daYunIsJi) { riskYears.push(yd.year) }
    }
    const probability = clamp(Math.round(15 + hitCount * 9), 10, 75)
    events.push({
      eventType: 'relocation',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('relocation', chart, probability, bestYears),
      advice: generateEventAdvice('relocation', probability, bestYears),
    })
  }

  // 旅行
  {
    const bestYears: number[] = []
    const riskYears: number[] = []
    let hitCount = 0
    for (const yd of yearDataList) {
      if (yd.isYiMa && yd.isXiDaYun) { bestYears.push(yd.year); hitCount += 2 }
      else if (yd.isYiMa) { bestYears.push(yd.year); hitCount++ }
      else if (yd.hasShiShang && yd.isXiDaYun) { bestYears.push(yd.year); hitCount++ }
      else if (yd.daYunIsJi && yd.chongDayZhi) { riskYears.push(yd.year) }
    }
    const probability = clamp(Math.round(30 + hitCount * 5), 15, 85)
    events.push({
      eventType: 'travel',
      probability,
      bestYears: bestYears.slice(0, 3),
      riskYears: riskYears.slice(0, 3),
      description: generateEventDescription('travel', chart, probability, bestYears),
      advice: generateEventAdvice('travel', probability, bestYears),
    })
  }

  // ── 生成时间线 ──
  const timeline: EventTimelineItem[] = yearDataList.map(yd => {
    const yearEvents: string[] = []
    if (yd.hasGuanXing && yd.daYunHasGuanYin) yearEvents.push('事业晋升机遇')
    if (yd.daYunHasShiShang && yd.hasCaiXing) yearEvents.push('创业/投资良机')
    if (yd.chongMonthZhi && yd.hasShiShang) yearEvents.push('可能转行变动')
    if (yd.isPeachBlossom && yd.isHongLuan) yearEvents.push('桃花旺盛，恋爱机缘')
    if (yd.heDayZhi && yd.isPeachBlossom) yearEvents.push('婚姻之喜')
    if (yd.chongDayZhi && yd.daYunIsJi) yearEvents.push('感情/婚姻波动')
    if (yd.daYunHasCai && yd.hasCaiXing) yearEvents.push('财运亨通')
    if (yd.hasYinXing && yd.hasCaiXing) yearEvents.push('置产良机')
    if (yd.isYiMa && yd.hasCaiXing) yearEvents.push('购车/出行')
    if (yd.hasQiSha && yd.hasYangRen && yd.chongDayZhi) yearEvents.push('注意健康，防意外')
    if (yd.daYunIsJi && yd.chongDayZhi) yearEvents.push('健康需注意')
    if (yd.hasShiShang && yd.heDayZhi) yearEvents.push('添丁之喜')
    if (yd.isYiMa && yd.chongYearZhi) yearEvents.push('搬迁变动')
    if (yd.isYiMa) yearEvents.push('出行/旅游机会')
    return {
      year: yd.year,
      age: yd.age,
      events: yearEvents.length > 0 ? yearEvents : ['平稳过渡'],
      score: yd.score,
    }
  })

  // ── 生成总述 ──
  const summary = generateSummary(chart, events, timeline, curDaYun)

  return { events, timeline, summary }
}

// ──────────────────────── 描述与建议生成 ────────────────────────

function generateEventDescription(
  type: LifeEventType,
  chart: BaZiChart,
  probability: number,
  keyYears: number[],
): string {
  const dayElement = chart.dayMaster.dayGanElement
  const xiYong = chart.xiYongShen.bestElement
  const label = EVENT_LABELS[type]
  const yearsText = keyYears.length > 0 ? keyYears.join('、') : '暂无明显年份'

  const templates: Record<LifeEventType, string> = {
    promotion: `日主${dayElement}命，喜${xiYong}。事业晋升方面，命局中官印星分布为关键指标。当前概率${probability}%，${probability >= 60 ? '属于较高水平' : '属于中等水平'}。${keyYears.length > 0 ? `重点留意${yearsText}年` : '需结合大运走势把握机遇'}。大运走官印运时，若流年再逢官星或印星引动，升迁之机显著增大。建议在运势较旺的年份主动争取，运势低迷时蓄力等待。`,
    entrepreneurship: `日主${dayElement}命，创业需看食伤星与财星的配合。当前创业概率${probability}%，${probability >= 50 ? '时机较为成熟' : '需谨慎评估'}。大运走食伤运代表创造力充沛，流年逢财星则意味着市场机遇显现。${keyYears.length > 0 ? `${yearsText}年为较佳启动窗口` : '近期需等待更合适的时机'}。创业初期宜轻资产试水，不可贪大求全。`,
    career_change: `日主${dayElement}命，转行看月柱与流年的互动关系。当前转行概率${probability}%，${probability >= 40 ? '有较明显变动迹象' : '变动可能性不大'}。流年冲动月柱往往预示着职业环境的重大变化，若同时走食伤运则更具主动性。${keyYears.length > 0 ? `${yearsText}年需特别关注` : '短期内以稳定为佳'}。`,
    love: `日主${dayElement}命，恋爱缘分看桃花星与红鸾星的配合。当前恋爱概率${probability}%，${probability >= 60 ? '桃花运旺盛' : '缘分需耐心等待'}。${keyYears.length > 0 ? `${yearsText}年为桃花年，社交活动增多，异性缘佳` : '桃花运一般，建议主动拓展社交圈'}。大运走喜用神运时，桃花运更为明显。`,
    marriage: `日主${dayElement}命，婚姻大事看日支（配偶宫）与流年的关系。当前结婚概率${probability}%，${probability >= 50 ? '具备较好的婚姻时机' : '婚姻时机尚未成熟'}。日支逢合且流年桃花旺，是缔结婚姻的最佳信号。${keyYears.length > 0 ? `${yearsText}年为较理想的结婚年份` : '建议耐心等待良辰'}。`,
    divorce: `日主${dayElement}命，婚姻稳定性看日支是否受冲及大运是否为忌神。当前婚姻风险概率${probability}%，${probability >= 40 ? '需引起重视' : '婚姻整体稳定'}。流年冲日支且大运走忌神时，婚姻关系面临考验。${keyYears.length > 0 ? `${yearsText}年为需重点留意的年份` : '短期内婚姻关系较为平稳'}。建议及时沟通，化解矛盾。`,
    peach_blossom: `日主${dayElement}命，桃花运看流年是否逢桃花星。当前桃花概率${probability}%，${probability >= 70 ? '桃花非常旺盛' : '桃花运势中等'}。${keyYears.length > 0 ? `${yearsText}年为桃花年，人缘佳，社交活跃` : '桃花运平稳，顺其自然'}。桃花虽好，已婚者需注意把握分寸。`,
    investment: `日主${dayElement}命，投资理财看财星旺衰及大运走向。当前投资概率${probability}%，${probability >= 50 ? '具备较好的投资时机' : '投资需谨慎'}。大运走财星运且流年生扶时，是较佳的投资窗口期。${keyYears.length > 0 ? `${yearsText}年可重点关注` : '近期宜保守理财'}。切记分散投资，控制风险。`,
    buy_house: `日主${dayElement}命，置产看印星与财星的配合。印星代表房产，财星代表购买力。当前置产概率${probability}%，${probability >= 50 ? '具备较好的购房时机' : '购房时机一般'}。${keyYears.length > 0 ? `${yearsText}年印星财星并见，适合出手` : '需等待更合适的时机'}。`,
    buy_car: `日主${dayElement}命，购车看驿马星与财星的组合。驿马主动、财星主购买力。当前购车概率${probability}%，${probability >= 50 ? '适合考虑购车' : '购车非当务之急'}。${keyYears.length > 0 ? `${yearsText}年驿马逢财，出行需求增加` : '可择机而行'}。`,
    surgery: `日主${dayElement}命，手术风险看七杀、羊刃与冲克的组合。当前风险概率${probability}%，${probability >= 40 ? '需格外注意身体健康' : '整体健康风险可控'}。${keyYears.length > 0 ? `${yearsText}年七杀羊刃冲克日柱，风险较高` : '近期无明显的手术风险信号'}。建议定期体检，防患于未然。`,
    illness: `日主${dayElement}命，疾病风险看五行缺失与流年冲克。命局五行${Object.entries(chart.fiveElementCount).filter(([, v]) => v === 0).map(([k]) => k).join('') ? `缺${Object.entries(chart.fiveElementCount).filter(([, v]) => v === 0).map(([k]) => k).join('、')}` : '较均衡'}。当前健康风险${probability}%，${keyYears.length > 0 ? `${yearsText}年需特别注意` : '近期健康状况良好'}。`,
    childbirth: `日主${dayElement}命，添丁之喜看食伤星与子女宫（时柱）的配合。当前添丁概率${probability}%，${probability >= 50 ? '具备较好的生育时机' : '时机尚需等待'}。${keyYears.length > 0 ? `${yearsText}年食伤旺且子女宫逢合，概率较高` : '顺其自然'}。`,
    relocation: `日主${dayElement}命，搬迁看驿马星与年柱的互动。驿马主动，冲动年柱预示住址变更。当前搬迁概率${probability}%，${keyYears.length > 0 ? `${yearsText}年驿马发动，有搬迁迹象` : '近期居住环境稳定'}。`,
    travel: `日主${dayElement}命，旅行出行看驿马星与食伤星的组合。当前出行概率${probability}%，${probability >= 60 ? '出行运旺盛，适合旅游' : '出行运平稳'}。${keyYears.length > 0 ? `${yearsText}年驿马逢喜，适合远行` : '可就近短途出游'}。`,
  }

  return templates[type]
}

function generateEventAdvice(
  type: LifeEventType,
  probability: number,
  keyYears: number[],
): string[] {
  const advices: Record<LifeEventType, string[]> = {
    promotion: [
      probability >= 50 ? '在运势旺年主动争取晋升机会，展现能力' : '运势一般时专注提升自身能力，蓄势待发',
      '多结交贵人，尤其注意上级和长辈的提携',
      '保持低调务实的工作作风，避免锋芒太露',
      keyYears.length > 0 ? `重点关注${keyYears[0]}年前后的变动窗口` : '耐心等待合适的时机',
    ],
    entrepreneurship: [
      probability >= 50 ? '可在运势旺年启动轻资产项目试水' : '创业时机未到，可先做市场调研和准备',
      '优先选择与喜用神五行相关的行业',
      '准备充足的资金储备，至少维持 12 个月运营',
      '寻找命局互补的合伙人，弥补自身五行短板',
    ],
    career_change: [
      '转行前充分评估新行业的前景和自身适配度',
      '利用食伤运的创造力优势，选择有创新空间的领域',
      '不要在新年伊始仓促决定，至少观察一个季度',
      '保持与原行业的人脉联系，以备不时之需',
    ],
    love: [
      '桃花年多参加社交活动，扩大交际圈',
      '注意穿着打扮，提升个人魅力',
      '对心仪对象要主动表达，不宜过于被动',
      '理性看待感情，避免因桃花旺而感情用事',
    ],
    marriage: [
      '最佳结婚年份宜提前半年筹备',
      '选择与双方八字互补的吉日',
      '婚前充分沟通，明确彼此期待',
      '保持包容心态，婚姻需要经营',
    ],
    divorce: [
      '婚姻出现问题时及时沟通，寻求专业帮助',
      '避免在冲动年份做重大决定',
      '如有子女，优先考虑子女的感受',
      '无论结果如何，保持体面和尊重',
    ],
    peach_blossom: [
      '桃花旺年注意把握分寸，已婚者尤需谨慎',
      '利用好人缘带来的社交和业务机会',
      '理性判断异性的示好，辨别真心',
      '桃花虽美，但不一定都是良缘',
    ],
    investment: [
      probability >= 50 ? '可在运势旺年适度增加投资仓位' : '近期以保守理财为主，避免高风险投资',
      '投资方向首选与喜用神五行相关的行业',
      '严格设置止损线，不要贪心',
      '分散投资，不要把鸡蛋放在一个篮子里',
    ],
    buy_house: [
      probability >= 50 ? '印星财星并见之年适合出手购房' : '购房时机一般，可先观望',
      '房屋朝向宜选择喜用神五行的方位',
      '楼层选择与个人五行命理相配合',
      '量力而行，不要因购房过度负债',
    ],
    buy_car: [
      '购车宜选与自身五行相合的颜色',
      '驿马逢财之年出行需求增大，适合购车',
      '注意交通安全，避免疲劳驾驶',
      '车辆选购以实用为主，量力而行',
    ],
    surgery: [
      '定期体检，早发现早治疗',
      '高风险年份避免剧烈运动和危险活动',
      '保持规律作息，增强身体抵抗力',
      '如有不适及时就医，不要拖延',
    ],
    illness: [
      '关注五行缺失对应脏腑的保养',
      '保持均衡饮食，适当补充缺失五行的食物',
      '高风险年份加强锻炼，提升免疫力',
      '心理健康同样重要，保持积极乐观',
    ],
    childbirth: [
      probability >= 50 ? '食伤旺年适合备孕' : '可提前调理身体，为将来做准备',
      '保持良好的生活习惯和心态',
      '夫妻双方共同做好迎接新生命的准备',
      '遵医嘱，按时产检',
    ],
    relocation: [
      '驿马发动之年若有意搬迁，可择机行动',
      '新居方位宜选择喜用神五行方向',
      '搬迁前做好充分准备，避免仓促',
      '搬家后注意安顿和适应新环境',
    ],
    travel: [
      '驿马逢喜之年适合远行旅游',
      '出行前做好攻略，注意安全',
      '旅行目的地可优先选择五行互补的方向',
      '出行期间保持手机畅通，与家人保持联系',
    ],
  }

  return advices[type].slice(0, probability >= 40 ? 4 : 2)
}

function generateSummary(
  chart: BaZiChart,
  events: LifeEventPrediction[],
  timeline: EventTimelineItem[],
  curDaYun: ReturnType<typeof getCurrentDaYun>,
): string {
  const dayElement = chart.dayMaster.dayGanElement
  const xiYong = chart.xiYongShen

  // 找出概率最高的事件
  const topEvents = [...events].sort((a, b) => b.probability - a.probability).slice(0, 3)
  // 找出风险最高的事件
  const riskEvents = events.filter(e => e.probability >= 40 && e.riskYears.length > 0)

  // 找最佳年份
  const bestYears = timeline.filter(t => t.score >= 70).map(t => t.year)
  // 找风险年份
  const riskYears = timeline.filter(t => t.score <= 40).map(t => t.year)

  const daYunDesc = curDaYun
    ? `当前大运${curDaYun.gan}${curDaYun.zhi}（${curDaYun.startYear}-${curDaYun.endYear}），${curDaYun.isXi ? '走喜用神运，整体运势较好' : curDaYun.isJi ? '走忌神运，需谨言慎行' : '运势平平'}`
    : '大运信息暂缺'

  const topEventsStr = topEvents.map(e => `${EVENT_LABELS[e.eventType]}（${e.probability}%）`).join('、')
  const riskEventsStr = riskEvents.length > 0
    ? riskEvents.map(e => `${EVENT_LABELS[e.eventType]}（风险年份：${e.riskYears.join('、')}）`).join('；')
    : '暂无明显风险事件'

  return `综合命局分析：日主${dayElement}命，喜用神为${xiYong.bestElement}，忌神为${xiYong.avoidedElements.join('、')}。${daYunDesc}。

未来${timeline.length}年人生重大事件预测：概率最高的三件事为${topEventsStr}。${bestYears.length > 0 ? `最佳年份为${bestYears.join('、')}年，建议把握机遇` : '各年运势较为均衡'}。${riskEventsStr}。

总体来看，${timeline.filter(t => t.score >= 60).length > timeline.length / 2 ? '未来运势整体向好，宜积极进取' : timeline.filter(t => t.score <= 50).length > timeline.length / 2 ? '未来运势起伏较大，需稳健应对' : '未来运势稳中有变，宜顺势而为'}。建议在运势较旺的年份果断行动，在运势低迷时注意防守，合理规划人生节奏。`
}
