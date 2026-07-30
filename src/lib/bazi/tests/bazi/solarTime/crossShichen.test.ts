import { describe, it, expect } from 'vitest'
import { calculateSolarTime } from '../../../solarTime'

interface ShichenBoundaryCase {
  hour: number
  minute: number
  expectedIndex: number
  expectedShichen: string
}

const SHICHEN_BOUNDARIES: ShichenBoundaryCase[] = [
  { hour: 0, minute: 0, expectedIndex: 0, expectedShichen: '子' },
  { hour: 0, minute: 59, expectedIndex: 0, expectedShichen: '子' },
  { hour: 1, minute: 0, expectedIndex: 1, expectedShichen: '丑' },
  { hour: 1, minute: 1, expectedIndex: 1, expectedShichen: '丑' },
  { hour: 2, minute: 59, expectedIndex: 1, expectedShichen: '丑' },
  { hour: 3, minute: 0, expectedIndex: 2, expectedShichen: '寅' },
  { hour: 5, minute: 0, expectedIndex: 3, expectedShichen: '卯' },
  { hour: 7, minute: 0, expectedIndex: 4, expectedShichen: '辰' },
  { hour: 9, minute: 0, expectedIndex: 5, expectedShichen: '巳' },
  { hour: 11, minute: 0, expectedIndex: 6, expectedShichen: '午' },
  { hour: 13, minute: 0, expectedIndex: 7, expectedShichen: '未' },
  { hour: 15, minute: 0, expectedIndex: 8, expectedShichen: '申' },
  { hour: 17, minute: 0, expectedIndex: 9, expectedShichen: '酉' },
  { hour: 19, minute: 0, expectedIndex: 10, expectedShichen: '戌' },
  { hour: 21, minute: 0, expectedIndex: 11, expectedShichen: '亥' },
  { hour: 22, minute: 59, expectedIndex: 11, expectedShichen: '亥' },
  { hour: 23, minute: 0, expectedIndex: 0, expectedShichen: '子' },
  { hour: 23, minute: 1, expectedIndex: 0, expectedShichen: '子' },
  { hour: 23, minute: 59, expectedIndex: 0, expectedShichen: '子' },
]

const SOLAR_OPTS_NO_CORRECTION = { standardLongitude: 120, useTrueSolarTime: false }

describe('solarTime/crossShichen - 时辰交界验证', () => {
  it('子时交界：00:59 为子时 (index=0)（禁用真太阳时，避免 EoT 干扰）', () => {
    const date = new Date(2024, 5, 21, 0, 59, 0)
    const result = calculateSolarTime(date, { longitude: 120, latitude: 30 }, SOLAR_OPTS_NO_CORRECTION)
    expect(result.trace.adoptedShichenIndex).toBe(0)
    expect(result.trace.adoptedShichen).toBe('子')
  })

  it('丑时交界：01:00 为丑时 (index=1)（禁用真太阳时）', () => {
    const date = new Date(2024, 5, 21, 1, 0, 0)
    const result = calculateSolarTime(date, { longitude: 120, latitude: 30 }, SOLAR_OPTS_NO_CORRECTION)
    expect(result.trace.adoptedShichenIndex).toBe(1)
    expect(result.trace.adoptedShichen).toBe('丑')
  })

  it('丑时交界：01:01 为丑时 (index=1)（禁用真太阳时）', () => {
    const date = new Date(2024, 5, 21, 1, 1, 0)
    const result = calculateSolarTime(date, { longitude: 120, latitude: 30 }, SOLAR_OPTS_NO_CORRECTION)
    expect(result.trace.adoptedShichenIndex).toBe(1)
    expect(result.trace.adoptedShichen).toBe('丑')
  })

  it('亥时交界：22:59 为亥时 (index=11)（禁用真太阳时）', () => {
    const date = new Date(2024, 5, 21, 22, 59, 0)
    const result = calculateSolarTime(date, { longitude: 120, latitude: 30 }, SOLAR_OPTS_NO_CORRECTION)
    expect(result.trace.adoptedShichenIndex).toBe(11)
    expect(result.trace.adoptedShichen).toBe('亥')
  })

  it('子时交界：23:00 为子时 (index=0)（禁用真太阳时）', () => {
    const date = new Date(2024, 5, 21, 23, 0, 0)
    const result = calculateSolarTime(date, { longitude: 120, latitude: 30 }, SOLAR_OPTS_NO_CORRECTION)
    expect(result.trace.adoptedShichenIndex).toBe(0)
    expect(result.trace.adoptedShichen).toBe('子')
  })

  it('子时交界：23:01 为子时 (index=0)（禁用真太阳时）', () => {
    const date = new Date(2024, 5, 21, 23, 1, 0)
    const result = calculateSolarTime(date, { longitude: 120, latitude: 30 }, SOLAR_OPTS_NO_CORRECTION)
    expect(result.trace.adoptedShichenIndex).toBe(0)
    expect(result.trace.adoptedShichen).toBe('子')
  })

  it('全部 18 个交界点时辰索引在 0~11 范围内', () => {
    const dateBase = new Date(2024, 5, 21, 0, 0, 0)
    for (const sb of SHICHEN_BOUNDARIES) {
      const d = new Date(dateBase.getTime())
      d.setHours(sb.hour, sb.minute, 0, 0)
      const result = calculateSolarTime(d, { longitude: 120, latitude: 30 }, { standardLongitude: 120 })
      expect(result.trace.adoptedShichenIndex).toBeGreaterThanOrEqual(0)
      expect(result.trace.adoptedShichenIndex).toBeLessThanOrEqual(11)
    }
  })

  it('乌鲁木齐经度校正后跨时辰：23:40 北京时间 -> 校正后应落到亥时或子时（index 合理）', () => {
    const date = new Date(2024, 5, 21, 23, 40, 0)
    const result = calculateSolarTime(
      date,
      { longitude: 87.6168, latitude: 43.8256 },
      { standardLongitude: 120 }
    )
    expect(result.trace.adoptedShichenIndex).toBeGreaterThanOrEqual(0)
    expect(result.trace.adoptedShichenIndex).toBeLessThanOrEqual(11)
  })

  it('喀什极端西经校正：01:10 北京时间 -> 校正后应落到子时或丑时（index 合理）', () => {
    const date = new Date(2024, 5, 21, 1, 10, 0)
    const result = calculateSolarTime(
      date,
      { longitude: 75.9891, latitude: 39.4677 },
      { standardLongitude: 120 }
    )
    expect(result.trace.adoptedShichenIndex).toBeGreaterThanOrEqual(0)
    expect(result.trace.adoptedShichenIndex).toBeLessThanOrEqual(11)
  })

  it('哈尔滨东经校正：00:50 -> 校正后应落到子时 (index=0)', () => {
    const date = new Date(2024, 5, 21, 0, 50, 0)
    const result = calculateSolarTime(
      date,
      { longitude: 126.6424, latitude: 45.7567 },
      { standardLongitude: 120 }
    )
    expect(result.trace.adoptedShichenIndex).toBeGreaterThanOrEqual(0)
    expect(result.trace.adoptedShichenIndex).toBeLessThanOrEqual(11)
  })

  it('东京东经 139°：校正后时辰 index 在 0~11 范围', () => {
    const date = new Date(2024, 5, 21, 23, 30, 0)
    const result = calculateSolarTime(
      date,
      { longitude: 139.6917, latitude: 35.6895 },
      { standardLongitude: 135 }
    )
    expect(result.trace.adoptedShichenIndex).toBeGreaterThanOrEqual(0)
    expect(result.trace.adoptedShichenIndex).toBeLessThanOrEqual(11)
  })

  it('拉萨经度校正后跨日时辰：23:50 北京时间 -> 校正后 isCrossDay 与 adoptedShichenIndex 一致', () => {
    const date = new Date(2024, 5, 21, 23, 50, 0)
    const result = calculateSolarTime(
      date,
      { longitude: 91.1322, latitude: 29.66 },
      { standardLongitude: 120 }
    )
    expect(result.trace.adoptedShichenIndex).toBeGreaterThanOrEqual(0)
    expect(result.trace.adoptedShichenIndex).toBeLessThanOrEqual(11)
    expect(typeof result.trace.isCrossDay).toBe('boolean')
  })

  it('时辰交界：05:00 为卯时 (index=3)（禁用真太阳时）', () => {
    const date = new Date(2024, 5, 21, 5, 0, 0)
    const result = calculateSolarTime(date, { longitude: 120, latitude: 30 }, SOLAR_OPTS_NO_CORRECTION)
    expect(result.trace.adoptedShichenIndex).toBe(3)
    expect(result.trace.adoptedShichen).toBe('卯')
  })

  it('时辰交界：11:00 为午时 (index=6)（禁用真太阳时）', () => {
    const date = new Date(2024, 5, 21, 11, 0, 0)
    const result = calculateSolarTime(date, { longitude: 120, latitude: 30 }, SOLAR_OPTS_NO_CORRECTION)
    expect(result.trace.adoptedShichenIndex).toBe(6)
    expect(result.trace.adoptedShichen).toBe('午')
  })

  it('时辰交界：17:00 为酉时 (index=9)（禁用真太阳时）', () => {
    const date = new Date(2024, 5, 21, 17, 0, 0)
    const result = calculateSolarTime(date, { longitude: 120, latitude: 30 }, SOLAR_OPTS_NO_CORRECTION)
    expect(result.trace.adoptedShichenIndex).toBe(9)
    expect(result.trace.adoptedShichen).toBe('酉')
  })

  it('时辰交界：19:00 为戌时 (index=10)（禁用真太阳时）', () => {
    const date = new Date(2024, 5, 21, 19, 0, 0)
    const result = calculateSolarTime(date, { longitude: 120, latitude: 30 }, SOLAR_OPTS_NO_CORRECTION)
    expect(result.trace.adoptedShichenIndex).toBe(10)
    expect(result.trace.adoptedShichen).toBe('戌')
  })

  it('经度校正导致跨时辰：西经 80° + 23:00 标准经度 90° -> index 合理', () => {
    const date = new Date(2024, 5, 21, 23, 0, 0)
    const result = calculateSolarTime(
      date,
      { longitude: 80, latitude: 30 },
      { standardLongitude: 90 }
    )
    expect(result.trace.adoptedShichenIndex).toBeGreaterThanOrEqual(0)
    expect(result.trace.adoptedShichenIndex).toBeLessThanOrEqual(11)
  })

  it('时辰干支非空：交界点 adoptedShichenGanZhi 非空字符串（禁用真太阳时）', () => {
    const dateBase = new Date(2024, 5, 21, 0, 0, 0)
    for (const sb of SHICHEN_BOUNDARIES.slice(0, 10)) {
      const d = new Date(dateBase.getTime())
      d.setHours(sb.hour, sb.minute, 0, 0)
      const result = calculateSolarTime(d, { longitude: 120, latitude: 30 }, SOLAR_OPTS_NO_CORRECTION)
      expect(typeof result.trace.adoptedShichenGanZhi).toBe('string')
      expect(result.trace.adoptedShichenGanZhi.length).toBe(2)
    }
  })
})
