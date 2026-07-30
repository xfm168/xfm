export type ClassicsSource =
  | '滴天髓'
  | '子平真诠'
  | '穷通宝鉴'
  | '三命通会'
  | '渊海子平'
  | '现代命理·经典案例'

export interface AuthoritativeCase {
  id: string
  source: ClassicsSource
  chapterRef?: string
  originalQuote?: string
  birth: {
    gender: 'male' | 'female'
    solarDate: string
    solarTime: string
    location?: string
    longitude?: number
    latitude?: number
    timezone: string
    timezoneOffsetMin: number
    useTrueSolarTime?: boolean
    ziHourStrategy?: 'same-day' | 'next-day' | 'true-solar'
  }
  expect: {
    fourPillars: {
      year: { gan: string; zhi: string; ganZhi: string }
      month: { gan: string; zhi: string; ganZhi: string }
      day: { gan: string; zhi: string; ganZhi: string }
      hour?: { gan: string; zhi: string; ganZhi: string }
    }
    trueSolarTimeDiff?: number
    solarTerm?: string
    qiYunStartAge?: number
    daYunDirection?: '顺行' | '逆行'
    geju?: string[]
    xiYongShen?: string[]
    tiaohou?: string[]
    shensha?: Record<string, string[]>
    wangshuai?: string
  }
  notes?: string[]
  tags?: string[]
}

export interface ValidateResult {
  caseId: string
  source: string
  items: Record<string, { passed: boolean; expected?: any; actual?: any; note?: string }>
  passRate: number
  passed: boolean
}

export interface ValidateReport {
  generatedAt: string
  totalCases: number
  passedCases: number
  failedCases: number
  overallPassRate: number
  perSourceBreakdown: Record<string, { cases: number; passRate: number }>
  perItemBreakdown: Record<string, { checked: number; passed: number; passRate: number }>
  failures: ValidateResult[]
  sampleTop10: ValidateResult[]
  durationMs: number
}
