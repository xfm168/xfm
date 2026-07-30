export type Wuxing = '木' | '火' | '土' | '金' | '水'

export type ShenType = '用神' | '喜神' | '闲神' | '忌神' | '仇神'

export type XiYongMethod =
  | '扶抑' | '调候' | '病药' | '通关' | '寒暖' | '燥湿' | '格局'

export interface XiYongSingleMethodResult {
  method: XiYongMethod
  suggestion: Partial<Record<Wuxing, ShenType>>
  weight: number
  trace: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }>
  applicable: boolean
  skipReason?: string
  sources: string[]
  score: Record<Wuxing, number>
}

export interface XiYongFinalShen {
  wuxing: Wuxing
  finalType: ShenType
  totalScore: number
  breakdown: Partial<Record<XiYongMethod, number>>
  evidence: string[]
}

export interface XiYongResult {
  shens: XiYongFinalShen[]
  primaryShen: Wuxing
  primaryJiShen?: Wuxing
  methods: XiYongSingleMethodResult[]
  summary: string
}
