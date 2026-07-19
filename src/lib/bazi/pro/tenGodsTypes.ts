/**
 * H3 Module 3: Professional Ten Gods Engine — 类型系统
 *
 * 十神分析完整类型定义，覆盖：
 * - 十神基本属性
 * - 旺相休囚死
 * - 得令 / 得地 / 得势
 * - 十神透藏分析
 * - 十神关系（生克链）
 * - 十神组合规则
 * - 十神评分
 * - 十神关系网络
 * - AI Explain 结构化输出
 * - 引擎最终输出
 */

import type {
  HeavenlyStem, EarthlyBranch, FiveElement,
  ShenShi, WuXingWangShuai, YinYang,
} from '@/lib/core/types/base'
import type { DerivationChain } from './types'

// ─── 十神类别 ───

export type TenGodCategory =
  | '比劫'  // 比肩、劫财
  | '食伤'  // 食神、伤官
  | '财星'  // 偏财、正财
  | '官杀'  // 偏官（七杀）、正官
  | '印星'  // 偏印（枭神）、正印

// ─── 十神性质 ───

export type TenGodNature = '吉' | '凶' | '中性'

// ─── 十神位置（出现在四柱何处） ───

export type PillarPosition =
  | '年干' | '年支本气' | '年支中气' | '年支余气'
  | '月干' | '月支本气' | '月支中气' | '月支余气'
  | '日干' | '日支本气' | '日支中气' | '日支余气'
  | '时干' | '时支本气' | '时支中气' | '时支余气'

// ─── 十神单条记录 ───

export interface TenGodOccurrence {
  /** 十神名称 */
  name: ShenShi
  /** 所属分类 */
  category: TenGodCategory
  /** 吉凶属性 */
  nature: TenGodNature
  /** 出现位置 */
  position: PillarPosition
  /** 对应天干（透干时） */
  stem?: HeavenlyStem
  /** 对应地支（藏干时） */
  branch?: EarthlyBranch
  /** 藏干层级：'本气' | '中气' | '余气' | '天干' */
  layer: '天干' | '本气' | '中气' | '余气'
}

// ─── 单个十神分析结果 ───

export interface TenGodDetail {
  /** 十神名称 */
  name: ShenShi
  /** 分类 */
  category: TenGodCategory
  /** 吉凶 */
  nature: TenGodNature
  /** 对应五行 */
  element: FiveElement
  /** 出现总次数 */
  count: number
  /** 透干数 */
  touGan: number
  /** 藏干数（本气+中气+余气） */
  cangGan: number
  /** 本气数 */
  benGan: number
  /** 中气数 */
  zhongGan: number
  /** 余气数 */
  yaoGan: number
  /** 标准化力量值 0-100 */
  power: number
  /** 旺相休囚死状态 */
  wangShuai: WuXingWangShuai
  /** 得令（月支本气十神 === 此十神） */
  deLing: boolean
  /** 得地（藏干中此十神出现） */
  deDi: boolean
  /** 得势（透干数量 >= 2 或总出现数 >= 3） */
  deShi: boolean
  /** 有根（四柱中任一地支主气五行 === 此十神五行） */
  youGen: boolean
  /** 所有出现位置 */
  positions: PillarPosition[]
  /** 力量评分 0-100 */
  strengthScore: number
  /** 吉凶评分 0-100（越高越吉） */
  auspiciousScore: number
  /** 平衡评分 0-100（越高越平衡） */
  balanceScore: number
  /** 力量来源拆分明细 */
  powerBreakdown: PowerBreakdown
  /** 十神状态 */
  state: TenGodState
  /** 评分可信度 0-100 */
  confidence: number
}

export interface TouCangAnalysis {
  /** 所有十神出现记录（含每个位置） */
  occurrences: TenGodOccurrence[]
  /** 透干十神列表（按柱排序） */
  touGanList: ShenShi[]
  /** 藏干十神列表 */
  cangGanList: ShenShi[]
  /** 日干十神（固定为比肩） */
  dayGanShenShi: ShenShi
  /** 月干十神 */
  monthGanShenShi: ShenShi
  /** 时干十神 */
  hourGanShenShi: ShenShi
}

// ─── 五行力量分析 ───

export interface FiveElementPower {
  /** 五行名称 */
  element: FiveElement
  /** 原始数量（加权：天干1.0 + 本气0.6 + 中气0.3 + 余气0.1） */
  rawCount: number
  /** 百分比 0-100 */
  percentage: number
  /** 旺相休囚死 */
  wangShuai: WuXingWangShuai
  /** 是否得令（月令五行 === 此五行） */
  deLing: boolean
  /** 力量评分 0-100 */
  score: number
}

// ─── 力量来源拆分 ───

export interface PowerBreakdown {
  /** 得令贡献分 */
  deLing: number
  /** 得地贡献分 */
  deDi: number
  /** 得势贡献分 */
  deShi: number
  /** 通根贡献分 */
  youGen: number
  /** 透干贡献分 */
  touGan: number
  /** 生扶贡献分（被其他十神生的程度） */
  shengFu: number
  /** 合化贡献分 */
  heHua: number
  /** 修正值（可为负数） */
  xiuZheng: number
}

// ─── 十神状态 ───

export type TenGodState =
  | 'active'      // 活跃：有透干或藏干出现
  | 'hidden'      // 隐藏：仅藏干无透干
  | 'suppressed'  // 被压制：被克但力量低
  | 'damaged'     // 受损：严重被克
  | 'transformed' // 被合化改变

// ─── 十神关系定义 ───

export type RelationType =
  | '生' | '克' | '被生' | '被克' | '同'
  | '泄' | '耗' | '合' | '冲' | '刑' | '害' | '破'

export interface TenGodRelation {
  /** 源十神 */
  from: ShenShi
  /** 目标十神 */
  to: ShenShi
  /** 关系类型 */
  type: RelationType
  /** 关系描述 */
  description: string
  /** 关系强度 0-100 */
  strength: number
  /** 方向：forward(from→to) / backward(to→from) / bidirectional */
  direction: 'forward' | 'backward' | 'bidirectional'
  /** 关系产生原因 */
  reason: string
}

// ─── 十神关系网络 ───

export interface TenGodRelationNetwork {
  /** 所有两两关系 */
  relations: TenGodRelation[]
  /** 生克链（有序） */
  shengKeChain: string
  /** 核心关系（力量最高的前5条） */
  coreRelations: TenGodRelation[]
  /** 冲突关系（相克关系） */
  conflictRelations: TenGodRelation[]
  /** 和谐关系（相生关系） */
  harmonyRelations: TenGodRelation[]
}

// ─── 十神组合规则 ───

export interface TenGodCombination {
  /** 组合ID */
  id: string
  /** 组合名称 */
  name: string
  /** 组合分类 */
  category: '吉格' | '凶格' | '中性'
  /** 涉及十神 */
  involvedShenShi: ShenShi[]
  /** 是否命中 */
  hit: boolean
  /** 古籍依据 */
  reference: string
  /** 描述 */
  description: string
  /** 对应人生领域 */
  lifeAreas: string[]
  /** 置信度 0-1 */
  confidence: number
}

// ─── 十神关系规则库条目 ───

export interface TenGodRelationRule {
  /** 规则ID */
  id: string
  /** 关系名称 */
  name: string
  /** 规则描述 */
  description: string
  /** 涉及十神 */
  shenShi: ShenShi[]
  /** 关系类型 */
  type: '生' | '克' | '组合'
  /** 吉凶 */
  auspicious: boolean
  /** 条件判断函数 */
  check: (details: Record<string, TenGodDetail>) => boolean
  /** 优先级 */
  priority: number
  /** 出典 */
  source: string
  /** 现代解释 */
  modernExplain: string
}

// ─── AI Explain 输出 ───

export interface TenGodExplainOutput {
  /** 十神名称 */
  name: ShenShi
  /** 力量概述 */
  powerSummary: string
  /** 古籍依据 */
  classicalReference: string
  /** 现代解释 */
  modernInterpretation: string
  /** 性格特征 */
  personality: string[]
  /** 事业倾向 */
  career: string[]
  /** 财富方面 */
  wealth: string[]
  /** 婚姻感情 */
  marriage: string[]
  /** 健康关注 */
  health: string[]
  /** 适用条件 */
  conditions: string
  /** 冲突情况 */
  conflictSituation: string | null
  /** 可信度评估 */
  confidenceAssessment: string
  /** 综合建议 */
  suggestions: string[]
  /** AI 关键词（供 Prompt 调用） */
  keywords: string[]
  /** 性格特质标签 */
  traits: string[]
  /** 优势 */
  advantages: string[]
  /** 风险 */
  risks: string[]
}

// ─── 格局候选 ───

export interface PatternCandidate {
  /** 候选格局名称 */
  name: string
  /** 候选置信度 0-1 */
  confidence: number
  /** 涉及十神 */
  involvedShenShi: ShenShi[]
  /** 古典依据 */
  reference: string
}

// ─── 引擎执行元数据 ───

export interface ExecutionMetadata {
  /** 执行耗时 ms */
  executionTime: number
  /** 总规则数 */
  ruleCount: number
  /** 匹配规则数 */
  matchedRules: number
}

// ─── 引擎最终输出 ───

export interface TenGodEngineOutput {
  /** 引擎版本 */
  version: string
  /** 日主 */
  dayMaster: HeavenlyStem
  /** 日主五行 */
  dayMasterElement: FiveElement
  /** 日主阴阳 */
  dayMasterYinYang: YinYang
  /** 10种十神详细分析 */
  details: TenGodDetail[]
  /** 透藏分析 */
  touCang: TouCangAnalysis
  /** 五行力量 */
  fiveElementPower: FiveElementPower[]
  /** 十神关系网络 */
  relationNetwork: TenGodRelationNetwork
  /** 十神组合 */
  combinations: TenGodCombination[]
  /** 按力量排序的十神（从强到弱） */
  sortedByPower: ShenShi[]
  /** 主导十神（力量 > 70） */
  dominantShenShi: ShenShi[]
  /** 主要十神（力量 40-70） */
  primaryShenShi: ShenShi[]
  /** 次要十神（力量 20-40） */
  secondaryShenShi: ShenShi[]
  /** 微弱十神（力量 < 20） */
  tertiaryShenShi: ShenShi[]
  /** 总体吉凶评分 0-100 */
  overallAuspiciousScore: number
  /** 总体平衡评分 0-100（100 = 完美平衡） */
  overallBalanceScore: number
  /** 警告 */
  warnings: string[]
  /** 计算耗时 ms */
  computeTimeMs: number
  /** 引擎执行元数据 */
  executionMetadata: ExecutionMetadata
  /** 候选格局列表（供 Module 4 Pattern Engine 复用） */
  possiblePatterns: PatternCandidate[]
  /** 缓存版本号（避免旧缓存污染） */
  cacheVersion: string
  /** 推导链 */
  derivation?: DerivationChain
}
