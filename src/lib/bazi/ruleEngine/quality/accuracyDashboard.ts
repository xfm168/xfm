import type { AccuracyDashboard } from './types'
import type { RuleDefinition } from '../types'

/**
 * C8-5 Rule Accuracy Dashboard（准确率看板）
 *
 * 统计：格局/喜用神/神煞准确率 + 古籍吻合率 + Evidence完整率 + Knowledge引用率 + Sandbox通过率
 */
export class AccuracyDashboardAnalyzer {
  /**
   * 生成准确率看板
   * @param rules 规则列表
   * @param validationResults 每条规则的校验结果（可来自 C2 classicValidator）
   * @param sandboxResults 每条规则的 Sandbox 测试结果
   */
  analyze(
    rules: RuleDefinition[],
    validationResults: Array<{
      ruleId: string
      accuracy: number
      classicMatched: boolean
      evidenceComplete: boolean
      knowledgeReferenced: boolean
    }>,
    sandboxResults: Array<{ ruleId: string; passed: boolean }>,
  ): AccuracyDashboard {
    const generatedAt = new Date().toISOString()
    const totalRules = rules.length

    // 按 category 统计
    const categoryMap = new Map<string, RuleDefinition[]>()
    for (const r of rules) {
      const cat = r.category ?? 'uncategorized'
      if (!categoryMap.has(cat)) categoryMap.set(cat, [])
      categoryMap.get(cat)!.push(r)
    }

    const valMap = new Map(validationResults.map(v => [v.ruleId, v]))
    const sbMap = new Map(sandboxResults.map(s => [s.ruleId, s]))

    const byCategory = Array.from(categoryMap.entries()).map(([category, catRules]) => {
      const catValResults = catRules.map(r => valMap.get(r.id)).filter(Boolean) as typeof validationResults
      const accuracy = catValResults.length > 0
        ? catValResults.reduce((sum, v) => sum + v.accuracy, 0) / catValResults.length
        : 0
      const classicMatched = catValResults.filter(v => v.classicMatched).length
      return {
        category,
        totalRules: catRules.length,
        accuracy: Number(accuracy.toFixed(4)),
        passedCases: catValResults.filter(v => v.accuracy >= 0.85).length,
        totalCases: catValResults.length,
        classicMatchRate: catValResults.length > 0 ? classicMatched / catValResults.length : 0,
      }
    })

    const allValResults = rules.map(r => valMap.get(r.id)).filter(Boolean) as typeof validationResults
    const allSbResults = rules.map(r => sbMap.get(r.id)).filter(Boolean) as typeof sandboxResults

    return {
      generatedAt,
      totalRules,
      byCategory,
      overallClassicMatchRate: allValResults.length > 0
        ? allValResults.filter(v => v.classicMatched).length / allValResults.length
        : 0,
      evidenceCompletenessRate: allValResults.length > 0
        ? allValResults.filter(v => v.evidenceComplete).length / allValResults.length
        : 0,
      knowledgeReferenceRate: allValResults.length > 0
        ? allValResults.filter(v => v.knowledgeReferenced).length / allValResults.length
        : 0,
      sandboxPassRate: allSbResults.length > 0
        ? allSbResults.filter(s => s.passed).length / allSbResults.length
        : 0,
      overallAccuracy: allValResults.length > 0
        ? allValResults.reduce((sum, v) => sum + v.accuracy, 0) / allValResults.length
        : 0,
    }
  }
}
