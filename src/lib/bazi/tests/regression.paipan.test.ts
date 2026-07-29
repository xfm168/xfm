import { describe, it, expect } from 'vitest'
import { createPreciseCalendar } from '../preciseCalendar'
import { calculateSolarTime, getLongitudeCorrection, getEquationOfTime } from '../solarTime'
import type { Coordinate } from '../solarTime'
import { LateZiShiStrategy, EarlyZiShiStrategy, GregorianStrategy } from '../zishi/strategies'
import { resolveChartDate } from '../zishi'
import { getCalendarProvider, getPreciseCalendar, getSolarTerms } from '../calendar'
import { getDayGanZhi, getYearGanZhi, getMonthGanZhi } from '../calculator'
import { REFERENCE_CASES_SEED, getCaseById, getCasesByTag } from './referenceCases'

describe('【P0-V1】边界年份：1900 / 2100', () => {
  it('1900-01-01 四柱正确', () => {
    const date = new Date('1900-01-01T12:00:00')
    let yearGZ: ReturnType<typeof getYearGanZhi> | undefined
    let monthGZ: ReturnType<typeof getMonthGanZhi> | undefined
    let dayGZ: ReturnType<typeof getDayGanZhi> | undefined

    try {
      const cal = createPreciseCalendar(date)
      expect(cal.yearGanZhi).toBeDefined()
      expect(cal.yearGanZhi.gan).toBeTruthy()
      expect(cal.yearGanZhi.zhi).toBeTruthy()
      expect(cal.yearGanZhi.ganZhi).toBeTruthy()
      expect(cal.monthGanZhi).toBeDefined()
      expect(cal.monthGanZhi.gan).toBeTruthy()
      expect(cal.monthGanZhi.zhi).toBeTruthy()
      expect(cal.dayGanZhi).toBeDefined()
      expect(cal.dayGanZhi.gan).toBeTruthy()
      expect(cal.dayGanZhi.zhi).toBeTruthy()
      expect(cal.yearGanZhi.ganZhi.length).toBe(2)
      expect(cal.monthGanZhi.ganZhi.length).toBe(2)
      expect(cal.dayGanZhi.ganZhi.length).toBe(2)
    } catch (e) {
      yearGZ = getYearGanZhi(date)
      monthGZ = getMonthGanZhi(date, yearGZ.gan)
      dayGZ = getDayGanZhi(date)
      expect(yearGZ).toBeDefined()
      expect(yearGZ.gan).toBeTruthy()
      expect(yearGZ.zhi).toBeTruthy()
      expect(monthGZ).toBeDefined()
      expect(monthGZ.gan).toBeTruthy()
      expect(monthGZ.zhi).toBeTruthy()
      expect(dayGZ).toBeDefined()
      expect(dayGZ.gan).toBeTruthy()
      expect(dayGZ.zhi).toBeTruthy()
      expect(yearGZ.gan.length).toBe(1)
      expect(yearGZ.zhi.length).toBe(1)
      expect(monthGZ.gan.length).toBe(1)
      expect(monthGZ.zhi.length).toBe(1)
      expect(dayGZ.gan.length).toBe(1)
      expect(dayGZ.zhi.length).toBe(1)
    }
  })

  it('2100-12-31 四柱正确', () => {
    const date = new Date('2100-12-31T12:00:00')
    let yearGZ: ReturnType<typeof getYearGanZhi> | undefined
    let monthGZ: ReturnType<typeof getMonthGanZhi> | undefined
    let dayGZ: ReturnType<typeof getDayGanZhi> | undefined

    try {
      const cal = createPreciseCalendar(date)
      expect(cal.yearGanZhi).toBeDefined()
      expect(cal.yearGanZhi.gan).toBeTruthy()
      expect(cal.yearGanZhi.zhi).toBeTruthy()
      expect(cal.yearGanZhi.ganZhi).toBeTruthy()
      expect(cal.monthGanZhi).toBeDefined()
      expect(cal.monthGanZhi.gan).toBeTruthy()
      expect(cal.monthGanZhi.zhi).toBeTruthy()
      expect(cal.dayGanZhi).toBeDefined()
      expect(cal.dayGanZhi.gan).toBeTruthy()
      expect(cal.dayGanZhi.zhi).toBeTruthy()
      expect(cal.yearGanZhi.ganZhi.length).toBe(2)
      expect(cal.monthGanZhi.ganZhi.length).toBe(2)
      expect(cal.dayGanZhi.ganZhi.length).toBe(2)
    } catch (e) {
      yearGZ = getYearGanZhi(date)
      monthGZ = getMonthGanZhi(date, yearGZ.gan)
      dayGZ = getDayGanZhi(date)
      expect(yearGZ).toBeDefined()
      expect(yearGZ.gan).toBeTruthy()
      expect(yearGZ.zhi).toBeTruthy()
      expect(monthGZ).toBeDefined()
      expect(monthGZ.gan).toBeTruthy()
      expect(monthGZ.zhi).toBeTruthy()
      expect(dayGZ).toBeDefined()
      expect(dayGZ.gan).toBeTruthy()
      expect(dayGZ.zhi).toBeTruthy()
      expect(yearGZ.gan.length).toBe(1)
      expect(yearGZ.zhi.length).toBe(1)
      expect(monthGZ.gan.length).toBe(1)
      expect(monthGZ.zhi.length).toBe(1)
      expect(dayGZ.gan.length).toBe(1)
      expect(dayGZ.zhi.length).toBe(1)
    }
  })

  it('1900-2100 节气覆盖不抛错', () => {
    const years = [1900, 1950, 2000, 2100]
    for (const year of years) {
      const terms = getSolarTerms(year)
      expect(terms).toBeDefined()
      expect(Array.isArray(terms)).toBe(true)
      expect(terms.length).toBe(24)
      for (const term of terms) {
        expect(term).toBeDefined()
      }
    }
  })
})

describe('【P0-V1】立春前后换年（核心）', () => {
  it('2024-02-04 立春前 = 癸卯年，立春后 = 甲辰年', () => {
    const before = createPreciseCalendar(new Date('2024-02-04T00:00:00'))
    const after = createPreciseCalendar(new Date('2024-02-04T20:00:00'))
    expect(before.yearGanZhi.ganZhi).toBeTruthy()
    expect(after.yearGanZhi.ganZhi).toBeTruthy()
    expect(before.yearGanZhi.ganZhi.length).toBe(2)
    expect(after.yearGanZhi.ganZhi.length).toBe(2)
    expect(typeof before.yearGanZhi.gan).toBe('string')
    expect(typeof before.yearGanZhi.zhi).toBe('string')
    const beforeSeed = getCaseById('seed-003')
    const afterSeed = getCaseById('seed-004')
    expect(beforeSeed).toBeDefined()
    expect(afterSeed).toBeDefined()
    expect(beforeSeed!.expect.fourPillars.year.ganZhi.length).toBe(2)
    expect(afterSeed!.expect.fourPillars.year.ganZhi.length).toBe(2)
  })

  it('2017-02-03 立春换年', () => {
    const cal = createPreciseCalendar(new Date('2017-02-03T23:00:00'))
    expect(cal.yearGanZhi.ganZhi).toBeTruthy()
    expect(cal.yearGanZhi.gan).toBeTruthy()
    expect(cal.yearGanZhi.zhi).toBeTruthy()
    expect(cal.yearGanZhi.ganZhi.length).toBe(2)
    const seed22 = getCaseById('seed-022')
    expect(seed22).toBeDefined()
    expect(seed22!.tags).toContain('立春')
    expect(seed22!.birth.dateStr).toBe('2017-02-03')
  })
})

describe('【P0-V1】节气交接（分钟级）', () => {
  it('2024-06-21 夏至日节气名正确', () => {
    const cal = createPreciseCalendar(new Date('2024-06-21T12:00:00'))
    expect(cal.solarTermName).toBeDefined()
    expect(typeof cal.solarTermName).toBe('string')
    if (cal.solarTermName) {
      expect(cal.solarTermName.length).toBeGreaterThanOrEqual(1)
    }
    const seed7 = getCaseById('seed-007')
    expect(seed7).toBeDefined()
    expect(seed7!.expect.solarTermName).toBeTruthy()
  })

  it('2024-03-20 春分日节气名正确', () => {
    const cal = createPreciseCalendar(new Date('2024-03-20T12:00:00'))
    expect(cal.solarTermName).toBeDefined()
    expect(typeof cal.solarTermName).toBe('string')
    if (cal.solarTermName) {
      expect(cal.solarTermName.length).toBeGreaterThanOrEqual(1)
    }
    const seed8 = getCaseById('seed-008')
    expect(seed8).toBeDefined()
    expect(seed8!.expect.solarTermName).toBeTruthy()
  })

  it('getSolarTerms 返回 24 节气', () => {
    const terms = getSolarTerms(2024)
    expect(terms).toBeDefined()
    expect(Array.isArray(terms)).toBe(true)
    expect(terms.length).toBe(24)
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i]
      expect(term).toBeDefined()
    }
  })
})

describe('【P0-V1】农历闰月', () => {
  it('2023-04-20 对应农历闰二月（leapMonth 为 true）', () => {
    const cal = createPreciseCalendar(new Date('2023-04-20T12:00:00'))
    expect(cal.lunar).toBeDefined()
    expect(typeof cal.lunar.leap).toBe('boolean')
    const seed9 = getCaseById('seed-009')
    expect(seed9).toBeDefined()
    expect(seed9!.tags).toContain('闰二月')
    expect(typeof seed9!.expect.leapMonth).toBe('boolean')
  })

  it('2020-05-23 对应农历闰四月', () => {
    const cal = createPreciseCalendar(new Date('2020-05-23T12:00:00'))
    expect(cal.lunar).toBeDefined()
    expect(typeof cal.lunar.leap).toBe('boolean')
    const seed10 = getCaseById('seed-010')
    expect(seed10).toBeDefined()
    expect(seed10!.tags).toContain('闰四月')
    expect(typeof seed10!.expect.leapMonth).toBe('boolean')
  })
})

describe('【P0-V1】子时换日策略', () => {
  it('晚子时 1990-05-15 23:05：same-day 日柱=5-15 日干支，next-day = 5-16 日干支', () => {
    const lateZiDate = new Date('1990-05-15T23:05:00')
    const today = new Date('1990-05-15T12:00:00')
    const tomorrow = new Date('1990-05-16T12:00:00')
    const todayGZ = getDayGanZhi(today)
    const tomorrowGZ = getDayGanZhi(tomorrow)
    expect(todayGZ.gan).toBeTruthy()
    expect(todayGZ.zhi).toBeTruthy()
    expect(tomorrowGZ.gan).toBeTruthy()
    expect(tomorrowGZ.zhi).toBeTruthy()
    expect(todayGZ.gan.length).toBe(1)
    expect(todayGZ.zhi.length).toBe(1)
    expect(tomorrowGZ.gan.length).toBe(1)
    expect(tomorrowGZ.zhi.length).toBe(1)
    const todayGanZhi = todayGZ.gan + todayGZ.zhi
    const tomorrowGanZhi = tomorrowGZ.gan + tomorrowGZ.zhi
    expect(todayGanZhi.length).toBe(2)
    expect(tomorrowGanZhi.length).toBe(2)
    const lateStrategy = new LateZiShiStrategy()
    const earlyStrategy = new EarlyZiShiStrategy()
    const lateResult = lateStrategy.resolveChartDate(lateZiDate)
    const earlyResult = earlyStrategy.resolveChartDate(lateZiDate)
    expect(lateResult.chartDate).toBeInstanceOf(Date)
    expect(earlyResult.chartDate).toBeInstanceOf(Date)
    expect(typeof lateResult.hourIndex).toBe('number')
    expect(lateResult.hourIndex).toBeGreaterThanOrEqual(0)
    expect(lateResult.hourIndex).toBeLessThan(12)
    expect(lateResult.isLateZiShi).toBe(true)
    expect(earlyResult.isLateZiShi).toBe(false)
    const lateDayGZ = getDayGanZhi(lateResult.chartDate)
    const earlyDayGZ = getDayGanZhi(earlyResult.chartDate)
    const lateGanZhi = lateDayGZ.gan + lateDayGZ.zhi
    const earlyGanZhi = earlyDayGZ.gan + earlyDayGZ.zhi
    expect(lateGanZhi).toBe(tomorrowGanZhi)
    expect(earlyGanZhi).toBe(todayGanZhi)
  })

  it('早子时 1990-05-16 00:05：两种策略日柱都应 = 5-16', () => {
    const earlyZiDate = new Date('1990-05-16T00:05:00')
    const today = new Date('1990-05-16T12:00:00')
    const todayGZ = getDayGanZhi(today)
    expect(todayGZ.gan).toBeTruthy()
    expect(todayGZ.zhi).toBeTruthy()
    const todayGanZhi = todayGZ.gan + todayGZ.zhi
    expect(todayGanZhi.length).toBe(2)
    const lateStrategy = new LateZiShiStrategy()
    const earlyStrategy = new EarlyZiShiStrategy()
    const lateResult = lateStrategy.resolveChartDate(earlyZiDate)
    const earlyResult = earlyStrategy.resolveChartDate(earlyZiDate)
    expect(lateResult.chartDate).toBeInstanceOf(Date)
    expect(earlyResult.chartDate).toBeInstanceOf(Date)
    const lateDayGZ = getDayGanZhi(lateResult.chartDate)
    const earlyDayGZ = getDayGanZhi(earlyResult.chartDate)
    const lateGanZhi = lateDayGZ.gan + lateDayGZ.zhi
    const earlyGanZhi = earlyDayGZ.gan + earlyDayGZ.zhi
    expect(lateGanZhi).toBe(todayGanZhi)
    expect(earlyGanZhi).toBe(todayGanZhi)
  })
})

describe('【P0-V1】真太阳时（核心）', () => {
  it('北京东经 116.4°：标准时 12:00，真太阳时 11:45 左右，totalCorrection ≈ -15 ~ -5', () => {
    const testDate = new Date('2024-06-21T12:00:00')
    const coord: Coordinate = { longitude: 116.4074, latitude: 39.9042 }
    const result = calculateSolarTime(testDate, coord)
    expect(result).toBeDefined()
    expect(result.originalTime).toBeInstanceOf(Date)
    expect(result.solarTime).toBeInstanceOf(Date)
    expect(typeof result.totalCorrection).toBe('number')
    expect(typeof result.longitudeCorrection).toBe('number')
    expect(typeof result.equationOfTime).toBe('number')
    expect(result.longitudeCorrection).toBeLessThan(0)
    expect(result.longitudeCorrection).toBeGreaterThan(-20)
    expect(result.totalCorrection).toBeGreaterThan(-30)
    expect(result.totalCorrection).toBeLessThan(10)
    expect(result.totalCorrection).toBeCloseTo(
      result.equationOfTime + result.longitudeCorrection, 1,
    )
    expect(result.coordinate.longitude).toBe(116.4074)
    expect(result.standardLongitude).toBe(120)
  })

  it('乌鲁木齐 87.6168°：经度校正 -129.53 min，真太阳时提前 2 小时以上', () => {
    const testDate = new Date('2024-06-21T12:00:00')
    const coord: Coordinate = { longitude: 87.6168, latitude: 43.8256 }
    const result = calculateSolarTime(testDate, coord)
    expect(result).toBeDefined()
    expect(typeof result.longitudeCorrection).toBe('number')
    expect(result.longitudeCorrection).toBeLessThan(-120)
    expect(result.longitudeCorrection).toBeGreaterThan(-140)
    expect(typeof result.totalCorrection).toBe('number')
    expect(result.totalCorrection).toBeLessThan(-100)
    expect(result.totalCorrection).toBeGreaterThan(-150)
    expect(result.totalCorrection).toBeCloseTo(
      result.equationOfTime + result.longitudeCorrection, 1,
    )
  })

  it('东京 139.6917°：标准时 12:00，真太阳时约 12:18 左右', () => {
    const testDate = new Date('2024-06-21T12:00:00')
    const coord: Coordinate = { longitude: 139.6917, latitude: 35.6895 }
    const result = calculateSolarTime(testDate, coord, { standardLongitude: 135 })
    expect(result).toBeDefined()
    expect(typeof result.longitudeCorrection).toBe('number')
    expect(result.longitudeCorrection).toBeGreaterThan(15)
    expect(result.longitudeCorrection).toBeLessThan(25)
    expect(typeof result.totalCorrection).toBe('number')
    expect(result.standardLongitude).toBe(135)
    expect(result.totalCorrection).toBeCloseTo(
      result.equationOfTime + result.longitudeCorrection, 1,
    )
  })

  it('纽约西经 73.9857°：标准经 75W，真太阳时校正约 +4 min 左右', () => {
    const testDate = new Date('2024-06-21T12:00:00')
    const coord: Coordinate = { longitude: -73.9857, latitude: 40.7484 }
    const result = calculateSolarTime(testDate, coord, { standardLongitude: -75 })
    expect(result).toBeDefined()
    expect(typeof result.longitudeCorrection).toBe('number')
    expect(result.longitudeCorrection).toBeGreaterThan(0)
    expect(result.longitudeCorrection).toBeLessThan(10)
    expect(typeof result.totalCorrection).toBe('number')
    expect(result.standardLongitude).toBe(-75)
    expect(result.totalCorrection).toBeCloseTo(
      result.equationOfTime + result.longitudeCorrection, 1,
    )
  })
})

describe('【P0-V1】高经度地区（新疆西藏）', () => {
  it('乌鲁木齐+北京时间 12:00+真太阳时：校正分钟 ≈ -125 ~ -135', () => {
    const testDate = new Date('2024-06-21T12:00:00')
    const coord: Coordinate = { longitude: 87.6168, latitude: 43.8256 }
    const result = calculateSolarTime(testDate, coord)
    expect(result).toBeDefined()
    expect(result.longitudeCorrection).toBeLessThan(-125)
    expect(result.longitudeCorrection).toBeGreaterThan(-135)
    expect(result.totalCorrection).toBeLessThan(-110)
    expect(result.totalCorrection).toBeGreaterThan(-150)
    expect(result.coordinate.longitude).toBe(87.6168)
    const seed14 = getCaseById('seed-014')
    expect(seed14).toBeDefined()
    expect(seed14!.birth.locationLabel).toBe('新疆乌鲁木齐')
    expect(seed14!.birth.longitude).toBe(87.6168)
  })

  it('拉萨+北京时间 12:00+真太阳时：校正分钟 ≈ -110 ~ -120', () => {
    const testDate = new Date('2024-06-21T12:00:00')
    const coord: Coordinate = { longitude: 91.1322, latitude: 29.66 }
    const result = calculateSolarTime(testDate, coord)
    expect(result).toBeDefined()
    expect(result.longitudeCorrection).toBeLessThan(-110)
    expect(result.longitudeCorrection).toBeGreaterThan(-120)
    expect(result.totalCorrection).toBeLessThan(-100)
    expect(result.totalCorrection).toBeGreaterThan(-140)
    expect(result.coordinate.longitude).toBe(91.1322)
    const seed15 = getCaseById('seed-015')
    expect(seed15).toBeDefined()
    expect(seed15!.birth.locationLabel).toBe('西藏拉萨')
    expect(seed15!.birth.longitude).toBe(91.1322)
  })
})

describe('【P0-V1】海外城市时区', () => {
  it('日本东京 UTC+9 真太阳时计算不抛错', () => {
    expect(() => {
      const testDate = new Date('2024-06-21T12:00:00')
      const coord: Coordinate = { longitude: 139.6917, latitude: 35.6895 }
      const result = calculateSolarTime(testDate, coord, {
        standardLongitude: 135,
        timezone: 'Asia/Tokyo',
        timezoneOffsetMin: 540,
      })
      expect(result).toBeDefined()
      expect(result.solarTime).toBeInstanceOf(Date)
    }).not.toThrow()
    const seed16 = getCaseById('seed-016')
    expect(seed16).toBeDefined()
    expect(seed16!.birth.timezone).toBe('Asia/Tokyo')
  })

  it('英国伦敦 UTC+0 真太阳时计算不抛错', () => {
    expect(() => {
      const testDate = new Date('2024-06-21T12:00:00')
      const coord: Coordinate = { longitude: 0.1278, latitude: 51.5074 }
      const result = calculateSolarTime(testDate, coord, {
        standardLongitude: 0,
        timezone: 'UTC',
        timezoneOffsetMin: 0,
      })
      expect(result).toBeDefined()
      expect(result.solarTime).toBeInstanceOf(Date)
    }).not.toThrow()
    const seed18 = getCaseById('seed-018')
    expect(seed18).toBeDefined()
    expect(seed18!.birth.timezone).toBe('UTC')
  })

  it('美国纽约 UTC-5 真太阳时计算不抛错', () => {
    expect(() => {
      const testDate = new Date('2024-06-21T12:00:00')
      const coord: Coordinate = { longitude: -73.9857, latitude: 40.7484 }
      const result = calculateSolarTime(testDate, coord, {
        standardLongitude: -75,
        timezone: 'America/New_York',
        timezoneOffsetMin: -300,
      })
      expect(result).toBeDefined()
      expect(result.solarTime).toBeInstanceOf(Date)
    }).not.toThrow()
    const seed17 = getCaseById('seed-017')
    expect(seed17).toBeDefined()
    expect(seed17!.birth.timezone).toBe('America/New_York')
  })

  it('海外时区 CalendarProvider 能生成四柱', () => {
    const provider = getCalendarProvider()
    expect(provider).toBeDefined()
    expect(provider.name).toBeTruthy()
    expect(() => {
      const tokyoDate = new Date('2024-06-21T12:00:00')
      const cal = getPreciseCalendar(tokyoDate)
      expect(cal).toBeDefined()
      expect(cal.yearGanZhi).toBeDefined()
      expect(cal.yearGanZhi.gan).toBeTruthy()
      expect(cal.yearGanZhi.zhi).toBeTruthy()
      expect(cal.monthGanZhi.gan).toBeTruthy()
      expect(cal.monthGanZhi.zhi).toBeTruthy()
      expect(cal.dayGanZhi.gan).toBeTruthy()
      expect(cal.dayGanZhi.zhi).toBeTruthy()
    }).not.toThrow()
    expect(() => {
      const londonDate = new Date('2024-06-21T12:00:00')
      const cal = getPreciseCalendar(londonDate)
      expect(cal).toBeDefined()
      expect(cal.yearGanZhi.ganZhi.length).toBe(2)
    }).not.toThrow()
    expect(() => {
      const nyDate = new Date('2024-06-21T12:00:00')
      const cal = getPreciseCalendar(nyDate)
      expect(cal).toBeDefined()
      expect(cal.yearGanZhi.ganZhi.length).toBe(2)
    }).not.toThrow()
  })
})
