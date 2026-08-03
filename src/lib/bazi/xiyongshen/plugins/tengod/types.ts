export type Wuxing = '木' | '火' | '土' | '金' | '水'
export type YinYang = '阳' | '阴'

export type TenGodName =
  | '比肩' | '劫财'
  | '食神' | '伤官'
  | '偏财' | '正财'
  | '七杀' | '正官'
  | '偏印' | '正印'

export type CombinationId =
  | 'shiShenZhiSha'
  | 'shangGuanJianGuan'
  | 'guanYinXiangSheng'
  | 'caiGuanShuangMei'
  | 'shaYinXiangSheng'
  | 'caiPoYin'
  | 'xiaoShenDuoShi'
  | 'shiShangShengCai'
  | 'yinShouHuShen'
  | 'caiZiQiSha'
  | 'biJieDuoCai'
  | 'yinShaXiangZhan'
  | 'guanShaHunZa'
  | 'shiShangJianGuan'
  | 'caiYinLiangXian'
  | 'biJieBangShen'
  | 'shaCaiTongTou'

export type CombinationCategory =
  | '制化组合'
  | '凶格组合'
  | '流通组合'
  | '帮身组合'
  | '功名组合'

export type ClassicCode8 =
  | 'YSX' | 'ZYQ' | 'DTS' | 'SMTH'
  | 'QTB' | 'LPZ' | 'XJX' | 'BLH'

export interface CombinationRule {
  id: CombinationId | string
  name: string
  category: CombinationCategory
  description: string
  requires: TenGodName[]
  conditions: string[]
  requiredConditionCount: number
  outcome: string
  favorable: boolean
  references: Array<{ classicCode: ClassicCode8 | string; quote: string }>
  weight: number
}

export interface CombinationVerdict {
  id: CombinationId | string
  name: string
  category: CombinationCategory
  favorable: boolean
  satisfied: boolean
  hitConditions: string[]
  missingConditions: string[]
  hits: number
  required: number
  confidence: number
  score: number
  weight: number
  outcome: string
}

export interface CombinationPriorityEntry {
  id: CombinationId | string
  name: string
  rank: number
  tier: 'top' | 'mid' | 'low'
  baseWeight: number
  winsOver: Array<CombinationId | string>
  yieldsTo: Array<CombinationId | string>
  note: string
}

export interface TenGodClassifierInput {
  dayGan: string
  monthZhi: string
  fourPillars: Array<{
    gan: string
    zhi: string
    ganWx?: Wuxing
    zhiWx?: Wuxing
  }>
  dayGanWuxing?: Wuxing
  monthZhiWuxing?: Wuxing
  dayStrength?: number
  dayRootCount?: number
  isWinterBorn?: boolean
  isSummerBorn?: boolean
}

export interface TenGodPerPillarRecord {
  pillar: number
  position: '年干' | '月干' | '日干' | '时干' | '年支本气' | '月支本气' | '日支本气' | '时支本气' | '藏干余气'
  ganOrZhi: string
  tenGod: TenGodName
  wx: Wuxing
  weight: number
}

export interface TenGodDistribution {
  perGod: Record<TenGodName, number>
  perGodWeighted: Record<TenGodName, number>
  perColumn: TenGodPerPillarRecord[]
  tianGanFlags: Partial<Record<TenGodName, boolean>>
  dominantGods: TenGodName[]
  weakGods: TenGodName[]
  totalCount: number
  hasMonthZhiBenQi: Partial<Record<TenGodName, boolean>>
}

export interface TenGodClassifierResult {
  distribution: TenGodDistribution
  combinationVerdicts: CombinationVerdict[]
  favorableCombinations: CombinationVerdict[]
  unfavorableCombinations: CombinationVerdict[]
  wangGods: TenGodName[]
  weakGods: TenGodName[]
  balanceLevel: '极平衡' | '平衡' | '偏倾' | '极偏倾'
  patterns: string[]
}

export interface TenGodScoreResult {
  perGod: Record<TenGodName, number>
  perCombination: Record<string, number>
  overall: number
  breakdown?: Record<string, number>
}

export interface TenGodEvidenceStep {
  stepId: string
  stepName: string
  text: string
  satisfied: boolean
  citation?: string
  weight?: number
}

export interface TenGodEvidenceReport {
  steps: TenGodEvidenceStep[]
  byKind?: Record<string, TenGodEvidenceStep[]>
  positiveWeight: number
  negativeWeight: number
  netWeight: number
  balanceScore: number
}
