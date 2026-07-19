/**
 * 行业基准对比 — 类型定义
 *
 * 职责：定义基准数据源、基准条目、对比结果、行业报告等类型
 */

// ═══════════════════════════════════════════
// 1. 基础枚举
// ═══════════════════════════════════════════

/** 基准数据源类型 */
export type BenchmarkSource = 'internal' | 'external' | 'industry_average'

// ═══════════════════════════════════════════
// 2. 子结构定义
// ═══════════════════════════════════════════

/** 基准条目 */
export interface BenchmarkEntry {
  /** 关联的命例 ID */
  caseId: string
  /** 数据源类型 */
  source: string
  /** 数据源名称 */
  sourceName: string
  /** 该数据源的预期结果 */
  expectedResult: Record<string, string | number | undefined>
  /** 置信度 0~1 */
  confidence: number
}

/** 单字段对比结果 */
export interface BenchmarkComparison {
  /** 对比字段名 */
  field: string
  /** 玄风门的值 */
  xuanfengmenValue: string | number | undefined
  /** 数据源的值 */
  sourceValue: string | number | undefined
  /** 是否一致 */
  match: boolean
  /** 一致性评分 0~1 */
  matchScore: number
}

// ═══════════════════════════════════════════
// 3. 核心类型定义
// ═══════════════════════════════════════════

/** 单个数据源的基准对比结果 */
export interface SourceBenchmarkResult {
  /** 数据源类型 */
  source: string
  /** 数据源名称 */
  sourceName: string
  /** 对比命例总数 */
  totalCases: number
  /** 总体一致率 0~1 */
  overallAgreement: number
  /** 各字段对比详情 */
  fieldAgreements: BenchmarkComparison[]
  /** 玄风门优势字段列表 */
  xuanfengmenAdvantage: string[]
  /** 数据源优势字段列表 */
  sourceAdvantage: string[]
}

/** 行业基准报告 */
export interface IndustryBenchmarkReport {
  /** 版本号 */
  version: string
  /** 各数据源对比结果 */
  sources: SourceBenchmarkResult[]
  /** 与所有数据源的平均一致率 */
  avgIndustryAgreement: number
  /** 最佳一致率数据源 */
  bestSource: string
  /** 最差一致率数据源 */
  worstSource: string
  /** 改进建议 */
  recommendations: string[]
  /** 生成时间 */
  generatedAt: number
}
