/**
 * DetectorGuard — Detector 运行期防护（Freeze+1）
 *
 * 强制执行原则：
 *   Detector 禁止直接修改 ReasoningContext 状态。
 *   Detector 只能返回 Intent / Evidence / Explain / Candidate。
 *   真正修改全部进入 Settlement。
 *
 * 此模块属于 Reasoning Kernel，永久冻结。
 */

import type { ReasoningContext, ExplainRecord } from './types'
import type { CompetitionCandidate } from './competitionEngine'

// ─── Detector 输出规范 ───

export interface DetectorIntent {
  /** 意图名称 */
  name: string
  /** 意图类型 */
  type: string
  /** 目标 */
  target?: string
  /** 参数 */
  params?: Record<string, unknown>
}

export interface DetectorEvidence {
  /** 证据描述 */
  description: string
  /** 证据来源（如"月令"、"藏干"、"天干"） */
  source: string
  /** 证据强度 0~1 */
  strength: number
}

export interface DetectorResult {
  /** 意图列表 */
  intents: DetectorIntent[]
  /** 证据列表 */
  evidence: DetectorEvidence[]
  /** Explain 记录 */
  explains: ExplainRecord[]
  /** 竞争候选 */
  candidates: CompetitionCandidate[]
}

// ─── 运行时防护 ───

/**
 * 检查 Detector 是否尝试修改 Context（浅层检查）
 *
 * 运行时防护：比较 Detector 执行前后的关键字段。
 * 如果 Detector 修改了以下任何字段，抛出错误：
 *   - currentNodes
 *   - currentStructure / currentStructureDynamic
 *   - currentWangShuai
 *   - yongShen
 *   - diseases / medicines
 *   - xiShen / jiShen
 *   - activeHeHua / activeConflicts
 *   - stateTree / decisionTree / explains / eventTimeline
 */
export function guardDetectorExecution<T extends DetectorResult>(
  detectorName: string,
  ctx: ReasoningContext,
  execute: () => T,
): T {
  // 记录执行前的关键快照
  const before = {
    nodeCount: ctx.currentNodes.length,
    explainCount: ctx.explains.length,
    decisionCount: ctx.decisionTree.length,
    stateTreeLength: ctx.stateTree.length,
    eventCount: ctx.eventTimeline.length,
    checkpointCount: ctx.checkpoints.length,
    wangShuai: ctx.currentWangShuai,
    structureName: ctx.currentStructure?.name,
    yongShen: ctx.yongShen?.element,
  }

  const result = execute()

  // 检查执行后是否被修改
  const after = {
    nodeCount: ctx.currentNodes.length,
    explainCount: ctx.explains.length,
    decisionCount: ctx.decisionTree.length,
    stateTreeLength: ctx.stateTree.length,
    eventCount: ctx.eventTimeline.length,
    checkpointCount: ctx.checkpoints.length,
    wangShuai: ctx.currentWangShuai,
    structureName: ctx.currentStructure?.name,
    yongShen: ctx.yongShen?.element,
  }

  const violations: string[] = []

  if (after.nodeCount !== before.nodeCount) violations.push('currentNodes')
  if (after.explainCount !== before.explainCount) violations.push('explains')
  if (after.decisionCount !== before.decisionCount) violations.push('decisionTree')
  if (after.stateTreeLength !== before.stateTreeLength) violations.push('stateTree')
  if (after.eventCount !== before.eventCount) violations.push('eventTimeline')
  if (after.checkpointCount !== before.checkpointCount) violations.push('checkpoints')
  if (after.wangShuai !== before.wangShuai) violations.push('currentWangShuai')
  if (after.structureName !== before.structureName) violations.push('currentStructure')
  if (after.yongShen !== before.yongShen) violations.push('yongShen')

  if (violations.length > 0) {
    throw new Error(
      `[DetectorGuard] Detector "${detectorName}" 违反了冻结原则：直接修改了 Context 状态 [${violations.join(', ')}]。` +
      `Detector 只能返回 Intent/Evidence/Explain/Candidate，禁止直接修改 Context。`
    )
  }

  return result
}

/**
 * 创建空 Detector 结果
 */
export function createDetectorResult(partial?: Partial<DetectorResult>): DetectorResult {
  return {
    intents: partial?.intents ?? [],
    evidence: partial?.evidence ?? [],
    explains: partial?.explains ?? [],
    candidates: partial?.candidates ?? [],
  }
}
