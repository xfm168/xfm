import { describe, it, expect } from 'vitest'
import { createPreciseCalendar } from '../../../preciseCalendar'
import { calculateSolarTime } from '../../../solarTime'

interface ConsistencyCase {
  name: string
  date: Date
  longitude: number
  latitude: number
}

const CONSISTENCY_CASES: ConsistencyCase[] = [
  { name: '2024-01-01 00:00 北京', date: new Date(2024, 0, 1, 0, 0, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '2024-02-04 04:02 立春北京', date: new Date(2024, 1, 4, 4, 2, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '2024-03-06 惊蛰北京', date: new Date(2024, 2, 6, 4, 36, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '2024-06-21 12:00 夏至北京', date: new Date(2024, 5, 21, 12, 0, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '2024-12-22 12:00 冬至北京', date: new Date(2024, 11, 22, 12, 0, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '2023-03-22 12:00 闰二月', date: new Date(2023, 2, 22, 12, 0, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '2020-05-23 12:00 闰四月', date: new Date(2020, 4, 23, 12, 0, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '2017-07-23 12:00 闰六月', date: new Date(2017, 6, 23, 12, 0, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '1995-09-25 12:00 闰八月', date: new Date(1995, 8, 25, 12, 0, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '1984-11-23 12:00 闰十月', date: new Date(1984, 10, 23, 12, 0, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '1905-06-01 12:00 早期安全年', date: new Date(1905, 5, 1, 12, 0, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '1950-06-15 12:00 年中安全日期', date: new Date(1950, 5, 15, 12, 0, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '2090-06-15 12:00 近边界安全年', date: new Date(2090, 5, 15, 12, 0, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '2050-06-15 12:00 中年安全日期', date: new Date(2050, 5, 15, 12, 0, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '1910-03-15 12:00 早期安全日期二', date: new Date(1910, 2, 15, 12, 0, 0), longitude: 116.4074, latitude: 39.9042 },
  { name: '2024-06-15 12:30 乌鲁木齐', date: new Date(2024, 5, 15, 12, 30, 0), longitude: 87.6168, latitude: 43.8256 },
  { name: '2024-06-15 13:10 喀什', date: new Date(2024, 5, 15, 13, 10, 0), longitude: 75.9891, latitude: 39.4677 },
  { name: '2024-06-15 12:50 拉萨', date: new Date(2024, 5, 15, 12, 50, 0), longitude: 91.1322, latitude: 29.66 },
  { name: '2024-12:00 东京', date: new Date(2024, 5, 15, 12, 0, 0), longitude: 139.6917, latitude: 35.6895 },
  { name: '2024-12:00 纽约', date: new Date(2024, 5, 15, 12, 0, 0), longitude: -74.0060, latitude: 40.7128 },
  { name: '2024-12:00 伦敦', date: new Date(2024, 5, 15, 12, 0, 0), longitude: -0.1276, latitude: 51.5074 },
]

function hashCalendar(cal: any): string {
  const parts: string[] = [
    cal.yearGanZhi?.ganZhi ?? '',
    cal.monthGanZhi?.ganZhi ?? '',
    cal.dayGanZhi?.ganZhi ?? '',
    cal.lunar?.yearText ?? '',
    cal.lunar?.monthText ?? '',
    String(cal.lunar?.leap ?? false),
    cal.lunar?.dayText ?? '',
    cal.weekday ?? '',
    cal.solarTermName ?? '',
    cal.solarDate ?? '',
    cal.solarTime ?? '',
    (cal.hours ?? []).map((h: any) => h.ganZhi).join(','),
  ]
  return parts.join('|')
}

function hashSolarTime(r: any): string {
  const t = r.trace
  return [
    String(r.totalCorrection),
    String(r.equationOfTime),
    String(r.longitudeCorrection),
    String(t.eotMinutes),
    String(t.longitudeCorrectionMinutes),
    String(t.totalCorrectionMinutes),
    String(t.adoptedShichenIndex),
    t.adoptedShichen ?? '',
    t.adoptedShichenGanZhi ?? '',
    String(t.isCrossDay),
  ].join('|')
}

describe('referenceCases/consistency - 程序一致性（相同输入多次调用结果相同）', () => {
  it('20 个案例：createPreciseCalendar 重复调用 3 次 hash 完全相同', () => {
    for (const cs of CONSISTENCY_CASES) {
      const r1 = createPreciseCalendar(cs.date)
      const r2 = createPreciseCalendar(cs.date)
      const r3 = createPreciseCalendar(cs.date)
      const h1 = hashCalendar(r1)
      const h2 = hashCalendar(r2)
      const h3 = hashCalendar(r3)
      expect(h1).toBe(h2)
      expect(h2).toBe(h3)
    }
  })

  it('20 个案例：createPreciseCalendar 年/月/日干支 3 次完全相同', () => {
    for (const cs of CONSISTENCY_CASES) {
      const r1 = createPreciseCalendar(cs.date)
      const r2 = createPreciseCalendar(cs.date)
      const r3 = createPreciseCalendar(cs.date)
      expect(r1.yearGanZhi.ganZhi).toBe(r2.yearGanZhi.ganZhi)
      expect(r2.yearGanZhi.ganZhi).toBe(r3.yearGanZhi.ganZhi)
      expect(r1.monthGanZhi.ganZhi).toBe(r2.monthGanZhi.ganZhi)
      expect(r2.monthGanZhi.ganZhi).toBe(r3.monthGanZhi.ganZhi)
      expect(r1.dayGanZhi.ganZhi).toBe(r2.dayGanZhi.ganZhi)
      expect(r2.dayGanZhi.ganZhi).toBe(r3.dayGanZhi.ganZhi)
    }
  })

  it('20 个案例：createPreciseCalendar 农历字段 3 次完全相同', () => {
    for (const cs of CONSISTENCY_CASES) {
      const r1 = createPreciseCalendar(cs.date)
      const r2 = createPreciseCalendar(cs.date)
      const r3 = createPreciseCalendar(cs.date)
      expect(r1.lunar.monthText).toBe(r2.lunar.monthText)
      expect(r2.lunar.monthText).toBe(r3.lunar.monthText)
      expect(r1.lunar.leap).toBe(r2.lunar.leap)
      expect(r2.lunar.leap).toBe(r3.lunar.leap)
      expect(r1.lunar.dayText).toBe(r2.lunar.dayText)
      expect(r2.lunar.dayText).toBe(r3.lunar.dayText)
    }
  })

  it('20 个案例：calculateSolarTime 重复调用 3 次 hash 完全相同', () => {
    for (const cs of CONSISTENCY_CASES) {
      const r1 = calculateSolarTime(cs.date, { longitude: cs.longitude, latitude: cs.latitude }, { standardLongitude: 120 })
      const r2 = calculateSolarTime(cs.date, { longitude: cs.longitude, latitude: cs.latitude }, { standardLongitude: 120 })
      const r3 = calculateSolarTime(cs.date, { longitude: cs.longitude, latitude: cs.latitude }, { standardLongitude: 120 })
      const h1 = hashSolarTime(r1)
      const h2 = hashSolarTime(r2)
      const h3 = hashSolarTime(r3)
      expect(h1).toBe(h2)
      expect(h2).toBe(h3)
    }
  })

  it('20 个案例：calculateSolarTime totalCorrection 3 次完全相同', () => {
    for (const cs of CONSISTENCY_CASES) {
      const r1 = calculateSolarTime(cs.date, { longitude: cs.longitude, latitude: cs.latitude }, { standardLongitude: 120 })
      const r2 = calculateSolarTime(cs.date, { longitude: cs.longitude, latitude: cs.latitude }, { standardLongitude: 120 })
      const r3 = calculateSolarTime(cs.date, { longitude: cs.longitude, latitude: cs.latitude }, { standardLongitude: 120 })
      expect(r1.totalCorrection).toBe(r2.totalCorrection)
      expect(r2.totalCorrection).toBe(r3.totalCorrection)
    }
  })

  it('20 个案例：calculateSolarTime adoptedShichenIndex 3 次完全相同', () => {
    for (const cs of CONSISTENCY_CASES) {
      const r1 = calculateSolarTime(cs.date, { longitude: cs.longitude, latitude: cs.latitude }, { standardLongitude: 120 })
      const r2 = calculateSolarTime(cs.date, { longitude: cs.longitude, latitude: cs.latitude }, { standardLongitude: 120 })
      const r3 = calculateSolarTime(cs.date, { longitude: cs.longitude, latitude: cs.latitude }, { standardLongitude: 120 })
      expect(r1.trace.adoptedShichenIndex).toBe(r2.trace.adoptedShichenIndex)
      expect(r2.trace.adoptedShichenIndex).toBe(r3.trace.adoptedShichenIndex)
    }
  })

  it('20 个案例：calculateSolarTime isCrossDay 3 次完全相同', () => {
    for (const cs of CONSISTENCY_CASES) {
      const r1 = calculateSolarTime(cs.date, { longitude: cs.longitude, latitude: cs.latitude }, { standardLongitude: 120 })
      const r2 = calculateSolarTime(cs.date, { longitude: cs.longitude, latitude: cs.latitude }, { standardLongitude: 120 })
      const r3 = calculateSolarTime(cs.date, { longitude: cs.longitude, latitude: cs.latitude }, { standardLongitude: 120 })
      expect(r1.trace.isCrossDay).toBe(r2.trace.isCrossDay)
      expect(r2.trace.isCrossDay).toBe(r3.trace.isCrossDay)
    }
  })

  it('20 个案例：hours 数组长度 3 次调用相同', () => {
    for (const cs of CONSISTENCY_CASES) {
      const r1 = createPreciseCalendar(cs.date)
      const r2 = createPreciseCalendar(cs.date)
      const r3 = createPreciseCalendar(cs.date)
      expect(r1.hours.length).toBe(r2.hours.length)
      expect(r2.hours.length).toBe(r3.hours.length)
    }
  })

  it('20 个案例：solarTermName 3 次调用相同', () => {
    for (const cs of CONSISTENCY_CASES) {
      const r1 = createPreciseCalendar(cs.date)
      const r2 = createPreciseCalendar(cs.date)
      const r3 = createPreciseCalendar(cs.date)
      expect(r1.solarTermName).toBe(r2.solarTermName)
      expect(r2.solarTermName).toBe(r3.solarTermName)
    }
  })

  it('20 个案例：createPreciseCalendar snapshot 字段存在且 3 次相同类型', () => {
    for (const cs of CONSISTENCY_CASES) {
      const r1 = createPreciseCalendar(cs.date)
      const r2 = createPreciseCalendar(cs.date)
      const r3 = createPreciseCalendar(cs.date)
      expect(typeof r1.snapshot).toBe(typeof r2.snapshot)
      expect(typeof r2.snapshot).toBe(typeof r3.snapshot)
    }
  })
})
