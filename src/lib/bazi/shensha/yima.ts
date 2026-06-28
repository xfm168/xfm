import type { SixLines, EarthlyBranch } from '../types'
import type { ShenShaInfo } from './types'

export type { ShenShaInfo }

const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const YIMA_MAP: Record<number, number> = {
  8: 2,
  0: 2,
  4: 2,
  2: 8,
  6: 8,
  10: 8,
  5: 11,
  9: 11,
  1: 11,
  11: 5,
  3: 5,
  7: 5,
}

export function checkYima(sixLines: SixLines, _dayGan: string, _gender: string): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  const yearZhiIdx = BRANCHES.indexOf(sixLines.year.zhi)
  const dayZhiIdx = BRANCHES.indexOf(sixLines.day.zhi)

  const yearYimaZhi = BRANCHES[YIMA_MAP[yearZhiIdx]]
  const dayYimaZhi = BRANCHES[YIMA_MAP[dayZhiIdx]]

  const yearPositions: string[] = []
  const dayPositions: string[] = []

  const allZhi = [
    { key: '年支', zhi: sixLines.year.zhi },
    { key: '月支', zhi: sixLines.month.zhi },
    { key: '日支', zhi: sixLines.day.zhi },
    { key: '时支', zhi: sixLines.hour.zhi },
  ]

  for (const { key, zhi } of allZhi) {
    if (zhi === yearYimaZhi) {
      yearPositions.push(key)
    }
    if (zhi === dayYimaZhi) {
      dayPositions.push(key)
    }
  }

  result.push({
    name: '驿马（年支查）',
    inPosition: yearPositions.length > 0,
    position: yearPositions.length > 0 ? yearPositions.join('、') : '无',
    description: '驿马主走动、变动、旅行、升迁。命中带驿马者，性格好动，事业多变动，适合外出发展。',
    reference: '申子辰马在寅，寅午戌马在申，巳酉丑马在亥，亥卯未马在巳',
  })

  result.push({
    name: '驿马（日支查）',
    inPosition: dayPositions.length > 0,
    position: dayPositions.length > 0 ? dayPositions.join('、') : '无',
    description: '驿马主走动、变动、旅行、升迁。命中带驿马者，性格好动，事业多变动，适合外出发展。',
    reference: '申子辰马在寅，寅午戌马在申，巳酉丑马在亥，亥卯未马在巳',
  })

  return result
}
