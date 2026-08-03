import type { GejuCategory, GejuName } from '../types'

export interface PatternPriorityMatrixEntry {
  category: GejuCategory
  categoryPriorityRank: number
  categoryRecommendedWeight: number
  conflictPreference: { over: GejuCategory[]; giveWayTo: GejuCategory[] }
  description: string
}

export interface PatternPriorityMatrixNameEntry {
  name: GejuName
  namePriorityRank: number
  nameRecommendedWeight: number
}

interface CategoryInput {
  category: GejuCategory
  categoryPriorityRank: number
  categoryRecommendedWeight: number
  over: GejuCategory[]
  giveWayTo: GejuCategory[]
  description: string
}

const CATEGORY_INPUTS: CategoryInput[] = [
  {
    category: 'yiqi',
    categoryPriorityRank: 1,
    categoryRecommendedWeight: 1.8,
    over: ['zhencong', 'jiacong', 'zhuanwang', 'huaqi', 'tiaohou', 'bingyao', 'tongguan', 'fuyi', 'zheng'],
    giveWayTo: [],
    description: '一气格：天元/地元一气。最稀有，优先级最高。四干同或四支同，气势纯一。',
  },
  {
    category: 'huaqi',
    categoryPriorityRank: 2,
    categoryRecommendedWeight: 1.7,
    over: ['zhencong', 'jiacong', 'zhuanwang', 'tiaohou', 'bingyao', 'tongguan', 'fuyi', 'zheng'],
    giveWayTo: ['yiqi'],
    description: '化气格：天干五合化气（甲己/乙庚/丙辛/丁壬/戊癸）。极稀有，气势变化极大。',
  },
  {
    category: 'zhuanwang',
    categoryPriorityRank: 3,
    categoryRecommendedWeight: 1.6,
    over: ['zhencong', 'jiacong', 'tiaohou', 'bingyao', 'tongguan', 'fuyi', 'zheng'],
    giveWayTo: ['yiqi', 'huaqi'],
    description: '专旺格：曲直/炎上/稼穑/从革/润下。五行专旺，只顺不可逆。',
  },
  {
    category: 'zhencong',
    categoryPriorityRank: 4,
    categoryRecommendedWeight: 1.4,
    over: ['jiacong', 'tiaohou', 'bingyao', 'tongguan', 'fuyi', 'zheng'],
    giveWayTo: ['yiqi', 'huaqi', 'zhuanwang'],
    description: '真从格：从财/从杀/从儿/从势/从旺。日主极弱无根无依，真从者大富贵。',
  },
  {
    category: 'jiacong',
    categoryPriorityRank: 5,
    categoryRecommendedWeight: 1.0,
    over: ['tiaohou', 'bingyao', 'tongguan', 'fuyi', 'zheng'],
    giveWayTo: ['yiqi', 'huaqi', 'zhuanwang', 'zhencong'],
    description: '假从格：假从财/假从杀/假从儿。有微根或一二印比，似从而非真从。',
  },
  {
    category: 'tiaohou',
    categoryPriorityRank: 6,
    categoryRecommendedWeight: 1.2,
    over: ['bingyao', 'tongguan', 'fuyi', 'zheng'],
    giveWayTo: ['yiqi', 'huaqi', 'zhuanwang', 'zhencong'],
    description: '调候格：冬用火暖/夏用水润。调候为八字第一急务，但遇特格让位于特格。',
  },
  {
    category: 'bingyao',
    categoryPriorityRank: 7,
    categoryRecommendedWeight: 0.9,
    over: ['tongguan', 'fuyi', 'zheng'],
    giveWayTo: ['yiqi', 'huaqi', 'zhuanwang', 'zhencong', 'jiacong', 'tiaohou'],
    description: '病药格：有偏旺之病，有克泄耗之药。去病为贵。',
  },
  {
    category: 'tongguan',
    categoryPriorityRank: 8,
    categoryRecommendedWeight: 0.8,
    over: ['fuyi', 'zheng'],
    giveWayTo: ['yiqi', 'huaqi', 'zhuanwang', 'zhencong', 'jiacong', 'tiaohou', 'bingyao'],
    description: '通关格：两神相战，中神和解。如金木相战取水通关。',
  },
  {
    category: 'fuyi',
    categoryPriorityRank: 9,
    categoryRecommendedWeight: 0.7,
    over: ['zheng'],
    giveWayTo: ['yiqi', 'huaqi', 'zhuanwang', 'zhencong', 'jiacong', 'tiaohou', 'bingyao', 'tongguan'],
    description: '扶抑格：旺则抑之，弱则扶之。八字正法，为多数命局所用。',
  },
  {
    category: 'zheng',
    categoryPriorityRank: 10,
    categoryRecommendedWeight: 0.5,
    over: [],
    giveWayTo: ['yiqi', 'huaqi', 'zhuanwang', 'zhencong', 'jiacong', 'tiaohou', 'bingyao', 'tongguan', 'fuyi'],
    description: '正格：正官/七杀/正印/偏印/正财/偏财/食神/伤官等月令取格。基础兜底格局。',
  },
]

const NAME_ENTRIES: PatternPriorityMatrixNameEntry[] = [
  { name: '一气-天元一气', namePriorityRank: 1, nameRecommendedWeight: 1.05 },
  { name: '一气-地元一气', namePriorityRank: 2, nameRecommendedWeight: 1.02 },

  { name: '化气-甲己化土', namePriorityRank: 3, nameRecommendedWeight: 1.04 },
  { name: '化气-乙庚化金', namePriorityRank: 4, nameRecommendedWeight: 1.03 },
  { name: '化气-丙辛化水', namePriorityRank: 5, nameRecommendedWeight: 1.03 },
  { name: '化气-丁壬化木', namePriorityRank: 6, nameRecommendedWeight: 1.02 },
  { name: '化气-戊癸化火', namePriorityRank: 7, nameRecommendedWeight: 1.02 },

  { name: '专旺-曲直格（木专旺）', namePriorityRank: 8, nameRecommendedWeight: 1.04 },
  { name: '专旺-炎上格（火专旺）', namePriorityRank: 9, nameRecommendedWeight: 1.03 },
  { name: '专旺-稼穑格（土专旺）', namePriorityRank: 10, nameRecommendedWeight: 1.03 },
  { name: '专旺-从革格（金专旺）', namePriorityRank: 11, nameRecommendedWeight: 1.02 },
  { name: '专旺-润下格（水专旺）', namePriorityRank: 12, nameRecommendedWeight: 1.02 },

  { name: '真从-从财格', namePriorityRank: 13, nameRecommendedWeight: 1.05 },
  { name: '真从-从杀格', namePriorityRank: 14, nameRecommendedWeight: 1.04 },
  { name: '真从-从儿格', namePriorityRank: 15, nameRecommendedWeight: 1.03 },
  { name: '真从-从势格', namePriorityRank: 16, nameRecommendedWeight: 0.98 },
  { name: '真从-从旺格', namePriorityRank: 17, nameRecommendedWeight: 0.97 },

  { name: '假从-假从财', namePriorityRank: 18, nameRecommendedWeight: 1.02 },
  { name: '假从-假从杀', namePriorityRank: 19, nameRecommendedWeight: 1.01 },
  { name: '假从-假从儿', namePriorityRank: 20, nameRecommendedWeight: 1.0 },

  { name: '调候格', namePriorityRank: 21, nameRecommendedWeight: 1.0 },

  { name: '正格-正官格', namePriorityRank: 22, nameRecommendedWeight: 1.08 },
  { name: '正格-七杀格', namePriorityRank: 23, nameRecommendedWeight: 1.06 },
  { name: '正格-正印格', namePriorityRank: 24, nameRecommendedWeight: 1.05 },
  { name: '正格-偏印格', namePriorityRank: 25, nameRecommendedWeight: 0.98 },
  { name: '正格-正财格', namePriorityRank: 26, nameRecommendedWeight: 1.04 },
  { name: '正格-偏财格', namePriorityRank: 27, nameRecommendedWeight: 1.02 },
  { name: '正格-食神格', namePriorityRank: 28, nameRecommendedWeight: 1.03 },
  { name: '正格-伤官格', namePriorityRank: 29, nameRecommendedWeight: 0.99 },

  { name: '病药格', namePriorityRank: 30, nameRecommendedWeight: 1.0 },

  { name: '通关格', namePriorityRank: 31, nameRecommendedWeight: 1.0 },

  { name: '扶抑格', namePriorityRank: 32, nameRecommendedWeight: 1.0 },
  { name: '未判明正格', namePriorityRank: 33, nameRecommendedWeight: 0.9 },

  // P1.1.1 新增：假从/专旺/化气 类格（偏门）
  { name: '假从-假从势', namePriorityRank: 34, nameRecommendedWeight: 0.85 },
  { name: '假从-假从旺', namePriorityRank: 35, nameRecommendedWeight: 0.82 },
  { name: '专旺-类从革', namePriorityRank: 36, nameRecommendedWeight: 0.9 },
  { name: '专旺-类润下', namePriorityRank: 37, nameRecommendedWeight: 0.9 },
  { name: '化气-类化土', namePriorityRank: 38, nameRecommendedWeight: 0.88 },
]

export class PatternPriorityMatrix {
  byCategory = new Map<GejuCategory, PatternPriorityMatrixEntry>()
  byName = new Map<GejuName, PatternPriorityMatrixNameEntry>()

  constructor() {
    for (const c of CATEGORY_INPUTS) {
      this.byCategory.set(c.category, {
        category: c.category,
        categoryPriorityRank: c.categoryPriorityRank,
        categoryRecommendedWeight: c.categoryRecommendedWeight,
        conflictPreference: { over: c.over, giveWayTo: c.giveWayTo },
        description: c.description,
      })
    }
    for (const n of NAME_ENTRIES) {
      this.byName.set(n.name, n)
    }
  }

  resolveConflict(
    a: { name: GejuName; category: GejuCategory; score: number },
    b: { name: GejuName; category: GejuCategory; score: number },
  ): { winner: 'A' | 'B' | 'TIE'; reason: string; weightedScoreA: number; weightedScoreB: number } {
    const catA = this.byCategory.get(a.category)
    const catB = this.byCategory.get(b.category)
    const nameA = this.byName.get(a.name)
    const nameB = this.byName.get(b.name)

    const catWtA = catA?.categoryRecommendedWeight ?? 1.0
    const catWtB = catB?.categoryRecommendedWeight ?? 1.0
    const nameWtA = nameA?.nameRecommendedWeight ?? 1.0
    const nameWtB = nameB?.nameRecommendedWeight ?? 1.0

    const weightedA = a.score * catWtA * nameWtA
    const weightedB = b.score * catWtB * nameWtB

    if (catA && catB.conflictPreference.over.includes(a.category)) {
      return { winner: 'B', reason: `类别${b.category}的conflictPreference.over包含${a.category}，B优先`, weightedScoreA: weightedA, weightedScoreB: weightedB }
    }
    if (catB && catA.conflictPreference.over.includes(b.category)) {
      return { winner: 'A', reason: `类别${a.category}的conflictPreference.over包含${b.category}，A优先`, weightedScoreA: weightedA, weightedScoreB: weightedB }
    }
    if (catA && catA.conflictPreference.giveWayTo.includes(b.category)) {
      return { winner: 'B', reason: `类别${a.category}的giveWayTo包含${b.category}，B优先`, weightedScoreA: weightedA, weightedScoreB: weightedB }
    }
    if (catB && catB.conflictPreference.giveWayTo.includes(a.category)) {
      return { winner: 'A', reason: `类别${b.category}的giveWayTo包含${a.category}，A优先`, weightedScoreA: weightedA, weightedScoreB: weightedB }
    }

    if (Math.abs(weightedA - weightedB) < 0.0001) {
      const rankA = nameA?.namePriorityRank ?? 99
      const rankB = nameB?.namePriorityRank ?? 99
      if (rankA < rankB) {
        return { winner: 'A', reason: `加权得分相同，A的namePriorityRank(${rankA})比B(${rankB})高，A优先`, weightedScoreA: weightedA, weightedScoreB: weightedB }
      } else if (rankB < rankA) {
        return { winner: 'B', reason: `加权得分相同，B的namePriorityRank(${rankB})比A(${rankA})高，B优先`, weightedScoreA: weightedA, weightedScoreB: weightedB }
      }
      return { winner: 'TIE', reason: '加权得分与优先级均相同，并列', weightedScoreA: weightedA, weightedScoreB: weightedB }
    }

    if (weightedA > weightedB) {
      return { winner: 'A', reason: `加权得分A(${weightedA.toFixed(2)}) > B(${weightedB.toFixed(2)})，A优先`, weightedScoreA: weightedA, weightedScoreB: weightedB }
    } else {
      return { winner: 'B', reason: `加权得分B(${weightedB.toFixed(2)}) > A(${weightedA.toFixed(2)})，B优先`, weightedScoreA: weightedA, weightedScoreB: weightedB }
    }
  }

  getCategoryWeight(cat: GejuCategory): number {
    return this.byCategory.get(cat)?.categoryRecommendedWeight ?? 1.0
  }

  getNameWeight(n: GejuName): number {
    return this.byName.get(n)?.nameRecommendedWeight ?? 1.0
  }

  list(): PatternPriorityMatrixEntry[] {
    const arr = Array.from(this.byCategory.values())
    arr.sort((a, b) => a.categoryPriorityRank - b.categoryPriorityRank)
    return arr
  }
}

export const defaultPatternPriorityMatrix = new PatternPriorityMatrix()
