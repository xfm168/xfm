import type { SixLines, EarthlyBranch } from '../types'
import type { ShenShaInfo } from './types'

export type { ShenShaInfo }

const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const JIESHA_MAP: Record<number, number> = {
  8: 5,
  0: 5,
  4: 5,
  11: 8,
  3: 8,
  7: 8,
  2: 11,
  6: 11,
  10: 11,
  5: 2,
  9: 2,
  1: 2,
}

export function checkJiesha(sixLines: SixLines, _dayGan: string, _gender: string): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  const yearZhiIdx = BRANCHES.indexOf(sixLines.year.zhi)
  const dayZhiIdx = BRANCHES.indexOf(sixLines.day.zhi)

  const yearJieshaZhi = BRANCHES[JIESHA_MAP[yearZhiIdx]]
  const dayJieshaZhi = BRANCHES[JIESHA_MAP[dayZhiIdx]]

  const yearPositions: string[] = []
  const dayPositions: string[] = []

  const allZhi = [
    { key: '年支', zhi: sixLines.year.zhi },
    { key: '月支', zhi: sixLines.month.zhi },
    { key: '日支', zhi: sixLines.day.zhi },
    { key: '时支', zhi: sixLines.hour.zhi },
  ]

  for (const { key, zhi } of allZhi) {
    if (zhi === yearJieshaZhi) {
      yearPositions.push(key)
    }
    if (zhi === dayJieshaZhi) {
      dayPositions.push(key)
    }
  }

  result.push({
    name: '劫煞（年支查）',
    inPosition: yearPositions.length > 0,
    position: yearPositions.length > 0 ? yearPositions.join('、') : '无',
    description: '劫煞主竞争、争夺、损耗。命中带劫煞者，性格刚强，易有争斗之事，财运易受损耗。',
    reference: '申子辰见巳，亥卯未见申，寅午戌见亥，巳酉丑见寅',
  })

  result.push({
    name: '劫煞（日支查）',
    inPosition: dayPositions.length > 0,
    position: dayPositions.length > 0 ? dayPositions.join('、') : '无',
    description: '劫煞主竞争、争夺、损耗。命中带劫煞者，性格刚强，易有争斗之事，财运易受损耗。',
    reference: '申子辰见巳，亥卯未见申，寅午戌见亥，巳酉丑见寅',
  })

  return result
}
