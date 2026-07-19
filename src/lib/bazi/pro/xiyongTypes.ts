/**
 * H3 Module 5: Professional XiYong Engine — 喜用神引擎类型定义
 *
 * 喜用神引擎是 Professional Engine 的核心决策层，
 * 基于 Module 1（四柱）、Module 3（十神）、Module 4（格局）的综合数据，
 * 输出喜神、用神、忌神、仇神、闲神、调候分析、扶抑分析。
 */

import type {
  HeavenlyStem, EarthlyBranch, FiveElement,
  ShenShi, YinYang,
} from '@/lib/core/types/base'
import { FIVE_ELEMENT_SHENG, FIVE_ELEMENT_KE } from './helpers'
import type { DerivationChain } from './types'
import type { PatternSchool, PatternDetail } from './patternTypes'
import type { TenGodEngineOutput } from './tenGodsTypes'

// ─── 日主强弱 ───

/** 日主强弱等级 */
export type StrengthLevel = '极强' | '偏强' | '中和' | '偏弱' | '极弱'

/** 日主强弱判定结果 */
export interface StrengthResult {
  /** 强弱评分 0-100 */
  strengthScore: number
  /** 强弱等级 */
  strengthLevel: StrengthLevel
  /** 判定可信度 0-100 */
  confidence: number
  /** 各维度评分 */
  dimensionScores: StrengthDimensionScores
  /** 推导链 */
  derivation?: DerivationChain
}

/** 强弱维度评分 */
export interface StrengthDimensionScores {
  /** 月令得令 */
  deLing: number
  /** 通根得地 */
  deDi: number
  /** 天干帮扶得势 */
  deShi: number
  /** 十神力量综合 */
  tenGodPower: number
  /** 五行比例平衡 */
  fiveElementBalance: number
  /** 格局辅助 */
  patternBonus: number
  /** 神煞辅助 */
  shenShaBonus: number
}

// ─── 喜神 / 用神 / 忌神 / 仇神 / 闲神 ───

/** 神煞角色 */
export type ShenRole = '喜神' | '用神' | '忌神' | '仇神' | '闲神'

/** 喜用神条目 */
export interface XiYongShenItem {
  /** 五行 */
  element: FiveElement
  /** 角色 */
  role: ShenRole
  /** 优先级（1=最高） */
  priority: number
  /** 评分 0-100 */
  score: number
  /** 来源 */
  source: string
  /** 原因（自然语言） */
  reason: string
  /** 古典依据 */
  classicalReference: string
  /** 可信度 0-100 */
  confidence: number
  /** 涉及的十神 */
  involvedShenShi: ShenShi[]
}

/** 喜用神结果分组 */
export interface XiYongGroupResult {
  /** 喜神列表 */
  xiShen: XiYongShenItem[]
  /** 用神列表 */
  yongShen: XiYongShenItem[]
  /** 忌神列表 */
  jiShen: XiYongShenItem[]
  /** 仇神列表 */
  enemyShen: XiYongShenItem[]
  /** 闲神列表 */
  neutralShen: XiYongShenItem[]
}

// ─── 调候分析 ───

/** 调候类型 */
export type ClimateType = '寒' | '暖' | '燥' | '湿' | '平'

/** 调候分析结果 */
export interface ClimateAnalysis {
  /** 调候类型 */
  climateType: ClimateType
  /** 调候评分 0-100（100=最需调候） */
  climateScore: number
  /** 调候需求 */
  climateNeed: FiveElement[]
  /** 调候方案 */
  climateSolution: string[]
  /** 古典依据 */
  classicalReference: string
  /** 可信度 0-100 */
  confidence: number
}

// ─── 扶抑分析 ───

/** 扶抑方法 */
export type FuYiMethod =
  | '扶抑法'    // 身弱扶之，身强抑之
  | '调候法'    // 寒暖燥湿调理
  | '病药法'    // 找病根、用药
  | '通关法'    // 两行相克需通关
  | '专旺法'    // 一行专旺顺势
  | '从格法'    // 从格顺势不可逆

/** 扶抑方法评分 */
export interface FuYiMethodResult {
  /** 方法名称 */
  method: FuYiMethod
  /** 该方法评分 0-100 */
  score: number
  /** 该方法可信度 0-100 */
  confidence: number
  /** 该方法推荐喜神 */
  recommendedElements: FiveElement[]
  /** 该方法推荐用神 */
  recommendedYongShen: FiveElement[]
  /** 该方法理由 */
  reason: string
  /** 古典依据 */
  classicalReference: string
}

/** 扶抑分析结果 */
export interface FuYiAnalysis {
  /** 各方法评分 */
  methods: FuYiMethodResult[]
  /** 最终采用的方法 */
  primaryMethod: FuYiMethod
  /** 综合评分 */
  overallScore: number
}

// ─── 多流派喜用神 ───

/** 单个流派的喜用神结果 */
export interface XiYongSchoolResult {
  /** 流派名称 */
  school: PatternSchool
  /** 是否启用 */
  enabled: boolean
  /** 该流派判定的喜神 */
  xiShen: FiveElement[]
  /** 该流派判定的用神 */
  yongShen: FiveElement[]
  /** 该流派判定的忌神 */
  jiShen: FiveElement[]
  /** 该流派评分 */
  score: number
  /** 该流派权重 */
  weight: number
  /** 加权评分 */
  weightedScore: number
  /** 该流派理由 */
  reason: string
  /** 古典引用 */
  reference: string
  /** 推导链 */
  derivation?: DerivationChain
}

/** 流派冲突处理结果 */
export interface XiYongConflictResult {
  /** 各流派喜用神对比 */
  schoolComparisons: XiYongSchoolResult[]
  /** 是否存在冲突 */
  hasConflict: boolean
  /** 冲突说明 */
  conflictDescription: string
  /** 综合排序后推荐的喜神 */
  recommendedXiShen: FiveElement[]
  /** 综合排序后推荐的用神 */
  recommendedYongShen: FiveElement[]
  /** 综合可信度 0-100 */
  overallConfidence: number
  /** 处理方式 */
  resolutionMethod: 'weighted' | 'majority' | 'priority'
}

// ─── 喜用神评分明细 ───

/** 喜用神评分明细 */
export interface XiYongScoreDetail {
  /** 日主强弱 30% */
  dayMasterStrength: number
  /** 格局影响 20% */
  patternInfluence: number
  /** 十神配合 15% */
  tenGodHarmony: number
  /** 五行平衡 15% */
  fiveElementBalance: number
  /** 调候需求 10% */
  climateNeed: number
  /** 神煞辅助 5% */
  shenShaAssist: number
  /** 冲突修正 5% */
  conflictAdjustment: number
  /** 总评分 */
  totalScore: number
  /** 各维度来源说明 */
  dimensionSources: Record<string, string>
}

// ─── AI Explain ───

/** 喜用神 AI 解释输出 */
export interface XiYongExplainOutput {
  /** 解释的喜用神五行 */
  element: FiveElement
  /** 角色 */
  role: ShenRole
  /** 古籍依据 */
  classicalBasis: string[]
  /** 现代解释 */
  modernInterpretation: string
  /** 事业方面 */
  career: string[]
  /** 财富方面 */
  wealth: string[]
  /** 婚姻方面 */
  marriage: string[]
  /** 健康方面 */
  health: string[]
  /** 风险提示 */
  risks: string[]
  /** 建议 */
  suggestions: string[]
  /** 关键词 */
  keywords: string[]
  /** 标签 */
  tags: string[]
  /** AI 总结 */
  aiSummary: string
}

// ─── 执行元数据 ───

/** 喜用神执行元数据 */
export interface XiYongExecutionMetadata {
  /** 执行耗时 ms */
  executionTime: number
  /** 评估规则数 */
  ruleCount: number
  /** 命中规则数 */
  matchedRules: number
  /** 评估流派数 */
  evaluatedSchools: number
  /** 扶抑方法数 */
  fuYiMethods: number
  /** 调候评分 */
  climateScore: number
}

// ─── 引擎选项 ───

/** 喜用神引擎选项 */
export interface XiYongEngineOptions {
  /** 性别 */
  gender: string
  /** 专业配置 */
  config?: import('./config').ProfessionalConfig
  /** 流派配置（null 则使用默认） */
  schoolConfig?: import('./patternTypes').SchoolConfig[] | null
}

// ─── 引擎最终输出 ───

/** 喜用神引擎最终输出 */
export interface XiYongEngineOutput {
  /** 引擎版本 */
  version: string
  /** 日主天干 */
  dayMaster: HeavenlyStem
  /** 日主五行 */
  dayMasterElement: FiveElement
  /** 日主强弱判定 */
  strength: StrengthResult
  /** 喜用神分组结果 */
  xiYongGroup: XiYongGroupResult
  /** 调候分析 */
  climateAnalysis: ClimateAnalysis
  /** 扶抑分析 */
  fuYiAnalysis: FuYiAnalysis
  /** 流派喜用神结果 */
  schoolResults: XiYongSchoolResult[]
  /** 流派冲突处理 */
  conflictResult: XiYongConflictResult
  /** 评分明细 */
  scoreDetail: XiYongScoreDetail
  /** 总体喜用神评分 0-100 */
  overallXiYongScore: number
  /** 总体可信度 0-100 */
  overallConfidence: number
  /** 主喜神（最优先的喜神五行） */
  primaryXiShen: FiveElement | null
  /** 主用神（最优先的用神五行） */
  primaryYongShen: FiveElement | null
  /** 主忌神（最优先的忌神五行） */
  primaryJiShen: FiveElement | null
  /** 使用的流派配置 */
  schoolConfig: import('./patternTypes').SchoolConfig[]
  /** 警告信息 */
  warnings: string[]
  /** 计算耗时 ms */
  computeTimeMs: number
  /** 执行元数据 */
  executionMetadata: XiYongExecutionMetadata
  /** 缓存版本号 */
  cacheVersion: string
  /** 推导链 */
  derivation?: DerivationChain
}

// ─── 喜用神知识库条目 ───

/** 喜用神知识库条目 */
export interface XiYongKnowledgeEntry {
  /** 五行 */
  element: FiveElement
  /** 关键词 */
  keywords: string[]
  /** 古籍依据 */
  classicalBasis: string[]
  /** 现代解释 */
  modernInterpretation: string
  /** 事业建议 */
  career: string[]
  /** 财富建议 */
  wealth: string[]
  /** 婚姻建议 */
  marriage: string[]
  /** 健康建议 */
  health: string[]
  /** 风险提示 */
  risks: string[]
  /** 调整建议 */
  suggestions: string[]
  /** 标签 */
  tags: string[]
}

// ─── 辅助函数 ───

/** 根据强弱评分获取等级 */
export function getStrengthLevel(score: number): StrengthLevel {
  if (score >= 80) return '极强'
  if (score >= 60) return '偏强'
  if (score >= 40) return '中和'
  if (score >= 20) return '偏弱'
  return '极弱'
}

/** 判断五行生克关系 */
export function getElementRelation(source: FiveElement, target: FiveElement): '生' | '克' | '同' | '被生' | '被克' {
  if (source === target) return '同'
  if (FIVE_ELEMENT_SHENG[source] === target) return '生'
  if (FIVE_ELEMENT_KE[source] === target) return '克'
  if (FIVE_ELEMENT_SHENG[target] === source) return '被生'
  if (FIVE_ELEMENT_KE[target] === source) return '被克'
  return '同'
}
