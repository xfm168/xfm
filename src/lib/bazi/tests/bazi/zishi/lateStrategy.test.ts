import { describe, it, expect } from 'vitest'
import { LateZiShiStrategy } from '../../../zishi/strategies'

describe('zishi/lateStrategy - 晚子时策略（子初换日：23:00 即换日）', () => {
  const strategy = new LateZiShiStrategy()

  it('策略元信息正确：id=late, evidenceLevel=A', () => {
    expect(strategy.id).toBe('late')
    expect(strategy.name).toContain('晚子')
    expect(strategy.evidenceLevel).toBe('A')
    expect(typeof strategy.description).toBe('string')
    expect(typeof strategy.reference).toBe('string')
  })

  it('23:00 输入：chartDate 日序号 +1（晚子时换日）', () => {
    const birth = new Date(2024, 5, 15, 23, 0, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getDate()).toBe(16)
    expect(result.chartDate.getMonth()).toBe(5)
    expect(result.chartDate.getFullYear()).toBe(2024)
  })

  it('23:00 输入：hourIndex=0（子时）', () => {
    const birth = new Date(2024, 5, 15, 23, 0, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.hourIndex).toBe(0)
  })

  it('23:00 输入：isLateZiShi=true', () => {
    const birth = new Date(2024, 5, 15, 23, 0, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.isLateZiShi).toBe(true)
  })

  it('23:30 输入：日序号 +1 + hourIndex=0 + isLateZiShi=true', () => {
    const birth = new Date(2024, 5, 15, 23, 30, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getDate()).toBe(16)
    expect(result.hourIndex).toBe(0)
    expect(result.isLateZiShi).toBe(true)
  })

  it('23:59 输入：日序号 +1 + hourIndex=0 + isLateZiShi=true', () => {
    const birth = new Date(2024, 5, 15, 23, 59, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getDate()).toBe(16)
    expect(result.hourIndex).toBe(0)
    expect(result.isLateZiShi).toBe(true)
  })

  it('00:00 输入：日序号不变（已是新日）+ isLateZiShi=false', () => {
    const birth = new Date(2024, 5, 16, 0, 0, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getDate()).toBe(16)
    expect(result.hourIndex).toBe(0)
    expect(result.isLateZiShi).toBe(false)
  })

  it('00:59 输入：日序号不变 + isLateZiShi=false', () => {
    const birth = new Date(2024, 5, 16, 0, 59, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getDate()).toBe(16)
    expect(result.hourIndex).toBe(0)
    expect(result.isLateZiShi).toBe(false)
  })

  it('01:00 输入：hourIndex=1（丑时）+ isLateZiShi=false', () => {
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

  it('月末 23:50 跨月：晚子时换日月（6-30 23:50 → 7-1）', () => {
    const birth = new Date(2024, 5, 30, 23, 50, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getMonth()).toBe(6)
    expect(result.chartDate.getDate()).toBe(1)
    expect(result.hourIndex).toBe(0)
    expect(result.isLateZiShi).toBe(true)
  })

  it('年末 23:50 跨年：晚子时换日年（12-31 23:50 → 次年 1-1）', () => {
    const birth = new Date(2024, 11, 31, 23, 50, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getFullYear()).toBe(2025)
    expect(result.chartDate.getMonth()).toBe(0)
    expect(result.chartDate.getDate()).toBe(1)
    expect(result.hourIndex).toBe(0)
    expect(result.isLateZiShi).toBe(true)
  })

  it('2月月末（闰年2024）：2-29 23:50 → 3-1', () => {
    const birth = new Date(2024, 1, 29, 23, 50, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getMonth()).toBe(2)
    expect(result.chartDate.getDate()).toBe(1)
    expect(result.isLateZiShi).toBe(true)
  })

  it('strategyId 字段正确', () => {
    const birth = new Date(2024, 5, 15, 23, 30, 0)
    const result = strategy.resolveChartDate(birth)
    expect(result.strategyId).toBe('late')
  })

  it('非子时时段 chartDate 完全等于输入（保持原时刻）', () => {
    const birth = new Date(2024, 5, 16, 10, 30, 45)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getTime()).toBe(birth.getTime())
  })

  it('晚子时 chartDate 的时间归零为 00:00:00', () => {
    const birth = new Date(2024, 5, 15, 23, 30, 45)
    const result = strategy.resolveChartDate(birth)
    expect(result.chartDate.getHours()).toBe(0)
    expect(result.chartDate.getMinutes()).toBe(0)
    expect(result.chartDate.getSeconds()).toBe(0)
  })
})
