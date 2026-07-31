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
// 第二部分：Rule Vote（规则投票）
// ============================================================

/** 投票立场 */
export type VoteStance = 'support' | 'oppose' | 'neutral'

/** 单条规则投票 */
export interface RuleVote {
  /** 投票的引擎/规则名 */
  voter: string
  /** 投票的五行 */
  target: Wuxing
  /** 立场 */
  stance: VoteStance
  /** 投票权重（来自 SchoolProfile） */
  weight: number
  /** 投票强度（基于 score 绝对值，0~3） */
  strength: number
  /** 投票依据（Evidence 摘要） */
  reason: string
  /** 古籍引用 */
  citation?: string
}

/** 某五行的投票汇总 */
export interface RuleVoteSummary {
  /** 支持票数 */
  supportCount: number
  /** 反对票数 */
  opposeCount: number
  /** 中立票数 */
  neutralCount: number
  /** 加权支持分（support 权重和 - oppose 权重和） */
  weightedScore: number
  /** 支持率（0~1） */
  supportRate: number
  /** 是否多数共识（supportRate > 0.5） */
  hasConsensus: boolean
  /** 详细投票列表 */
  votes: RuleVote[]
}

// ============================================================
// 第三部分：Classic Support（古籍支持度）
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

/** 冲突报告 */
export interface ConflictReport {
  /** 所有冲突列表 */
  conflicts: EngineConflict[]
  /** 冲突总数 */
  totalConflicts: number
  /** 最大冲突强度 */
  maxIntensity: number
  /** 冲突惩罚分（影响最终 confidence） */
  conflictPenalty: number
  /** 冲突解释摘要 */
  summary: string
}

// ============================================================
// 第六部分：Decision Trace（决策回溯）
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
// 第七部分：Evidence Tree（证据树）
// ============================================================

/** 证据节点 */
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

/** 证据树（结构化的所有 Evidence 集合） */
export interface EvidenceTree {
  /** 所有引擎的 Evidence 节点 */
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
  /** 1. 加权评分（score × weight × confidence） */
  weightedScore: number
  /** 2. 投票分（VoteScore × voteWeight） */
  voteScore: number
  /** 3. 古籍支持分（ClassicScore × classicWeight） */
  classicScore: number
  /** 4. 证据完整度分 */
  evidenceScore: number
  /** 5. 流派共识分 */
  consensusScore: number
  /** 6. 规则优先级因子 */
  priorityFactor: number
  /** 7. 冲突惩罚分（负值） */
  conflictPenalty: number
  /** 最终综合分（以上各分加权合成） */
  finalScore: number
}

// ============================================================
// 第九部分：统一 DecisionResult（核心输出，AI 唯一读取接口）
// ============================================================

/**
 * 统一决策结果
 *
 * 这是所有命理系统（八字/紫微/奇门/六爻/风水）的统一输出。
 * AI 层只读取这份结果，绝不重新推理。
 */
export interface DecisionResult {
  // ===== 命理系统标识 =====
  /** 命理系统类型 */
  system: DivinationSystem
  /** 使用的流派 */
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
  /** 所有用神裁决详情 */
  verdicts: YongShenVerdict[]

  // ===== 评分明细 =====
  /** 各五行最终决策评分构成 */
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

  // ===== 证据与回溯 =====
  /** 证据树 */
  evidenceTree: EvidenceTree
  /** 决策回溯（每个用神的完整回溯） */
  decisionTraces: DecisionTrace[]
  /** 冲突报告 */
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
  /** 可解释说明（完整推演过程） */
  explain: string
  /** 策略摘要 */
  strategy: string
  /** 综合摘要 */
  summary: string
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
