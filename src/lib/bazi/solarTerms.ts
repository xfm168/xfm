/**
 * 真节气计算（寿星天文历算法）
 * 使用 qimendunjia-standalone 接入 ShouXing 寿星天文历
 * 参考：sxtwl / Swiss Ephemeris 天文算法标准
 */

import { getSolarTerms } from 'qimendunjia-standalone'
import type { SolarTermName } from './types'

export type { SolarTermName }

export interface SolarTermInfo {
  name: SolarTermName
  month: number
  day: number
  hour: number
  minute: number
  julianDay: number
}

// 二十四节气名称顺序（与 qimendunjia-standalone 一致）
// 小寒, 大寒, 立春, 雨水, 惊蛰, 春分,
// 清明, 谷雨, 立夏, 小满, 芒种, 夏至,
// 小暑, 大暑, 立秋, 处暑, 白露, 秋分,
// 寒露, 霜降, 立冬, 小雪, 大雪, 冬至

// 节气对应的月支索引（地支序号：0=寅, 1=卯, 2=辰, 3=巳, 4=午, 5=未, 6=申, 7=酉, 8=戌, 9=亥, 10=子, 11=丑）
// 从立春开始算寅月，小寒之前分别是丑月和子月
const TERM_TO_MONTH_ZHI: Record<number, number> = {
  0: 11,  // 小寒 → 丑月
  1: 10,  // 大寒 → 子月
  2: 0,   // 立春 → 寅月
  3: 0,   // 雨水 → 寅月
  4: 1,   // 惊蛰 → 卯月
  5: 1,   // 春分 → 卯月
  6: 2,   // 清明 → 辰月
  7: 2,   // 谷雨 → 辰月
  8: 3,   // 立夏 → 巳月
  9: 3,   // 小满 → 巳月
  10: 4,  // 芒种 → 午月
  11: 4,  // 夏至 → 午月
  12: 5,  // 小暑 → 未月
  13: 5,  // 大暑 → 未月
  14: 6,  // 立秋 → 申月
  15: 6,  // 处暑 → 申月
  16: 7,  // 白露 → 酉月
  17: 7,  // 秋分 → 酉月
  18: 8,  // 寒露 → 戌月
  19: 8,  // 霜降 → 戌月
  20: 9,  // 立冬 → 亥月
  21: 9,  // 小雪 → 亥月
  22: 10, // 大雪 → 子月
  23: 10, // 冬至 → 子月
}

// 缓存：year -> solar terms array
const termsCache: Record<number, ReturnType<typeof getSolarTerms>> = {}

/**
 * 获取某年的全部二十四节气（带缓存）
 */
function getYearTermsCached(year: number) {
  if (!termsCache[year]) {
    termsCache[year] = getSolarTerms(year)
  }
  return termsCache[year]
}

/**
 * JDN 转本地日历日期
 */
function jdnToDate(jdn: number): { year: number; month: number; day: number; hour: number; minute: number } {
  // 寿星天文历返回的 JDN 是 UTC 日期，需要转换为本地日期
  // 先用 getJulianDay 获取 UTC 0 点 JDN，然后计算
  const Z = Math.floor(jdn + 0.5)
  const F = jdn + 0.5 - Z

  let A = Z
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25)
    A = Z + 1 + alpha - Math.floor(alpha / 4)
  }
  const B = A + 1524
  const C = Math.floor((B - 122.1) / 365.25)
  const D = Math.floor(365.25 * C)
  const E = Math.floor((B - D) / 30.6001)

  const day = B - D - Math.floor(30.6001 * E) + F
  const month = E < 14 ? E - 1 : E - 13
  const year = month > 2 ? C - 4716 : C - 4716

  const hours = (day % 1) * 24
  const minutes = (hours % 1) * 60

  return {
    year,
    month,
    day: Math.floor(day),
    hour: Math.floor(hours),
    minute: Math.round(minutes),
  }
}

/**
 * 获取某年某个节气的时间（北京时间）
 */
export function getSolarTermDate(year: number, termName: SolarTermName): SolarTermInfo {
  const terms = getYearTermsCached(year)
  const term = terms.find(t => t.name === termName)

  if (!term) {
    // Fallback: should not happen
    return {
      name: termName,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      julianDay: 0,
    }
  }

  const result = jdnToDate(term.julianDay)

  return {
    name: termName,
    month: result.month,
    day: result.day,
    hour: result.hour,
    minute: result.minute,
    julianDay: term.julianDay,
  }
}

/**
 * 获取某年的全部二十四节气
 */
export function getYearSolarTerms(year: number): SolarTermInfo[] {
  const terms = getYearTermsCached(year)
  return terms.map(term => {
    const result = jdnToDate(term.julianDay)
    return {
      name: term.name as SolarTermName,
      month: result.month,
      day: result.day,
      hour: result.hour,
      minute: result.minute,
      julianDay: term.julianDay,
    }
  })
}

/**
 * 获取指定日期所在的月柱月支索引
 * 基于节气分界：日期落在哪个节气之后，就属于哪个地支月份
 */
export function getMonthZhiIndex(date: Date): number {
  const year = date.getFullYear()

  // 获取当年节气
  const terms = getYearTermsCached(year)

  // 找到最后一个满足条件的节气索引
  let lastIndex = -1
  for (let i = 0; i < terms.length; i++) {
    const term = terms[i]
    const termDate = term.date
    if (date >= termDate) {
      lastIndex = i
    }
  }

  // 如果1月份还没到小寒（1月6日左右），属于丑月
  if (lastIndex === -1) {
    return 11
  }

  return TERM_TO_MONTH_ZHI[lastIndex]
}

/**
 * 判断是否已过立春（用于年柱分界）
 * @param date 要判断的日期
 * @param year 当前年（公历年）
 * @returns true=已过立春，false=未到立春
 */
export function isAfterLiChun(date: Date, year: number): boolean {
  const lichun = getSolarTermDate(year, '立春')
  const lichunDate = new Date(year, lichun.month - 1, lichun.day, lichun.hour, lichun.minute)

  // 如果查询日期在立春时间之前，且是同一年，说明还没到立春
  if (date < lichunDate) {
    return false
  }
  return true
}
