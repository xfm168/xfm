import type { SixLines, FiveElement, HeavenlyStem, EarthlyBranch, CangGan, WuXingWangShuai } from './types'
import { getStemElement, getBranchElement, WANG_SHUAI_TABLE } from '@/lib/core'
import { getChangSheng } from './changsheng'

export interface ElementPowerDetail {
  element: FiveElement
  total: number
  percentage: number
  fromStems: number
  fromMonthBen: number
  fromMonthZhong: number
  fromMonthYao: number
  fromOtherBen: number
  fromOtherZhong: number
  fromOtherYao: number
  fromTongGen: number
  wangShuai: WuXingWangShuai
}

export interface FiveElementPowerResult {
  elements: ElementPowerDetail[]
  sortedByPower: FiveElement[]
  dominant: FiveElement
  weakest: FiveElement
  totalScore: number
  mostWang: FiveElement
  mostShuai: FiveElement
  // 旺衰三得
  deLing: boolean
  deDi: boolean
  deShi: boolean
  deLingScore: number
  deDiScore: number
  deShiScore: number
  // 十二长生状态
  changShengStates: Record<string, { zhi: string; state: string; bonus: number }>
  // 地支合局
  heJu: string[]
}

const CANG_GAN_TABLE: Record<string, { ben: string; zhong: string | null; yao: string | null }> = {
  子: { ben: '癸', zhong: null, yao: null },
  丑: { ben: '己', zhong: '辛', yao: '癸' },
  寅: { ben: '甲', zhong: '丙', yao: '戊' },
  卯: { ben: '乙', zhong: null, yao: null },
  辰: { ben: '戊', zhong: '乙', yao: '癸' },
  巳: { ben: '丙', zhong: '庚', yao: '戊' },
  午: { ben: '丁', zhong: '己', yao: null },
  未: { ben: '己', zhong: '丁', yao: '乙' },
  申: { ben: '庚', zhong: '壬', yao: '戊' },
  酉: { ben: '辛', zhong: null, yao: null },
  戌: { ben: '戊', zhong: '辛', yao: '丁' },
  亥: { ben: '壬', zhong: '甲', yao: null },
}

export function calculateFiveElementPower(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
): FiveElementPowerResult {
  const elements: FiveElement[] = ['木', '火', '土', '金', '水']
  const monthZhi = sixLines.month.zhi as EarthlyBranch
  const monthElement = getBranchElement(monthZhi)
  const dayElement = getStemElement(dayGan)

  const cangGanData: Record<string, { ben: string; zhong: string | null; yao: string | null }> = {}
  const pillars = [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]
  for (const p of pillars) {
    cangGanData[p.zhi] = CANG_GAN_TABLE[p.zhi] || { ben: '', zhong: null, yao: null }
  }

  const scores: Record<FiveElement, {
    fromStems: number
    fromMonthBen: number
    fromMonthZhong: number
    fromMonthYao: number
    fromOtherBen: number
    fromOtherZhong: number
    fromOtherYao: number
    fromTongGen: number
    total: number
  }> = {} as any

  for (const el of elements) {
    scores[el] = {
      fromStems: 0,
      fromMonthBen: 0,
      fromMonthZhong: 0,
      fromMonthYao: 0,
      fromOtherBen: 0,
      fromOtherZhong: 0,
      fromOtherYao: 0,
      fromTongGen: 0,
      total: 0,
    }
  }

  for (const pillar of pillars) {
    const ganEl = getStemElement(pillar.gan as HeavenlyStem)
    scores[ganEl].fromStems += 10
  }

  const monthCangGan = cangGanData[monthZhi]
  if (monthCangGan) {
    const benEl = getStemElement(monthCangGan.ben as HeavenlyStem)
    scores[benEl].fromMonthBen += 20
    if (monthCangGan.zhong) {
      const zhongEl = getStemElement(monthCangGan.zhong as HeavenlyStem)
      scores[zhongEl].fromMonthZhong += 10
    }
    if (monthCangGan.yao) {
      const yaoEl = getStemElement(monthCangGan.yao as HeavenlyStem)
      scores[yaoEl].fromMonthYao += 5
    }
  }

  for (const pillar of pillars) {
    if (pillar.zhi === monthZhi) continue
    const cangGan = cangGanData[pillar.zhi]
    if (!cangGan) continue

    const benEl = getStemElement(cangGan.ben as HeavenlyStem)
    scores[benEl].fromOtherBen += 6
    if (cangGan.zhong) {
      const zhongEl = getStemElement(cangGan.zhong as HeavenlyStem)
      scores[zhongEl].fromOtherZhong += 3
    }
    if (cangGan.yao) {
      const yaoEl = getStemElement(cangGan.yao as HeavenlyStem)
      scores[yaoEl].fromOtherYao += 1
    }
  }

  for (const pillar of pillars) {
    const cangGan = cangGanData[pillar.zhi]
    if (!cangGan) continue

    if (getStemElement(cangGan.ben as HeavenlyStem) === dayElement) {
      scores[dayElement].fromTongGen += 10
    } else if (cangGan.zhong && getStemElement(cangGan.zhong as HeavenlyStem) === dayElement) {
      scores[dayElement].fromTongGen += 5
    } else if (cangGan.yao && getStemElement(cangGan.yao as HeavenlyStem) === dayElement) {
      scores[dayElement].fromTongGen += 2
    }
  }

  let totalScore = 0
  for (const el of elements) {
    const s = scores[el]
    s.total = s.fromStems
      + s.fromMonthBen + s.fromMonthZhong + s.fromMonthYao
      + s.fromOtherBen + s.fromOtherZhong + s.fromOtherYao
      + s.fromTongGen
    totalScore += s.total
  }

  const elementDetails: ElementPowerDetail[] = elements.map(el => {
    const s = scores[el]
    const wangShuai = WANG_SHUAI_TABLE[monthElement][el] as WuXingWangShuai
    return {
      element: el,
      total: s.total,
      percentage: totalScore > 0 ? Math.round((s.total / totalScore) * 100) : 0,
      fromStems: s.fromStems,
      fromMonthBen: s.fromMonthBen,
      fromMonthZhong: s.fromMonthZhong,
      fromMonthYao: s.fromMonthYao,
      fromOtherBen: s.fromOtherBen,
      fromOtherZhong: s.fromOtherZhong,
      fromOtherYao: s.fromOtherYao,
      fromTongGen: s.fromTongGen,
      wangShuai,
    }
  })

  const sortedByPower = [...elements].sort((a, b) => scores[b].total - scores[a].total)
  const dominant = sortedByPower[0]
  const weakest = sortedByPower[sortedByPower.length - 1]

  // ===== 十二长生力量加成 =====
  const CHANG_SHENG_BONUS: Record<string, number> = {
    '帝旺': 15, '临官': 12, '长生': 10, '冠带': 8,
    '养': 5, '胎': 3, '沐浴': 0,
    '衰': -5, '病': -8, '死': -10, '墓': -10, '绝': -12,
  }
  const changShengStates: Record<string, { zhi: string; state: string; bonus: number }> = {}
  for (const pillar of pillars) {
    const state = getChangSheng(dayGan as HeavenlyStem, pillar.zhi as EarthlyBranch)
    const bonus = CHANG_SHENG_BONUS[state] || 0
    changShengStates[pillar.zhi] = { zhi: pillar.zhi, state, bonus }
    if (bonus !== 0) {
      scores[dayElement].total += bonus
      totalScore += bonus
    }
  }

  // ===== 地支合局检测 =====
  const zhiList = pillars.map(p => p.zhi)
  const heJu: string[] = []
  const SAN_HE: Record<string, EarthlyBranch[]> = {
    '水局': ['申', '子', '辰'] as EarthlyBranch[],
    '火局': ['寅', '午', '戌'] as EarthlyBranch[],
    '金局': ['巳', '酉', '丑'] as EarthlyBranch[],
    '木局': ['亥', '卯', '未'] as EarthlyBranch[],
  }
  for (const [juName, required] of Object.entries(SAN_HE)) {
    const matched = required.filter(z => zhiList.includes(z)).length
    if (matched >= 2) {
      heJu.push(`${juName}(${matched}/3)`)
      // 半合或三合增强对应五行
      const heElement: Record<string, FiveElement> = { '水局': '水', '火局': '火', '金局': '金', '木局': '木' }
      const el = heElement[juName]
      if (el) {
        const bonus = matched >= 3 ? 15 : 8
        scores[el].total += bonus
        totalScore += bonus
      }
    }
  }

  // 重新计算百分比
  for (const el of elements) {
    const detail = elementDetails.find(d => d.element === el)
    if (detail) {
      detail.total = scores[el].total
      detail.percentage = totalScore > 0 ? Math.round((scores[el].total / totalScore) * 100) : 0
    }
  }

  // ===== 得令/得地/得势计算 =====
  // 得令：月令五行与日主相同或相生
  const GENERATE: Record<FiveElement, FiveElement> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const isDeLing = monthElement === dayElement || GENERATE[monthElement] === dayElement
  const deLingScore = monthElement === dayElement ? 90 : GENERATE[monthElement] === dayElement ? 70 : 30

  // 得地：地支中有日主之根（本气/中气/余气）
  const dayRootCount = Object.values(changShengStates).filter(cs =>
    cs.state === '帝旺' || cs.state === '临官' || cs.state === '长生' || cs.state === '冠带'
  ).length
  const isDeDi = dayRootCount >= 1
  const deDiScore = Math.min(100, dayRootCount * 25 + (scores[dayElement].fromTongGen > 0 ? 20 : 0))

  // 得势：天干中同党数量（比肩、劫财、正印、偏印）
  const stems = pillars.map(p => p.gan)
  const SHENG_WO: Record<string, boolean> = {}
  for (const g of stems) {
    const el = getStemElement(g as HeavenlyStem)
    // 同党 = 同五行（比劫）或生我五行（印星）
    if (el === dayElement || GENERATE[el] === dayElement) {
      SHENG_WO[g] = true
    }
  }
  const tongDangCount = Object.keys(SHENG_WO).length
  const isDeShi = tongDangCount >= 2
  const deShiScore = Math.min(100, tongDangCount * 20 + (tongDangCount >= 3 ? 15 : 0))

  const wangOrder: WuXingWangShuai[] = ['旺', '相', '休', '囚', '死']
  const sortedByWangShuai = [...elements].sort((a, b) => {
    const wsA = WANG_SHUAI_TABLE[monthElement][a]
    const wsB = WANG_SHUAI_TABLE[monthElement][b]
    return wangOrder.indexOf(wsA as WuXingWangShuai) - wangOrder.indexOf(wsB as WuXingWangShuai)
  })
  const mostWang = sortedByWangShuai[0]
  const mostShuai = sortedByWangShuai[sortedByWangShuai.length - 1]

  return {
    elements: elementDetails,
    sortedByPower,
    dominant,
    weakest,
    totalScore,
    mostWang,
    mostShuai,
    deLing: isDeLing,
    deDi: isDeDi,
    deShi: isDeShi,
    deLingScore,
    deDiScore,
    deShiScore,
    changShengStates,
    heJu,
  }
}

export const ELEMENT_COLORS: Record<FiveElement, string> = {
  木: '#4a9c6d',
  火: '#d4573a',
  土: '#c4956a',
  金: '#d4af37',
  水: '#4a7ab8',
}

export const ELEMENT_LABELS: Record<FiveElement, string> = {
  木: '木',
  火: '火',
  土: '土',
  金: '金',
  水: '水',
}
