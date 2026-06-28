export type HeavenlyStem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸'

export type EarthlyBranch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥'

export type FiveElement = '木' | '火' | '土' | '金' | '水'

export type YinYang = '阳' | '阴'

export type ShenShi =
  | '比肩'
  | '劫财'
  | '食神'
  | '伤官'
  | '偏财'
  | '正财'
  | '偏官'
  | '正官'
  | '偏印'
  | '正印'

export interface BirthInfo {
  birthDate: string
  birthTime: string
  gender: 'male' | 'female'
  timezone?: string
  region?: string
  solarTime?: boolean
}

export interface GanZhi {
  gan: HeavenlyStem
  zhi: EarthlyBranch
  element: FiveElement
}

export interface SixLines {
  year: GanZhi
  month: GanZhi
  day: GanZhi
  hour: GanZhi
}

export interface FiveElementCount {
  木: number
  火: number
  土: number
  金: number
  水: number
}

export interface CangGan {
  ben: HeavenlyStem
  zhong: HeavenlyStem | null
  yao: HeavenlyStem | null
}

export interface DayMasterAnalysis {
  dayGan: HeavenlyStem
  dayGanElement: FiveElement
  dayGanYinYang: YinYang
  relatedShens: Record<HeavenlyStem, ShenShi>
}

export interface XiYongShen {
  bestElement: FiveElement
  happiness: string
  usage: string
  avoidedElements: FiveElement[]
}

export interface BaZiAnalysis {
  overall: string       // 总体命格
  personality: string   // 性格分析
  career: string        // 事业分析
  wealth: string        // 财运分析
  relationship: string  // 婚姻感情
  health: string        // 健康建议
  wuxingAdvice: string  // 五行建议
  summary: string       // 综合总结
}

export interface BaZiChart {
  birthInfo: BirthInfo
  sixLines: SixLines
  fiveElementCount: FiveElementCount
  dayMaster: DayMasterAnalysis
  cangGan: Record<EarthlyBranch, CangGan>
  xiYongShen: XiYongShen
  analysis: BaZiAnalysis
  overallScore: number
  version: string
  createdAt: number
}
