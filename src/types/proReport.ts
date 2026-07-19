/**
 * Professional Report 前端数据契约
 *
 * 映射 MasterReport Engine 输出 -> 前端展示结构
 * 原则：保留原始数据 + 提供前端友好字段
 */

// ═══════════════════════════════════════════
// API 响应类型
// ═══════════════════════════════════════════

/** API 统一响应 */
export interface ProReportApiResponse {
  success: boolean
  data: ProReportData | null
  error: ProReportApiError | null
}

/** API 错误信息 */
export interface ProReportApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

/** 前端展示数据（从 API 响应转换后） */
export interface ProReportData {
  reportId: string
  engineVersion: string        // 生成报告的引擎版本，例如 'V5.0 GA'
  chart: ProChartSummary
  analysis: ProAnalysisSummary
  confidence: ProConfidenceSummary
  trace: ProTraceSummary
  raw: ProRawData
  createdAt: string
}

// ═══════════════════════════════════════════
// 命盘基础信息
// ═══════════════════════════════════════════

/** 命盘概览（页面头部展示） */
export interface ProChartSummary {
  dayMaster: string
  dayMasterElement: string
  yearPillar: { gan: string; zhi: string }
  monthPillar: { gan: string; zhi: string }
  dayPillar: { gan: string; zhi: string }
  hourPillar: { gan: string; zhi: string }
  gender: string
  birthDate: string
  birthTime: string
}

// ═══════════════════════════════════════════
// 分析结果
// ═══════════════════════════════════════════

/** 分析摘要（四层结构） */
export interface ProAnalysisSummary {
  /** 第一层：快速理解（30秒看懂） */
  quickSummary: {
    headline: string
    lifePositioning: string
    strengths: string[]
    risks: string[]
    developmentDirection: string
  }

  /** 第二层：五维评分 */
  fiveDimensions: {
    career: ProDimensionItem
    wealth: ProDimensionItem
    marriage: ProDimensionItem
    health: ProDimensionItem
    study: ProDimensionItem
    overall: number
  }

  /** 第三层：专业分析详情 */
  patternAnalysis: ProPatternSummary
  xiYongAnalysis: ProXiYongSummary
  shenShaHighlights: ProShenShaSummary
  tenGodHighlights: ProTenGodSummary

  /** 第四层：人生规划 */
  timeline: ProTimelineStage[]
  risks: ProRiskItem[]
  opportunities: ProOpportunityItem[]
  recommendations: ProRecommendationItem[]
  explains: ProExplainItem[]
}

/** 五维评分单项 */
export interface ProDimensionItem {
  score: number
  level: string
  weight: number
  reasons: string[]
  confidence: number
}

/** 格局分析摘要 */
export interface ProPatternSummary {
  mainPattern: string
  subPatterns: string[]
  formationScore: number
  description: string
}

/** 喜用神分析摘要 */
export interface ProXiYongSummary {
  dayMasterStrength: string
  yongShen: string
  xiShen: string
  jiShen: string
  chouShen: string
  xianShen: string
  regulationDirection: string
}

/** 神煞高亮摘要 */
export interface ProShenShaSummary {
  total: number
  highlights: Array<{ name: string; influence: string; category: string }>
}

/** 十神高亮摘要 */
export interface ProTenGodSummary {
  dominantGods: string[]
  structure: string
}

/** 时间轴阶段 */
export interface ProTimelineStage {
  stage: string
  ageRange: string
  summary: string
  fortuneInfluence: string
  xiYongInfluence: string
  keyEvents: string[]
  confidence: number
}

/** 风险项 */
export interface ProRiskItem {
  type: string
  level: string
  reason: string
  suggestion: string
  avoidance: string
  confidence: number
}

/** 机会项 */
export interface ProOpportunityItem {
  type: string
  timing: string
  reason: string
  confidence: number
}

/** 建议项 */
export interface ProRecommendationItem {
  category: string
  content: string
  relatedElements: string[]
  reasoning: string
}

/** 解释条目 */
export interface ProExplainItem {
  topic: string
  plainExplanation: string
  professionalExplanation: string
  classicalReference: string
  keywords: string[]
}

// ═══════════════════════════════════════════
// 置信度与追踪
// ═══════════════════════════════════════════

/** 置信度摘要 */
export interface ProConfidenceSummary {
  overallConfidence: number
  crossValidationPassed: boolean
  contradictions: string[]
  supportingModules: string[]
  warnings: string[]
}

/** 引擎执行追踪摘要 */
export interface ProTraceSummary {
  totalSteps: number
  modules: Array<{
    module: string
    stepCount: number
    description: string
  }>
}

// ═══════════════════════════════════════════
// 原始数据（不可删除）
// ═══════════════════════════════════════════

/** 完整原始引擎数据（JSON stringified） */
export interface ProRawData {
  masterReport: string
  pillars: string
  shenSha: string
  tenGods: string
  pattern: string
  xiYong: string
  fortune: string
}

// ═══════════════════════════════════════════
// API 请求类型
// ═══════════════════════════════════════════

/** 专业报告请求体 */
export interface ProReportRequest {
  birth_date: string
  birth_time: string
  gender: 'male' | 'female'
  birthplace?: string
  timezone?: string
  zishi_strategy?: 'late' | 'early' | 'gregorian'
  use_solar_time?: boolean
  birth_time_unknown?: boolean
  longitude?: number
}