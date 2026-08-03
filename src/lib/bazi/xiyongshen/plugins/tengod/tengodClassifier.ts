import type {
  TenGodName,
  Wuxing,
  YinYang,
  TenGodClassifierInput,
  TenGodDistribution,
  TenGodPerPillarRecord,
  TenGodClassifierResult,
} from './types'
import { defaultTenGodCombinationEngine, type TenGodCombinationEngine } from './combinations/engine'
import { defaultTenGodRelationGraph, type TenGodRelationGraph } from './graph/relationGraph'
import { defaultTenGodKnowledgeDB, type TenGodKnowledgeDB } from './knowledge/tenGodKnowledge'

const ALL_TEN_GODS: TenGodName[] = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印']

export function ganToWuxing(g: string): Wuxing {
  switch (g) {
    case '甲': case '乙': return '木'
    case '丙': case '丁': return '火'
    case '戊': case '己': return '土'
    case '庚': case '辛': return '金'
    case '壬': case '癸': return '水'
    default: return '土'
  }
}

export function ganYinYang(g: string): YinYang {
  switch (g) {
    case '甲': case '丙': case '戊': case '庚': case '壬': return '阳'
    default: return '阴'
  }
}

export function wxRelation(
  me: Wuxing,
  target: Wuxing
): 'same' | 'producedByMe' | 'producesMe' | 'controlledByMe' | 'controlsMe' {
  const sheng: Record<Wuxing, Wuxing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const ke: Record<Wuxing, Wuxing> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
  if (me === target) return 'same'
  if (sheng[me] === target) return 'producedByMe'
  if (ke[me] === target) return 'controlledByMe'
  if (sheng[target] === me) return 'producesMe'
  if (ke[target] === me) return 'controlsMe'
  return 'same'
}

export function getTenGodOf(dayGan: string, targetWx: Wuxing, targetGan?: string): TenGodName {
  const meWx = ganToWuxing(dayGan)
  const meYY = ganYinYang(dayGan)
  const targetYY = targetGan ? ganYinYang(targetGan) : (meYY === '阳' ? '阴' : '阳')
  const rel = wxRelation(meWx, targetWx)
  const sameSex = meYY === targetYY
  switch (rel) {
    case 'same':
      return sameSex ? '比肩' : '劫财'
    case 'producedByMe':
      return sameSex ? '食神' : '伤官'
    case 'controlledByMe':
      return sameSex ? '偏财' : '正财'
    case 'controlsMe':
      return sameSex ? '七杀' : '正官'
    case 'producesMe':
      return sameSex ? '偏印' : '正印'
  }
}

interface CangGanEntry {
  gan: string
  wx: Wuxing
  benQi?: boolean
  remainder?: boolean
}

const DEFAULT_CANG_GAN_TABLE: Record<string, CangGanEntry[]> = {
  子: [{ gan: '癸', wx: '水', benQi: true }],
  丑: [{ gan: '己', wx: '土', benQi: true }, { gan: '癸', wx: '水' }, { gan: '辛', wx: '金', remainder: true }],
  寅: [{ gan: '甲', wx: '木', benQi: true }, { gan: '丙', wx: '火' }, { gan: '戊', wx: '土', remainder: true }],
  卯: [{ gan: '乙', wx: '木', benQi: true }],
  辰: [{ gan: '戊', wx: '土', benQi: true }, { gan: '乙', wx: '木' }, { gan: '癸', wx: '水', remainder: true }],
  巳: [{ gan: '丙', wx: '火', benQi: true }, { gan: '庚', wx: '金' }, { gan: '戊', wx: '土', remainder: true }],
  午: [{ gan: '丁', wx: '火', benQi: true }, { gan: '己', wx: '土', remainder: true }],
  未: [{ gan: '己', wx: '土', benQi: true }, { gan: '丁', wx: '火' }, { gan: '乙', wx: '木', remainder: true }],
  申: [{ gan: '庚', wx: '金', benQi: true }, { gan: '壬', wx: '水' }, { gan: '戊', wx: '土', remainder: true }],
  酉: [{ gan: '辛', wx: '金', benQi: true }],
  戌: [{ gan: '戊', wx: '土', benQi: true }, { gan: '辛', wx: '金' }, { gan: '丁', wx: '火', remainder: true }],
  亥: [{ gan: '壬', wx: '水', benQi: true }, { gan: '甲', wx: '木', remainder: true }],
}

function emptyPerGod(): Record<TenGodName, number> {
  const r = {} as Record<TenGodName, number>
  ALL_TEN_GODS.forEach(g => r[g] = 0)
  return r
}

const PILLAR_POS: Array<TenGodPerPillarRecord['position']> = [
  '年干', '月干', '日干', '时干',
]
const ZHI_POS: Array<TenGodPerPillarRecord['position']> = [
  '年支本气', '月支本气', '日支本气', '时支本气',
]
const GAN_WEIGHT = 1.0
const ZHI_BENQI_WEIGHT = 1.0
const ZHI_ZHONGQI_WEIGHT = 0.5
const ZHI_YUQI_WEIGHT = 0.3

export class TenGodClassifier {
  constructor(
    private combo: TenGodCombinationEngine = defaultTenGodCombinationEngine,
    private graph: TenGodRelationGraph = defaultTenGodRelationGraph,
    private knowledge: TenGodKnowledgeDB = defaultTenGodKnowledgeDB
  ) {}

  computeDistribution(input: TenGodClassifierInput): TenGodDistribution {
    const perGod = emptyPerGod()
    const perGodW = emptyPerGod()
    const perColumn: TenGodPerPillarRecord[] = []
    const tianGanFlags: Partial<Record<TenGodName, boolean>> = {}
    const hasMonthBenQi: Partial<Record<TenGodName, boolean>> = {}

    const fourPillars = input.fourPillars
    const cangGanTable = DEFAULT_CANG_GAN_TABLE

    for (let i = 0; i < 4; i++) {
      const pillar = fourPillars[i]
      if (!pillar) continue
      const { gan, zhi } = pillar
      const ganWx = pillar.ganWx ?? ganToWuxing(gan)
      const ganTG = getTenGodOf(input.dayGan, ganWx, gan)
      const ganWeight = GAN_WEIGHT
      perGod[ganTG]++
      perGodW[ganTG] += ganWeight
      tianGanFlags[ganTG] = true
      perColumn.push({
        pillar: i,
        position: PILLAR_POS[i],
        ganOrZhi: gan,
        tenGod: ganTG,
        wx: ganWx,
        weight: ganWeight,
      })
      const cangList = cangGanTable[zhi] || []
      for (let j = 0; j < cangList.length; j++) {
        const cg = cangList[j]
        const cgTG = getTenGodOf(input.dayGan, cg.wx, cg.gan)
        let cgWt = ZHI_YUQI_WEIGHT
        let pos: TenGodPerPillarRecord['position'] = '藏干余气'
        if (cg.benQi) {
          cgWt = ZHI_BENQI_WEIGHT
          pos = ZHI_POS[i]
          if (i === 1) {
            hasMonthBenQi[cgTG] = true
          }
        } else if (j === 1 && !cg.remainder) {
          cgWt = ZHI_ZHONGQI_WEIGHT
        }
        perGod[cgTG]++
        perGodW[cgTG] += cgWt
        perColumn.push({
          pillar: i,
          position: pos,
          ganOrZhi: `${zhi}藏${cg.gan}`,
          tenGod: cgTG,
          wx: cg.wx,
          weight: cgWt,
        })
      }
    }

    const totalCount = Object.values(perGod).reduce((s, n) => s + n, 0)
    const sortedByW = [...ALL_TEN_GODS].sort((a, b) => perGodW[b] - perGodW[a])
    const threshold = Math.max(2, totalCount > 0 ? Math.ceil(totalCount / 6) : 2)
    const dominantGods = sortedByW.filter(g => perGod[g] >= threshold).slice(0, 5)
    const weakGods = sortedByW.filter(g => perGod[g] <= 1).slice(-5)

    return {
      perGod,
      perGodWeighted: perGodW,
      perColumn,
      tianGanFlags,
      dominantGods: dominantGods.length > 0 ? dominantGods : sortedByW.slice(0, 3),
      weakGods: weakGods.length > 0 ? weakGods : sortedByW.slice(-3),
      totalCount,
      hasMonthZhiBenQi: hasMonthBenQi,
    }
  }

  classify(input: TenGodClassifierInput): TenGodClassifierResult {
    const dist = this.computeDistribution(input)
    const verdicts = this.combo.detect(input, dist)
    const favorable = this.combo.getFavorable(verdicts)
    const unfavorable = this.combo.getUnfavorable(verdicts)

    const values = Object.values(dist.perGod)
    const mean = values.reduce((s, n) => s + n, 0) / values.length || 1
    const variance = values.reduce((s, n) => s + (n - mean) ** 2, 0) / values.length
    const sd = Math.sqrt(variance) / mean
    let balanceLevel: TenGodClassifierResult['balanceLevel']
    if (sd < 0.2) balanceLevel = '极平衡'
    else if (sd < 0.5) balanceLevel = '平衡'
    else if (sd < 0.9) balanceLevel = '偏倾'
    else balanceLevel = '极偏倾'

    const wangThreshold = Math.max(2, Math.ceil(dist.totalCount / 5))
    const wangGods = ALL_TEN_GODS.filter(g => dist.perGod[g] >= wangThreshold)
    const weakGods = ALL_TEN_GODS.filter(g => dist.perGod[g] <= 1)

    const patterns: string[] = []
    verdicts.filter(v => v.satisfied).slice(0, 5).forEach(v => patterns.push(v.name))
    dist.dominantGods.slice(0, 3).forEach(g => patterns.push(`${g}旺`))

    return {
      distribution: dist,
      combinationVerdicts: verdicts,
      favorableCombinations: favorable,
      unfavorableCombinations: unfavorable,
      wangGods: wangGods.length > 0 ? wangGods : dist.dominantGods,
      weakGods: weakGods.length > 0 ? weakGods : dist.weakGods,
      balanceLevel,
      patterns,
    }
  }
}

export const defaultTenGodClassifier = new TenGodClassifier()

export { DEFAULT_CANG_GAN_TABLE, ALL_TEN_GODS }
