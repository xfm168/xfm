import type { SixLines, EarthlyBranch } from '../types'
import type { ShenShaInfo } from './types'

export type { ShenShaInfo }

const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 孤辰：亥子丑在寅，寅卯辰在巳，巳午未在申，申酉戌在亥
const GU_CHEN_MAP: Record<number, number> = {
  11: 2, // 亥 -> 寅
  0: 2,  // 子 -> 寅
  1: 2,  // 丑 -> 寅
  2: 5,  // 寅 -> 巳
  3: 5,  // 卯 -> 巳
  4: 5,  // 辰 -> 巳
  5: 8,  // 巳 -> 申
  6: 8,  // 午 -> 申
  7: 8,  // 未 -> 申
  8: 11, // 申 -> 亥
  9: 11, // 酉 -> 亥
  10: 11,// 戌 -> 亥
}

// 寡宿：亥子丑在戌，寅卯辰在丑，巳午未在辰，申酉戌在未
const GUA_SU_MAP: Record<number, number> = {
  11: 10, // 亥 -> 戌
  0: 10,  // 子 -> 戌
  1: 10,  // 丑 -> 戌
  2: 1,   // 寅 -> 丑
  3: 1,   // 卯 -> 丑
  4: 1,   // 辰 -> 丑
  5: 4,   // 巳 -> 辰
  6: 4,   // 午 -> 辰
  7: 4,   // 未 -> 辰
  8: 7,   // 申 -> 未
  9: 7,   // 酉 -> 未
  10: 7,  // 戌 -> 未
}

export function checkGuChenGuaSu(sixLines: SixLines, _dayGan: string, _gender: string): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  const yearZhiIdx = BRANCHES.indexOf(sixLines.year.zhi)

  const guChenZhi = BRANCHES[GU_CHEN_MAP[yearZhiIdx]]
  const guaSuZhi = BRANCHES[GUA_SU_MAP[yearZhiIdx]]

  const guChenPositions: string[] = []
  const guaSuPositions: string[] = []

  const allZhi = [
    { key: '年支', zhi: sixLines.year.zhi },
    { key: '月支', zhi: sixLines.month.zhi },
    { key: '日支', zhi: sixLines.day.zhi },
    { key: '时支', zhi: sixLines.hour.zhi },
  ]

  for (const { key, zhi } of allZhi) {
    if (zhi === guChenZhi) {
      guChenPositions.push(key)
    }
    if (zhi === guaSuZhi) {
      guaSuPositions.push(key)
    }
  }

  result.push({
    name: '孤辰',
    inPosition: guChenPositions.length > 0,
    position: guChenPositions.length > 0 ? guChenPositions.join('、') : '无',
    description: '孤辰主孤独，命带孤辰者性格孤僻，不易亲近，感情上较为冷淡，婚姻易有波折。',
    reference: '亥子丑在寅，寅卯辰在巳，巳午未在申，申酉戌在亥',
  })

  result.push({
    name: '寡宿',
    inPosition: guaSuPositions.length > 0,
    position: guaSuPositions.length > 0 ? guaSuPositions.join('、') : '无',
    description: '寡宿主寡居，命带寡宿者感情多磨难，易有分离之象，需用心经营婚姻。',
    reference: '亥子丑在戌，寅卯辰在丑，巳午未在辰，申酉戌在未',
  })

  return result
}
