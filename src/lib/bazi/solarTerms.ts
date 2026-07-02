/**
 * 真节气计算（寿星天文历算法）
 * V4.8.1 - P0-① 节气精确到时分秒
 *
 * 使用 qimendunjia-standalone 接入 ShouXing 寿星天文历
 * 参考：sxtwl / Swiss Ephemeris 天文算法标准
 *
 * 变更记录：
 * v1.0.0 - 初始版本，分钟级精度
 * v2.0.0 - P0-① 升级：秒级精度，直接使用库返回的 Date 对象
 *
 * 核心改动：
 *   旧版通过 jdnToDate(julianDay) 重新转换日期，丢失秒级精度
 *   新版直接使用库返回的 term.date（完整 Date 对象），保留秒级精度
 */

import { getSolarTerms } from 'qimendunjia-standalone'
import type { SolarTermName } from './types'
import type { ExplainResult } from './explain/types'
import { ExplainBuilder } from './explain/types'

export type { SolarTermName }

/**
 * 二十四节气信息（秒级精度）
 */
export interface SolarTermInfo {
  name: SolarTermName
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number       // 新增：秒级精度
  julianDay: number
  /** 完整 Date 对象（用于精确比较） */
  date: Date
}

// 二十四节气名称顺序（与 qimendunjia-standalone 一致）
// 小寒, 大寒, 立春, 雨水, 惊蛰, 春分,
// 清明, 谷雨, 立夏, 小满, 芒种, 夏至,
// 小暑, 大暑, 立秋, 处暑, 白露, 秋分,
// 寒露, 霜降, 立冬, 小雪, 大雪, 冬至

// 节气对应的月支索引（地支序号：0=寅, 1=卯, 2=辰, 3=巳, 4=午, 5=未, 6=申, 7=酉, 8=戌, 9=亥, 10=子, 11=丑）
//
// 关键：只有「节」(月始) 才换月支，「气」(中气) 不换月。
//   节（月始）：立春/惊蛰/清明/立夏/芒种/小暑/立秋/白露/寒露/立冬/大雪/小寒
//   气（中气）：雨水/春分/谷雨/小满/夏至/大暑/处暑/秋分/霜降/小雪/冬至/大寒
// 故 大寒(气) 不换月，小寒→立春 整段为丑月。
//
// Acceptance ① 修复：大寒原误映射为子月，实为丑月（大寒是中气不换月）。
const TERM_TO_MONTH_ZHI: Record<number, number> = {
  0: 11,  // 小寒(节) → 丑月始
  1: 11,  // 大寒(气) → 丑月（不换月）
  2: 0,   // 立春(节) → 寅月始
  3: 0,   // 雨水(气) → 寅月
  4: 1,   // 惊蛰(节) → 卯月始
  5: 1,   // 春分(气) → 卯月
  6: 2,   // 清明(节) → 辰月始
  7: 2,   // 谷雨(气) → 辰月
  8: 3,   // 立夏(节) → 巳月始
  9: 3,   // 小满(气) → 巳月
  10: 4,  // 芒种(节) → 午月始
  11: 4,  // 夏至(气) → 午月
  12: 5,  // 小暑(节) → 未月始
  13: 5,  // 大暑(气) → 未月
  14: 6,  // 立秋(节) → 申月始
  15: 6,  // 处暑(气) → 申月
  16: 7,  // 白露(节) → 酉月始
  17: 7,  // 秋分(气) → 酉月
  18: 8,  // 寒露(节) → 戌月始
  19: 8,  // 霜降(气) → 戌月
  20: 9,  // 立冬(节) → 亥月始
  21: 9,  // 小雪(气) → 亥月
  22: 10, // 大雪(节) → 子月始
  23: 10, // 冬至(气) → 子月
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
 * 将库返回的 SolarTermInfo 转换为本模块的 SolarTermInfo（含秒级精度）
 *
 * 关键：直接使用库返回的 Date 对象，不再通过 JDN 重新转换
 */
function convertTermInfo(term: { name: string; date: Date; julianDay: number }): SolarTermInfo {
  const d = term.date
  return {
    name: term.name as SolarTermName,
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
    second: d.getSeconds(),  // 秒级精度
    julianDay: term.julianDay,
    date: d,                  // 保留完整 Date 对象
  }
}

/**
 * 获取某年某个节气的时间（秒级精度）
 *
 * @example
 * const lichun = getSolarTermDate(2026, '立春')
 * // lichun.second = 32  ← 秒级精度
 */
export function getSolarTermDate(year: number, termName: SolarTermName): SolarTermInfo {
  const terms = getYearTermsCached(year)
  const term = terms.find(t => t.name === termName)

  if (!term) {
    // 不应发生：24节气必然存在
    return {
      name: termName,
      year,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      julianDay: 0,
      date: new Date(year, 0, 1),
    }
  }

  return convertTermInfo(term)
}

/**
 * 获取某年的全部二十四节气（秒级精度）
 */
export function getYearSolarTerms(year: number): SolarTermInfo[] {
  const terms = getYearTermsCached(year)
  return terms.map(term => convertTermInfo(term))
}

/**
 * 获取指定日期所在的月柱月支索引
 * 基于节气分界：日期落在哪个节气之后，就属于哪个地支月份
 *
 * v2.0.0 改动：直接使用 Date 对象比较，精确到秒
 */
export function getMonthZhiIndex(date: Date): number {
  const year = date.getFullYear()

  // 获取当年节气
  const terms = getYearTermsCached(year)

  // 找到最后一个满足条件的节气索引
  let lastIndex = -1
  for (let i = 0; i < terms.length; i++) {
    const term = terms[i]
    // 直接使用 Date 对象比较，精确到秒
    if (date >= term.date) {
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
 * v2.0.0 改动：精确到秒级比较
 *
 * @param date 要判断的日期
 * @param year 当前年（公历年）
 * @returns true=已过立春，false=未到立春
 */
export function isAfterLiChun(date: Date, year: number): boolean {
  const lichun = getSolarTermDate(year, '立春')

  // 直接使用 Date 对象比较，精确到秒
  // 立春时刻 date >= lichun.date 即为已过立春
  if (date < lichun.date) {
    return false
  }
  return true
}

// ========== Explain API ==========

/**
 * 生成节气相关的 Explain
 * 说明本次排盘使用的节气精度和交节时刻
 */
export function explainSolarTerms(date: Date, year: number): ExplainResult {
  const terms = getYearSolarTerms(year)
  const lichun = terms.find(t => t.name === '立春')

  const builder = new ExplainBuilder('节气排盘')
    .setEvidenceLevel('A')
    .setConfidence(98)
    .addRule('RULE-PP-021')
    .addRule('RULE-PP-069')
    .addReference('寿星天文历（ShouXing）')
    .addReference('qimendunjia-standalone v0.1.0')

  builder.addReason(
    'solar-term-precision',
    `节气精度：秒级（v2.0.0）`,
    true,
    10,
    'second',
  )

  if (lichun) {
    const lc = lichun.date
    const lcStr = `${lc.getFullYear()}-${String(lc.getMonth() + 1).padStart(2, '0')}-${String(lc.getDate()).padStart(2, '0')} ${String(lc.getHours()).padStart(2, '0')}:${String(lc.getMinutes()).padStart(2, '0')}:${String(lc.getSeconds()).padStart(2, '0')}`
    const passed = date >= lichun.date
    builder.addReason(
      'lichun-boundary',
      `立春时刻：${lcStr}`,
      true,
      20,
      passed ? '已过立春' : '未到立春',
    )
    builder.addReason(
      'year-pillar',
      `年柱归属：${passed ? '本年' : '上一年'}`,
      true,
      15,
    )
  }

  // 找到当前月柱对应的节气
  const monthZhiIndex = getMonthZhiIndex(date)
  const monthZhiNames = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
  builder.addReason(
    'month-pillar',
    `月支：${monthZhiNames[monthZhiIndex]}月（基于节气换月）`,
    true,
    15,
  )

  return builder.build()
}
