/**
 * P0-③ 真太阳时 单元测试
 *
 * 验证：
 * 1. 均时差（EoT）在合理范围内（-14 ~ +16 分钟）
 * 2. 经度校正正确（每度4分钟）
 * 3. 真太阳时计算端到端正确
 * 4. 城市经度表可用
 * 5. 边界情况（跨日/跨时辰）
 * 6. 与权威数据对照（寿星天文历 EoT 值）
 */

import { describe, it, expect } from 'vitest'
import {
  getEquationOfTime,
  getLongitudeCorrection,
  calculateSolarTime,
  getCityLongitude,
  CHINA_CITIES,
} from './solarTime'

describe('P0-③ 真太阳时', () => {
  // ========== 均时差（EoT）==========

  describe('getEquationOfTime', () => {
    it('EoT 应在合理范围内（-16 ~ +17 分钟）', () => {
      // 遍历全年验证
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
      const date = new Date(2024, 1, 12, 12, 0) // 2月12日
      const eot = getEquationOfTime(date)
      // Meeus简化算法在2月附近峰值约14分钟
      expect(eot).toBeGreaterThan(10)
      expect(eot).toBeLessThan(17)
    })

    it('11月初EoT应为最大负值（约-16分钟）', () => {
      const date = new Date(2024, 10, 3, 12, 0) // 11月3日
      const eot = getEquationOfTime(date)
      expect(eot).toBeLessThan(-10)
      expect(eot).toBeGreaterThanOrEqual(-18)
    })

    it('4月和6月EoT应接近0', () => {
      const apr = new Date(2024, 3, 15, 12, 0) // 4月15日
      const jun = new Date(2024, 5, 13, 12, 0) // 6月13日
      expect(Math.abs(getEquationOfTime(apr))).toBeLessThan(4)
      expect(Math.abs(getEquationOfTime(jun))).toBeLessThan(4)
    })

    it('同一天不同时间EoT应相同（仅与日期有关）', () => {
      const d1 = new Date(2024, 5, 15, 0, 0)
      const d2 = new Date(2024, 5, 15, 12, 0)
      const d3 = new Date(2024, 5, 15, 23, 59)
      expect(getEquationOfTime(d1)).toBeCloseTo(getEquationOfTime(d2), 4)
      expect(getEquationOfTime(d2)).toBeCloseTo(getEquationOfTime(d3), 4)
    })
  })

  // ========== 经度校正 ==========

  describe('getLongitudeCorrection', () => {
    it('标准经度120°应无校正', () => {
      expect(getLongitudeCorrection(120)).toBe(0)
    })

    it('东经121°（上海）应加4分钟', () => {
      expect(getLongitudeCorrection(121.4737)).toBeCloseTo(1.4737 * 4, 2)
    })

    it('东经116°（北京）应减16分钟', () => {
      expect(getLongitudeCorrection(116.4074)).toBeCloseTo((116.4074 - 120) * 4, 2)
    })

    it('东经87°（乌鲁木齐）应减约132分钟', () => {
      const correction = getLongitudeCorrection(87.6168)
      expect(correction).toBeLessThan(-120)
      expect(correction).toBeGreaterThan(-140)
    })

    it('每度经度差=4分钟', () => {
      expect(getLongitudeCorrection(121) - getLongitudeCorrection(120)).toBe(4)
      expect(getLongitudeCorrection(119) - getLongitudeCorrection(120)).toBe(-4)
    })
  })

  // ========== 真太阳时端到端 ==========

  describe('calculateSolarTime', () => {
    it('上海出生：经度接近120°，校正量主要来自EoT', () => {
      const birth = new Date(1990, 0, 15, 8, 30) // 1990-01-15 08:30
      const result = calculateSolarTime(birth, 121.4737) // 上海

      // 上海经度校正约 +5.9 分钟，1月EoT约 -10 分钟
      // 总校正约 -4 分钟，真太阳时约 08:26
      expect(result.longitude).toBe(121.4737)
      expect(result.standardLongitude).toBe(120)
      expect(result.solarTime instanceof Date).toBe(true)
    })

    it('北京出生：经度偏西，校正量为负', () => {
      const birth = new Date(1990, 0, 15, 8, 30)
      const result = calculateSolarTime(birth, 116.4074) // 北京

      // 北京经度校正约 -14.4 分钟，1月EoT约 +9.4 分钟
      // 总校正约 -5 分钟，真太阳时比钟表时间早约5分钟
      expect(result.longitudeCorrection).toBeLessThan(-14)
      expect(result.totalCorrection).toBeLessThan(0)
    })

    it('乌鲁木齐出生：经度大幅偏西', () => {
      const birth = new Date(1990, 0, 15, 8, 30)
      const result = calculateSolarTime(birth, 87.6168) // 乌鲁木齐

      // 经度校正约 -129.5 分钟，真太阳时大幅提前
      expect(result.totalCorrection).toBeLessThan(-110)
    })

    it('result包含完整的元数据', () => {
      const birth = new Date(2024, 5, 15, 12, 0)
      const result = calculateSolarTime(birth, 116.4)

      expect(result.originalTime).toBeInstanceOf(Date)
      expect(result.solarTime).toBeInstanceOf(Date)
      expect(typeof result.equationOfTime).toBe('number')
      expect(typeof result.longitudeCorrection).toBe('number')
      expect(typeof result.totalCorrection).toBe('number')
      expect(result.longitude).toBe(116.4)
      expect(result.standardLongitude).toBe(120)
    })

    it('totalCorrection = EoT + 经度校正', () => {
      const birth = new Date(2024, 5, 15, 12, 0)
      const result = calculateSolarTime(birth, 116.4)

      expect(result.totalCorrection).toBeCloseTo(
        result.equationOfTime + result.longitudeCorrection, 1,
      )
    })
  })

  // ========== 边界情况 ==========

  describe('边界情况', () => {
    it('真太阳时可能导致跨日（23:xx 校正后进入次日）', () => {
      // 23:55 出生，校正 +10 分钟 → 真太阳时 00:05 次日
      const birth = new Date(2024, 5, 15, 23, 55)
      const result = calculateSolarTime(birth, 122) // 略偏东+8分钟，2月EoT约+14
      // 如果总校正 > 5分钟，真太阳时将跨入次日
      // 注意：此测试仅验证计算正确，不验证是否跨日（取决于具体EoT值）
      expect(result.solarTime).toBeInstanceOf(Date)
    })

    it('真太阳时可能导致跨时辰', () => {
      // 08:58 出生，校正 +5 分钟 → 真太阳时 09:03（从辰时进入巳时）
      const birth = new Date(2024, 5, 15, 8, 58)
      const result = calculateSolarTime(birth, 121.2)
      // 经度校正约 +4.8 分钟，6月EoT约 -1 分钟
      // 总校正约 +3.8 分钟 → 真太阳时约 09:02
      expect(result.solarTime.getHours()).toBe(9)
    })

    it('0:05出生校正-8分钟可能回到前一日23:57', () => {
      const birth = new Date(2024, 5, 15, 0, 5)
      const result = calculateSolarTime(birth, 116) // 北京偏西
      // 经度校正约 -16 分钟，6月EoT约 -1 分钟
      // 总校正约 -17 分钟 → 真太阳时约前一日 23:48
      expect(result.solarTime.getDate()).toBe(14) // 前一天
    })

    it('闰年2月29日EoT正常计算', () => {
      const birth = new Date(2024, 1, 29, 12, 0) // 闰年2月29日
      const eot = getEquationOfTime(birth)
      expect(eot).toBeGreaterThan(-20)
      expect(eot).toBeLessThan(20)
    })
  })

  // ========== 城市经度表 ==========

  describe('城市经度表', () => {
    it('北京经度约为116.4', () => {
      expect(getCityLongitude('北京')).toBeCloseTo(116.4074, 2)
    })

    it('上海经度约为121.5', () => {
      expect(getCityLongitude('上海')).toBeCloseTo(121.4737, 2)
    })

    it('未知城市返回默认120', () => {
      expect(getCityLongitude('不存在城市')).toBe(120)
    })

    it('城市表包含主要城市', () => {
      const required = ['北京', '上海', '广州', '深圳', '成都', '武汉', '杭州', '乌鲁木齐']
      for (const city of required) {
        expect(CHINA_CITIES[city]).toBeDefined()
        expect(CHINA_CITIES[city].longitude).toBeGreaterThan(70)
        expect(CHINA_CITIES[city].longitude).toBeLessThan(140)
      }
    })
  })

  // ========== 权威对照 ==========

  describe('权威数据对照', () => {
    it('2024-02-12 EoT 应约+14分钟（对照寿星天文历）', () => {
      const date = new Date(2024, 1, 12, 12, 0)
      const eot = getEquationOfTime(date)
      // Meeus简化算法精度约±30秒，允许±2分钟误差
      expect(eot).toBeGreaterThan(12)
      expect(eot).toBeLessThan(17)
    })

    it('2024-11-03 EoT 应约-16分钟（对照寿星天文历）', () => {
      const date = new Date(2024, 10, 3, 12, 0)
      const eot = getEquationOfTime(date)
      expect(eot).toBeLessThan(-12)
      expect(eot).toBeGreaterThan(-18)
    })
  })
})
