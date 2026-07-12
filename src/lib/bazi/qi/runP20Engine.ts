/**
 * runP20Engine — P2-0 推演引擎入口
 * 
 * P2-0 核心升级：
 * - Rule Engine → Reasoning Engine
 * - 增加 ReasoningContext（推演上下文）
 * - 增加 StateTree（命局状态树）
 * - 增加 Explain Engine（每个判断必须可解释）
 * - 增加 Decision Log（全链路审计）
 * 
 * engine.ts 零改动
 */

import type { SixLines, HeavenlyStem, EarthlyBranch } from '../types'
import type { QiEngineResult, QiPipelineContext, PipelineStep, QiNode } from './types'
import { buildQiNodes, resetBuilderSequence, getGlobalSeq } from './builder'
import { detectSeasonOperations } from './modifier'
import { analyzeSeasonCommand } from './detector/seasonCommander'
import { QiExecutor, resetSequence, resetVersion, setSequence } from './executor'
import { takeSnapshot, resetSnapshotSequence } from './aggregator'
import { validateStep } from './validator'
import { QiPipeline } from './pipeline'
import { createP1Steps } from './detector/pipelineSteps'
import { getStemElement, getBranchElement } from '@/lib/core'
import { createReasoningContext, advancePhase } from './reasoning/stateTree'
import { createExplain, appendExplain } from './reasoning/explainEngine'
import type { ReasoningContext, ExplainRecord, ReasoningStep } from './reasoning/types'
import type { CompetitionFactors } from './detector/competitionEvaluator'

// ─── 从 runP1Engine 复制（避免循环依赖） ───

const CANG_GAN_TABLE: Record<string, { ben: string; zhong: string | null; yao: string | null }> = {
  '子': { ben: '癸', zhong: null, yao: null }, '丑': { ben: '己', zhong: '辛', yao: '癸' },
  '寅': { ben: '甲', zhong: '丙', yao: '戊' }, '卯': { ben: '乙', zhong: null, yao: null },
  '辰': { ben: '戊', zhong: '乙', yao: '癸' }, '巳': { ben: '丙', zhong: '庚', yao: '戊' },
  '午': { ben: '丁', zhong: '己', yao: null }, '未': { ben: '己', zhong: '丁', yao: '乙' },
  '申': { ben: '庚', zhong: '壬', yao: '戊' }, '酉': { ben: '辛', zhong: null, yao: null },
  '戌': { ben: '戊', zhong: '辛', yao: '丁' }, '亥': { ben: '壬', zhong: '甲', yao: null },
}

type FiveElement = import('../types').FiveElement
type WuXingWangShuai = import('../types').WuXingWangShuai

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
  totalStrength: number,
  dayElement: FiveElement,
  monthElement: FiveElement,
): { score: number; wangShuai: WuXingWangShuai } {
  const wangShuai = WANG_SHUAI[monthElement][dayElement]
  const wangShuaiAdjust: Record<WuXingWangShuai, number> = { '旺': 10, '相': 5, '休': 0, '囚': -5, '死': -10 }
  let score = wangShuaiAdjust[wangShuai] + 50
  score += Math.round((totalStrength / 120) * 30)
  return { score: Math.max(0, Math.min(100, score)), wangShuai }
}

// ─── P2-0 Engine Result ───

export interface P20EngineResult extends QiEngineResult {
  /** 推演上下文（完整推演链路） */
  reasoning: ReasoningContext
  /** 竞争评分分解（来自 CompetitionEvaluate） */
  scoreBreakdowns?: { subject: string; factors: CompetitionFactors; finalScore: number }[]
  /** 命局之病（分析得出） */
  diseases?: string[]
  /** 命局之药（分析得出） */
  medicines?: string[]
}

// ─── P2-0 Engine Entry ───

export function runP20Engine(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  monthZhi: EarthlyBranch,
): P20EngineResult {
  // Reset counters (same as runP1Engine)
  resetBuilderSequence()
  resetSequence(0)
  resetVersion(0)
  resetSnapshotSequence()

  const dayElement = getStemElement(dayGan)
  const monthElement = getBranchElement(monthZhi)
  const sixLinesName = `${sixLines.year.gan}${sixLines.year.zhi} ${sixLines.month.gan}${sixLines.month.zhi} ${sixLines.day.gan}${sixLines.day.zhi} ${sixLines.hour.gan}${sixLines.hour.zhi}`
  const cangGanData = buildCangGanData(sixLines)

  // 1. Build + Create ReasoningContext
  const originalQi = buildQiNodes(sixLines, cangGanData)
  setSequence(getGlobalSeq())

  const reasoning = createReasoningContext({
    sixLinesName,
    dayGan,
    dayElement,
    monthZhi,
    monthElement,
    initialNodes: originalQi,
  })

  // 2. Executor + PipelineContext
  const executor = new QiExecutor(originalQi)
  const allIssues: any[] = []

  // Take Step0 snapshot for validation
  const snapshot0 = takeSnapshot('Step0-Original', originalQi)
  allIssues.push(...validateStep('Step0-Original', originalQi, snapshot0))

  const pCtx: QiPipelineContext = {
    ctx: { dayGan, dayElement, monthZhi, monthElement },
    executor,
    snapshots: [snapshot0],
    metadata: { sixLinesName, dayGan, monthZhi, timestamp: Date.now() },
    cache: new Map(),
    version: 1,
  }

  // 3a. Build pillarBranchMap from qiNodes (branch → pillar mapping)
  const pillarBranchMap = new Map<string, string>()
  for (const node of originalQi) {
    if (node.branch && node.pillar) {
      pillarBranchMap.set(node.branch, node.pillar)
    }
  }
  pCtx.cache.set('pillarBranchMap', pillarBranchMap)

  // 3. Pipeline steps (same as runP1Engine, with Explain recording)
  const seasonStep: PipelineStep = {
    name: 'SeasonModifier',
    run: (qiNodes, pCtx) => {
      const exec = pCtx.executor
      exec.begin()
      const ops = detectSeasonOperations(qiNodes, pCtx.ctx.monthZhi)
      const result = exec.execute(ops, 'SeasonModifier')
      exec.commit()
      // Record explain
      appendExplain(reasoning, createExplain({
        phase: 'AfterSeason',
        step: 'SeasonModifier',
        subject: '月令季节调整',
        factors: [
          { name: `月令${pCtx.ctx.monthZhi}(${pCtx.ctx.monthElement})`, weight: 3, source: '子平真诠' },
          { name: '月令所克五行削弱', weight: -2, source: '子平真诠' },
        ],
        conclusion: { text: `月令${pCtx.ctx.monthElement}得令加权，所克五行削弱`, confidence: 0.95 },
        references: ['子平真诠·论月令'],
      }))
      return result
    },
  }

  const seasonCommanderStep: PipelineStep = {
    name: 'SeasonCommander',
    run: (qiNodes, pCtx) => {
      const { command } = analyzeSeasonCommand(qiNodes, pCtx.ctx)
      pCtx.cache.set('seasonCommands', [command])
      reasoning.seasonCommands = [command]
      return qiNodes
    },
  }

  const pipeline = new QiPipeline()
  pipeline.addStep(seasonStep)
  pipeline.addStep(seasonCommanderStep)

  const p1Steps = createP1Steps()
  for (const step of p1Steps) {
    pipeline.addStep(step)
  }

  // 4. Run pipeline with state tree tracking
  const phaseMap: Record<string, import('./reasoning/types').ChartPhase> = {
    'SeasonModifier': 'AfterSeason',
    'ConflictDetect': 'AfterConflict',
    'HeHuaDetect': 'AfterCombine',
    'CompetitionEvaluate': 'AfterConflict',
    'SeasonTransform': 'AfterSeason',
    'P1Transform': 'AfterQiFlow',
  }

  const finalQi = pipeline.runAll(originalQi, pCtx, (stepName, qiNodes, prevNodes) => {
    const snapshot = takeSnapshot(stepName, qiNodes, prevNodes, pCtx.version)
    allIssues.push(...validateStep(stepName, qiNodes, snapshot))
    pCtx.executor.events.emitSnapshotCreated(stepName, pCtx.version, pCtx.snapshots.length)

    // Advance state tree (using options parameter)
    const phase = phaseMap[stepName] || 'AfterQiFlow'
    advancePhase(reasoning, phase, qiNodes, {
      prevNodes: prevNodes as any,
      version: pCtx.version,
    })

    return snapshot
  })

  // 5. Post-pipeline: Record explains for competition results with richer chain format
  const suppressed = (pCtx.cache.get('suppressedCommands') as string[]) || []
  const scoreBreakdowns = (pCtx.cache.get('scoreBreakdowns') as { subject: string; factors: CompetitionFactors; finalScore: number }[]) || []

  // Store scoreBreakdowns in reasoning context for later use
  ;(reasoning as any).scoreBreakdowns = scoreBreakdowns

  for (const msg of suppressed) {
    // Build multi-step reasoning chain
    const chain: ReasoningStep[] = scoreBreakdowns.map((bd, idx) => ({
      order: idx + 1,
      name: `评分步骤：${bd.subject}`,
      description: `${bd.subject} 竞争力评分分解`,
      factors: [
        { name: `基础分(${bd.factors.baseScore})`, weight: bd.factors.baseScore, source: '评分公式' },
        { name: `月令加成(+${bd.factors.monthZhiBonus})`, weight: bd.factors.monthZhiBonus, source: '子平真诠' },
        ...(bd.factors.distanceBonus > 0
          ? [{ name: `柱距加成(+${bd.factors.distanceBonus})`, weight: bd.factors.distanceBonus, source: '自研推导' } as any]
          : []),
        ...(bd.factors.initiativeBonus > 0
          ? [{ name: `主动权加成(+${bd.factors.initiativeBonus})`, weight: bd.factors.initiativeBonus, source: '自研推导' } as any]
          : []),
      ],
      partialConclusion: `总分 ${bd.finalScore.toFixed(1)}`,
      references: ['子平真诠·论合冲'],
    }))

    appendExplain(reasoning, createExplain({
      phase: 'AfterConflict',
      step: 'CompetitionEvaluate',
      subject: '冲合竞争',
      factors: [
        { name: '动态评分比较', weight: 0, source: '自研推导' },
      ],
      conclusion: { text: msg, confidence: 0.85 },
      rejected: scoreBreakdowns
        .filter(bd => bd.finalScore > 0)
        .slice(0, 2)
        .map(bd => ({
          subject: bd.subject,
          reason: '竞争力较低',
          score: bd.finalScore,
        })),
      references: ['子平真诠·论合冲'],
    }))
  }

  // 6. Extract commands from cache
  const heHuaCommands = (pCtx.cache.get('activeHeHuas') as any[]) || []
  const conflictCommands = (pCtx.cache.get('activeConflicts') as any[]) || []
  const seasonCommands = (pCtx.cache.get('seasonCommands') as any[]) || []

  // Update reasoning context
  reasoning.activeHeHua = heHuaCommands
  reasoning.activeConflicts = conflictCommands
  reasoning.currentNodes = finalQi

  // 7. Final snapshot
  const finalSnapshot = takeSnapshot('Final', finalQi, pCtx.snapshots[pCtx.snapshots.length - 1].qiNodes as any, pCtx.version)
  allIssues.push(...validateStep('Final', finalQi, finalSnapshot))
  advancePhase(reasoning, 'Final', finalQi, {
    prevNodes: pCtx.snapshots[pCtx.snapshots.length - 1].qiNodes as any,
    version: pCtx.version,
  })

  // 8. StrengthEngine
  const { score: strengthScore, wangShuai } = calculateStrengthFromSnapshot(finalSnapshot.totalStrength, dayElement, monthElement)
  reasoning.currentWangShuai = wangShuai

  // 9. Derive diseases/medicines from competition analysis
  const diseases: string[] = []
  const medicines: string[] = []

  // Disease: any suppressed conflict that was high-priority indicates a structural weakness
  for (const bd of scoreBreakdowns) {
    if (bd.factors.chongPenalty > 0) {
      diseases.push(`${bd.subject}受冲克干扰`)
    }
    if (bd.factors.muQiPenalty > 0) {
      diseases.push(`${bd.subject}入墓气`)
    }
  }
  // Medicine: strong heHua commands that survived competition
  const activeHeHuas = (pCtx.cache.get('activeHeHuas') as any[]) || []
  for (const hh of activeHeHuas) {
    if (hh.success && hh.huaElement) {
      medicines.push(`${hh.type}化${hh.huaElement}`)
    }
  }

  return {
    snapshots: pCtx.snapshots,
    finalQi,
    finalSnapshot,
    heHuaCommands,
    conflictCommands,
    seasonCommands,
    validationIssues: allIssues,
    strengthScore,
    wangShuai,
    dayElement,
    reasoning,
    scoreBreakdowns: scoreBreakdowns.length > 0 ? scoreBreakdowns : undefined,
    diseases: diseases.length > 0 ? diseases : undefined,
    medicines: medicines.length > 0 ? medicines : undefined,
  }
}
