import { getPreciseCalendar } from './calendar'
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../core/constants'
import type { HeavenlyStem, EarthlyBranch } from '../core/types'
import type { CalendarSnapshot } from 'qimendunjia-standalone'

export interface PreciseLunarInfo {
  cycleYear: number
  year: number
  yearText: string
  ganZhiYear: string
  month: number
  leap: boolean
  monthText: string
  day: number
  dayText: string
  fullText: string
}

export interface PreciseGanZhi {
  gan: HeavenlyStem
  zhi: EarthlyBranch
  ganZhi: string
  xun: string
  kongWang: string[]
}

export interface PreciseHour {
  shichenIndex: number
  shichenName: string
  ganZhi: string
  xun: string
}

export interface PreciseCalendarResult {
  solarDate: string
  solarTime: string
  weekday: string
  solarTermName: string
  lunar: PreciseLunarInfo
  yearGanZhi: PreciseGanZhi
  monthGanZhi: PreciseGanZhi
  dayGanZhi: PreciseGanZhi
  hours: PreciseHour[]
  snapshot: CalendarSnapshot
}

export function getWeekdayText(dayIndex: number): string {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return '星期' + weekdays[dayIndex]
}

export function lunarDayText(d: number): string {
  if (d < 1 || d > 30) return ''
  const nums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  if (d <= 10) {
    return d === 10 ? '初十' : '初' + nums[d - 1]
  }
  if (d < 20) {
    return '十' + nums[d - 11]
  }
  if (d === 20) return '二十'
  if (d < 30) {
    return '廿' + nums[d - 21]
  }
  return '三十'
}

export function lunarMonthText(m: number, leap: boolean): string {
  if (m < 1 || m > 12) return ''
  const monthNames = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
  const text = monthNames[m - 1]
  return leap ? '闰' + text : text
}

export function lunarYearText(y: number): string {
  const digitMap: Record<string, string> = {
    '0': '〇', '1': '一', '2': '二', '3': '三', '4': '四',
    '5': '五', '6': '六', '7': '七', '8': '八', '9': '九',
  }
  return String(y)
    .split('')
    .map((ch) => digitMap[ch] || ch)
    .join('')
}

export function getGanZhiFromPair(gz: string): { gan: HeavenlyStem; zhi: EarthlyBranch } {
  const gan = gz[0] as HeavenlyStem
  const zhi = gz[1] as EarthlyBranch
  return { gan, zhi }
}

export function getXunAndKongWang(zhi: EarthlyBranch, ganIdxOffset: number = 0): { xun: string; kongWang: string[] } {
  const zhiIdx = EARTHLY_BRANCHES.indexOf(zhi)
  const ganIdx = (zhiIdx + ganIdxOffset) % 10
  const xunShouZhiIdx = (zhiIdx - ganIdx + 12) % 12
  const xunShouZhi = EARTHLY_BRANCHES[xunShouZhiIdx]
  const xunShouGan = HEAVENLY_STEMS[(xunShouZhiIdx + ganIdxOffset) % 10] || HEAVENLY_STEMS[0]
  const xun = xunShouGan + xunShouZhi + '旬'
  const kongWangZhi1 = EARTHLY_BRANCHES[(xunShouZhiIdx + 10) % 12]
  const kongWangZhi2 = EARTHLY_BRANCHES[(xunShouZhiIdx + 11) % 12]
  return { xun, kongWang: [kongWangZhi1, kongWangZhi2] }
}

export function createPreciseCalendar(
  date: Date,
  options?: { solarTermMode?: 'shouxing' | 'lite'; lateZiHourMode?: 'same-day' | 'next-day' }
): PreciseCalendarResult {
  const result = getPreciseCalendar(date, options)
  return result as PreciseCalendarResult
}
