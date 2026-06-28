import type { SixLines, GanZhi, EarthlyBranch } from '../types'
import type { ShenShaInfo } from './types'

export type { ShenShaInfo }

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

function getKongwangZhis(ganzhi: GanZhi): EarthlyBranch[] {
  const ganIdx = STEMS.indexOf(ganzhi.gan)
  const zhiIdx = BRANCHES.indexOf(ganzhi.zhi)

  const offset = (zhiIdx - ganIdx + 12) % 12

  const kongwang1 = BRANCHES[(offset + 10) % 12]
  const kongwang2 = BRANCHES[(offset + 11) % 12]

  return [kongwang1, kongwang2]
}

export function checkKongwang(sixLines: SixLines, _dayGan: string, _gender: string): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  const dayKongwang = getKongwangZhis(sixLines.day)
  const yearKongwang = getKongwangZhis(sixLines.year)

  const dayPositions: string[] = []
  const yearPositions: string[] = []

  const allZhi = [
    { key: '年支', zhi: sixLines.year.zhi },
    { key: '月支', zhi: sixLines.month.zhi },
    { key: '日支', zhi: sixLines.day.zhi },
    { key: '时支', zhi: sixLines.hour.zhi },
  ]

  for (const { key, zhi } of allZhi) {
    if (dayKongwang.includes(zhi)) {
      dayPositions.push(key)
    }
    if (yearKongwang.includes(zhi)) {
      yearPositions.push(key)
    }
  }

  result.push({
    name: '空亡（日柱查）',
    inPosition: dayPositions.length > 0,
    position: dayPositions.length > 0 ? `${dayKongwang.join('、')}：${dayPositions.join('、')}` : `空亡：${dayKongwang.join('、')}，四柱无空亡`,
    description: '空亡主空虚、不实、机遇缺失。落空之支力量减弱，吉则不吉，凶则不凶。',
    reference: '甲子旬空戌亥，甲戌旬空申酉，甲申旬空午未，甲午旬空辰巳，甲辰旬空寅卯，甲寅旬空子丑',
  })

  result.push({
    name: '空亡（年柱查）',
    inPosition: yearPositions.length > 0,
    position: yearPositions.length > 0 ? `${yearKongwang.join('、')}：${yearPositions.join('、')}` : `空亡：${yearKongwang.join('、')}，四柱无空亡`,
    description: '空亡主空虚、不实、机遇缺失。落空之支力量减弱，吉则不吉，凶则不凶。',
    reference: '甲子旬空戌亥，甲戌旬空申酉，甲申旬空午未，甲午旬空辰巳，甲辰旬空寅卯，甲寅旬空子丑',
  })

  return result
}
