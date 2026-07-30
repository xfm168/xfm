import { describe, it, expect } from 'vitest'
import { calculateSolarTime } from '../../../solarTime'

interface ExtremeCase {
  name: string
  longitude: number
  latitude: number
  standardLongitude: number
}

const EXTREME_CASES: ExtremeCase[] = [
  { name: '换日线+180°', longitude: 180, latitude: 0, standardLongitude: 180 },
  { name: '换日线-180°', longitude: -180, latitude: 0, standardLongitude: -180 },
  { name: '格林威治0°', longitude: 0, latitude: 51.5, standardLongitude: 0 },
  { name: '阿拉斯加175°W', longitude: -175, latitude: 55, standardLongitude: -180 },
  { name: '奥克兰175°E', longitude: 175, latitude: -37, standardLongitude: 180 },
]

const TEST_DATES: [number, number, number][] = [
  [2024, 1, 15],
  [2024, 6, 21],
]

describe('solarTime/extremeLongitude - 极端经度验证', () => {
  it('180°E 太平洋换日线：calculateSolarTime 不抛错', () => {
    for (const [y, m, d] of TEST_DATES) {
      expect(() => {
        const date = new Date(y, m - 1, d, 12, 0, 0)
        calculateSolarTime(date, { longitude: 180, latitude: 0 }, { standardLongitude: 180 })
      }).not.toThrow()
    }
  })

  it('180°E：trace 字段完整不缺失', () => {
    const date = new Date(2024, 5, 21, 12, 0, 0)
    const result = calculateSolarTime(date, { longitude: 180, latitude: 0 }, { standardLongitude: 180 })
    const t = result.trace
    expect(t.standardTime).toBeInstanceOf(Date)
    expect(typeof t.longitude).toBe('number')
    expect(typeof t.latitude).toBe('number')
    expect(typeof t.timezone).toBe('string')
    expect(typeof t.timezoneOffsetMin).toBe('number')
    expect(typeof t.timezoneStandardLongitude).toBe('number')
    expect(typeof t.eotMinutes).toBe('number')
    expect(typeof t.longitudeCorrectionMinutes).toBe('number')
    expect(typeof t.totalCorrectionMinutes).toBe('number')
    expect(t.trueSolarTime).toBeInstanceOf(Date)
    expect(t.finalAdoptedTime).toBeInstanceOf(Date)
    expect(typeof t.useTrueSolarTime).toBe('boolean')
    expect(t.utcTime).toBeInstanceOf(Date)
    expect(typeof t.localTimeText).toBe('string')
    expect(typeof t.isCrossDay).toBe('boolean')
    expect(typeof t.adoptedShichen).toBe('string')
    expect(typeof t.adoptedShichenIndex).toBe('number')
    expect(typeof t.adoptedShichenGanZhi).toBe('string')
  })

  it('-180° 太平洋换日线西：calculateSolarTime 不抛错', () => {
    for (const [y, m, d] of TEST_DATES) {
      expect(() => {
        const date = new Date(y, m - 1, d, 12, 0, 0)
        calculateSolarTime(date, { longitude: -180, latitude: 0 }, { standardLongitude: -180 })
      }).not.toThrow()
    }
  })

  it('-180°：trace 字段完整不缺失', () => {
    const date = new Date(2024, 5, 21, 12, 0, 0)
    const result = calculateSolarTime(date, { longitude: -180, latitude: 0 }, { standardLongitude: -180 })
    const t = result.trace
    expect(t.standardTime).toBeInstanceOf(Date)
    expect(typeof t.longitude).toBe('number')
    expect(typeof t.latitude).toBe('number')
    expect(typeof t.timezone).toBe('string')
    expect(typeof t.timezoneOffsetMin).toBe('number')
    expect(typeof t.eotMinutes).toBe('number')
    expect(typeof t.longitudeCorrectionMinutes).toBe('number')
    expect(typeof t.totalCorrectionMinutes).toBe('number')
    expect(t.trueSolarTime).toBeInstanceOf(Date)
    expect(typeof t.isCrossDay).toBe('boolean')
    expect(typeof t.adoptedShichenIndex).toBe('number')
  })

  it('0° 格林威治：calculateSolarTime 不抛错', () => {
    for (const [y, m, d] of TEST_DATES) {
      expect(() => {
        const date = new Date(y, m - 1, d, 12, 0, 0)
        calculateSolarTime(date, { longitude: 0, latitude: 51.5 }, { standardLongitude: 0 })
      }).not.toThrow()
    }
  })

  it('0° 格林威治：longitudeCorrection 接近 0', () => {
    const date = new Date(2024, 5, 21, 12, 0, 0)
    const result = calculateSolarTime(date, { longitude: 0, latitude: 51.5 }, { standardLongitude: 0 })
    expect(result.longitudeCorrection).toBeCloseTo(0, 0)
  })

  it('0° 格林威治：trace 字段完整不缺失', () => {
    const date = new Date(2024, 5, 21, 12, 0, 0)
    const result = calculateSolarTime(date, { longitude: 0, latitude: 51.5 }, { standardLongitude: 0 })
    const t = result.trace
    expect(t.standardTime).toBeInstanceOf(Date)
    expect(typeof t.longitude).toBe('number')
    expect(typeof t.eotMinutes).toBe('number')
    expect(typeof t.totalCorrectionMinutes).toBe('number')
    expect(t.trueSolarTime).toBeInstanceOf(Date)
    expect(typeof t.isCrossDay).toBe('boolean')
    expect(typeof t.adoptedShichenIndex).toBe('number')
    expect(typeof t.adoptedShichenGanZhi).toBe('string')
  })

  it('175°W 阿拉斯加：calculateSolarTime 不抛错', () => {
    for (const [y, m, d] of TEST_DATES) {
      expect(() => {
        const date = new Date(y, m - 1, d, 12, 0, 0)
        calculateSolarTime(date, { longitude: -175, latitude: 55 }, { standardLongitude: -180 })
      }).not.toThrow()
    }
  })

  it('175°W 阿拉斯加：trace 字段完整不缺失', () => {
    const date = new Date(2024, 5, 21, 12, 0, 0)
    const result = calculateSolarTime(date, { longitude: -175, latitude: 55 }, { standardLongitude: -180 })
    const t = result.trace
    expect(t.standardTime).toBeInstanceOf(Date)
    expect(typeof t.longitude).toBe('number')
    expect(typeof t.eotMinutes).toBe('number')
    expect(typeof t.totalCorrectionMinutes).toBe('number')
    expect(t.trueSolarTime).toBeInstanceOf(Date)
    expect(typeof t.isCrossDay).toBe('boolean')
    expect(typeof t.adoptedShichenIndex).toBe('number')
  })

  it('175°E 奥克兰：calculateSolarTime 不抛错', () => {
    for (const [y, m, d] of TEST_DATES) {
      expect(() => {
        const date = new Date(y, m - 1, d, 12, 0, 0)
        calculateSolarTime(date, { longitude: 175, latitude: -37 }, { standardLongitude: 180 })
      }).not.toThrow()
    }
  })

  it('175°E 奥克兰：trace 字段完整不缺失', () => {
    const date = new Date(2024, 5, 21, 12, 0, 0)
    const result = calculateSolarTime(date, { longitude: 175, latitude: -37 }, { standardLongitude: 180 })
    const t = result.trace
    expect(t.standardTime).toBeInstanceOf(Date)
    expect(typeof t.longitude).toBe('number')
    expect(typeof t.eotMinutes).toBe('number')
    expect(typeof t.totalCorrectionMinutes).toBe('number')
    expect(t.trueSolarTime).toBeInstanceOf(Date)
    expect(typeof t.isCrossDay).toBe('boolean')
    expect(typeof t.adoptedShichenIndex).toBe('number')
  })

  it('5 极端经度 × 2 日期：totalCorrectionMinutes = eot + longitudeCorrectionMinutes 关系成立（误差 ±1）', () => {
    for (const c of EXTREME_CASES) {
      for (const [y, m, d] of TEST_DATES) {
        const date = new Date(y, m - 1, d, 12, 0, 0)
        const result = calculateSolarTime(
          date,
          { longitude: c.longitude, latitude: c.latitude },
          { standardLongitude: c.standardLongitude }
        )
        const computed = result.trace.eotMinutes + result.trace.longitudeCorrectionMinutes
        expect(Math.abs(result.trace.totalCorrectionMinutes - computed)).toBeLessThanOrEqual(1)
      }
    }
  })

  it('5 极端经度 × 2 日期：adoptedShichenIndex 在 0~11 范围', () => {
    for (const c of EXTREME_CASES) {
      for (const [y, m, d] of TEST_DATES) {
        const date = new Date(y, m - 1, d, 12, 0, 0)
        const result = calculateSolarTime(
          date,
          { longitude: c.longitude, latitude: c.latitude },
          { standardLongitude: c.standardLongitude }
        )
        expect(result.trace.adoptedShichenIndex).toBeGreaterThanOrEqual(0)
        expect(result.trace.adoptedShichenIndex).toBeLessThanOrEqual(11)
      }
    }
  })

  it('175°E 奥克兰 23:50 跨日：isCrossDay 为 boolean 类型', () => {
    const date = new Date(2024, 5, 21, 23, 50, 0)
    const result = calculateSolarTime(
      date,
      { longitude: 175, latitude: -37 },
      { standardLongitude: 180 }
    )
    expect(typeof result.trace.isCrossDay).toBe('boolean')
  })

  it('175°W 阿拉斯加 00:10 跨日：isCrossDay 为 boolean 类型', () => {
    const date = new Date(2024, 5, 21, 0, 10, 0)
    const result = calculateSolarTime(
      date,
      { longitude: -175, latitude: 55 },
      { standardLongitude: -180 }
    )
    expect(typeof result.trace.isCrossDay).toBe('boolean')
  })
})
