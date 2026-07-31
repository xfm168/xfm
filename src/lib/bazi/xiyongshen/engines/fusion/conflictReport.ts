/**
 * ConflictReport - 冲突解释系统
 *
 * 当两个引擎对同一五行给出矛盾评分时（如 Climate 建议火，Medicine 建议水），
 * 不能直接平均，必须输出：
 * - 为什么冲突
 * - 冲突来源
 * - 采用哪一派
 * - 为什么舍弃另一派
 */

import type { Wuxing } from '../../types'
import type { SubEngineResult } from '../types'
import type { EngineConflict, ConflictReport, SchoolProfile } from './types'
import { getEnginePriority } from './schoolProfile'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']

/** 冲突检测阈值：两个引擎对同一五行的评分差超过此值则视为冲突 */
const CONFLICT_THRESHOLD = 2

/**
 * 检测所有引擎间的冲突
 */
export function detectConflicts(
  subResults: SubEngineResult[],
  profile: SchoolProfile,
): EngineConflict[] {
  const conflicts: EngineConflict[] = []
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
          const priorityA = getEnginePriority(profile, a.engineName)
          const priorityB = getEnginePriority(profile, b.engineName)
          const weightA = a.weight
          const weightB = b.weight

          // 决定采用哪一派
          const scoreABasis = priorityA * 2 + weightA * 10
          const scoreBBasis = priorityB * 2 + weightB * 10

          let adoptedSide: 'A' | 'B' | 'both' | 'neither'
          let adoptionReason: string
          let rejectionReason: string

          if (Math.abs(scoreABasis - scoreBBasis) < 0.5) {
            // 两者权重和优先级接近，综合采纳
            adoptedSide = 'both'
            adoptionReason = `${a.engineName}与${b.engineName}在${profile.name}下权重和优先级接近，综合采纳两方意见，降低最终 confidence`
            rejectionReason = '不舍弃任何一方，但冲突惩罚降低整体可信度'
          } else if (scoreABasis > scoreBBasis) {
            adoptedSide = 'A'
            adoptionReason = `${a.engineName}在${profile.name}下优先级=${priorityA}，权重=${weightA.toFixed(2)}，综合基准=${scoreABasis.toFixed(2)}高于${b.engineName}的${scoreBBasis.toFixed(2)}，故采纳${a.engineName}意见`
            rejectionReason = `${b.engineName}虽有不同意见，但优先级=${priorityB}，权重=${weightB.toFixed(2)}较低，予以舍弃`
          } else {
            adoptedSide = 'B'
            adoptionReason = `${b.engineName}在${profile.name}下优先级=${priorityB}，权重=${weightB.toFixed(2)}，综合基准=${scoreBBasis.toFixed(2)}高于${a.engineName}的${scoreABasis.toFixed(2)}，故采纳${b.engineName}意见`
            rejectionReason = `${a.engineName}虽有不同意见，但优先级=${priorityA}，权重=${weightA.toFixed(2)}较低，予以舍弃`
          }

          // 冲突来源解释
          const conflictSource = generateConflictSource(a.engineName, b.engineName, wx, scoreA, scoreB)

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
          })
        }
      }
    }
  }

  return conflicts
}

/**
 * 生成冲突来源解释
 */
function generateConflictSource(
  engineA: string, engineB: string, wx: Wuxing, scoreA: number, scoreB: number,
): string {
  const sourceMap: Record<string, string> = {
    'ClimateEngine-MedicineEngine': '调候法认为该五行可调节气候，病药法认为该五行为病或药不足，两者关注角度不同',
    'ClimateEngine-BalanceEngine': '调候法侧重气候调节，扶抑法侧重日主强弱，同一五行在两体系下角色不同',
    'BalanceEngine-MedicineEngine': '扶抑法基于日主强弱取用，病药法基于病神取药，取用逻辑不同',
    'BalanceEngine-SeasonEngine': '扶抑法侧重日主扶抑，寒暖燥湿法侧重季节平衡，同一五行在两体系下可能相反',
    'ClimateEngine-SeasonEngine': '调候法与寒暖燥湿法虽相关但侧重不同，调候重月令，寒暖重量化',
    'MedicineEngine-SeasonEngine': '病药法以病药为用，寒暖燥湿法以季节平衡为用，同一五行可能一为药一为忌',
    'PatternEngine-BalanceEngine': '格局法以月令取格，扶抑法以日主强弱取用，取用逻辑不同',
    'BridgeEngine-BalanceEngine': '通关法以调和两行为用，扶抑法以扶抑日主为用，同一五行角色可能不同',
  }

  const key1 = `${engineA}-${engineB}`
  const key2 = `${engineB}-${engineA}`
  const source = sourceMap[key1] ?? sourceMap[key2]

  if (source) return source

  return `${engineA}（评分${scoreA}）与${engineB}（评分${scoreB}）对${wx}的评价存在分歧，源于两引擎关注的命理维度不同`
}

/**
 * 生成完整冲突报告
 */
export function buildConflictReport(
  subResults: SubEngineResult[],
  profile: SchoolProfile,
): ConflictReport {
  const conflicts = detectConflicts(subResults, profile)
  const maxIntensity = conflicts.length > 0
    ? Math.max(...conflicts.map(c => c.conflictIntensity))
    : 0

  // 冲突惩罚分：冲突数 × 冲突强度 × 惩罚系数
  const totalIntensity = conflicts.reduce((sum, c) => sum + c.conflictIntensity, 0)
  const conflictPenalty = Math.min(
    conflicts.length * profile.conflictPenaltyFactor + totalIntensity * 0.02,
    0.5, // 最大惩罚 0.5
  )

  const summary = conflicts.length === 0
    ? '各引擎间无显著评分冲突，决策一致性良好'
    : `检测到 ${conflicts.length} 处引擎间冲突，最大冲突强度=${maxIntensity}，冲突惩罚=${conflictPenalty.toFixed(3)}；已按 ${profile.name} 的引擎优先级和权重裁决冲突`

  return {
    conflicts,
    totalConflicts: conflicts.length,
    maxIntensity,
    conflictPenalty,
    summary,
  }
}
