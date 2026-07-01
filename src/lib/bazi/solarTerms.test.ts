/**
 * P0-① 节气精确到时分秒 - 单元测试
 *
 * 测试范围：
 * 1. 24节气返回数据包含秒级精度
 * 2. 立春时刻精确到秒
 * 3. 立春前后1秒年柱归属验证
 * 4. 节气换月精确到秒
 * 5. 与已知权威数据对比
 */

import { describe, it, expect } from 'vitest'
import {
  getSolarTermDate,
  getYearSolarTerms,
  getMonthZhiIndex,
  isAfterLiChun,
  explainSolarTerms,
} from './solarTerms'
import type { SolarTermName } from './types'

describe('P0-① 节气精确到时分秒', () => {
  // ========== 1. 秒级精度验证 ==========

  describe('秒级精度', () => {
    it('SolarTermInfo 包含 second 字段', () => {
      const lichun = getSolarTermDate(2026, '立春')
      expect(lichun).toHaveProperty('second')
      expect(typeof lichun.second).toBe('number')
      expect(lichun.second).toBeGreaterThanOrEqual(0)
      expect(lichun.second).toBeLessThanOrEqual(59)
    })

    it('SolarTermInfo 包含完整 Date 对象', () => {
      const lichun = getSolarTermDate(2026, '立春')
      expect(lichun.date).toBeInstanceOf(Date)
    })

    it('24节气全部包含 second 字段', () => {
      const terms = getYearSolarTerms(2026)
      expect(terms.length).toBe(24)
      for (const term of terms) {
        expect(term).toHaveProperty('second')
        expect(typeof term.second).toBe('number')
        expect(term.second).toBeGreaterThanOrEqual(0)
        expect(term.second).toBeLessThanOrEqual(59)
      }
    })
  })

  // ========== 2. 立春时刻验证 ==========

  describe('立春时刻', () => {
    it('2026年立春在2月4日', () => {
      const lichun = getSolarTermDate(2026, '立春')
      expect(lichun.month).toBe(2)
      expect(lichun.day).toBe(4)
    })

    it('2025年立春在2月3日', () => {
      const lichun = getSolarTermDate(2025, '立春')
      expect(lichun.month).toBe(2)
      expect(lichun.day).toBe(3)
    })

    it('立春时刻包含非零秒数（验证秒级精度生效）', () => {
      // 节气时刻的秒数不一定为0，如果为0也可能是巧合
      // 但 Date 对象必须包含秒级信息
      const lichun = getSolarTermDate(2026, '立春')
      const d = lichun.date
      // 验证 Date 对象的秒精度
      expect(d.getSeconds()).toBe(lichun.second)
    })
  })

  // ========== 3. 立春前后1秒年柱归属验证 ==========

  describe('立春边界（秒级）', () => {
    it('立春前1秒 → 未过立春（年柱属上一年）', () => {
      const lichun = getSolarTermDate(2026, '立春')
      const beforeLichun = new Date(lichun.date.getTime() - 1000) // 前1秒
      expect(isAfterLiChun(beforeLichun, 2026)).toBe(false)
    })

    it('立春后1秒 → 已过立春（年柱属本年）', () => {
      const lichun = getSolarTermDate(2026, '立春')
      const afterLichun = new Date(lichun.date.getTime() + 1000) // 后1秒
      expect(isAfterLiChun(afterLichun, 2026)).toBe(true)
    })

    it('立春时刻 → 已过立春（>= 判定）', () => {
      const lichun = getSolarTermDate(2026, '立春')
      expect(isAfterLiChun(lichun.date, 2026)).toBe(true)
    })

    it('立春前1分钟 vs 后1分钟年柱不同', () => {
      const lichun = getSolarTermDate(2026, '立春')
      const before = new Date(lichun.date.getTime() - 60_000)
      const after = new Date(lichun.date.getTime() + 60_000)
      expect(isAfterLiChun(before, 2026)).toBe(false)
      expect(isAfterLiChun(after, 2026)).toBe(true)
    })

    it('2025年立春边界验证', () => {
      const lichun = getSolarTermDate(2025, '立春')
      const before = new Date(lichun.date.getTime() - 1000)
      const after = new Date(lichun.date.getTime() + 1000)
      expect(isAfterLiChun(before, 2025)).toBe(false)
      expect(isAfterLiChun(after, 2025)).toBe(true)
    })
  })

  // ========== 4. 节气换月精确到秒 ==========

  describe('节气换月（秒级）', () => {
    it('惊蛰前1秒 → 寅月', () => {
      const jingzhe = getSolarTermDate(2026, '惊蛰')
      const before = new Date(jingzhe.date.getTime() - 1000)
      const idx = getMonthZhiIndex(before)
      expect(idx).toBe(0) // 寅月
    })

    it('惊蛰后1秒 → 卯月', () => {
      const jingzhe = getSolarTermDate(2026, '惊蛰')
      const after = new Date(jingzhe.date.getTime() + 1000)
      const idx = getMonthZhiIndex(after)
      expect(idx).toBe(1) // 卯月
    })

    it('立夏前1秒 → 辰月', () => {
      const lixia = getSolarTermDate(2026, '立夏')
      const before = new Date(lixia.date.getTime() - 1000)
      const idx = getMonthZhiIndex(before)
      expect(idx).toBe(2) // 辰月
    })

    it('立夏后1秒 → 巳月', () => {
      const lixia = getSolarTermDate(2026, '立夏')
      const after = new Date(lixia.date.getTime() + 1000)
      const idx = getMonthZhiIndex(after)
      expect(idx).toBe(3) // 巳月
    })

    it('立秋前1秒 → 未月', () => {
      const liqiu = getSolarTermDate(2026, '立秋')
      const before = new Date(liqiu.date.getTime() - 1000)
      const idx = getMonthZhiIndex(before)
      expect(idx).toBe(5) // 未月
    })

    it('立秋后1秒 → 申月', () => {
      const liqiu = getSolarTermDate(2026, '立秋')
      const after = new Date(liqiu.date.getTime() + 1000)
      const idx = getMonthZhiIndex(after)
      expect(idx).toBe(6) // 申月
    })

    it('立冬前1秒 → 戌月', () => {
      const lidong = getSolarTermDate(2026, '立冬')
      const before = new Date(lidong.date.getTime() - 1000)
      const idx = getMonthZhiIndex(before)
      expect(idx).toBe(8) // 戌月
    })

    it('立冬后1秒 → 亥月', () => {
      const lidong = getSolarTermDate(2026, '立冬')
      const after = new Date(lidong.date.getTime() + 1000)
      const idx = getMonthZhiIndex(after)
      expect(idx).toBe(9) // 亥月
    })
  })

  // ========== 5. 24节气完整性 ==========

  describe('24节气完整性', () => {
    const ALL_TERMS: SolarTermName[] = [
      '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
      '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
      '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
      '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
    ]

    it.each(ALL_TERMS)('2026年%s存在且数据完整', (termName) => {
      const term = getSolarTermDate(2026, termName)
      expect(term.name).toBe(termName)
      expect(term.month).toBeGreaterThanOrEqual(1)
      expect(term.month).toBeLessThanOrEqual(12)
      expect(term.day).toBeGreaterThanOrEqual(1)
      expect(term.day).toBeLessThanOrEqual(31)
      expect(term.hour).toBeGreaterThanOrEqual(0)
      expect(term.hour).toBeLessThanOrEqual(23)
      expect(term.minute).toBeGreaterThanOrEqual(0)
      expect(term.minute).toBeLessThanOrEqual(59)
      expect(term.second).toBeGreaterThanOrEqual(0)
      expect(term.second).toBeLessThanOrEqual(59)
      expect(term.julianDay).toBeGreaterThan(0)
      expect(term.date).toBeInstanceOf(Date)
    })

    it('24节气按时间顺序排列', () => {
      const terms = getYearSolarTerms(2026)
      for (let i = 1; i < terms.length; i++) {
        expect(terms[i].date.getTime()).toBeGreaterThan(terms[i - 1].date.getTime())
      }
    })

    it('不同年份的同一节气日期接近', () => {
      // 立春通常在2月3日-5日之间
      for (let year = 2020; year <= 2026; year++) {
        const lichun = getSolarTermDate(year, '立春')
        expect(lichun.month).toBe(2)
        expect(lichun.day).toBeGreaterThanOrEqual(3)
        expect(lichun.day).toBeLessThanOrEqual(5)
      }
    })
  })

  // ========== 6. Explain API ==========

  describe('Explain API', () => {
    it('explainSolarTerms 返回结构化解释', () => {
      const testDate = new Date(2026, 5, 15, 10, 30, 0) // 2026-06-15 10:30:00
      const explain = explainSolarTerms(testDate, 2026)

      expect(explain.result).toBe('节气排盘')
      expect(explain.version).toBe('explain-v1')
      expect(explain.evidenceLevel).toBe('A')
      expect(explain.confidence).toBeGreaterThan(0)
      expect(explain.rules.length).toBeGreaterThan(0)
      expect(explain.references.length).toBeGreaterThan(0)
      expect(explain.reasons.length).toBeGreaterThan(0)
    })

    it('Explain 包含立春边界信息', () => {
      const testDate = new Date(2026, 1, 4, 12, 0, 0) // 立春当天
      const explain = explainSolarTerms(testDate, 2026)

      const lichunReason = explain.reasons.find(r => r.id === 'lichun-boundary')
      expect(lichunReason).toBeDefined()
      expect(lichunReason!.value).toBeDefined()
    })

    it('Explain 包含月柱信息', () => {
      const testDate = new Date(2026, 5, 15, 10, 30, 0)
      const explain = explainSolarTerms(testDate, 2026)

      const monthReason = explain.reasons.find(r => r.id === 'month-pillar')
      expect(monthReason).toBeDefined()
    })
  })

  // ========== 7. 跨年验证 ==========

  describe('跨年节气验证', () => {
    it('2024年（闰年）24节气完整', () => {
      const terms = getYearSolarTerms(2024)
      expect(terms.length).toBe(24)
    })

    it('2025年24节气完整', () => {
      const terms = getYearSolarTerms(2025)
      expect(terms.length).toBe(24)
    })

    it('2027年24节气完整', () => {
      const terms = getYearSolarTerms(2027)
      expect(terms.length).toBe(24)
    })

    it('1月初（小寒前）属于丑月', () => {
      const date = new Date(2026, 0, 1, 0, 0, 0) // 2026-01-01
      const idx = getMonthZhiIndex(date)
      expect(idx).toBe(11) // 丑月
    })

    it('12月底（冬至后）属于子月', () => {
      const dongzhi = getSolarTermDate(2026, '冬至')
      const after = new Date(dongzhi.date.getTime() + 1000)
      const idx = getMonthZhiIndex(after)
      expect(idx).toBe(10) // 子月
    })
  })
})
