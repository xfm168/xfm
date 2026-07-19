/**
 * useBaziCompare.ts — 八字命盘对比 Hook
 *
 * 从历史记录中选取两个命盘进行多维度对比：
 * - 四柱差异
 * - 五行差异
 * - 格局对比
 * - 十神对比
 * - 综合评分对比
 */

import { useState, useCallback } from 'react'
import type { BaZiChart, FiveElementCount, GanZhi } from '../lib/bazi'

// ============================================================
// 类型定义
// ============================================================

export interface PillarDifference {
  pillar: string              // '年柱' | '月柱' | '日柱' | '时柱'
  chart1: string              // 如 '甲子'
  chart2: string              // 如 '丙寅'
  ganDiff: boolean            // 天干是否不同
  zhiDiff: boolean           // 地支是否不同
}

export interface FiveElementDifference {
  element: string             // 五行名称
  chart1Count: number         // 命盘1的数量
  chart2Count: number         // 命盘2的数量
  diff: number                // 差值（正=命盘1多，负=命盘2多）
}

export interface GeJuComparison {
  chart1GeJu: string
  chart2GeJu: string
  similarity: number          // 0-100 相似度
  note: string                // 对比说明
}

export interface ShiShenComparison {
  shiShen: string             // 十神名称
  chart1Count: number
  chart2Count: number
  diff: number
}

export interface ScoreComparison {
  chart1Score: number
  chart2Score: number
  diff: number
  winner: 'chart1' | 'chart2' | 'tie'
}

export interface BaZiComparison {
  pillarDiffs: PillarDifference[]
  fiveElementDiffs: FiveElementDifference[]
  geJuComparison: GeJuComparison
  shiShenComparison: ShiShenComparison[]
  scoreComparison: ScoreComparison
  overallNote: string         // 综合评价
}

interface UseBaziCompareResult {
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  comparison: BaZiComparison | null
  compare: () => void
  clear: () => void
}

// ============================================================
// 对比逻辑
// ============================================================

const ELEMENT_ORDER: (keyof FiveElementCount)[] = ['木', '火', '土', '金', '水']

function comparePillars(c1: BaZiChart, c2: BaZiChart): PillarDifference[] {
  const s1 = c1.sixLines
  const s2 = c2.sixLines
  const pillars: { key: string; label: string; get1: () => GanZhi; get2: () => GanZhi }[] = [
    { key: 'year', label: '年柱', get1: () => s1.year, get2: () => s2.year },
    { key: 'month', label: '月柱', get1: () => s1.month, get2: () => s2.month },
    { key: 'day', label: '日柱', get1: () => s1.day, get2: () => s2.day },
    { key: 'hour', label: '时柱', get1: () => s1.hour, get2: () => s2.hour },
  ]

  return pillars.map(p => {
    const g1 = p.get1()
    const g2 = p.get2()
    return {
      pillar: p.label,
      chart1: `${g1.gan}${g1.zhi}`,
      chart2: `${g2.gan}${g2.zhi}`,
      ganDiff: g1.gan !== g2.gan,
      zhiDiff: g1.zhi !== g2.zhi,
    }
  })
}

function compareFiveElements(c1: BaZiChart, c2: BaZiChart): FiveElementDifference[] {
  return ELEMENT_ORDER.map(el => {
    const v1 = c1.fiveElementCount[el]
    const v2 = c2.fiveElementCount[el]
    return {
      element: el,
      chart1Count: v1,
      chart2Count: v2,
      diff: v1 - v2,
    }
  })
}

function compareGeJu(c1: BaZiChart, c2: BaZiChart): GeJuComparison {
  // 尝试从 analysis 字段提取格局信息
  const g1 = c1.analysis?.overall || '未知'
  const g2 = c2.analysis?.overall || '未知'

  // 简单相似度：根据日主元素和喜用神的重叠度
  let similarity = 30
  if (c1.dayMaster.dayGanElement === c2.dayMaster.dayGanElement) similarity += 20
  if (c1.xiYongShen.bestElement === c2.xiYongShen.bestElement) similarity += 20
  if (c1.xiYongShen.happiness === c2.xiYongShen.happiness) similarity += 15
  if (Math.abs(c1.overallScore - c2.overallScore) <= 10) similarity += 15
  similarity = Math.min(100, similarity)

  let note = ''
  if (similarity >= 80) note = '两盘命格高度相似，命运走向相近'
  else if (similarity >= 60) note = '两盘有较多共性，但也存在明显差异'
  else if (similarity >= 40) note = '两盘差异较大，各自命运轨迹不同'
  else note = '两盘命格截然不同，互补性强'

  return {
    chart1GeJu: g1,
    chart2GeJu: g2,
    similarity,
    note,
  }
}

function compareShiShen(c1: BaZiChart, c2: BaZiChart): ShiShenComparison[] {
  // 从日主的 relatedShens 统计十神分布
  const allShens: string[] = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '偏官', '正官', '偏印', '正印']

  // 收集两盘十神出现次数
  function countShiShen(chart: BaZiChart): Map<string, number> {
    const count = new Map<string, number>()
    const { sixLines, dayMaster } = chart
    // 检查所有天干对应的十神
    const gans = [sixLines.year.gan, sixLines.month.gan, sixLines.day.gan, sixLines.hour.gan]
    gans.forEach(gan => {
      if (gan === dayMaster.dayGan) return // 日主本身不算
      const shen = dayMaster.relatedShens[gan]
      if (shen) {
        count.set(shen, (count.get(shen) || 0) + 1)
      }
    })
    return count
  }

  const s1 = countShiShen(c1)
  const s2 = countShiShen(c2)

  return allShens.map(name => ({
    shiShen: name,
    chart1Count: s1.get(name) || 0,
    chart2Count: s2.get(name) || 0,
    diff: (s1.get(name) || 0) - (s2.get(name) || 0),
  }))
}

function compareScores(c1: BaZiChart, c2: BaZiChart): ScoreComparison {
  const diff = c1.overallScore - c2.overallScore
  return {
    chart1Score: c1.overallScore,
    chart2Score: c2.overallScore,
    diff,
    winner: diff > 0 ? 'chart1' : diff < 0 ? 'chart2' : 'tie',
  }
}

// ============================================================
// Hook
// ============================================================

const CHARTS_STORAGE_KEY = 'xuanfengmen_bazi_charts'

function loadChartsFromStorage(): BaZiChart[] {
  try {
    const raw = localStorage.getItem(CHARTS_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BaZiChart[]
  } catch {
    return []
  }
}

export function useBaziCompare(charts?: BaZiChart[]): UseBaziCompareResult {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [comparison, setComparison] = useState<BaZiComparison | null>(null)

  const compare = useCallback(() => {
    const allCharts = charts || loadChartsFromStorage()
    if (selectedIds.length !== 2) return

    const c1 = allCharts.find(c => String(c.createdAt) === selectedIds[0])
    const c2 = allCharts.find(c => String(c.createdAt) === selectedIds[1])
    if (!c1 || !c2) return

    const pillarDiffs = comparePillars(c1, c2)
    const fiveElementDiffs = compareFiveElements(c1, c2)
    const geJuComparison = compareGeJu(c1, c2)
    const shiShenComparison = compareShiShen(c1, c2)
    const scoreComparison = compareScores(c1, c2)

    // 综合评价
    const scoreGap = Math.abs(scoreComparison.diff)
    const pillarSameCount = pillarDiffs.filter(p => !p.ganDiff && !p.zhiDiff).length
    let overallNote = ''
    if (scoreGap <= 5 && pillarSameCount >= 3) {
      overallNote = '两盘命格极为相近，可谓"同命不同运"，细微差异可能带来不同人生轨迹。'
    } else if (scoreGap <= 15 && pillarSameCount >= 2) {
      overallNote = '两盘有较多共同点，在事业和感情方面可能有相似经历，但细节各有千秋。'
    } else if (scoreGap <= 30) {
      overallNote = '两盘各有优劣，互补性强。命盘A在性格上更突出，命盘B在运势上更占优势。'
    } else {
      overallNote = '两盘命格差异显著，性格、运势走向截然不同，属于完全不同的命理类型。'
    }

    setComparison({
      pillarDiffs,
      fiveElementDiffs,
      geJuComparison,
      shiShenComparison,
      scoreComparison,
      overallNote,
    })
  }, [selectedIds, charts])

  const clear = useCallback(() => {
    setSelectedIds([])
    setComparison(null)
  }, [])

  return {
    selectedIds,
    setSelectedIds,
    comparison,
    compare,
    clear,
  }
}
