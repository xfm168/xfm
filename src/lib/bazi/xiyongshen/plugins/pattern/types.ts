export type GejuCategory =
  | 'zheng'
  | 'jiacong'
  | 'zhencong'
  | 'zhuanwang'
  | 'yiqi'
  | 'huaqi'
  | 'tiaohou'
  | 'bingyao'
  | 'tongguan'
  | 'fuyi'

export type GejuName =
  | '正格-正官格' | '正格-七杀格' | '正格-正印格' | '正格-偏印格' | '正格-正财格' | '正格-偏财格' | '正格-食神格' | '正格-伤官格'
  | '真从-从财格' | '真从-从杀格' | '真从-从儿格' | '真从-从势格' | '真从-从旺格'
  | '假从-假从财' | '假从-假从杀' | '假从-假从儿'
  | '专旺-曲直格（木专旺）' | '专旺-炎上格（火专旺）' | '专旺-稼穑格（土专旺）' | '专旺-从革格（金专旺）' | '专旺-润下格（水专旺）'
  | '一气-天元一气' | '一气-地元一气'
  | '化气-甲己化土' | '化气-乙庚化金' | '化气-丙辛化水' | '化气-丁壬化木' | '化气-戊癸化火'
  | '调候格' | '病药格' | '通关格' | '扶抑格'
  | '未判明正格'

export type Wuxing = '木' | '火' | '土' | '金' | '水'

export interface GejuVerdict {
  category: GejuCategory
  name: GejuName
  confidence: number
  evidences: string[]
  classicCitations: Array<{ classicCode: string; chapter: string; quote: string }>
  conflicts?: string[]
  yongshenProposal?: Wuxing[]
  jishenProposal?: Wuxing[]
}

export interface PatternClassifierResult {
  verdict?: GejuVerdict
  candidates: Array<{ category: GejuCategory; name: GejuName; score: number; reason: string }>
  strongestVerdict?: GejuVerdict
  warning?: string
}

export interface ClassifierInput {
  dayGanWuxing: Wuxing
  monthZhiWuxing: Wuxing
  count: Record<Wuxing, number>
  fourPillars: Array<{ gan: string; zhi: string; ganWx: Wuxing; zhiWx: Wuxing }>
  dayStrength?: number
  dayGan: string
  monthZhi: string
  dayRootCount?: number
  isWinterBorn?: boolean
  isSummerBorn?: boolean
  conflictingPairs?: Array<[Wuxing, Wuxing]>
}
