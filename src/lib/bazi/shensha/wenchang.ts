import type { SixLines, HeavenlyStem, EarthlyBranch } from '../types'
import type { ShenShaInfo } from './types'

export type { ShenShaInfo }

const STEMS: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const WENCHANG_MAP: Record<number, number> = {
  0: 5,
  1: 6,
  2: 8,
  4: 8,
  3: 9,
  5: 9,
  6: 11,
  7: 0,
  8: 2,
  9: 3,
}

export function checkWenchang(sixLines: SixLines, dayGan: HeavenlyStem, _gender: string): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  const dayGanIdx = STEMS.indexOf(dayGan)
  const wenchangZhiIdx = WENCHANG_MAP[dayGanIdx]
  const wenchangZhi = BRANCHES[wenchangZhiIdx]

  const positions: string[] = []

  const allZhi = [
    { key: '年支', zhi: sixLines.year.zhi },
    { key: '月支', zhi: sixLines.month.zhi },
    { key: '日支', zhi: sixLines.day.zhi },
    { key: '时支', zhi: sixLines.hour.zhi },
  ]

  for (const { key, zhi } of allZhi) {
    if (zhi === wenchangZhi) {
      positions.push(key)
    }
  }

  result.push({
    name: '文昌贵人',
    inPosition: positions.length > 0,
    position: positions.length > 0 ? positions.join('、') : '无',
    description: '文昌贵人主聪明好学，文采出众，考试运佳，利于学业、考试、文艺创作。',
    reference: '甲乙巳午报君知，丙戊申宫丁己鸡，庚猪辛鼠壬逢虎，癸人见卯入云梯',
  })

  return result
}
