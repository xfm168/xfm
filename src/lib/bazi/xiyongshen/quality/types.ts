/**
 * Sprint3-5 命理质量控制体系（Quality System）— 统一类型层
 *
 * 玄风门最核心的质量闭环：
 *   古籍规则 → 七大子引擎 → Evidence → Unified Decision Core → DecisionResult
 *        ↓
 *   AccuracyCenter + CaseDatabase + ExplainScore + ClassicCenter
 *        ↓
 *   RuleBenchmark + SchoolBenchmark + Dashboard + CaseSimilarity
 *        ↓
 *   持续优化算法（而非盲目增加规则
 *
 * 模块：
 *   ① AccuracyCenter — Rule/Engine/Decision 三级准确率
 *   ② CaseDatabase — 古籍/公开命例数据库
 *   ③ ExplainScore — 自然语言解释质量量化
 *   ④ ClassicCenter — 古籍原文库 + 引用合法性校验
 *   ⑤ RuleBenchmark — 每条规则的价值量化（命中/误判/冲突/贡献/淘汰）
 *   ⑥ SchoolBenchmark — 八大流派排名（一致率/分歧率/Ranking）
 *   ⑦ EngineDashboard — 实时运维面板
 *   ⑧ DecisionResult V3 — 加入 Accuracy/ExplainScore/RuleBenchmark/SchoolBenchmark/CaseSimilarity
 *   ⑨ CaseSimilarity — 历史命例 Top-N 相似度
 */

import type { Wuxing } from '../../types'
import type { SubEngineResult } from '../types'

// ============================================================
// ① AccuracyCenter 类型
// ============================================================

/** Rule 级准确率 */
export interface RuleAccuracy {
  /** 规则 ID（符合 B2 规范 XXX-YYY-###） */
  ruleId: string
  /** 命中总数 */
  hitCount: number
  /** 执行总次数 */
  runCount: number
  /** 准确率 0~1 */
  hitRate: number
  /** 误判次数（与最终结论相反） */
  misjudgeCount: number
  /** 误判率 0~1 */
  misjudgeRate: number
  /** 贡献率（对最终正确决策的正向贡献次数 / runCount） */
  contributionRate: number
  /** 最后一次评估时间戳 */
  lastEvaluatedAt: number
}

/** Engine 级准确率 */
export interface EngineAccuracy {
  engineName: string
  /** 该引擎推荐/反对/中立 与最终决策一致率 */
  primaryAgreement: number
  /** 主用神推荐命中率 */
  primaryHitRate: number
  /** 喜神推荐命中率 */
  assistantHitRate: number
  /** 忌神推荐命中率 */
  avoidHitRate: number
  /** 整体准确率（综合） */
  overallAccuracy: number
  /** 评估样本数 */
  sampleSize: number
  /** 运行次数 */
  runCount: number
}

/** Decision 级准确率（当前命局自评估） */
export interface DecisionAccuracy {
  /** 自评估置信度（来自 DecisionResult.confidence 基础） */
  selfConfidence: number
  /** 内部一致性（7 Engine 内部一致率） */
  internalConsistency: number
  /** 古籍一致性（ClassicSupport 支持度） */
  classicConsistency: number
  /** 流派一致性（SchoolConsensus 跨流派一致率） */
  schoolConsistency: number
  /** 冲突惩罚后综合 Accuracy Score 0~1 */
  overallAccuracyScore: number
}

/** AccuracyCenter 单次推演后输出 */
export interface AccuracyReport {
  /** Rule 级准确率（只包含当前命例实际执行的规则） */
  ruleAccuracy: Record<string, RuleAccuracy>
  /** Engine 级准确率 */
  engineAccuracy: Record<string, EngineAccuracy>
  /** Decision 级准确率 */
  decisionAccuracy: DecisionAccuracy
  /** 总体评估样本数 */
  evaluatedAt: number
  /** 版本 */
  version: string
}

// ============================================================
// ② CaseDatabase 类型
// ============================================================

/** 命例来源枚举 */
export type CaseSourceType =
  | 'ditiansui'         // 滴天髓
  | 'zipingzhenquan'    // 子平真诠
  | 'qiongtong'         // 穷通宝鉴
  | 'sanming'            // 三命通会
  | 'yuanhaiziping'      // 渊海子平
  | 'shenfengtongkao'   // 神峰通考
  | 'qiongtongfu'       // 穷通赋
  | 'modern_public'      // 现代公开命例

/** 历史大运流年事件标签（真实人生事件，用于交叉验证） */
export interface CaseLifeEvent {
  /** 年龄/岁 */
  age: number
  /** 年份（如 1998） */
  year?: string
  /** 干支（如 戊戌） */
  ganzhi?: string
  /** 事件类别 */
  category: 'career' | 'marriage' | 'wealth' | 'health' | 'family' | 'education' | 'other'
  /** 事件描述（短） */
  summary: string
  /** 事件验证结论（用神是否应验） */
  yongShenVerified?: 'verified' | 'partial' | 'not_verified' | 'contradict'
}

/** 标准命例数据结构（CaseDatabase 单元） */
export interface BaziCase {
  /** 唯一 ID */
  caseId: string
  /** 命例名称（如「滴天髓·任铁樵注·某侍郎命」） */
  name: string
  /** 来源 */
  source: CaseSourceType
  /** 来源章节/页码/原文摘录 */
  sourceSection?: string
  /** 出生资料（可公开） */
  birthInfo?: {
    birthday?: string
    birthTime?: string
    gender?: 'male' | 'female' | 'unknown'
  }
  /** 四柱 */
  fourPillars: {
    year: { gan: string; zhi: string }
    month: { gan: string; zhi: string }
    day: { gan: string; zhi: string }
    hour?: { gan: string; zhi: string }
  }
  /** 五行计数 */
  wuxingCount: Record<Wuxing, number>
  /** 日主 */
  dayGan: string
  /** 旺衰判断（参考/标准） */
  wangShuaiLabel?: '极旺' | '偏旺' | '中和' | '偏弱' | '极弱'
  /** 格局 */
  gejuLabel?: string
  /** 调候 */
  tiaohouLabel?: string
  /** 病药 */
  bingyaoLabel?: string
  /** 通关 */
  tongguanLabel?: string
  /** 【标准最终喜用神（权威答案） */
  groundTruth: {
    /** 主用神（正确答案） */
    primaryYongShen?: Wuxing
    /** 次用神 */
    secondaryYongShen?: Wuxing
    /** 喜神 */
    assistantGod?: Wuxing
    /** 忌神 */
    avoidGod?: Wuxing
    /** 闲神 */
    idleGod?: Wuxing
    /** 是否多用神 */
    isMultiYongShen?: boolean
    /** 置信度（权威答案自身可信度 0~1，如不同古籍分歧大时低） */
    confidence: number
  }
  /** 古籍原文摘录 */
  classicTexts?: Array<{
    classicName: string
    chapter?: string
    text: string
  }>
  /** 现代命理结论（如多人/多派综合） */
  modernConclusion?: string[]
  /** 大运（可验证） */
  dayun?: Array<{
    startAge: number
    ganzhi: string
    note?: string
  }>
  /** 流年验证事件 */
  lifeEvents?: CaseLifeEvent[]
  /** 整体命例置信度 0~1（用于加权 Accuracy） */
  caseConfidence: number
  /** 创建时间戳 */
  createdAt: number
}

// ============================================================
// ③ ExplainScore 类型
// ============================================================

/** Explain 解释评分项 */
export interface ExplainBreakdown {
  /** 完整性 0~1（是否覆盖了用神/喜/忌/闲 + 策略 + 优先级 + 投票 + 冲突） */
  completeness: number
  /** 古籍引用 0~1（是否引用≥2部古籍+具体章节） */
  classicCitation: number
  /** 冲突解释 0~1（是否解释了冲突+裁决理由） */
  conflictExplanation: number
  /** 流派理由 0~1（是否解释了为何当前派选择+为何不用其他派） */
  schoolReason: number
  /** 推导过程 0~1（从 Evidence→Vote→Decision 的完整链路） */
  reasoningProcess: number
  /** 可读性 0~1（段落清晰、无过度黑话、用户可懂） */
  readability: number
  /** 总分（加权合成 0~100） */
  totalScore: number
  /** 建议改进点 */
  improvementHints: string[]
}

// ============================================================
// ④ ClassicCenter 类型
// ============================================================

/** 单条古籍条目（权威原文来源） */
export interface ClassicEntry {
  /** 经典 ID（如 QIONGTONG-ZI-017） */
  entryId: string
  /** 古籍名称（滴天髓/子平真诠/穷通宝鉴…） */
  classicName: string
  /** 卷/篇/章节 */
  chapter: string
  /** 原文句子/段落 */
  originalText: string
  /** 上下文（前后各 1~2 句，避免断章取义） */
  contextBefore?: string
  contextAfter?: string
  /** 主题标签（调候/扶抑/病药/通关/格局） */
  topics: Array<'tiaohou' | 'fuyi' | 'bingyao' | 'tongguan' | 'geju' | 'other'>
  /** 相关日主 */
  relatedDayGan?: string[]
  /** 相关月令 */
  relatedMonthZhi?: string[]
  /** 推荐取用（这条古籍支持的五行） */
  recommendWuxing?: Wuxing[]
  /** 反对取用（这条古籍反对的五行） */
  avoidWuxing?: Wuxing[]
  /** 这条古籍的流派归属（如 Qiongtong/Ziping/...） */
  schools: string[]
  /** 被引用历史次数（统计） */
  citationCount: number
  /** 可信度评估（是否伪托/版本差异 0~1） */
  authenticity: number
}

/** ClassicEvidence 引用校验结果 */
export interface ClassicCitationValidation {
  /** 引用的经典名 */
  classicName: string
  /** 声称的出处（章节/原文内容哈希） */
  citedText: string
  /** 是否在 ClassicCenter 找到匹配 */
  matched: boolean
  /** 匹配的经典条目 */
  matchedEntryId?: string
  /** 是否断章取义（上下文不匹配） */
  outOfContext: boolean
  /** 内容一致度 0~1 */
  contentSimilarity: number
  /** 引用可信度 0~1 */
  citationTrust: number
  /** 问题说明 */
  issues: string[]
}

// ============================================================
// ⑤ RuleBenchmark 类型
// ============================================================

/** 单条 Rule 基准统计 */
export interface RuleBenchmarkEntry {
  ruleId: string
  ruleName?: string
  /** 执行次数 */
  executionCount: number
  /** 命中次数（规则条件满足且结论正确） */
  hitCount: number
  /** 误判次数（规则条件满足但结论与最终正确决策冲突） */
  misjudgeCount: number
  /** 命中率 0~1 */
  hitRate: number
  /** 误判率 0~1 */
  misjudgeRate: number
  /** 冲突率（该规则触发时产生 Conflict 的比例） */
  conflictRate: number
  /** 被引用次数 */
  citationCount: number
  /** 贡献率 0~1（对最终正确决策的贡献程度） */
  contributionRate: number
  /** 淘汰率 0~1（被 RuleKill 淘汰的比例） */
  killRate: number
  /** 建议状态：keep/review/demote/deprecate */
  recommendation: 'keep' | 'review' | 'demote' | 'deprecate'
  /** 建议理由 */
  reason: string
}

/** RuleBenchmark 报告 */
export interface RuleBenchmarkReport {
  entries: Record<string, RuleBenchmarkEntry>
  /** 总体统计 */
  summary: {
    totalRules: number
    keepCount: number
    reviewCount: number
    demoteCount: number
    deprecateCount: number
    averageHitRate: number
    averageMisjudgeRate: number
  }
  generatedAt: number
}

// ============================================================
// ⑥ SchoolBenchmark 类型
// ============================================================

/** 流派基准统计 */
export interface SchoolBenchmarkEntry {
  school: string
  schoolName: string
  /** 样本数 */
  sampleSize: number
  /** 主用神准确率 */
  primaryAccuracy: number
  /** 喜神准确率 */
  assistantAccuracy: number
  /** 忌神准确率 */
  avoidAccuracy: number
  /** 总体综合得分 0~100 */
  overallScore: number
  /** 与其他流派的分歧率 */
  divergenceRate: number
  /** 一致率（跨流派 8 派中一致比例） */
  consistencyRate: number
  /** 排名（1=最准） */
  rank: number
}

/** SchoolBenchmark 报告 */
export interface SchoolBenchmarkReport {
  entries: Record<string, SchoolBenchmarkEntry>
  ranking: string[] // school key 按排名排
  generatedAt: number
}

// ============================================================
// ⑦ EngineDashboard 类型
// ============================================================

/** Dashboard 统计面板 */
export interface EngineDashboardReport {
  generatedAt: number
  /** 每个 Engine 实时数据 */
  engines: Record<string, {
    engineName: string
    /** 健康度 0~1（来自 EngineHealth） */
    health: number
    /** Evidence 累计数 */
    totalEvidence: number
    /** 满足的 Evidence 数 */
    satisfiedEvidence: number
    /** Classic 引用数 */
    classicCount: number
    /** 冲突数 */
    conflictCount: number
    /** 准确率 */
    accuracy: number
    /** 置信度平均 */
    avgConfidence: number
    /** 平均运行耗时 ms */
    avgLatencyMs: number
    /** 适用率（applicable 比例） */
    applicableRate: number
  }>
  /** 汇总统计 */
  summary: {
    totalDecisions: number
    avgConfidence: number
    avgAccuracy: number
    avgLatencyMs: number
    totalConflicts: number
    totalEvidence: number
  }
}

// ============================================================
// ⑨ CaseSimilarity 类型
// ============================================================

/** 相似度匹配结果条目 */
export interface SimilarCaseMatch {
  /** 匹配的 Case */
  caseId: string
  /** 命例名称 */
  caseName: string
  /** 来源 */
  source: CaseSourceType
  /** 综合相似度 0~1 */
  similarity: number
  /** 分项相似度（用于解释） */
  breakdown: {
    /** 五行分布向量相似度 */
    wuxingVector: number
    /** 旺衰相似度 */
    wangshuai: number
    /** 格局相似度 */
    geju: number
    /** 调候需求相似度 */
    tiaohou: number
  }
  /** 当前命例 vs 匹配命例的相同用神 */
  yongShenMatch: {
    primaryMatch: boolean
    assistantMatch?: boolean
    avoidMatch?: boolean
  }
  /** 匹配命例的人生事件摘要（用于参考） */
  lifeSummary?: string
  /** 匹配命例的权威结论原文 */
  groundTruthHint?: string
}

/** CaseSimilarity 报告 */
export interface CaseSimilarityReport {
  /** Top-N 相似命例 */
  topMatches: SimilarCaseMatch[]
  /** 最高相似度 0~1 */
  maxSimilarity: number
  /** 生成时间戳 */
  generatedAt: number
}

// ============================================================
// ⑩ 汇总输入输出：AccuracyCenter + CaseDatabase 等聚合
// ============================================================

/** 命例向量（用于相似度计算） */
export interface MingjuVector {
  /** 五行计数向量（木火土金水） */
  wuxing: [number, number, number, number, number]
  /** 日主强弱（-2~2） */
  dayStrength: number
  /** 月令五行索引（0=春木1=夏火...用于调候） */
  seasonIdx: number
  /** 格局类别索引（0~N 编号） */
  patternIdx: number
  /** 是否冬/夏生（调候优先级向量） */
  climateTag: [number, number] // [isWinter?1:0, isSummer?1:0]
}

/** 一次完整 Quality 汇总（DecisionResult V3 所需字段子集） */
export interface QualityBundle {
  accuracyReport: AccuracyReport
  explainScore: ExplainBreakdown
  ruleBenchmark: RuleBenchmarkReport
  schoolBenchmark?: SchoolBenchmarkReport
  dashboard?: EngineDashboardReport
  similarCases?: CaseSimilarityReport
}
