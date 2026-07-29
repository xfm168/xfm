import type { SolarTermInfo } from 'qimendunjia-standalone'
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

const GAN_ZHI_60: string[] = [
  '甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
  '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
  '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
  '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
  '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
  '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥',
]

export class DateChineseCalendarProvider implements CalendarProvider {
  readonly name = 'date-chinese'
  readonly version = '2.1.4'
  readonly capabilities = {
    preciseSolarTerms: false,
    preciseLunar: true,
    preciseHourGanZhi: false,
    lunarRange: { minYear: 1900, maxYear: 2100 },
  }

  getPreciseCalendar(date: Date, _opts?: CalendarProviderOptions): PreciseCalendarResult {
    const pad = (n: number) => String(n).padStart(2, '0')
    const solarDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    const solarTime = `${pad(date.getHours())}:${pad(date.getMinutes())}`
    const weekday = this.getWeekdayText(date.getDay())
    const solarTermName = ''

    const ganZhiYearFallback = this.calcYearGanZhiFallback(date.getFullYear())
    const lunar = this.getLunarInfoFromDate(date, ganZhiYearFallback)

    const yearGanZhi = this.calcYearGanZhiFromLunar(lunar.cycleYear)
    const monthGanZhi = this.calcMonthGanZhiFallback(yearGanZhi.gan, lunar.month)
    const dayGanZhi = this.calcDayGanZhiFallback(date)

    const hours: PreciseHour[] = this.calcHoursFallback(dayGanZhi.gan)

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
    }
  }

  getSolarTerms(_year: number, _opts?: CalendarProviderOptions): SolarTermInfo[] {
    console.warn(`[DateChineseCalendarProvider] getSolarTerms not supported (capabilities.preciseSolarTerms=false)`)
    return []
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

  private buildPreciseGanZhi(ganZhiStr: string): PreciseGanZhi {
    const pair = this.getGanZhiFromPair(ganZhiStr)
    return {
      gan: pair.gan,
      zhi: pair.zhi,
      ganZhi: ganZhiStr,
      ...this.getXunKongWang(pair.zhi),
    }
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

  private calcDayGanZhiFallback(date: Date): PreciseGanZhi {
    const baseDate = new Date('1900-01-01T00:00:00')
    const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
    const baseOffset = 10
    const ganZhiIdx = ((daysDiff + baseOffset) % 60 + 60) % 60
    const ganZhiStr = GAN_ZHI_60[ganZhiIdx]
    return this.buildPreciseGanZhi(ganZhiStr)
  }

  private calcYearGanZhiFallback(solarYear: number): string {
    const baseYear = 1984
    const offset = ((solarYear - baseYear) % 60 + 60) % 60
    return GAN_ZHI_60[offset]
  }

  private calcYearGanZhiFromLunar(cycleYear: number): PreciseGanZhi {
    const baseYear = 1984
    const offset = ((cycleYear - baseYear) % 60 + 60) % 60
    const ganZhiStr = GAN_ZHI_60[offset]
    return this.buildPreciseGanZhi(ganZhiStr)
  }

  private calcMonthGanZhiFallback(yearGan: HeavenlyStem, lunarMonth: number): PreciseGanZhi {
    const yearGanIdx = HEAVENLY_STEMS.indexOf(yearGan)
    const monthGanStartMap: Record<number, number> = {
      0: 2,
      1: 4,
      2: 6,
      3: 8,
      4: 0,
      5: 2,
      6: 4,
      7: 6,
      8: 8,
      9: 0,
    }
    const startGanIdx = monthGanStartMap[yearGanIdx] ?? 2
    const adjustedMonthIdx = (lunarMonth + 1) % 12
    const monthGanIdx = (startGanIdx + adjustedMonthIdx - 2 + 10) % 10
    const monthZhiStartIdx = 2
    const monthZhiIdx = (monthZhiStartIdx + adjustedMonthIdx - 2 + 12) % 12
    const ganZhiStr = HEAVENLY_STEMS[monthGanIdx] + EARTHLY_BRANCHES[monthZhiIdx]
    return this.buildPreciseGanZhi(ganZhiStr)
  }

  private calcHoursFallback(dayGan: HeavenlyStem): PreciseHour[] {
    const dayGanIdx = HEAVENLY_STEMS.indexOf(dayGan)
    const hourGanStartMap: Record<number, number> = {
      0: 0,
      1: 2,
      2: 4,
      3: 6,
      4: 8,
      5: 0,
      6: 2,
      7: 4,
      8: 6,
      9: 8,
    }
    const startGanIdx = hourGanStartMap[dayGanIdx] ?? 0
    const hours: PreciseHour[] = []
    for (let i = 0; i < 12; i++) {
      const zhiIdx = i
      const ganIdx = (startGanIdx + i) % 10
      const ganZhiStr = HEAVENLY_STEMS[ganIdx] + EARTHLY_BRANCHES[zhiIdx]
      const pair = this.getGanZhiFromPair(ganZhiStr)
      hours.push({
        shichenIndex: i,
        shichenName: EARTHLY_BRANCHES[i] + '时',
        ganZhi: ganZhiStr,
        xun: this.getXunKongWang(pair.zhi).xun,
      })
    }
    return hours
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
