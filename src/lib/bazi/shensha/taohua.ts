import type { SixLines, EarthlyBranch } from '../types'
import type { ShenShaInfo } from './types'

export type { ShenShaInfo }

const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const TAOHUA_MAP: Record<number, number> = {
  2: 3,
  6: 3,
  10: 3,
  5: 6,
  9: 6,
  1: 6,
  8: 9,
  0: 9,
  4: 9,
  11: 0,
  3: 0,
  7: 0,
}

export function checkTaohua(sixLines: SixLines, _dayGan: string, _gender: string): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  const yearZhiIdx = BRANCHES.indexOf(sixLines.year.zhi)
  const dayZhiIdx = BRANCHES.indexOf(sixLines.day.zhi)

  const yearTaohuaZhi = BRANCHES[TAOHUA_MAP[yearZhiIdx]]
  const dayTaohuaZhi = BRANCHES[TAOHUA_MAP[dayZhiIdx]]

  const yearPositions: string[] = []
  const dayPositions: string[] = []

  const allZhi = [
    { key: '年支', zhi: sixLines.year.zhi },
    { key: '月支', zhi: sixLines.month.zhi },
    { key: '日支', zhi: sixLines.day.zhi },
    { key: '时支', zhi: sixLines.hour.zhi },
  ]

  for (const { key, zhi } of allZhi) {
    if (zhi === yearTaohuaZhi) {
      yearPositions.push(key)
    }
    if (zhi === dayTaohuaZhi) {
      dayPositions.push(key)
    }
  }

  result.push({
    name: '桃花煞（年支查）',
    inPosition: yearPositions.length > 0,
    position: yearPositions.length > 0 ? yearPositions.join('、') : '无',
    description: '桃花煞又称咸池，主情感、人缘、艺术才华。命带桃花者，相貌俊美，人缘好，感情丰富。',
    reference: '亥卯未在子，寅午戌在卯，巳酉丑在午，申子辰在酉',
  })

  result.push({
    name: '桃花煞（日支查）',
    inPosition: dayPositions.length > 0,
    position: dayPositions.length > 0 ? dayPositions.join('、') : '无',
    description: '桃花煞又称咸池，主情感、人缘、艺术才华。命带桃花者，相貌俊美，人缘好，感情丰富。',
    reference: '亥卯未在子，寅午戌在卯，巳酉丑在午，申子辰在酉',
  })

  return result
}
