import type { CombinationId, CombinationPriorityEntry } from '../types'

const PRIORITY_ENTRIES: CombinationPriorityEntry[] = [
  {
    id: 'shiShenZhiSha',
    name: '食神制杀',
    rank: 1,
    tier: 'top',
    baseWeight: 2.0,
    winsOver: ['caiZiQiSha', 'guanShaHunZa', 'biJieDuoCai', 'caiPoYin', 'caiYinLiangXian', 'biJieBangShen', 'shaCaiTongTou', 'shiShangJianGuan'],
    yieldsTo: [],
    note: '食神制杀为制化组合第一吉格，压制七杀凶性，化险为夷',
  },
  {
    id: 'shaYinXiangSheng',
    name: '杀印相生',
    rank: 2,
    tier: 'top',
    baseWeight: 1.9,
    winsOver: ['caiZiQiSha', 'guanShaHunZa', 'yinShaXiangZhan', 'shangGuanJianGuan', 'biJieDuoCai'],
    yieldsTo: ['shiShenZhiSha'],
    note: '七杀化印，杀权化恩，掌兵权之大格，位高权重',
  },
  {
    id: 'guanYinXiangSheng',
    name: '官印相生',
    rank: 3,
    tier: 'top',
    baseWeight: 1.7,
    winsOver: ['guanShaHunZa', 'shangGuanJianGuan', 'shiShangJianGuan', 'caiPoYin', 'yinShaXiangZhan'],
    yieldsTo: ['shiShenZhiSha', 'shaYinXiangSheng'],
    note: '官生印、印生身，清贵第一格，官印两全则功名显达',
  },
  {
    id: 'shiShangShengCai',
    name: '食伤生财',
    rank: 4,
    tier: 'top',
    baseWeight: 1.8,
    winsOver: ['biJieDuoCai', 'caiZiQiSha', 'xiaoShenDuoShi', 'caiYinLiangXian', 'shaCaiTongTou'],
    yieldsTo: ['shiShenZhiSha', 'shaYinXiangSheng', 'guanYinXiangSheng'],
    note: '食伤流通生财，财源滚滚，技艺致富之第一格',
  },
  {
    id: 'shangGuanJianGuan',
    name: '伤官见官',
    rank: 5,
    tier: 'top',
    baseWeight: 2.0,
    winsOver: ['caiYinLiangXian', 'biJieBangShen', 'shiShangJianGuan', 'biJieDuoCai'],
    yieldsTo: ['guanYinXiangSheng', 'yinShouHuShen'],
    note: '凶格之首，为祸百端，须印星解伤或财星通关方可消解',
  },
  {
    id: 'xiaoShenDuoShi',
    name: '枭神夺食',
    rank: 6,
    tier: 'top',
    baseWeight: 2.0,
    winsOver: ['caiYinLiangXian', 'biJieBangShen', 'shaCaiTongTou', 'shiShangJianGuan'],
    yieldsTo: ['yinShouHuShen'],
    note: '凶格之最，枭夺食则断福源，不贫则夭。正印护身可解枭神之恶',
  },
  {
    id: 'biJieDuoCai',
    name: '比劫夺财',
    rank: 7,
    tier: 'top',
    baseWeight: 2.0,
    winsOver: ['caiYinLiangXian', 'shaCaiTongTou', 'shiShangJianGuan'],
    yieldsTo: ['guanYinXiangSheng', 'shiShangShengCai'],
    note: '大凶格，破财损妻，家宅不宁。官杀制比劫、食伤通关可解',
  },
  {
    id: 'guanShaHunZa',
    name: '官杀混杂',
    rank: 8,
    tier: 'top',
    baseWeight: 1.9,
    winsOver: ['yinShaXiangZhan', 'caiYinLiangXian', 'biJieBangShen', 'shaCaiTongTou'],
    yieldsTo: ['guanYinXiangSheng', 'shaYinXiangSheng'],
    note: '凶格，官杀并见无去留，日主无所适从。印化官杀则解混杂',
  },
  {
    id: 'caiGuanShuangMei',
    name: '财官双美',
    rank: 9,
    tier: 'mid',
    baseWeight: 1.5,
    winsOver: ['caiYinLiangXian', 'biJieBangShen', 'yinShaXiangZhan'],
    yieldsTo: ['guanYinXiangSheng', 'shiShenZhiSha', 'shaYinXiangSheng', 'shiShangShengCai'],
    note: '功名吉格，财生官旺，富贵双全，但次于官印相生之纯粹',
  },
  {
    id: 'caiZiQiSha',
    name: '财滋七杀',
    rank: 10,
    tier: 'mid',
    baseWeight: 1.5,
    winsOver: ['caiYinLiangXian', 'biJieBangShen', 'shiShangJianGuan', 'shaCaiTongTou'],
    yieldsTo: ['shiShenZhiSha', 'shaYinXiangSheng'],
    note: '凶格，财助七杀攻身更急。食神制杀或杀印相生为救',
  },
  {
    id: 'yinShouHuShen',
    name: '印绶护身',
    rank: 11,
    tier: 'mid',
    baseWeight: 1.4,
    winsOver: ['xiaoShenDuoShi', 'shangGuanJianGuan', 'caiPoYin', 'yinShaXiangZhan'],
    yieldsTo: ['guanYinXiangSheng', 'shaYinXiangSheng', 'shiShenZhiSha', 'caiGuanShuangMei'],
    note: '帮身吉格，印星护身逢凶化吉，并可解枭神夺食、伤官见官等凶格',
  },
  {
    id: 'caiPoYin',
    name: '财破印',
    rank: 12,
    tier: 'mid',
    baseWeight: 1.6,
    winsOver: ['caiYinLiangXian', 'biJieBangShen', 'shaCaiTongTou', 'shiShangJianGuan'],
    yieldsTo: ['guanYinXiangSheng', 'yinShouHuShen'],
    note: '凶格，财坏印则学业不继、文书不利。官杀通关财官印可解',
  },
  {
    id: 'yinShaXiangZhan',
    name: '印杀相战',
    rank: 13,
    tier: 'mid',
    baseWeight: 1.5,
    winsOver: ['caiYinLiangXian', 'biJieBangShen', 'shiShangJianGuan', 'shaCaiTongTou'],
    yieldsTo: ['shaYinXiangSheng', 'guanYinXiangSheng', 'yinShouHuShen'],
    note: '凶格，印杀两不相让则是非不断。杀印相生则化战为和',
  },
  {
    id: 'shiShangJianGuan',
    name: '食伤见官',
    rank: 14,
    tier: 'low',
    baseWeight: 1.2,
    winsOver: ['caiYinLiangXian', 'shaCaiTongTou'],
    yieldsTo: ['shangGuanJianGuan', 'guanYinXiangSheng', 'yinShouHuShen', 'caiGuanShuangMei'],
    note: '次凶格，食伤克官虽轻于伤官见官，仍主是非口舌',
  },
  {
    id: 'caiYinLiangXian',
    name: '财印两现',
    rank: 15,
    tier: 'low',
    baseWeight: 0.6,
    winsOver: [],
    yieldsTo: ['guanYinXiangSheng', 'caiPoYin', 'yinShouHuShen', 'caiGuanShuangMei', 'biJieBangShen'],
    note: '轻格，财印并见成败多端，有官通关则吉，无通关则战',
  },
  {
    id: 'biJieBangShen',
    name: '比劫帮身',
    rank: 16,
    tier: 'low',
    baseWeight: 1.0,
    winsOver: ['caiYinLiangXian'],
    yieldsTo: ['yinShouHuShen', 'shiShenZhiSha', 'caiGuanShuangMei', 'guanYinXiangSheng'],
    note: '帮身吉格，但力量较弱，身弱时得之有助，身旺时反嫌争财',
  },
  {
    id: 'shaCaiTongTou',
    name: '杀财同透',
    rank: 17,
    tier: 'low',
    baseWeight: 1.3,
    winsOver: ['caiYinLiangXian'],
    yieldsTo: ['shiShenZhiSha', 'shaYinXiangSheng', 'caiZiQiSha', 'caiGuanShuangMei', 'guanShaHunZa'],
    note: '次凶格，杀财同透天干攻身，力弱于财滋七杀之重',
  },
  {
    id: 'biJieBangShenPlus',
    name: '劫财帮身',
    rank: 18,
    tier: 'low',
    baseWeight: 1.0,
    winsOver: ['caiYinLiangXian'],
    yieldsTo: ['biJieBangShen', 'yinShouHuShen', 'guanYinXiangSheng'],
    note: '劫财帮身，同属帮身但劫财性猛，应急有用，久则招嫌',
  },
]

export class TenGodPriorityMatrix {
  private entries = new Map<CombinationId | string, CombinationPriorityEntry>()

  constructor() {
    for (const e of PRIORITY_ENTRIES) {
      this.entries.set(e.id, e)
    }
  }

  resolve(
    a: { id: string; score: number; favorable: boolean },
    b: { id: string; score: number; favorable: boolean }
  ): { winner: 'A' | 'B' | 'TIE'; reason: string; weightedA: number; weightedB: number } {
    const entryA = this.entries.get(a.id)
    const entryB = this.entries.get(b.id)

    const weightA = entryA?.baseWeight ?? 1.0
    const weightB = entryB?.baseWeight ?? 1.0

    const favorableBonusA = a.favorable ? 1.0 : 0.8
    const favorableBonusB = b.favorable ? 1.0 : 0.8

    const tierBonusA = entryA?.tier === 'top' ? 1.1 : entryA?.tier === 'mid' ? 1.05 : 1.0
    const tierBonusB = entryB?.tier === 'top' ? 1.1 : entryB?.tier === 'mid' ? 1.05 : 1.0

    const satBonusA = a.score >= 80 ? 1.05 : a.score >= 60 ? 1.0 : 0.95
    const satBonusB = b.score >= 80 ? 1.05 : b.score >= 60 ? 1.0 : 0.95

    const weightedA = a.score * weightA * favorableBonusA * tierBonusA * satBonusA
    const weightedB = b.score * weightB * favorableBonusB * tierBonusB * satBonusB

    if (entryA && entryA.winsOver.includes(b.id)) {
      return {
        winner: 'A',
        reason: `${entryA.name}的winsOver包含${entryB?.name || b.id}，A优先级胜出：${entryA.note}`,
        weightedA,
        weightedB,
      }
    }
    if (entryB && entryB.winsOver.includes(a.id)) {
      return {
        winner: 'B',
        reason: `${entryB.name}的winsOver包含${entryA?.name || a.id}，B优先级胜出：${entryB.note}`,
        weightedA,
        weightedB,
      }
    }
    if (entryA && entryA.yieldsTo.includes(b.id)) {
      return {
        winner: 'B',
        reason: `${entryA.name}的yieldsTo包含${entryB?.name || b.id}，A让位给B`,
        weightedA,
        weightedB,
      }
    }
    if (entryB && entryB.yieldsTo.includes(a.id)) {
      return {
        winner: 'A',
        reason: `${entryB.name}的yieldsTo包含${entryA?.name || a.id}，B让位给A`,
        weightedA,
        weightedB,
      }
    }

    const rankA = entryA?.rank ?? 99
    const rankB = entryB?.rank ?? 99

    if (weightedA - weightedB > 0.001) {
      return {
        winner: 'A',
        reason: `加权得分A(${weightedA.toFixed(2)}) > B(${weightedB.toFixed(2)})，A胜出`,
        weightedA,
        weightedB,
      }
    }
    if (weightedB - weightedA > 0.001) {
      return {
        winner: 'B',
        reason: `加权得分B(${weightedB.toFixed(2)}) > A(${weightedA.toFixed(2)})，B胜出`,
        weightedA,
        weightedB,
      }
    }
    if (rankA < rankB) {
      return {
        winner: 'A',
        reason: `加权得分相同，A的rank(${rankA}) < B(${rankB})，A优先`,
        weightedA,
        weightedB,
      }
    }
    if (rankB < rankA) {
      return {
        winner: 'B',
        reason: `加权得分相同，B的rank(${rankB}) < A(${rankA})，B优先`,
        weightedA,
        weightedB,
      }
    }
    return {
      winner: 'TIE',
      reason: '加权得分与优先级rank均相同，并列',
      weightedA,
      weightedB,
    }
  }

  getWeight(id: CombinationId | string): number {
    return this.entries.get(id)?.baseWeight ?? 1.0
  }

  list(): CombinationPriorityEntry[] {
    const arr = Array.from(this.entries.values())
    arr.sort((a, b) => a.rank - b.rank)
    return arr
  }
}

export const defaultTenGodPriorityMatrix = new TenGodPriorityMatrix()
