/**
 * AI vs Expert Compare Types
 *
 * 定义 AI 计算结果与专家观点对比分析的类型
 */

/** 可对比字段 */
export type ComparisonField =
  | 'primaryPattern'
  | 'strengthLevel'
  | 'xiShen'
  | 'yongShen'
  | 'careerScore'
  | 'marriageScore'
  | 'overallScore'
  | 'tenGodSummary'

/** 单字段对比结果 */
export interface FieldComparison {
  field: ComparisonField
  aiValue: string | number
  expertValue: string | number
  match: boolean
  matchScore: number
}

/** 单命例的 AI-专家一致度 */
export interface ExpertAgreement {
  caseId: string
  overallAgreement: number
  fieldComparisons: FieldComparison[]
  expertAvgScore: number
  expertCount: number
  aiConsistentWithMajority: boolean
  consensusLevel: string
  divergentFields: string[]
}

/** 批量对比报告 */
export interface AiVsExpertReport {
  version: string
  generatedAt: number
  totalComparisons: number
  avgAgreement: number
  agreementDistribution: {
    excellent: number
    good: number
    moderate: number
    weak: number
    poor: number
  }
  topDivergentFields: FieldComparison[]
  recommendations: string[]
}
