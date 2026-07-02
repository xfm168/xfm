/**
 * P0-④ 四柱推算 单元测试
 *
 * 验证完整排盘链：
 * 1. 年柱（立春分年）
 * 2. 月柱（节气换月 + 五虎遁）
 * 3. 日柱（JDN算法）
 * 4. 时柱（时辰索引 + 五鼠遁）
 *
 * 集成验证：
 * - 真太阳时 → 子时换日 → 四柱推算 完整链路
 * - 与权威数据对照（寿星天文历）
 */

import { describe, it, expect } from 'vitest'
import { calculateBaZi } from './calculator'

describe('P0-④ 四柱推算', () => {
  describe('年柱（立春分年）', () => {
    it('立春前出生属上一年', () => {
      const chart = calculateBaZi({
        birthDate: '2024-02-03',
        birthTime: '23:59',
        gender: 'male',
      })
      expect(chart.sixLines.year.gan + chart.sixLines.year.zhi).toBe('癸卯')
    })

    it('立春后出生属本年', () => {
      const chart = calculateBaZi({
        birthDate: '2024-02-05',
        birthTime: '10:00',
        gender: 'male',
      })
      expect(chart.sixLines.year.gan + chart.sixLines.year.zhi).toBe('甲辰')
    })
  })

  describe('月柱（节气换月）', () => {
    it('立春后属寅月', () => {
      const chart = calculateBaZi({
        birthDate: '2024-02-05',
        birthTime: '10:00',
        gender: 'male',
      })
      expect(chart.sixLines.month.zhi).toBe('寅')
    })

    it('惊蛰后属卯月', () => {
      const chart = calculateBaZi({
        birthDate: '2024-03-06',
        birthTime: '10:00',
        gender: 'male',
      })
      expect(chart.sixLines.month.zhi).toBe('卯')
    })

    it('大寒（中气）不换月，仍属丑月', () => {
      const chart = calculateBaZi({
        birthDate: '2024-01-20',
        birthTime: '10:00',
        gender: 'male',
      })
      expect(chart.sixLines.month.zhi).toBe('丑')
    })
  })

  describe('日柱（JDN算法）', () => {
    it('2000-01-01 日柱应为戊午', () => {
      const chart = calculateBaZi({
        birthDate: '2000-01-01',
        birthTime: '12:00',
        gender: 'male',
      })
      expect(chart.sixLines.day.gan + chart.sixLines.day.zhi).toBe('戊午')
    })

    it('1990-01-15 日柱应为庚辰', () => {
      const chart = calculateBaZi({
        birthDate: '1990-01-15',
        birthTime: '12:00',
        gender: 'male',
      })
      expect(chart.sixLines.day.gan + chart.sixLines.day.zhi).toBe('庚辰')
    })
  })

  describe('时柱（五鼠遁）', () => {
    it('甲日 子时 → 甲子', () => {
      const chart = calculateBaZi({
        birthDate: '2024-01-01',
        birthTime: '00:30',
        gender: 'male',
        ziShiStrategy: 'early',
      })
      expect(chart.sixLines.day.gan).toBe('甲')
      expect(chart.sixLines.hour.gan + chart.sixLines.hour.zhi).toBe('甲子')
    })

    it('庚日 子时 → 丙子', () => {
      const chart = calculateBaZi({
        birthDate: '2024-06-14',
        birthTime: '23:30',
        gender: 'male',
        ziShiStrategy: 'early',
      })
      expect(chart.sixLines.day.gan).toBe('庚')
      expect(chart.sixLines.hour.gan + chart.sixLines.hour.zhi).toBe('丙子')
    })

    it('辛日 子时 → 戊子', () => {
      const chart = calculateBaZi({
        birthDate: '2024-06-15',
        birthTime: '23:30',
        gender: 'male',
      })
      expect(chart.sixLines.day.gan).toBe('辛')
      expect(chart.sixLines.hour.gan + chart.sixLines.hour.zhi).toBe('戊子')
    })
  })

  describe('完整排盘链（真太阳时 → 子时换日 → 四柱）', () => {
    it('晚子时换日导致日柱变化', () => {
      const lateChart = calculateBaZi({
        birthDate: '2026-06-15',
        birthTime: '23:30',
        gender: 'male',
      })
      const earlyChart = calculateBaZi({
        birthDate: '2026-06-15',
        birthTime: '00:30',
        gender: 'male',
      })
      expect(lateChart.sixLines.day.gan + lateChart.sixLines.day.zhi).toBe('辛酉')
      expect(earlyChart.sixLines.day.gan + earlyChart.sixLines.day.zhi).toBe('庚申')
    })

    it('真太阳时校正可能改变时辰', () => {
      const chart = calculateBaZi({
        birthDate: '2024-06-15',
        birthTime: '08:58',
        gender: 'male',
      }, { useSolarTime: true, longitude: 121.2 })
      expect(chart.sixLines.hour.zhi).toBe('巳')
    })
  })

  describe('金标准命例验证', () => {
    it('GD-B001（1990-01-15 08:30 男）', () => {
      const chart = calculateBaZi({
        birthDate: '1990-01-15',
        birthTime: '08:30',
        gender: 'male',
      })
      expect(chart.sixLines.year.gan + chart.sixLines.year.zhi).toBe('己巳')
      expect(chart.sixLines.month.gan + chart.sixLines.month.zhi).toBe('丁丑')
      expect(chart.sixLines.day.gan + chart.sixLines.day.zhi).toBe('庚辰')
      expect(chart.sixLines.hour.gan + chart.sixLines.hour.zhi).toBe('庚辰')
    })

    it('GD-B002（2000-01-01 12:00 男）基准日', () => {
      const chart = calculateBaZi({
        birthDate: '2000-01-01',
        birthTime: '12:00',
        gender: 'male',
      })
      expect(chart.sixLines.year.gan + chart.sixLines.year.zhi).toBe('己卯')
      expect(chart.sixLines.month.gan + chart.sixLines.month.zhi).toBe('丁丑')
      expect(chart.sixLines.day.gan + chart.sixLines.day.zhi).toBe('戊午')
      expect(chart.sixLines.hour.gan + chart.sixLines.hour.zhi).toBe('戊午')
    })

    it('GD-B003（2024-02-04 16:30 女）立春换年', () => {
      const chart = calculateBaZi({
        birthDate: '2024-02-04',
        birthTime: '16:30',
        gender: 'female',
      })
      expect(chart.sixLines.year.gan + chart.sixLines.year.zhi).toBe('甲辰')
      expect(chart.sixLines.month.gan + chart.sixLines.month.zhi).toBe('丙寅')
    })

    it('GD-B004（2024-02-03 23:59 男）立春前属癸卯', () => {
      const chart = calculateBaZi({
        birthDate: '2024-02-03',
        birthTime: '23:59',
        gender: 'male',
      })
      expect(chart.sixLines.year.gan + chart.sixLines.year.zhi).toBe('癸卯')
    })

    it('GD-B005（2026-06-15 23:30 晚子时）', () => {
      const chart = calculateBaZi({
        birthDate: '2026-06-15',
        birthTime: '23:30',
        gender: 'male',
      })
      expect(chart.sixLines.day.gan + chart.sixLines.day.zhi).toBe('辛酉')
      expect(chart.sixLines.hour.gan + chart.sixLines.hour.zhi).toBe('戊子')
    })

    it('GD-B006（2026-06-16 00:30 早子时）', () => {
      const chart = calculateBaZi({
        birthDate: '2026-06-16',
        birthTime: '00:30',
        gender: 'male',
        ziShiStrategy: 'early',
      })
      expect(chart.sixLines.day.gan + chart.sixLines.day.zhi).toBe('辛酉')
      expect(chart.sixLines.hour.gan + chart.sixLines.hour.zhi).toBe('戊子')
    })

    it('GD-B007（2024-03-05 11:00 惊蛰换月）', () => {
      const chart = calculateBaZi({
        birthDate: '2024-03-05',
        birthTime: '11:00',
        gender: 'male',
      })
      expect(chart.sixLines.month.gan + chart.sixLines.month.zhi).toBe('丁卯')
    })

    it('GD-B008（2024-06-14 23:30 庚日子时）', () => {
      const chart = calculateBaZi({
        birthDate: '2024-06-14',
        birthTime: '23:30',
        gender: 'male',
        ziShiStrategy: 'early',
      })
      expect(chart.sixLines.day.gan).toBe('庚')
      expect(chart.sixLines.hour.gan + chart.sixLines.hour.zhi).toBe('丙子')
    })
  })
})
