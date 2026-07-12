/**
 * BenchmarkEngine — 推演基准测试引擎（Freeze+1）
 *
 * 五维对比：
 *   Result Compare / Explain Compare / Decision Compare /
 *   Competition Compare / Context Compare
 *
 * 原则：不仅比较结果，还要比较推理过程。
 */

import type { ReasoningContext } from './types'
import type { CompetitionResult } from './competitionEngine'

// ═══════════════════════════════════════════════════════════════
// 五维对比结果
// ═══════════════════════════════════════════════════════════════

export interface BenchmarkDimension {
  name: string
  matches: string[]
  diffs: string[]
  passed: boolean
}

export interface BenchmarkReport {
  /** 总维度数 */
  totalDimensions: number
  /** 通过维度数 */
  passedDimensions: number
  /** 各维度详情 */
  dimensions: BenchmarkDimension[]
  /** 整体是否通过 */
  passed: boolean
  /** 时间戳 */
  timestamp: number
}

// ═══════════════════════════════════════════════════════════════
// 1. Result Compare — 结果对比
// ═══════════════════════════════════════════════════════════════

function compareResult(ctxA: ReasoningContext, ctxB: ReasoningContext): BenchmarkDimension {
  const matches: string[] = []
  const diffs: string[] = []

  // 五行分数
  const finalA = ctxA.stateTree[ctxA.stateTree.length - 1]?.snapshot.elementScores
  const finalB = ctxB.stateTree[ctxB.stateTree.length - 1]?.snapshot.elementScores
  if (finalA && finalB) {
    for (const el of ['木', '火', '土', '金', '水'] as const) {
      if (finalA[el] === finalB[el]) {
        matches.push(`${el}分数: ${finalA[el]}`)
      } else {
        diffs.push(`${el}分数: ${finalA[el]} vs ${finalB[el]} (Δ${finalB[el] - finalA[el]})`)
      }
    }
  }

  // 旺衰
  if (ctxA.currentWangShuai === ctxB.currentWangShuai) {
    matches.push(`旺衰: ${ctxA.currentWangShuai}`)
  } else {
    diffs.push(`旺衰: ${ctxA.currentWangShuai} vs ${ctxB.currentWangShuai}`)
  }

  // 格局
  const nameA = ctxA.currentStructure?.name ?? '无'
  const nameB = ctxB.currentStructure?.name ?? '无'
  if (nameA === nameB) {
    matches.push(`格局: ${nameA}`)
  } else {
    diffs.push(`格局: ${nameA} vs ${nameB}`)
  }

  // 用神
  const ysA = ctxA.yongShen?.element ?? '无'
  const ysB = ctxB.yongShen?.element ?? '无'
  if (ysA === ysB) {
    matches.push(`用神: ${ysA}`)
  } else {
    diffs.push(`用神: ${ysA} vs ${ysB}`)
  }

  return {
    name: 'Result Compare',
    matches,
    diffs,
    passed: diffs.length === 0,
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. Explain Compare — Explain 对比
// ═══════════════════════════════════════════════════════════════

function compareExplain(ctxA: ReasoningContext, ctxB: ReasoningContext): BenchmarkDimension {
  const matches: string[] = []
  const diffs: string[] = []

  // 数量
  if (ctxA.explains.length === ctxB.explains.length) {
    matches.push(`Explain数量: ${ctxA.explains.length}`)
  } else {
    diffs.push(`Explain数量: ${ctxA.explains.length} vs ${ctxB.explains.length}`)
  }

  // 逐条对比（按 subject + step 匹配）
  const matchedA = new Set<string>()
  const matchedB = new Set<string>()

  for (const ea of ctxA.explains) {
    const key = `${ea.step}:${ea.subject}`
    const eb = ctxB.explains.find(x => x.step === ea.step && x.subject === ea.subject)
    if (eb) {
      matchedA.add(key)
      matchedB.add(`${eb.step}:${eb.subject}`)
      if (ea.conclusion.text === eb.conclusion.text) {
        matches.push(`结论一致 [${key}]`)
      } else {
        diffs.push(`结论差异 [${key}]: "${ea.conclusion.text}" vs "${eb.conclusion.text}"`)
      }
      if (ea.chain.length === eb.chain.length) {
        matches.push(`推理链步数一致 [${key}]: ${ea.chain.length}`)
      } else {
        diffs.push(`推理链步数差异 [${key}]: ${ea.chain.length} vs ${eb.chain.length}`)
      }
    } else {
      diffs.push(`B缺少Explain [${key}]`)
    }
  }

  for (const eb of ctxB.explains) {
    const key = `${eb.step}:${eb.subject}`
    if (!matchedB.has(key)) {
      diffs.push(`A缺少Explain [${key}]`)
    }
  }

  return {
    name: 'Explain Compare',
    matches,
    diffs,
    passed: diffs.length === 0,
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. Decision Compare — Decision Tree 对比
// ═══════════════════════════════════════════════════════════════

function compareDecision(ctxA: ReasoningContext, ctxB: ReasoningContext): BenchmarkDimension {
  const matches: string[] = []
  const diffs: string[] = []

  if (ctxA.decisionTree.length === ctxB.decisionTree.length) {
    matches.push(`决策节点数: ${ctxA.decisionTree.length}`)
  } else {
    diffs.push(`决策节点数: ${ctxA.decisionTree.length} vs ${ctxB.decisionTree.length}`)
  }

  const len = Math.min(ctxA.decisionTree.length, ctxB.decisionTree.length)
  for (let i = 0; i < len; i++) {
    const da = ctxA.decisionTree[i]
    const db = ctxB.decisionTree[i]
    if (da.action === db.action && da.winner === db.winner) {
      matches.push(`决策一致 #${i + 1}: [${da.action}] ${da.winner}`)
    } else {
      diffs.push(`决策差异 #${i + 1}: [${da.action}] ${da.winner} vs [${db.action}] ${db.winner}`)
    }
  }

  return {
    name: 'Decision Compare',
    matches,
    diffs,
    passed: diffs.length === 0,
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. Competition Compare — 竞争过程对比
// ═══════════════════════════════════════════════════════════════

function compareCompetition(
  resultA: CompetitionResult,
  resultB: CompetitionResult,
): BenchmarkDimension {
  const matches: string[] = []
  const diffs: string[] = []

  // 胜出者
  const wa = resultA.winner?.name ?? '无'
  const wb = resultB.winner?.name ?? '无'
  if (wa === wb) {
    matches.push(`胜出者: ${wa}`)
  } else {
    diffs.push(`胜出者: ${wa} vs ${wb}`)
  }

  // 候选数量
  if (resultA.allCandidates.length === resultB.allCandidates.length) {
    matches.push(`候选数: ${resultA.allCandidates.length}`)
  } else {
    diffs.push(`候选数: ${resultA.allCandidates.length} vs ${resultB.allCandidates.length}`)
  }

  // 平局状态
  if (resultA.isTie === resultB.isTie) {
    matches.push(`平局状态: ${resultA.isTie}`)
  } else {
    diffs.push(`平局状态: ${resultA.isTie} vs ${resultB.isTie}`)
  }

  // 淘汰记录对比
  if (resultA.eliminationRecords.length === resultB.eliminationRecords.length) {
    matches.push(`淘汰记录数: ${resultA.eliminationRecords.length}`)
  } else {
    diffs.push(`淘汰记录数: ${resultA.eliminationRecords.length} vs ${resultB.eliminationRecords.length}`)
  }

  return {
    name: 'Competition Compare',
    matches,
    diffs,
    passed: diffs.length === 0,
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. Context Compare — 上下文状态对比
// ═══════════════════════════════════════════════════════════════

function compareContext(ctxA: ReasoningContext, ctxB: ReasoningContext): BenchmarkDimension {
  const matches: string[] = []
  const diffs: string[] = []

  // 阶段
  if (ctxA.currentPhase === ctxB.currentPhase) {
    matches.push(`当前阶段: ${ctxA.currentPhase}`)
  } else {
    diffs.push(`当前阶段: ${ctxA.currentPhase} vs ${ctxB.currentPhase}`)
  }

  // 活跃命令
  if (ctxA.activeHeHua.length === ctxB.activeHeHua.length) {
    matches.push(`活跃合化: ${ctxA.activeHeHua.length}`)
  } else {
    diffs.push(`活跃合化: ${ctxA.activeHeHua.length} vs ${ctxB.activeHeHua.length}`)
  }

  if (ctxA.activeConflicts.length === ctxB.activeConflicts.length) {
    matches.push(`活跃冲突: ${ctxA.activeConflicts.length}`)
  } else {
    diffs.push(`活跃冲突: ${ctxA.activeConflicts.length} vs ${ctxB.activeConflicts.length}`)
  }

  // 事件时间轴
  if (ctxA.eventTimeline.length === ctxB.eventTimeline.length) {
    matches.push(`事件数: ${ctxA.eventTimeline.length}`)
  } else {
    diffs.push(`事件数: ${ctxA.eventTimeline.length} vs ${ctxB.eventTimeline.length}`)
  }

  // 检查点
  if (ctxA.checkpoints.length === ctxB.checkpoints.length) {
    matches.push(`检查点数: ${ctxA.checkpoints.length}`)
  } else {
    diffs.push(`检查点数: ${ctxA.checkpoints.length} vs ${ctxB.checkpoints.length}`)
  }

  return {
    name: 'Context Compare',
    matches,
    diffs,
    passed: diffs.length === 0,
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. Performance Compare — 性能对比
// ═══════════════════════════════════════════════════════════════

export interface PerformanceStats {
  /** 总耗时（ms） */
  duration: number
  /** Competition 执行次数 */
  competitionCount: number
  /** Decision 节点数 */
  decisionCount: number
  /** Explain 记录数 */
  explainCount: number
  /** Rule 命中数 */
  ruleCount: number
  /** Event 事件数 */
  eventCount: number
  /** Checkpoint 数 */
  checkpointCount: number
}

function comparePerformance(
  ctxA: ReasoningContext,
  ctxB: ReasoningContext,
  statsA: PerformanceStats,
  statsB: PerformanceStats,
): BenchmarkDimension {
  const matches: string[] = []
  const diffs: string[] = []

  const metrics: [string, number, number][] = [
    ['耗时(ms)', statsA.duration, statsB.duration],
    ['Competition次数', statsA.competitionCount, statsB.competitionCount],
    ['Decision数', statsA.decisionCount, statsB.decisionCount],
    ['Explain数', statsA.explainCount, statsB.explainCount],
    ['Event数', statsA.eventCount, statsB.eventCount],
  ]

  for (const [name, a, b] of metrics) {
    if (a === b) {
      matches.push(`${name}: ${a}`)
    } else {
      const delta = b - a
      diffs.push(`${name}: ${a} vs ${b} (Δ${delta > 0 ? '+' : ''}${delta})`)
    }
  }

  return {
    name: 'Performance Compare',
    matches,
    diffs,
    passed: diffs.length === 0,
  }
}

// ═══════════════════════════════════════════════════════════════
// 统一入口
// ═══════════════════════════════════════════════════════════════

/**
 * 运行五维 Benchmark 对比
 *
 * @param ctxA 基准上下文
 * @param ctxB 对比上下文
 * @param competitionA 竞争结果A（可选，用于 Competition Compare）
 * @param competitionB 竞争结果B（可选，用于 Competition Compare）
 */
export function runBenchmark(
  ctxA: ReasoningContext,
  ctxB: ReasoningContext,
  competitionA?: CompetitionResult,
  competitionB?: CompetitionResult,
  perfA?: PerformanceStats,
  perfB?: PerformanceStats,
): BenchmarkReport {
  const dimensions: BenchmarkDimension[] = []

  dimensions.push(compareResult(ctxA, ctxB))
  dimensions.push(compareExplain(ctxA, ctxB))
  dimensions.push(compareDecision(ctxA, ctxB))

  if (competitionA && competitionB) {
    dimensions.push(compareCompetition(competitionA, competitionB))
  } else {
    dimensions.push({
      name: 'Competition Compare',
      matches: ['未提供 CompetitionResult，跳过'],
      diffs: [],
      passed: true,
    })
  }

  dimensions.push(compareContext(ctxA, ctxB))

  if (perfA && perfB) {
    dimensions.push(comparePerformance(ctxA, ctxB, perfA, perfB))
  } else {
    dimensions.push({
      name: 'Performance Compare',
      matches: ['未提供 PerformanceStats，跳过'],
      diffs: [],
      passed: true,
    })
  }

  const passedDimensions = dimensions.filter(d => d.passed).length

  return {
    totalDimensions: dimensions.length,
    passedDimensions,
    dimensions,
    passed: passedDimensions === dimensions.length,
    timestamp: Date.now(),
  }
}

/**
 * 格式化 Benchmark 报告为文本
 */
export function formatBenchmarkReport(report: BenchmarkReport): string {
  const lines: string[] = []
  lines.push(`=== Benchmark 报告 ===`)
  lines.push(`时间: ${new Date(report.timestamp).toLocaleString()}`)
  lines.push(`结果: ${report.passed ? '✅ 通过' : '❌ 未通过'} (${report.passedDimensions}/${report.totalDimensions})`)
  lines.push('')

  for (const dim of report.dimensions) {
    lines.push(`【${dim.name}】${dim.passed ? '✅' : '❌'}`)
    for (const m of dim.matches) {
      lines.push(`  ✅ ${m}`)
    }
    for (const d of dim.diffs) {
      lines.push(`  ❌ ${d}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
