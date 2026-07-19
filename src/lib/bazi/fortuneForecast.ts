/**
 * 玄风门 V4.3 — 十年运势曲线模块
 *
 * 基于命局 + 大运 + 流年联合推演，输出未来 N 年（默认 10 年）
 * 每年的事业、财富、婚姻、健康四维评分及综合评分，
 * 并计算整体趋势、峰值和谷值年份。
 */

import type { BaZiChart, FiveElement, ShenShi, HeavenlyStem, EarthlyBranch } from './types'
import { getStemElement, getBranchElement, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '@/lib/core'

// ──────────────────────── 类型定义 ────────────────────────

export interface FortuneYearData {
  year: number
  age: number
  career: number         // 0-100 事业运
  wealth: number         // 0-100 财富运
  marriage: number       // 0-100 婚姻运
  health: number         // 0-100 健康运
  overall: number        // 0-100 综合运
  keyEvents: string[]   // 该年关键事件
  advice: string         // 该年建议
}

export type FortuneTrend = 'rising' | 'stable' | 'declining' | 'volatile'

export interface FortuneForecastResult {
  years: FortuneYearData[]
  trend: FortuneTrend
  peakYear: number
  troughYear: number
  summary: string
}

// ──────────────────────── 常量表 ────────────────────────

/** 五行相生 */
const WUXING_SHENG: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

/** 五行相克 */
const WUXING_KE: Record<FiveElement, FiveElement> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
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

// ──────────────────────── 辅助函数 ────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function getYearGanZhi(year: number): { gan: HeavenlyStem; zhi: EarthlyBranch } {
  const stemIndex = (year - 4) % 10
  const branchIndex = (year - 4) % 12
  return {
    gan: HEAVENLY_STEMS[stemIndex >= 0 ? stemIndex : stemIndex + 10],
    zhi: EARTHLY_BRANCHES[branchIndex >= 0 ? branchIndex : branchIndex + 12],
  }
}

function getStemYinYangSafe(stem: HeavenlyStem): '阳' | '阴' {
  return (['甲', '丙', '戊', '庚', '壬'] as HeavenlyStem[]).includes(stem) ? '阳' : '阴'
}

function getShenShiType(dayGanElement: FiveElement, targetElement: FiveElement, samePolarity: boolean): ShenShi | null {
  if (targetElement === dayGanElement) return samePolarity ? '比肩' : '劫财'
  if (targetElement === WUXING_SHENG[dayGanElement]) return samePolarity ? '食神' : '伤官'
  if (targetElement === WUXING_KE[dayGanElement]) return samePolarity ? '偏财' : '正财'
  if (WUXING_SHENG[targetElement] === dayGanElement) return samePolarity ? '偏印' : '正印'
  if (WUXING_KE[targetElement] === dayGanElement) return samePolarity ? '偏官' : '正官'
  return null
}

function yearHasShenShi(dayGanElement: FiveElement, yearGan: HeavenlyStem, targetShenShi: ShenShi): boolean {
  const yearElement = getStemElement(yearGan)
  const dayYinYang = (dayGanElement === '木' || dayGanElement === '火' || dayGanElement === '水') ? '阳' : '阴'
  const yearYinYang = getStemYinYangSafe(yearGan)
  const samePolarity = dayYinYang === yearYinYang
  return getShenShiType(dayGanElement, yearElement, samePolarity) === targetShenShi
}

function yearHasElement(yearGan: HeavenlyStem, yearZhi: EarthlyBranch, element: FiveElement): boolean {
  return getStemElement(yearGan) === element || getBranchElement(yearZhi) === element
}

function isChong(b1: EarthlyBranch, b2: EarthlyBranch): boolean {
  return LIU_CHONG[b1] === b2
}

function isHe(b1: EarthlyBranch, b2: EarthlyBranch): boolean {
  return LIU_HE[b1] === b2
}

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

function getBirthYear(chart: BaZiChart): number {
  const yearGanIdx = HEAVENLY_STEMS.indexOf(chart.sixLines.year.gan)
  if (yearGanIdx < 0) return 1990
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= 1920; y--) {
    const idx = (y - 4) % 10
    if ((idx >= 0 ? idx : idx + 10) === yearGanIdx) return y
  }
  return 1990
}

function getCurrentDaYun(daYun: any): { gan: HeavenlyStem; zhi: EarthlyBranch; startYear: number; endYear: number; isXi: boolean; isJi: boolean } | null {
  if (!daYun) return null
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

// ──────────────────────── 运势计算核心 ────────────────────────

/**
 * 十年运势预测主函数
 * @param chart      八字命盘
 * @param daYun      大运分析结果
 * @param startYear  起始年份，默认当前年份
 * @param years      预测年数，默认 10
 */
export function forecastFortune(
  chart: BaZiChart,
  daYun: any,
  startYear?: number,
  years: number = 10,
): FortuneForecastResult {
  const birthYear = getBirthYear(chart)
  const actualStartYear = startYear ?? new Date().getFullYear()
  const dayGanElement = chart.dayMaster.dayGanElement
  const dayGan = chart.sixLines.day.gan
  const dayZhi = chart.sixLines.day.zhi
  const xiYong = chart.xiYongShen
  const curDaYun = getCurrentDaYun(daYun)
  const sanHeGroup = getSanHeGroup(dayZhi)
  const peachBranches = PEACH_BLOSSOM_BRANCHES[sanHeGroup] || []
  const yiMaBranches = YI_MA_BRANCHES[sanHeGroup] || []
  const missingElements: FiveElement[] = (['木', '火', '土', '金', '水'] as FiveElement[]).filter(
    e => chart.fiveElementCount[e] === 0
  )

  // ── 逐年计算 ──
  const yearResults: FortuneYearData[] = []

  for (let i = 0; i < years; i++) {
    const yr = actualStartYear + i
    const age = yr - birthYear
    const { gan, zhi } = getYearGanZhi(yr)

    // 大运判定
    const inDaYun = curDaYun && yr >= curDaYun.startYear && yr <= curDaYun.endYear
    const isXiDaYun = inDaYun && curDaYun!.isXi
    const daYunIsJi = inDaYun && curDaYun!.isJi
    const daYunGan = curDaYun?.gan

    // 流年十神
    const hasGuanXing = yearHasShenShi(dayGanElement, gan, '正官') || yearHasShenShi(dayGanElement, gan, '偏官')
    const hasYinXing = yearHasShenShi(dayGanElement, gan, '正印') || yearHasShenShi(dayGanElement, gan, '偏印')
    const hasCaiXing = yearHasShenShi(dayGanElement, gan, '正财') || yearHasShenShi(dayGanElement, gan, '偏财')
    const hasShiShang = yearHasShenShi(dayGanElement, gan, '食神') || yearHasShenShi(dayGanElement, gan, '伤官')
    const hasQiSha = yearHasShenShi(dayGanElement, gan, '偏官')
    const hasBiJie = yearHasShenShi(dayGanElement, gan, '比肩') || yearHasShenShi(dayGanElement, gan, '劫财')

    // 大运十神
    const daYunHasGuan = daYunGan ? (yearHasShenShi(dayGanElement, daYunGan, '正官') || yearHasShenShi(dayGanElement, daYunGan, '偏官')) : false
    const daYunHasYin = daYunGan ? (yearHasShenShi(dayGanElement, daYunGan, '正印') || yearHasShenShi(dayGanElement, daYunGan, '偏印')) : false
    const daYunHasCai = daYunGan ? (yearHasShenShi(dayGanElement, daYunGan, '正财') || yearHasShenShi(dayGanElement, daYunGan, '偏财')) : false
    const daYunHasShiShang = daYunGan ? (yearHasShenShi(dayGanElement, daYunGan, '食神') || yearHasShenShi(dayGanElement, daYunGan, '伤官')) : false

    // 地支关系
    const chongDay = isChong(zhi, dayZhi)
    const heDay = isHe(zhi, dayZhi)
    const isPeach = peachBranches.includes(zhi)
    const isYiMa = yiMaBranches.includes(zhi)

    // 五行喜忌
    const hitsXiYong = yearHasElement(gan, zhi, xiYong.bestElement)
    const hitsAvoid = xiYong.avoidedElements.some(e => yearHasElement(gan, zhi, e))
    const hitsMissing = missingElements.some(e => yearHasElement(gan, zhi, e))

    // ── 事业运评分 ──
    let career = 50
    // 官星主事业
    if (hasGuanXing) career += 15
    if (daYunHasGuan) career += 10
    // 印星主贵人
    if (hasYinXing) career += 10
    if (daYunHasYin) career += 8
    // 食伤主才华表现
    if (hasShiShang) career += 8
    // 大运吉凶
    if (isXiDaYun) career += 12
    if (daYunIsJi) career -= 15
    // 流年喜忌
    if (hitsXiYong) career += 10
    if (hitsAvoid) career -= 10
    // 冲击影响
    if (chongDay) career -= 8
    career = clamp(career, 10, 98)

    // ── 财富运评分 ──
    let wealth = 50
    // 财星
    if (hasCaiXing) wealth += 15
    if (daYunHasCai) wealth += 12
    // 食伤生财
    if (hasShiShang && hasCaiXing) wealth += 10
    if (daYunHasShiShang && hasCaiXing) wealth += 8
    // 比劫夺财
    if (hasBiJie) wealth -= 8
    // 大运
    if (isXiDaYun) wealth += 10
    if (daYunIsJi) wealth -= 12
    // 喜忌
    if (hitsXiYong) wealth += 8
    if (hitsAvoid) wealth -= 8
    wealth = clamp(wealth, 10, 98)

    // ── 婚姻运评分 ──
    let marriage = 50
    // 桃花
    if (isPeach) marriage += 10
    // 日支合
    if (heDay) marriage += 15
    // 日支冲（减分）
    if (chongDay) marriage -= 15
    // 财星（男命妻星）/ 官星（女命夫星）
    const gender = chart.birthInfo.gender
    if (gender === 'male' && hasCaiXing) marriage += 10
    if (gender === 'female' && hasGuanXing) marriage += 10
    // 大运
    if (isXiDaYun) marriage += 10
    if (daYunIsJi) marriage -= 12
    // 喜忌
    if (hitsXiYong) marriage += 8
    if (hitsAvoid) marriage -= 8
    marriage = clamp(marriage, 10, 98)

    // ── 健康运评分 ──
    let health = 50
    // 五行缺失被冲
    if (hitsMissing && chongDay) health -= 15
    else if (hitsMissing) health -= 8
    // 七杀冲日
    if (hasQiSha && chongDay) health -= 12
    // 印星护身
    if (hasYinXing) health += 12
    if (daYunHasYin) health += 8
    // 大运
    if (isXiDaYun) health += 10
    if (daYunIsJi) health -= 12
    // 喜忌
    if (hitsXiYong) health += 8
    if (hitsAvoid) health -= 8
    health = clamp(health, 10, 98)

    // ── 综合评分 ──
    const overall = clamp(Math.round(
      career * 0.30 +
      wealth * 0.25 +
      marriage * 0.20 +
      health * 0.25
    ), 10, 98)

    // ── 关键事件 ──
    const keyEvents: string[] = []
    if (hasGuanXing && daYunHasGuan) keyEvents.push('事业晋升机遇')
    if (hasShiShang && hasCaiXing) keyEvents.push('创业/副业良机')
    if (chongDay && hasShiShang) keyEvents.push('职业变动')
    if (isPeach && heDay) keyEvents.push('姻缘/婚姻之喜')
    if (isPeach) keyEvents.push('桃花旺')
    if (chongDay && daYunIsJi) keyEvents.push('感情波动')
    if (daYunHasCai && hasCaiXing) keyEvents.push('财运亨通')
    if (hasCaiXing && hasBiJie) keyEvents.push('注意财务纠纷')
    if (hasQiSha && chongDay) keyEvents.push('注意健康')
    if (hitsMissing && chongDay) keyEvents.push('健康隐患')
    if (isYiMa) keyEvents.push('出行/搬迁')
    if (heDay) keyEvents.push('合作机遇')
    if (hasYinXing && isXiDaYun) keyEvents.push('贵人相助')
    if (keyEvents.length === 0) keyEvents.push('运势平稳')

    // ── 年度建议 ──
    const advice = generateYearAdvice(career, wealth, marriage, health, overall, keyEvents, yr)

    yearResults.push({
      year: yr,
      age,
      career,
      wealth,
      marriage,
      health,
      overall,
      keyEvents: keyEvents.slice(0, 5),
      advice,
    })
  }

  // ── 趋势分析 ──
  const trend = calculateTrend(yearResults)

  // ── 峰值 / 谷值 ──
  const peakYear = yearResults.reduce((best, y) => y.overall > best.overall ? y : best, yearResults[0]).year
  const troughYear = yearResults.reduce((worst, y) => y.overall < worst.overall ? y : worst, yearResults[0]).year

  // ── 总述 ──
  const summary = generateForecastSummary(chart, yearResults, trend, peakYear, troughYear, curDaYun)

  return {
    years: yearResults,
    trend,
    peakYear,
    troughYear,
    summary,
  }
}

// ──────────────────────── 趋势计算 ────────────────────────

function calculateTrend(yearResults: FortuneYearData[]): FortuneTrend {
  if (yearResults.length < 3) return 'stable'

  const overallScores = yearResults.map(y => y.overall)

  // 线性回归斜率
  const n = overallScores.length
  const sumX = (n * (n - 1)) / 2  // 0, 1, 2, ... n-1
  const sumY = overallScores.reduce((a, b) => a + b, 0)
  const sumXY = overallScores.reduce((acc, y, i) => acc + i * y, 0)
  const sumX2 = Array.from({ length: n }, (_, i) => i * i).reduce((a, b) => a + b, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

  // 波动率（标准差 / 均值）
  const mean = sumY / n
  const variance = overallScores.reduce((acc, y) => acc + (y - mean) ** 2, 0) / n
  const volatility = Math.sqrt(variance) / (mean || 1)

  if (volatility > 0.15) return 'volatile'
  if (slope > 0.8) return 'rising'
  if (slope < -0.8) return 'declining'
  return 'stable'
}

// ──────────────────────── 年度建议生成 ────────────────────────

function generateYearAdvice(
  career: number,
  wealth: number,
  marriage: number,
  health: number,
  overall: number,
  keyEvents: string[],
  year: number,
): string {
  const parts: string[] = []

  if (overall >= 75) {
    parts.push(`${year}年综合运势极佳，属于"大吉之年"，建议大胆进取、抓住机遇。`)
  } else if (overall >= 60) {
    parts.push(`${year}年综合运势良好，可稳步推进各项计划。`)
  } else if (overall >= 45) {
    parts.push(`${year}年综合运势平稳，宜守不宜攻，谨慎行事。`)
  } else {
    parts.push(`${year}年综合运势偏弱，建议保守应对，避免重大决策。`)
  }

  // 各维度针对性建议
  if (career >= 70) {
    parts.push('事业方面机遇较多，可主动争取晋升或拓展业务。')
  } else if (career <= 40) {
    parts.push('事业方面可能遇到阻力，建议稳扎稳打，不宜冒进。')
  }

  if (wealth >= 70) {
    parts.push('财运亨通，可适度增加投资，但需注意分散风险。')
  } else if (wealth <= 40) {
    parts.push('财运偏弱，宜保守理财，避免高风险投资和借贷。')
  }

  if (marriage <= 35) {
    parts.push('感情方面可能出现波动，建议多沟通、多包容。')
  }

  if (health <= 40) {
    parts.push('健康方面需特别注意，建议定期体检，保持良好作息。')
  }

  return parts.join('')
}

// ──────────────────────── 总述生成 ────────────────────────

function generateForecastSummary(
  chart: BaZiChart,
  yearResults: FortuneYearData[],
  trend: FortuneTrend,
  peakYear: number,
  troughYear: number,
  curDaYun: ReturnType<typeof getCurrentDaYun>,
): string {
  const dayElement = chart.dayMaster.dayGanElement
  const xiYong = chart.xiYongShen

  const avgOverall = Math.round(yearResults.reduce((a, y) => a + y.overall, 0) / yearResults.length)
  const avgCareer = Math.round(yearResults.reduce((a, y) => a + y.career, 0) / yearResults.length)
  const avgWealth = Math.round(yearResults.reduce((a, y) => a + y.wealth, 0) / yearResults.length)
  const avgMarriage = Math.round(yearResults.reduce((a, y) => a + y.marriage, 0) / yearResults.length)
  const avgHealth = Math.round(yearResults.reduce((a, y) => a + y.health, 0) / yearResults.length)

  const trendLabels: Record<FortuneTrend, string> = {
    rising: '整体呈上升趋势，未来运势步步走高',
    stable: '整体保持平稳，无明显大起大落',
    declining: '整体呈下降趋势，需提前做好应对准备',
    volatile: '运势波动较大，有起有伏，需灵活应对',
  }

  const daYunDesc = curDaYun
    ? `当前大运${curDaYun.gan}${curDaYun.zhi}（${curDaYun.startYear}-${curDaYun.endYear}），${curDaYun.isXi ? '为喜用神运' : curDaYun.isJi ? '为忌神运，需谨慎' : '运势中性'}`
    : ''

  const bestYear = yearResults.find(y => y.year === peakYear)
  const worstYear = yearResults.find(y => y.year === troughYear)

  return `${daYunDesc ? daYunDesc + '。' : ''}日主${dayElement}命，喜用神为${xiYong.bestElement}。

未来${yearResults.length}年运势总览：综合均分${avgOverall}，趋势为"${trendLabels[trend]}"。
- 事业运均分${avgCareer}，${avgCareer >= 60 ? '整体较好' : avgCareer >= 45 ? '中规中矩' : '面临一定挑战'}
- 财富运均分${avgWealth}，${avgWealth >= 60 ? '财源较旺' : avgWealth >= 45 ? '收支平衡' : '需精打细算'}
- 婚姻运均分${avgMarriage}，${avgMarriage >= 60 ? '感情和睦' : avgMarriage >= 45 ? '总体平稳' : '需多沟通经营'}
- 健康运均分${avgHealth}，${avgHealth >= 60 ? '身体康健' : avgHealth >= 45 ? '亚健康状态' : '需格外注意保养'}

峰值年份：${peakYear}年（综合${bestYear?.overall}分），建议把握此年的重大机遇。
低谷年份：${troughYear}年（综合${worstYear?.overall}分），建议提前做好防守准备。`
}
