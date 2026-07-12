/**
 * Score 三来源封装 — P6 修正6
 *
 * 原则：
 *   - RuleWeight：命理规则权重，永远固定，禁止修改
 *   - Confidence：推演结果可信度，由 ConfidenceEngine 动态计算
 *   - EvidenceScore：证据完整度，由 EvidenceEngine 动态计算
 *
 * 使用方式：
 *   import { RuleWeight, ConfidenceScore, EvidenceScore } from './scoreTypes'
 *
 * 禁止：
 *   - 直接使用 number 类型传递 score/confidence
 *   - 在非规则文件中硬编码 score/confidence 数值
 */

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/**
 * RuleWeight — 命理规则权重
 *
 * 来源：gejuRules / shishenRules / wuxingRules / xiyongRules /
 *       expertRuleEngine / knowledgeGraph
 *
 * 规则：
 *   - 永远固定，禁止修改
 *   - 只能新增，不允许覆盖
 *   - 表示某条命理规则的固有权重
 */
export interface RuleWeight {
  /** 规则ID */
  ruleId: string
  /** 规则来源文件 */
  source: string
  /** 权重值 0-100 */
  weight: number
  /** 可信度 0-100（规则本身的固有可信度） */
  confidence: number
  /** 是否冻结（RuleWeight 永远为 true） */
  frozen: true
}

/**
 * ConfidenceScore — 推演结果可信度
 *
 * 来源：ConfidenceEngine 动态计算
 *
 * 规则：
 *   - 必须动态计算，禁止硬编码
 *   - 基于数据完整度 + 一致性 + 证据充分性
 *   - 可随输入数据变化
 */
export interface ConfidenceScore {
  /** 评分维度 */
  dimension: string
  /** 可信度 0-100（动态计算） */
  score: number
  /** 计算来源引擎 */
  engine: string
  /** 计算依据 */
  basis: string
  /** 是否冻结（ConfidenceScore 永远为 false） */
  frozen: false
}

/**
 * EvidenceScore — 证据完整度
 *
 * 来源：ExplainEvidenceEngine / SimilarityEngine 动态计算
 *
 * 规则：
 *   - 必须动态计算，禁止硬编码
 *   - 基于证据数量、强度、来源多样性
 *   - 可随输入数据变化
 */
export interface EvidenceScore {
  /** 证据维度 */
  dimension: string
  /** 完整度 0-100（动态计算） */
  score: number
  /** 证据数量 */
  evidenceCount: number
  /** 古籍引用数 */
  classicalRefCount: number
  /** 是否冻结（EvidenceScore 永远为 false） */
  frozen: false
}

/**
 * Score 来源标识
 */
export type ScoreSource = 'ruleWeight' | 'confidence' | 'evidence'

/**
 * 统一 Score 容器 — 封装三种来源
 */
export interface ScoreContainer {
  /** 来源标识 */
  source: ScoreSource
  /** RuleWeight（当 source === 'ruleWeight' 时有值） */
  ruleWeight?: RuleWeight
  /** ConfidenceScore（当 source === 'confidence' 时有值） */
  confidence?: ConfidenceScore
  /** EvidenceScore（当 source === 'evidence' 时有值） */
  evidence?: EvidenceScore
}

// ═══════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════

/**
 * 创建 RuleWeight（仅限规则文件使用）
 */
export function createRuleWeight(
  ruleId: string,
  source: string,
  weight: number,
  confidence: number
): RuleWeight {
  return {
    ruleId: ruleId,
    source: source,
    weight: weight,
    confidence: confidence,
    frozen: true
  }
}

/**
 * 创建 ConfidenceScore（仅限 ConfidenceEngine 使用）
 */
export function createConfidenceScore(
  dimension: string,
  score: number,
  engine: string,
  basis: string
): ConfidenceScore {
  return {
    dimension: dimension,
    score: score,
    engine: engine,
    basis: basis,
    frozen: false
  }
}

/**
 * 创建 EvidenceScore（仅限 EvidenceEngine 使用）
 */
export function createEvidenceScore(
  dimension: string,
  score: number,
  evidenceCount: number,
  classicalRefCount: number
): EvidenceScore {
  return {
    dimension: dimension,
    score: score,
    evidenceCount: evidenceCount,
    classicalRefCount: classicalRefCount,
    frozen: false
  }
}

// ═══════════════════════════════════════════════════════════
// 冻结清单 — RuleWeight 永远不可修改的文件
// ═══════════════════════════════════════════════════════════

/**
 * RuleWeight 冻结文件清单
 *
 * 以下文件中的所有 score / confidence / priority / weight 字段
 * 均属于 RuleWeight，永远禁止修改：
 */
export const RULE_WEIGHT_FROZEN_FILES: readonly string[] = [
  'rules/gejuRules.ts',
  'rules/shishenRules.ts',
  'rules/wuxingRules.ts',
  'rules/xiyongRules.ts',
  'rules/changshengRules.ts',
  'rules/dashunRules.ts',
  'qi/plugin/expertRuleEngine.ts',
  'qi/plugin/knowledgeGraph.ts',
] as const

/**
 * RuleWeight 冻结声明
 *
 * 此常量用于发布检查工具自动验证 RuleWeight 未被修改。
 */
export const RULE_WEIGHT_FREEZE_DECLARATION = {
  frozenAt: '2026-07-11',
  frozenBy: 'P6-A',
  totalRuleWeightCount: 422,
  description: '所有 RuleWeight 已冻结，禁止修改 score/confidence/priority/weight',
  files: RULE_WEIGHT_FROZEN_FILES,
} as const
