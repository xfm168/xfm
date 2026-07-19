/**
 * H3 Module 4: Professional Pattern Engine — 格局类型定义
 *
 * 包含：
 * - 格局分类（正格/特殊格）
 * - 格局等级
 * - 格局流派
 * - 格局规则
 * - 格局详情
 * - 格局评分
 * - 格局判断链
 * - 引擎最终输出
 */

import type {
  HeavenlyStem, EarthlyBranch, FiveElement,
  ShenShi, YinYang,
} from '@/lib/core/types/base'
import type { DerivationChain } from './types'

// ─── 格局分类 ───

/** 格局大类 */
export type PatternClass = '正格' | '特殊格'

/** 格局子类型 */
export type PatternType =
  // 正格（10种）
  | '正官格' | '七杀格' | '正印格' | '偏印格'
  | '正财格' | '偏财格' | '食神格' | '伤官格'
  | '建禄格' | '月刃格'
  // 特殊格（10种）
  | '从格' | '专旺格' | '化气格'
  | '炎上格' | '润下格' | '稼穑格' | '曲直格'
  | '从儿格' | '从财格' | '从杀格'

/** 正格列表 */
export const ZHENG_PATTERNS: PatternType[] = [
  '正官格', '七杀格', '正印格', '偏印格',
  '正财格', '偏财格', '食神格', '伤官格',
  '建禄格', '月刃格',
]

/** 特殊格列表 */
export const SPECIAL_PATTERNS: PatternType[] = [
  '从格', '专旺格', '化气格',
  '炎上格', '润下格', '稼穑格', '曲直格',
  '从儿格', '从财格', '从杀格',
]

/** 所有格局类型 */
export const ALL_PATTERNS: PatternType[] = [...ZHENG_PATTERNS, ...SPECIAL_PATTERNS]

// ─── 格局流派 ───

/** 支持的命理流派 */
export type PatternSchool = '子平' | '滴天髓' | '子平真诠' | '穷通宝鉴'

/** 所有流派 */
export const ALL_SCHOOLS: PatternSchool[] = ['子平', '滴天髓', '子平真诠', '穷通宝鉴']

/** 流派配置 */
export interface SchoolConfig {
  /** 流派名称 */
  name: PatternSchool
  /** 是否启用 */
  enabled: boolean
  /** 权重（用于多流派综合评分） */
  weight: number
}

/** 默认流派配置 */
export const DEFAULT_SCHOOL_CONFIG: SchoolConfig[] = [
  { name: '子平', enabled: true, weight: 1.0 },
  { name: '滴天髓', enabled: true, weight: 0.9 },
  { name: '子平真诠', enabled: true, weight: 0.95 },
  { name: '穷通宝鉴', enabled: false, weight: 0.8 },
]

// ─── 格局等级 ───

/** 格局成格等级 */
export type PatternGrade =
  | '大成'    // 成格度 >= 85
  | '中成'    // 成格度 60-84
  | '小成'    // 成格度 40-59
  | '不成'    // 成格度 < 40
  | '破格'    // 存在严重破格因素

/** 格局成格等级阈值 */
export const PATTERN_GRADE_THRESHOLDS = {
  '大成': 85,
  '中成': 60,
  '小成': 40,
  '不成': 20,
  '破格': 0,
} as const

/** 根据成格度获取等级 */
export function getPatternGrade(score: number): PatternGrade {
  if (score >= PATTERN_GRADE_THRESHOLDS['大成']) return '大成'
  if (score >= PATTERN_GRADE_THRESHOLDS['中成']) return '中成'
  if (score >= PATTERN_GRADE_THRESHOLDS['小成']) return '小成'
  if (score >= PATTERN_GRADE_THRESHOLDS['不成']) return '不成'
  return '破格'
}

// ─── 格局规则 ───

/** 格局规则判定函数签名 */
export type PatternRuleCheckFn = (context: PatternRuleContext) => boolean

/** 格局规则判定上下文 */
export interface PatternRuleContext {
  /** 月令十神 */
  monthCommandShenShi: ShenShi
  /** 月令地支 */
  monthZhi: EarthlyBranch
  /** 月令本气天干 */
  monthBenGan: HeavenlyStem
  /** 月令五行 */
  monthElement: FiveElement
  /** 日主天干 */
  dayMaster: HeavenlyStem
  /** 日主五行 */
  dayMasterElement: FiveElement
  /** 日主阴阳 */
  dayMasterYinYang: YinYang
  /** 十神力量映射（name → power） */
  tenGodPower: Record<string, number>
  /** 十神出现次数映射 */
  tenGodCount: Record<string, number>
  /** 十神得令标记 */
  tenGodDeLing: Record<string, boolean>
  /** 五行力量分布 */
  fiveElementPower: Record<string, number>
  /** 五行总出现次数 */
  fiveElementCount: Record<string, number>
  /** 天干列表（年月日时） */
  heavenlyStems: [HeavenlyStem, HeavenlyStem, HeavenlyStem, HeavenlyStem]
  /** 地支列表（年月日时） */
  earthlyBranches: [EarthlyBranch, EarthlyBranch, EarthlyBranch, EarthlyBranch]
  /** 日主旺衰 */
  dayMasterWangShuai: '旺' | '相' | '休' | '囚' | '死'
}

/** 格局规则定义 */
export interface PatternRule {
  /** 规则 ID */
  id: string
  /** 格局名称 */
  patternName: PatternType
  /** 格局分类 */
  patternClass: PatternClass
  /** 适用流派 */
  school: PatternSchool[]
  /** 规则优先级（越高越优先） */
  priority: number
  /** 规则判定函数 */
  check: PatternRuleCheckFn
  /** 规则描述 */
  description: string
  /** 古典依据 */
  reference: string
  /** 涉及的十神 */
  involvedShenShi: ShenShi[]
  /** 破格条件（如果满足则破格） */
  breakConditions?: PatternRuleCheckFn[]
  /** 成格加分条件 */
  boostConditions?: PatternRuleCheckFn[]
}

// ─── 格局评分拆分 ───

/** 格局评分明细（Pattern Score Detail） */
export interface PatternScoreDetail {
  /** 月令基础分（权重30%） */
  monthCommandBase: number
  /** 透干条件分（权重20%） */
  touGanCondition: number
  /** 根气支持分（权重15%） */
  rootSupport: number
  /** 十神配合分（权重15%） */
  shenShiHarmony: number
  /** 五行平衡分（权重10%） */
  fiveElementBalance: number
  /** 破格影响分（可为负，权重10%） */
  breakImpact: number
}

// ─── 成格条件链 ───

/** 成格条件状态 */
export type FormationConditionStatus = 'satisfied' | 'missing' | 'breaking'

/** 成格条件条目 */
export interface FormationCondition {
  /** 条件描述 */
  description: string
  /** 条件状态 */
  status: FormationConditionStatus
  /** 涉及十神（可为空） */
  involvedShenShi: ShenShi[]
  /** 古典依据 */
  reference: string
}

/** 成格条件链 */
export interface FormationChain {
  /** 格局名称 */
  patternName: PatternType
  /** 所有判定条件 */
  conditions: FormationCondition[]
  /** 已满足条件数 */
  satisfiedCount: number
  /** 缺失条件数 */
  missingCount: number
  /** 破格条件数 */
  breakingCount: number
}

// ─── 格局冲突 ───

/** 格局冲突结果 */
export interface PatternConflictResult {
  /** 主格局 */
  mainPattern: PatternType
  /** 副格局列表 */
  secondaryPatterns: PatternType[]
  /** 冲突说明 */
  conflictDescription: string
  /** 处理方式（priority/absorb/relegate） */
  resolutionMethod: 'priority' | 'absorb' | 'relegate'
}

// ─── 流派详细结果 ───

/** 单个流派详细结果 */
export interface SchoolResult {
  /** 流派名称 */
  school: PatternSchool
  /** 是否支持该格局 */
  matched: boolean
  /** 该流派给的成格度 */
  formScore: number
  /** 该流派权重 */
  weight: number
  /** 加权得分 */
  weightedScore: number
  /** 该流派识别的格局名 */
  patternName: PatternType
  /** 该流派特有的破格因素 */
  breakFactors: BreakFactor[]
  /** 该流派给出的理由 */
  reason: string
}

// ─── 破格因素 ───

/** 破格因素 */
export interface BreakFactor {
  /** 破格因素描述 */
  description: string
  /** 严重程度 0-100 */
  severity: number
  /** 涉及十神 */
  involvedShenShi: ShenShi[]
  /** 古典依据 */
  reference: string
}

// ─── 格局详情 ───

/** 格局详情 */
export interface PatternDetail {
  /** 格局名称 */
  name: PatternType
  /** 格局分类 */
  patternClass: PatternClass
  /** 成格度 0-100 */
  formScore: number
  /** 格局等级 */
  grade: PatternGrade
  /** 是否为主格局 */
  isPrimary: boolean
  /** 是否为副格局 */
  isSecondary: boolean
  /** 支持的流派 */
  matchedSchools: PatternSchool[]
  /** 成格优势 */
  advantages: string[]
  /** 格局风险 */
  risks: string[]
  /** 破格因素 */
  breakFactors: BreakFactor[]
  /** 成败原因分析 */
  analysis: string
  /** 调整方向建议 */
  adjustments: string[]
  /** 综合建议 */
  suggestions: string[]
  /** 综合可信度 0-100 */
  confidence: number
  /** 评分拆分明细 */
  scoreDetail: PatternScoreDetail
  /** 成格条件链 */
  formationChain: FormationChain
  /** 流派详细结果 */
  schoolResults: SchoolResult[]
}

// ─── 流派评分 ───

/** 单个流派对格局的评分 */
export interface SchoolEvaluation {
  /** 流派名称 */
  school: PatternSchool
  /** 是否支持该格局 */
  matched: boolean
  /** 该流派给的成格度 */
  formScore: number
  /** 该流派权重 */
  weight: number
  /** 加权得分 */
  weightedScore: number
  /** 该流派特有的破格因素 */
  breakFactors: BreakFactor[]
}

// ─── 引擎配置 ───

/** 格局引擎选项 */
export interface PatternEngineOptions {
  /** 性别 */
  gender: string
  /** 专业配置 */
  config?: import('./config').ProfessionalConfig
  /** 流派配置（null 则使用默认） */
  schoolConfig?: SchoolConfig[] | null
}

// ─── 引擎最终输出 ───

/** 格局引擎最终输出 */
export interface PatternEngineOutput {
  /** 引擎版本 */
  version: string
  /** 日主天干 */
  dayMaster: HeavenlyStem
  /** 日主五行 */
  dayMasterElement: FiveElement
  /** 主格局 */
  primaryPattern: PatternDetail | null
  /** 副格局列表 */
  secondaryPatterns: PatternDetail[]
  /** 所有识别到的格局（按成格度降序） */
  allPatterns: PatternDetail[]
  /** 格局冲突处理结果 */
  patternConflictResult: PatternConflictResult | null
  /** 候选格局列表（来自 Module 3 possiblePatterns） */
  candidates: import('./tenGodsTypes').PatternCandidate[]
  /** 流派评分详情 */
  schoolEvaluations: SchoolEvaluation[]
  /** 流派详细结果（含理由） */
  schoolResults: SchoolResult[]
  /** 总体格局评分 0-100 */
  overallPatternScore: number
  /** 总体可信度 0-100 */
  overallConfidence: number
  /** 是否识别到格局 */
  patternRecognized: boolean
  /** 使用的流派配置 */
  schoolConfig: SchoolConfig[]
  /** 月令十神 */
  monthCommandShenShi: ShenShi
  /** 月令 */
  monthZhi: EarthlyBranch
  /** 警告信息 */
  warnings: string[]
  /** 计算耗时 ms */
  computeTimeMs: number
  /** 执行元数据 */
  executionMetadata: PatternExecutionMetadata
  /** 缓存版本号 */
  cacheVersion: string
  /** 推导链 */
  derivation?: DerivationChain
}

/** 格局执行元数据 */
export interface PatternExecutionMetadata {
  /** 执行耗时 ms */
  executionTime: number
  /** 总规则数 */
  ruleCount: number
  /** 匹配规则数 */
  matchedRules: number
  /** 评估流派数 */
  evaluatedSchools: number
}
