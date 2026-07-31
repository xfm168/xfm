import type { ConflictReport, RuleConflict, RuleConflictType } from './types'
import type { RuleDefinition } from '../types'

/**
 * C8-2 Rule Conflict（冲突检测）
 *
 * 检测：
 * 1. 两个规则同时成立（concurrent）
 * 2. 两个规则互相否定（contradictory）
 * 3. 优先级错误（priority_error）
 * 4. 条件高度重叠（overlap）
 */
export class ConflictAnalyzer {
  /**
   * 分析规则冲突
   * @param rules 规则列表
   * @param hitMatrix 命中矩阵：caseId → ruleId → 是否命中
   */
  analyze(
    rules: RuleDefinition[],
    hitMatrix: Record<string, Record<string, boolean>>,
  ): ConflictReport {
    const generatedAt = new Date().toISOString()
    const conflicts: RuleConflict[] = []
    const caseIds = Object.keys(hitMatrix)

    // 两两对比规则
    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const r1 = rules[i]
        const r2 = rules[j]

        // 统计在哪些案例中同时命中
        const concurrentCases: string[] = []
        let r1HitCount = 0
        let r2HitCount = 0
        for (const caseId of caseIds) {
          const hits = hitMatrix[caseId]
          const h1 = hits?.[r1.id] === true
          const h2 = hits?.[r2.id] === true
          if (h1) r1HitCount++
          if (h2) r2HitCount++
          if (h1 && h2) concurrentCases.push(caseId)
        }

        // 1. concurrent: 同时成立
        if (concurrentCases.length > 0) {
          // 检查是否同 category 且 conflictStrategy 不同
          const sameCategory = r1.category === r2.category
          if (sameCategory) {
            conflicts.push({
              type: 'concurrent',
              ruleIds: [r1.id, r2.id],
              description: `规则 ${r1.id} 和 ${r2.id} 在 ${concurrentCases.length} 个案例中同时命中（同 category）`,
              affectedCases: concurrentCases,
              suggestion: '检查是否需要互斥，或调整 conflictStrategy',
              severity: concurrentCases.length > caseIds.length * 0.5 ? 'high' : 'medium',
            })
          }
        }

        // 2. contradictory: 互相否定（结果相反）
        // 简单启发式：如果两个规则 result 相反（含"成立"/"不成立"）
        if (r1.result && r2.result) {
          const isContradictory =
            (r1.result.includes('不成立') && r2.result.includes('成立') && !r2.result.includes('不')) ||
            (r2.result.includes('不成立') && r1.result.includes('成立') && !r1.result.includes('不'))
          if (isContradictory) {
            conflicts.push({
              type: 'contradictory',
              ruleIds: [r1.id, r2.id],
              description: `规则 ${r1.id} 结果="${r1.result}" 与 ${r2.id} 结果="${r2.result}" 互相否定`,
              affectedCases: concurrentCases,
              suggestion: '检查规则条件是否互斥，或设置优先级',
              severity: 'high',
            })
          }
        }

        // 3. priority_error: 优先级错误
        if (r1.priority != null && r2.priority != null) {
          // 如果高优先级规则命中少，低优先级规则命中多，可能优先级反了
          if (r1.priority > r2.priority && r1HitCount < r2HitCount * 0.3 && r1HitCount > 0) {
            conflicts.push({
              type: 'priority_error',
              ruleIds: [r1.id, r2.id],
              description: `规则 ${r1.id} (priority=${r1.priority}) 命中${r1HitCount}次，但 ${r2.id} (priority=${r2.priority}) 命中${r2HitCount}次，可能优先级反置`,
              affectedCases: [],
              suggestion: '检查优先级是否设置正确',
              severity: 'low',
            })
          }
        }

        // 4. overlap: 条件高度重叠
        const conds1 = (r1.condition ?? []).map(c => c.description)
        const conds2 = (r2.condition ?? []).map(c => c.description)
        const overlap = conds1.filter(c1 => conds2.some(c2 => c2.includes(c1.slice(0, 4)) || c1.includes(c2.slice(0, 4))))
        if (overlap.length > 0 && overlap.length >= Math.min(conds1.length, conds2.length) * 0.5) {
          conflicts.push({
            type: 'overlap',
            ruleIds: [r1.id, r2.id],
            description: `规则 ${r1.id} 和 ${r2.id} 条件高度重叠（${overlap.length} 个共同条件）`,
            affectedCases: concurrentCases,
            suggestion: '考虑合并规则或细化条件区分',
            severity: 'low',
          })
        }
      }
    }

    // 按类型统计
    const byType = conflicts.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] ?? 0) + 1
      return acc
    }, {} as Record<RuleConflictType, number>)

    // 按严重程度统计
    const bySeverity = conflicts.reduce((acc, c) => {
      acc[c.severity] = (acc[c.severity] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      generatedAt,
      totalConflicts: conflicts.length,
      conflicts,
      byType,
      bySeverity,
    }
  }
}
