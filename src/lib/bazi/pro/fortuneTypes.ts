/**
 * Module 6: 大运流年引擎 — 类型定义
 *
 * 定义起运信息、大运步骤、流年信息、事件引擎、
 * 时间评分、AI解释输出、执行元数据以及引擎输入输出等完整类型体系。
 *
 * 严格模式：禁止 any，禁止 @ts-ignore
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement, ShenShi, YinYang } from '@/lib/core/types/base'
import type { DerivationChain } from './types'

// ─── 1. 起运信息 ───

/** 起运信息：描述一个人何时开始行大运 */
export interface QiYunInfo {
  /** 起运年龄（周岁） */
  startAge: number
  /** 起运年份（公历） */
  startYear: number
  /** 起运日期（ISO 格式，如 '2000-03-05'） */
  startDate: string
  /** 是否顺行（阳男/阴女为顺行，阴男/阳女为逆行） */
  isShun: boolean
  /** 起运算法：经典算法或现代算法 */
  algorithm: 'classic' | 'modern'
  /** 上一个节气名称 */
  fromTerm: string
  /** 下一个节气名称 */
  toTerm: string
  /** 置信度 0-100，数值越高结果越可靠 */
  confidence: number
}

// ─── 2. 大运步骤 ───

/** 大运步骤：每一步大运（通常十年一步）的完整信息 */
export interface DaYunStep {
  /** 步数序号，从 0 开始 */
  index: number
  /** 起始年龄（周岁） */
  startAge: number
  /** 结束年龄（周岁） */
  endAge: number
  /** 起始年份（公历） */
  startYear: number
  /** 结束年份（公历） */
  endYear: number
  /** 大运干支 */
  ganZhi: { gan: HeavenlyStem; zhi: EarthlyBranch }
  /** 纳音（如 '海中金'） */
  naYin: string
  /** 大运天干的十神（与日主的关系） */
  shenShi: ShenShi
  /** 十二长生阶段（如 '长生'、'帝旺'） */
  changSheng: string
  /** 大运柱神煞列表 */
  shenSha: string[]
  /** 大运五行力量分布，key 为五行名称，value 为 0-100 的数值 */
  fiveElementPower: Record<string, number>
  /** 与原局四柱的关系 */
  originalRelations: RelationInfo
  /** 与格局的关系列表 */
  patternRelations: string[]
  /** 与喜用神的关系 */
  xiYongRelations: XiYongRelationInfo
  /** 总运势评分 0-100，数值越高运势越好 */
  fortuneScore: number
}

// ─── 3. 关系信息 ───

/** 关系信息：描述干支之间的冲、刑、害、破、合等关系 */
export interface RelationInfo {
  /** 冲（如 ['子午冲']） */
  chong: string[]
  /** 刑 */
  xing: string[]
  /** 害 */
  hai: string[]
  /** 破 */
  po: string[]
  /** 合（六合、三合、半合统称） */
  he: string[]
  /** 三合局（如 ['申子辰三合水局']） */
  sanHe: string[]
  /** 三会局（如 ['寅卯辰三会木局']） */
  sanHui: string[]
  /** 六合（如 ['子丑合']） */
  liuHe: string[]
  /** 天干冲（如 ['甲庚冲']） */
  ganChong: string[]
  /** 天干五合（如 ['甲己合']） */
  ganHe: string[]
  /** 伏吟（与原局某柱完全相同） */
  fuYin: string[]
  /** 反吟（与原局某柱天干地支互换） */
  fanYin: string[]
}

/** 喜用神关系信息：描述大运或流年与喜用神的关系 */
export interface XiYongRelationInfo {
  /** 是否为喜神五行 */
  isXiShen: boolean
  /** 是否为用神五行 */
  isYongShen: boolean
  /** 是否为忌神五行 */
  isJiShen: boolean
  /** 大运或流年天干所属五行 */
  element: FiveElement
  /** 对日主的综合影响方向 */
  influence: 'positive' | 'negative' | 'neutral'
  /** 关系描述文本 */
  description: string
}

// ─── 4. 流年信息 ───

/** 流年信息：每一年的干支及其与原局、大运的关系 */
export interface LiuNianInfo {
  /** 流年年份（公历） */
  year: number
  /** 流年干支 */
  ganZhi: { gan: HeavenlyStem; zhi: EarthlyBranch }
  /** 流年天干的十神（与日主的关系） */
  shenShi: ShenShi
  /** 十二长生阶段 */
  changSheng: string
  /** 流年柱神煞列表 */
  shenSha: string[]
  /** 流年五行力量分布，key 为五行名称，value 为 0-100 的数值 */
  fiveElementPower: Record<string, number>
  /** 与原局四柱的关系 */
  originalRelations: RelationInfo
  /** 与当前大运的关系 */
  daYunRelations: RelationInfo
  /** 原局 + 大运 + 流年三层综合关系 */
  overallRelations: RelationInfo
  /** 流年吉凶评分 0-100，数值越高越吉利 */
  luckScore: number
}

// ─── 5. 事件引擎 ───

/** 命理事件类型：大运流年中可能发生的事件分类 */
/** 命运事件类型 */
export type FortuneEventType =
  | '事业' | '财运' | '婚姻' | '恋爱' | '子女' | '考试' | '升迁'
  | '创业' | '疾病' | '官非' | '破财' | '搬迁' | '出国' | '购房' | '投资'

/** 命理事件：由引擎推导出的具体事件及其依据 */
export interface FortuneEvent {
  /** 事件类型 */
  type: FortuneEventType
  /** 发生概率 0-100 */
  probability: number
  /** 推导原因列表 */
  reasons: string[]
  /** 推导链（可追溯的推导过程） */
  traceChain: DerivationChain
  /** 置信度 0-100 */
  confidence: number
  /** 预计发生年份 */
  year: number
  /** 严重程度（针对负面事件：high / medium / low） */
  severity: 'high' | 'medium' | 'low'
  /** 是否为正面机遇 */
  opportunity: boolean
}

// ─── 6. 时间评分 ───

/** 多维度运势评分体系 */
export interface FortuneScores {
  /** 总运势评分 0-100 */
  fortuneScore: number
  /** 吉凶评分 0-100 */
  luckScore: number
  /** 事业评分 0-100 */
  careerScore: number
  /** 财运评分 0-100 */
  wealthScore: number
  /** 人际关系评分 0-100 */
  relationshipScore: number
  /** 健康评分 0-100 */
  healthScore: number
  /** 学业评分 0-100 */
  studyScore: number
  /** 机遇评分 0-100 */
  opportunityScore: number
  /** 风险评分 0-100，数值越高风险越大 */
  riskScore: number
}

// ─── 7. AI 解释输出 ───

/** AI 解释输出：对某一年的运势进行白话解释和古籍引用 */
export interface FortuneExplainOutput {
  /** 解释的年份 */
  year: number
  /** 年干支字符串（如 '甲子'） */
  yearGanZhi: string
  /** 古籍依据列表 */
  classicalBasis: string[]
  /** 白话解释文本 */
  plainExplanation: string
  /** 风险提示列表 */
  risks: string[]
  /** 机遇提示列表 */
  opportunities: string[]
  /** 建议列表 */
  suggestions: string[]
  /** 调整方案列表（如风水、行为调整等） */
  adjustments: string[]
  /** 该年关键事件列表 */
  events: FortuneEvent[]
  /** 该年多维度评分 */
  scores: FortuneScores
}

// ─── 8. 执行元数据 ───

/** 引擎执行元数据：记录本次计算的统计信息 */
export interface FortuneExecutionMetadata {
  /** 总执行时间（毫秒） */
  executionTime: number
  /** 计算的大运步数 */
  daYunSteps: number
  /** 计算的流年年数 */
  liuNianYears: number
  /** 检测到的事件总数 */
  eventsDetected: number
  /** 命中的规则总数 */
  rulesApplied: number
  /** 神煞检查总次数 */
  shenShaChecks: number
}

// ─── 9. 引擎选项 ───

/** 大运流年引擎输入选项 */
export interface FortuneEngineOptions {
  /** 性别（'male' 或 'female'） */
  gender: string
  /** 出生日期 */
  birthDate: Date
  /** 出生时辰（0-23），可选 */
  birthHour?: number
  /** 出生分钟，可选 */
  birthMinute?: number
  /** 专业配置 */
  config?: import('./config').ProfessionalConfig
  /** 学派配置列表，可为 null 表示使用默认 */
  schoolConfig?: import('./patternTypes').SchoolConfig[] | null
  /** 大运步数，默认 8 步（每步十年，共 80 年） */
  daYunSteps?: number
  /** 流年年数，默认与最后一步大运覆盖的年数一致 */
  liuNianYears?: number
  /** 起运算法：经典算法或现代算法 */
  algorithm?: 'classic' | 'modern'
}

// ─── 10. 引擎最终输出 ───

/** 大运流年引擎最终输出 */
export interface FortuneEngineOutput {
  /** 引擎版本号 */
  version: string
  /** 日主天干 */
  dayMaster: HeavenlyStem
  /** 日主五行 */
  dayMasterElement: FiveElement
  /** 起运信息 */
  qiYunInfo: QiYunInfo
  /** 大运步骤列表 */
  daYunSteps: DaYunStep[]
  /** 流年信息列表 */
  liuNianYears: LiuNianInfo[]
  /** 检测到的所有事件 */
  events: FortuneEvent[]
  /** 当前大运/流年的综合评分 */
  scores: FortuneScores
  /** 计算过程中的警告信息列表 */
  warnings: string[]
  /** 总计算耗时（毫秒） */
  computeTimeMs: number
  /** 执行元数据 */
  executionMetadata: FortuneExecutionMetadata
  /** 缓存版本标识 */
  cacheVersion: string
  /** 完整推导链（可选，用于调试和审计） */
  derivation?: DerivationChain
}