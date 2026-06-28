import type { SixLines, HeavenlyStem, EarthlyBranch } from '../types'
import type { ShenShaInfo } from './types'

export type { ShenShaInfo }

const STEMS: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const TIANYI_MAP: Record<number, number[]> = {
  0: [1, 7],
  4: [1, 7],
  6: [1, 7],
  1: [0, 8],
  5: [0, 8],
  2: [11, 9],
  3: [11, 9],
  8: [3, 5],
  9: [3, 5],
  7: [6, 2],
}

export function checkTianyi(sixLines: SixLines, dayGan: HeavenlyStem, _gender: string): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  const dayGanIdx = STEMS.indexOf(dayGan)
  const tianyiZhiIndices = TIANYI_MAP[dayGanIdx] || []
  const tianyiZhis = tianyiZhiIndices.map(idx => BRANCHES[idx])

  const positions: string[] = []

  const allZhi = [
    { key: '年支', zhi: sixLines.year.zhi },
    { key: '月支', zhi: sixLines.month.zhi },
    { key: '日支', zhi: sixLines.day.zhi },
    { key: '时支', zhi: sixLines.hour.zhi },
  ]

  for (const { key, zhi } of allZhi) {
    if (tianyiZhis.includes(zhi)) {
      positions.push(key)
    }
  }

  result.push({
    name: '天乙贵人',
    inPosition: positions.length > 0,
    position: positions.length > 0 ? positions.join('、') : '无',
    description: '天乙贵人为最贵之神，主聪明智慧，遇困难时有贵人相助，逢凶化吉。',
    reference: '甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢马虎',
  })

  return result
}
