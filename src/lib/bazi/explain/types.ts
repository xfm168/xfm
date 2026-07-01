/**
 * Explain API 类型定义
 * V4.8.1 Baseline
 *
 * 每个算法必须返回结构化解释，包含：
 * - 结论
 * - 原因列表
 * - 引用的 Rule ID
 * - 经典出处
 * - 置信度
 */

/** 单条原因 */
export interface ExplainReason {
  /** 原因ID */
  id: string
  /** 描述 */
  description: string
  /** 具体值 */
  value?: string | number
  /** 正向（支持结论） / 负向（反对结论） */
  positive: boolean
  /** 权重 */
  weight: number
}

/** Explain 结果 */
export interface ExplainResult {
  /** 结论 */
  result: string
  /** 评分（如有） */
  score?: number
  /** 原因列表 */
  reasons: ExplainReason[]
  /** 引用的 Rule ID */
  rules: string[]
  /** 经典引用 */
  references: string[]
  /** 置信度 0-100 */
  confidence: number
  /** Explain 版本 */
  version: string
  /** 证据等级 */
  evidenceLevel: 'A' | 'B' | 'C'
  /** 时间戳 */
  timestamp: number
}

/** Explain 构建器 */
export class ExplainBuilder {
  private result: string
  private score?: number
  private reasons: ExplainReason[] = []
  private rules: string[] = []
  private references: string[] = []
  private confidence: number = 0
  private evidenceLevel: 'A' | 'B' | 'C' = 'B'

  constructor(result: string) {
    this.result = result
  }

  setScore(score: number): this {
    this.score = score
    return this
  }

  addReason(id: string, description: string, positive: boolean, weight: number, value?: string | number): this {
    this.reasons.push({ id, description, positive, weight, value })
    return this
  }

  addRule(ruleId: string): this {
    if (!this.rules.includes(ruleId)) {
      this.rules.push(ruleId)
    }
    return this
  }

  addReference(ref: string): this {
    if (!this.references.includes(ref)) {
      this.references.push(ref)
    }
    return this
  }

  setConfidence(confidence: number): this {
    this.confidence = Math.max(0, Math.min(100, confidence))
    return this
  }

  setEvidenceLevel(level: 'A' | 'B' | 'C'): this {
    this.evidenceLevel = level
    return this
  }

  build(): ExplainResult {
    return {
      result: this.result,
      score: this.score,
      reasons: this.reasons,
      rules: this.rules,
      references: this.references,
      confidence: this.confidence,
      version: 'explain-v1',
      evidenceLevel: this.evidenceLevel,
      timestamp: Date.now(),
    }
  }
}

/** 置信度计算因子 */
export interface ConfidenceFactors {
  /** 规则稳定度 0-100 */
  ruleStability: number
  /** 命例通过率 0-100 */
  casePassRate: number
  /** 经典支持率 0-100 */
  classicSupport: number
  /** 规则一致性 0-100 */
  ruleConsistency: number
  /** Benchmark一致率 0-100 */
  benchmarkAgreement: number
}

/** 默认置信度权重 */
export const CONFIDENCE_WEIGHTS = {
  ruleStability: 0.15,
  casePassRate: 0.35,
  classicSupport: 0.15,
  ruleConsistency: 0.10,
  benchmarkAgreement: 0.25,
}

/** 计算综合置信度 */
export function calculateConfidence(factors: ConfidenceFactors): number {
  const w = CONFIDENCE_WEIGHTS
  const score =
    factors.ruleStability * w.ruleStability +
    factors.casePassRate * w.casePassRate +
    factors.classicSupport * w.classicSupport +
    factors.ruleConsistency * w.ruleConsistency +
    factors.benchmarkAgreement * w.benchmarkAgreement
  return Math.round(Math.max(0, Math.min(100, score)))
}
