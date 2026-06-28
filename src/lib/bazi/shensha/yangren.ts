import type { SixLines, HeavenlyStem, EarthlyBranch } from '../types'
import type { ShenShaInfo } from './types'

export type { ShenShaInfo }

const STEMS: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const YANGREN_MAP: Record<number, number> = {
  0: 3,
  1: 4,
  2: 6,
  4: 6,
  3: 7,
  5: 7,
  6: 9,
  7: 10,
  8: 0,
  9: 1,
}

export function checkYangren(sixLines: SixLines, dayGan: HeavenlyStem, _gender: string): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  const dayGanIdx = STEMS.indexOf(dayGan)
  const yangrenZhiIdx = YANGREN_MAP[dayGanIdx]
  const yangrenZhi = BRANCHES[yangrenZhiIdx]

  const positions: string[] = []

  const allZhi = [
    { key: '年支', zhi: sixLines.year.zhi },
    { key: '月支', zhi: sixLines.month.zhi },
    { key: '日支', zhi: sixLines.day.zhi },
    { key: '时支', zhi: sixLines.hour.zhi },
  ]

  for (const { key, zhi } of allZhi) {
    if (zhi === yangrenZhi) {
      positions.push(key)
    }
  }

  result.push({
    name: '羊刃',
    inPosition: positions.length > 0,
    position: positions.length > 0 ? positions.join('、') : '无',
    description: '羊刃为刚猛之神，主性刚气傲，果断勇敢，但易冲动惹祸。身弱者喜之，身强者忌之。',
    reference: '甲羊刃在卯，乙在辰，丙戊在午，丁己在未，庚在酉，辛在戌，壬在子，癸在丑',
  })

  return result
}
