/**
 * 四柱排盘测试（玄风门 V4.4）
 *
 * 覆盖：公历排盘、农历排盘、子时策略、闰月、十神、纳音、藏干、五行统计
 * 以及经典命例验证（150 例）。
 */

import { describe, test, expect } from 'vitest'
import {
  calculateBaZi,
  getDayGanZhi,
  getYearGanZhi,
  getMonthGanZhi,
  getHourGanZhi,
} from '../calculator'
import { calculateShenShi, getRelatedShens } from '../shishen'
import { getNaYin } from '../nayin'
import { getChangSheng } from '../changsheng'
import { CANG_GAN } from '@/lib/core'
import { classicCases } from '../testData/classicCases'
import { validateCase, validateAllCases } from '../testData/caseValidator'
import type { BirthInfo } from '../types'

// ─── 辅助函数 ───

function makeBirthInfo(date: string, time: string, gender: 'male' | 'female' = 'male'): BirthInfo {
  return { birthDate: date, birthTime: time, gender }
}

// ─── 四柱排盘 ───

describe('四柱排盘', () => {

  describe('公历日期排盘', () => {
    test('2000-01-01 12:00 排盘结构完整', () => {
      const chart = calculateBaZi(makeBirthInfo('2000-01-01', '12:00'))
      expect(chart).toBeDefined()
      expect(chart.sixLines).toBeDefined()
      expect(chart.sixLines.year).toBeDefined()
      expect(chart.sixLines.month).toBeDefined()
      expect(chart.sixLines.day).toBeDefined()
      expect(chart.sixLines.hour).toBeDefined()
      // 每柱都有 gan/zhi/element/yinYang/naYin
      for (const pillar of [chart.sixLines.year, chart.sixLines.month, chart.sixLines.day, chart.sixLines.hour]) {
        expect(pillar.gan).toBeTruthy()
        expect(pillar.zhi).toBeTruthy()
        expect(pillar.element).toBeTruthy()
        expect(pillar.yinYang).toBeTruthy()
        expect(pillar.naYin).toBeTruthy()
      }
    })

    test('2000-01-01 日柱为戊午（JDN 基准日）', () => {
      // 2000-01-01 的 JDN = 2451545 = BASE_JDN_2000，索引 = BASE_INDEX_2000 = 54 = 戊午
      const chart = calculateBaZi(makeBirthInfo('2000-01-01', '12:00'))
      expect(chart.sixLines.day.gan).toBe('戊')
      expect(chart.sixLines.day.zhi).toBe('午')
    })

    test('立春前年柱属于上一年', () => {
      // 2000-01-01 在立春前，年柱应为 1999 = 己卯
      const chart = calculateBaZi(makeBirthInfo('2000-01-01', '12:00'))
      expect(chart.sixLines.year.gan).toBe('己')
      expect(chart.sixLines.year.zhi).toBe('卯')
    })

    test('立春后年柱属于当年', () => {
      // 2000-03-01 在立春后，年柱应为 2000 = 庚辰
      const chart = calculateBaZi(makeBirthInfo('2000-03-01', '12:00'))
      expect(chart.sixLines.year.gan).toBe('庚')
      expect(chart.sixLines.year.zhi).toBe('辰')
    })

    test('年柱天干地支阴阳属性一致', () => {
      const chart = calculateBaZi(makeBirthInfo('1990-06-15', '10:00'))
      // 甲=阳, 乙=阴, ...；子=阳, 丑=阴, ...
      const gan = chart.sixLines.year.gan
      const zhi = chart.sixLines.year.zhi
      const ganIdx = '甲乙丙丁戊己庚辛壬癸'.indexOf(gan)
      const zhiIdx = '子丑寅卯辰巳午未申酉戌亥'.indexOf(zhi)
      // 天干和地支的阴阳奇偶性必须一致（六十甲子规则）
      expect(ganIdx % 2).toBe(zhiIdx % 2)
    })

    test('五虎遁月干正确', () => {
      // 甲己年起丙寅；2000=庚辰年(庚属乙庚组,起戊寅)
      // 2000-03-01 在寅月(立春后), 月支=寅
      const chart = calculateBaZi(makeBirthInfo('2000-03-01', '12:00'))
      expect(chart.sixLines.month.zhi).toBe('寅')
      // 庚年 → 乙庚起戊寅 → 寅月=戊
      expect(chart.sixLines.month.gan).toBe('戊')
    })

    test('五鼠遁时干正确', () => {
      // 甲己日起甲子时；2000-01-01=戊午日(戊癸起壬子)
      // 12:00 = 午时, 子→午 = 6, 壬(8)+6=14%10=4=戊
      const chart = calculateBaZi(makeBirthInfo('2000-01-01', '12:00'))
      expect(chart.sixLines.hour.zhi).toBe('午')
      // 戊日 → 戊癸起壬子 → 午时=戊
      expect(chart.sixLines.hour.gan).toBe('戊')
    })
  })

  describe('子时排盘', () => {
    test('早子时（00:00）不换日', () => {
      // 2000-01-01 00:00 早子时策略 → 日期不变
      const chartEarly = calculateBaZi(
        makeBirthInfo('2000-01-01', '00:00'),
        { ziShiStrategy: 'early' },
      )
      // 日柱仍为 2000-01-01 的戊午
      expect(chartEarly.sixLines.day.gan).toBe('戊')
      expect(chartEarly.sixLines.day.zhi).toBe('午')
      // 时支为子
      expect(chartEarly.sixLines.hour.zhi).toBe('子')
    })

    test('晚子时（23:00）换日', () => {
      // 2000-01-01 23:00 晚子时策略 → 日期进一天到 01-02
      const chartLate = calculateBaZi(
        makeBirthInfo('2000-01-01', '23:00'),
        { ziShiStrategy: 'late' },
      )
      // 01-02 的日柱 = 己未（戊午 +1 = 己未）
      expect(chartLate.sixLines.day.gan).toBe('己')
      expect(chartLate.sixLines.day.zhi).toBe('未')
      // 时支为子
      expect(chartLate.sixLines.hour.zhi).toBe('子')
    })

    test('早子时与晚子时日柱不同', () => {
      // 同一天 23:30，late 换日，early 不换日
      const chartEarly = calculateBaZi(
        makeBirthInfo('2000-06-15', '23:30'),
        { ziShiStrategy: 'early' },
      )
      const chartLate = calculateBaZi(
        makeBirthInfo('2000-06-15', '23:30'),
        { ziShiStrategy: 'late' },
      )
      // late 策略日柱应为次日
      expect(chartLate.sixLines.day.gan).not.toBe(chartEarly.sixLines.day.gan)
    })

    test('gregorian 策略等同 early', () => {
      const chartG = calculateBaZi(
        makeBirthInfo('2000-01-01', '00:30'),
        { ziShiStrategy: 'gregorian' },
      )
      const chartE = calculateBaZi(
        makeBirthInfo('2000-01-01', '00:30'),
        { ziShiStrategy: 'early' },
      )
      expect(chartG.sixLines.day.gan).toBe(chartE.sixLines.day.gan)
      expect(chartG.sixLines.day.zhi).toBe(chartE.sixLines.day.zhi)
    })
  })

  describe('日柱 JDN 独立交叉验证', () => {
    test('多个日期日柱与独立 JDN 计算一致', () => {
      // 独立实现 JDN 日柱（与 calculator 同公式但代码独立）
      function toJDN(y: number, m: number, d: number): number {
        const a = Math.floor((14 - m) / 12)
        const yy = y + 4800 - a
        const mm = m + 12 * a - 3
        return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045
      }
      const STEMS = '甲乙丙丁戊己庚辛壬癸'
      const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
      const testDates = [
        '1985-03-15', '1990-07-04', '1995-12-25',
        '2000-01-01', '2008-08-08', '2020-06-15',
        '1951-09-27', '1953-06-24',
      ]
      for (const dateStr of testDates) {
        const [y, m, d] = dateStr.split('-').map(Number)
        const jdn = toJDN(y, m, d)
        const diff = jdn - 2451545
        const idx = ((54 + diff) % 60 + 60) % 60
        const expectedGan = STEMS[idx % 10]
        const expectedZhi = BRANCHES[idx % 12]

        const chart = calculateBaZi(makeBirthInfo(dateStr, '12:00'))
        expect(chart.sixLines.day.gan).toBe(expectedGan)
        expect(chart.sixLines.day.zhi).toBe(expectedZhi)
      }
    })
  })
})

// ─── 十神计算 ───

describe('十神计算', () => {
  test('甲木日主十神关系正确', () => {
    expect(calculateShenShi('甲', '甲')).toBe('比肩')
    expect(calculateShenShi('甲', '乙')).toBe('劫财')
    expect(calculateShenShi('甲', '丙')).toBe('食神')
    expect(calculateShenShi('甲', '丁')).toBe('伤官')
    expect(calculateShenShi('甲', '戊')).toBe('偏财')
    expect(calculateShenShi('甲', '己')).toBe('正财')
    expect(calculateShenShi('甲', '庚')).toBe('偏官')
    expect(calculateShenShi('甲', '辛')).toBe('正官')
    expect(calculateShenShi('甲', '壬')).toBe('偏印')
    expect(calculateShenShi('甲', '癸')).toBe('正印')
  })

  test('丙火日主十神关系正确', () => {
    expect(calculateShenShi('丙', '甲')).toBe('偏印')
    expect(calculateShenShi('丙', '丙')).toBe('比肩')
    expect(calculateShenShi('丙', '丁')).toBe('劫财')
    expect(calculateShenShi('丙', '戊')).toBe('食神')
    expect(calculateShenShi('丙', '庚')).toBe('偏财')
    expect(calculateShenShi('丙', '壬')).toBe('偏官')
    expect(calculateShenShi('丙', '癸')).toBe('正官')
  })

  test('getRelatedShens 返回全部10天干的十神', () => {
    const shens = getRelatedShens('甲')
    expect(Object.keys(shens)).toHaveLength(10)
    expect(shens['甲']).toBe('比肩')
    expect(shens['庚']).toBe('偏官')
    expect(shens['癸']).toBe('正印')
  })

  test('排盘中四柱十神标注正确', () => {
    // 2000-01-01 12:00 → 戊午日 戊午时（戊癸起壬子，午时=戊）
    // 戊日主: 戊=比肩
    const chart = calculateBaZi(makeBirthInfo('2000-01-01', '12:00'))
    expect(chart.sixLines.day.shenShi).toBe('比肩')
    // 时干也是戊，同为比肩
    expect(chart.sixLines.hour.shenShi).toBe('比肩')
    // 年干己 → 正劫（己=土, 戊=土, 阴阳不同=劫财）
    expect(chart.sixLines.year.shenShi).toBe('劫财')
  })
})

// ─── 纳音计算 ───

describe('纳音计算', () => {
  test('甲子海中金', () => {
    expect(getNaYin('甲', '子')).toBe('海中金')
  })
  test('乙丑海中金', () => {
    expect(getNaYin('乙', '丑')).toBe('海中金')
  })
  test('丙寅炉中火', () => {
    expect(getNaYin('丙', '寅')).toBe('炉中火')
  })
  test('戊午天上火', () => {
    expect(getNaYin('戊', '午')).toBe('天上火')
  })
  test('壬戌大海水', () => {
    expect(getNaYin('壬', '戌')).toBe('大海水')
  })
  test('癸亥大海水', () => {
    expect(getNaYin('癸', '亥')).toBe('大海水')
  })
  test('排盘中四柱纳音已填充', () => {
    const chart = calculateBaZi(makeBirthInfo('2000-01-01', '12:00'))
    for (const pillar of [chart.sixLines.year, chart.sixLines.month, chart.sixLines.day, chart.sixLines.hour]) {
      expect(pillar.naYin).toBeTruthy()
      expect(pillar.naYin.length).toBeGreaterThanOrEqual(3)
    }
  })
})

// ─── 藏干提取 ───

describe('藏干提取', () => {
  test('子藏癸水', () => {
    expect(CANG_GAN['子'].ben).toBe('癸')
    expect(CANG_GAN['子'].zhong).toBeNull()
    expect(CANG_GAN['子'].yao).toBeNull()
  })
  test('丑藏己辛癸', () => {
    expect(CANG_GAN['丑'].ben).toBe('己')
    expect(CANG_GAN['丑'].zhong).toBe('辛')
    expect(CANG_GAN['丑'].yao).toBe('癸')
  })
  test('寅藏甲丙戊', () => {
    expect(CANG_GAN['寅'].ben).toBe('甲')
    expect(CANG_GAN['寅'].zhong).toBe('丙')
    expect(CANG_GAN['寅'].yao).toBe('戊')
  })
  test('申藏庚壬戊', () => {
    expect(CANG_GAN['申'].ben).toBe('庚')
    expect(CANG_GAN['申'].zhong).toBe('壬')
    expect(CANG_GAN['申'].yao).toBe('戊')
  })
  test('酉只藏辛（专气）', () => {
    expect(CANG_GAN['酉'].ben).toBe('辛')
    expect(CANG_GAN['酉'].zhong).toBeNull()
    expect(CANG_GAN['酉'].yao).toBeNull()
  })
  test('排盘中 cangGan 完整覆盖12地支', () => {
    const chart = calculateBaZi(makeBirthInfo('2000-01-01', '12:00'))
    const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
    for (const zhi of branches) {
      expect(chart.cangGan[zhi]).toBeDefined()
      expect(chart.cangGan[zhi].ben).toBeTruthy()
    }
  })
})

// ─── 五行统计 ───

describe('五行统计', () => {
  test('排盘后五行计数总和 > 0', () => {
    const chart = calculateBaZi(makeBirthInfo('2000-01-01', '12:00'))
    const total = chart.fiveElementCount['木'] + chart.fiveElementCount['火'] +
      chart.fiveElementCount['土'] + chart.fiveElementCount['金'] + chart.fiveElementCount['水']
    expect(total).toBeGreaterThan(0)
  })

  test('五行计数包含全部5个元素', () => {
    const chart = calculateBaZi(makeBirthInfo('1990-06-15', '10:00'))
    expect(chart.fiveElementCount).toHaveProperty('木')
    expect(chart.fiveElementCount).toHaveProperty('火')
    expect(chart.fiveElementCount).toHaveProperty('土')
    expect(chart.fiveElementCount).toHaveProperty('金')
    expect(chart.fiveElementCount).toHaveProperty('水')
  })

  test('日主分析包含旺衰和strengthScore', () => {
    const chart = calculateBaZi(makeBirthInfo('1990-06-15', '10:00'))
    expect(chart.dayMaster.dayGan).toBeTruthy()
    expect(chart.dayMaster.dayGanElement).toBeTruthy()
    expect(chart.dayMaster.wangShuai).toBeTruthy()
    expect(chart.dayMaster.strengthScore).toBeGreaterThanOrEqual(0)
    expect(chart.dayMaster.strengthScore).toBeLessThanOrEqual(100)
  })
})

// ─── 十二长生 ───

describe('十二长生', () => {
  test('甲木长生在亥', () => {
    expect(getChangSheng('甲', '亥')).toBe('长生')
  })
  test('丙火长生在寅', () => {
    expect(getChangSheng('丙', '寅')).toBe('长生')
  })
  test('甲木帝旺在卯', () => {
    expect(getChangSheng('甲', '卯')).toBe('帝旺')
  })
  test('排盘中四柱十二长生已标注', () => {
    const chart = calculateBaZi(makeBirthInfo('2000-01-01', '12:00'))
    for (const pillar of [chart.sixLines.year, chart.sixLines.month, chart.sixLines.day, chart.sixLines.hour]) {
      expect(pillar.changSheng).toBeTruthy()
    }
  })
})

// ─── 经典命例验证 ───

describe('经典命例验证（150 例）', () => {
  test('命例数量为 150', () => {
    expect(classicCases).toHaveLength(150)
  })

  test('所有命例 id 唯一', () => {
    const ids = classicCases.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('六典籍命例数量正确', () => {
    const counts: Record<string, number> = {}
    for (const c of classicCases) {
      counts[c.source] = (counts[c.source] || 0) + 1
    }
    expect(counts['滴天髓']).toBe(30)
    expect(counts['穷通宝鉴']).toBe(25)
    expect(counts['三命通会']).toBe(25)
    expect(counts['渊海子平']).toBe(25)
    expect(counts['子平真诠']).toBe(25)
    expect(counts['神峰通考']).toBe(20)
  })

  // 逐例验证排盘正确性（dayMaster + JDN 日柱）
  classicCases.forEach(caseData => {
    test(`${caseData.source} - ${caseData.id}${caseData.name ? ' (' + caseData.name + ')' : ''}`, () => {
      const result = validateCase(caseData)
      expect(result.passed).toBe(true)
    })
  })

  test('全部命例汇总报告通过率 >= 95%', () => {
    const report = validateAllCases()
    expect(report.successRate).toBeGreaterThanOrEqual(95)
  })

  test('日主准确率 >= 95%', () => {
    const report = validateAllCases()
    expect(report.accuracyByField.dayMaster).toBeGreaterThanOrEqual(95)
  })

  test('身强弱准确率 >= 60%', () => {
    const report = validateAllCases()
    expect(report.accuracyByField.strength).toBeGreaterThanOrEqual(60)
  })
})
