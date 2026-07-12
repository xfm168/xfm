/**
 * StateTree — 命局状态树管理（V2 — 丰富数据版）
 *
 * 管理推演过程中的每一步状态快照，
 * 支持逐步回放和差异比较。
 *
 * V2 升级：
 * - ChartStateNode 携带格局/旺衰/用神/病药等丰富数据
 * - advancePhase 支持可选参数传入竞争评分、格局、用神等
 * - ReasoningContext 初始化包含病态、药方、喜神、忌神等新字段
 * - logDecision 支持新版 DecisionNode
 */

import type { QiNode, QiSnapshot } from '../types'
import type {
  ChartPhase,
  ChartStateNode,
  ReasoningContext,
  DecisionLogEntry,
  DecisionNode,
  DynamicStructure,
  YongShenInfo,
  DiseaseInfo,
  MedicineInfo,
  ExplainRecord,
  ReasoningEvent,
  ReasoningEventType,
  Checkpoint,
} from './types'
import type { FiveElement } from '../../types'
import { takeSnapshot } from '../aggregator'

// ─── 全局事件序号计数器 ───
let eventSeqCounter = 0
let checkpointCounter = 0

export function resetEventSeq(): void {
  eventSeqCounter = 0
}

export function resetCheckpointCounter(): void {
  checkpointCounter = 0
}

// ═══════════════════════════════════════════════════════════════
// 初始化 ReasoningContext
// ═══════════════════════════════════════════════════════════════

/**
 * 初始化 ReasoningContext
 *
 * V2 新增字段：
 * - decisionTree: DecisionNode[] — 推理树
 * - diseases: DiseaseInfo[] — 病态列表
 * - medicines: MedicineInfo[] — 药方列表
 * - xiShen: FiveElement[] — 喜神
 * - jiShen: FiveElement[] — 忌神
 */
export function createReasoningContext(params: {
  sixLinesName: string
  dayGan: import('../../types').HeavenlyStem
  dayElement: import('../../types').FiveElement
  monthZhi: import('../../types').EarthlyBranch
  monthElement: import('../../types').FiveElement
  initialNodes: QiNode[]
}): ReasoningContext {
  const snapshot = takeSnapshot('Original', params.initialNodes)

  const initialState: ChartStateNode = {
    phase: 'Original',
    snapshot,
    explains: [],
    activeHeHua: [],
    activeConflicts: [],
  }

  return {
    sixLinesName: params.sixLinesName,
    dayGan: params.dayGan,
    dayElement: params.dayElement,
    monthZhi: params.monthZhi,
    monthElement: params.monthElement,
    currentPhase: 'Original',
    stateTree: [initialState],
    explains: [],
    decisionLog: [],
    decisionTree: [],
    currentNodes: params.initialNodes,
    activeHeHua: [],
    activeConflicts: [],
    seasonCommands: [],
    // V2 新增字段
    diseases: [],
    medicines: [],
    xiShen: [],
    jiShen: [],
    structureEvolution: [],
    // Freeze+1 新增字段
    eventTimeline: [],
    checkpoints: [],
  }
}

// ═══════════════════════════════════════════════════════════════
// 推进到下一个阶段
// ═══════════════════════════════════════════════════════════════

/** advancePhase 可选参数 */
interface AdvancePhaseOptions {
  prevNodes?: QiNode[]
  version?: number
  competitionScores?: Record<string, number>
  currentStructure?: DynamicStructure
  yongShen?: YongShenInfo
  xiShen?: FiveElement[]
  jiShen?: FiveElement[]
  diseases?: DiseaseInfo[]
  medicines?: MedicineInfo[]
}

/**
 * 推进到下一个阶段
 * 自动创建快照，追加到 stateTree
 *
 * V2 升级：
 * - 接受可选 options 参数，传入竞争评分、格局、用神、病药等
 * - 同时更新 ReasoningContext 上的对应字段
 */
export function advancePhase(
  ctx: ReasoningContext,
  phase: ChartPhase,
  nodes: QiNode[],
  options?: AdvancePhaseOptions,
): QiSnapshot {
  const snapshot = takeSnapshot(
    phase,
    nodes,
    options?.prevNodes,
    options?.version || 0,
  )

  const stateNode: ChartStateNode = {
    phase,
    snapshot,
    explains: [],
    activeHeHua: [...ctx.activeHeHua],
    activeConflicts: [...ctx.activeConflicts],
    competitionScores: options?.competitionScores,
    currentStructure: options?.currentStructure,
    currentWangShuai: ctx.currentWangShuai,
    yongShen: options?.yongShen,
    xiShen: options?.xiShen,
    jiShen: options?.jiShen,
    diseases: options?.diseases,
    medicines: options?.medicines,
  }

  ctx.stateTree.push(stateNode)
  ctx.currentPhase = phase
  ctx.currentNodes = nodes

  // 同步更新 ReasoningContext 上的新字段
  if (options?.currentStructure) {
    ctx.currentStructure = options.currentStructure
    ctx.currentStructureDynamic = options.currentStructure
  }
  if (options?.yongShen) {
    ctx.yongShen = options.yongShen
  }
  if (options?.xiShen) {
    ctx.xiShen = options.xiShen
  }
  if (options?.jiShen) {
    ctx.jiShen = options.jiShen
  }
  if (options?.diseases) {
    ctx.diseases = options.diseases
  }
  if (options?.medicines) {
    ctx.medicines = options.medicines
  }

  return snapshot
}

// ═══════════════════════════════════════════════════════════════
// Decision Log（兼容旧版 DecisionLogEntry）
// ═══════════════════════════════════════════════════════════════

/**
 * 记录 AI Decision Log（旧版兼容）
 *
 * @deprecated 建议使用 explainEngine.createDecisionNode() + appendDecisionNode()
 */
export function logDecision(
  ctx: ReasoningContext,
  entry: Omit<DecisionLogEntry, 'step' | 'explains'>,
): void {
  const fullEntry: DecisionLogEntry = {
    ...entry,
    step: ctx.decisionLog.length + 1,
    explains: [], // will be filled by appendExplain
  }
  ctx.decisionLog.push(fullEntry)
}

/**
 * 记录 DecisionNode 到推理树（新版）
 *
 * 同时追加到 ctx.decisionTree。
 * 对于没有 parentId 的根节点，也写入旧版 decisionLog 以兼容。
 */
export function logDecisionNode(
  ctx: ReasoningContext,
  node: DecisionNode,
): void {
  ctx.decisionTree.push(node)

  // 兼容旧版：写入 decisionLog
  if (!node.parentId) {
    const legacyEntry: DecisionLogEntry = {
      step: ctx.decisionLog.length + 1,
      phase: node.phase,
      action: node.action,
      subject: node.subject,
      candidates: node.candidates.map(c => ({
        name: c.name,
        score: c.score,
        factors: c.factors,
      })),
      winner: node.winner,
      winnerScore: node.winnerScore,
      loserReason: node.loserReason,
      explains: [],
    }
    ctx.decisionLog.push(legacyEntry)
  }
}

// ═══════════════════════════════════════════════════════════════
// 查询与比较
// ═══════════════════════════════════════════════════════════════

/**
 * 获取指定阶段的状态节点
 */
export function getStateAtPhase(ctx: ReasoningContext, phase: ChartPhase): ChartStateNode | undefined {
  return ctx.stateTree.find(n => n.phase === phase)
}

/**
 * 比较两个阶段的差异
 * 返回差异的文本摘要（含五行分数变化）
 */
export function comparePhases(ctx: ReasoningContext, phaseA: ChartPhase, phaseB: ChartPhase): string {
  const stateA = getStateAtPhase(ctx, phaseA)
  const stateB = getStateAtPhase(ctx, phaseB)
  if (!stateA || !stateB) return `无法比较：${!stateA ? phaseA : phaseB} 不存在`

  const lines: string[] = []
  lines.push(`【${phaseA} → ${phaseB}】`)

  // 五行分数对比
  const scoresA = stateA.snapshot.elementScores
  const scoresB = stateB.snapshot.elementScores
  let hasChanges = false
  for (const el of ['木', '火', '土', '金', '水'] as const) {
    if (scoresA[el] !== scoresB[el]) {
      const diff = scoresB[el] - scoresA[el]
      lines.push(`  ${el}: ${scoresA[el]} → ${scoresB[el]} (${diff > 0 ? '+' : ''}${diff})`)
      hasChanges = true
    }
  }
  if (!hasChanges) lines.push('  五行分数无变化')

  // 格局变化
  const structureA = stateA.currentStructure
  const structureB = stateB.currentStructure
  if (structureA?.name !== structureB?.name) {
    lines.push(`  格局: ${structureA?.name ?? '无'} → ${structureB?.name ?? '无'}`)
  }

  // 旺衰变化
  if (stateA.currentWangShuai !== stateB.currentWangShuai) {
    lines.push(`  旺衰: ${stateA.currentWangShuai ?? '无'} → ${stateB.currentWangShuai ?? '无'}`)
  }

  return lines.join('\n')
}

// ═══════════════════════════════════════════════════════════════
// Undo / Diff / Merge
// ═══════════════════════════════════════════════════════════════

/**
 * 回滚到指定阶段
 * 恢复 ReasoningContext 到该阶段的状态
 */
export function rollbackToPhase(
  ctx: ReasoningContext,
  targetPhase: ChartPhase,
): boolean {
  const targetIndex = ctx.stateTree.findIndex(n => n.phase === targetPhase)
  if (targetIndex < 0) return false

  // 截断 stateTree
  ctx.stateTree = ctx.stateTree.slice(0, targetIndex + 1)

  // 恢复 currentNodes
  const targetNode = ctx.stateTree[targetIndex]
  ctx.currentNodes = targetNode.snapshot.qiNodes as QiNode[]
  ctx.currentPhase = targetPhase

  // 恢复其他状态字段
  ctx.activeHeHua = targetNode.activeHeHua
  ctx.activeConflicts = targetNode.activeConflicts
  if (targetNode.currentStructure) ctx.currentStructure = targetNode.currentStructure
  if (targetNode.yongShen) ctx.yongShen = targetNode.yongShen
  if (targetNode.xiShen) ctx.xiShen = targetNode.xiShen
  if (targetNode.jiShen) ctx.jiShen = targetNode.jiShen
  if (targetNode.diseases) ctx.diseases = targetNode.diseases
  if (targetNode.medicines) ctx.medicines = targetNode.medicines

  return true
}

/**
 * 计算两个 ReasoningContext 的差异
 * 用于 Benchmark 对比
 */
export function diffContexts(
  ctxA: ReasoningContext,
  ctxB: ReasoningContext,
): { matches: string[]; diffs: string[] } {
  const matches: string[] = []
  const diffs: string[] = []

  // 比较最终五行分数
  const finalA = ctxA.stateTree[ctxA.stateTree.length - 1]?.snapshot.elementScores
  const finalB = ctxB.stateTree[ctxB.stateTree.length - 1]?.snapshot.elementScores

  if (finalA && finalB) {
    for (const el of ['木', '火', '土', '金', '水'] as const) {
      if (finalA[el] === finalB[el]) {
        matches.push(`${el}分数一致: ${finalA[el]}`)
      } else {
        diffs.push(`${el}分数差异: ${finalA[el]} vs ${finalB[el]} (Δ${finalB[el] - finalA[el]})`)
      }
    }
  }

  // 比较旺衰
  if (ctxA.currentWangShuai === ctxB.currentWangShuai) {
    matches.push(`旺衰一致: ${ctxA.currentWangShuai}`)
  } else {
    diffs.push(`旺衰差异: ${ctxA.currentWangShuai} vs ${ctxB.currentWangShuai}`)
  }

  // 比较 Explain 数量
  if (ctxA.explains.length === ctxB.explains.length) {
    matches.push(`Explain数量一致: ${ctxA.explains.length}`)
  } else {
    diffs.push(`Explain数量差异: ${ctxA.explains.length} vs ${ctxB.explains.length}`)
  }

  return { matches, diffs }
}

/**
 * 合并两个 ReasoningContext 的 Explain 记录
 * 用于多算法对比
 */
export function mergeExplains(
  baseCtx: ReasoningContext,
  otherCtx: ReasoningContext,
  label: string,
): ExplainRecord[] {
  const merged: ExplainRecord[] = [...baseCtx.explains]

  for (const exp of otherCtx.explains) {
    const exists = baseCtx.explains.some(e => e.subject === exp.subject && e.step === exp.step)
    if (!exists) {
      merged.push({
        ...exp,
        id: `${exp.id}-${label}`,
        conclusion: {
          ...exp.conclusion,
          text: `[${label}] ${exp.conclusion.text}`,
        },
      })
    }
  }

  return merged
}

// ═══════════════════════════════════════════════════════════════
// ReasoningEvent — 事件时间轴（Freeze+1）
// ═══════════════════════════════════════════════════════════════

/**
 * 发射推演事件到 Context 事件时间轴
 *
 * 原则：任何重要状态变更都必须记录事件。
 * 事件时间轴支持 Replay、Timeline、Animation、Debug、Benchmark。
 */
export function emitReasoningEvent(
  ctx: ReasoningContext,
  type: ReasoningEventType,
  subject: string,
  detail: string,
  payload?: Record<string, unknown>,
  explainId?: string,
): ReasoningEvent {
  const event: ReasoningEvent = {
    seq: ++eventSeqCounter,
    type,
    phase: ctx.currentPhase,
    subject,
    detail,
    payload,
    explainId,
    timestamp: Date.now(),
    traceId: `EVT-${String(eventSeqCounter).padStart(6, '0')}`,
    tick: eventSeqCounter,
  }
  ctx.eventTimeline.push(event)
  return event
}

/**
 * 获取事件时间轴摘要
 */
export function summarizeEventTimeline(ctx: ReasoningContext): string {
  if (ctx.eventTimeline.length === 0) return '无事件记录'
  const lines: string[] = []
  lines.push(`=== 事件时间轴 (${ctx.eventTimeline.length} 条) ===`)
  for (const ev of ctx.eventTimeline) {
    lines.push(`  [#${ev.seq}] [${ev.phase}] ${ev.type}: ${ev.subject}`)
    lines.push(`    ${ev.detail}`)
  }
  return lines.join('\n')
}

// ═══════════════════════════════════════════════════════════════
// Checkpoint — 版本控制（Freeze+1）
// ═══════════════════════════════════════════════════════════════

/**
 * 创建检查点
 *
 * 保存当前推演状态的一个快照标签，以后可恢复。
 * 用于 AI 自我推理、自动搜索最佳路线、多版本对比。
 */
export function createCheckpoint(
  ctx: ReasoningContext,
  label: string,
): Checkpoint {
  const cp: Checkpoint = {
    id: `cp-${++checkpointCounter}`,
    label,
    phase: ctx.currentPhase,
    stateTreeLength: ctx.stateTree.length,
    explainCount: ctx.explains.length,
    decisionCount: ctx.decisionTree.length,
    eventCount: ctx.eventTimeline.length,
    nodeSnapshotLabel: `${label}-nodes-${ctx.currentPhase}`,
    createdAt: Date.now(),
    traceId: `CP-${String(checkpointCounter).padStart(6, '0')}`,
  }
  ctx.checkpoints.push(cp)
  emitReasoningEvent(ctx, 'CheckpointCreated', label, `创建检查点 ${cp.id} @ ${ctx.currentPhase}`)
  return cp
}

/**
 * 恢复到指定检查点
 *
 * 回滚 stateTree、explains、decisionTree、eventTimeline 到检查点时的长度。
 * 注意：QiNode 状态通过 rollbackToPhase 恢复，此处只恢复元数据。
 */
export function restoreCheckpoint(
  ctx: ReasoningContext,
  checkpointId: string,
): boolean {
  const cp = ctx.checkpoints.find(c => c.id === checkpointId)
  if (!cp) return false

  // 截断 stateTree
  if (ctx.stateTree.length > cp.stateTreeLength) {
    ctx.stateTree = ctx.stateTree.slice(0, cp.stateTreeLength)
  }

  // 截断 explains
  if (ctx.explains.length > cp.explainCount) {
    ctx.explains = ctx.explains.slice(0, cp.explainCount)
  }

  // 截断 decisionTree
  if (ctx.decisionTree.length > cp.decisionCount) {
    ctx.decisionTree = ctx.decisionTree.slice(0, cp.decisionCount)
  }

  // 截断 eventTimeline（保留检查点之前的事件，追加恢复事件）
  if (ctx.eventTimeline.length > cp.eventCount) {
    ctx.eventTimeline = ctx.eventTimeline.slice(0, cp.eventCount)
  }

  // 恢复阶段
  const targetNode = ctx.stateTree[ctx.stateTree.length - 1]
  if (targetNode) {
    ctx.currentPhase = targetNode.phase
    ctx.currentNodes = targetNode.snapshot.qiNodes as QiNode[]
  }

  emitReasoningEvent(ctx, 'CheckpointRestored', cp.label, `恢复检查点 ${cp.id} → ${cp.phase}`)
  return true
}

/**
 * 列出所有检查点
 */
export function listCheckpoints(ctx: ReasoningContext): Checkpoint[] {
  return [...ctx.checkpoints]
}
