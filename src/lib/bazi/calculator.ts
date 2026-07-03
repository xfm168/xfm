/**
 * 八字排盘核心算法
 * 协调各专业模块完成四柱排盘
 */

import type {
  HeavenlyStem,
  EarthlyBranch,
  FiveElement,
  BirthInfo,
  GanZhi,
  SixLines,
  FiveElementCount,
  CangGan,
  DayMasterAnalysis,
  XiYongShen,
  BaZiAnalysis,
  BaZiChart,
  ZiShiStrategyType,
} from './types'

import { DEFAULT_BAZI_ANALYSIS } from '../../constants/defaultAnalysis'

// ─── 统一从 Core 导入基础常量 ───
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  MONTH_BRANCHES,
  CANG_GAN,
  getStemElement,
  getStemYinYang,
} from '@/lib/core'

// 各模块
import { getSolarTermDate, getYearSolarTerms, getMonthZhiIndex, isAfterLiChun } from './solarTerms'
import { getNaYin } from './nayin'
import { getChangSheng } from './changsheng'
import { getRelatedShens } from './shishen'
import { determineGeJu } from './geju'
import { calculateStrength } from './wuxing'
import { determineXiYongShen } from './xiyongshen'
// P0-② 子时换日策略
import { resolveChartDate, computeHourIndex } from './zishi'
// P0-③ 真太阳时
import { calculateSolarTime, getCityCoordinate } from './solarTime'
export { calculateSolarTime, getCityCoordinate } from './solarTime'

// ========== JDN 日柱算法 ==========

function toJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

const BASE_JDN_2000 = 2451545
const BASE_INDEX_2000 = 54 // 戊午

function ganZhiFromIndex(index: number): { gan: HeavenlyStem; zhi: EarthlyBranch } {
  const normalized = ((index % 60) + 60) % 60
  return {
    gan: HEAVENLY_STEMS[normalized % 10],
    zhi: EARTHLY_BRANCHES[normalized % 12],
  }
}

function getDayGanZhi(date: Date): GanZhi {
  const jdn = toJDN(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const diff = jdn - BASE_JDN_2000
  const index = ((BASE_INDEX_2000 + diff) % 60 + 60) % 60
  const { gan, zhi } = ganZhiFromIndex(index)
  return {
    gan,
    zhi,
    element: getStemElement(gan),
    yinYang: getStemYinYang(gan),
    naYin: getNaYin(gan, zhi),
  }
}

// ========== 年柱 ==========

function getYearGanZhi(date: Date): GanZhi {
  const year = date.getFullYear()
  // 立春分年：使用真节气判断
  if (!isAfterLiChun(date, year)) {
    // 未到立春，属于上一年
    const prevYear = year - 1
    const stemIndex = ((prevYear - 4) % 10 + 10) % 10
    const branchIndex = ((prevYear - 4) % 12 + 12) % 12
    const gan = HEAVENLY_STEMS[stemIndex]
    const zhi = EARTHLY_BRANCHES[branchIndex]
    return {
      gan,
      zhi,
      element: getStemElement(gan),
      yinYang: getStemYinYang(gan),
      naYin: getNaYin(gan, zhi),
    }
  }

  const stemIndex = ((year - 4) % 10 + 10) % 10
  const branchIndex = ((year - 4) % 12 + 12) % 12
  const gan = HEAVENLY_STEMS[stemIndex]
  const zhi = EARTHLY_BRANCHES[branchIndex]

  return {
    gan,
    zhi,
    element: getStemElement(gan),
    yinYang: getStemYinYang(gan),
    naYin: getNaYin(gan, zhi),
  }
}

// ========== 月柱 ==========

function getMonthGanZhi(date: Date, yearGan: HeavenlyStem): GanZhi {
  const monthZhiIndex = getMonthZhiIndex(date)
  const zhi = MONTH_BRANCHES[monthZhiIndex]

  // 五虎遁：月干起法
  const yearStemIdx = HEAVENLY_STEMS.indexOf(yearGan)
  const mod = yearStemIdx % 5
  let monthStemBase = 0
  if (mod === 0) {
    monthStemBase = 2 // 甲己起丙寅
  } else if (mod === 1) {
    monthStemBase = 4 // 乙庚起戊寅
  } else if (mod === 2) {
    monthStemBase = 6 // 丙辛起庚寅
  } else if (mod === 3) {
    monthStemBase = 8 // 丁壬起壬寅
  } else {
    monthStemBase = 0 // 戊癸起甲寅
  }

  const gan = HEAVENLY_STEMS[(monthStemBase + monthZhiIndex) % 10]

  return {
    gan,
    zhi,
    element: getStemElement(gan),
    yinYang: getStemYinYang(gan),
    naYin: getNaYin(gan, zhi),
  }
}

// ========== 时柱 ==========

/**
 * 时柱计算（支持新签名 hourIndex 与旧签名 date 兼容）
 *
 * 新签名：getHourGanZhi(hourIndex, dayGan) —— 推荐使用，配合子时换日策略
 * 旧签名：getHourGanZhi(date, dayGan) —— 兼容旧调用，内部计算 hourIndex
 */
function getHourGanZhi(hourIndex: number, dayGan: HeavenlyStem): GanZhi
function getHourGanZhi(date: Date, dayGan: HeavenlyStem): GanZhi
function getHourGanZhi(arg1: number | Date, dayGan: HeavenlyStem): GanZhi {
  let hourIndex: number
  if (typeof arg1 === 'number') {
    // 新签名：直接使用 hourIndex
    hourIndex = arg1
  } else {
    // 旧签名：从 date 计算 hourIndex（兼容旧调用）
    hourIndex = computeHourIndex(arg1.getHours(), arg1.getMinutes())
  }

  const zhi = EARTHLY_BRANCHES[hourIndex]

  // 五鼠遁
  const dayStemIdx = HEAVENLY_STEMS.indexOf(dayGan)
  const mod = dayStemIdx % 5
  let hourStemBase = 0
  if (mod === 0) {
    hourStemBase = 0
  } else if (mod === 1) {
    hourStemBase = 2
  } else if (mod === 2) {
    hourStemBase = 4
  } else if (mod === 3) {
    hourStemBase = 6
  } else {
    hourStemBase = 8
  }

  const gan = HEAVENLY_STEMS[(hourStemBase + hourIndex) % 10]

  return {
    gan,
    zhi,
    element: getStemElement(gan),
    yinYang: getStemYinYang(gan),
    naYin: getNaYin(gan, zhi),
  }
}

// ========== 五行统计 ==========

function calculateFiveElementCount(sixLines: SixLines): FiveElementCount {
  const count: FiveElementCount = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }

  const pillars: GanZhi[] = [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]

  for (const gz of pillars) {
    count[gz.element] += 1.0

    const cang = CANG_GAN[gz.zhi]
    count[getStemElement(cang.ben)] += 0.6
    if (cang.zhong) count[getStemElement(cang.zhong)] += 0.3
    if (cang.yao) count[getStemElement(cang.yao)] += 0.1
  }

  return count
}

// ========== 主排盘函数 ==========

/**
 * 八字排盘入口
 *
 * @param birthInfo 出生信息
 * @param options 可选配置
 *   - ziShiStrategy: 子时换日策略（'late'|'early'|'gregorian'），默认 'late'
 *   - useSolarTime: 是否使用真太阳时（默认 false，需提供 longitude 或 region）
 *   - longitude: 出生地经度（东经为正），优先于 region
 */
export function calculateBaZi(
  birthInfo: BirthInfo,
  options?: {
    ziShiStrategy?: ZiShiStrategyType
    useSolarTime?: boolean
    longitude?: number
  },
): BaZiChart {
  const [year, month, day] = birthInfo.birthDate.split('-').map(Number)
  const [hours, minutes] = birthInfo.birthTime.split(':').map(Number)

  let birthDate = new Date(year, month - 1, day, hours, minutes)

  // P0-③ 真太阳时校正
  if (options?.useSolarTime || birthInfo.solarTime) {
    const coord = options?.longitude !== undefined
      ? { longitude: options.longitude, latitude: 0 }
      : getCityCoordinate(birthInfo.region ?? '')
    const solarResult = calculateSolarTime(birthDate, coord)
    birthDate = solarResult.solarTime
  }

  // P0-② 子时换日策略解析：得到排盘日期 chartDate 与时辰索引 hourIndex
  const { chartDate, hourIndex } = resolveChartDate(birthDate, options?.ziShiStrategy)

  // 四柱：日柱/年柱/月柱使用 chartDate 计算，时柱使用 hourIndex 计算
  const yearGanZhi = getYearGanZhi(chartDate)
  const monthGanZhi = getMonthGanZhi(chartDate, yearGanZhi.gan)
  const dayGanZhi = getDayGanZhi(chartDate)
  const hourGanZhi = getHourGanZhi(hourIndex, dayGanZhi.gan)

  const sixLines: SixLines = {
    year: yearGanZhi,
    month: monthGanZhi,
    day: dayGanZhi,
    hour: hourGanZhi,
  }

  // 十神
  const relatedShens = getRelatedShens(dayGanZhi.gan)

  // 补充四柱的十神和十二长生
  const enrichedSixLines: SixLines = {
    year: { ...sixLines.year, shenShi: relatedShens[sixLines.year.gan], changSheng: getChangSheng(dayGanZhi.gan, sixLines.year.zhi) },
    month: { ...sixLines.month, shenShi: relatedShens[sixLines.month.gan], changSheng: getChangSheng(dayGanZhi.gan, sixLines.month.zhi) },
    day: { ...sixLines.day, shenShi: relatedShens[sixLines.day.gan], changSheng: getChangSheng(dayGanZhi.gan, sixLines.day.zhi) },
    hour: { ...sixLines.hour, shenShi: relatedShens[sixLines.hour.gan], changSheng: getChangSheng(dayGanZhi.gan, sixLines.hour.zhi) },
  }

  // 五行统计
  const fiveElementCount = calculateFiveElementCount(enrichedSixLines)

  // 旺衰
  const strengthResult = calculateStrength(enrichedSixLines, dayGanZhi.gan, monthGanZhi.zhi)

  // 格局
  const geJuResult = determineGeJu(
    enrichedSixLines,
    relatedShens,
    strengthResult.strengthScore,
    dayGanZhi.gan,
    monthGanZhi.zhi,
    fiveElementCount,
  )

  // 日主分析
  const dayMaster: DayMasterAnalysis = {
    dayGan: dayGanZhi.gan,
    dayGanElement: dayGanZhi.element as FiveElement,
    dayGanYinYang: dayGanZhi.yinYang,
    relatedShens,
    wangShuai: strengthResult.wangShuai,
    strengthScore: strengthResult.strengthScore,
  }

  // 喜用神
  const xiYongResult = determineXiYongShen(
    strengthResult.strengthScore,
    strengthResult.wangShuai,
    geJuResult.name,
    dayGanZhi.element as FiveElement,
  )

  const xiYongShen: XiYongShen = {
    bestElement: xiYongResult.bestElement,
    happiness: xiYongResult.description,
    usage: `喜${xiYongResult.bestElement}，忌${xiYongResult.avoidedElements.join('、')}。`,
    avoidedElements: xiYongResult.avoidedElements,
  }

  const analysis: BaZiAnalysis = { ...DEFAULT_BAZI_ANALYSIS }
  const overallScore = Math.round(60 + (strengthResult.strengthScore / 100) * 40)

  return {
    birthInfo,
    sixLines: enrichedSixLines,
    fiveElementCount,
    dayMaster,
    cangGan: CANG_GAN,
    xiYongShen,
    analysis,
    overallScore,
    version: '3.0',
    createdAt: Date.now(),
  }
}

// ========== 导出工具函数（供测试） ==========

export {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  getDayGanZhi,
  getYearGanZhi,
  getMonthGanZhi,
  getHourGanZhi,
  getSolarTermDate,
  getYearSolarTerms,
}
