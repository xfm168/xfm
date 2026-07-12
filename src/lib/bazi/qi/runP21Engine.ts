/**
 * runP21Engine — P2-1 格局检测引擎入口
 *
 * P2-1 开发原则：
 * - 复用 P1 引擎的全部能力（QiPipeline + Conflict + HeHua + Season）
 * - 追加格局检测步骤（通过 StructureStrategy Plugin）
 * - 不修改任何 Kernel 内部代码
 * - 所有算法来自 Rule Engine
 * - Explain 引用古籍来源
 */

import type { SixLines, HeavenlyStem, EarthlyBranch } from '../types'
import type { FiveElement, ShenShi } from '../types'
import type { QiEngineResult } from './types'
import { runP1Engine } from './runP1Engine'
import { createReasoningContext, advancePhase, emitReasoningEvent } from './reasoning/stateTree'
import {
  appendExplain,
} from './reasoning/explainEngine'
import { evaluateCompetition } from './reasoning/competitionEngine'
import {
  detectStructure,
  type StructureDetectionInput,
} from './plugin/structureStrategy'
import type { GeJuResult } from '../rules/gejuRules'

// ─── 计算十神关系（从 gejuRules 复用逻辑） ───

const ELEMENT_MAP: Record<string, FiveElement> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
}

function calcRelatedShens(sixLines: SixLines, dayGan: string): Record<string, ShenShi> {
  const dayElement = ELEMENT_MAP[dayGan]
  const dayYY = '甲丙戊庚壬'.includes(dayGan) ? '阳' : '阴'
  const GENERATE: Record<FiveElement, FiveElement> = {
    '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
  }
  const OVERCOME: Record<FiveElement, FiveElement> = {
    '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
  }
  const result: Record<string, ShenShi> = {}

  for (const pillar of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
    for (const gz of [pillar.gan, pillar.zhi]) {
      const el = ELEMENT_MAP[gz]
      if (!el) continue
      const yy = '甲丙戊庚壬'.includes(gz) ? '阳' : '阴'
      const sameYY = dayYY === yy
      if (el === dayElement) {
        result[gz] = sameYY ? '比肩' : '劫财'
      } else if (GENERATE[dayElement] === el) {
        result[gz] = sameYY ? '食神' : '伤官'
      } else if (OVERCOME[dayElement] === el) {
        result[gz] = sameYY ? '偏财' : '正财'
      } else if (OVERCOME[el] === dayElement) {
        result[gz] = sameYY ? '偏官' : '正官'
      } else if (GENERATE[el] === dayElement) {
        result[gz] = sameYY ? '偏印' : '正印'
      } else {
        result[gz] = '比肩'
      }
    }
  }
  return result
}

function calcFiveElementCount(sixLines: SixLines): Record<FiveElement, number> {
  const count: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  for (const pillar of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
    count[pillar.element] = (count[pillar.element] || 0) + 1
  }
  return count
}

// ─── P2-1 引擎结果 ───

export interface P21EngineResult extends QiEngineResult {
  /** 格局检测结果 */
  geJuResult?: GeJuResult
  /** ReasoningContext（推演上下文） */
  reasoning?: import('./reasoning/types').ReasoningContext
}

// ─── P2-1 引擎入口 ───

/**
 * P2-1 完整引擎入口
 *
 * 1. 运行 P1 Pipeline（Season + Conflict + HeHua + Transform）
 * 2. 追加格局检测（Structure Strategy Plugin）
 * 3. 通过 Competition Engine 竞争格局候选
 * 4. 产生完整 Explain + Event
 */
export function runP21Engine(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  monthZhi: EarthlyBranch,
): P21EngineResult {
  // 1. 运行 P1 引擎
  const p1Result = runP1Engine(sixLines, dayGan, monthZhi)

  // 2. 构建 ReasoningContext（使用 P1 结果作为 initialNodes）
  const sixLinesName =
    `${sixLines.year.gan}${sixLines.year.zhi} ${sixLines.month.gan}${sixLines.month.zhi} ${sixLines.day.gan}${sixLines.day.zhi} ${sixLines.hour.gan}${sixLines.hour.zhi}`

  const ctx = createReasoningContext({
    sixLinesName,
    dayGan,
    dayElement: p1Result.dayElement,
    monthZhi,
    monthElement: sixLines.month.element,
    initialNodes: p1Result.finalQi,
  })

  // 推进阶段到 AfterQiFlow（使用 P1 最终气节点）
  advancePhase(ctx, 'AfterQiFlow', p1Result.finalQi)

  emitReasoningEvent(ctx, 'PhaseAdvanced', 'P1完成', 'P1 Pipeline 全部步骤执行完毕')

  // 3. 准备格局检测输入
  const relatedShens = calcRelatedShens(sixLines, dayGan)
  const fiveElementCount = calcFiveElementCount(sixLines)

  const structureInput: StructureDetectionInput = {
    sixLines,
    relatedShens,
    strengthScore: p1Result.strengthScore ?? 50,
    dayGan,
    monthZhi,
    fiveElementCount,
  }

  // 4. 纯函数格局检测（Stateless）
  const detection = detectStructure(structureInput)

  // 5. 追加 Explain 到 Context
  for (const exp of detection.explains) {
    appendExplain(ctx, exp)
  }

  // 6. 竞争评估
  const compResult = evaluateCompetition(
    detection.competitionCandidates,
    p1Result.finalQi,
  )

  emitReasoningEvent(
    ctx,
    'CompetitionResolved',
    '格局竞争',
    `格局竞争完成：${compResult.winner?.name ?? '无'}（${compResult.allCandidates.length}个候选）`,
  )

  // 7. 推进到格局阶段
  advancePhase(ctx, 'AfterStructure', p1Result.finalQi)

  // 8. 写入格局结果到 Context
  ctx.currentStructure = {
    name: detection.result.name,
    stable: !detection.result.poGe,
    evolution: [{
      order: 1,
      phase: 'AfterStructure',
      structure: detection.result.name,
      changeReason: detection.result.reasons.join('；') || '格局判定',
      explainId: detection.explains[0]?.id || '',
    }],
    explainId: detection.explains[0]?.id,
  }
  ctx.currentStructureDynamic = ctx.currentStructure
  ctx.currentWangShuai = p1Result.wangShuai

  emitReasoningEvent(
    ctx,
    detection.result.poGe ? 'StructureChanged' : 'StructureStable',
    detection.result.name,
    `格局${detection.result.poGe ? '变化' : '稳定'}：${detection.result.name}（${detection.result.category}）`,
  )

  return {
    ...p1Result,
    geJuResult: detection.result,
    reasoning: ctx,
  }
}
