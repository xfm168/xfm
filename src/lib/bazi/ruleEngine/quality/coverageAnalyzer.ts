import type { CoverageReport } from './types'
import type { RuleDefinition } from '../types'

/**
 * C8-1 Rule Coverage（覆盖率分析）
 * 
 * 分析：
 * 1. 哪些命例没有任何规则命中
 * 2. 哪些规则永远不会命中（dead rules）
 */
export class CoverageAnalyzer {
  /**
   * 分析规则覆盖率
   * @param rules 已注册的规则列表
   * @param caseIds 案例ID列表
   * @param hitMatrix 命中矩阵：caseId → ruleId → 是否命中
   */
  analyze(
    rules: RuleDefinition[],
    caseIds: string[],
    hitMatrix: Record<string, Record<string, boolean>>,
  ): CoverageReport {
    const generatedAt = new Date().toISOString()
    const totalCases = caseIds.length
    const totalRules = rules.length

    // 统计每个案例是否被至少一条规则命中
    const uncoveredCases: string[] = []
    let coveredCases = 0
    for (const caseId of caseIds) {
      const hits = hitMatrix[caseId]
      if (hits && Object.values(hits).some(v => v === true)) {
        coveredCases++
      } else {
        uncoveredCases.push(caseId)
      }
    }

    // 统计每条规则的命中次数
    const ruleHitCount = rules.map(rule => {
      let hitCount = 0
      for (const caseId of caseIds) {
        const hits = hitMatrix[caseId]
        if (hits && hits[rule.id] === true) hitCount++
      }
      return {
        ruleId: rule.id,
        ruleName: rule.name ?? rule.id,
        hitCount,
        hitRate: totalCases > 0 ? hitCount / totalCases : 0,
      }
    })

    // 检测 dead rules（命中次数为 0 的规则）
    const deadRules = ruleHitCount
      .filter(r => r.hitCount === 0)
      .map(r => ({
        ruleId: r.ruleId,
        ruleName: r.ruleName,
        reason: '在所有案例中均未命中',
      }))

    return {
      generatedAt,
      totalCases,
      totalRules,
      coveredCases,
      uncoveredCases,
      coverageRate: totalCases > 0 ? coveredCases / totalCases : 0,
      ruleHitCount,
      deadRules,
    }
  }
}
