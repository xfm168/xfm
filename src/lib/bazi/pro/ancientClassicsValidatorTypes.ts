/**
 * Ancient Classics Validator Types
 *
 * 定义古籍引用验证的来源、引用、验证结果和报告类型
 */

/** 古典来源 */
export type ClassicalSource =
  | '滴天髓'
  | '子平真诠'
  | '三命通会'
  | '穷通宝鉴'
  | '渊海子平'
  | '神峰通考'
  | '协纪辨方书'
  | '星平会海'
  | '命理正宗'
  | '其他'

/** 引用等级 */
export type ReferenceLevel = 'primary' | 'secondary' | 'supporting' | 'analogical'

/** 古典引用 */
export interface ClassicalReference {
  source: ClassicalSource
  level: ReferenceLevel
  chapter?: string
  originalText?: string
  modernInterpretation?: string
  confidence: number
  relevanceScore: number
}

/** 验证要求 */
export interface ValidationRequirement {
  engineModule: string
  aiExplanationField: string
  minReferences: number
  requiredSources: ClassicalSource[]
}

/** 古籍验证结果 */
export interface ClassicsValidationResult {
  caseId: string
  totalReferences: number
  bySource: Record<string, number>
  referenceCoverage: number
  requiredSourcesMet: boolean
  validationPassed: boolean
  missingSources: string[]
  recommendations: string[]
}

/** 古籍验证报告 */
export interface ClassicsValidationReport {
  version: string
  totalCases: number
  coverageRate: number
  avgReferences: number
  sourceDistribution: Record<string, number>
  generatedAt: number
}