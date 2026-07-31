import type { ExplainScore, ExplainScoreDetail, RuleHealthReport } from './types'
import type { RuleDefinition } from '../types'
import type { CoverageReport } from './types'
import type { ConflictReport } from './types'
import type { DependencyReport } from './types'
import type { PerformanceReport } from './types'
import type { AccuracyDashboard } from './types'

/**
 * C8-6 Rule Explain Score（可解释评分）
 *
 * 检查每条规则：
 * 1. 是否引用经典
 * 2. 是否引用 Evidence
 * 3. 是否引用 KnowledgeGraph
 * 4. 是否存在争议说明
 * 5. 是否输出可信度
 * 6. 是否有 trace
 * 7. 是否有 explain() 方法
 */
export class ExplainScoreAnalyzer {
  /** 评分权重 */
  private readonly WEIGHTS = {
    hasClassicEvidence: 20,    // 20分
    classicEvidenceCount: 5,   // 最多加5分（多源引用）
    hasEvidence: 15,           // 15分
    hasKnowledgeReference: 10, // 10分
    hasControversyNote: 10,    // 10分
    hasConfidence: 15,          // 15分
    hasTrace: 15,               // 15分
    hasExplain: 10,             // 10分
  }

  /** 最大总分 */
  private readonly MAX_SCORE = 100

  /**
   * 评分单条规则
   */
  scoreRule(rule: RuleDefinition, hasExplainMethod?: boolean): ExplainScore {
    const details: ExplainScoreDetail = {
      hasClassicEvidence: !!(rule.classicEvidence && rule.classicEvidence.length > 0),
      classicEvidenceCount: rule.classicEvidence?.length ?? 0,
      hasEvidence: !!(rule.evidence),
      hasKnowledgeReference: !!(rule.tags && rule.tags.some(t => t.startsWith('kg-'))),
      hasControversyNote: !!(rule.classicEvidence?.some(ce => ce.hasControversy)),
      hasConfidence: !!(rule.confidence && Object.keys(rule.confidence.components ?? {}).length > 0),
      hasTrace: !!(rule.condition && rule.condition.some(c => c.traceable)),
      hasExplain: hasExplainMethod ?? false,
    }

    let score = 0
    const deductions: string[] = []
    const suggestions: string[] = []

    if (details.hasClassicEvidence) {
      score += this.WEIGHTS.hasClassicEvidence
      if (details.classicEvidenceCount > 1) {
        score += Math.min(details.classicEvidenceCount * 2, this.WEIGHTS.classicEvidenceCount)
      }
    } else {
      deductions.push('未引用经典原文（classicEvidence 为空）')
      suggestions.push('添加 classicEvidence[] 字段，引用至少一条古籍原文')
    }

    if (details.hasEvidence) {
      score += this.WEIGHTS.hasEvidence
    } else {
      deductions.push('未关联 Evidence')
      suggestions.push('添加 evidence 字段')
    }

    if (details.hasKnowledgeReference) tags_check: {
      // tags 中以 kg- 开头的视为有 KG 引用
      score += this.WEIGHTS.hasKnowledgeReference
    } else {
      deductions.push('未引用 KnowledgeGraph')
      suggestions.push('在 tags 中添加 kg- 前缀的知识图谱节点引用')
    }

    if (details.hasControversyNote) {
      score += this.WEIGHTS.hasControversyNote
    } else {
      deductions.push('未标注流派争议')
      suggestions.push('在 classicEvidence 中标注 hasControversy 字段')
    }

    if (details.hasConfidence) {
      score += this.WEIGHTS.hasConfidence
    } else {
      deductions.push('未输出可信度')
      suggestions.push('添加 confidence.components 字段')
    }

    if (details.hasTrace) {
      score += this.WEIGHTS.hasTrace
    } else {
      deductions.push('条件无 trace 追溯')
      suggestions.push('在 condition 中设置 traceable: true')
    }

    if (details.hasExplain) {
      score += this.WEIGHTS.hasExplain
    } else {
      deductions.push('无 explain() 方法')
      suggestions.push('使用 makeExplainable() 包装规则以获得 explain() 能力')
    }

    score = Math.min(score, this.MAX_SCORE)

    let level: ExplainScore['level']
    if (score >= 90) level = 'A'
    else if (score >= 80) level = 'B'
    else if (score >= 70) level = 'C'
    else if (score >= 60) level = 'D'
    else level = 'F'

    return {
      ruleId: rule.id,
      ruleName: rule.name ?? rule.id,
      score,
      level,
      details,
      deductions,
      suggestions,
    }
  }

  /** 批量评分 */
  scoreAll(rules: RuleDefinition[], explainableRuleIds?: Set<string>): ExplainScore[] {
    return rules.map(r => this.scoreRule(r, explainableRuleIds?.has(r.id)))
  }

  /**
   * 生成 Rule Health Report（最终汇总报告）
   * 汇总 C8-1~C8-6 全部 6 个维度
   */
  generateHealthReport(
    rules: RuleDefinition[],
    coverage: CoverageReport,
    conflicts: ConflictReport,
    dependencies: DependencyReport,
    performance: PerformanceReport,
    accuracy: AccuracyDashboard,
    explainScores: ExplainScore[],
  ): RuleHealthReport {
    const generatedAt = new Date().toISOString()

    // 可解释性汇总
    const avgScore = explainScores.length > 0
      ? explainScores.reduce((sum, s) => sum + s.score, 0) / explainScores.length
      : 0
    const levelCount = (level: string) => explainScores.filter(s => s.level === level).length
    const lowScoreRules = explainScores
      .filter(s => s.score < 60)
      .map(s => ({ ruleId: s.ruleId, ruleName: s.ruleName, score: s.score }))

    // 总体健康度计算（6 维加权）
    const healthScore = Math.round(
      coverage.coverageRate * 15 +        // 覆盖率 15%
      (1 - Math.min(conflicts.totalConflicts / 10, 1)) * 15 +  // 冲突 15%
      (dependencies.circularCount === 0 ? 15 : 0) +            // 依赖 15%
      (performance.avgDurationMs < 10 ? 15 : Math.max(0, 15 - performance.avgDurationMs)) + // 性能 15%
      accuracy.overallAccuracy * 25 +     // 准确率 25%
      (avgScore / 100) * 15                // 可解释性 15%
    )

    let overallHealthLevel: RuleHealthReport['overallHealthLevel']
    if (healthScore >= 90) overallHealthLevel = 'A'
    else if (healthScore >= 80) overallHealthLevel = 'B'
    else if (healthScore >= 70) overallHealthLevel = 'C'
    else if (healthScore >= 60) overallHealthLevel = 'D'
    else overallHealthLevel = 'F'

    // 关键问题
    const criticalIssues: string[] = []
    if (coverage.deadRules.length > 0) {
      criticalIssues.push(`存在 ${coverage.deadRules.length} 条 dead rules（永不命中）`)
    }
    if (conflicts.bySeverity['high'] > 0) {
      criticalIssues.push(`存在 ${conflicts.bySeverity['high']} 个高严重度冲突`)
    }
    if (dependencies.circularCount > 0) {
      criticalIssues.push(`存在 ${dependencies.circularCount} 个循环依赖`)
    }
    if (accuracy.overallAccuracy < 0.85) {
      criticalIssues.push(`总体准确率 ${((accuracy.overallAccuracy) * 100).toFixed(1)}% 低于 85% 阈值`)
    }
    if (lowScoreRules.length > 0) {
      criticalIssues.push(`存在 ${lowScoreRules.length} 条规则 Explain Score 低于 60 分`)
    }

    // 发布建议
    let releaseRecommendation: RuleHealthReport['releaseRecommendation']
    if (healthScore >= 80 && criticalIssues.filter(i => i.includes('循环依赖') || i.includes('高严重度冲突')).length === 0) {
      releaseRecommendation = healthScore >= 90 ? 'approve' : 'approve_with_warnings'
    } else {
      releaseRecommendation = 'reject'
    }

    return {
      generatedAt,
      version: '1.0.0',
      totalRules: rules.length,
      coverage: {
        coverageRate: coverage.coverageRate,
        uncoveredCasesCount: coverage.uncoveredCases.length,
        deadRulesCount: coverage.deadRules.length,
      },
      conflicts: {
        totalConflicts: conflicts.totalConflicts,
        highSeverityCount: conflicts.bySeverity['high'] ?? 0,
      },
      dependencies: {
        maxDepth: dependencies.maxDepth,
        circularCount: dependencies.circularDependencies.length,
        isolatedCount: dependencies.isolatedRules.length,
        topologicalOrderLength: dependencies.topologicalOrder.length,
      },
      performance: {
        avgDurationMs: performance.avgDurationMs,
        slowestRuleId: performance.slowestRules[0]?.ruleId,
        slowestDurationMs: performance.slowestRules[0]?.avgDurationMs,
        totalExecutions: performance.totalExecutions,
      },
      accuracy: {
        overallAccuracy: accuracy.overallAccuracy,
        classicMatchRate: accuracy.overallClassicMatchRate,
        evidenceCompletenessRate: accuracy.evidenceCompletenessRate,
        knowledgeReferenceRate: accuracy.knowledgeReferenceRate,
        sandboxPassRate: accuracy.sandboxPassRate,
      },
      explainability: {
        avgScore: Number(avgScore.toFixed(1)),
        aLevelCount: levelCount('A'),
        bLevelCount: levelCount('B'),
        cLevelCount: levelCount('C'),
        dLevelCount: levelCount('D'),
        fLevelCount: levelCount('F'),
        lowScoreRules,
      },
      overallHealthScore: healthScore,
      overallHealthLevel,
      criticalIssues,
      releaseRecommendation,
    }
  }
}
