/**
 * Case Report Linker Types
 *
 * 定义命例报告关联器的类型：命例比较详情、相似案例报告、关联器选项
 */

/** 单个命例比较详情 */
export interface CaseComparisonDetail {
  caseId: string
  name?: string
  similarityScore: number
  reliability: number
  commonFeatures: string[]
  differences: string[]
  historicalResult: string
  suggestion: string
  credibilityNote: string
}

/** 相似案例报告 */
export interface SimilarCasesReport {
  targetCaseId: string
  topRecommendations: CaseComparisonDetail[]
  summary: string
  generatedAt: number
}

/** 关联器选项 */
export interface LinkerOptions {
  limit?: number
  minSimilarity?: number
  minReliability?: number
  includeDifferences?: boolean
}
