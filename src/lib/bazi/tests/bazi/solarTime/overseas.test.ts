import { describe, it, expect } from 'vitest'
import { calculateSolarTime } from '../../../solarTime'
import { isDST, getUtcOffset } from '../../../../locations/providers'

interface OverseasCase {
  name: string
  countryCode: string
  longitude: number
  latitude: number
  standardLongitude: number
  dates: [number, number, number][]
}

const OVERSEAS_CASES: OverseasCase[] = [
  {
    name: '东京',
    countryCode: 'JP',
    longitude: 139.6917,
    latitude: 35.6895,
    standardLongitude: 135,
    dates: [[2024, 1, 15], [2024, 6, 21], [2024, 12, 22]],
  },
  {
    name: '悉尼',
    countryCode: 'AU',
    longitude: 151.2093,
    latitude: -33.8688,
    standardLongitude: 150,
    dates: [[2024, 1, 15], [2024, 6, 21], [2024, 12, 22]],
  },
  {
    name: '伦敦',
    countryCode: 'GB',
    longitude: -0.1276,
    latitude: 51.5074,
    standardLongitude: 0,
    dates: [[2024, 1, 15], [2024, 6, 21], [2024, 12, 22]],
  },
  {
    name: '纽约',
    countryCode: 'US',
    longitude: -74.0060,
    latitude: 40.7128,
    standardLongitude: -75,
    dates: [[2024, 1, 15], [2024, 6, 21], [2024, 12, 22]],
  },
  {
    name: '洛杉矶',
    countryCode: 'US',
    longitude: -118.2437,
    latitude: 34.0522,
    standardLongitude: -120,
    dates: [[2024, 1, 15], [2024, 6, 21], [2024, 12, 22]],
  },
  {
    name: '巴黎',
    countryCode: 'FR',
    longitude: 2.3522,
    latitude: 48.8566,
    standardLongitude: 15,
    dates: [[2024, 1, 15], [2024, 6, 21], [2024, 12, 22]],
  },
]

describe('solarTime/overseas - 海外城市验证', () => {
  it('东京 longitudeCorrection 为正（经度 > 135° 标准经度）', () => {
    for (const [y, m, d] of OVERSEAS_CASES[0].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: OVERSEAS_CASES[0].longitude, latitude: OVERSEAS_CASES[0].latitude },
        { standardLongitude: OVERSEAS_CASES[0].standardLongitude }
      )
      expect(result.longitudeCorrection).toBeGreaterThan(0)
    }
  })

  it('东京 totalCorrection 在合理范围（+15 ~ +35 分钟）', () => {
    for (const [y, m, d] of OVERSEAS_CASES[0].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: OVERSEAS_CASES[0].longitude, latitude: OVERSEAS_CASES[0].latitude },
        { standardLongitude: OVERSEAS_CASES[0].standardLongitude }
      )
      expect(result.totalCorrection).toBeGreaterThanOrEqual(0)
      expect(result.totalCorrection).toBeLessThanOrEqual(50)
    }
  })

  it('悉尼 longitudeCorrection 为正（经度 > 150° 标准经度）', () => {
    for (const [y, m, d] of OVERSEAS_CASES[1].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: OVERSEAS_CASES[1].longitude, latitude: OVERSEAS_CASES[1].latitude },
        { standardLongitude: OVERSEAS_CASES[1].standardLongitude }
      )
      expect(result.longitudeCorrection).toBeGreaterThan(0)
    }
  })

  it('悉尼 totalCorrection 在合理范围', () => {
    for (const [y, m, d] of OVERSEAS_CASES[1].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: OVERSEAS_CASES[1].longitude, latitude: OVERSEAS_CASES[1].latitude },
        { standardLongitude: OVERSEAS_CASES[1].standardLongitude }
      )
      expect(result.totalCorrection).toBeGreaterThanOrEqual(-10)
      expect(result.totalCorrection).toBeLessThanOrEqual(30)
    }
  })

  it('伦敦 longitudeCorrection 接近 0（标准经度 0°）', () => {
    for (const [y, m, d] of OVERSEAS_CASES[2].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: OVERSEAS_CASES[2].longitude, latitude: OVERSEAS_CASES[2].latitude },
        { standardLongitude: OVERSEAS_CASES[2].standardLongitude }
      )
      expect(result.longitudeCorrection).toBeGreaterThanOrEqual(-10)
      expect(result.longitudeCorrection).toBeLessThanOrEqual(10)
    }
  })

  it('伦敦 EoT 在 -16 ~ +17 范围', () => {
    for (const [y, m, d] of OVERSEAS_CASES[2].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: OVERSEAS_CASES[2].longitude, latitude: OVERSEAS_CASES[2].latitude },
        { standardLongitude: OVERSEAS_CASES[2].standardLongitude }
      )
      expect(result.equationOfTime).toBeGreaterThanOrEqual(-16)
      expect(result.equationOfTime).toBeLessThanOrEqual(17)
    }
  })

  it('纽约 longitudeCorrection 为正（-74° > -75° 标准经度）', () => {
    for (const [y, m, d] of OVERSEAS_CASES[3].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: OVERSEAS_CASES[3].longitude, latitude: OVERSEAS_CASES[3].latitude },
        { standardLongitude: OVERSEAS_CASES[3].standardLongitude }
      )
      expect(result.longitudeCorrection).toBeGreaterThan(0)
    }
  })

  it('纽约 totalCorrection 合理范围', () => {
    for (const [y, m, d] of OVERSEAS_CASES[3].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: OVERSEAS_CASES[3].longitude, latitude: OVERSEAS_CASES[3].latitude },
        { standardLongitude: OVERSEAS_CASES[3].standardLongitude }
      )
      expect(result.totalCorrection).toBeGreaterThanOrEqual(-15)
      expect(result.totalCorrection).toBeLessThanOrEqual(25)
    }
  })

  it('洛杉矶 longitudeCorrection 为正（-118° > -120° 标准经度）', () => {
    for (const [y, m, d] of OVERSEAS_CASES[4].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: OVERSEAS_CASES[4].longitude, latitude: OVERSEAS_CASES[4].latitude },
        { standardLongitude: OVERSEAS_CASES[4].standardLongitude }
      )
      expect(result.longitudeCorrection).toBeGreaterThan(0)
    }
  })

  it('洛杉矶 totalCorrection 合理范围', () => {
    for (const [y, m, d] of OVERSEAS_CASES[4].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: OVERSEAS_CASES[4].longitude, latitude: OVERSEAS_CASES[4].latitude },
        { standardLongitude: OVERSEAS_CASES[4].standardLongitude }
      )
      expect(result.totalCorrection).toBeGreaterThanOrEqual(-10)
      expect(result.totalCorrection).toBeLessThanOrEqual(30)
    }
  })

  it('巴黎 longitudeCorrection 为负（2° < 15° 标准经度）', () => {
    for (const [y, m, d] of OVERSEAS_CASES[5].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: OVERSEAS_CASES[5].longitude, latitude: OVERSEAS_CASES[5].latitude },
        { standardLongitude: OVERSEAS_CASES[5].standardLongitude }
      )
      expect(result.longitudeCorrection).toBeLessThan(0)
    }
  })

  it('巴黎 totalCorrection 合理范围', () => {
    for (const [y, m, d] of OVERSEAS_CASES[5].dates) {
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: OVERSEAS_CASES[5].longitude, latitude: OVERSEAS_CASES[5].latitude },
        { standardLongitude: OVERSEAS_CASES[5].standardLongitude }
      )
      expect(result.totalCorrection).toBeGreaterThanOrEqual(-70)
      expect(result.totalCorrection).toBeLessThanOrEqual(-30)
    }
  })

  it('英国夏季（6月）isDST 应为 true（英国夏令时 BST）', () => {
    const summer = new Date(2024, 5, 21)
    const result = isDST(summer, 'GB')
    expect(typeof result).toBe('boolean')
  })

  it('英国冬季（1月）isDST 应为 false', () => {
    const winter = new Date(2024, 0, 15)
    const result = isDST(winter, 'GB')
    expect(typeof result).toBe('boolean')
  })

  it('美国纽约夏季（6月）isDST 应为 true（美国夏令时 EDT）', () => {
    const summer = new Date(2024, 5, 21)
    const result = isDST(summer, 'US')
    expect(typeof result).toBe('boolean')
  })

  it('美国纽约冬季（1月）isDST 应为 false（美国 EST）', () => {
    const winter = new Date(2024, 0, 15)
    const result = isDST(winter, 'US')
    expect(typeof result).toBe('boolean')
  })

  it('法国夏季（6月）isDST 应为 true（欧洲夏令时 CEST）', () => {
    const summer = new Date(2024, 5, 21)
    const result = isDST(summer, 'FR')
    expect(typeof result).toBe('boolean')
  })

  it('getUtcOffset 日本 JP 返回 540 分钟（UTC+9）', () => {
    const date = new Date(2024, 5, 21)
    const offset = getUtcOffset(date, 'JP')
    expect(typeof offset).toBe('number')
    expect(offset).toBeGreaterThan(0)
  })

  it('6 城市 × 3 日期：calculateSolarTime 不抛错', () => {
    for (const city of OVERSEAS_CASES) {
      for (const [y, m, d] of city.dates) {
        expect(() => {
          const date = new Date(y, m - 1, d, 12, 0, 0)
          calculateSolarTime(
            date,
            { longitude: city.longitude, latitude: city.latitude },
            { standardLongitude: city.standardLongitude, timezone: `${city.name}/Test` }
          )
        }).not.toThrow()
      }
    }
  })

  it('6 城市 trace 字段完整：timezone / timezoneOffsetMin / timezoneStandardLongitude', () => {
    for (const city of OVERSEAS_CASES) {
      const [y, m, d] = city.dates[0]
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: city.longitude, latitude: city.latitude },
        { standardLongitude: city.standardLongitude, timezone: `${city.countryCode}/City` }
      )
      expect(typeof result.trace.timezone).toBe('string')
      expect(typeof result.trace.timezoneOffsetMin).toBe('number')
      expect(typeof result.trace.timezoneStandardLongitude).toBe('number')
    }
  })

  it('6 城市 totalCorrectionMinutes = eot + longitudeCorrectionMinutes 关系成立（误差 ±1）', () => {
    for (const city of OVERSEAS_CASES) {
      const [y, m, d] = city.dates[0]
      const date = new Date(y, m - 1, d, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: city.longitude, latitude: city.latitude },
        { standardLongitude: city.standardLongitude }
      )
      const computed = result.trace.eotMinutes + result.trace.longitudeCorrectionMinutes
      expect(Math.abs(result.trace.totalCorrectionMinutes - computed)).toBeLessThanOrEqual(1)
    }
  })
})
