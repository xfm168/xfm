import type { SixLines, EarthlyBranch } from '../types'
import type { ShenShaInfo } from './types'

export type { ShenShaInfo }

const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export function checkHongluan(sixLines: SixLines, _dayGan: string, _gender: string): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  const yearZhiIdx = BRANCHES.indexOf(sixLines.year.zhi)

  const hongluanIdx = (yearZhiIdx + 3) % 12
  const tianxiIdx = (yearZhiIdx + 9) % 12

  const hongluanZhi = BRANCHES[hongluanIdx]
  const tianxiZhi = BRANCHES[tianxiIdx]

  const hongluanPositions: string[] = []
  const tianxiPositions: string[] = []

  const allZhi = [
    { key: '年支', zhi: sixLines.year.zhi },
    { key: '月支', zhi: sixLines.month.zhi },
    { key: '日支', zhi: sixLines.day.zhi },
    { key: '时支', zhi: sixLines.hour.zhi },
  ]

  for (const { key, zhi } of allZhi) {
    if (zhi === hongluanZhi) {
      hongluanPositions.push(key)
    }
    if (zhi === tianxiZhi) {
      tianxiPositions.push(key)
    }
  }

  result.push({
    name: '红鸾',
    inPosition: hongluanPositions.length > 0,
    position: hongluanPositions.length > 0 ? hongluanPositions.join('、') : '无',
    description: '红鸾主婚姻喜事，命中带红鸾者，感情顺利，易遇良缘，婚姻美满。',
    reference: '年支顺数第三位',
  })

  result.push({
    name: '天喜',
    inPosition: tianxiPositions.length > 0,
    position: tianxiPositions.length > 0 ? tianxiPositions.join('、') : '无',
    description: '天喜主喜庆之事，与红鸾相对，命中带天喜者，喜事临门，人缘佳。',
    reference: '年支逆数第七位（对冲红鸾）',
  })

  return result
}
