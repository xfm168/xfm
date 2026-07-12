/**
 * P2-0 推演引擎核心类型（V2 — 推理链 + 推理树）
 *
 * 从"规则引擎"升级到"推演引擎"：
 * - 所有模块不再直接修改气值
 * - 统一进入 ReasoningContext
 * - 每个判断必须留下 Explain（含完整推理链）
 * - 命局状态可逐步回放
 * - Decision Log 升级为推理树（可追溯依赖关系）
 * - StateTree 节点携带丰富的格局 / 旺衰 / 病药数据
 *
 * 导入来源：
 *   ../../types  — 基础五行、干支类型
 *   ../types    — QiNode、QiSnapshot、命令类型等
 */

import type { FiveElement, HeavenlyStem, EarthlyBranch } from '../../types'
import type { QiNode, QiSnapshot, HeHuaCommand, ConflictCommand, SeasonCommand } from '../types'

// ═══════════════════════════════════════════════════════════════
// 命局阶段（推演流水线）
// ═══════════════════════════════════════════════════════════════

export type ChartPhase =
  | 'Original'       // 原始命局
  | 'AfterSeason'    // 月令调整后
  | 'AfterCombine'   // 合化判定后
  | 'AfterConflict'  // 冲刑害破竞争后
  | 'AfterQiFlow'    // 气机流转后
  | 'AfterStructure' // 格局判定后
  | 'AfterYongShen'  // 用神选择后
  | 'Final'          // 最终命局

// ═══════════════════════════════════════════════════════════════
// Explain Engine（推理链系统）
// ═══════════════════════════════════════════════════════════════

/** 单个推理因素 */
export interface ExplainFactor {
  /** 因素名称（如"月令支持"、"化神透干"、"甲木失令"） */
  name: string
  /** 权重（正数=加分，负数=减分） */
  weight: number
  /** 来源规则/古籍 */
  source?: string
  /** 详细说明 */
  detail?: string
}

/** 置信度来源 */
export interface ConfidenceSource {
  name: string
  ratio: number
  detail: string
}

/** 推理结论 */
export interface ExplainConclusion {
  /** 结论文字（如"甲己合化土成功"） */
  text: string
  /** 置信度 0~1 */
  confidence: number
  /** 置信度来源分解 */
  confidenceBreakdown?: ConfidenceSource[]
}

// ─── 推理链（新增） ───

/** 推理链节点 — 像数学证明一样一步步推导 */
export interface ReasoningStep {
  /** 步骤序号 */
  order: number
  /** 步骤名称（如"月令司令"、"藏干透出"、"合冲介入"） */
  name: string
  /** 步骤说明 */
  description: string
  /** 该步骤的推理因素 */
  factors: ExplainFactor[]
  /** 该步骤产生的结论（可为空，等到最终才出结论） */
  partialConclusion?: string
  /** 古籍依据 */
  references?: string[]
}

/** 被否决的替代方案（升级版） */
export interface RejectedAlternative {
  subject: string
  reason: string
  score: number
  references?: string[]
}

/** 完整解释记录 — 包含完整推理链 */
export interface ExplainRecord {
  /** 唯一ID */
  id: string
  /** 推演阶段 */
  phase: ChartPhase
  /** 步骤名（如"SeasonModifier"、"CompetitionEvaluate"） */
  step: string
  /** 判断主题（如"甲己合化"、"寅申冲"） */
  subject: string
  /** 推理链（有序步骤列表） */
  chain: ReasoningStep[]
  /** 各方评分（如 {甲方: 84.5, 乙方: 53.2}） */
  scores?: Record<string, number>
  /** 最终结论 */
  conclusion: ExplainConclusion
  /** 被抑制/否决的替代方案 */
  rejected?: RejectedAlternative[]
  /** 时间戳 */
  timestamp: number
  /** TraceID（全链路追溯，格式 EXP-NNNNNN） */
  traceId: string
}

// ═══════════════════════════════════════════════════════════════
// 命局状态树（丰富数据版）
// ═══════════════════════════════════════════════════════════════

/** 单个阶段的状态快照（V2 — 含格局 / 旺衰 / 病药） */
export interface ChartStateNode {
  phase: ChartPhase
  snapshot: QiSnapshot
  /** 该阶段的竞争评分（如有） */
  competitionScores?: Record<string, number>
  /** 当前格局判断（含演化链） */
  currentStructure?: DynamicStructure
  /** 当前旺衰 */
  currentWangShuai?: string
  /** 当前旺衰分数 */
  strengthScore?: number
  /** 当前用神 */
  yongShen?: YongShenInfo
  /** 当前喜神 */
  xiShen?: FiveElement[]
  /** 当前忌神 */
  jiShen?: FiveElement[]
  /** 病态列表（预留） */
  diseases?: DiseaseInfo[]
  /** 药方列表（预留） */
  medicines?: MedicineInfo[]
  /** 该阶段产生的 Explain 记录 */
  explains: ExplainRecord[]
  /** 该阶段激活的合化命令 */
  activeHeHua: HeHuaCommand[]
  /** 该阶段激活的冲突命令 */
  activeConflicts: ConflictCommand[]
  /** 该阶段的决策节点 */
  decisions?: DecisionNode[]
}

// ═══════════════════════════════════════════════════════════════
// AI Decision Log → 推理树（可追溯依赖关系）
// ═══════════════════════════════════════════════════════════════

/** 决策候选方案 */
export interface DecisionCandidate {
  name: string
  score: number
  factors: string[]
  references?: string[]
}

/** 推理树节点 — 可追溯依赖关系 */
export interface DecisionNode {
  /** 唯一 DecisionID */
  id: string
  /** 父决策ID（形成推理树） */
  parentId?: string
  /** 依赖的决策ID列表（必须先完成） */
  dependencies: string[]
  /** 决策阶段 */
  phase: ChartPhase
  /** 决策动作 */
  action: string
  /** 决策主题 */
  subject: string
  /** 候选方案 */
  candidates: DecisionCandidate[]
  /** 胜出者 */
  winner: string
  /** 胜出分数 */
  winnerScore: number
  /** 败选原因 */
  loserReason: string
  /** 关联的 Explain ID */
  explainId: string
  /** 权重 0~1 */
  weight: number
  /** 重要性 1~5 */
  importance: 1 | 2 | 3 | 4 | 5
  /** 优先级（数字越小越优先） */
  priority: number
  /** 在推理树中的深度（根节点=0） */
  depth: number
  /** 同层排序序号 */
  order: number
  /** TraceID（全链路追溯） */
  traceId: string
}

/**
 * @deprecated 使用 DecisionNode 代替（推理树）
 * 保留向后兼容，后续版本移除
 */
export interface DecisionLogEntry {
  step: number
  phase: ChartPhase
  action: string
  subject: string
  candidates: { name: string; score: number; factors: string[] }[]
  winner: string
  winnerScore: number
  loserReason: string
  explains: ExplainRecord[]
}

// ═══════════════════════════════════════════════════════════════
// 格局演化链 / 动态格局 / 病药 / 用神类型
// ═══════════════════════════════════════════════════════════════

/** 格局演化记录 */
export interface StructureEvolution {
  /** 演化序号 */
  order: number
  /** 阶段 */
  phase: ChartPhase
  /** 格局名称 */
  structure: string
  /** 为什么变化 */
  changeReason: string
  /** 关联 Explain ID */
  explainId: string
  /** 前一个格局（首项为空） */
  previousStructure?: string
}

/** 动态格局（含演化链） */
export interface DynamicStructure {
  /** 当前格局 */
  name: string
  /** 是否稳定 */
  stable: boolean
  /** 格局演化链 */
  evolution: StructureEvolution[]
  /** 关联 Explain ID */
  explainId?: string
}

/** 用神信息 */
export interface YongShenInfo {
  /** 用神五行 */
  element: FiveElement
  /** 用神类型（扶抑/调候/通关/病药） */
  type: '扶抑' | '调候' | '通关' | '病药'
  /** 用神说明 */
  reason: string
}

/** 病态信息 */
export interface DiseaseInfo {
  /** 病名（如"木病"、"水泛滥"） */
  name: string
  /** 病因 */
  cause: string
  /** 严重程度 0~1 */
  severity: number
  /** 关联 Explain */
  explainId?: string
}

/** 药方信息 */
export interface MedicineInfo {
  /** 药名（五行或十神） */
  name: string
  /** 治什么病 */
  targetDisease: string
  /** 药力 */
  strength: number
  /** 药是否受伤 */
  injured: boolean
  /** 受伤原因 */
  injuryReason?: string
  /** 关联 Explain */
  explainId?: string
}

// ═══════════════════════════════════════════════════════════════
// ReasoningEvent — 推演事件系统（Freeze+1）
// ═══════════════════════════════════════════════════════════════

export type ReasoningEventType =
  | 'SeasonDetected'      // 月令检测完成
  | 'HeHuaSuccess'        // 合化成功
  | 'HeHuaRejected'       // 合化被否决
  | 'ConflictDetected'    // 冲刑害破检测完成
  | 'ConflictRejected'    // 冲突被竞争抑制
  | 'CompetitionResolved' // 竞争结算完成
  | 'StructureChanged'    // 格局变化
  | 'StructureStable'     // 格局稳定
  | 'YongShenChanged'     // 用神变化
  | 'YongShenConfirmed'   // 用神确认
  | 'DiseaseFound'        // 发现病态
  | 'MedicineApplied'     // 应用药方
  | 'StrengthCalculated'  // 旺衰计算完成
  | 'PhaseAdvanced'       // 阶段推进
  | 'CheckpointCreated'   // 检查点创建
  | 'CheckpointRestored'  // 检查点恢复

/** 推演事件 — Context 事件时间轴 */
export interface ReasoningEvent {
  /** 事件序号 */
  seq: number
  /** 事件类型 */
  type: ReasoningEventType
  /** 事件阶段 */
  phase: ChartPhase
  /** 事件主题 */
  subject: string
  /** 事件详情 */
  detail: string
  /** 关联数据（任意） */
  payload?: Record<string, unknown>
  /** 关联 Explain ID */
  explainId?: string
  /** 时间戳 */
  timestamp: number
  /** TraceID（全链路追溯） */
  traceId: string
  /** 时间刻度（tick，用于动画回放） */
  tick: number
}

// ═══════════════════════════════════════════════════════════════
// Explain 统一格式（Freeze+1）
// ═══════════════════════════════════════════════════════════════

/** Explain 标准段落类型 */
export type ExplainSectionType =
  | 'Evidence'        // 证据
  | 'Rule'            // 规则/古籍
  | 'Reason'          // 推理过程
  | 'Competition'     // 竞争评估
  | 'Decision'        // 决策结论
  | 'Confidence'      // 置信度
  | 'ClassicalSource' // 古籍来源

/** Explain 统一段落 */
export interface ExplainSection {
  type: ExplainSectionType
  title: string
  content: string
  references?: string[]
}

/** Explain 统一模板 — 所有 Explain 遵循此结构 */
export interface ExplainTemplate {
  sections: ExplainSection[]
  conclusion: ExplainConclusion
}

// ═══════════════════════════════════════════════════════════════
// Checkpoint — 版本控制（Freeze+1）
// ═══════════════════════════════════════════════════════════════

/** 推演检查点 — 轻量快照，避免循环引用 */
export interface Checkpoint {
  /** 检查点 ID */
  id: string
  /** 检查点标签 */
  label: string
  /** 检查点阶段 */
  phase: ChartPhase
  /** 当时的 stateTree 长度 */
  stateTreeLength: number
  /** 当时的 explains 数量 */
  explainCount: number
  /** 当时的 decisionTree 节点数 */
  decisionCount: number
  /** 当时的 eventTimeline 长度 */
  eventCount: number
  /** QiNode 快照标签（引用外部存储） */
  nodeSnapshotLabel: string
  /** 创建时间 */
  createdAt: number
  /** TraceID（全链路追溯） */
  traceId: string
}

// ═══════════════════════════════════════════════════════════════
// 竞争评分因素（扩展版）
// ═══════════════════════════════════════════════════════════════

/** 竞争评分因素明细 */
export interface CompetitionFactors {
  /** 基础分 */
  baseScore: number
  /** 月令权重 */
  monthZhiBonus: number
  /** 得令加成 */
  deLingBonus: number
  /** 司令加成 */
  siLingBonus: number
  /** 透干加成 */
  touGanBonus: number
  /** 根气加成 */
  genQiBonus: number
  /** 化神力量 */
  huaShenStrength: number
  /** 空亡罚分 */
  kongWangPenalty: number
  /** 受冲罚分 */
  chongPenalty: number
  /** 刑害罚分 */
  xingHaiPenalty: number
  /** 墓气罚分 */
  muQiPenalty: number
  /** NEW: 距离加成（同柱+10, 隔柱+5, 远隔+0） */
  distanceBonus: number
  /** NEW: 发动优先级加成（原局+10, 月令+8, 司令+5, 岁运+3） */
  initiativeBonus: number
}

// ═══════════════════════════════════════════════════════════════
// 古籍优先级
// ═══════════════════════════════════════════════════════════════

export type ClassicalSource =
  | '滴天髓'     // 最高优先级
  | '子平真诠'   // 次之
  | '穷通宝鉴'   // 再次
  | '三命通会'   // 再次
  | '渊海子平'   // 最低
  | '自研推导'   // 系统自行推导

export const SOURCE_PRIORITY: Record<ClassicalSource, number> = {
  '滴天髓': 100,
  '子平真诠': 90,
  '穷通宝鉴': 80,
  '三命通会': 70,
  '渊海子平': 60,
  '自研推导': 30,
}

// ═══════════════════════════════════════════════════════════════
// 推演上下文（ReasoningContext）
// ═══════════════════════════════════════════════════════════════

export interface ReasoningContext {
  /** 原始四柱 */
  sixLinesName: string
  /** 日主 */
  dayGan: HeavenlyStem
  /** 月令 */
  monthZhi: EarthlyBranch
  /** 日主五行 */
  dayElement: FiveElement
  /** 月令五行 */
  monthElement: FiveElement
  /** 当前阶段 */
  currentPhase: ChartPhase
  /** 命局状态树 */
  stateTree: ChartStateNode[]
  /** 所有 Explain 记录 */
  explains: ExplainRecord[]
  /** AI Decision Log（兼容旧版） */
  decisionLog: DecisionLogEntry[]
  /** 推理树 */
  decisionTree: DecisionNode[]
  /** 当前 QiNode[]（随阶段变化） */
  currentNodes: QiNode[]
  /** 当前活跃的合化命令 */
  activeHeHua: HeHuaCommand[]
  /** 当前活跃的冲突命令 */
  activeConflicts: ConflictCommand[]
  /** 当前季节命令 */
  seasonCommands: SeasonCommand[]
  /** 当前格局（动态格局） */
  currentStructure?: DynamicStructure
  /** 当前动态格局（新增） */
  currentStructureDynamic?: DynamicStructure
  /** 当前旺衰 */
  currentWangShuai?: string
  /** 格局演化链（跨阶段） */
  structureEvolution: StructureEvolution[]
  /** 病态列表（新增） */
  diseases: DiseaseInfo[]
  /** 药方列表（新增） */
  medicines: MedicineInfo[]
  /** 用神（新增） */
  yongShen?: YongShenInfo
  /** 喜神（新增） */
  xiShen: FiveElement[]
  /** 忌神（新增） */
  jiShen: FiveElement[]
  /** 事件时间轴（Freeze+1） */
  eventTimeline: ReasoningEvent[]
  /** 检查点列表（Freeze+1） */
  checkpoints: Checkpoint[]
}
