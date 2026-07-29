import { createCalendarSnapshot, getSolarTerms, CalendarHour } from 'qimendunjia-standalone'
import { CalendarProvider, PreciseCalendarResult, PreciseGanZhi, PreciseHour, PreciseLunarInfo, CalendarProviderOptions } from '../types'
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../../../core/constants'
import type { HeavenlyStem, EarthlyBranch } from '../../../core/types'

interface ChineseCalendar {
  new (): {
    fromDate(date: Date): ChineseCalendarInstance
    get(): [number, number, number, number, number]
  }
}

interface ChineseCalendarInstance {
  fromDate(date: Date): ChineseCalendarInstance
  get(): [number, number, number, number, number]
}

const { CalendarChinese } = require('date-chinese') as { CalendarChinese: ChineseCalendar }

export class QimenStandaloneCalendarProvider implements CalendarProvider {
  readonly name = 'qimendunjia-standalone'
  readonly version = '0.1.0'
  readonly capabilities = {
    preciseSolarTerms: true,
    preciseLunar: true,
    preciseHourGanZhi: true,
    lunarRange: { minYear: 1900, maxYear: 2100 },
  }

  getPreciseCalendar(date: Date, opts?: CalendarProviderOptions): PreciseCalendarResult {
    const snapshot = createCalendarSnapshot(date, {
      solarTermMode: opts?.solarTermMode ?? 'shouxing',
      lateZiHourMode: opts?.lateZiHourMode ?? 'same-day',
    })

    const pad = (n: number) => String(n).padStart(2, '0')
    const solarDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    const solarTime = `${pad(date.getHours())}:${pad(date.getMinutes())}`
    const weekday = this.getWeekdayText(date.getDay())
    const solarTermName = snapshot.solarTermName || ''

    const lunar = this.getLunarInfoFromDate(date, snapshot.yearGanZhi)

    const yearPair = this.getGanZhiFromPair(snapshot.yearGanZhi)
    const monthPair = this.getGanZhiFromPair(snapshot.monthGanZhi)
    const dayPair = this.getGanZhiFromPair(snapshot.dayGanZhi)

    const yearGanZhi: PreciseGanZhi = {
      gan: yearPair.gan,
      zhi: yearPair.zhi,
      ganZhi: snapshot.yearGanZhi,
      ...this.getXunKongWang(yearPair.zhi),
    }

    const monthGanZhi: PreciseGanZhi = {
      gan: monthPair.gan,
      zhi: monthPair.zhi,
      ganZhi: snapshot.monthGanZhi,
      ...this.getXunKongWang(monthPair.zhi),
    }

    const dayGanZhi: PreciseGanZhi = {
      gan: dayPair.gan,
      zhi: dayPair.zhi,
      ganZhi: snapshot.dayGanZhi,
      ...this.getXunKongWang(dayPair.zhi),
    }

    const hours: PreciseHour[] = snapshot.hours.map((h: CalendarHour, idx: number) => {
      const pair = this.getGanZhiFromPair(h.ganZhi)
      const shichenName = EARTHLY_BRANCHES[idx] + '时'
      return {
        shichenIndex: idx,
        shichenName,
        ganZhi: h.ganZhi,
        xun: this.getXunKongWang(pair.zhi).xun,
      }
    })

    return {
      solarDate,
      solarTime,
      weekday,
      solarTermName,
      lunar,
      yearGanZhi,
      monthGanZhi,
      dayGanZhi,
      hours,
      snapshot,
    }
  }

  getSolarTerms(year: number, opts?: CalendarProviderOptions) {
    return getSolarTerms(year, { solarTermMode: opts?.solarTermMode ?? 'shouxing' })
  }

  private getGanZhiFromPair(gz: string): { gan: HeavenlyStem; zhi: EarthlyBranch } {
    const gan = gz[0] as HeavenlyStem
    const zhi = gz[1] as EarthlyBranch
    return { gan, zhi }
  }

  private getXunKongWang(zhi: EarthlyBranch, ganIdxOffset: number = 0): { xun: string; kongWang: string[] } {
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

  private getLunarInfoFromDate(date: Date, ganZhiYear: string): PreciseLunarInfo {
    const cal = new CalendarChinese()
    cal.fromDate(date)
    const [cycle, lunarYear, lunarMonth, leapNum, lunarDay] = cal.get()
    const isLeap = leapNum === 1
    const cycleYear = (cycle - 1) * 60 + 1864 + (lunarYear - 1)
    const yearText = this.lunarYearText(cycleYear)
    const monthText = this.lunarMonthText(lunarMonth, isLeap)
    const dayText = this.lunarDayText(lunarDay)
    const fullText = `${ganZhiYear}年 ${monthText} ${dayText}`

    return {
      cycleYear,
      year: lunarYear,
      yearText,
      ganZhiYear,
      month: lunarMonth,
      leap: isLeap,
      monthText,
      day: lunarDay,
      dayText,
      fullText,
    }
  }

  private getWeekdayText(dayIndex: number): string {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return '星期' + weekdays[dayIndex]
  }

  private lunarDayText(d: number): string {
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

  private lunarMonthText(m: number, leap: boolean): string {
    if (m < 1 || m > 12) return ''
    const monthNames = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
    const text = monthNames[m - 1]
    return leap ? '闰' + text : text
  }

  private lunarYearText(y: number): string {
    const digitMap: Record<string, string> = {
      '0': '〇', '1': '一', '2': '二', '3': '三', '4': '四',
      '5': '五', '6': '六', '7': '七', '8': '八', '9': '九',
    }
    return String(y)
      .split('')
      .map((ch) => digitMap[ch] || ch)
      .join('')
  }
}
