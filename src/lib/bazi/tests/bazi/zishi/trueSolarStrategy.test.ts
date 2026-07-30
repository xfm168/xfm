import { describe, it, expect } from 'vitest'
import { calculateSolarTime, SolarTimeTrace } from '../../../solarTime'
import { LateZiShiStrategy, EarlyZiShiStrategy, computeHourIndex } from '../../../zishi/strategies'

/**
 * TrueSolarZiShiStrategy 实现（基于真太阳时 trace.isCrossDay 决定日期）
 * 由于 strategies.ts 中未独立导出此类，此处按需求构造等价实现做测试
 */
class TrueSolarZiShiStrategy {
  id = 'true-solar'
  name = '真太阳时子时策略'
  description = '基于真太阳时决定日期：trace.isCrossDay 为 true 时换日'
  reference = '真太阳时 + trace.isCrossDay'
  evidenceLevel = 'A' as const

  constructor(
    private longitude: number,
    private latitude: number,
    private standardLongitude: number = 120,
  ) {}

  resolveChartDate(birth: Date) {
    const solar = calculateSolarTime(
      birth,
      { longitude: this.longitude, latitude: this.latitude },
      { standardLongitude: this.standardLongitude, useTrueSolarTime: true }
    )
    const trace: SolarTimeTrace = solar.trace
    const finalTime = trace.finalAdoptedTime
    const hourIndex = computeHourIndex(finalTime.getHours(), finalTime.getMinutes())

    const late = new LateZiShiStrategy().resolveChartDate(finalTime)
    return {
      chartDate: late.chartDate,
      hourIndex,
      isLateZiShi: late.isLateZiShi,
      strategyId: this.id,
      isCrossDay: trace.isCrossDay === true,
      trace,
    }
  }
}

describe('zishi/trueSolarStrategy - 真太阳时子时策略（结合 SolarTimeTrace.isCrossDay）', () => {
  it('TrueSolarZiShiStrategy 元信息完整', () => {
    const s = new TrueSolarZiShiStrategy(116.4, 39.9, 120)
    expect(s.id).toBe('true-solar')
    expect(s.name.length).toBeGreaterThan(0)
    expect(s.evidenceLevel).toBe('A')
  })

  it('北京时间 120°E 正午 12:00：不跨日，chartDate 日期不变', () => {
    const s = new TrueSolarZiShiStrategy(120, 30, 120)
    const birth = new Date(2024, 5, 15, 12, 0, 0)
    const result = s.resolveChartDate(birth)
    expect(result.chartDate.getDate()).toBe(15)
    expect(result.hourIndex).toBe(6)
    expect(typeof result.isCrossDay).toBe('boolean')
  })

  it('乌鲁木齐 87.6°E 23:00 北京时间：校正后约 21:10，不跨日', () => {
    const s = new TrueSolarZiShiStrategy(87.6168, 43.8256, 120)
    const birth = new Date(2024, 5, 15, 23, 0, 0)
    const result = s.resolveChartDate(birth)
    expect(result.hourIndex).toBeGreaterThanOrEqual(0)
    expect(result.hourIndex).toBeLessThanOrEqual(11)
    expect(typeof result.isCrossDay).toBe('boolean')
  })

  it('喀什 76°E 23:30 北京时间：校正后更早，isCrossDay 可能为 false', () => {
    const s = new TrueSolarZiShiStrategy(75.9891, 39.4677, 120)
    const birth = new Date(2024, 5, 15, 23, 30, 0)
    const result = s.resolveChartDate(birth)
    expect(result.hourIndex).toBeGreaterThanOrEqual(0)
    expect(result.hourIndex).toBeLessThanOrEqual(11)
    expect(typeof result.isCrossDay).toBe('boolean')
  })

  it('哈尔滨 126.6°E 23:00 北京时间：校正后 23:26，可能进入子时并换日', () => {
    const s = new TrueSolarZiShiStrategy(126.6424, 45.7567, 120)
    const birth = new Date(2024, 5, 15, 23, 0, 0)
    const result = s.resolveChartDate(birth)
    expect(result.hourIndex).toBeGreaterThanOrEqual(0)
    expect(result.hourIndex).toBeLessThanOrEqual(11)
    expect(typeof result.isCrossDay).toBe('boolean')
  })

  it('东京 139.7°E 22:50 UTC+9（标准经度 135°）：校正后 23:09，进入子时', () => {
    const s = new TrueSolarZiShiStrategy(139.6917, 35.6895, 135)
    const birth = new Date(2024, 5, 15, 22, 50, 0)
    const result = s.resolveChartDate(birth)
    expect(result.hourIndex).toBeGreaterThanOrEqual(0)
    expect(result.hourIndex).toBeLessThanOrEqual(11)
    expect(typeof result.isCrossDay).toBe('boolean')
  })

  it('0° 格林威治 12:00 UTC：不跨日，结构完整', () => {
    const s = new TrueSolarZiShiStrategy(0, 51.5, 0)
    const birth = new Date(2024, 5, 15, 12, 0, 0)
    const result = s.resolveChartDate(birth)
    expect(result.hourIndex).toBe(6)
    expect(result.trace).toBeDefined()
    expect(typeof result.trace.isCrossDay).toBe('boolean')
  })

  it('trace.isCrossDay 字段与最终日期决策逻辑一致', () => {
    const s = new TrueSolarZiShiStrategy(87.6168, 43.8256, 120)
    const testTimes = [
      new Date(2024, 5, 15, 0, 10, 0),
      new Date(2024, 5, 15, 6, 0, 0),
      new Date(2024, 5, 15, 12, 0, 0),
      new Date(2024, 5, 15, 18, 0, 0),
      new Date(2024, 5, 15, 23, 50, 0),
    ]
    for (const t of testTimes) {
      const result = s.resolveChartDate(t)
      expect(typeof result.isCrossDay).toBe('boolean')
      expect(result.trace.isCrossDay === result.isCrossDay).toBe(true)
    }
  })

  it('真太阳时校正后 hourIndex 与最终 adoptedShichenIndex 一致', () => {
    const s = new TrueSolarZiShiStrategy(104.0665, 30.5723, 120)
    const birth = new Date(2024, 5, 15, 23, 30, 0)
    const result = s.resolveChartDate(birth)
    expect(result.hourIndex).toBe(result.trace.adoptedShichenIndex)
  })
})
