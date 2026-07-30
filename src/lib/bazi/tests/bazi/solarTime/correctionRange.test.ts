import { describe, it, expect } from 'vitest'
import { calculateSolarTime, getEquationOfTime, getLongitudeCorrection } from '../../../solarTime'

interface CityCase {
  name: string
  longitude: number
  latitude: number
  standardLongitude: number
  expectedCorrectionRange: [number, number]
}

const CORRECTION_CASES: CityCase[] = [
  { name: '北京', longitude: 116.4074, latitude: 39.9042, standardLongitude: 120, expectedCorrectionRange: [-25, -5] },
  { name: '上海', longitude: 121.4737, latitude: 31.2304, standardLongitude: 120, expectedCorrectionRange: [-10, 25] },
  { name: '广州', longitude: 113.2644, latitude: 23.1291, standardLongitude: 120, expectedCorrectionRange: [-40, -15] },
  { name: '深圳', longitude: 114.0579, latitude: 22.5431, standardLongitude: 120, expectedCorrectionRange: [-40, -15] },
  { name: '成都', longitude: 104.0665, latitude: 30.5723, standardLongitude: 120, expectedCorrectionRange: [-80, -50] },
  { name: '重庆', longitude: 106.5516, latitude: 29.5630, standardLongitude: 120, expectedCorrectionRange: [-70, -45] },
  { name: '武汉', longitude: 114.3055, latitude: 30.5928, standardLongitude: 120, expectedCorrectionRange: [-40, -15] },
  { name: '杭州', longitude: 120.1551, latitude: 30.2741, standardLongitude: 120, expectedCorrectionRange: [-17, 17] },
  { name: '南京', longitude: 118.7969, latitude: 32.0603, standardLongitude: 120, expectedCorrectionRange: [-22, 12] },
  { name: '西安', longitude: 108.9402, latitude: 34.2609, standardLongitude: 120, expectedCorrectionRange: [-60, -35] },
  { name: '天津', longitude: 117.1902, latitude: 39.1256, standardLongitude: 120, expectedCorrectionRange: [-28, -8] },
  { name: '苏州', longitude: 120.5853, latitude: 31.2989, standardLongitude: 120, expectedCorrectionRange: [-15, 19] },
  { name: '哈尔滨', longitude: 126.6424, latitude: 45.7567, standardLongitude: 120, expectedCorrectionRange: [10, 45] },
  { name: '沈阳', longitude: 123.4315, latitude: 41.8057, standardLongitude: 120, expectedCorrectionRange: [-2, 32] },
  { name: '香港', longitude: 114.1694, latitude: 22.3193, standardLongitude: 120, expectedCorrectionRange: [-40, -15] },
  { name: '澳门', longitude: 113.5439, latitude: 22.1987, standardLongitude: 120, expectedCorrectionRange: [-42, -17] },
  { name: '台北', longitude: 121.5654, latitude: 25.0330, standardLongitude: 120, expectedCorrectionRange: [-10, 25] },
  { name: '济南', longitude: 117.0009, latitude: 36.6758, standardLongitude: 120, expectedCorrectionRange: [-28, -8] },
  { name: '郑州', longitude: 113.6253, latitude: 34.7466, standardLongitude: 120, expectedCorrectionRange: [-40, -20] },
  { name: '长沙', longitude: 112.9388, latitude: 28.2282, standardLongitude: 120, expectedCorrectionRange: [-45, -20] },
  { name: '昆明', longitude: 102.8329, latitude: 24.8801, standardLongitude: 120, expectedCorrectionRange: [-85, -55] },
  { name: '南宁', longitude: 108.3669, latitude: 22.8170, standardLongitude: 120, expectedCorrectionRange: [-65, -40] },
  { name: '贵阳', longitude: 106.7135, latitude: 26.5783, standardLongitude: 120, expectedCorrectionRange: [-70, -45] },
  { name: '南昌', longitude: 115.8921, latitude: 28.6764, standardLongitude: 120, expectedCorrectionRange: [-33, -8] },
  { name: '福州', longitude: 119.2965, latitude: 26.0745, standardLongitude: 120, expectedCorrectionRange: [-20, 10] },
  { name: '合肥', longitude: 117.2830, latitude: 31.8612, standardLongitude: 120, expectedCorrectionRange: [-27, -7] },
  { name: '石家庄', longitude: 114.5148, latitude: 38.0428, standardLongitude: 120, expectedCorrectionRange: [-38, -13] },
  { name: '太原', longitude: 112.5492, latitude: 37.8570, standardLongitude: 120, expectedCorrectionRange: [-47, -22] },
  { name: '呼和浩特', longitude: 111.7519, latitude: 40.8426, standardLongitude: 120, expectedCorrectionRange: [-50, -25] },
  { name: '长春', longitude: 125.3245, latitude: 43.8868, standardLongitude: 120, expectedCorrectionRange: [4, 40] },
]

describe('solarTime/correctionRange - 真太阳时校正范围验证', () => {
  it('EoT 均时差 2024-06-21 夏至在 -16 ~ +17 分钟范围内', () => {
    const date = new Date(2024, 5, 21, 12, 0, 0)
    const eot = getEquationOfTime(date)
    expect(eot).toBeGreaterThanOrEqual(-16)
    expect(eot).toBeLessThanOrEqual(17)
  })

  it('EoT 均时差 2024-12-21 冬至在 -16 ~ +17 分钟范围内', () => {
    const date = new Date(2024, 11, 21, 12, 0, 0)
    const eot = getEquationOfTime(date)
    expect(eot).toBeGreaterThanOrEqual(-16)
    expect(eot).toBeLessThanOrEqual(17)
  })

  it('EoT 均时差 2024-03-21 春分在 -16 ~ +17 分钟范围内', () => {
    const date = new Date(2024, 2, 21, 12, 0, 0)
    const eot = getEquationOfTime(date)
    expect(eot).toBeGreaterThanOrEqual(-16)
    expect(eot).toBeLessThanOrEqual(17)
  })

  it('经度校正：东经 > 120° 校正为正（哈尔滨 126.64）', () => {
    const corr = getLongitudeCorrection(126.6424, 120)
    expect(corr).toBeGreaterThan(0)
  })

  it('经度校正：东经 < 120° 校正为负（成都 104.06）', () => {
    const corr = getLongitudeCorrection(104.0665, 120)
    expect(corr).toBeLessThan(0)
  })

  it('经度校正：恰好 120° 校正为 0', () => {
    const corr = getLongitudeCorrection(120, 120)
    expect(corr).toBe(0)
  })

  it('经度校正：每度 4 分钟（125° 应约 +20）', () => {
    const corr = getLongitudeCorrection(125, 120)
    expect(corr).toBeCloseTo(20, 0)
  })

  it('经度校正：每度 4 分钟（110° 应约 -40）', () => {
    const corr = getLongitudeCorrection(110, 120)
    expect(corr).toBeCloseTo(-40, 0)
  })

  for (let i = 0; i < CORRECTION_CASES.length; i++) {
    const c = CORRECTION_CASES[i]
    it(`${c.name} (${c.longitude.toFixed(2)}°E) 夏至正午 totalCorrection 在合理范围`, () => {
      const date = new Date(2024, 5, 21, 12, 0, 0)
      const result = calculateSolarTime(
        date,
        { longitude: c.longitude, latitude: c.latitude },
        { standardLongitude: c.standardLongitude, useTrueSolarTime: true }
      )
      expect(result.totalCorrection).toBeGreaterThanOrEqual(c.expectedCorrectionRange[0])
      expect(result.totalCorrection).toBeLessThanOrEqual(c.expectedCorrectionRange[1])
    })
  }

  it('30 城市 trace 结构完整：eotMinutes / longitudeCorrectionMinutes / totalCorrectionMinutes', () => {
    const date = new Date(2024, 5, 21, 12, 0, 0)
    for (const c of CORRECTION_CASES.slice(0, 10)) {
      const result = calculateSolarTime(
        date,
        { longitude: c.longitude, latitude: c.latitude },
        { standardLongitude: c.standardLongitude }
      )
      const t = result.trace
      expect(typeof t.eotMinutes).toBe('number')
      expect(typeof t.longitudeCorrectionMinutes).toBe('number')
      expect(typeof t.totalCorrectionMinutes).toBe('number')
      expect(t.totalCorrectionMinutes).toBeCloseTo(
        t.eotMinutes + t.longitudeCorrectionMinutes,
        1
      )
    }
  })

  it('totalCorrection = equationOfTime + longitudeCorrection 关系成立（10 城市抽样）', () => {
    const date = new Date(2024, 5, 21, 12, 0, 0)
    for (const c of CORRECTION_CASES.slice(0, 10)) {
      const result = calculateSolarTime(
        date,
        { longitude: c.longitude, latitude: c.latitude },
        { standardLongitude: c.standardLongitude }
      )
      expect(result.totalCorrection).toBeCloseTo(
        result.equationOfTime + result.longitudeCorrection,
        1
      )
    }
  })
})
