/**
 * 命理分歧引擎
 *
 * 职责：
 *   - 根据主题生成分歧报告
 *   - 为具体命例匹配相关冲突
 *   - 提供冲突统计与结构化解释
 */

import type { CaseEntryV2, ConflictRecordV2 } from './caseLibraryTypesV2'
import type { DisagreementReport, DisagreementSeverity } from './disagreementTypes'

import {
  DISAGREEMENT_CONFLICTS,
  getAllConflicts,
  getConflictsByTopic,
  getConflictStatistics,
} from './disagreementDatabase'

import {
  generateDisagreementReportId,
} from './disagreementTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const DISAGREEMENT_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 核心函数
// ═══════════════════════════════════════════

/**
 * 根据主题生成分歧报告
 * @param topic - 分歧主题关键词
 * @returns 完整的分歧报告
 */
export function generateDisagreementReport(topic: string): DisagreementReport {
  const conflicts = getConflictsByTopic(topic)
  const matchedConflict = conflicts[0]

  const severity: DisagreementSeverity = matchedConflict
    ? inferSeverityFromConflict(matchedConflict)
    : 'info'

  const viewpoints = matchedConflict
    ? [
        { side: 'A' as const, source: matchedConflict.sourceA, argument: matchedConflict.viewpointA },
        { side: 'B' as const, source: matchedConflict.sourceB, argument: matchedConflict.viewpointB },
      ]
    : []

  return {
    reportId: generateDisagreementReportId(),
    topic: matchedConflict ? matchedConflict.topic : topic,
    type: matchedConflict ? matchedConflict.conflictType : 'school',
    severity,
    viewpoints,
    resolution: matchedConflict?.resolution,
    relatedCaseIds: matchedConflict ? [...matchedConflict.affectedCaseIds] : [],
    generatedAt: Date.now(),
  }
}

/**
 * 为具体命例匹配相关冲突
 * @param caseEntry - 命例条目
 * @returns 匹配的冲突记录数组
 */
export function findConflictsForCase(caseEntry: CaseEntryV2): ConflictRecordV2[] {
  const result: ConflictRecordV2[] = []
  const er = caseEntry.expectedResult

  for (const conflict of DISAGREEMENT_CONFLICTS) {
    let matched = false

    // 根据格局匹配
    if (er.primaryPattern && conflict.topic.includes('格局')) {
      matched = true
    }

    // 根据喜用神匹配
    if ((er.primaryXiShen || er.primaryYongShen) && conflict.topic.includes('用神')) {
      matched = true
    }

    // 根据强弱匹配
    if (er.strengthLevel && conflict.topic.includes('从')) {
      matched = true
    }

    // 根据神煞匹配
    if (er.shenShaList && er.shenShaList.length > 0 && conflict.topic.includes('神煞')) {
      matched = true
    }

    // 根据十神匹配
    if (er.tenGodSummary && conflict.topic.includes('伤官')) {
      matched = true
    }

    // 根据 caseId 直接关联
    if (conflict.affectedCaseIds.includes(caseEntry.caseId)) {
      matched = true
    }

    if (matched) {
      result.push({ ...conflict })
    }
  }

  return result
}

/**
 * 获取所有冲突统计摘要
 * @returns 结构化统计信息
 */
export function getConflictSummary(): {
  version: string
  totalConflicts: number
  byType: Record<string, number>
  byResolutionStatus: { resolved: number; unresolved: number }
  topTopics: string[]
} {
  const stats = getConflictStatistics()
  const all = getAllConflicts()

  const topTopics = all
    .map((c) => c.topic)
    .slice(0, 5)

  return {
    version: DISAGREEMENT_VERSION,
    totalConflicts: stats.total,
    byType: stats.byType,
    byResolutionStatus: {
      resolved: stats.withResolution,
      unresolved: stats.withoutResolution,
    },
    topTopics,
  }
}

// ═══════════════════════════════════════════
// 3. 解释函数
// ═══════════════════════════════════════════

/** 结构化冲突解释 */
export interface ConflictExplanation {
  conflictId: string
  topic: string
  whyTheyDiffer: string
  historicalContext: string
  practicalImpact: string
  recommendedApproach: string
}

/**
 * 返回结构化解释（为什么不同老师结论不同）
 * @param conflictId - 冲突 ID
 * @returns 结构化解释，未找到则返回 null
 */
export function explainConflict(conflictId: string): ConflictExplanation | null {
  const conflict = DISAGREEMENT_CONFLICTS.find((c) => c.conflictId === conflictId)
  if (!conflict) return null

  const whyTheyDiffer = buildWhyTheyDiffer(conflict)
  const historicalContext = buildHistoricalContext(conflict)
  const practicalImpact = buildPracticalImpact(conflict)
  const recommendedApproach = buildRecommendedApproach(conflict)

  return {
    conflictId: conflict.conflictId,
    topic: conflict.topic,
    whyTheyDiffer,
    historicalContext,
    practicalImpact,
    recommendedApproach,
  }
}

// ═══════════════════════════════════════════
// 4. 内部辅助函数
// ═══════════════════════════════════════════

function inferSeverityFromConflict(conflict: ConflictRecordV2): DisagreementSeverity {
  if (conflict.topic.includes('格局') || conflict.topic.includes('从格')) {
    return 'critical'
  }
  if (conflict.topic.includes('用神') || conflict.topic.includes('伤官')) {
    return 'major'
  }
  if (conflict.topic.includes('神煞') || conflict.topic.includes('空亡')) {
    return 'minor'
  }
  return 'info'
}

function buildWhyTheyDiffer(conflict: ConflictRecordV2): string {
  return (
    `《${conflict.sourceA}》认为：${conflict.viewpointA}；` +
    `而《${conflict.sourceB}》认为：${conflict.viewpointB}。` +
    `分歧根源在于两者对${conflict.topic}的核心定义和权重分配不同。`
  )
}

function buildHistoricalContext(conflict: ConflictRecordV2): string {
  const map: Record<string, string> = {
    classical: '这一分歧源于不同历史时期的古典文献，各自代表当时命理学的最高成就。',
    school: '这是命理不同流派之间的经典之争，各派都有其理论体系和实践验证。',
    expert: '这是当代著名命理专家之间的学术分歧，反映了现代命理研究的活跃与多元。',
    expert_text: '专家之间因师承、实践领域不同而形成的观点差异。',
  }
  return map[conflict.conflictType] || '历史上各派对此问题有不同看法。'
}

function buildPracticalImpact(conflict: ConflictRecordV2): string {
  if (conflict.affectedCaseIds.length > 0) {
    return `该分歧直接影响 ${conflict.affectedCaseIds.length} 个命例的分析结论，在实际论命中可能导致喜用神和格局的完全不同判定。`
  }
  return '该分歧在理论层面影响较大，但在一般命例中差异可能不明显。'
}

function buildRecommendedApproach(conflict: ConflictRecordV2): string {
  if (conflict.resolution) {
    return `建议：${conflict.resolution}`
  }
  return '建议：在实践中综合两派观点，以事实验证为主，避免教条化。'
}
