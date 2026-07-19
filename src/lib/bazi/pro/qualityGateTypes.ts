/**
 * V5.0 RC: Quality Gate Engine — 类型定义
 *
 * 定义质量门禁检查项、发布门槛、健康评分
 */

// ─── 质量检查项 ───

/** 单项检查结果 */
export interface QualityCheckResult {
  /** 检查项 ID */
  checkId: string
  /** 检查项名称 */
  name: string
  /** 是否通过 */
  passed: boolean
  /** 严重级别 */
  severity: 'critical' | 'major' | 'minor' | 'info'
  /** 详情 */
  details: string
  /** 发现数量 */
  findings?: number
  /** 修复建议 */
  suggestions?: string[]
}

/** 质量检查分类 */
export type QualityCheckCategory =
  | 'duplicate-code'
  | 'duplicate-rules'
  | 'duplicate-database'
  | 'rule-registry-coverage'
  | 'tracechain-coverage'
  | 'knowledge-coverage'
  | 'warningcode-coverage'
  | 'typescript-errors'
  | 'circular-dependency'
  | 'dead-code'
  | 'cache-version'
  | 'regression-consistency'
  | 'test-coverage'
  | 'performance-threshold'

// ─── 质量门禁配置 ───

/** 发布门槛 */
export interface ReleaseThreshold {
  /** TypeScript 错误数上限 */
  maxTsErrors: number
  /** RuleRegistry 覆盖率下限 (0~1) */
  minRuleRegistryCoverage: number
  /** TraceChain 覆盖率下限 (0~1) */
  minTraceChainCoverage: number
  /** Knowledge 引用率下限 (0~1) */
  minKnowledgeCoverage: number
  /** Regression 一致率下限 (0~1) */
  minRegressionRate: number
  /** 性能不得低于上一版本的比率 (0~1) */
  minPerformanceRatio: number
  /** 循环依赖上限 */
  maxCircularDependencies: number
  /** 测试通过率下限 (0~1) */
  minTestPassRate: number
}

/** 引擎健康评分维度 */
export interface HealthScoreDimension {
  /** 维度名称 */
  dimension: string
  /** 评分 0~100 */
  score: number
  /** 权重 0~1 */
  weight: number
  /** 详情 */
  details: string
}

/** 健康评分评级 */
export type HealthGrade = 'excellent' | 'good' | 'acceptable' | 'block'

/** 健康评分输出 */
export interface EngineHealthScore {
  /** 总评分 0~100 */
  totalScore: number
  /** 评级 */
  grade: HealthGrade
  /** 各维度评分 */
  dimensions: HealthScoreDimension[]
  /** 评级标准说明 */
  gradeDescription: string
}

// ─── Quality Gate 输出 ───

/** 质量门禁报告 */
export interface QualityGateReport {
  /** 版本 */
  version: string
  /** 生成时间 */
  generatedAt: number
  /** 所有检查结果 */
  checks: QualityCheckResult[]
  /** 检查总结 */
  summary: QualityGateSummary
  /** 引擎健康评分 */
  healthScore: EngineHealthScore
  /** 是否允许发布 */
  releaseAllowed: boolean
  /** 发布阻止原因 */
  blockReasons: string[]
  /** 计算时间 */
  computeTimeMs: number
}

/** 质量门禁总结 */
export interface QualityGateSummary {
  /** 总检查项 */
  totalChecks: number
  /** 通过数 */
  passedChecks: number
  /** 失败数 */
  failedChecks: number
  /** critical 失败数 */
  criticalFailures: number
  /** 通过率 */
  passRate: number
}

/** Quality Gate 选项 */
export interface QualityGateOptions {
  /** 自定义发布门槛（不提供则使用默认） */
  thresholds?: Partial<ReleaseThreshold>
  /** 仅执行指定分类的检查 */
  categories?: QualityCheckCategory[]
}

/** 工具函数 */
export function getHealthGrade(score: number): HealthGrade {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'acceptable'
  return 'block'
}

export function getHealthGradeDescription(grade: HealthGrade): string {
  switch (grade) {
    case 'excellent': return '90+ Excellent — 代码质量优秀，允许发布'
    case 'good': return '80+ Good — 代码质量良好，允许发布'
    case 'acceptable': return '70+ Acceptable — 代码质量可接受，允许发布但有改进空间'
    case 'block': return '<70 Block Release — 代码质量不达标，阻止发布'
  }
}