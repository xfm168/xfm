import { describe, it, expect } from 'vitest'
import { calculateSolarTime } from '../../../solarTime'
import { isDST, getUtcOffset } from '../../../../locations/providers'

interface XZXJCase {
  name: string
  longitude: number
  latitude: number
  dates: [number, number, number][]
}

const CITY_CASES: XZXJCase[] = [
  {
    name: '乌鲁木齐',
    longitude: 87.6168,
    latitude: 43.8256,
    dates: [[2024, 1, 15], [2024, 6, 21], [2024, 12, 22]],
  },
  {
    name: '喀什',
    longitude: 75.9891,
    latitude: 39.4677,
    dates: [[2024, 1, 15], [2024, 6, 21], [2024, 12, 22]],
  },
  {
    name: '拉萨',
    longitude: 91.1322,
    latitude: 29.66,
    dates: [[2024, 1, 15], [2024, 6, 21], [2024, 12, 22]],
  },
  {
    name: '西宁',
    longitude: 101.7782,
    latitude: 36.6231,
    dates: [[2024, 1, 15], [2024, 6, 21], [2024, 12, 22]],
  },
  {
    name: '兰州',
    longitude: 103.8235,
    latitude: 36.0581,
    dates: [[2024, 1, 15], [2024, 6, 21], [2024, 12, 22]],
  },
  {
    name: '昆明',
    longitude: 102.8329,
    latitude: 24.8801,
    dates: [[2024, 1, 15], [2024, 6, 21], [2024, 12, 22]],
  },
]

describe('solarTime/xizangXinjiang - 新疆西藏及西部城市验证', () => {
  it('乌鲁木齐 totalCorrection 为负区间（经度 < 120°）', () => {
    for (const [y, m, d] of CITY_CASES[0].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: CITY_CASES[0].longitude, latitude: CITY_CASES[0].latitude },
        { standardLongitude: 120 }
      )
      expect(result.totalCorrection).toBeLessThan(0)
      expect(result.totalCorrection).toBeGreaterThanOrEqual(-180)
      expect(result.totalCorrection).toBeLessThanOrEqual(-80)
    }
  })

  it('喀什 totalCorrection 为负区间（经度 < 120°）', () => {
    for (const [y, m, d] of CITY_CASES[1].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: CITY_CASES[1].longitude, latitude: CITY_CASES[1].latitude },
        { standardLongitude: 120 }
      )
      expect(result.totalCorrection).toBeLessThan(0)
      expect(result.totalCorrection).toBeGreaterThanOrEqual(-200)
      expect(result.totalCorrection).toBeLessThanOrEqual(-80)
    }
  })

  it('拉萨 totalCorrection 为负区间（经度 < 120°）', () => {
    for (const [y, m, d] of CITY_CASES[2].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: CITY_CASES[2].longitude, latitude: CITY_CASES[2].latitude },
        { standardLongitude: 120 }
      )
      expect(result.totalCorrection).toBeLessThan(0)
      expect(result.totalCorrection).toBeGreaterThanOrEqual(-180)
      expect(result.totalCorrection).toBeLessThanOrEqual(-80)
    }
  })

  it('西宁 totalCorrection 为负区间（经度 < 120°）', () => {
    for (const [y, m, d] of CITY_CASES[3].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: CITY_CASES[3].longitude, latitude: CITY_CASES[3].latitude },
        { standardLongitude: 120 }
      )
      expect(result.totalCorrection).toBeLessThan(0)
      expect(result.totalCorrection).toBeGreaterThanOrEqual(-100)
      expect(result.totalCorrection).toBeLessThanOrEqual(-50)
    }
  })

  it('兰州 totalCorrection 为负区间（经度 < 120°）', () => {
    for (const [y, m, d] of CITY_CASES[4].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: CITY_CASES[4].longitude, latitude: CITY_CASES[4].latitude },
        { standardLongitude: 120 }
      )
      expect(result.totalCorrection).toBeLessThan(0)
      expect(result.totalCorrection).toBeGreaterThanOrEqual(-90)
      expect(result.totalCorrection).toBeLessThanOrEqual(-40)
    }
  })

  it('昆明 totalCorrection 为负区间（经度 < 120°）', () => {
    for (const [y, m, d] of CITY_CASES[5].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: CITY_CASES[5].longitude, latitude: CITY_CASES[5].latitude },
        { standardLongitude: 120 }
      )
      expect(result.totalCorrection).toBeLessThan(0)
      expect(result.totalCorrection).toBeGreaterThanOrEqual(-100)
      expect(result.totalCorrection).toBeLessThanOrEqual(-50)
    }
  })

  it('乌鲁木齐：totalCorrectionMinutes = eot + longitudeCorrectionMinutes 关系成立（误差 ±1）', () => {
    for (const [y, m, d] of CITY_CASES[0].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: CITY_CASES[0].longitude, latitude: CITY_CASES[0].latitude },
        { standardLongitude: 120 }
      )
      const computed = result.trace.eotMinutes + result.trace.longitudeCorrectionMinutes
      expect(Math.abs(result.trace.totalCorrectionMinutes - computed)).toBeLessThanOrEqual(1)
    }
  })

  it('喀什：totalCorrectionMinutes = eot + longitudeCorrectionMinutes 关系成立（误差 ±1）', () => {
    for (const [y, m, d] of CITY_CASES[1].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: CITY_CASES[1].longitude, latitude: CITY_CASES[1].latitude },
        { standardLongitude: 120 }
      )
      const computed = result.trace.eotMinutes + result.trace.longitudeCorrectionMinutes
      expect(Math.abs(result.trace.totalCorrectionMinutes - computed)).toBeLessThanOrEqual(1)
    }
  })

  it('拉萨：totalCorrectionMinutes = eot + longitudeCorrectionMinutes 关系成立（误差 ±1）', () => {
    for (const [y, m, d] of CITY_CASES[2].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: CITY_CASES[2].longitude, latitude: CITY_CASES[2].latitude },
        { standardLongitude: 120 }
      )
      const computed = result.trace.eotMinutes + result.trace.longitudeCorrectionMinutes
      expect(Math.abs(result.trace.totalCorrectionMinutes - computed)).toBeLessThanOrEqual(1)
    }
  })

  it('西宁：totalCorrectionMinutes = eot + longitudeCorrectionMinutes 关系成立（误差 ±1）', () => {
    for (const [y, m, d] of CITY_CASES[3].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: CITY_CASES[3].longitude, latitude: CITY_CASES[3].latitude },
        { standardLongitude: 120 }
      )
      const computed = result.trace.eotMinutes + result.trace.longitudeCorrectionMinutes
      expect(Math.abs(result.trace.totalCorrectionMinutes - computed)).toBeLessThanOrEqual(1)
    }
  })

  it('兰州：totalCorrectionMinutes = eot + longitudeCorrectionMinutes 关系成立（误差 ±1）', () => {
    for (const [y, m, d] of CITY_CASES[4].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: CITY_CASES[4].longitude, latitude: CITY_CASES[4].latitude },
        { standardLongitude: 120 }
      )
      const computed = result.trace.eotMinutes + result.trace.longitudeCorrectionMinutes
      expect(Math.abs(result.trace.totalCorrectionMinutes - computed)).toBeLessThanOrEqual(1)
    }
  })

  it('昆明：totalCorrectionMinutes = eot + longitudeCorrectionMinutes 关系成立（误差 ±1）', () => {
    for (const [y, m, d] of CITY_CASES[5].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: CITY_CASES[5].longitude, latitude: CITY_CASES[5].latitude },
        { standardLongitude: 120 }
      )
      const computed = result.trace.eotMinutes + result.trace.longitudeCorrectionMinutes
      expect(Math.abs(result.trace.totalCorrectionMinutes - computed)).toBeLessThanOrEqual(1)
    }
  })

  it('6 城市 trace.isCrossDay 为 boolean 类型', () => {
    for (const city of CITY_CASES) {
      const [y, m, d] = city.dates[0]
      const date = new Date(y, m - 1, d, 23, 50, 0)
      const result = calculateSolarTime(
        date,
        { longitude: city.longitude, latitude: city.latitude },
        { standardLongitude: 120 }
      )
      expect(typeof result.trace.isCrossDay).toBe('boolean')
    }
  })

  it('6 城市 longitudeCorrection 为负（经度均 < 120°）', () => {
    for (const city of CITY_CASES) {
      const [y, m, d] = city.dates[0]
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: city.longitude, latitude: city.latitude },
        { standardLongitude: 120 }
      )
      expect(result.longitudeCorrection).toBeLessThan(0)
    }
  })

  it('6 城市 × 3 日期：calculateSolarTime 不抛错', () => {
    for (const city of CITY_CASES) {
      for (const [y, m, d] of city.dates) {
        expect(() => {
          const date = new Date(y, m - 1, d, 12, 0, 0)
          calculateSolarTime(
            date,
            { longitude: city.longitude, latitude: city.latitude },
            { standardLongitude: 120 }
          )
        }).not.toThrow()
      }
    }
  })

  it('中国城市 isDST 返回 false（中国不使用夏令时）', () => {
    const countries = ['CN', 'cn', 'China']
    const dates = [
      new Date(2024, 5, 21),
      new Date(2024, 11, 22),
    ]
    for (const date of dates) {
      const result = isDST(date, 'CN')
      expect(result).toBe(false)
    }
  })

  it('中国城市 getUtcOffset 返回 480 分钟（UTC+8）', () => {
    const date = new Date(2024, 5, 21)
    const offset = getUtcOffset(date, 'CN')
    expect(offset).toBe(480)
  })

  it('6 城市 adoptedShichenIndex 在 0~11 范围', () => {
    for (const city of CITY_CASES) {
      const [y, m, d] = city.dates[0]
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: city.longitude, latitude: city.latitude },
        { standardLongitude: 120 }
      )
      expect(result.trace.adoptedShichenIndex).toBeGreaterThanOrEqual(0)
      expect(result.trace.adoptedShichenIndex).toBeLessThanOrEqual(11)
    }
  })
})
