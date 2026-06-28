import type { SixLines, EarthlyBranch } from '../types'
import type { ShenShaInfo } from './types'

export type { ShenShaInfo }

const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const HUAGAI_MAP: Record<number, number> = {
  2: 10,
  6: 10,
  10: 10,
  11: 7,
  3: 7,
  7: 7,
  8: 4,
  0: 4,
  4: 4,
  5: 1,
  9: 1,
  1: 1,
}

export function checkHuagai(sixLines: SixLines, _dayGan: string, _gender: string): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  const yearZhiIdx = BRANCHES.indexOf(sixLines.year.zhi)
  const dayZhiIdx = BRANCHES.indexOf(sixLines.day.zhi)

  const yearHuagaiZhi = BRANCHES[HUAGAI_MAP[yearZhiIdx]]
  const dayHuagaiZhi = BRANCHES[HUAGAI_MAP[dayZhiIdx]]

  const yearPositions: string[] = []
  const dayPositions: string[] = []

  const allZhi = [
    { key: '年支', zhi: sixLines.year.zhi },
    { key: '月支', zhi: sixLines.month.zhi },
    { key: '日支', zhi: sixLines.day.zhi },
    { key: '时支', zhi: sixLines.hour.zhi },
  ]

  for (const { key, zhi } of allZhi) {
    if (zhi === yearHuagaiZhi) {
      yearPositions.push(key)
    }
    if (zhi === dayHuagaiZhi) {
      dayPositions.push(key)
    }
  }

  result.push({
    name: '华盖（年支查）',
    inPosition: yearPositions.length > 0,
    position: yearPositions.length > 0 ? yearPositions.join('、') : '无',
    description: '华盖主艺术、宗教、玄学、孤独。命带华盖者，聪明好学，喜清静，有艺术天赋，但性格孤傲。',
    reference: '寅午戌见戌，亥卯未见未，申子辰见辰，巳酉丑见丑',
  })

  result.push({
    name: '华盖（日支查）',
    inPosition: dayPositions.length > 0,
    position: dayPositions.length > 0 ? dayPositions.join('、') : '无',
    description: '华盖主艺术、宗教、玄学、孤独。命带华盖者，聪明好学，喜清静，有艺术天赋，但性格孤傲。',
    reference: '寅午戌见戌，亥卯未见未，申子辰见辰，巳酉丑见丑',
  })

  return result
}
