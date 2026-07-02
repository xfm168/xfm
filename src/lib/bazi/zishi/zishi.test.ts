/**
 * P0-② 子时换日模块 - 单元测试 + 边界测试
 *
 * 测试范围：
 * 1. 各策略在关键时间点的行为（23:00/23:59:59/00:00/00:00:01/12:00/22:59:59）
 * 2. 立春日 23:00 年柱切换验证
 * 3. 策略默认值（不传参时使用 late）
 * 4. computeHourIndex 共享逻辑验证
 * 5. 策略元信息完整性
 */

import { describe, it, expect } from 'vitest'
import {
  LateZiShiStrategy,
  EarlyZiShiStrategy,
  GregorianStrategy,
  computeHourIndex,
} from './strategies'
import {
  resolveChartDate,
  getZiShiStrategy,
  DEFAULT_STRATEGY,
} from './index'
import type { ZiShiStrategy } from './strategies'
import type { ZiShiStrategyType } from '../types'
import { getSolarTermDate, isAfterLiChun } from '../solarTerms'

// 测试基准日期：2026-06-15（庚申日），次日 2026-06-16（辛酉日）
const BASE_YEAR = 2026
const BASE_MONTH = 5 // 6月（0-indexed）
const BASE_DAY = 15

// ========== 辅助函数 ==========
function makeDate(h: number, m: number, s = 0): Date {
  return new Date(BASE_YEAR, BASE_MONTH, BASE_DAY, h, m, s)
}

const STRATEGIES: ZiShiStrategyType[] = ['late', 'early', 'gregorian']

describe('P0-② 子时换日模块', () => {
  // ========== 1. 关键时间点行为验证 ==========

  describe('23:00:00 各策略行为', () => {
    const birth = makeDate(23, 0, 0)

    it('late：晚子时，chartDate=次日，hourIndex=0，isLateZiShi=true', () => {
      const r = resolveChartDate(birth, 'late')
      expect(r.hourIndex).toBe(0)
      expect(r.isLateZiShi).toBe(true)
      expect(r.strategyId).toBe('late')
      // chartDate 应为次日 00:00:00
      expect(r.chartDate.getFullYear()).toBe(BASE_YEAR)
      expect(r.chartDate.getMonth()).toBe(BASE_MONTH)
      expect(r.chartDate.getDate()).toBe(BASE_DAY + 1)
      expect(r.chartDate.getHours()).toBe(0)
      expect(r.chartDate.getMinutes()).toBe(0)
      expect(r.chartDate.getSeconds()).toBe(0)
    })

    it('early：当日，hourIndex=0，isLateZiShi=false', () => {
      const r = resolveChartDate(birth, 'early')
      expect(r.hourIndex).toBe(0)
      expect(r.isLateZiShi).toBe(false)
      expect(r.strategyId).toBe('early')
      // chartDate 应为当日（保留时刻）
      expect(r.chartDate.getDate()).toBe(BASE_DAY)
      expect(r.chartDate.getHours()).toBe(23)
      expect(r.chartDate.getMinutes()).toBe(0)
    })

    it('gregorian：与 early 行为相同', () => {
      const r = resolveChartDate(birth, 'gregorian')
      expect(r.hourIndex).toBe(0)
      expect(r.isLateZiShi).toBe(false)
      expect(r.strategyId).toBe('gregorian')
      expect(r.chartDate.getDate()).toBe(BASE_DAY)
      expect(r.chartDate.getHours()).toBe(23)
    })
  })

  describe('23:59:59 各策略行为', () => {
    const birth = makeDate(23, 59, 59)

    it('late：晚子时，chartDate=次日', () => {
      const r = resolveChartDate(birth, 'late')
      expect(r.hourIndex).toBe(0)
      expect(r.isLateZiShi).toBe(true)
      expect(r.chartDate.getDate()).toBe(BASE_DAY + 1)
      expect(r.chartDate.getHours()).toBe(0)
      expect(r.chartDate.getMinutes()).toBe(0)
      expect(r.chartDate.getSeconds()).toBe(0)
    })

    it('early：当日，保留时刻', () => {
      const r = resolveChartDate(birth, 'early')
      expect(r.hourIndex).toBe(0)
      expect(r.isLateZiShi).toBe(false)
      expect(r.chartDate.getDate()).toBe(BASE_DAY)
      expect(r.chartDate.getHours()).toBe(23)
      expect(r.chartDate.getMinutes()).toBe(59)
      expect(r.chartDate.getSeconds()).toBe(59)
    })

    it('gregorian：与 early 行为相同', () => {
      const r = resolveChartDate(birth, 'gregorian')
      expect(r.hourIndex).toBe(0)
      expect(r.isLateZiShi).toBe(false)
      expect(r.chartDate.getDate()).toBe(BASE_DAY)
    })
  })

  describe('00:00:00 各策略行为', () => {
    const birth = makeDate(0, 0, 0)

    it('late：当日（早子时），hourIndex=0，isLateZiShi=false', () => {
      const r = resolveChartDate(birth, 'late')
      expect(r.hourIndex).toBe(0)
      expect(r.isLateZiShi).toBe(false)
      expect(r.chartDate.getDate()).toBe(BASE_DAY)
      expect(r.chartDate.getHours()).toBe(0)
    })

    it('early：当日，hourIndex=0，isLateZiShi=false', () => {
      const r = resolveChartDate(birth, 'early')
      expect(r.hourIndex).toBe(0)
      expect(r.isLateZiShi).toBe(false)
      expect(r.chartDate.getDate()).toBe(BASE_DAY)
    })

    it('gregorian：当日，hourIndex=0，isLateZiShi=false', () => {
      const r = resolveChartDate(birth, 'gregorian')
      expect(r.hourIndex).toBe(0)
      expect(r.isLateZiShi).toBe(false)
      expect(r.chartDate.getDate()).toBe(BASE_DAY)
    })
  })

  describe('00:00:01 各策略行为', () => {
    const birth = makeDate(0, 0, 1)

    it.each(STRATEGIES)('%s：当日，hourIndex=0，isLateZiShi=false', (s) => {
      const r = resolveChartDate(birth, s)
      expect(r.hourIndex).toBe(0)
      expect(r.isLateZiShi).toBe(false)
      expect(r.chartDate.getDate()).toBe(BASE_DAY)
    })
  })

  describe('12:00:00 各策略行为（非子时）', () => {
    const birth = makeDate(12, 0, 0)

    it.each(STRATEGIES)('%s：当日，hourIndex=6（午），isLateZiShi=false', (s) => {
      const r = resolveChartDate(birth, s)
      expect(r.hourIndex).toBe(6)
      expect(r.isLateZiShi).toBe(false)
      expect(r.chartDate.getDate()).toBe(BASE_DAY)
      expect(r.chartDate.getHours()).toBe(12)
    })
  })

  describe('22:59:59 各策略行为（非子时边界）', () => {
    const birth = makeDate(22, 59, 59)

    it.each(STRATEGIES)('%s：当日，hourIndex=11（亥），isLateZiShi=false', (s) => {
      const r = resolveChartDate(birth, s)
      expect(r.hourIndex).toBe(11)
      expect(r.isLateZiShi).toBe(false)
      expect(r.chartDate.getDate()).toBe(BASE_DAY)
      expect(r.chartDate.getHours()).toBe(22)
    })
  })

  // ========== 2. 立春日 23:00 年柱切换验证 ==========

  describe('立春日 23:00（验证年柱是否正确切换）', () => {
    // 2026年立春：2026-02-04 04:02:08（已过立春）
    const lichun2026 = getSolarTermDate(2026, '立春')
    const lichunDay = lichun2026.date.getDate() // 4
    const lichunMonth = lichun2026.date.getMonth() // 1 (2月)

    it('立春日当天 23:00，late 策略：chartDate=次日，已过立春 → 年柱属本年(丙午)', () => {
      const birth = new Date(2026, lichunMonth, lichunDay, 23, 0, 0)
      const r = resolveChartDate(birth, 'late')
      // chartDate 应为次日 00:00:00
      expect(r.chartDate.getDate()).toBe(lichunDay + 1)
      expect(r.chartDate.getHours()).toBe(0)
      // 次日必然已过立春
      expect(isAfterLiChun(r.chartDate, 2026)).toBe(true)
    })

    it('立春前一日 23:00，late 策略：chartDate=立春日0点，未到立春时刻 → 年柱属上一年(乙巳)', () => {
      const birth = new Date(2026, lichunMonth, lichunDay - 1, 23, 0, 0)
      const r = resolveChartDate(birth, 'late')
      // chartDate 应为立春日 00:00:00
      expect(r.chartDate.getDate()).toBe(lichunDay)
      expect(r.chartDate.getHours()).toBe(0)
      expect(r.chartDate.getMinutes()).toBe(0)
      // 立春日0点尚未到立春时刻（04:02:08）
      expect(isAfterLiChun(r.chartDate, 2026)).toBe(false)
    })

    it('立春日当天 23:00，early 策略：chartDate=当日23:00，已过立春时刻 → 年柱属本年', () => {
      const birth = new Date(2026, lichunMonth, lichunDay, 23, 0, 0)
      const r = resolveChartDate(birth, 'early')
      expect(r.chartDate.getDate()).toBe(lichunDay)
      expect(r.chartDate.getHours()).toBe(23)
      // 23:00 必然已过立春时刻（04:02:08）
      expect(isAfterLiChun(r.chartDate, 2026)).toBe(true)
    })

    it('立春前一日 23:00，early 策略：chartDate=当日23:00，未到立春 → 年柱属上一年', () => {
      const birth = new Date(2026, lichunMonth, lichunDay - 1, 23, 0, 0)
      const r = resolveChartDate(birth, 'early')
      expect(r.chartDate.getDate()).toBe(lichunDay - 1)
      expect(r.chartDate.getHours()).toBe(23)
      // 立春前一日23:00 未到立春（次日04:02:08）
      expect(isAfterLiChun(r.chartDate, 2026)).toBe(false)
    })
  })

  // ========== 3. 策略默认值 ==========

  describe('策略默认值（不传参时使用 late）', () => {
    it('DEFAULT_STRATEGY 为 late', () => {
      expect(DEFAULT_STRATEGY).toBe('late')
    })

    it('resolveChartDate 不传 strategy 时使用 late 策略', () => {
      const birth = makeDate(23, 30, 0)
      const r = resolveChartDate(birth) // 不传 strategy
      expect(r.strategyId).toBe('late')
      expect(r.isLateZiShi).toBe(true)
      // 与显式传 'late' 结果一致
      const rExplicit = resolveChartDate(birth, 'late')
      expect(r.chartDate.getTime()).toBe(rExplicit.chartDate.getTime())
      expect(r.hourIndex).toBe(rExplicit.hourIndex)
      expect(r.isLateZiShi).toBe(rExplicit.isLateZiShi)
    })

    it('resolveChartDate 传 undefined 时也使用 late 策略', () => {
      const birth = makeDate(23, 30, 0)
      const r = resolveChartDate(birth, undefined)
      expect(r.strategyId).toBe('late')
    })
  })

  // ========== 4. computeHourIndex 共享逻辑验证 ==========

  describe('computeHourIndex 时辰索引计算', () => {
    it('23:00-00:59 → 0 (子)', () => {
      expect(computeHourIndex(23, 0)).toBe(0)
      expect(computeHourIndex(23, 30)).toBe(0)
      expect(computeHourIndex(23, 59)).toBe(0)
      expect(computeHourIndex(0, 0)).toBe(0)
      expect(computeHourIndex(0, 30)).toBe(0)
      expect(computeHourIndex(0, 59)).toBe(0)
    })

    it('01:00-02:59 → 1 (丑)', () => {
      expect(computeHourIndex(1, 0)).toBe(1)
      expect(computeHourIndex(1, 59)).toBe(1)
      expect(computeHourIndex(2, 0)).toBe(1)
      expect(computeHourIndex(2, 59)).toBe(1)
    })

    it('03:00-04:59 → 2 (寅)', () => {
      expect(computeHourIndex(3, 0)).toBe(2)
      expect(computeHourIndex(4, 59)).toBe(2)
    })

    it('05:00-06:59 → 3 (卯)', () => {
      expect(computeHourIndex(5, 0)).toBe(3)
      expect(computeHourIndex(6, 59)).toBe(3)
    })

    it('07:00-08:59 → 4 (辰)', () => {
      expect(computeHourIndex(7, 0)).toBe(4)
      expect(computeHourIndex(8, 59)).toBe(4)
    })

    it('09:00-10:59 → 5 (巳)', () => {
      expect(computeHourIndex(9, 0)).toBe(5)
      expect(computeHourIndex(10, 59)).toBe(5)
    })

    it('11:00-12:59 → 6 (午)', () => {
      expect(computeHourIndex(11, 0)).toBe(6)
      expect(computeHourIndex(12, 59)).toBe(6)
    })

    it('13:00-14:59 → 7 (未)', () => {
      expect(computeHourIndex(13, 0)).toBe(7)
      expect(computeHourIndex(14, 59)).toBe(7)
    })

    it('15:00-16:59 → 8 (申)', () => {
      expect(computeHourIndex(15, 0)).toBe(8)
      expect(computeHourIndex(16, 59)).toBe(8)
    })

    it('17:00-18:59 → 9 (酉)', () => {
      expect(computeHourIndex(17, 0)).toBe(9)
      expect(computeHourIndex(18, 59)).toBe(9)
    })

    it('19:00-20:59 → 10 (戌)', () => {
      expect(computeHourIndex(19, 0)).toBe(10)
      expect(computeHourIndex(20, 59)).toBe(10)
    })

    it('21:00-22:59 → 11 (亥)', () => {
      expect(computeHourIndex(21, 0)).toBe(11)
      expect(computeHourIndex(22, 59)).toBe(11)
    })

    it('边界：22:59 → 亥(11)，23:00 → 子(0)', () => {
      expect(computeHourIndex(22, 59)).toBe(11)
      expect(computeHourIndex(23, 0)).toBe(0)
    })

    it('边界：00:59 → 子(0)，01:00 → 丑(1)', () => {
      expect(computeHourIndex(0, 59)).toBe(0)
      expect(computeHourIndex(1, 0)).toBe(1)
    })
  })

  // ========== 5. 策略元信息完整性 ==========

  describe('策略元信息完整性', () => {
    const lateStrategy = getZiShiStrategy('late')
    const earlyStrategy = getZiShiStrategy('early')
    const gregorianStrategy = getZiShiStrategy('gregorian')

    it('late 策略元信息', () => {
      expect(lateStrategy.id).toBe('late')
      expect(lateStrategy.name).toContain('晚子时')
      expect(lateStrategy.description).toBeTruthy()
      expect(lateStrategy.reference).toContain('三命通会')
      expect(lateStrategy.evidenceLevel).toBe('A')
    })

    it('early 策略元信息', () => {
      expect(earlyStrategy.id).toBe('early')
      expect(earlyStrategy.name).toContain('早子时')
      expect(earlyStrategy.reference).toContain('李虚中')
      expect(earlyStrategy.evidenceLevel).toBe('B')
    })

    it('gregorian 策略元信息', () => {
      expect(gregorianStrategy.id).toBe('gregorian')
      expect(gregorianStrategy.name).toContain('公历')
      expect(gregorianStrategy.evidenceLevel).toBe('C')
    })

    it('三种策略 id 互不相同', () => {
      const ids = new Set([lateStrategy.id, earlyStrategy.id, gregorianStrategy.id])
      expect(ids.size).toBe(3)
    })

    it('gregorian 与 early 行为相同（区别仅在 reference）', () => {
      const birth = makeDate(23, 30, 0)
      const rEarly = resolveChartDate(birth, 'early')
      const rGreg = resolveChartDate(birth, 'gregorian')
      expect(rEarly.chartDate.getTime()).toBe(rGreg.chartDate.getTime())
      expect(rEarly.hourIndex).toBe(rGreg.hourIndex)
      expect(rEarly.isLateZiShi).toBe(rGreg.isLateZiShi)
      // 但 strategyId 不同
      expect(rEarly.strategyId).not.toBe(rGreg.strategyId)
    })
  })

  // ========== 6. 策略实例化与一致性 ==========

  describe('策略实例化', () => {
    it('getZiShiStrategy 返回策略实例', () => {
      expect(getZiShiStrategy('late')).toBeInstanceOf(LateZiShiStrategy)
      expect(getZiShiStrategy('early')).toBeInstanceOf(EarlyZiShiStrategy)
      expect(getZiShiStrategy('gregorian')).toBeInstanceOf(GregorianStrategy)
    })

    it('同一策略类型返回同一实例（单例）', () => {
      expect(getZiShiStrategy('late')).toBe(getZiShiStrategy('late'))
      expect(getZiShiStrategy('early')).toBe(getZiShiStrategy('early'))
      expect(getZiShiStrategy('gregorian')).toBe(getZiShiStrategy('gregorian'))
    })
  })

  // ========== 7. chartDate 不可变性 ==========

  describe('chartDate 不可变性', () => {
    it('resolveChartDate 不修改原始 birth 对象', () => {
      const birth = makeDate(23, 30, 0)
      const originalTime = birth.getTime()
      resolveChartDate(birth, 'late')
      expect(birth.getTime()).toBe(originalTime)
    })

    it('返回的 chartDate 是新对象（修改不影响 birth）', () => {
      const birth = makeDate(23, 30, 0)
      const r = resolveChartDate(birth, 'late')
      r.chartDate.setHours(12)
      // 修改 chartDate 不应影响 birth
      expect(birth.getHours()).toBe(23)
    })
  })
})
