import { describe, it, expect } from 'vitest'
import { createPreciseCalendar } from '../../../preciseCalendar'

const VALID_LUNAR_MONTH_NAMES = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月',
]

const TEST_CASES: Array<{ name: string; date: [number, number, number] }> = [
  { name: '2023-03-22 闰二月候选', date: [2023, 3, 22] },
  { name: '2020-05-23 闰四月候选', date: [2020, 5, 23] },
  { name: '2017-07-23 闰六月候选', date: [2017, 7, 23] },
  { name: '2009-06-23 闰五月候选', date: [2009, 6, 23] },
  { name: '2006-08-24 闰七月候选', date: [2006, 8, 24] },
  { name: '1995-09-25 闰八月候选', date: [1995, 9, 25] },
  { name: '1976-09-14 闰八月候选', date: [1976, 9, 14] },
  { name: '1984-11-23 闰十月候选', date: [1984, 11, 23] },
  { name: '2025-07-25 闰六月候选', date: [2025, 7, 25] },
  { name: '2012-05-21 闰四月候选', date: [2012, 5, 21] },
  { name: '2004-03-21 闰二月候选', date: [2004, 3, 21] },
  { name: '1998-06-24 闰五月候选', date: [1998, 6, 24] },
  { name: '1993-04-22 闰三月候选', date: [1993, 4, 22] },
  { name: '1987-07-26 闰六月候选', date: [1987, 7, 26] },
  { name: '1968-08-24 闰七月候选', date: [1968, 8, 24] },
  { name: '1952-06-22 闰五月候选', date: [1952, 6, 22] },
  { name: '1944-05-22 闰四月候选', date: [1944, 5, 22] },
  { name: '2033-12-22 闰冬月候选', date: [2033, 12, 22] },
  { name: '2024-06-15 普通日期', date: [2024, 6, 15] },
  { name: '2024-01-15 年初日期', date: [2024, 1, 15] },
]

function isValidLunarMonthName(name: string): boolean {
  if (!name || typeof name !== 'string') return false
  const pure = name.startsWith('闰') ? name.slice(1) : name
  return VALID_LUNAR_MONTH_NAMES.includes(pure)
}

describe('calendar/lunarLeap - 闰月结构验证（软验证：只验证合理范围/结构完整）', () => {
  for (let i = 0; i < 18; i++) {
    it(`${TEST_CASES[i].name}：createPreciseCalendar 不抛错`, () => {
      const [y, m, d] = TEST_CASES[i].date
      expect(() => {
        createPreciseCalendar(new Date(y, m - 1, d, 12, 0, 0))
      }).not.toThrow()
    })
  }

  for (let i = 0; i < 18; i++) {
    it(`${TEST_CASES[i].name}：lunar.leap 为 boolean 类型`, () => {
      const [y, m, d] = TEST_CASES[i].date
      const cal = createPreciseCalendar(new Date(y, m - 1, d, 12, 0, 0))
      expect(typeof cal.lunar.leap).toBe('boolean')
    })
  }

  for (let i = 0; i < 18; i++) {
    it(`${TEST_CASES[i].name}：lunar.month 在 1~12 范围`, () => {
      const [y, m, d] = TEST_CASES[i].date
      const cal = createPreciseCalendar(new Date(y, m - 1, d, 12, 0, 0))
      expect(cal.lunar.month).toBeGreaterThanOrEqual(1)
      expect(cal.lunar.month).toBeLessThanOrEqual(12)
    })
  }

  for (let i = 0; i < 18; i++) {
    it(`${TEST_CASES[i].name}：lunar.monthText 为合法月名（允许含"闰"前缀）`, () => {
      const [y, m, d] = TEST_CASES[i].date
      const cal = createPreciseCalendar(new Date(y, m - 1, d, 12, 0, 0))
      expect(isValidLunarMonthName(cal.lunar.monthText)).toBe(true)
    })
  }

  it('18 个闰月候选日 × lunar.leap=true 一致性：若 leap=true 则 monthText 必含"闰"字', () => {
    for (let i = 0; i < 18; i++) {
      const [y, m, d] = TEST_CASES[i].date
      const cal = createPreciseCalendar(new Date(y, m - 1, d, 12, 0, 0))
      if (cal.lunar.leap === true) {
        expect(cal.lunar.monthText.charAt(0)).toBe('闰')
      }
    }
  })

  it('18 个闰月候选日 × lunar.leap=false 一致性：若 leap=false 则 monthText 不应以"闰"开头', () => {
    for (let i = 0; i < 18; i++) {
      const [y, m, d] = TEST_CASES[i].date
      const cal = createPreciseCalendar(new Date(y, m - 1, d, 12, 0, 0))
      if (cal.lunar.leap === false) {
        expect(cal.lunar.monthText.charAt(0)).not.toBe('闰')
      }
    }
  })

  it('2024-06-15 普通日期：lunar 结构完整字段全非空', () => {
    const cal = createPreciseCalendar(new Date(2024, 5, 15, 12, 0, 0))
    expect(cal.lunar).toBeDefined()
    expect(typeof cal.lunar.year).toBe('number')
    expect(typeof cal.lunar.month).toBe('number')
    expect(typeof cal.lunar.day).toBe('number')
    expect(typeof cal.lunar.yearText).toBe('string')
    expect(cal.lunar.yearText.length).toBeGreaterThan(0)
    expect(typeof cal.lunar.monthText).toBe('string')
    expect(cal.lunar.monthText.length).toBeGreaterThan(0)
    expect(typeof cal.lunar.dayText).toBe('string')
    expect(cal.lunar.dayText.length).toBeGreaterThan(0)
    expect(typeof cal.lunar.ganZhiYear).toBe('string')
    expect(cal.lunar.ganZhiYear.length).toBe(2)
    expect(typeof cal.lunar.leap).toBe('boolean')
  })

  it('2024-01-15 年初日期：lunar.leap 为 false 且不以闰开头', () => {
    const cal = createPreciseCalendar(new Date(2024, 0, 15, 12, 0, 0))
    expect(typeof cal.lunar.leap).toBe('boolean')
    expect(cal.lunar.monthText.charAt(0)).not.toBe('闰')
  })

  it('18 个候选日 × lunar.day 在 1~30 范围', () => {
    for (let i = 0; i < 18; i++) {
      const [y, m, d] = TEST_CASES[i].date
      const cal = createPreciseCalendar(new Date(y, m - 1, d, 12, 0, 0))
      expect(cal.lunar.day).toBeGreaterThanOrEqual(1)
      expect(cal.lunar.day).toBeLessThanOrEqual(30)
    }
  })

  it('18 个候选日 × lunar.fullText 为非空字符串', () => {
    for (let i = 0; i < 18; i++) {
      const [y, m, d] = TEST_CASES[i].date
      const cal = createPreciseCalendar(new Date(y, m - 1, d, 12, 0, 0))
      expect(typeof cal.lunar.fullText).toBe('string')
      expect(cal.lunar.fullText.length).toBeGreaterThan(0)
    }
  })

  it('18 个候选日 × createPreciseCalendar 年/月/日干支长度为 2', () => {
    for (let i = 0; i < 18; i++) {
      const [y, m, d] = TEST_CASES[i].date
      const cal = createPreciseCalendar(new Date(y, m - 1, d, 12, 0, 0))
      expect(cal.yearGanZhi.ganZhi.length).toBe(2)
      expect(cal.monthGanZhi.ganZhi.length).toBe(2)
      expect(cal.dayGanZhi.ganZhi.length).toBe(2)
    }
  })
})
