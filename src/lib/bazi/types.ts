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

export type NaYin = string

export type ShiErChangSheng =
  | '长生'
  | '沐浴'
  | '冠带'
  | '临官'
  | '帝旺'
  | '衰'
  | '病'
  | '死'
  | '墓'
  | '绝'
  | '胎'
  | '养'

export type WuXingWangShuai = '旺' | '相' | '休' | '囚' | '死'

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
  yinYang: YinYang
  naYin: NaYin
  shenShi?: ShenShi
  changSheng?: ShiErChangSheng
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
  wangShuai: WuXingWangShuai
  strengthScore: number
}

export interface XiYongShen {
  bestElement: FiveElement
  happiness: string
  usage: string
  avoidedElements: FiveElement[]
}

export interface BaZiAnalysis {
  overall: string
  personality: string
  career: string
  wealth: string
  relationship: string
  health: string
  wuxingAdvice: string
  summary: string
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

export type SolarTermName =
  | '立春' | '雨水' | '惊蛰' | '春分'
  | '清明' | '谷雨' | '立夏' | '小满'
  | '芒种' | '夏至' | '小暑' | '大暑'
  | '立秋' | '处暑' | '白露' | '秋分'
  | '寒露' | '霜降' | '立冬' | '小雪'
  | '大雪' | '冬至' | '小寒' | '大寒'

// P0-② 子时换日策略类型
export type ZiShiStrategyType = 'late' | 'early' | 'gregorian'
