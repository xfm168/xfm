/**
 * Evidence Fusion Decision Engine - 统一类型层
 *
 * 设计目标：
 * 1. 不简单加权平均，而是 Evidence Fusion Decision
 * 2. 支持多用神（Primary / Secondary / Assistant / Avoid / Idle）
 * 3. 支持流派模式（SchoolProfile）
 * 4. 完整 DecisionTrace 决策回溯
 * 5. Rule Voting 规则投票
 * 6. Evidence 冲突解释
 * 7. 统一 DecisionResult 输出，为紫微/奇门/六爻预留接口
 *
 * 架构层级：
 *   子引擎（Rule）→ Evidence → EvidenceFusionEngine → DecisionResult → AI
 *   八字 / 紫微 / 奇门 / 六爻 / 风水 → 同一套 DecisionResult
 */

import type { Wuxing, ShenType } from '../../types'
import type { ClassicEvidenceRef } from '../../../ruleEngine/types'
import type { SubEngineResult } from '../types'

// ============================================================
// 第一部分：通用决策类型（跨命理系统，紫微/奇门/六爻可复用）
// ============================================================

/** 命理系统类型（为未来扩展预留） */
export type DivinationSystem = 'bazi' | 'ziwei' | 'qimen' | 'liuyao' | 'fengshui'

/** 神类（支持多用神） */
export type YongShenRole =
  | 'primary'      // 主用神
  | 'secondary'    // 次用神（多用神场景）
  | 'assistant'    // 辅助神（喜神）
  | 'avoid'        // 忌神
  | 'idle'         // 闲神

/** 单个用神的裁决结果 */
export interface YongShenVerdict {
  /** 五行 */
  wuxing: Wuxing
  /** 神类角色 */
  role: YongShenRole
  /** 最终决策分（Evidence Fusion 后的综合分） */
  finalScore: number
  /** 可信度 0~1 */
  confidence: number
  /** 该五行的投票统计 */
  vote: RuleVoteSummary
  /** 古籍支持度 */
  classicSupport: ClassicSupport
  /** 决策回溯（为什么定这个五行） */
  trace: DecisionTrace
  /** 是否与其他五行形成并用关系（如木火同用） */
  combinedWith?: Wuxing[]
}

// ============================================================
// 第二部分：Rule Priority Matrix（规则优先级矩阵）
// ============================================================

/** 命局特征类型（用于动态计算优先级） */
export type MingjuPatternType =
  | 'winter_fire'       // 冬火：调候优先
  | 'summer_water'      // 夏水：调候优先
  | 'extreme_strong'    // 身旺极旺：扶抑优先
  | 'extreme_weak'      // 身弱极弱：扶抑优先
  | 'medicine_pattern'  // 病药格：病药优先
  | 'bridge_war'        // 金木大战/两神交战：通关优先
  | 'special_pattern'   // 特殊格局：格局优先
  | 'balanced'          // 中和：均衡模式

/** 单引擎的优先级条目 */
export interface RulePriorityEntry {
  /** 引擎名 */
  engineName: string
  /** 动态优先级（0~1，和为 1） */
  priority: number
  /** 原始固定权重（来自 SchoolProfile） */
  baseWeight: number
  /** 调整因子（动态倍率） */
  adjustmentFactor: number
  /** 优先级依据（如"冬火调候优先"） */
  reason: string
  /** 来源的命局特征 */
  sourcePattern?: MingjuPatternType
}

/** 规则优先级矩阵（动态，非固定 Weight） */
export interface RulePriorityMatrix {
  /** 识别到的命局特征（可能多个） */
  detectedPatterns: MingjuPatternType[]
  /** 命局特征摘要 */
  patternSummary: string
  /** 各引擎优先级条目（已归一化，priority 和为 1） */
  entries: RulePriorityEntry[]
  /** 按引擎名快速索引 */
  byEngine: Record<string, RulePriorityEntry>
  /** 生成时间戳 */
  generatedAt: number
}

// ============================================================
// 第三部分：Rule Vote V2（加权投票系统）
// ============================================================

/** 投票立场 */
export type VoteStance = 'support' | 'oppose' | 'neutral'

/** 支持强度等级（1~5，对应 +~+++++） */
export type SupportLevel = 1 | 2 | 3 | 4 | 5

/** 单条规则投票 V2（Weighted Voting） */
export interface RuleVote {
  /** 投票的引擎/规则名 */
  voter: string
  /** 投票的五行 */
  target: Wuxing
  /** 立场 */
  stance: VoteStance
  /** 支持强度（1~5，仅 support 时有意义） */
  supportLevel: SupportLevel
  /** 动态优先级（来自 RulePriorityMatrix） */
  priority: number
  /** 投票权重（来自 SchoolProfile 固定权重） */
  weight: number
  /** 投票强度（基于 score 绝对值，0~3） */
  strength: number
  /** 该引擎的置信度 */
  confidence: number
  /** Evidence 权重（Evidence 数量归一化 0~1） */
  evidenceWeight: number
  /** 古籍评分（引用数×古籍权重 归一化 0~1） */
  classicScore: number
  /** 最终 Vote Score（加权总分：supportLevel×priority×confidence×classicScore×evidenceWeight） */
  voteScore: number
  /** 投票依据（Evidence 摘要） */
  reason: string
  /** 古籍引用 */
  citation?: string
  /** 是否通过 Rule Gate（未通过则不计入 Voting） */
  gated: boolean
  /** Gate 拒绝原因（如未通过） */
  gateRejectReason?: string
  /** 是否被 Rule Kill（被 Kill 则不计入） */
  killed: boolean
  /** Kill 原因（如被 Kill） */
  killReason?: string
}

/** 某五行的投票汇总 V2 */
export interface RuleVoteSummary {
  /** 支持票数 */
  supportCount: number
  /** 反对票数 */
  opposeCount: number
  /** 中立票数 */
  neutralCount: number
  /** 通过 Gate 的有效投票数 */
  validVoteCount: number
  /** 被 Gate 拒绝的投票数 */
  gatedVoteCount: number
  /** 被 Kill 的投票数 */
  killedVoteCount: number
  /** 加权支持分（Σ support.voteScore - Σ oppose.voteScore） */
  weightedScore: number
  /** 支持率（有效投票中，支持 voteScore / 总 voteScore） */
  supportRate: number
  /** 是否多数共识（supportRate > 0.5） */
  hasConsensus: boolean
  /** 详细投票列表 */
  votes: RuleVote[]
}

// ============================================================
// 第四部分：Rule Gate（规则准入机制）
// ============================================================

/** Gate 检查维度 */
export interface GateCheckDimension {
  /** 检查项名 */
  name: string
  /** 当前值 */
  value: number
  /** 阈值 */
  threshold: number
  /** 是否通过 */
  passed: boolean
  /** 说明 */
  description: string
}

/** 单引擎的 Gate 检查结果 */
export interface GateResult {
  /** 引擎名 */
  engineName: string
  /** 是否通过 Gate */
  passed: boolean
  /** Gate 拒绝原因（如未通过） */
  rejectReason?: string
  /** 各维度检查详情 */
  checks: {
    applicable: GateCheckDimension
    confidence: GateCheckDimension
    evidenceCount: GateCheckDimension
    classicCount: GateCheckDimension
    engineHealth: GateCheckDimension
  }
  /** 通过前保留的 Trace（即使不参与 Fusion，也保留 Evidence） */
  traceKept: boolean
}

/** Rule Gate 准入报告 */
export interface GateReport {
  /** 总引擎数 */
  totalEngines: number
  /** 通过 Gate 的引擎数 */
  passedCount: number
  /** 被 Gate 拒绝的引擎数 */
  rejectedCount: number
  /** 通过率 */
  passRate: number
  /** 各引擎 Gate 结果 */
  results: Record<string, GateResult>
  /** Gate 配置的阈值快照 */
  thresholds: {
    minConfidence: number
    minEvidenceCount: number
    minClassicCount: number
    requireApplicable: boolean
    minEngineHealth: number
  }
  /** 摘要 */
  summary: string
}

// ============================================================
// 第五部分：Rule Kill（规则淘汰机制）
// ============================================================

/** Kill 触发原因类型 */
export type KillReasonType =
  | 'conflict_chain'        // 连续冲突（与其他引擎连续冲突≥N次）
  | 'evidence_insufficient' // Evidence 严重不足
  | 'confidence_too_low'    // 置信度过低
  | 'classic_empty'         // 古籍完全无引用
  | 'contradicts_self'      // 自相矛盾（评分前后不一致）
  | 'health_degraded'       // 引擎健康度劣化

/** 单引擎的 Kill 记录 */
export interface KillEntry {
  /** 引擎名 */
  engineName: string
  /** 是否被 Kill */
  killed: boolean
  /** Kill 原因（如被 Kill） */
  killReason?: KillReasonType
  /** Kill 说明 */
  killDescription?: string
  /** 触发 Kill 的证据值 */
  triggerValue?: number
  /** Kill 阈值 */
  killThreshold?: number
  /** 被 Kill 前的最后评分快照 */
  lastScoresSnapshot?: Record<Wuxing, number>
}

/** Rule Kill 报告 */
export interface KillReport {
  /** 总引擎数 */
  totalEngines: number
  /** 被 Kill 的引擎数 */
  killedCount: number
  /** 存活引擎数 */
  aliveCount: number
  /** 各引擎 Kill 记录 */
  entries: Record<string, KillEntry>
  /** Kill 阈值快照 */
  thresholds: {
    maxContinuousConflicts: number
    minEvidenceBeforeKill: number
    minConfidenceBeforeKill: number
  }
  /** 摘要 */
  summary: string
}

// ============================================================
// 第六部分：Classic Support（古籍支持度）
// ============================================================

/** 古籍对某五行的支持度 */
export interface ClassicSupport {
  /** 引用该五行为用的古籍列表 */
  classics: Array<{
    name: string
    ref: ClassicEvidenceRef
    /** 支持强度（引用次数） */
    count: number
  }>
  /** 总引用次数 */
  totalRefCount: number
  /** 涉及古籍数 */
  classicCount: number
  /** 古籍支持度分（0~1） */
  supportScore: number
}

// ============================================================
// 第四部分：School Consensus（流派共识）
// ============================================================

/** 流派对某五行的态度 */
export interface SchoolConsensus {
  /** 各流派对某五行的评分 */
  bySchool: Array<{
    school: string
    score: number
    stance: VoteStance
  }>
  /** 共识度（0~1，各流派评分一致程度） */
  consensusRate: number
  /** 是否跨流派共识 */
  hasCrossSchoolConsensus: boolean
}

// ============================================================
// 第五部分：Conflict Report（冲突解释）
// ============================================================

/** 引擎间冲突 */
export interface EngineConflict {
  /** 冲突的五行 */
  wuxing: Wuxing
  /** 冲突方 A */
  engineA: string
  /** 冲突方 A 的评分 */
  scoreA: number
  /** 冲突方 A 的建议 */
  stanceA: VoteStance
  /** 冲突方 B */
  engineB: string
  /** 冲突方 B 的评分 */
  scoreB: number
  /** 冲突方 B 的建议 */
  stanceB: VoteStance
  /** 冲突强度（评分差绝对值） */
  conflictIntensity: number
  /** 冲突来源（为什么冲突） */
  conflictSource: string
  /** 采用哪一派 */
  adoptedSide: 'A' | 'B' | 'both' | 'neither'
  /** 为什么采用这一派 */
  adoptionReason: string
  /** 为什么舍弃另一派 */
  rejectionReason: string
}

/** 冲突 V2：包含双方 Evidence / Classic / Priority 完整链路 */
export interface EngineConflictV2 extends EngineConflict {
  /** 冲突方 A 的完整 Evidence 列表 */
  evidenceA: Array<{ step: string; text: string; satisfied?: boolean }>
  /** 冲突方 B 的完整 Evidence 列表 */
  evidenceB: Array<{ step: string; text: string; satisfied?: boolean }>
  /** 冲突方 A 的古籍引用 */
  classicsA: ClassicEvidenceRef[]
  /** 冲突方 B 的古籍引用 */
  classicsB: ClassicEvidenceRef[]
  /** 冲突方 A 在 RulePriorityMatrix 中的优先级 */
  priorityA: number
  /** 冲突方 B 在 RulePriorityMatrix 中的优先级 */
  priorityB: number
  /** 裁决时使用的优先级依据文本（如"冬火调候优先级高于病药体系"） */
  priorityBasis: string
  /** 裁决引用的古籍（如《穷通宝鉴》《滴天髓》） */
  adjudicatingClassics: string[]
}

/** 冲突报告 V2：完整链路分析 */
export interface ConflictReport {
  /** 所有冲突列表（V2 兼容） */
  conflicts: EngineConflictV2[]
  /** 冲突总数 */
  totalConflicts: number
  /** 最大冲突强度 */
  maxIntensity: number
  /** 冲突惩罚分（影响最终 confidence） */
  conflictPenalty: number
  /** 已裁决的冲突数（有明确 adoptedSide） */
  adjudicatedCount: number
  /** 未裁决的冲突数（adoptedSide=neither） */
  unadjudicatedCount: number
  /** 按五行分组的冲突统计 */
  byWuxing: Record<Wuxing, number>
  /** 按引擎对分组的冲突统计 */
  byEnginePair: Record<string, number>
  /** 冲突解释摘要 */
  summary: string
}

// ============================================================
// 第七部分：MetaDecision（元决策层 - 玄风门大脑）
// ============================================================

/** 决策策略类型 */
export type DecisionStrategy =
  | 'multi_yongshen'    // 多用神策略
  | 'single_yongshen'   // 单用神策略
  | 'climate_first'     // 调候优先策略
  | 'balance_first'     // 扶抑优先策略
  | 'pattern_first'     // 格局优先策略
  | 'medicine_first'    // 病药优先策略
  | 'bridge_first'      // 通关优先策略
  | 'season_first'      // 寒暖燥湿优先策略
  | 'comprehensive'     // 综合权衡策略

/** 多用神策略子类型 */
export type MultiYongShenMode =
  | 'combined_use'      // 并用（如木火同用）
  | 'dual_image'        // 两神成象（如金水两神成象）
  | 'mutual_generation' // 相生并用（如木火相生）
  | 'bridge_use'        // 通关并用（如金木交战用水通关）
  | 'climate_assist'    // 调候+辅助（如冬火用木火）

/** MetaDecision 元决策结果 - 告诉 DecisionEngine 应该采用什么策略 */
export interface MetaDecision {
  /** 主决策策略 */
  primaryStrategy: DecisionStrategy
  /** 次决策策略（如同时适用多个） */
  secondaryStrategies: DecisionStrategy[]
  /** 多用神模式（仅 multi_yongshen 策略时有） */
  multiYongShenMode?: MultiYongShenMode
  /** 命局特征判断：是否多用神 */
  shouldUseMultiYongShen: boolean
  /** 命局特征判断：是否格局优先 */
  shouldPrioritizePattern: boolean
  /** 命局特征判断：是否调候优先 */
  shouldPrioritizeClimate: boolean
  /** 命局特征判断：是否扶抑优先 */
  shouldPrioritizeBalance: boolean
  /** 命局特征判断：是否病药优先 */
  shouldPrioritizeMedicine: boolean
  /** 命局特征判断：是否通关优先 */
  shouldPrioritizeBridge: boolean
  /** 用神最大数量（多用神时，最多几个） */
  maxYongShenCount: number
  /** 是否允许并用（如木火同用） */
  allowCombinedUse: boolean
  /** 策略选择的依据（命局特征列表） */
  strategyBasis: MingjuPatternType[]
  /** 策略解释说明 */
  strategyExplanation: string
  /** 各策略候选的评分（用于展示策略选择过程） */
  strategyCandidates: Array<{
    strategy: DecisionStrategy
    score: number
    reason: string
  }>
}

// ============================================================
// 第八部分：Engine Health（引擎健康度）
// ============================================================

/** 引擎健康状态 */
export type EngineHealthStatus = 'healthy' | 'warning' | 'unhealthy'

/** 单个引擎的健康度详情 */
export interface EngineHealthEntry {
  /** 引擎名 */
  engineName: string
  /** 整体健康状态 */
  status: EngineHealthStatus
  /** 健康总分（0~100） */
  healthScore: number
  /** 适用率（最近 N 次命局中适用的比例） */
  applicableRate: number
  /** 冲突率（最近 N 次命局中与其他引擎冲突的比例） */
  conflictRate: number
  /** 平均 Evidence 数量 */
  avgEvidenceCount: number
  /** 平均满足的 Evidence 数量 */
  avgSatisfiedEvidenceCount: number
  /** 平均古籍引用数量 */
  avgClassicCount: number
  /** 平均置信度 */
  avgConfidence: number
  /** 平均动态优先级 */
  avgPriority: number
  /** 被 Rule Gate 拒绝的次数 */
  gateRejectCount: number
  /** 被 Rule Kill 淘汰的次数 */
  killCount: number
  /** 健康度各维度得分 */
  dimensionScores: {
    applicability: number    // 适用性得分
    evidenceQuality: number  // Evidence 质量得分
    classicSupport: number   // 古籍支持度得分
    confidence: number       // 置信度得分
    stability: number        // 稳定性（低冲突）得分
  }
  /** 备注/说明 */
  notes?: string
}

/** 引擎健康度总报告 */
export interface EngineHealthReport {
  /** 各引擎健康度详情 */
  engines: Record<string, EngineHealthEntry>
  /** 整体系统健康度（所有引擎加权平均） */
  overallHealth: number
  /** 健康引擎数 */
  healthyCount: number
  /** 警告引擎数 */
  warningCount: number
  /** 不健康引擎数 */
  unhealthyCount: number
  /** 建议（Dashboard 展示用） */
  recommendations: string[]
  /** 生成时间戳 */
  generatedAt: number
}

// ============================================================
// 第九部分：Decision Trace（决策回溯）
// ============================================================

/** 决策回溯的单个步骤 */
export interface DecisionTraceStep {
  /** 步骤序号 */
  order: number
  /** 步骤名称 */
  name: string
  /** 贡献的引擎/规则 */
  contributor: string
  /** 贡献类型 */
  contributionType: 'score' | 'vote' | 'classic' | 'evidence' | 'confidence' | 'penalty' | 'priority'
  /** 贡献值 */
  contributionValue: number
  /** 说明 */
  description: string
  /** 关联 Evidence */
  evidenceRef?: { engineName: string; step: string; text: string }
  /** 关联规则 ID */
  ruleId?: string
  /** 关联古籍 */
  classicRef?: ClassicEvidenceRef
}

/** 完整决策回溯 */
export interface DecisionTrace {
  /** 目标五行 */
  wuxing: Wuxing
  /** 最终得分 */
  finalScore: number
  /** 回溯步骤（按顺序） */
  steps: DecisionTraceStep[]
  /** 用户可读的完整回溯说明 */
  narrative: string
}

// ============================================================
// 第十部分：Evidence Tree V2（真正的树结构）
// ============================================================

/** 树节点类型 */
export type TreeNodeType =
  | 'decision'       // 根：最终决策
  | 'engine'         // 层1：子引擎（Strength/Climate/...）
  | 'rule'           // 层2：规则（引擎内的具体判断规则）
  | 'evidence'       // 层3：Evidence 条目
  | 'classic'        // 层3：古籍引用条目

/** 证据树 V2 - 真正的树结构（Decision → Engine → Rule/Evidence/Classic） */
export interface EvidenceTreeNode {
  /** 节点唯一 ID（用于前端展开定位） */
  nodeId: string
  /** 节点类型 */
  nodeType: TreeNodeType
  /** 节点显示名称 */
  label: string
  /** 该节点关联的五行（可选） */
  wuxing?: Wuxing
  /** 是否可展开 */
  expandable: boolean
  /** 是否已展开（前端状态，可选） */
  expanded?: boolean
  /** 是否满足/通过（Evidence 和 Rule 用） */
  satisfied?: boolean
  /** 置信度/得分（节点级别，0~1） */
  score?: number
  /** 关联说明文本 */
  description?: string
  /** 关联古籍引用（classic 节点或引用它的节点） */
  citation?: ClassicEvidenceRef
  /** 关联 Evidence 步骤（evidence 节点） */
  evidenceStep?: string
  /** 子节点（Decision→Engines→Rules→Evidences/Classics） */
  children?: EvidenceTreeNode[]
  /** 来源引擎名（engine 节点及以下带） */
  engineName?: string
  /** 扩展数据（用于特定节点类型） */
  metadata?: Record<string, unknown>
}

/** 证据节点 V1（保留向后兼容的扁平结构） */
export interface EvidenceNode {
  /** 引擎名 */
  engineName: string
  /** 是否适用 */
  applicable: boolean
  /** 跳过原因 */
  skipReason?: string
  /** Evidence 条目 */
  evidence: Array<{
    step: string
    text: string
    satisfied?: boolean
    citation?: string
  }>
  /** 古籍引用 */
  classicEvidence: ClassicEvidenceRef[]
  /** 该引擎的 confidence */
  confidence: number
  /** 该引擎权重 */
  weight: number
  /** 该引擎对各五行的评分 */
  scores: Record<Wuxing, number>
  /** 该引擎摘要 */
  summary: string
}

/** 证据树（V2 + V1 兼容） */
export interface EvidenceTree {
  // ===== V2 真正的树结构（前端点击直接展开） =====
  /** 根节点：Decision → 各引擎 → Rule/Evidence/Classic */
  root: EvidenceTreeNode
  /** 按引擎名索引的引擎节点（便于快速查找） */
  engineNodes: Record<string, EvidenceTreeNode>
  /** 树的最大深度 */
  maxDepth: number
  /** 树的总节点数 */
  totalNodeCount: number

  // ===== V1 扁平结构（向后兼容） =====
  /** 所有引擎的 Evidence 节点（扁平） */
  nodes: EvidenceNode[]
  /** Evidence 总数 */
  totalEvidence: number
  /** satisfied Evidence 数 */
  satisfiedEvidence: number
  /** Evidence 完整度（0~1） */
  completeness: number
  /** 涉及古籍集合 */
  classics: string[]
  /** 古籍引用总数 */
  totalClassicRefs: number
}

// ============================================================
// 第八部分：Final Decision Score（最终决策评分）
// ============================================================

/** 最终决策评分的构成（非简单加权平均） */
export interface FinalDecisionScoreBreakdown {
  /** 五行 */
  wuxing: Wuxing
  /** 1. 加权评分（score × priority × confidence） */
  weightedScore: number
  /** 2. 投票分（VoteScore × voteWeight） */
  voteScore: number
  /** 3. 古籍支持分（ClassicScore × classicWeight） */
  classicScore: number
  /** 4. 证据完整度分 */
  evidenceScore: number
  /** 5. 流派共识分 */
  consensusScore: number
  /** 6. 规则优先级因子（动态 Priority） */
  priorityFactor: number
  /** 7. MetaDecision 加持（命中策略的加成因子） */
  metaBoost: number
  /** 8. 冲突惩罚分 */
  conflictPenalty: number
  /** 最终综合分 = (加权 + 投票 + 古籍 + 证据 + 共识) × Priority × MetaBoost − ConflictPenalty */
  finalScore: number
}

// ============================================================
// 第九部分：统一 DecisionResult（核心输出，AI 唯一读取接口）
// ============================================================

/**
 * 统一决策结果 V2（玄风门统一命理决策核心输出）
 *
 * 这是所有命理系统（八字/紫微/奇门/六爻/风水）的统一输出。
 * AI 层只读取这份结果，绝不重新推理（AI 仅润色 Explain，不负责计算）。
 */
export interface DecisionResult {
  // ===== 命理系统标识 =====
  /** 命理系统类型：八字/紫微/奇门/六爻/风水（未来全部复用） */
  system: DivinationSystem
  /** 使用的流派（Ziping/Qiongtong/Modern/DiTianSui/...） */
  school: string
  /** 引擎版本 */
  engineVersion: string

  // ===== 用神裁决（支持多用神） =====
  /** 主用神 */
  primaryYongShen: Wuxing
  /** 次用神（多用神场景，如木火同用） */
  secondaryYongShen?: Wuxing
  /** 辅助神（喜神） */
  assistantGod: Wuxing
  /** 忌神 */
  avoidGod: Wuxing
  /** 闲神 */
  idleGod: Wuxing
  /** 是否多用神 */
  isMultiYongShen: boolean
  /** 多用神模式说明（如"木火同用""金水两神成象"） */
  multiYongShenPattern?: string
  /** 所有用神裁决详情（每个五行一个） */
  verdicts: YongShenVerdict[]

  // ===== 评分明细 =====
  /** 各五行最终决策评分构成（非简单加权平均） */
  scoreBreakdown: FinalDecisionScoreBreakdown[]

  // ===== 可信度 =====
  /** 综合可信度 0~1 */
  confidence: number
  /** 可信度明细 */
  confidenceBreakdown: {
    /** Evidence 覆盖度 */
    evidenceCoverage: number
    /** 引擎共识度 */
    engineConsensus: number
    /** 古籍支持度 */
    classicSupport: number
    /** 流派一致性 */
    schoolConsistency: number
    /** 冲突惩罚 */
    conflictPenalty: number
  }

  // ===== V2 新增：Unified Decision Core 新模块 =====
  /** 规则优先级矩阵（动态，非固定 Weight） */
  priorityMatrix: RulePriorityMatrix
  /** Rule Gate 准入报告 */
  gateReport: GateReport
  /** Rule Kill 淘汰报告 */
  killReport: KillReport
  /** MetaDecision 元决策（玄风门大脑 - 决定采用什么策略） */
  metaDecision: MetaDecision
  /** Engine Health 引擎健康度 */
  engineHealth: EngineHealthReport
  /** Voting Summary（所有五行的加权投票汇总） */
  votingSummary: Record<Wuxing, RuleVoteSummary>

  // ===== 证据与回溯 =====
  /** 证据树 V2（真正的树结构，Decision→Engine→Rule/Evidence/Classic） */
  evidenceTree: EvidenceTree
  /** 决策回溯（每个用神的完整回溯，可完整回放） */
  decisionTraces: DecisionTrace[]
  /** 冲突报告 V2（完整链路：Source→Evidence→Classic→Priority→Decision→Discard/Adopt） */
  conflictReport: ConflictReport

  // ===== 流派与古籍 =====
  /** 古籍支持度（按五行） */
  classicSupport: Record<Wuxing, ClassicSupport>
  /** 流派共识（按五行） */
  schoolConsensus: Record<Wuxing, SchoolConsensus>

  // ===== 子引擎结果（原始） =====
  /** 所有子引擎的原始结果 */
  subEngineResults: SubEngineResult[]

  // ===== 说明 =====
  /** ExplainBuilder 生成的可解释说明（AI 仅润色，绝不重新推理） */
  explain: string
  /** 策略摘要（来自 MetaDecision 的策略说明） */
  strategy: string
  /** 综合摘要 */
  summary: string

  // ===== DecisionResult V3：Sprint3-5 命理质量控制体系聚合字段 =====
  // 说明：AI 层仅读取 DecisionResult，不再重新推理。所有量化指标都在这里。
  /** AccuracyCenter 评估：当前命局的 Rule/Engine/Decision 三级准确率 */
  accuracyScore?: import('../../quality/types').DecisionAccuracy
  /** ExplainScore：当前 Explain 的 6 维度质量评分 */
  explainScore?: import('../../quality/types').ExplainBreakdown
  /** RuleBenchmark：已执行规则的基准统计快照 */
  ruleBenchmark?: import('../../quality/types').RuleBenchmarkReport
  /** SchoolBenchmark：8 流派的准确率排名快照（批量评估后有） */
  schoolBenchmark?: import('../../quality/types').SchoolBenchmarkReport
  /** CaseSimilarity：与历史命例 Top-N 相似度匹配报告 */
  caseSimilarity?: import('../../quality/types').CaseSimilarityReport
  /** EngineDashboard：当前引擎运维面板快照 */
  engineHealthDashboard?: import('../../quality/types').EngineDashboardReport
  /** 玄风门命理质量体系版本（Sprint3-5 后固定为 3.5.x） */
  version?: string
}

// ============================================================
// 第十部分：SchoolProfile（流派配置）
// ============================================================

/**
 * 流派配置
 *
 * 不同流派下，Rule Weight / Evidence Weight / Classic Weight 全部不同。
 * 用户可切换：Ziping / Qiongtong / Modern / Balanced
 * 未来可扩展：滴天髓 / 子平真诠 / 渊海子平 / 神峰通考
 */
export interface SchoolProfile {
  /** 流派 key */
  key: string
  /** 流派名称 */
  name: string
  /** 流派描述 */
  description: string

  // ===== 1. 各子引擎权重（Rule Weight） =====
  /** 各子引擎的权重（归一化，和为 1） */
  engineWeights: {
    strength: number
    pattern: number
    climate: number
    balance: number
    medicine: number
    bridge: number
    season: number
  }

  // ===== 2. Evidence 权重 =====
  /** Evidence 各组成部分的权重 */
  evidenceWeights: {
    /** 加权评分权重 */
    scoreWeight: number
    /** 投票权重 */
    voteWeight: number
    /** 古籍支持权重 */
    classicWeight: number
    /** 证据完整度权重 */
    evidenceWeight: number
    /** 流派共识权重 */
    consensusWeight: number
  }

  // ===== 3. 古籍权重 =====
  /** 不同古籍在该流派下的权重 */
  classicWeights: Record<string, number>

  // ===== 4. 决策参数 =====
  /** 用神阈值（FinalScore >= 此值则为用神） */
  yongShenThreshold: number
  /** 多用神判定阈值（两个五行 FinalScore 差值 <= 此值则判为多用神） */
  multiYongShenThreshold: number
  /** 冲突惩罚系数 */
  conflictPenaltyFactor: number

  // ===== 5. 规则优先级 =====
  /** 引擎优先级（高优先级引擎在冲突时优先采纳） */
  enginePriorities: Record<string, number>
}

// ============================================================
// 第十一部分：Evidence Fusion Decision Engine 接口
// ============================================================

/**
 * Evidence Fusion Decision Engine 抽象接口
 *
 * 为紫微/奇门/六爻预留统一接口。
 * 不同命理系统实现此接口，输出统一的 DecisionResult。
 */
export interface IDecisionEngine {
  /** 引擎名称 */
  readonly name: string
  /** 引擎版本 */
  readonly version: string
  /** 命理系统类型 */
  readonly system: DivinationSystem
  /** 综合决策 */
  decide(input: unknown, profile?: SchoolProfile): DecisionResult
}
