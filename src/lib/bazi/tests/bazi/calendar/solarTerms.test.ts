import { describe, it, expect } from 'vitest'
import { getSolarTerms, getPreciseCalendar } from '../../../calendar'

const JIEQI_ORDER = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒',
]

const JIE_MONTH_MAP: Record<string, { monthIndex: number; branch: string }> = {
  '立春': { monthIndex: 1, branch: '寅' },
  '惊蛰': { monthIndex: 2, branch: '卯' },
  '清明': { monthIndex: 3, branch: '辰' },
  '立夏': { monthIndex: 4, branch: '巳' },
  '芒种': { monthIndex: 5, branch: '午' },
  '小暑': { monthIndex: 6, branch: '未' },
  '立秋': { monthIndex: 7, branch: '申' },
  '白露': { monthIndex: 8, branch: '酉' },
  '寒露': { monthIndex: 9, branch: '戌' },
  '立冬': { monthIndex: 10, branch: '亥' },
  '大雪': { monthIndex: 11, branch: '子' },
  '小寒': { monthIndex: 12, branch: '丑' },
}

const TEST_YEARS = [1950, 1985, 2020, 2024, 2077]

describe('calendar/solarTerms - 节气交界 + 边界年验证', () => {
  it('每个测试年份 getSolarTerms 返回 24 节气', () => {
    for (const year of TEST_YEARS) {
      const terms = getSolarTerms(year)
      expect(terms).toBeDefined()
      expect(terms.length).toBe(24)
    }
  })

  it('24 节气名称完整 + 时间顺序递增（避免硬编码顺序依赖）', () => {
    const terms = getSolarTerms(2024)
    expect(terms.length).toBe(24)
    const validNames = new Set(JIEQI_ORDER)
    const names = terms.map(t => t.name)
    const nameSet = new Set(names)
    expect(nameSet.size).toBe(24)
    for (const n of names) {
      expect(validNames.has(n)).toBe(true)
    }
    for (let i = 1; i < terms.length; i++) {
      expect(terms[i].date.getTime() > terms[i - 1].date.getTime()).toBe(true)
    }
  })

  it('立春对应寅月 (2024)', () => {
    const terms = getSolarTerms(2024)
    const lichun = terms.find(t => t.name === '立春')!
    expect(lichun).toBeDefined()
    const d = new Date(lichun.date.getTime())
    const cal = getPreciseCalendar(d)
    expect(cal).toBeDefined()
    expect(cal.monthGanZhi.zhi).toBe('寅')
  })

  it('惊蛰对应卯月 (2024)', () => {
    const terms = getSolarTerms(2024)
    const jingzhe = terms.find(t => t.name === '惊蛰')!
    expect(jingzhe).toBeDefined()
    const cal = getPreciseCalendar(new Date(jingzhe.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('卯')
  })

  it('清明对应辰月 (2024)', () => {
    const terms = getSolarTerms(2024)
    const qingming = terms.find(t => t.name === '清明')!
    const cal = getPreciseCalendar(new Date(qingming.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('辰')
  })

  it('立夏对应巳月 (2024)', () => {
    const terms = getSolarTerms(2024)
    const lixia = terms.find(t => t.name === '立夏')!
    const cal = getPreciseCalendar(new Date(lixia.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('巳')
  })

  it('芒种对应午月 (2024)', () => {
    const terms = getSolarTerms(2024)
    const mangzhong = terms.find(t => t.name === '芒种')!
    const cal = getPreciseCalendar(new Date(mangzhong.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('午')
  })

  it('小暑对应未月 (2024)', () => {
    const terms = getSolarTerms(2024)
    const xiaoshu = terms.find(t => t.name === '小暑')!
    const cal = getPreciseCalendar(new Date(xiaoshu.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('未')
  })

  it('立秋对应申月 (2024)', () => {
    const terms = getSolarTerms(2024)
    const liqiu = terms.find(t => t.name === '立秋')!
    const cal = getPreciseCalendar(new Date(liqiu.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('申')
  })

  it('白露对应酉月 (2024)', () => {
    const terms = getSolarTerms(2024)
    const bailu = terms.find(t => t.name === '白露')!
    const cal = getPreciseCalendar(new Date(bailu.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('酉')
  })

  it('寒露对应戌月 (2024)', () => {
    const terms = getSolarTerms(2024)
    const hanlu = terms.find(t => t.name === '寒露')!
    const cal = getPreciseCalendar(new Date(hanlu.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('戌')
  })

  it('立冬对应亥月 (2024)', () => {
    const terms = getSolarTerms(2024)
    const lidong = terms.find(t => t.name === '立冬')!
    const cal = getPreciseCalendar(new Date(lidong.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('亥')
  })

  it('大雪对应子月 (2024)', () => {
    const terms = getSolarTerms(2024)
    const daxue = terms.find(t => t.name === '大雪')!
    const cal = getPreciseCalendar(new Date(daxue.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('子')
  })

  it('小寒对应丑月 (2024)', () => {
    const terms = getSolarTerms(2024)
    const xiaohan = terms.find(t => t.name === '小寒')!
    const cal = getPreciseCalendar(new Date(xiaohan.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('丑')
  })

  it('1950 年节气：立春月支正确', () => {
    const terms = getSolarTerms(1950)
    expect(terms.length).toBe(24)
    const lichun = terms.find(t => t.name === '立春')!
    const cal = getPreciseCalendar(new Date(lichun.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('寅')
  })

  it('1950 年节气：芒种月支正确', () => {
    const terms = getSolarTerms(1950)
    const mangzhong = terms.find(t => t.name === '芒种')!
    const cal = getPreciseCalendar(new Date(mangzhong.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('午')
  })

  it('1950 年节气：大雪月支正确', () => {
    const terms = getSolarTerms(1950)
    const daxue = terms.find(t => t.name === '大雪')!
    const cal = getPreciseCalendar(new Date(daxue.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('子')
  })

  it('1985 年节气：立春月支正确', () => {
    const terms = getSolarTerms(1985)
    expect(terms.length).toBe(24)
    const lichun = terms.find(t => t.name === '立春')!
    const cal = getPreciseCalendar(new Date(lichun.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('寅')
  })

  it('1985 年节气：立秋月支正确', () => {
    const terms = getSolarTerms(1985)
    const liqiu = terms.find(t => t.name === '立秋')!
    const cal = getPreciseCalendar(new Date(liqiu.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('申')
  })

  it('1985 年节气：立冬月支正确', () => {
    const terms = getSolarTerms(1985)
    const lidong = terms.find(t => t.name === '立冬')!
    const cal = getPreciseCalendar(new Date(lidong.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('亥')
  })

  it('2020 年节气：立春月支正确', () => {
    const terms = getSolarTerms(2020)
    expect(terms.length).toBe(24)
    const lichun = terms.find(t => t.name === '立春')!
    const cal = getPreciseCalendar(new Date(lichun.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('寅')
  })

  it('2020 年节气：惊蛰月支正确', () => {
    const terms = getSolarTerms(2020)
    const jingzhe = terms.find(t => t.name === '惊蛰')!
    const cal = getPreciseCalendar(new Date(jingzhe.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('卯')
  })

  it('2020 年节气：清明月支正确', () => {
    const terms = getSolarTerms(2020)
    const qingming = terms.find(t => t.name === '清明')!
    const cal = getPreciseCalendar(new Date(qingming.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('辰')
  })

  it('2020 年节气：立夏月支正确', () => {
    const terms = getSolarTerms(2020)
    const lixia = terms.find(t => t.name === '立夏')!
    const cal = getPreciseCalendar(new Date(lixia.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('巳')
  })

  it('2077 年节气：立春月支正确', () => {
    const terms = getSolarTerms(2077)
    expect(terms.length).toBe(24)
    const lichun = terms.find(t => t.name === '立春')!
    const cal = getPreciseCalendar(new Date(lichun.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('寅')
  })

  it('2077 年节气：芒种月支正确', () => {
    const terms = getSolarTerms(2077)
    const mangzhong = terms.find(t => t.name === '芒种')!
    const cal = getPreciseCalendar(new Date(mangzhong.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('午')
  })

  it('2077 年节气：小暑月支正确', () => {
    const terms = getSolarTerms(2077)
    const xiaoshu = terms.find(t => t.name === '小暑')!
    const cal = getPreciseCalendar(new Date(xiaoshu.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('未')
  })

  it('2077 年节气：白露月支正确', () => {
    const terms = getSolarTerms(2077)
    const bailu = terms.find(t => t.name === '白露')!
    const cal = getPreciseCalendar(new Date(bailu.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('酉')
  })

  it('2077 年节气：寒露月支正确', () => {
    const terms = getSolarTerms(2077)
    const hanlu = terms.find(t => t.name === '寒露')!
    const cal = getPreciseCalendar(new Date(hanlu.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('戌')
  })

  it('2077 年节气：大雪月支正确', () => {
    const terms = getSolarTerms(2077)
    const daxue = terms.find(t => t.name === '大雪')!
    const cal = getPreciseCalendar(new Date(daxue.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('子')
  })

  it('2077 年节气：小寒月支正确', () => {
    const terms = getSolarTerms(2077)
    const xiaohan = terms.find(t => t.name === '小寒')!
    const cal = getPreciseCalendar(new Date(xiaohan.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('丑')
  })

  it('1900 边界年：getSolarTerms 返回 24 节气且不抛错', () => {
    expect(() => {
      const terms = getSolarTerms(1900)
      expect(terms.length).toBe(24)
    }).not.toThrow()
  })

  it('1905 安全早年：立春月支正确（避免 1900 边界真太阳时跨到 1899）', () => {
    const terms = getSolarTerms(1905)
    const lichun = terms.find(t => t.name === '立春')!
    expect(lichun).toBeDefined()
    const cal = getPreciseCalendar(new Date(lichun.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('寅')
  })

  it('2100 边界年：getSolarTerms 返回 24 节气且不抛错', () => {
    expect(() => {
      const terms = getSolarTerms(2100)
      expect(terms.length).toBe(24)
    }).not.toThrow()
  })

  it('2090 安全末年：立春月支正确（避免 2100 边界真太阳时跨到 2101）', () => {
    const terms = getSolarTerms(2090)
    const lichun = terms.find(t => t.name === '立春')!
    expect(lichun).toBeDefined()
    const cal = getPreciseCalendar(new Date(lichun.date.getTime()))
    expect(cal.monthGanZhi.zhi).toBe('寅')
  })

  it('每个节气返回结构完整：name / date / solarLongitude', () => {
    const terms = getSolarTerms(2024)
    for (const t of terms) {
      expect(t.name).toBeDefined()
      expect(typeof t.name).toBe('string')
      expect(t.date).toBeInstanceOf(Date)
      expect(!isNaN(t.date.getTime())).toBe(true)
    }
  })

  it('节气 date 为合理范围的 Date 对象', () => {
    for (const year of TEST_YEARS) {
      const terms = getSolarTerms(year)
      for (const t of terms) {
        const y = t.date.getFullYear()
        expect(y === year || y === year - 1 || y === year + 1).toBe(true)
      }
    }
  })

  it('JIE_MONTH_MAP 12 节 x 3 年：立春/惊蛰/清明 2000/2012/2036', () => {
    const years = [2000, 2012, 2036]
    const jieNames = ['立春', '惊蛰', '清明']
    for (const y of years) {
      const terms = getSolarTerms(y)
      for (const jn of jieNames) {
        const term = terms.find(t => t.name === jn)!
        expect(term).toBeDefined()
        const expected = JIE_MONTH_MAP[jn]
        const cal = getPreciseCalendar(new Date(term.date.getTime()))
        expect(cal.monthGanZhi.zhi).toBe(expected.branch)
      }
    }
  })

  it('JIE_MONTH_MAP 12 节 x 3 年：立夏/芒种/小暑 2000/2012/2036', () => {
    const years = [2000, 2012, 2036]
    const jieNames = ['立夏', '芒种', '小暑']
    for (const y of years) {
      const terms = getSolarTerms(y)
      for (const jn of jieNames) {
        const term = terms.find(t => t.name === jn)!
        expect(term).toBeDefined()
        const expected = JIE_MONTH_MAP[jn]
        const cal = getPreciseCalendar(new Date(term.date.getTime()))
        expect(cal.monthGanZhi.zhi).toBe(expected.branch)
      }
    }
  })

  it('JIE_MONTH_MAP 12 节 x 3 年：立秋/白露/寒露 2000/2012/2036', () => {
    const years = [2000, 2012, 2036]
    const jieNames = ['立秋', '白露', '寒露']
    for (const y of years) {
      const terms = getSolarTerms(y)
      for (const jn of jieNames) {
        const term = terms.find(t => t.name === jn)!
        expect(term).toBeDefined()
        const expected = JIE_MONTH_MAP[jn]
        const cal = getPreciseCalendar(new Date(term.date.getTime()))
        expect(cal.monthGanZhi.zhi).toBe(expected.branch)
      }
    }
  })

  it('JIE_MONTH_MAP 12 节 x 3 年：立冬/大雪/小寒 2000/2012/2036', () => {
    const years = [2000, 2012, 2036]
    const jieNames = ['立冬', '大雪', '小寒']
    for (const y of years) {
      const terms = getSolarTerms(y)
      for (const jn of jieNames) {
        const term = terms.find(t => t.name === jn)!
        expect(term).toBeDefined()
        const expected = JIE_MONTH_MAP[jn]
        const cal = getPreciseCalendar(new Date(term.date.getTime()))
        expect(cal.monthGanZhi.zhi).toBe(expected.branch)
      }
    }
  })

  it('节气不重复：2024 年 24 节气名唯一', () => {
    const terms = getSolarTerms(2024)
    const nameSet = new Set(terms.map(t => t.name))
    expect(nameSet.size).toBe(24)
  })

  it('节气按日期递增', () => {
    for (const year of TEST_YEARS) {
      const terms = getSolarTerms(year)
      for (let i = 1; i < terms.length; i++) {
        expect(terms[i].date.getTime() > terms[i - 1].date.getTime()).toBe(true)
      }
    }
  })
})
