/**
 * Module 7: Professional AI Report Engine — 类型定义
 *
 * 职责：数据整合、交叉验证、命理推理、AI 报告生成
 * 禁止：重复计算任何命理算法，全部调用 Module 1~6
 *
 * 典籍来源：
 * 《滴天髓》明·京图 / 清·任铁樵注 — 命理总论
 * 《三命通会》明·万民英 — 综合论命
 * 《子平真诠》清·沈孝瞻 — 格局用神论
 * 《穷通宝鉴》清·无名氏 — 调候论命
 * 《渊海子平》宋·徐升 — 命理大全
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement } from '@/lib/core/types/base'
import type { DerivationStep, DerivationChain } from './types'
import type { ProfessionalFourPillarsResult } from './types'
import type { ShenShaEngineOutput } from './shenshaTypes'
import type { TenGodEngineOutput } from './tenGodsTypes'
import type { PatternEngineOutput } from './patternTypes'
import type { XiYongEngineOutput } from './xiyongTypes'
import type { FortuneEngineOutput } from './fortuneTypes'

// ═══════════════════════════════════════════
// 1. 输入聚合类型
// ═══════════════════════════════════════════

/** Module 1~6 全部引擎输出的聚合输入 */
export interface ModuleInputs {
  pillars: ProfessionalFourPillarsResult
  shenSha: ShenShaEngineOutput
  tenGods: TenGodEngineOutput
  pattern: PatternEngineOutput
  xiYong: XiYongEngineOutput
  fortune: FortuneEngineOutput
}

// ═══════════════════════════════════════════
// 2. MasterAnalysis 输出
// ═══════════════════════════════════════════

/** 交叉验证结果 */
export interface CrossValidationResult {
  validated: boolean
  confidence: number       // 0~1
  reasons: string[]
  contradictions: string[]
  supportingModules: string[]  // ['tenGods', 'xiYong', 'shenSha', ...]
  traceChain: DerivationStep[]
}

/** 人生五维评分（事业/财富/婚姻/健康/学业 0~100） */
export interface FiveDimensionScores {
  career: FiveDimensionItem
  wealth: FiveDimensionItem
  marriage: FiveDimensionItem
  health: FiveDimensionItem
  study: FiveDimensionItem
  overall: number   // 加权总分
}

/** 单维度评分项 */
export interface FiveDimensionItem {
  score: number         // 0~100
  level: DimensionLevel
  influencedModules: string[]   // ['pattern', 'xiYong', 'fortune', ...]
  weight: number        // 权重
  reasons: string[]
  confidence: number    // 0~1
}

export type DimensionLevel = '优秀' | '良好' | '中等' | '偏弱' | '较差'

/** 时间轴阶段 */
export type LifeStage = '儿童' | '青年' | '中年' | '晚年'

/** 人生时间轴项 */
export interface TimelineStage {
  stage: LifeStage
  ageRange: string       // '0-15岁'
  summary: string
  fortuneInfluence: string
  xiYongInfluence: string
  keyEvents: string[]
  confidence: number
}

/** 风险项 */
export interface RiskItem {
  type: RiskType
  level: RiskLevel
  reason: string
  sourceModules: string[]
  suggestion: string
  avoidance: string
  confidence: number
}

export type RiskType =
  | '事业风险' | '投资风险' | '婚姻风险'
  | '健康风险' | '官非风险' | '财务风险'

export type RiskLevel = '高' | '中' | '低' | '极低'

/** 机会项 */
export interface OpportunityItem {
  type: OpportunityType
  timing: string          // 时间描述
  reason: string
  sourceModules: string[]
  confidence: number
}

export type OpportunityType =
  | '事业机会' | '创业机会' | '投资机会'
  | '婚恋机会' | '学习机会' | '迁移机会'

/** 建议项 */
export interface RecommendationItem {
  category: RecommendationCategory
  content: string
  relatedElements: FiveElement[]
  relatedModules: string[]
  reasoning: string
}

export type RecommendationCategory =
  | '职业建议' | '行业建议' | '城市建议'
  | '颜色建议' | '数字建议' | '方位建议'
  | '五行补救' | '风水建议' | '生活建议'

/** AI 解释条目 */
export interface MasterExplainEntry {
  topic: string
  classicalReference: string
  modernInterpretation: string
  professionalExplanation: string
  plainExplanation: string
  risks: string[]
  suggestions: string[]
  keywords: string[]
  sourceModules: string[]
}

/** 命局总评 */
export interface OverallAssessment {
  summary: string
  patternEvaluation: string
  lifePositioning: string
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  risks: string[]
  developmentDirection: string
  sourceModules: string[]
  confidence: number
}

/** 执行元数据 */
export interface MasterReportMetadata {
  computeTimeMs: number
  cacheVersion: string
  moduleVersions: {
    pillars: string
    shenSha: string
    tenGods: string
    pattern: string
    xiYong: string
    fortune: string
  }
}

// ═══════════════════════════════════════════
// 3. 最终统一输出
// ═══════════════════════════════════════════

/** MasterReport — Module 7 最终输出 */
export interface MasterReport {
  version: string
  dayMaster: HeavenlyStem
  dayMasterElement: FiveElement

  // ── 1. 总评 ──
  overallAssessment: OverallAssessment

  // ── 2. 五维评分 ──
  fiveDimensionScores: FiveDimensionScores

  // ── 3. 交叉验证 ──
  crossValidation: CrossValidationResult

  // ── 4. 时间轴 ──
  timeline: TimelineStage[]

  // ── 5. 风险 ──
  risks: RiskItem[]

  // ── 6. 机会 ──
  opportunities: OpportunityItem[]

  // ── 7. 建议 ──
  recommendations: RecommendationItem[]

  // ── 8. AI解释 ──
  explains: MasterExplainEntry[]

  // ── 9. 元数据 ──
  warnings: string[]
  computeTimeMs: number
  executionMetadata: MasterReportMetadata
  cacheVersion: string
  derivation: DerivationChain
}

/** 引擎选项 */
export interface MasterReportOptions {
  config?: import('./config').ProfessionalConfig
  gender?: string
  birthYear?: number
  enableCrossValidation?: boolean
  enableTimeline?: boolean
  enableRiskEngine?: boolean
  enableOpportunityEngine?: boolean
  enableRecommendation?: boolean
  enableExplain?: boolean
}

// ═══════════════════════════════════════════
// 4. 工具函数
// ═══════════════════════════════════════════

/** 根据分数获取维度等级 */
export function getDimensionLevel(score: number): DimensionLevel {
  if (score >= 85) return '优秀'
  if (score >= 70) return '良好'
  if (score >= 50) return '中等'
  if (score >= 30) return '偏弱'
  return '较差'
}

/** 根据置信度获取风险等级 */
export function getRiskLevel(confidence: number): RiskLevel {
  if (confidence >= 0.8) return '高'
  if (confidence >= 0.6) return '中'
  if (confidence >= 0.3) return '低'
  return '极低'
}
