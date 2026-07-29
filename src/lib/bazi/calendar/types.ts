import type { CalendarSnapshot, SolarTermInfo } from 'qimendunjia-standalone'
import type { HeavenlyStem, EarthlyBranch } from '../../core/types'

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
  snapshot?: CalendarSnapshot
}

export interface CalendarProviderOptions {
  solarTermMode?: 'shouxing' | 'lite'
  lateZiHourMode?: 'same-day' | 'next-day'
}

export interface CalendarProvider {
  readonly name: string
  readonly version: string
  getPreciseCalendar(date: Date, opts?: CalendarProviderOptions): PreciseCalendarResult
  getSolarTerms(year: number, opts?: CalendarProviderOptions): SolarTermInfo[]
  readonly capabilities: {
    preciseSolarTerms: boolean
    preciseLunar: boolean
    preciseHourGanZhi: boolean
    lunarRange: { minYear: number; maxYear: number }
  }
}
