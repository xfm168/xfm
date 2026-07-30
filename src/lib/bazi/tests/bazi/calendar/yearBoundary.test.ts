import { describe, it, expect } from 'vitest'
import { getSolarTerms, getPreciseCalendar } from '../../../calendar'
import { createPreciseCalendar } from '../../../preciseCalendar'

const SAFE_YEAR_1 = 1905
const SAFE_YEAR_2 = 2090

describe('calendar/yearBoundary - 边界年 + 特殊年验证', () => {
  it('1900 边界年：getSolarTerms 返回 24 节气', () => {
    const terms = getSolarTerms(1900)
    expect(terms.length).toBe(24)
  })

  it('1900 边界年：getSolarTerms 立春返回且有正确时间戳', () => {
    const terms = getSolarTerms(1900)
    const lichun = terms.find(t => t.name === '立春')!
    expect(lichun).toBeDefined()
    expect(lichun.date instanceof Date).toBe(true)
    expect(lichun.date.getFullYear()).toBe(1900)
  })

  it('1905 安全早年：立秋月支 = 申', () => {
    const terms = getSolarTerms(1905)
    const liqiu = terms.find(t => t.name === '立秋')!
    expect(liqiu).toBeDefined()
    const cal = getPreciseCalendar(new Date(liqiu.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('申')
  })

  it('1905 安全早年：createPreciseCalendar 不抛错 (1905-06-15)', () => {
    expect(() => {
      createPreciseCalendar(new Date(SAFE_YEAR_1, 5, 15, 12, 0, 0))
    }).not.toThrow()
  })

  it('1905 安全早年：立春月支 = 寅', () => {
    const terms = getSolarTerms(SAFE_YEAR_1)
    const lichun = terms.find(t => t.name === '立春')!
    expect(lichun).toBeDefined()
    const cal = getPreciseCalendar(new Date(lichun.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('寅')
  })

  it('2100 边界年：getSolarTerms 返回 24 节气', () => {
    const terms = getSolarTerms(2100)
    expect(terms.length).toBe(24)
  })

  it('2100 边界年：getSolarTerms 大雪返回且有正确时间戳', () => {
    const terms = getSolarTerms(2100)
    const daxue = terms.find(t => t.name === '大雪')!
    expect(daxue).toBeDefined()
    expect(daxue.date instanceof Date).toBe(true)
    expect(daxue.date.getFullYear()).toBe(2100)
  })

  it('2090 安全末年：createPreciseCalendar 不抛错 (2090-06-15)', () => {
    expect(() => {
      createPreciseCalendar(new Date(SAFE_YEAR_2, 5, 15, 12, 0, 0))
    }).not.toThrow()
  })

  it('2090 安全末年：大雪月支 = 子', () => {
    const terms = getSolarTerms(SAFE_YEAR_2)
    const daxue = terms.find(t => t.name === '大雪')!
    expect(daxue).toBeDefined()
    const cal = getPreciseCalendar(new Date(daxue.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('子')
  })

  it('1949 建国年：getSolarTerms 返回 24 节气', () => {
    const terms = getSolarTerms(1949)
    expect(terms.length).toBe(24)
  })

  it('1949 建国年：10-01 createPreciseCalendar 返回结构完整', () => {
    const cal = createPreciseCalendar(new Date(1949, 9, 1, 15, 0, 0))
    expect(cal).toBeDefined()
    expect(cal.yearGanZhi.ganZhi.length).toBe(2)
    expect(cal.monthGanZhi.ganZhi.length).toBe(2)
    expect(cal.dayGanZhi.ganZhi.length).toBe(2)
    expect(cal.hours.length).toBeGreaterThanOrEqual(12)
  })

  it('1949 建国年：立秋月支 = 申', () => {
    const terms = getSolarTerms(1949)
    const liqiu = terms.find(t => t.name === '立秋')!
    expect(liqiu).toBeDefined()
    const cal = getPreciseCalendar(new Date(liqiu.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('申')
  })

  it('2000 闰年：getSolarTerms 返回 24 节气', () => {
    const terms = getSolarTerms(2000)
    expect(terms.length).toBe(24)
  })

  it('2000 闰年：02-29 createPreciseCalendar 不抛错（闰年日）', () => {
    expect(() => {
      createPreciseCalendar(new Date(2000, 1, 29, 12, 0, 0))
    }).not.toThrow()
  })

  it('2000 闰年：02-29 农历结构完整', () => {
    const cal = createPreciseCalendar(new Date(2000, 1, 29, 12, 0, 0))
    expect(cal.lunar.month).toBeGreaterThanOrEqual(1)
    expect(cal.lunar.month).toBeLessThanOrEqual(12)
    expect(cal.lunar.day).toBeGreaterThanOrEqual(1)
    expect(cal.lunar.day).toBeLessThanOrEqual(30)
    expect(typeof cal.lunar.monthText).toBe('string')
    expect(cal.lunar.monthText.length).toBeGreaterThan(0)
  })

  it('2000 闰年：惊蛰月支 = 卯', () => {
    const terms = getSolarTerms(2000)
    const jingzhe = terms.find(t => t.name === '惊蛰')!
    expect(jingzhe).toBeDefined()
    const cal = getPreciseCalendar(new Date(jingzhe.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('卯')
  })

  it('边界年 + 特殊年：24 节气名完整唯一', () => {
    const years = [1900, 1949, 2000, 2100]
    const validNames = new Set([
      '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
      '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
      '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
      '立冬', '小雪', '大雪', '冬至', '小寒', '大寒',
    ])
    for (const y of years) {
      const terms = getSolarTerms(y)
      const names = new Set(terms.map(t => t.name))
      expect(names.size).toBe(24)
      for (const n of names) {
        expect(validNames.has(n)).toBe(true)
      }
    }
  })

  it('边界年：1900 年节气日期按顺序排列', () => {
    const terms = getSolarTerms(1900)
    for (let i = 1; i < terms.length; i++) {
      expect(terms[i].date.getTime() > terms[i - 1].date.getTime()).toBe(true)
    }
  })

  it('边界年：2100 年节气日期按顺序排列', () => {
    const terms = getSolarTerms(2100)
    for (let i = 1; i < terms.length; i++) {
      expect(terms[i].date.getTime() > terms[i - 1].date.getTime()).toBe(true)
    }
  })

  it('特殊年 createPreciseCalendar：weekday 为有效中文星期', () => {
    const validWeekdays = new Set(['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'])
    const dates = [
      new Date(SAFE_YEAR_1, 5, 15, 12, 0, 0),
      new Date(1949, 9, 1, 12, 0, 0),
      new Date(2000, 1, 29, 12, 0, 0),
      new Date(SAFE_YEAR_2, 5, 15, 12, 0, 0),
    ]
    for (const d of dates) {
      const cal = createPreciseCalendar(d)
      expect(validWeekdays.has(cal.weekday)).toBe(true)
    }
  })

  it('特殊年 createPreciseCalendar：干支字段长度为 2（天干+地支）', () => {
    const dates = [
      new Date(SAFE_YEAR_1, 5, 15, 12, 0, 0),
      new Date(1949, 5, 15, 12, 0, 0),
      new Date(2000, 5, 15, 12, 0, 0),
      new Date(SAFE_YEAR_2, 5, 15, 12, 0, 0),
    ]
    for (const d of dates) {
      const cal = createPreciseCalendar(d)
      expect(cal.yearGanZhi.ganZhi.length).toBe(2)
      expect(cal.monthGanZhi.ganZhi.length).toBe(2)
      expect(cal.dayGanZhi.ganZhi.length).toBe(2)
    }
  })
})
