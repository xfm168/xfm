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
  /** C1 古籍标准（权威命例校正工程核心字段） */
  classic?: ClassicStandard
}

/** C1 校正工程：古籍标准字段（与 expect 程序输出分开） */
export interface ClassicStandard {
  /** 典籍来源（如 '滴天髓' '子平真诠' 等） */
  classicSource: string
  /** 章节/篇名/卷号（如 '上卷·通神论' '卷三·论用神'） */
  chapter?: string
  /** 古籍原文引用（便于人工核对） */
  originalText?: string
  /** 古籍记载的格局（如 '伤官佩印' '从财格'） */
  originalStructure?: string[]
  /** 古籍记载的喜用神 */
  originalUsefulGod?: string[]
  /** 古籍记载的旺衰（如 '身弱' '偏旺' '从弱'） */
  originalStrength?: string
  /** 古籍断语/结论（如 "大贵" "富可敌国" "贫贱"） */
  originalConclusion?: string
  /** 现代解释（对古籍断语的现代命理翻译） */
  modernExplanation?: string
  /** 是否存在流派争议 */
  controversy?: boolean
  /** 争议说明 */
  controversyNote?: string
  /** 页码或出处 */
  referencePage?: string
  /** 校验状态：pending=待校正 / verified=已校正 / disputed=有争议 */
  validationStatus?: 'pending' | 'verified' | 'disputed'
}

/** C2 单项校验结果 */
export interface ValidationItemResult {
  /** 校验项名称 */
  name: string
  /** PASS / FAIL / SKIP（古籍无数据时跳过） */
  status: 'PASS' | 'FAIL' | 'SKIP'
  /** 预期值（来自古籍 classic） */
  expected?: any
  /** 实际值（来自程序 RuleEngine 输出） */
  actual?: any
  /** 差异描述 */
  difference?: string
  /** 差异原因 */
  differenceReason?: string
  /** 该项准确率 0~1 */
  accuracy: number
}

/** C2 完整案例校验结果 */
export interface CaseValidationResult {
  caseId: string
  source: string
  items: ValidationItemResult[]
  /** 总体准确率 0~1 */
  overallAccuracy: number
  /** 总体状态：PASS（accuracy≥阈值）/ FAIL */
  status: 'PASS' | 'FAIL'
  /** 校验时间 */
  validatedAt: string
}

/** C2 完整校验报告 */
export interface ValidationReport {
  generatedAt: string
  totalCases: number
  validatedCases: number
  passedCases: number
  failedCases: number
  overallAccuracy: number
  perSourceBreakdown: Record<string, { cases: number; accuracy: number }>
  perItemBreakdown: Record<string, { checked: number; passed: number; accuracy: number }>
  failures: CaseValidationResult[]
  sampleTop10: CaseValidationResult[]
  durationMs: number
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
