/**
 * QiEngine V4 主入口（最终版）
 *
 * - Engine 通过 PipelineContext 驱动，Engine 零改动
 * - 每步自动 Validation
 * - Immutable Snapshot
 * - EventBus 事件机制
 * - StrengthEngine 读 QiSnapshot
 */

import type { SixLines, HeavenlyStem, EarthlyBranch, FiveElement, WuXingWangShuai } from '../types'
import type { QiNode, QiEngineResult, QiContext, QiPipelineContext, QiSnapshot, ValidationIssue } from './types'
import { buildQiNodes, resetBuilderSequence, getGlobalSeq } from './builder'
import { detectSeasonOperations } from './modifier'
import { QiExecutor, resetSequence, resetVersion, setSequence } from './executor'
import { takeSnapshot, resetSnapshotSequence } from './aggregator'
import { validateStep } from './validator'
import { QiPipeline } from './pipeline'
import type { PipelineStep } from './types'
import { getStemElement, getBranchElement } from '@/lib/core'

const CANG_GAN_TABLE: Record<string, { ben: string; zhong: string | null; yao: string | null }> = {
  '子': { ben: '癸', zhong: null, yao: null }, '丑': { ben: '己', zhong: '辛', yao: '癸' },
  '寅': { ben: '甲', zhong: '丙', yao: '戊' }, '卯': { ben: '乙', zhong: null, yao: null },
  '辰': { ben: '戊', zhong: '乙', yao: '癸' }, '巳': { ben: '丙', zhong: '庚', yao: '戊' },
  '午': { ben: '丁', zhong: '己', yao: null }, '未': { ben: '己', zhong: '丁', yao: '乙' },
  '申': { ben: '庚', zhong: '壬', yao: '戊' }, '酉': { ben: '辛', zhong: null, yao: null },
  '戌': { ben: '戊', zhong: '辛', yao: '丁' }, '亥': { ben: '壬', zhong: '甲', yao: null },
}

const WANG_SHUAI: Record<FiveElement, Record<FiveElement, WuXingWangShuai>> = {
  '木': { '木': '旺', '火': '相', '土': '死', '金': '囚', '水': '休' },
  '火': { '木': '休', '火': '旺', '土': '相', '金': '死', '水': '囚' },
  '土': { '木': '死', '火': '囚', '土': '旺', '金': '相', '水': '休' },
  '金': { '木': '囚', '火': '休', '土': '死', '金': '旺', '水': '相' },
  '水': { '木': '相', '火': '死', '土': '囚', '金': '休', '水': '旺' },
}

function buildCangGanData(sixLines: SixLines) {
  const data: Record<string, { ben: string; zhong: string | null; yao: string | null }> = {}
  for (const pillar of ['year', 'month', 'day', 'hour'] as const) {
    data[sixLines[pillar].zhi] = CANG_GAN_TABLE[sixLines[pillar].zhi] || { ben: '', zhong: null, yao: null }
  }
  return data as any
}

function calculateStrengthFromSnapshot(
  snapshot: QiSnapshot,
  dayElement: FiveElement,
  monthElement: FiveElement,
): { score: number; wangShuai: WuXingWangShuai } {
  const dayScore = snapshot.elementScores[dayElement]
  const wangShuai = WANG_SHUAI[monthElement][dayElement]
  const wangShuaiAdjust: Record<WuXingWangShuai, number> = { '旺': 10, '相': 5, '休': 0, '囚': -5, '死': -10 }
  let score = wangShuaiAdjust[wangShuai] + 50
  score += Math.round((dayScore / 120) * 30)
  return { score: Math.max(0, Math.min(100, score)), wangShuai }
}

/**
 * QiEngine V4 主入口
 * Engine 通过 Pipeline 驱动，永远不知道有哪些模块
 */
export function runQiEngine(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  monthZhi: EarthlyBranch,
): QiEngineResult {
  // 重置全局计数器
  resetBuilderSequence()
  resetSequence(0)
  resetVersion(0)
  resetSnapshotSequence()

  const dayElement = getStemElement(dayGan)
  const monthElement = getBranchElement(monthZhi)
  const ctx: QiContext = { dayGan, dayElement, monthZhi, monthElement }
  const cangGanData = buildCangGanData(sixLines)

  // 1. QiBuilder
  const originalQi = buildQiNodes(sixLines, cangGanData)

  // 同步 sequence 计数器（builder 使用的计数器 → executor 的计数器）
  setSequence(getGlobalSeq())
  const snapshot0 = takeSnapshot('Step0-Original', originalQi)
  const allIssues: ValidationIssue[] = []
  allIssues.push(...validateStep('Step0-Original', originalQi, snapshot0))

  // 2. 创建 Executor + PipelineContext
  const executor = new QiExecutor(originalQi)
  const pCtx: QiPipelineContext = {
    ctx,
    executor,
    snapshots: [snapshot0],
    metadata: {
      sixLinesName: `${sixLines.year.gan}${sixLines.year.zhi} ${sixLines.month.gan}${sixLines.month.zhi} ${sixLines.day.gan}${sixLines.day.zhi} ${sixLines.hour.gan}${sixLines.hour.zhi}`,
      dayGan, monthZhi,
      timestamp: Date.now(),
    },
    cache: new Map(),
    version: 1,
  }

  // 3. SeasonModifier Step
  const seasonStep: PipelineStep = {
    name: 'SeasonModifier',
    run: (qiNodes, pCtx) => {
      const exec = pCtx.executor
      exec.begin()
      const ops = detectSeasonOperations(qiNodes, pCtx.ctx.monthZhi)
      const result = exec.execute(ops, 'SeasonModifier')
      exec.commit()
      return result
    },
  }

  // 4. Pipeline 驱动
  const pipeline = new QiPipeline()
  pipeline.addStep(seasonStep)
  // P1: pipeline.addStep(conflictStep)
  // P1: pipeline.addStep(heHuaStep)

  const finalQi = pipeline.runAll(originalQi, pCtx, (stepName, qiNodes, prevNodes) => {
    const snapshot = takeSnapshot(stepName, qiNodes, prevNodes, pCtx.version)
    allIssues.push(...validateStep(stepName, qiNodes, snapshot))
    pCtx.executor.events.emitSnapshotCreated(stepName, pCtx.version, pCtx.snapshots.length)
    return snapshot
  })

  // 5. Final Snapshot
  const finalSnapshot = takeSnapshot('Final', finalQi, pCtx.snapshots[pCtx.snapshots.length - 1].qiNodes as QiNode[], pCtx.version)
  allIssues.push(...validateStep('Final', finalQi, finalSnapshot))

  // 6. StrengthEngine
  const { score: strengthScore, wangShuai } = calculateStrengthFromSnapshot(finalSnapshot, dayElement, monthElement)

  return {
    snapshots: pCtx.snapshots,
    finalQi,
    finalSnapshot,
    heHuaCommands: [],
    conflictCommands: [],
    validationIssues: allIssues,
    strengthScore,
    wangShuai,
    dayElement,
  }
}
