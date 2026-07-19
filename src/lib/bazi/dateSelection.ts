/**
 * 择日系统 — V4.3
 *
 * 基于天干地支、建除十二神、冲煞、五行喜用神、目的匹配的综合择日
 * 支持 7 种用途，自动筛选最佳/良好/应避开日期
 */

import type { BaZiChart, FiveElement, HeavenlyStem, EarthlyBranch, GanZhi } from './types'

// ═══════════════════════════════════════
// 接口定义
// ═══════════════════════════════════════

export interface DateSelectionInput {
  chart: BaZiChart
  purpose: DatePurpose
  dateRange: { start: Date; end: Date }
}

export type DatePurpose =
  | 'marriage'
  | 'business_opening'
  | 'moving'
  | 'groundbreaking'
  | 'signing'
  | 'travel'
  | 'ceremony'

export interface DateSelectionResult {
  bestDates: SelectedDate[]
  goodDates: SelectedDate[]
  avoidDates: SelectedDate[]
  summary: string
}

export interface SelectedDate {
  date: Date
  lunarDate: string
  ganZhi: string
  score: number
  reasons: string[]
  warnings: string[]
  valueGods: string[]
  clashInfo: string
}

// ═══════════════════════════════════════
// 常量
// ═══════════════════════════════════════

const STEMS: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const STEM_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
}

const BRANCH_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
}

const GENERATE: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

const OVERCOME: Record<FiveElement, FiveElement> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
}

const CHONG_PAIRS: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

const CHONG_MAP: Record<EarthlyBranch, EarthlyBranch> = {}
for (const [a, b] of CHONG_PAIRS) {
  CHONG_MAP[a] = b
  CHONG_MAP[b] = a
}

// 冲煞属相
const BRANCH_ZODIAC: Record<EarthlyBranch, string> = {
  '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
  '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
  '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪',
}

// 建除十二神
const JIAN_CHU_NAMES = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'] as const

// 建除十二神吉凶
const JIAN_CHU_LUCK: Record<string, '吉' | '凶' | '平'> = {
  '建': '吉', '除': '吉', '满': '吉', '平': '平', '定': '吉', '执': '平',
  '破': '凶', '危': '凶', '成': '吉', '收': '平', '开': '吉', '闭': '凶',
}

// 桃花查法（年支→桃花支）
const TAOHUA_MAP: Record<number, number> = {
  2: 3, 6: 3, 10: 3,
  5: 6, 9: 6, 1: 6,
  8: 9, 0: 9, 4: 9,
  11: 0, 3: 0, 7: 0,
}

// 红鸾查法（年支+3）
// 天喜查法（年支+9）

// 驿马查法
const YIMA_MAP: Record<number, number> = {
  2: 10, 6: 10, 10: 10,
  5: 1, 9: 1, 1: 1,
  8: 4, 0: 4, 4: 4,
  11: 7, 3: 7, 7: 7,
}

// 天德查法（月支→天德所在天干）
const TIAN_DE_GAN: Record<number, HeavenlyStem[]> = {
  0: ['丁'], 1: ['庚'], 2: ['壬'], 3: ['辛'],
  4: ['亥' as unknown as HeavenlyStem], 5: ['丙'], 6: ['乙'], 7: ['巳' as unknown as HeavenlyStem],
  8: ['甲'], 9: ['癸'], 10: ['寅' as unknown as HeavenlyStem], 11: ['庚'],
}

// 月德查法（月支→月德所在天干）
const YUE_DE_GAN: Record<number, HeavenlyStem> = {
  0: '丙', 1: '甲', 2: '壬', 3: '庚',
  4: '丙', 5: '甲', 6: '壬', 7: '庚',
  8: '丙', 9: '甲', 10: '壬', 11: '庚',
}

// 农历月份名
const LUNAR_MONTH_NAMES = [
  '正', '二', '三', '四', '五', '六',
  '七', '八', '九', '十', '冬', '腊',
]

// 农历日名
const LUNAR_DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
]

// 用途中文名
const PURPOSE_NAMES: Record<DatePurpose, string> = {
  'marriage': '结婚',
  'business_opening': '开业',
  'moving': '搬家',
  'groundbreaking': '动土',
  'signing': '签约',
  'travel': '出行',
  'ceremony': '庆典',
}

// ═══════════════════════════════════════
// 农历数据表 (1900-2100)
// ═══════════════════════════════════════

const LUNAR_INFO: number[] = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
  0x0d520,
]

// 农历 1900 年正月初一 对应的公历日期：1900-01-31
const LUNAR_BASE_DATE = new Date(1900, 0, 31)

// 获取农历年的总天数
function lunarYearDays(year: number): number {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_INFO[year - 1900] & i) ? 1 : 0
  }
  return sum + leapDays(year)
}

// 获取农历年闰月天数
function leapDays(year: number): number {
  if (leapMonth(year)) {
    return (LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29
  }
  return 0
}

// 获取农历年闰月月份（0=无闰月）
function leapMonth(year: number): number {
  return LUNAR_INFO[year - 1900] & 0xf
}

// 获取农历年某月天数
function lunarMonthDays(year: number, month: number): number {
  return (LUNAR_INFO[year - 1900] & (0x10000 >> month)) ? 30 : 29
}

// 公历转农历
interface LunarDate {
  year: number
  month: number
  day: number
  isLeap: boolean
}

function solarToLunar(date: Date): LunarDate {
  const baseDate = new Date(LUNAR_BASE_DATE)
  let offset = Math.floor((date.getTime() - baseDate.getTime()) / 86400000)

  let lunarYear = 1900
  let daysInYear: number

  // 确定农历年
  for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
    daysInYear = lunarYearDays(lunarYear)
    offset -= daysInYear
  }
  if (offset < 0) {
    offset += daysInYear!
    lunarYear--
  }

  // 确定农历月
  const leap = leapMonth(lunarYear)
  let isLeap = false
  let lunarMonth = 1

  for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
    if (leap > 0 && lunarMonth === (leap + 1) && !isLeap) {
      --lunarMonth
      isLeap = true
      daysInYear = leapDays(lunarYear)
    } else {
      daysInYear = lunarMonthDays(lunarYear, lunarMonth)
    }
    if (isLeap && lunarMonth === (leap + 1)) {
      isLeap = false
    }
    offset -= daysInYear
  }

  if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
    if (isLeap) {
      isLeap = false
    } else {
      isLeap = true
      --lunarMonth
    }
  }

  if (offset < 0) {
    offset += daysInYear!
    --lunarMonth
  }

  const lunarDay = offset + 1

  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    isLeap,
  }
}

function formatLunarDate(lunar: LunarDate): string {
  const monthName = (lunar.isLeap ? '闰' : '') + LUNAR_MONTH_NAMES[lunar.month - 1] + '月'
  const dayName = LUNAR_DAY_NAMES[lunar.day - 1]
  const ganzhiYear = STEMS[(lunar.year - 4) % 10] + BRANCHES[(lunar.year - 4) % 12]
  return `${ganzhiYear}年${monthName}${dayName}`
}

// ═══════════════════════════════════════
// 天干地支计算
// ═══════════════════════════════════════

/**
 * 计算某日的天干地支
 * 基准：1900年1月1日 = 甲戌日（甲=0, 戌=10）
 */
function getDayGanZhi(date: Date): { gan: HeavenlyStem; zhi: EarthlyBranch } {
  const base = new Date(1900, 0, 1)
  const diffDays = Math.floor((date.getTime() - base.getTime()) / 86400000)
  const ganIdx = ((diffDays % 10) + 10) % 10
  const zhiIdx = ((diffDays + 10) % 12 + 12) % 12
  return { gan: STEMS[ganIdx], zhi: BRANCHES[zhiIdx] }
}

/**
 * 计算某日的年柱天干地支（以立春为界，简化处理用节气近似）
 */
function getYearGanZhi(date: Date): { gan: HeavenlyStem; zhi: EarthlyBranch } {
  const year = date.getFullYear()
  // 简化：以2月4日（立春近似）为年柱分界
  const lichunApprox = new Date(year, 1, 4)
  const effectiveYear = date < lichunApprox ? year - 1 : year
  const ganIdx = ((effectiveYear - 4) % 10 + 10) % 10
  const zhiIdx = ((effectiveYear - 4) % 12 + 12) % 12
  return { gan: STEMS[ganIdx], zhi: BRANCHES[zhiIdx] }
}

/**
 * 计算某日的月柱地支（简化：基于节令）
 */
function getMonthZhi(date: Date): EarthlyBranch {
  const month = date.getMonth() + 1
  const day = date.getDate()

  // 节令大约日期（简化版）
  const solarTermDays: Record<number, [number, EarthlyBranch]> = {
    1: [6, '丑'], 2: [4, '寅'], 3: [6, '卯'], 4: [5, '辰'],
    5: [6, '巳'], 6: [6, '午'], 7: [7, '未'], 8: [8, '申'],
    9: [8, '酉'], 10: [8, '戌'], 11: [7, '亥'], 12: [7, '子'],
  }

  const [termDay, defaultZhi] = solarTermDays[month]!
  if (day >= termDay) {
    return defaultZhi
  }

  // 上一个节令的地支
  const prevMonth = month === 1 ? 12 : month - 1
  const [_, prevZhi] = solarTermDays[prevMonth]!
  return prevZhi!
}

/**
 * 计算月柱天干（年干推月干：甲己之年丙作首）
 */
function getMonthGan(yearGan: HeavenlyStem, monthZhi: EarthlyBranch): HeavenlyStem {
  const yearGanIdx = STEMS.indexOf(yearGan)
  const baseGanIdx = (yearGanIdx % 5) * 2  // 甲己→0(丙), 乙庚→2(戊), 丙辛→4(庚), 丁壬→6(壬), 戊癸→8(甲)
  const monthZhiIdx = BRANCHES.indexOf(monthZhi)
  return STEMS[(baseGanIdx + monthZhiIdx) % 10]
}

// ═══════════════════════════════════════
// 建除十二神
// ═══════════════════════════════════════

function getJianChu(monthZhi: EarthlyBranch, dayZhi: EarthlyBranch): string[] {
  const monthIdx = BRANCHES.indexOf(monthZhi)
  const dayIdx = BRANCHES.indexOf(dayZhi)
  const offset = ((dayIdx - monthIdx) % 12 + 12) % 12

  const gods: string[] = []
  for (let i = 0; i < 12; i++) {
    const godIdx = (offset + i) % 12
    gods.push(JIAN_CHU_NAMES[godIdx])
  }
  return gods
}

function getMainJianChu(monthZhi: EarthlyBranch, dayZhi: EarthlyBranch): string {
  const monthIdx = BRANCHES.indexOf(monthZhi)
  const dayIdx = BRANCHES.indexOf(dayZhi)
  const offset = ((dayIdx - monthIdx) % 12 + 12) % 12
  return JIAN_CHU_NAMES[offset]
}

// ═══════════════════════════════════════
// 冲煞计算
// ═══════════════════════════════════════

function getClashInfo(dayZhi: EarthlyBranch, yearZhi: EarthlyBranch): string {
  const clashZhi = CHONG_MAP[dayZhi]
  const zodiac = BRANCH_ZODIAC[clashZhi]
  return `${dayZhi}日冲${clashZhi}（${zodiac}），煞${BRANCH_ZODIAC[dayZhi]}`
}

// ═══════════════════════════════════════
// 神煞检测
// ═══════════════════════════════════════

interface DayShenSha {
  taohua: boolean
  hongluan: boolean
  tianxi: boolean
  yima: boolean
  tiande: boolean
  yuede: boolean
  names: string[]
}

function checkDayShenSha(
  dayZhi: EarthlyBranch,
  dayGan: HeavenlyStem,
  monthZhi: EarthlyBranch,
  yearZhi: EarthlyBranch,
  monthGan: HeavenlyStem,
): DayShenSha {
  const yearZhiIdx = BRANCHES.indexOf(yearZhi)
  const monthZhiIdx = BRANCHES.indexOf(monthZhi)
  const names: string[] = []

  // 桃花
  const taohuaZhi = BRANCHES[TAOHUA_MAP[yearZhiIdx]]
  const isTaohua = dayZhi === taohuaZhi
  if (isTaohua) names.push('桃花')

  // 红鸾
  const hongluanZhi = BRANCHES[(yearZhiIdx + 3) % 12]
  const isHongluan = dayZhi === hongluanZhi
  if (isHongluan) names.push('红鸾')

  // 天喜
  const tianxiZhi = BRANCHES[(yearZhiIdx + 9) % 12]
  const isTianxi = dayZhi === tianxiZhi
  if (isTianxi) names.push('天喜')

  // 驿马
  const yimaZhi = BRANCHES[YIMA_MAP[yearZhiIdx]]
  const isYima = dayZhi === yimaZhi
  if (isYima) names.push('驿马')

  // 天德（月支查）
  const tiandeGans = TIAN_DE_GAN[monthZhiIdx] || []
  const isTiande = tiandeGans.some(g => g === dayGan) ||
    tiandeGans.some(g => g === dayZhi)
  if (isTiande) names.push('天德')

  // 月德（月支查）
  const yuedeGan = YUE_DE_GAN[monthZhiIdx]
  const isYuede = dayGan === yuedeGan
  if (isYuede) names.push('月德')

  return {
    taohua: isTaohua,
    hongluan: isHongluan,
    tianxi: isTianxi,
    yima: isYima,
    tiande: isTiande,
    yuede: isYuede,
    names,
  }
}

// ═══════════════════════════════════════
// 评分系统
// ═══════════════════════════════════════

interface DayScoreBreakdown {
  baseScore: number
  reasons: string[]
  warnings: string[]
  valueGodScore: number
  shenshaScore: number
  clashScore: number
  elementScore: number
  purposeScore: number
}

function scoreDate(
  date: Date,
  chart: BaZiChart,
  purpose: DatePurpose,
): { score: number; reasons: string[]; warnings: string[]; valueGods: string[]; clashInfo: string; ganZhi: string } {
  const breakdown: DayScoreBreakdown = {
    baseScore: 50,
    reasons: [],
    warnings: [],
    valueGodScore: 0,
    shenshaScore: 0,
    clashScore: 0,
    elementScore: 0,
    purposeScore: 0,
  }

  // 日柱干支
  const dayGZ = getDayGanZhi(date)
  const yearGZ = getYearGanZhi(date)
  const monthZhi = getMonthZhi(date)
  const monthGan = getMonthGan(yearGZ.gan, monthZhi)

  const ganZhi = `${dayGZ.gan}${dayGZ.zhi}`
  const dayElement = STEM_ELEMENT[dayGZ.gan]
  const dayBranchElement = BRANCH_ELEMENT[dayGZ.zhi]

  // 1. 冲煞检测（最重要的一票否决项）
  const clashZhi = CHONG_MAP[dayGZ.zhi]

  // 冲用户日柱
  if (clashZhi === chart.sixLines.day.zhi) {
    breakdown.clashScore -= 30
    breakdown.warnings.push(`日支${dayGZ.zhi}冲用户日支${chart.sixLines.day.zhi}，大凶，强烈避开`)
  }

  // 冲用户年柱
  if (clashZhi === chart.sixLines.year.zhi) {
    breakdown.clashScore -= 20
    breakdown.warnings.push(`日支${dayGZ.zhi}冲用户年支${chart.sixLines.year.zhi}，不利`)
  }

  // 冲用户月柱
  if (clashZhi === chart.sixLines.month.zhi) {
    breakdown.clashScore -= 10
    breakdown.warnings.push(`日支${dayGZ.zhi}冲用户月支${chart.sixLines.month.zhi}`)
  }

  // 日支与用户日支相合（加分）
  const DI_ZHI_HE: [EarthlyBranch, EarthlyBranch][] = [
    ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
  ]
  for (const [a, b] of DI_ZHI_HE) {
    const set = new Set([dayGZ.zhi, chart.sixLines.day.zhi])
    if (set.has(a) && set.has(b)) {
      breakdown.clashScore += 15
      breakdown.reasons.push(`日支${dayGZ.zhi}与用户日支${chart.sixLines.day.zhi}六合`)
      break
    }
  }

  // 2. 建除十二神
  const jianChuGods = getJianChu(monthZhi, dayGZ.zhi)
  const mainGod = getMainJianChu(monthZhi, dayGZ.zhi)
  const godLuck = JIAN_CHU_LUCK[mainGod]

  if (godLuck === '吉') {
    breakdown.valueGodScore += 15
    breakdown.reasons.push(`值神「${mainGod}」为吉神`)
  } else if (godLuck === '凶') {
    breakdown.valueGodScore -= 15
    breakdown.warnings.push(`值神「${mainGod}」为凶神，不利`)
  }

  // 3. 神煞检测
  const shenSha = checkDayShenSha(dayGZ.zhi, dayGZ.gan, monthZhi, yearGZ.zhi, monthGan)

  if (shenSha.names.length > 0) {
    breakdown.shenshaScore += shenSha.names.length * 5
    breakdown.reasons.push(`值${shenSha.names.join('、')}`)
  }

  // 4. 五行匹配
  const xiYong = chart.xiYongShen

  // 日干生喜用神
  if (GENERATE[dayElement] === xiYong.bestElement) {
    breakdown.elementScore += 15
    breakdown.reasons.push(`日干${dayGZ.gan}(${dayElement})生喜用神${xiYong.bestElement}`)
  }

  // 日干为喜用神
  if (dayElement === xiYong.bestElement) {
    breakdown.elementScore += 10
    breakdown.reasons.push(`日干属${dayElement}，恰为喜用神`)
  }

  // 日支生喜用神
  if (GENERATE[dayBranchElement] === xiYong.bestElement) {
    breakdown.elementScore += 8
    breakdown.reasons.push(`日支${dayGZ.zhi}(${dayBranchElement})生喜用神${xiYong.bestElement}`)
  }

  // 日干克喜用神
  if (OVERCOME[dayElement] === xiYong.bestElement) {
    breakdown.elementScore -= 10
    breakdown.warnings.push(`日干${dayGZ.gan}(${dayElement})克喜用神${xiYong.bestElement}`)
  }

  // 日干为忌神
  if (xiYong.avoidedElements && xiYong.avoidedElements.includes(dayElement)) {
    breakdown.elementScore -= 10
    breakdown.warnings.push(`日干属${dayElement}，为忌神`)
  }

  // 5. 用途匹配
  scoreByPurpose(purpose, dayGZ, monthZhi, yearGZ, shenSha, breakdown)

  // 综合评分
  const totalScore = Math.max(0, Math.min(100,
    breakdown.baseScore +
    breakdown.clashScore +
    breakdown.valueGodScore +
    breakdown.shenshaScore +
    breakdown.elementScore +
    breakdown.purposeScore
  ))

  // 冲煞信息
  const clashInfo = getClashInfo(dayGZ.zhi, yearGZ.zhi)

  return {
    score: totalScore,
    reasons: breakdown.reasons,
    warnings: breakdown.warnings,
    valueGods: [`建除十二神：${mainGod}`, ...shenSha.names.map(n => `神煞：${n}`)],
    clashInfo,
    ganZhi,
  }
}

function scoreByPurpose(
  purpose: DatePurpose,
  dayGZ: { gan: HeavenlyStem; zhi: EarthlyBranch },
  monthZhi: EarthlyBranch,
  yearGZ: { gan: HeavenlyStem; zhi: EarthlyBranch },
  shenSha: DayShenSha,
  breakdown: DayScoreBreakdown,
): void {
  const dayElement = STEM_ELEMENT[dayGZ.gan]

  switch (purpose) {
    case 'marriage':
      // 桃花/红鸾/天喜日
      if (shenSha.taohua) {
        breakdown.purposeScore += 12
        breakdown.reasons.push('逢桃花日，利于婚嫁')
      }
      if (shenSha.hongluan) {
        breakdown.purposeScore += 15
        breakdown.reasons.push('逢红鸾日，婚姻大吉')
      }
      if (shenSha.tianxi) {
        breakdown.purposeScore += 12
        breakdown.reasons.push('逢天喜日，喜庆临门')
      }
      // 天德/月德日
      if (shenSha.tiande) {
        breakdown.purposeScore += 10
        breakdown.reasons.push('逢天德日，百事皆宜')
      }
      if (shenSha.yuede) {
        breakdown.purposeScore += 8
        breakdown.reasons.push('逢月德日，德行护佑')
      }
      // 破日大凶
      if (JIAN_CHU_LUCK[getMainJianChu(monthZhi, dayGZ.zhi)] === '凶') {
        breakdown.purposeScore -= 15
        breakdown.warnings.push('值神为凶，不宜婚嫁')
      }
      break

    case 'business_opening':
      // 财星日：日干五行为金（金生水为财，或看日干克者为财）
      if (dayElement === '金') {
        breakdown.purposeScore += 10
        breakdown.reasons.push('日干属金，利于财运')
      }
      if (dayElement === '水') {
        breakdown.purposeScore += 8
        breakdown.reasons.push('日干属水，财源广进')
      }
      // 禄神日（日干临官之位）
      const luMap: Partial<Record<HeavenlyStem, EarthlyBranch>> = {
        '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午',
        '戊': '巳', '己': '午', '庚': '申', '辛': '酉',
        '壬': '亥', '癸': '子',
      }
      if (luMap[dayGZ.gan] === dayGZ.zhi) {
        breakdown.purposeScore += 15
        breakdown.reasons.push('逢禄神日，财运亨通')
      }
      // 天德/月德
      if (shenSha.tiande) {
        breakdown.purposeScore += 10
        breakdown.reasons.push('逢天德日，开业大吉')
      }
      if (shenSha.yuede) {
        breakdown.purposeScore += 8
        breakdown.reasons.push('逢月德日，贵人相助')
      }
      break

    case 'moving':
      // 驿马日
      if (shenSha.yima) {
        breakdown.purposeScore += 15
        breakdown.reasons.push('逢驿马日，利于迁徙')
      }
      // 天德日
      if (shenSha.tiande) {
        breakdown.purposeScore += 10
        breakdown.reasons.push('逢天德日，平安顺利')
      }
      // 土日利于安居
      if (BRANCH_ELEMENT[dayGZ.zhi] === '土') {
        breakdown.purposeScore += 5
        breakdown.reasons.push('日支属土，利于安宅')
      }
      break

    case 'groundbreaking':
      // 土日利于动土
      if (dayElement === '土') {
        breakdown.purposeScore += 10
        breakdown.reasons.push('日干属土，利于动土')
      }
      if (BRANCH_ELEMENT[dayGZ.zhi] === '土') {
        breakdown.purposeScore += 8
        breakdown.reasons.push('日支属土，根基稳固')
      }
      // 天德日
      if (shenSha.tiande) {
        breakdown.purposeScore += 10
        breakdown.reasons.push('逢天德日，动土平安')
      }
      if (shenSha.yuede) {
        breakdown.purposeScore += 8
        breakdown.reasons.push('逢月德日，德行护佑')
      }
      break

    case 'signing':
      // 官印日
      if (dayElement === '金' || dayElement === '土') {
        breakdown.purposeScore += 8
        breakdown.reasons.push(`日干属${dayElement}，利于签约`)
      }
      // 天德/天乙
      if (shenSha.tiande) {
        breakdown.purposeScore += 12
        breakdown.reasons.push('逢天德日，签约有贵人')
      }
      if (shenSha.yuede) {
        breakdown.purposeScore += 10
        breakdown.reasons.push('逢月德日，合同顺利')
      }
      // 成日
      if (getMainJianChu(monthZhi, dayGZ.zhi) === '成') {
        breakdown.purposeScore += 10
        breakdown.reasons.push('逢成日，百事可成')
      }
      break

    case 'travel':
      // 驿马日
      if (shenSha.yima) {
        breakdown.purposeScore += 15
        breakdown.reasons.push('逢驿马日，出行顺利')
      }
      // 天德日
      if (shenSha.tiande) {
        breakdown.purposeScore += 10
        breakdown.reasons.push('逢天德日，旅途平安')
      }
      // 开日
      if (getMainJianChu(monthZhi, dayGZ.zhi) === '开') {
        breakdown.purposeScore += 8
        breakdown.reasons.push('逢开日，出行通达')
      }
      break

    case 'ceremony':
      // 天德/月德
      if (shenSha.tiande) {
        breakdown.purposeScore += 12
        breakdown.reasons.push('逢天德日，庆典吉祥')
      }
      if (shenSha.yuede) {
        breakdown.purposeScore += 10
        breakdown.reasons.push('逢月德日，德泽众人')
      }
      // 桃花/红鸾
      if (shenSha.taohua || shenSha.hongluan) {
        breakdown.purposeScore += 8
        breakdown.reasons.push('逢桃花/红鸾日，喜庆热闹')
      }
      // 成日
      if (getMainJianChu(monthZhi, dayGZ.zhi) === '成') {
        breakdown.purposeScore += 8
        breakdown.reasons.push('逢成日，典礼圆满')
      }
      break
  }
}

// ═══════════════════════════════════════
// 总述生成
// ═══════════════════════════════════════

function generateSummary(
  purpose: DatePurpose,
  bestDates: SelectedDate[],
  goodDates: SelectedDate[],
  avoidDates: SelectedDate[],
  dateRange: { start: Date; end: Date },
  chart: BaZiChart,
): string {
  const purposeName = PURPOSE_NAMES[purpose]
  const startStr = `${dateRange.start.getFullYear()}-${String(dateRange.start.getMonth() + 1).padStart(2, '0')}-${String(dateRange.start.getDate()).padStart(2, '0')}`
  const endStr = `${dateRange.end.getFullYear()}-${String(dateRange.end.getMonth() + 1).padStart(2, '0')}-${String(dateRange.end.getDate()).padStart(2, '0')}`

  let summary = `择日分析总述：为日主「${chart.sixLines.day.gan}」${purposeName}择吉，`
  summary += `查询范围${startStr}至${endStr}，共${bestDates.length + goodDates.length + avoidDates.length}天。`
  summary += `其中最佳日期${bestDates.length}个，良好日期${goodDates.length}个，应避开日期${avoidDates.length}个。`

  if (bestDates.length > 0) {
    const best = bestDates[0]
    const bestDateStr = `${best.date.getFullYear()}-${String(best.date.getMonth() + 1).padStart(2, '0')}-${String(best.date.getDate()).padStart(2, '0')}`
    summary += `首推${bestDateStr}（${best.ganZhi}），评分${best.score}分。`
    if (best.reasons.length > 0) {
      summary += best.reasons.slice(0, 3).join('；') + '。'
    }
  }

  summary += `择日以用户命盘喜用神「${chart.xiYongShen.bestElement}」为核心，`
  summary += `结合建除十二神、冲煞关系、神煞值日、五行生克等多维度综合评估。`
  summary += `建议优先选择最佳日期，如时间不允许，良好日期亦可择用。`

  return summary
}

// ═══════════════════════════════════════
// 主函数
// ═══════════════════════════════════════

/**
 * 择日系统 — 综合择吉日
 * @param input 择日输入（用户命盘、目的、日期范围）
 * @returns 择日结果（最佳/良好/避开日期 + 总述）
 */
export function selectAuspiciousDate(input: DateSelectionInput): DateSelectionResult {
  const { chart, purpose, dateRange } = input

  // 遍历日期范围内的每一天
  const allDates: SelectedDate[] = []
  const current = new Date(dateRange.start)
  const end = new Date(dateRange.end)

  while (current <= end) {
    const dateToCheck = new Date(current)
    const result = scoreDate(dateToCheck, chart, purpose)

    // 农历日期
    const lunar = solarToLunar(dateToCheck)
    const lunarStr = formatLunarDate(lunar)

    allDates.push({
      date: dateToCheck,
      lunarDate: lunarStr,
      ganZhi: result.ganZhi,
      score: result.score,
      reasons: result.reasons,
      warnings: result.warnings,
      valueGods: result.valueGods,
      clashInfo: result.clashInfo,
    })

    current.setDate(current.getDate() + 1)
  }

  // 按评分排序
  allDates.sort((a, b) => b.score - a.score)

  // 分类
  const bestDates = allDates.filter(d => d.score >= 80).slice(0, 5)
  const goodDates = allDates.filter(d => d.score >= 60 && d.score < 80).slice(0, 10)
  const avoidDates = allDates.filter(d => d.score < 35).slice(0, 10)

  // 生成总述
  const summary = generateSummary(purpose, bestDates, goodDates, avoidDates, dateRange, chart)

  return {
    bestDates,
    goodDates,
    avoidDates,
    summary,
  }
}