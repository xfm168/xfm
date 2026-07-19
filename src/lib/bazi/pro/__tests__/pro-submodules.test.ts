/**
 * H3 Module 1: 胎元胎息 + 纳音 + 五行统计 + 空亡 + 十神 专项测试
 */
import { describe, it, expect } from 'vitest'
import {
  calculateTaiYuan, calculateTaiXi,
  getNaYin, getChangSheng, calculateFiveElementCount, getKongWang, getShenShi,
} from '../index'
import type { HeavenlyStem, EarthlyBranch } from '@/lib/core/types/base'

// ─── 胎元系统测试 ───
describe('胎元 系统测试', () => {
  const cases = [
    { mGan: '甲' as HeavenlyStem, mZhi: '子' as EarthlyBranch, eGan: '乙' as HeavenlyStem, eZhi: '卯' as EarthlyBranch, desc: '甲子月→乙卯' },
    { mGan: '甲' as HeavenlyStem, mZhi: '寅' as EarthlyBranch, eGan: '乙' as HeavenlyStem, eZhi: '巳' as EarthlyBranch, desc: '甲寅月→乙巳' },
    { mGan: '乙' as HeavenlyStem, mZhi: '卯' as EarthlyBranch, eGan: '丙' as HeavenlyStem, eZhi: '午' as EarthlyBranch, desc: '乙卯月→丙午' },
    { mGan: '丙' as HeavenlyStem, mZhi: '巳' as EarthlyBranch, eGan: '丁' as HeavenlyStem, eZhi: '申' as EarthlyBranch, desc: '丙巳月→丁申' },
    { mGan: '丙' as HeavenlyStem, mZhi: '午' as EarthlyBranch, eGan: '丁' as HeavenlyStem, eZhi: '酉' as EarthlyBranch, desc: '丙午月→丁酉' },
    { mGan: '丁' as HeavenlyStem, mZhi: '未' as EarthlyBranch, eGan: '戊' as HeavenlyStem, eZhi: '戌' as EarthlyBranch, desc: '丁未月→戊戌' },
    { mGan: '戊' as HeavenlyStem, mZhi: '申' as EarthlyBranch, eGan: '己' as HeavenlyStem, eZhi: '亥' as EarthlyBranch, desc: '戊申月→己亥' },
    { mGan: '己' as HeavenlyStem, mZhi: '酉' as EarthlyBranch, eGan: '庚' as HeavenlyStem, eZhi: '子' as EarthlyBranch, desc: '己酉月→庚子' },
    { mGan: '庚' as HeavenlyStem, mZhi: '戌' as EarthlyBranch, eGan: '辛' as HeavenlyStem, eZhi: '丑' as EarthlyBranch, desc: '庚戌月→辛丑' },
    { mGan: '壬' as HeavenlyStem, mZhi: '亥' as EarthlyBranch, eGan: '癸' as HeavenlyStem, eZhi: '寅' as EarthlyBranch, desc: '壬亥月→癸寅' },
    { mGan: '癸' as HeavenlyStem, mZhi: '丑' as EarthlyBranch, eGan: '甲' as HeavenlyStem, eZhi: '辰' as EarthlyBranch, desc: '癸丑月→甲辰' },
    { mGan: '辛' as HeavenlyStem, mZhi: '申' as EarthlyBranch, eGan: '壬' as HeavenlyStem, eZhi: '亥' as EarthlyBranch, desc: '辛申月→壬亥' },
  ]

  for (const c of cases) {
    it(`胎元: ${c.desc}`, () => {
      const ty = calculateTaiYuan(c.mGan, c.mZhi)
      expect(ty.ganZhi.gan).toBe(c.eGan)
      expect(ty.ganZhi.zhi).toBe(c.eZhi)
      // 纳音可能为空（非六十甲子组合）
      if (ty.naYin) {
        expect(typeof ty.naYin).toBe('string')
      }
    })
  }

  it('胎元推导链包含天干和地支两步', () => {
    const ty = calculateTaiYuan('甲' as HeavenlyStem, '寅' as EarthlyBranch)
    expect(ty.derivation.steps.length).toBe(2)
    expect(ty.derivation.steps[0].id).toBe('taiyuan-gan')
    expect(ty.derivation.steps[1].id).toBe('taiyuan-zhi')
  })

  it('胎元天干循环: 癸月→甲', () => {
    const ty = calculateTaiYuan('癸' as HeavenlyStem, '亥' as EarthlyBranch)
    expect(ty.ganZhi.gan).toBe('甲')
  })
})

// ─── 胎息系统测试 ───
describe('胎息 系统测试', () => {
  const cases = [
    { dGan: '甲' as HeavenlyStem, dZhi: '子' as EarthlyBranch, eGan: '乙' as HeavenlyStem, eZhi: '卯' as EarthlyBranch, desc: '甲子日→乙卯' },
    { dGan: '甲' as HeavenlyStem, dZhi: '寅' as EarthlyBranch, eGan: '乙' as HeavenlyStem, eZhi: '巳' as EarthlyBranch, desc: '甲寅日→乙巳' },
    { dGan: '丙' as HeavenlyStem, dZhi: '巳' as EarthlyBranch, eGan: '丁' as HeavenlyStem, eZhi: '申' as EarthlyBranch, desc: '丙巳日→丁申' },
    { dGan: '庚' as HeavenlyStem, dZhi: '申' as EarthlyBranch, eGan: '辛' as HeavenlyStem, eZhi: '亥' as EarthlyBranch, desc: '庚申日→辛亥' },
    { dGan: '壬' as HeavenlyStem, dZhi: '亥' as EarthlyBranch, eGan: '癸' as HeavenlyStem, eZhi: '寅' as EarthlyBranch, desc: '壬亥日→癸寅' },
    { dGan: '癸' as HeavenlyStem, dZhi: '丑' as EarthlyBranch, eGan: '甲' as HeavenlyStem, eZhi: '辰' as EarthlyBranch, desc: '癸丑日→甲辰' },
    { dGan: '乙' as HeavenlyStem, dZhi: '卯' as EarthlyBranch, eGan: '丙' as HeavenlyStem, eZhi: '午' as EarthlyBranch, desc: '乙卯日→丙午' },
    { dGan: '丁' as HeavenlyStem, dZhi: '午' as EarthlyBranch, eGan: '戊' as HeavenlyStem, eZhi: '酉' as EarthlyBranch, desc: '丁午日→戊酉' },
    { dGan: '己' as HeavenlyStem, dZhi: '未' as EarthlyBranch, eGan: '庚' as HeavenlyStem, eZhi: '戌' as EarthlyBranch, desc: '己未日→庚戌' },
    { dGan: '辛' as HeavenlyStem, dZhi: '酉' as EarthlyBranch, eGan: '壬' as HeavenlyStem, eZhi: '子' as EarthlyBranch, desc: '辛酉日→壬子' },
  ]

  for (const c of cases) {
    it(`胎息: ${c.desc}`, () => {
      const tx = calculateTaiXi(c.dGan, c.dZhi)
      expect(tx.ganZhi.gan).toBe(c.eGan)
      expect(tx.ganZhi.zhi).toBe(c.eZhi)
      // 纳音可能为空（非六十甲子组合）
      if (tx.naYin) {
        expect(typeof tx.naYin).toBe('string')
      }
    })
  }

  it('胎息推导链完整', () => {
    const tx = calculateTaiXi('甲' as HeavenlyStem, '子' as EarthlyBranch)
    expect(tx.derivation.steps.length).toBe(2)
    expect(tx.derivation.overallConfidence).toBeGreaterThan(0)
  })
})

// ─── 纳音系统测试 ───
describe('纳音 系统测试', () => {
  // 抽样验证 60 甲子中的关键纳音
  const cases: [HeavenlyStem, EarthlyBranch, string][] = [
    ['甲', '子', '海中金'], ['乙', '丑', '海中金'],
    ['丙', '寅', '炉中火'], ['丁', '卯', '炉中火'],
    ['戊', '辰', '大林木'], ['己', '巳', '大林木'],
    ['庚', '午', '路旁土'], ['辛', '未', '路旁土'],
    ['壬', '申', '剑锋金'], ['癸', '酉', '剑锋金'],
    ['甲', '戌', '山头火'], ['乙', '亥', '山头火'],
    ['丙', '子', '涧下水'], ['丁', '丑', '涧下水'],
    ['戊', '寅', '城头土'], ['己', '卯', '城头土'],
    ['庚', '辰', '白蜡金'], ['辛', '巳', '白蜡金'],
    ['壬', '午', '杨柳木'], ['癸', '未', '杨柳木'],
    ['甲', '申', '泉中水'], ['乙', '酉', '泉中水'],
    ['丙', '戌', '屋上土'], ['丁', '亥', '屋上土'],
    ['戊', '子', '霹雳火'], ['己', '丑', '霹雳火'],
    ['庚', '寅', '松柏木'], ['辛', '卯', '松柏木'],
    ['壬', '辰', '长流水'], ['癸', '巳', '长流水'],
  ]

  for (const [gan, zhi, expected] of cases) {
    it(`纳音 ${gan}${zhi} = ${expected}`, () => {
      expect(getNaYin(gan, zhi)).toBe(expected)
    })
  }

  it('同旬纳音相同: 甲子=乙丑', () => {
    expect(getNaYin('甲' as HeavenlyStem, '子' as EarthlyBranch)).toBe(getNaYin('乙' as HeavenlyStem, '丑' as EarthlyBranch))
  })

  it('不同旬纳音不同: 甲子≠丙寅', () => {
    expect(getNaYin('甲' as HeavenlyStem, '子' as EarthlyBranch)).not.toBe(getNaYin('丙' as HeavenlyStem, '寅' as EarthlyBranch))
  })
})

// ─── 十二长生系统测试 ───
describe('十二长生 系统测试', () => {
  // 甲木完整十二长生（阳干顺行，起亥）
  const jiaCases: [HeavenlyStem, EarthlyBranch][] = [
    ['甲', '亥'], ['甲', '子'], ['甲', '丑'], ['甲', '寅'],
    ['甲', '卯'], ['甲', '辰'], ['甲', '巳'], ['甲', '午'],
    ['甲', '未'], ['甲', '申'], ['甲', '酉'], ['甲', '戌'],
  ]
  const jiaExpected = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']

  jiaCases.forEach(([gan, zhi], i) => {
    it(`甲木 ${zhi} = ${jiaExpected[i]}`, () => {
      expect(getChangSheng(gan, zhi)).toBe(jiaExpected[i])
    })
  })

  // 乙木完整十二长生（阴干逆行，起午）
  const yiCases: [HeavenlyStem, EarthlyBranch][] = [
    ['乙', '午'], ['乙', '巳'], ['乙', '辰'], ['乙', '卯'],
    ['乙', '寅'], ['乙', '丑'], ['乙', '子'], ['乙', '亥'],
    ['乙', '戌'], ['乙', '酉'], ['乙', '申'], ['乙', '未'],
  ]
  const yiExpected = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']

  yiCases.forEach(([gan, zhi], i) => {
    it(`乙木 ${zhi} = ${yiExpected[i]}`, () => {
      expect(getChangSheng(gan, zhi)).toBe(yiExpected[i])
    })
  })
})

// ─── 空亡系统测试 ───
describe('空亡 系统测试', () => {
  it('甲子日 → 戌亥空', () => {
    const kw = getKongWang({ year: { gan: '甲', zhi: '子' }, day: { gan: '甲', zhi: '子' } })
    expect(kw).toContain('戌')
    expect(kw).toContain('亥')
  })

  it('乙丑日 → 戌亥空（同旬）', () => {
    const kw = getKongWang({ year: { gan: '丙', zhi: '寅' }, day: { gan: '乙', zhi: '丑' } })
    expect(kw).toContain('戌')
    expect(kw).toContain('亥')
  })

  it('丙寅日 → 戌亥空', () => {
    const kw = getKongWang({ year: { gan: '庚', zhi: '申' }, day: { gan: '丙', zhi: '寅' } })
    expect(kw).toContain('戌')
    expect(kw).toContain('亥')
  })

  it('戊辰日 → 戌亥空', () => {
    const kw = getKongWang({ year: { gan: '壬', zhi: '申' }, day: { gan: '戊', zhi: '辰' } })
    expect(kw).toContain('戌')
    expect(kw).toContain('亥')
  })

  it('庚午日 → 戌亥空', () => {
    const kw = getKongWang({ year: { gan: '甲', zhi: '寅' }, day: { gan: '庚', zhi: '午' } })
    expect(kw).toContain('戌')
    expect(kw).toContain('亥')
  })

  it('壬申日 → 戌亥空', () => {
    const kw = getKongWang({ year: { gan: '丙', zhi: '午' }, day: { gan: '壬', zhi: '申' } })
    expect(kw).toContain('戌')
    expect(kw).toContain('亥')
  })

  it('不同旬空亡不同: 丙寅日 vs 甲戌日', () => {
    const kw1 = getKongWang({ year: { gan: '甲', zhi: '子' }, day: { gan: '丙', zhi: '寅' } })
    const kw2 = getKongWang({ year: { gan: '甲', zhi: '子' }, day: { gan: '甲', zhi: '戌' } })
    // 丙寅日空戌亥, 甲戌日空申酉
    expect(kw1).not.toEqual(kw2)
  })
})

// ─── 十神系统测试 ───
describe('十神 系统测试', () => {
  // 甲木十神完整验证
  const jiaMap: Record<string, string> = {
    '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官',
    '戊': '偏财', '己': '正财', '庚': '偏官', '辛': '正官',
    '壬': '偏印', '癸': '正印',
  }
  for (const [target, expected] of Object.entries(jiaMap)) {
    it(`日主甲 vs ${target} = ${expected}`, () => {
      expect(getShenShi('甲' as HeavenlyStem, target as HeavenlyStem)).toBe(expected)
    })
  }

  // 丙火十神验证
  const bingMap: Record<string, string> = {
    '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财',
    '戊': '食神', '己': '伤官', '庚': '偏财', '辛': '正财',
    '壬': '偏官', '癸': '正官',
  }
  for (const [target, expected] of Object.entries(bingMap)) {
    it(`日主丙 vs ${target} = ${expected}`, () => {
      expect(getShenShi('丙' as HeavenlyStem, target as HeavenlyStem)).toBe(expected)
    })
  }

  // 庚金十神验证
  const gengMap: Record<string, string> = {
    '甲': '正财', '乙': '偏财', '丙': '偏官', '丁': '正官',
    '戊': '偏印', '己': '正印', '庚': '比肩', '辛': '劫财',
    '壬': '食神', '癸': '伤官',
  }
  for (const [target, expected] of Object.entries(gengMap)) {
    it(`日主庚 vs ${target} = ${expected}`, () => {
      expect(getShenShi('庚' as HeavenlyStem, target as HeavenlyStem)).toBe(expected)
    })
  }
})

// ─── 五行统计系统测试 ───
describe('五行统计 系统测试', () => {
  it('纯木八字: 甲寅 甲寅 甲寅 甲寅', () => {
    const count = calculateFiveElementCount({
      year: { gan: '甲', zhi: '寅' },
      month: { gan: '甲', zhi: '寅' },
      day: { gan: '甲', zhi: '寅' },
      hour: { gan: '甲', zhi: '寅' },
    })
    // 甲(木)×4=4.0, 寅本气甲(木)0.6×4=2.4, 寅中气丙(火)0.3×4=1.2, 寅余气戊(土)0.1×4=0.4
    expect(count['木']).toBeCloseTo(6.4)
    expect(count['火']).toBeCloseTo(1.2)
    expect(count['土']).toBeCloseTo(0.4)
    expect(count['金']).toBe(0)
    expect(count['水']).toBe(0)
  })

  it('纯火八字: 丙午 丙午 丙午 丙午', () => {
    const count = calculateFiveElementCount({
      year: { gan: '丙', zhi: '午' },
      month: { gan: '丙', zhi: '午' },
      day: { gan: '丙', zhi: '午' },
      hour: { gan: '丙', zhi: '午' },
    })
    expect(count['火']).toBeGreaterThan(count['木'])
    expect(count['火']).toBeGreaterThan(count['水'])
  })

  it('子时藏干含癸水', () => {
    const count = calculateFiveElementCount({
      year: { gan: '甲', zhi: '子' },
      month: { gan: '甲', zhi: '子' },
      day: { gan: '甲', zhi: '子' },
      hour: { gan: '甲', zhi: '子' },
    })
    // 子本气癸=水, 无中余气
    expect(count['水']).toBeCloseTo(2.4) // 4×0.6
  })

  it('丑月藏干含三气', () => {
    const count = calculateFiveElementCount({
      year: { gan: '甲', zhi: '丑' },
      month: { gan: '甲', zhi: '丑' },
      day: { gan: '甲', zhi: '丑' },
      hour: { gan: '甲', zhi: '丑' },
    })
    // 丑本气己(土)0.6, 中气癸(水)0.3, 余气辛(金)0.1
    expect(count['土']).toBeGreaterThanOrEqual(4 * 0.6) // 天干可能也有土
  })
})
