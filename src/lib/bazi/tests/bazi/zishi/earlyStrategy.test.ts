import { describe, it, expect } from 'vitest'
import { EarlyZiShiStrategy, computeHourIndex } from '../../../zishi/strategies'

describe('zishi/earlyStrategy - 早子时策略（子正换日：00:00 才换日）', () => {
  const strategy = new EarlyZiShiStrategy()

  it('策略元信息正确：id=early, evidenceLevel=B', () => {
    expect(strategy.id).toBe('early')
    expect(strategy.name).toContain('早子')
    expect(strategy.evidenceLevel).toBe('B')
    expect(typeof strategy.description).toBe('string')
    expect(typeof strategy.reference).toBe('string')
  })

  it('23:00 输入：chartDate 日序号不变（早子时不换日）', () => {
    const birth = new Date(2024, 5, 15, 23, 0, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getDate()).toBe(birth.getDate())
    expect(result.chartDate.getMonth()).toBe(birth.getMonth())
    expect(result.chartDate.getFullYear()).toBe(birth.getFullYear())
  })

  it('23:00 输入：hourIndex=0（子时）', () => {
    const birth = new Date(2024, 5, 15, 23, 0, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.hourIndex).toBe(0)
  })

  it('23:00 输入：isLateZiShi=false（早子时策略认为 23:xx 不是晚子）', () => {
    const birth = new Date(2024, 5, 15, 23, 0, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.isLateZiShi).toBe(false)
  })

  it('23:30 输入：日序号不变 + hourIndex=0', () => {
    const birth = new Date(2024, 5, 15, 23, 30, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getDate()).toBe(birth.getDate())
    expect(result.hourIndex).toBe(0)
    expect(result.isLateZiShi).toBe(false)
  })

  it('23:59 输入：日序号不变 + hourIndex=0', () => {
    const birth = new Date(2024, 5, 15, 23, 59, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getDate()).toBe(birth.getDate())
    expect(result.hourIndex).toBe(0)
    expect(result.isLateZiShi).toBe(false)
  })

  it('00:00 输入：日序号不变（已是新日）+ hourIndex=0', () => {
    const birth = new Date(2024, 5, 16, 0, 0, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getDate()).toBe(16)
    expect(result.hourIndex).toBe(0)
    expect(result.isLateZiShi).toBe(false)
  })

  it('00:30 输入：日序号不变 + hourIndex=0', () => {
    const birth = new Date(2024, 5, 16, 0, 30, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getDate()).toBe(16)
    expect(result.hourIndex).toBe(0)
    expect(result.isLateZiShi).toBe(false)
  })

  it('01:00 输入：hourIndex=1（丑时）', () => {
    const birth = new Date(2024, 5, 16, 1, 0, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.hourIndex).toBe(1)
    expect(result.isLateZiShi).toBe(false)
  })

  it('12:00 正午输入：日序号不变 + hourIndex=6（午时）', () => {
    const birth = new Date(2024, 5, 16, 12, 0, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getDate()).toBe(16)
    expect(result.hourIndex).toBe(6)
    expect(result.isLateZiShi).toBe(false)
  })

  it('月末 23:50 跨月：早子时不换日（6-30 23:50 仍为 6-30）', () => {
    const birth = new Date(2024, 5, 30, 23, 50, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getMonth()).toBe(5)
    expect(result.chartDate.getDate()).toBe(30)
    expect(result.hourIndex).toBe(0)
  })

  it('年末 23:50 跨年：早子时不换日（12-31 23:50 仍为当年）', () => {
    const birth = new Date(2024, 11, 31, 23, 50, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getFullYear()).toBe(2024)
    expect(result.chartDate.getMonth()).toBe(11)
    expect(result.chartDate.getDate()).toBe(31)
    expect(result.hourIndex).toBe(0)
  })

  it('strategyId 字段正确', () => {
    const birth = new Date(2024, 5, 15, 23, 30, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.strategyId).toBe('early')
  })

  it('computeHourIndex(23, 30) = 0（子时）', () => {
    expect(computeHourIndex(23, 30)).toBe(0)
  })

  it('computeHourIndex(0, 30) = 0（子时）', () => {
    expect(computeHourIndex(0, 30)).toBe(0)
  })
})
