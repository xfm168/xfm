/**
 * ConflictReport V2 - 冲突解释系统（完整链路）
 *
 * 当两个引擎对同一五行给出矛盾评分时（如 Climate 建议火，Medicine 建议水），
 * 不能直接平均，必须输出完整链路：
 *   Conflict Source
 *   → 双方 Evidence
 *   → 双方 Classic
 *   → 双方 Priority（来自 RulePriorityMatrix）
 *   → Decision（adoptedSide）
 *   → Discard Reason
 *   → Adoption Reason
 *   → 裁决引用的古籍（如《穷通宝鉴》《滴天髓》）
 */

import type { Wuxing } from '../../types'
import type { SubEngineResult } from '../types'
import type { ClassicEvidenceRef } from '../../../ruleEngine/types'
import type {
  EngineConflictV2, ConflictReport, SchoolProfile, RulePriorityMatrix,
} from './types'
import { getEnginePriority } from './schoolProfile'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']

/** 冲突检测阈值：两个引擎对同一五行的评分差超过此值则视为冲突 */
const CONFLICT_THRESHOLD = 2

/**
 * 检测所有引擎间的冲突（V2 完整链路）
 */
export function detectConflictsV2(
  subResults: SubEngineResult[],
  profile: SchoolProfile,
  priorityMatrix: RulePriorityMatrix,
): EngineConflictV2[] {
  const conflicts: EngineConflictV2[] = []
  const applicable = subResults.filter(r => r.applicable)

  for (const wx of WUXING_LIST) {
    for (let i = 0; i < applicable.length; i++) {
      for (let j = i + 1; j < applicable.length; j++) {
        const a = applicable[i]
        const b = applicable[j]
        const scoreA = a.scores[wx] ?? 0
        const scoreB = b.scores[wx] ?? 0
        const diff = Math.abs(scoreA - scoreB)

        // 一方支持、另一方反对，且差距超过阈值
        const isStanceConflict =
          (scoreA > 0 && scoreB < 0) || (scoreA < 0 && scoreB > 0)

        if (isStanceConflict && diff >= CONFLICT_THRESHOLD) {
          // 来自 RulePriorityMatrix 的动态优先级
          const priorityA = priorityMatrix.byEngine[a.engineName]?.priority ?? 0
          const priorityB = priorityMatrix.byEngine[b.engineName]?.priority ?? 0

          const staticPriorityA = getEnginePriority(profile, a.engineName)
          const staticPriorityB = getEnginePriority(profile, b.engineName)

          // 裁决依据：动态优先级为主，静态优先级为辅，权重次之
          // scoreABasis = 动态优先级×10 + 静态优先级×0.5 + 引擎权重×3 + |置信度-0.5|×2
          const scoreABasis =
            priorityA * 10 +
            staticPriorityA * 0.5 +
            a.weight * 3 +
            Math.abs(a.confidence - 0.5) * 2
          const scoreBBasis =
            priorityB * 10 +
            staticPriorityB * 0.5 +
            b.weight * 3 +
            Math.abs(b.confidence - 0.5) * 2

          let adoptedSide: 'A' | 'B' | 'both' | 'neither'
          let adoptionReason: string
          let rejectionReason: string
          let priorityBasis: string
          let adjudicatingClassics: string[] = []

          // 动态优先级差距明显时 → 用"命局特征优先级"语言
          const prioRatio = priorityA > 0 && priorityB > 0
            ? Math.max(priorityA, priorityB) / Math.min(priorityA, priorityB)
            : 1
          const dynamicSignificant = prioRatio >= 1.4

          if (Math.abs(scoreABasis - scoreBBasis) < 0.35) {
            // 两者基准接近 → 综合采纳，降低 confidence
            adoptedSide = 'both'
            adoptionReason = `${a.engineName}与${b.engineName}基准分接近（${scoreABasis.toFixed(2)} vs ${scoreBBasis.toFixed(2)}），综合采纳两方意见（多用神或并存），降低最终可信度`
            rejectionReason = '不舍弃任何一方，但冲突惩罚分降低整体可信度'
            priorityBasis = '双方综合基准相当 → 综合权衡'
          } else if (dynamicSignificant && (scoreABasis > scoreBBasis ? (priorityA > priorityB) : (priorityB > priorityA))) {
            // 动态优先级显著差异 → 使用更专业的命理语言
            const higher = scoreABasis > scoreBBasis ? a : b
            const lower = scoreABasis > scoreBBasis ? b : a
            const higherPri = scoreABasis > scoreBBasis ? priorityA : priorityB
            const lowerPri = scoreABasis > scoreBBasis ? priorityB : priorityA
            adoptedSide = scoreABasis > scoreBBasis ? 'A' : 'B'

            // 命局特征 + 优先级差距 → 专业推理
            const { basis, classics } = adjudicateWithMingjuReasoning(
              higher.engineName, lower.engineName,
              higherPri, lowerPri,
              priorityMatrix,
            )
            priorityBasis = basis
            adjudicatingClassics = classics
            adoptionReason = `${higher.engineName}动态优先级=${higherPri.toFixed(3)}显著高于${lower.engineName}的${lowerPri.toFixed(3)}（倍率${prioRatio.toFixed(2)}x），${basis}，故采纳${higher.engineName}意见`
            rejectionReason = `${lower.engineName}虽有不同意见，但动态优先级仅${lowerPri.toFixed(3)}，在本轮命局特征下发言权较低，予以舍弃（非该引擎错误，而是此局适用体系不同）`
          } else if (scoreABasis > scoreBBasis) {
            adoptedSide = 'A'
            adoptionReason = `${a.engineName}综合基准=${scoreABasis.toFixed(2)}高于${b.engineName}的${scoreBBasis.toFixed(2)}（动态优先级 ${priorityA.toFixed(3)} vs ${priorityB.toFixed(3)}，静态优先级 ${staticPriorityA} vs ${staticPriorityB}），故采纳${a.engineName}`
            rejectionReason = `${b.engineName}基准分较低，舍弃其意见`
            priorityBasis = `综合基准分对比：A>B（${scoreABasis.toFixed(2)} > ${scoreBBasis.toFixed(2)}）`
          } else {
            adoptedSide = 'B'
            adoptionReason = `${b.engineName}综合基准=${scoreBBasis.toFixed(2)}高于${a.engineName}的${scoreABasis.toFixed(2)}（动态优先级 ${priorityB.toFixed(3)} vs ${priorityA.toFixed(3)}，静态优先级 ${staticPriorityB} vs ${staticPriorityA}），故采纳${b.engineName}`
            rejectionReason = `${a.engineName}基准分较低，舍弃其意见`
            priorityBasis = `综合基准分对比：B>A（${scoreBBasis.toFixed(2)} > ${scoreABasis.toFixed(2)}）`
          }

          // 冲突来源解释
          const conflictSource = generateConflictSource(a.engineName, b.engineName, wx, scoreA, scoreB)

          // 双方 Evidence（完整链路）
          const evidenceA = a.evidence.map(e => ({ step: e.step, text: e.text, satisfied: e.satisfied }))
          const evidenceB = b.evidence.map(e => ({ step: e.step, text: e.text, satisfied: e.satisfied }))

          // 双方 Classics（完整链路）
          const classicsA = a.classicEvidence
          const classicsB = b.classicEvidence

          conflicts.push({
            wuxing: wx,
            engineA: a.engineName,
            scoreA,
            stanceA: scoreA > 0 ? 'support' : 'oppose',
            engineB: b.engineName,
            scoreB,
            stanceB: scoreB > 0 ? 'support' : 'oppose',
            conflictIntensity: diff,
            conflictSource,
            adoptedSide,
            adoptionReason,
            rejectionReason,
            // V2 完整链路字段
            evidenceA,
            evidenceB,
            classicsA,
            classicsB,
            priorityA,
            priorityB,
            priorityBasis,
            adjudicatingClassics,
          })
        }
      }
    }
  }

  return conflicts
}

/**
 * 当两引擎优先级差距显著时，用命理专业语言裁决（带经典引用）
 */
function adjudicateWithMingjuReasoning(
  higherEngine: string,
  lowerEngine: string,
  higherPri: number,
  lowerPri: number,
  pm: RulePriorityMatrix,
): { basis: string; classics: string[] } {
  const pairKey = [higherEngine, lowerEngine].sort().join('-')

  // 冬火/夏水：调候 > 病药
  if ((higherEngine === 'ClimateEngine' || higherEngine === 'SeasonEngine')
    && (lowerEngine === 'MedicineEngine' || lowerEngine === 'BalanceEngine')
    && (pm.detectedPatterns.includes('winter_fire') || pm.detectedPatterns.includes('summer_water'))) {
    return {
      basis: pm.detectedPatterns.includes('winter_fire')
        ? '依据《穷通宝鉴》冬火以调候为急，调候用神（火）优先于病药/扶抑体系'
        : '依据《穷通宝鉴》夏水防炎上干涸，调候（水/金）优先于病药/扶抑',
      classics: ['穷通宝鉴', '滴天髓'],
    }
  }
  // 极旺/极弱：扶抑 > 格局
  if (higherEngine === 'BalanceEngine'
    && (lowerEngine === 'PatternEngine' || lowerEngine === 'ClimateEngine')
    && (pm.detectedPatterns.includes('extreme_strong') || pm.detectedPatterns.includes('extreme_weak'))) {
    return {
      basis: '日主极旺/极弱，扶抑法（克泄耗/生扶）为第一要务，格局/调候退居次要',
      classics: ['滴天髓', '子平真诠'],
    }
  }
  // 病药格：病药 > 扶抑
  if (higherEngine === 'MedicineEngine'
    && lowerEngine === 'BalanceEngine'
    && pm.detectedPatterns.includes('medicine_pattern')) {
    return {
      basis: '病药格：有病方为贵，无伤不是奇；以药神为用，扶抑退居次要',
      classics: ['神峰通考', '滴天髓'],
    }
  }
  // 两神交战：通关 > 扶抑/格局
  if (higherEngine === 'BridgeEngine'
    && pm.detectedPatterns.includes('bridge_war')) {
    return {
      basis: '两神交战，通关为要——《滴天髓》"关内有织女，关外有牛郎，此关若通也，相邀入洞房"',
      classics: ['滴天髓', '子平真诠'],
    }
  }
  // 特殊格局：格局 > 一切
  if (higherEngine === 'PatternEngine'
    && pm.detectedPatterns.includes('special_pattern')) {
    return {
      basis: '特殊格局（从格/专旺/化气），格局取用为宗，不可以常理扶抑',
      classics: ['子平真诠', '滴天髓', '三命通会'],
    }
  }
  // 通用：RulePriorityMatrix 动态权重
  return {
    basis: `依据 RulePriorityMatrix 动态优先级（${higherPri.toFixed(3)} vs ${lowerPri.toFixed(3)}）及命局特征「${pm.patternSummary}」，${higherEngine.replace('Engine', '')}在本轮命局中发言权更大`,
    classics: higherEngine === 'ClimateEngine' ? ['穷通宝鉴']
      : higherEngine === 'PatternEngine' ? ['子平真诠']
        : higherEngine === 'MedicineEngine' ? ['神峰通考']
          : higherEngine === 'BridgeEngine' ? ['滴天髓']
            : ['滴天髓', '三命通会'],
  }
}

/**
 * 生成冲突来源解释
 */
function generateConflictSource(
  engineA: string, engineB: string, wx: Wuxing, scoreA: number, scoreB: number,
): string {
  const sourceMap: Record<string, string> = {
    'ClimateEngine-MedicineEngine': '调候法认为该五行可调节气候，病药法认为该五行为病或药不足，两者关注角度不同',
    'ClimateEngine-BalanceEngine': '调候法侧重气候调节（月令），扶抑法侧重日主强弱（日元），同一五行在两体系下角色可能相反',
    'BalanceEngine-MedicineEngine': '扶抑法基于日主强弱取克泄耗/生扶，病药法基于病神取药神，取用逻辑不同',
    'BalanceEngine-SeasonEngine': '扶抑法侧重日主扶抑，寒暖燥湿法侧重四柱整体季节平衡，同一五行在两体系下可能相反',
    'ClimateEngine-SeasonEngine': '调候法与寒暖燥湿法虽相关但侧重不同：调候重月令关键用神，寒暖重量化综合平衡',
    'MedicineEngine-SeasonEngine': '病药法以"去病之药"为用，寒暖燥湿法以"四季平衡"为用，同一五行可能一为药一为忌',
    'PatternEngine-BalanceEngine': '格局法以月令取格/成格破格定用神，扶抑法以日主强弱取用，取用逻辑不同',
    'BridgeEngine-BalanceEngine': '通关法以调和两行为用（金木交战用水、木土交战用金等），扶抑法以扶抑日主为用，同一五行角色可能不同',
  }

  const key1 = `${engineA}-${engineB}`
  const key2 = `${engineB}-${engineA}`
  const source = sourceMap[key1] ?? sourceMap[key2]

  if (source) return source

  return `${engineA}（评分${scoreA}）与${engineB}（评分${scoreB}）对${wx}的评价存在分歧，源于两引擎关注的命理维度不同`
}

/**
 * 生成完整冲突报告 V2（含统计与分组）
 */
export function buildConflictReport(
  subResults: SubEngineResult[],
  profile: SchoolProfile,
  priorityMatrix?: RulePriorityMatrix,
): ConflictReport {
  // V1 兼容：若未传 priorityMatrix，使用动态 1（等权）
  const pm: RulePriorityMatrix = priorityMatrix ?? {
    detectedPatterns: ['balanced'],
    patternSummary: '（未提供 RulePriorityMatrix，冲突裁决使用静态优先级）',
    entries: [],
    byEngine: {},
    generatedAt: Date.now(),
  }

  const conflicts = detectConflictsV2(subResults, profile, pm)

  const maxIntensity = conflicts.length > 0
    ? Math.max(...conflicts.map(c => c.conflictIntensity))
    : 0

  // 统计：已裁决/未裁决
  let adjudicatedCount = 0, unadjudicatedCount = 0
  for (const c of conflicts) {
    if (c.adoptedSide === 'neither') unadjudicatedCount++
    else adjudicatedCount++
  }

  // 按五行分组
  const byWuxing = {} as Record<Wuxing, number>
  for (const wx of WUXING_LIST) byWuxing[wx] = 0
  for (const c of conflicts) byWuxing[c.wuxing] = (byWuxing[c.wuxing] ?? 0) + 1

  // 按引擎对分组
  const byEnginePair: Record<string, number> = {}
  for (const c of conflicts) {
    const key = [c.engineA, c.engineB].sort().join(' vs ')
    byEnginePair[key] = (byEnginePair[key] ?? 0) + 1
  }

  // 冲突惩罚分：冲突数 × 冲突强度 × 惩罚系数
  const totalIntensity = conflicts.reduce((sum, c) => sum + c.conflictIntensity, 0)
  const conflictPenalty = Math.min(
    conflicts.length * profile.conflictPenaltyFactor + totalIntensity * 0.02,
    0.5,
  )

  const summary = conflicts.length === 0
    ? '各引擎间无显著评分冲突，决策一致性良好'
    : `检测到 ${conflicts.length} 处引擎间冲突（已裁决 ${adjudicatedCount}，未裁决 ${unadjudicatedCount}），最大强度=${maxIntensity}，冲突惩罚=${conflictPenalty.toFixed(3)}；已按 RulePriorityMatrix 动态优先级 + 流派配置裁决`

  return {
    conflicts,
    totalConflicts: conflicts.length,
    maxIntensity,
    conflictPenalty: Number(conflictPenalty.toFixed(4)),
    adjudicatedCount,
    unadjudicatedCount,
    byWuxing,
    byEnginePair,
    summary,
  }
}

// V1 兼容导出名（未使用的避免 lint）
export type { ClassicEvidenceRef }
