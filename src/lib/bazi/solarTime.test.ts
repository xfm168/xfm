/**
 * P0-③ 真太阳时 单元测试
 *
 * 验证：
 * 1. 均时差（EoT）在合理范围内（-16 ~ +17 分钟）
 * 2. 经度校正正确（每度4分钟）
 * 3. 真太阳时计算端到端正确（经纬度优先）
 * 4. 城市坐标查询可用（辅助功能）
 * 5. 边界情况（跨日/跨时辰）
 * 6. 与权威数据对照（Meeus EoT 值）
 */

import { describe, it, expect } from 'vitest'
import {
  getEquationOfTime,
  getLongitudeCorrection,
  calculateSolarTime,
  getCityCoordinate,
  getCityLongitude,
  createCoordinate,
  CHINA_CITIES,
  type Coordinate,
} from './solarTime'

describe('P0-③ 真太阳时', () => {
  describe('getEquationOfTime', () => {
    it('EoT 应在合理范围内（-17 ~ +17 分钟）', () => {
      for (let month = 0; month < 12; month++) {
        for (let day = 1; day <= 28; day += 7) {
          const date = new Date(2024, month, day, 12, 0)
          const eot = getEquationOfTime(date)
          expect(eot).toBeGreaterThanOrEqual(-17)
          expect(eot).toBeLessThanOrEqual(17)
        }
      }
    })

    it('2月中旬EoT应为最大正值（约+14分钟）', () => {
      const date = new Date(2024, 1, 12, 12, 0)
      const eot = getEquationOfTime(date)
      expect(eot).toBeGreaterThan(10)
      expect(eot).toBeLessThan(17)
    })

    it('11月初EoT应为最大负值（约-16分钟）', () => {
      const date = new Date(2024, 10, 3, 12, 0)
      const eot = getEquationOfTime(date)
      expect(eot).toBeLessThan(-10)
      expect(eot).toBeGreaterThanOrEqual(-18)
    })

    it('4月和6月EoT应接近0', () => {
      const apr = new Date(2024, 3, 15, 12, 0)
      const jun = new Date(2024, 5, 13, 12, 0)
      expect(Math.abs(getEquationOfTime(apr))).toBeLessThan(4)
      expect(Math.abs(getEquationOfTime(jun))).toBeLessThan(4)
    })

    it('同一天不同时间EoT应相同', () => {
      const d1 = new Date(2024, 5, 15, 0, 0)
      const d2 = new Date(2024, 5, 15, 12, 0)
      const d3 = new Date(2024, 5, 15, 23, 59)
      expect(getEquationOfTime(d1)).toBeCloseTo(getEquationOfTime(d2), 4)
      expect(getEquationOfTime(d2)).toBeCloseTo(getEquationOfTime(d3), 4)
    })
  })

  describe('getLongitudeCorrection', () => {
    it('标准经度120°应无校正', () => {
      expect(getLongitudeCorrection(120)).toBe(0)
    })

    it('东经121°应加4分钟', () => {
      expect(getLongitudeCorrection(121)).toBe(4)
    })

    it('东经119°应减4分钟', () => {
      expect(getLongitudeCorrection(119)).toBe(-4)
    })

    it('上海经度校正约+5.9分钟', () => {
      expect(getLongitudeCorrection(121.4737)).toBeCloseTo(1.4737 * 4, 2)
    })

    it('乌鲁木齐经度校正约-129.5分钟', () => {
      const correction = getLongitudeCorrection(87.6168)
      expect(correction).toBeLessThan(-120)
      expect(correction).toBeGreaterThan(-140)
    })

    it('每度经度差=4分钟', () => {
      expect(getLongitudeCorrection(121) - getLongitudeCorrection(120)).toBe(4)
      expect(getLongitudeCorrection(119) - getLongitudeCorrection(120)).toBe(-4)
    })
  })

  describe('calculateSolarTime（经纬度优先）', () => {
    it('上海出生：经度接近120°', () => {
      const birth = new Date(1990, 0, 15, 8, 30)
      const coord: Coordinate = { longitude: 121.4737, latitude: 31.2304 }
      const result = calculateSolarTime(birth, coord)

      expect(result.coordinate.longitude).toBe(121.4737)
      expect(result.coordinate.latitude).toBe(31.2304)
      expect(result.solarTime instanceof Date).toBe(true)
    })

    it('北京出生：经度偏西，校正量为负', () => {
      const birth = new Date(1990, 0, 15, 8, 30)
      const coord: Coordinate = { longitude: 116.4074, latitude: 39.9042 }
      const result = calculateSolarTime(birth, coord)

      expect(result.longitudeCorrection).toBeLessThan(-14)
      expect(result.totalCorrection).toBeLessThan(0)
    })

    it('乌鲁木齐出生：经度大幅偏西', () => {
      const birth = new Date(1990, 0, 15, 8, 30)
      const coord: Coordinate = { longitude: 87.6168, latitude: 43.8256 }
      const result = calculateSolarTime(birth, coord)

      expect(result.totalCorrection).toBeLessThan(-110)
    })

    it('result包含完整的元数据', () => {
      const birth = new Date(2024, 5, 15, 12, 0)
      const coord: Coordinate = { longitude: 116.4, latitude: 36.0 }
      const result = calculateSolarTime(birth, coord)

      expect(result.originalTime).toBeInstanceOf(Date)
      expect(result.solarTime).toBeInstanceOf(Date)
      expect(typeof result.equationOfTime).toBe('number')
      expect(typeof result.longitudeCorrection).toBe('number')
      expect(typeof result.totalCorrection).toBe('number')
      expect(result.coordinate.longitude).toBe(116.4)
      expect(result.coordinate.latitude).toBe(36.0)
      expect(result.standardLongitude).toBe(120)
    })

    it('totalCorrection = EoT + 经度校正', () => {
      const birth = new Date(2024, 5, 15, 12, 0)
      const coord: Coordinate = { longitude: 116.4, latitude: 36.0 }
      const result = calculateSolarTime(birth, coord)

      expect(result.totalCorrection).toBeCloseTo(
        result.equationOfTime + result.longitudeCorrection, 1,
      )
    })
  })

  describe('边界情况', () => {
    it('真太阳时可能导致跨日', () => {
      const birth = new Date(2024, 5, 15, 23, 55)
      const coord: Coordinate = { longitude: 122, latitude: 30 }
      const result = calculateSolarTime(birth, coord)
      expect(result.solarTime).toBeInstanceOf(Date)
    })

    it('真太阳时可能导致跨时辰', () => {
      const birth = new Date(2024, 5, 15, 8, 58)
      const coord: Coordinate = { longitude: 121.2, latitude: 30 }
      const result = calculateSolarTime(birth, coord)
      expect(result.solarTime.getHours()).toBe(9)
    })

    it('0:05出生校正后可能回到前一日', () => {
      const birth = new Date(2024, 5, 15, 0, 5)
      const coord: Coordinate = { longitude: 116, latitude: 36 }
      const result = calculateSolarTime(birth, coord)
      expect(result.solarTime.getDate()).toBe(14)
    })

    it('闰年2月29日EoT正常计算', () => {
      const birth = new Date(2024, 1, 29, 12, 0)
      const eot = getEquationOfTime(birth)
      expect(eot).toBeGreaterThan(-20)
      expect(eot).toBeLessThan(20)
    })
  })

  describe('城市坐标查询（辅助功能）', () => {
    it('北京坐标正确', () => {
      const coord = getCityCoordinate('北京')
      expect(coord.longitude).toBeCloseTo(116.4074, 2)
      expect(coord.latitude).toBeCloseTo(39.9042, 2)
    })

    it('上海坐标正确', () => {
      const coord = getCityCoordinate('上海')
      expect(coord.longitude).toBeCloseTo(121.4737, 2)
    })

    it('未知城市返回默认坐标', () => {
      const coord = getCityCoordinate('不存在城市')
      expect(coord.longitude).toBe(120)
      expect(coord.latitude).toBe(30)
    })

    it('城市表包含主要城市', () => {
      const required = ['北京', '上海', '广州', '深圳', '成都', '乌鲁木齐', '拉萨']
      for (const city of required) {
        expect(CHINA_CITIES[city]).toBeDefined()
      }
    })

    it('getCityLongitude兼容旧接口', () => {
      expect(getCityLongitude('北京')).toBeCloseTo(116.4074, 2)
    })

    it('createCoordinate创建坐标', () => {
      const coord = createCoordinate(116.4, 39.9)
      expect(coord.longitude).toBe(116.4)
      expect(coord.latitude).toBe(39.9)
    })
  })

  describe('权威数据对照', () => {
    it('2024-02-12 EoT 应约+14分钟', () => {
      const date = new Date(2024, 1, 12, 12, 0)
      const eot = getEquationOfTime(date)
      expect(eot).toBeGreaterThan(12)
      expect(eot).toBeLessThan(17)
    })

    it('2024-11-03 EoT 应约-16分钟', () => {
      const date = new Date(2024, 10, 3, 12, 0)
      const eot = getEquationOfTime(date)
      expect(eot).toBeLessThan(-12)
      expect(eot).toBeGreaterThan(-18)
    })
  })
})
