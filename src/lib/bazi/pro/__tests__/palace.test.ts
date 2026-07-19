/**
 * H3 Module 1: 命宫身宫专项测试
 */
import { describe, it, expect } from 'vitest'
import { calculateMingGong, calculateShenGong } from '../index'

describe('命宫 专项测试', () => {
  const cases = [
    { yearGan: '甲', monthZhi: '寅', hourZhi: '子', desc: '甲年寅月子时' },
    { yearGan: '甲', monthZhi: '寅', hourZhi: '丑', desc: '甲年寅月丑时' },
    { yearGan: '甲', monthZhi: '寅', hourZhi: '午', desc: '甲年寅月午时' },
    { yearGan: '丙', monthZhi: '午', hourZhi: '子', desc: '丙年午月子时' },
    { yearGan: '丙', monthZhi: '午', hourZhi: '酉', desc: '丙年午月酉时' },
    { yearGan: '庚', monthZhi: '申', hourZhi: '卯', desc: '庚年申月卯时' },
    { yearGan: '壬', monthZhi: '亥', hourZhi: '巳', desc: '壬年亥月巳时' },
    { yearGan: '乙', monthZhi: '卯', hourZhi: '戌', desc: '乙年卯月戌时' },
    { yearGan: '丁', monthZhi: '酉', hourZhi: '辰', desc: '丁年酉月辰时' },
    { yearGan: '己', monthZhi: '未', hourZhi: '寅', desc: '己年未月寅时' },
    { yearGan: '辛', monthZhi: '子', hourZhi: '申', desc: '辛年子月申时' },
    { yearGan: '癸', monthZhi: '卯', hourZhi: '亥', desc: '癸年卯月亥时' },
  ] as const

  for (const c of cases) {
    it(`命宫: ${c.desc}`, () => {
      const mg = calculateMingGong(c.yearGan, c.monthZhi, c.hourZhi)
      expect(mg.ganZhi.gan).toBeTruthy()
      expect(mg.ganZhi.zhi).toBeTruthy()
      expect(mg.palaceName).toBeTruthy()
      expect(mg.derivation.steps.length).toBeGreaterThanOrEqual(2)
    })
  }

  it('推导链每步都有 ruleId', () => {
    const mg = calculateMingGong('甲', '寅', '子')
    for (const step of mg.derivation.steps) {
      expect(step.ruleId).toBeTruthy()
      expect(step.ruleDescription).toBeTruthy()
    }
  })

  it('阳年命宫天干遁丙起寅', () => {
    const mg = calculateMingGong('丙', '寅', '子')
    // 丙年阳干 → startGanIdx=2(丙), 命宫地支取决于月支和时支
    expect(mg.derivation.steps[1]?.input).toBeDefined()
    expect(mg.derivation.steps[1]?.input['isYangYear']).toBe(true)
  })

  it('阴年命宫天干遁壬起寅', () => {
    const mg = calculateMingGong('丁', '寅', '子')
    expect(mg.derivation.steps[1]?.input['isYangYear']).toBe(false)
  })
})

describe('身宫 专项测试', () => {
  const cases = [
    { yearGan: '甲', monthZhi: '寅', hourZhi: '子', desc: '甲年寅月子时' },
    { yearGan: '甲', monthZhi: '寅', hourZhi: '丑', desc: '甲年寅月丑时' },
    { yearGan: '甲', monthZhi: '寅', hourZhi: '午', desc: '甲年寅月午时' },
    { yearGan: '丙', monthZhi: '午', hourZhi: '子', desc: '丙年午月子时' },
    { yearGan: '庚', monthZhi: '申', hourZhi: '卯', desc: '庚年申月卯时' },
    { yearGan: '壬', monthZhi: '亥', hourZhi: '巳', desc: '壬年亥月巳时' },
    { yearGan: '乙', monthZhi: '卯', hourZhi: '戌', desc: '乙年卯月戌时' },
    { yearGan: '丁', monthZhi: '酉', hourZhi: '辰', desc: '丁年酉月辰时' },
    { yearGan: '己', monthZhi: '未', hourZhi: '寅', desc: '己年未月寅时' },
    { yearGan: '辛', monthZhi: '子', hourZhi: '申', desc: '辛年子月申时' },
    { yearGan: '癸', monthZhi: '卯', hourZhi: '亥', desc: '癸年卯月亥时' },
    { yearGan: '戊', monthZhi: '巳', hourZhi: '未', desc: '戊年巳月未时' },
  ] as const

  for (const c of cases) {
    it(`身宫: ${c.desc}`, () => {
      const sg = calculateShenGong(c.yearGan, c.monthZhi, c.hourZhi)
      expect(sg.ganZhi.gan).toBeTruthy()
      expect(sg.ganZhi.zhi).toBeTruthy()
      expect(sg.palaceName).toBeTruthy()
      expect(sg.derivation.steps.length).toBeGreaterThanOrEqual(2)
    })
  }
})

describe('命宫身宫一致性', () => {
  it('同一条件下命宫和身宫都有推导链', () => {
    const mg = calculateMingGong('甲', '子', '午')
    const sg = calculateShenGong('甲', '子', '午')
    expect(mg.derivation.steps.length).toBe(sg.derivation.steps.length)
  })

  it('不同时辰命宫不同', () => {
    const mg1 = calculateMingGong('甲', '寅', '子')
    const mg2 = calculateMingGong('甲', '寅', '午')
    // 不同时辰 → 不同命宫地支
    expect(mg1.ganZhi.zhi).not.toBe(mg2.ganZhi.zhi)
  })
})
