import type { BaseRule, RuleContext, RuleResult } from './engine'
import type { HeavenlyStem, EarthlyBranch, GanZhi, SolarTermName } from '../types'
import { getYearSolarTerms } from '../solarTerms'
import { getNaYin } from '../nayin'

// ─── 统一从 Core 导入基础常量 ───
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  MONTH_BRANCHES,
  getStemElement,
  getStemYinYang,
} from '@/lib/core'

const TERM_ORDER: SolarTermName[] = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
  '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
]

export interface DaYunStep {
  index: number
  ganZhi: GanZhi
  startAge: number
  endAge: number
  startYear: number
  endYear: number
  startDate: Date
}

export interface QiYunResult {
  qiYunDays: number
  qiYunAge: string
  qiYunDate: Date
  isShun: boolean
  confidence: number
  diffMinutes: number
  fromTerm: string
  toTerm: string
}

export interface DaYunRuleContext extends RuleContext {
  birthDate: Date
  dayGan: HeavenlyStem
  gender: 'male' | 'female'
}

export interface DaYunRuleResult extends RuleResult {
  isShun: boolean
  description: string
  reference: string
}

export type DaYunRule = BaseRule<DaYunRuleContext, DaYunRuleResult>

export const DAYUN_RULES: DaYunRule[] = [
  {
    id: 'yang-nan-shun',
    name: '阳男顺行',
    category: '大运顺逆',
    priority: 100,
    weight: 100,
    description: '阳干日主之男命，大运顺行',
    reference: '《三命通会·论大运》',
    condition: (ctx) => ctx.gender === 'male' && getStemYinYang(ctx.dayGan) === '阳',
    result: {
      isShun: true,
      description: '阳男顺行，大运从月柱依次顺推',
      reference: '《三命通会·论大运》',
    },
  },
  {
    id: 'yin-nan-ni',
    name: '阴男逆行',
    category: '大运顺逆',
    priority: 100,
    weight: 100,
    description: '阴干日主之男命，大运逆行',
    reference: '《三命通会·论大运》',
    condition: (ctx) => ctx.gender === 'male' && getStemYinYang(ctx.dayGan) === '阴',
    result: {
      isShun: false,
      description: '阴男逆行，大运从月柱依次逆推',
      reference: '《三命通会·论大运》',
    },
  },
  {
    id: 'yin-nv-shun',
    name: '阴女顺行',
    category: '大运顺逆',
    priority: 100,
    weight: 100,
    description: '阴干日主之女命，大运顺行',
    reference: '《三命通会·论大运》',
    condition: (ctx) => ctx.gender === 'female' && getStemYinYang(ctx.dayGan) === '阴',
    result: {
      isShun: true,
      description: '阴女顺行，大运从月柱依次顺推',
      reference: '《三命通会·论大运》',
    },
  },
  {
    id: 'yang-nv-ni',
    name: '阳女逆行',
    category: '大运顺逆',
    priority: 100,
    weight: 100,
    description: '阳干日主之女命，大运逆行',
    reference: '《三命通会·论大运》',
    condition: (ctx) => ctx.gender === 'female' && getStemYinYang(ctx.dayGan) === '阳',
    result: {
      isShun: false,
      description: '阳女逆行，大运从月柱依次逆推',
      reference: '《三命通会·论大运》',
    },
  },
]

function buildGanZhi(gan: HeavenlyStem, zhi: EarthlyBranch): GanZhi {
  return {
    gan,
    zhi,
    element: getStemElement(gan),
    yinYang: getStemYinYang(gan),
    naYin: getNaYin(gan, zhi),
  }
}

function getTermDate(year: number, termName: SolarTermName): Date {
  const terms = getYearSolarTerms(year)
  const term = terms.find((t: { name: string }) => t.name === termName)
  if (!term) {
    return new Date(year, 0, 1)
  }
  return new Date(year, term.month - 1, term.day, term.hour, term.minute)
}

function findNeighborTerms(birthDate: Date): { prevTerm: { name: SolarTermName; date: Date }; nextTerm: { name: SolarTermName; date: Date } } {
  const year = birthDate.getFullYear()
  const termsAll: { name: SolarTermName; date: Date }[] = []

  for (const termName of TERM_ORDER) {
    termsAll.push({ name: termName, date: getTermDate(year, termName) })
  }

  const prevYearTerms: { name: SolarTermName; date: Date }[] = []
  for (const termName of TERM_ORDER) {
    prevYearTerms.push({ name: termName, date: getTermDate(year - 1, termName) })
  }

  const nextYearTerms: { name: SolarTermName; date: Date }[] = []
  for (const termName of TERM_ORDER) {
    nextYearTerms.push({ name: termName, date: getTermDate(year + 1, termName) })
  }

  const allTerms = [...prevYearTerms, ...termsAll, ...nextYearTerms].sort((a, b) => a.date.getTime() - b.date.getTime())

  let prevTerm = allTerms[0]
  let nextTerm = allTerms[allTerms.length - 1]

  for (let i = 0; i < allTerms.length; i++) {
    if (allTerms[i].date <= birthDate) {
      prevTerm = allTerms[i]
    }
    if (allTerms[i].date > birthDate) {
      nextTerm = allTerms[i]
      break
    }
  }

  return { prevTerm, nextTerm }
}

export function calcDaYunStart(
  birthDate: Date,
  dayGan: HeavenlyStem,
  gender: 'male' | 'female',
): QiYunResult {
  const dayYinYang = getStemYinYang(dayGan)
  const isShun = (gender === 'male' && dayYinYang === '阳') || (gender === 'female' && dayYinYang === '阴')

  const { prevTerm, nextTerm } = findNeighborTerms(birthDate)

  let diffMs: number
  let fromTerm: string
  let toTerm: string

  if (isShun) {
    diffMs = nextTerm.date.getTime() - birthDate.getTime()
    fromTerm = '出生时刻'
    toTerm = nextTerm.name
  } else {
    diffMs = birthDate.getTime() - prevTerm.date.getTime()
    fromTerm = prevTerm.name
    toTerm = '出生时刻'
  }

  const diffMinutes = Math.round(diffMs / (1000 * 60))
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  const qiYunDays = diffDays / 3

  const birthYear = birthDate.getFullYear()
  const birthMonth = birthDate.getMonth()
  const birthDay = birthDate.getDate()

  const qiYunYearsTotal = qiYunDays
  const qiYunYears = Math.floor(qiYunYearsTotal)
  const remainingMonthsTotal = (qiYunYearsTotal - qiYunYears) * 12
  const qiYunMonths = Math.floor(remainingMonthsTotal)
  const remainingDaysTotal = (remainingMonthsTotal - qiYunMonths) * 30
  const qiYunDaysRemain = Math.floor(remainingDaysTotal)

  const qiYunDate = new Date(birthDate)
  qiYunDate.setFullYear(birthYear + qiYunYears)
  qiYunDate.setMonth(birthMonth + qiYunMonths)
  qiYunDate.setDate(birthDay + qiYunDaysRemain)

  const qiYunAge = `${qiYunYears}岁${qiYunMonths}月${qiYunDaysRemain}天`

  return {
    qiYunDays,
    qiYunAge,
    qiYunDate,
    isShun,
    confidence: 95,
    diffMinutes,
    fromTerm,
    toTerm,
  }
}

export function generateDaYun(
  birthDate: Date,
  dayGan: HeavenlyStem,
  gender: 'male' | 'female',
  monthZhi: EarthlyBranch,
  steps: number = 8,
): DaYunStep[] {
  const qiYun = calcDaYunStart(birthDate, dayGan, gender)
  const { isShun, qiYunDate } = qiYun

  const monthZhiIndex = MONTH_BRANCHES.indexOf(monthZhi)
  if (monthZhiIndex === -1) {
    return []
  }

  const yearGan = getYearGan(birthDate)
  const monthGan = calculateMonthGanFromYearGan(yearGan, monthZhiIndex)
  const monthGanIndex = HEAVENLY_STEMS.indexOf(monthGan)

  const result: DaYunStep[] = []
  const birthYear = birthDate.getFullYear()

  for (let i = 0; i < steps; i++) {
    let ganIdx: number
    let zhiIdx: number

    if (isShun) {
      ganIdx = (monthGanIndex + i + 1) % 10
      zhiIdx = (monthZhiIndex + i + 1) % 12
    } else {
      ganIdx = (monthGanIndex - i - 1 + 10) % 10
      zhiIdx = (monthZhiIndex - i - 1 + 12) % 12
    }

    const gan = HEAVENLY_STEMS[ganIdx]
    const zhi = MONTH_BRANCHES[zhiIdx]
    const ganZhi = buildGanZhi(gan, zhi)

    const startAgeYears = qiYun.qiYunDays + i * 10
    const startAge = Math.floor(startAgeYears)
    const endAge = startAge + 10

    const startYear = birthYear + Math.floor(qiYun.qiYunDays) + i * 10
    const endYear = startYear + 10

    const stepStartDate = new Date(qiYunDate)
    stepStartDate.setFullYear(stepStartDate.getFullYear() + i * 10)

    result.push({
      index: i + 1,
      ganZhi,
      startAge,
      endAge,
      startYear,
      endYear,
      startDate: stepStartDate,
    })
  }

  return result
}

function getYearGan(date: Date): HeavenlyStem {
  const year = date.getFullYear()
  const stemIndex = ((year - 4) % 10 + 10) % 10
  return HEAVENLY_STEMS[stemIndex]
}

function calculateMonthGanFromYearGan(yearGan: HeavenlyStem, monthZhiIndex: number): HeavenlyStem {
  const yearGanIndex = HEAVENLY_STEMS.indexOf(yearGan)
  const mod = yearGanIndex % 5

  let monthStemBase: number
  if (mod === 0) {
    monthStemBase = 2
  } else if (mod === 1) {
    monthStemBase = 4
  } else if (mod === 2) {
    monthStemBase = 6
  } else if (mod === 3) {
    monthStemBase = 8
  } else {
    monthStemBase = 0
  }

  return HEAVENLY_STEMS[(monthStemBase + monthZhiIndex) % 10]
}

export function getLiuNian(year: number): { gan: HeavenlyStem; zhi: EarthlyBranch } {
  const stemIndex = ((year - 4) % 10 + 10) % 10
  const branchIndex = ((year - 4) % 12 + 12) % 12
  return {
    gan: HEAVENLY_STEMS[stemIndex],
    zhi: EARTHLY_BRANCHES[branchIndex],
  }
}

export function getLiuYue(year: number, month: number): { gan: HeavenlyStem; zhi: EarthlyBranch } {
  const { gan: yearGan } = getLiuNian(year)
  const monthZhiIndex = ((month - 1) % 12 + 12) % 12
  const gan = calculateMonthGanFromYearGan(yearGan, monthZhiIndex)
  const zhi = MONTH_BRANCHES[monthZhiIndex]

  return { gan, zhi }
}
