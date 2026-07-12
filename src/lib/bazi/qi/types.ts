/**
 * QiEngine V4 核心类型定义（最终版）
 *
 * 架构原则：
 * 1. QiNode 是唯一底层操作单元
 * 2. 所有 Modifier 只返回 QiOperation[]，QiExecutor 事务执行
 * 3. Engine 通过 PipelineContext 驱动，Engine 永远不知道有哪些模块
 * 4. QiSnapshot Immutable（Object.freeze）
 * 5. QiHistory 含 version，支持回放
 * 6. QiDiff 含 cause 链，支持报告生成
 */

import type {
  FiveElement,
  HeavenlyStem,
  EarthlyBranch,
  WuXingWangShuai,
} from '../types'

export type QiPillar = 'year' | 'month' | 'day' | 'hour'
export type QiSource = '天干' | '本气' | '中气' | '余气'
export type QiState = '正常' | '被抽' | '合化' | '消散' | '被冲' | '被刑' | '被害' | '被破'
export type QiModifierName = string
export type QiActionName = 'Create' | 'Boost' | 'Weaken' | 'Transfer' | 'Dissolve' | 'Transform'

// ─── QiHistory（含 version）───

export interface QiHistory {
  modifier: QiModifierName
  action: QiActionName
  before: number
  after: number
  delta: number
  reason: string
  sequence: number
  version: number
}

// ─── QiNode ───

export interface QiNode {
  id: string
  rootId: string
  pillar: QiPillar
  branch: EarthlyBranch
  hiddenStem: HeavenlyStem | null
  element: FiveElement
  strength: number
  source: QiSource
  state: QiState
  active: boolean
  history: readonly QiHistory[]
}

// ─── QiOperation ───

export interface QiOperation {
  targetId: string
  action: QiActionName
  delta: number
  ruleId?: string           // 产生此操作的规则ID（如 'season-boost', 'sanhe-chenhua'）
  newState?: QiState
  newActive?: boolean
  newElement?: FiveElement
  newRootId?: string
  reason: string
}

// ─── HeHuaCommand ───

export interface QiDeduction {
  targetId: string
  amount: number
  detail: string
  /** 被扣减节点的五行（用于抽气来源比例调试） */
  sourceElement?: FiveElement
  /** 被扣减节点的名称（如"甲木"、"寅木"） */
  sourceName?: string
  /** 抽气来源细分明细（合化时记录每个来源节点的扣减） */
  breakdown?: { nodeId: string; name: string; element: FiveElement; amount: number }[]
}

export interface QiAddition {
  targetId: string
  element: FiveElement
  amount: number
  detail: string
}

export type HuaType = '真化' | '假化' | '化而不化' | '化神受制' | '争合' | '妒合' | '合绊'

export type SeasonStatus = '得令' | '失令' | '退令' | '普通'

export interface SeasonCommand {
  type: SeasonStatus
  dayElement: FiveElement
  monthElement: FiveElement
  monthZhi: EarthlyBranch
  /** 月令司令（当令藏干） */
  commander: string
  /** 司令力度：本气=1.0, 中气=0.5, 余气=0.2 */
  commanderWeight: number
  /** 月令藏干力量分布 */
  cangGanPower: { name: string; element: FiveElement; strength: number; isCommander: boolean }[]
  /** 是否有墓气 */
  hasMuQi: boolean
  /** 墓气地支 */
  muZhi?: EarthlyBranch
  reason: string
}

export interface HeHuaCommand {
  type: '天干五合' | '地支六合' | '地支三合' | '地支三会'
  sources: string[]
  huaElement: FiveElement
  success: boolean
  isHeBan: boolean
  /** 真假化细分类型（默认从 success/isHeBan 推导） */
  huaType?: HuaType
  reason: string
  deductions: QiDeduction[]
  additions: QiAddition[]
}

// ─── ConflictCommand ───

export interface ConflictCommand {
  type: '冲' | '刑' | '害' | '破'
  sources: string[]
  reason: string
  deductions: QiDeduction[]
  /** 冲的层级权重（仅冲类型使用）：月令冲=1.0，日支冲=0.8，时支冲=0.6，年支冲=0.5 */
  weight?: number
  /** 冲发生的位置（用于权重计算和调试） */
  pillar?: string
}

// ─── QiContext（命理上下文）───

export interface QiContext {
  dayGan: HeavenlyStem
  dayElement: FiveElement
  monthZhi: EarthlyBranch
  monthElement: FiveElement
}

// ─── QiDiff（含 cause 链）───

export interface QiDiffEntry {
  nodeId: string
  field: 'strength' | 'active' | 'element' | 'state'
  before: number | boolean | string
  after: number | boolean | string
  modifier: string
  reason: string
  cause: string[]         // 原因链：如 ['SeasonModifier', '木得令'] 或 ['HeHuaEngine', '申子辰三合', '月令支持']
}

// ─── QiSnapshot（Immutable + Hash）───

export interface QiSnapshot {
  step: string
  version: number
  sequence: number
  elementScores: Record<FiveElement, number>
  pillarScores: Record<QiPillar, Record<FiveElement, number>>
  sourceScores: Record<QiSource, number>
  totalStrength: number
  diffs: readonly QiDiffEntry[]
  /** Frozen nodes — 不可修改 */
  readonly qiNodes: readonly QiNode[]
  /** 快照指纹（基于 elementScores 的确定性 hash） */
  hash: string
}

// ─── PipelineContext（统一上下文）───

export interface QiMetadata {
  sixLinesName: string
  dayGan: string
  monthZhi: string
  timestamp: number
}

export interface QiPipelineContext {
  ctx: QiContext
  executor: any             // QiExecutor，避免循环引用用 any
  snapshots: QiSnapshot[]
  metadata: QiMetadata
  cache: Map<string, unknown>
  version: number
}

// ─── PipelineStep（接口）───

export interface PipelineStep {
  name: string
  run: (qiNodes: QiNode[], pCtx: QiPipelineContext) => QiNode[]
}

// ─── ValidationIssue ───

export interface ValidationIssue {
  level: 'error' | 'warning'
  step: string
  message: string
  nodeId?: string
}

// ─── QiEvent ───

export type QiEventType =
  | 'qi:changed'
  | 'qi:merged'
  | 'qi:removed'
  | 'qi:split'
  | 'snapshot:created'
  | 'step:completed'
  | 'step:rollback'

export interface QiEvent {
  type: QiEventType
  step: string
  data: any
  version: number
}

// ─── QiEngineResult ───

export interface QiEngineResult {
  snapshots: QiSnapshot[]
  finalQi: QiNode[]
  finalSnapshot: QiSnapshot
  heHuaCommands: HeHuaCommand[]
  conflictCommands: ConflictCommand[]
  validationIssues: ValidationIssue[]
  strengthScore: number
  wangShuai: WuXingWangShuai
  dayElement: FiveElement
  /** P1: 月令司令分析结果 */
  seasonCommands?: SeasonCommand[]
}
