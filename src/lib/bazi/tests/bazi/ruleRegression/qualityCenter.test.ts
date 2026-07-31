import { describe, it, expect } from 'vitest'
import { CoverageAnalyzer, DependencyAnalyzer } from '../../../ruleEngine/quality'
import type { RuleDefinition } from '../../../ruleEngine/types'

// 构造测试规则
const testRules: RuleDefinition[] = [
  {
    id: 'R001', version: '1.0.0', priority: 100, source: '滴天髓',
    description: '规则A', condition: [{ description: '条件', type: 'required' }],
    result: '结论A', evidence: { rule: 'A', level: 'support', weight: 0.5, description: 'A' },
    confidence: { components: {} }, conflictStrategy: 'priority-then-vote',
    evaluate: () => ({ items: [] }),
    dependencies: [],
  },
  {
    id: 'R002', version: '1.0.0', priority: 80, source: '子平真诠',
    description: '规则B依赖A', condition: [{ description: '条件', type: 'required' }],
    result: '结论B', evidence: { rule: 'B', level: 'support', weight: 0.5, description: 'B' },
    confidence: { components: {} }, conflictStrategy: 'priority-then-vote',
    evaluate: () => ({ items: [] }),
    dependencies: ['R001'],
  },
  {
    id: 'R003', version: '1.0.0', priority: 60, source: '三命通会',
    description: '规则C依赖B', condition: [{ description: '条件', type: 'required' }],
    result: '结论C', evidence: { rule: 'C', level: 'support', weight: 0.5, description: 'C' },
    confidence: { components: {} }, conflictStrategy: 'priority-then-vote',
    evaluate: () => ({ items: [] }),
    dependencies: ['R002'],
  },
  {
    id: 'R004', version: '1.0.0', priority: 50, source: '渊海子平',
    description: '孤立规则', condition: [{ description: '条件', type: 'required' }],
    result: '结论D', evidence: { rule: 'D', level: 'support', weight: 0.5, description: 'D' },
    confidence: { components: {} }, conflictStrategy: 'priority-then-vote',
    evaluate: () => ({ items: [] }),
    dependencies: [],
  },
]

// 构造命中矩阵
const hitMatrix: Record<string, Record<string, boolean>> = {
  'case-001': { R001: true, R002: true, R003: true, R004: false },
  'case-002': { R001: true, R002: true, R003: false, R004: false },
  'case-003': { R001: false, R002: false, R003: false, R004: false }, // 未被任何规则命中
  'case-004': { R001: true, R002: false, R003: false, R004: false },
}

describe('C8-1 Rule Coverage（覆盖率分析）', () => {
  it('统计案例覆盖率', () => {
    const analyzer = new CoverageAnalyzer()
    const report = analyzer.analyze(testRules, ['case-001', 'case-002', 'case-003', 'case-004'], hitMatrix)
    
    expect(report.totalCases).toBe(4)
    expect(report.coveredCases).toBe(3) // case-001/002/004 被命中
    expect(report.uncoveredCases).toContain('case-003')
    expect(report.coverageRate).toBe(0.75)
  })

  it('检测 dead rules（永不命中的规则）', () => {
    const analyzer = new CoverageAnalyzer()
    const report = analyzer.analyze(testRules, ['case-001', 'case-002', 'case-003', 'case-004'], hitMatrix)
    
    // R004 在所有案例中都未命中
    const deadRule = report.deadRules.find(r => r.ruleId === 'R004')
    expect(deadRule).toBeDefined()
    expect(deadRule!.reason).toContain('未命中')
  })

  it('ruleHitCount 统计每条规则命中次数', () => {
    const analyzer = new CoverageAnalyzer()
    const report = analyzer.analyze(testRules, ['case-001', 'case-002', 'case-003', 'case-004'], hitMatrix)
    
    const r001 = report.ruleHitCount.find(r => r.ruleId === 'R001')
    expect(r001!.hitCount).toBe(3) // case-001/002/004
    expect(r001!.hitRate).toBe(0.75)
    
    const r004 = report.ruleHitCount.find(r => r.ruleId === 'R004')
    expect(r004!.hitCount).toBe(0)
  })
})

describe('C8-3 Rule Dependency（依赖分析）', () => {
  it('生成依赖图节点', () => {
    const analyzer = new DependencyAnalyzer()
    const report = analyzer.analyze(testRules)
    
    expect(report.nodes.length).toBe(4)
    // R002 依赖 R001
    const r002 = report.nodes.find(n => n.ruleId === 'R002')
    expect(r002!.dependencies).toContain('R001')
    // R001 被 R002 依赖
    const r001 = report.nodes.find(n => n.ruleId === 'R001')
    expect(r001!.dependents).toContain('R002')
  })

  it('检测孤立规则', () => {
    const analyzer = new DependencyAnalyzer()
    const report = analyzer.analyze(testRules)
    
    // R004 是孤立规则
    const isolated = report.isolatedRules.find(r => r.ruleId === 'R004')
    expect(isolated).toBeDefined()
    expect(report.stats.isolatedCount).toBe(1)
  })

  it('拓扑排序结果合法', () => {
    const analyzer = new DependencyAnalyzer()
    const report = analyzer.analyze(testRules)
    
    // R001 必须在 R002 之前
    const idx001 = report.topologicalOrder.indexOf('R001')
    const idx002 = report.topologicalOrder.indexOf('R002')
    const idx003 = report.topologicalOrder.indexOf('R003')
    expect(idx001).toBeLessThan(idx002)
    expect(idx002).toBeLessThan(idx003)
  })

  it('检测循环依赖', () => {
    const analyzer = new DependencyAnalyzer()
    // 构造循环依赖：R005 → R006 → R005
    const cyclicRules: RuleDefinition[] = [
      { ...testRules[0], id: 'R005', dependencies: ['R006'] },
      { ...testRules[1], id: 'R006', dependencies: ['R005'] },
    ]
    const report = analyzer.analyze(cyclicRules)
    
    expect(report.circularDependencies.length).toBeGreaterThan(0)
    expect(report.stats.circularCount).toBeGreaterThan(0)
  })

  it('计算最大依赖深度', () => {
    const analyzer = new DependencyAnalyzer()
    const report = analyzer.analyze(testRules)
    
    // R001(depth=1) → R002(depth=2) → R003(depth=3)
    expect(report.maxDepth).toBe(3)
  })
})

import { AccuracyDashboardAnalyzer, ExplainScoreAnalyzer } from '../../../ruleEngine/quality'
import type { ExplainScore, RuleHealthReport } from '../../../ruleEngine/quality/types'

describe('C8-5 Rule Accuracy Dashboard（准确率看板）', () => {
  it('按 category 统计准确率', () => {
    const analyzer = new AccuracyDashboardAnalyzer()
    const rules: RuleDefinition[] = [
      { ...testRules[0], id: 'A001', category: 'geju' },
      { ...testRules[1], id: 'A002', category: 'geju', dependencies: [] },
      { ...testRules[2], id: 'A003', category: 'xiyongshen', dependencies: [] },
    ]
    const valResults = [
      { ruleId: 'A001', accuracy: 0.9, classicMatched: true, evidenceComplete: true, knowledgeReferenced: true },
      { ruleId: 'A002', accuracy: 0.85, classicMatched: true, evidenceComplete: false, knowledgeReferenced: false },
      { ruleId: 'A003', accuracy: 0.95, classicMatched: true, evidenceComplete: true, knowledgeReferenced: true },
    ]
    const sbResults = [
      { ruleId: 'A001', passed: true },
      { ruleId: 'A002', passed: false },
      { ruleId: 'A003', passed: true },
    ]
    const dashboard = analyzer.analyze(rules, valResults, sbResults)
    
    expect(dashboard.totalRules).toBe(3)
    expect(dashboard.byCategory.length).toBe(2) // geju + xiyongshen
    
    const geju = dashboard.byCategory.find(c => c.category === 'geju')
    expect(geju!.totalRules).toBe(2)
    expect(geju!.accuracy).toBeCloseTo(0.875, 3) // (0.9+0.85)/2
    
    expect(dashboard.overallClassicMatchRate).toBeCloseTo(1.0, 1)
    expect(dashboard.sandboxPassRate).toBeCloseTo(0.6667, 3) // 2/3
  })
})

describe('C8-6 Rule Explain Score（可解释评分）', () => {
  it('完整规则评 A 级（≥90分）', () => {
    const analyzer = new ExplainScoreAnalyzer()
    const rule: RuleDefinition = {
      id: 'E001', version: '1.0.0', priority: 50, source: '滴天髓',
      name: '完整规则',
      description: '测试', condition: [{ description: '条件', type: 'required', traceable: true }],
      result: '结论', 
      evidence: { rule: '测试', level: 'support', weight: 0.5, description: '证据' },
      confidence: { components: { geju: 0.8 } },
      conflictStrategy: 'priority-then-vote',
      evaluate: () => ({ items: [] }),
      classicEvidence: [
        { classicName: '滴天髓', quotedText: '原文', supports: '结论', citation: 'direct', hasControversy: true, controversyNote: '争议' },
        { classicName: '子平真诠', quotedText: '原文2', supports: '结论', citation: 'direct' },
      ],
      tags: ['kg-tg-jia'],
    }
    const score = analyzer.scoreRule(rule, true) // hasExplain=true
    expect(score.score).toBeGreaterThanOrEqual(90)
    expect(score.level).toBe('A')
    expect(score.details.hasClassicEvidence).toBe(true)
    expect(score.details.classicEvidenceCount).toBe(2)
    expect(score.details.hasControversyNote).toBe(true)
    expect(score.details.hasExplain).toBe(true)
  })

  it('不完整规则评低分（<60 F 级）', () => {
    const analyzer = new ExplainScoreAnalyzer()
    const rule: RuleDefinition = {
      id: 'E002', version: '1.0.0', priority: 50, source: '无',
      description: '不完整规则', condition: [{ description: '条件', type: 'required' }],
      result: '结论', 
      evidence: { rule: '测试', level: 'support', weight: 0.5, description: '证据' },
      confidence: { components: {} },
      conflictStrategy: 'priority-then-vote',
      evaluate: () => ({ items: [] }),
    }
    const score = analyzer.scoreRule(rule, false)
    expect(score.score).toBeLessThan(60)
    expect(score.level).toBe('F')
    expect(score.deductions.length).toBeGreaterThan(0)
    expect(score.suggestions.length).toBeGreaterThan(0)
  })

  it('Rule Health Report 汇总 6 维度', () => {
    const analyzer = new ExplainScoreAnalyzer()
    const rules: RuleDefinition[] = [
      { ...testRules[0], id: 'H001', category: 'geju' },
    ]
    
    // 构造 6 维度报告
    const coverage: any = { coverageRate: 0.9, uncoveredCases: ['case-x'], deadRules: [], totalCases: 10, totalRules: 1, coveredCases: 9, ruleHitCount: [], uncoveredCases_count: 1 }
    const conflicts: any = { totalConflicts: 0, bySeverity: { high: 0 }, byType: {}, conflicts: [] }
    const dependencies: any = { maxDepth: 1, circularDependencies: [], isolatedRules: [], topologicalOrder: ['H001'], stats: { totalNodes: 1, totalEdges: 0, isolatedCount: 0, circularCount: 0 }, nodes: [] }
    const performance: any = { avgDurationMs: 2.0, slowestRules: [{ ruleId: 'H001', avgDurationMs: 2.0 }], totalExecutions: 10, fastestRules: [], allStats: [], totalRules: 1, thresholdSuggestion: { timeoutMs: 10, totalTimeoutMs: 100 } }
    const accuracy: any = { overallAccuracy: 0.9, overallClassicMatchRate: 1.0, evidenceCompletenessRate: 0.9, knowledgeReferenceRate: 0.8, sandboxPassRate: 1.0, byCategory: [], totalRules: 1 }
    const explainScores = [analyzer.scoreRule(rules[0])]
    
    const healthReport = analyzer.generateHealthReport(rules, coverage, conflicts, dependencies, performance, accuracy, explainScores)
    
    expect(healthReport.totalRules).toBe(1)
    expect(healthReport.overallHealthScore).toBeGreaterThan(0)
    expect(['approve', 'approve_with_warnings', 'reject']).toContain(healthReport.releaseRecommendation)
  })
})

import { ConflictAnalyzer, PerformanceAnalyzer } from '../../../ruleEngine/quality'
import type { ConflictReport, PerformanceReport } from '../../../ruleEngine/quality/types'

// 构造冲突测试数据
const conflictRules: RuleDefinition[] = [
  { ...testRules[0], id: 'C001', category: 'geju', result: '格局成立', priority: 100 },
  { ...testRules[1], id: 'C002', category: 'geju', result: '格局不成立', priority: 80, dependencies: [] },
  { ...testRules[2], id: 'C003', category: 'geju', result: '格局成立', priority: 60, dependencies: [] },
  { ...testRules[3], id: 'C004', category: 'xiyongshen', result: '用神为火', priority: 50, dependencies: [] },
]

const conflictHitMatrix: Record<string, Record<string, boolean>> = {
  'case-001': { C001: true, C002: true, C003: true, C004: false },
  'case-002': { C001: true, C002: true, C003: false, C004: true },
  'case-003': { C001: false, C002: false, C003: true, C004: true },
}

describe('C8-2 Rule Conflict（冲突检测）', () => {
  it('检测同 category 同时命中（concurrent）', () => {
    const analyzer = new ConflictAnalyzer()
    const report = analyzer.analyze(conflictRules, conflictHitMatrix)

    const concurrent = report.conflicts.filter(c => c.type === 'concurrent')
    expect(concurrent.length).toBeGreaterThan(0)
    // C001 和 C003 在 case-001 中同时命中（同为 geju category）
    const c001_003 = report.conflicts.find(c => c.ruleIds.includes('C001') && c.ruleIds.includes('C003'))
    expect(c001_003).toBeDefined()
  })

  it('检测互相否定（contradictory）', () => {
    const analyzer = new ConflictAnalyzer()
    const report = analyzer.analyze(conflictRules, conflictHitMatrix)

    // C001(格局成立) 和 C002(格局不成立) 互相否定
    const contradictory = report.conflicts.filter(c => c.type === 'contradictory')
    expect(contradictory.length).toBeGreaterThan(0)
    const c001_002 = contradictory.find(c => c.ruleIds.includes('C001') && c.ruleIds.includes('C002'))
    expect(c001_002).toBeDefined()
    expect(c001_002!.severity).toBe('high')
  })

  it('按类型和严重程度统计', () => {
    const analyzer = new ConflictAnalyzer()
    const report = analyzer.analyze(conflictRules, conflictHitMatrix)

    expect(report.totalConflicts).toBeGreaterThan(0)
    expect(Object.keys(report.byType).length).toBeGreaterThan(0)
    expect(Object.keys(report.bySeverity).length).toBeGreaterThan(0)
  })
})

describe('C8-4 Rule Performance（性能分析）', () => {
  it('记录和统计执行耗时', () => {
    const analyzer = new PerformanceAnalyzer()
    // 模拟执行记录
    analyzer.recordExecution('P001', 1.5, true)
    analyzer.recordExecution('P001', 2.0, true)
    analyzer.recordExecution('P001', 1.0, false)
    analyzer.recordExecution('P002', 5.0, true)
    analyzer.recordExecution('P002', 6.0, false)
    analyzer.recordExecution('P003', 0.5, true)

    const report = analyzer.generateReport([
      { ...testRules[0], id: 'P001', name: '规则P1' },
      { ...testRules[1], id: 'P002', name: '规则P2', dependencies: [] },
      { ...testRules[2], id: 'P003', name: '规则P3', dependencies: [] },
    ])

    expect(report.totalRules).toBe(3)
    expect(report.totalExecutions).toBe(6)

    const p001 = report.allStats.find(s => s.ruleId === 'P001')
    expect(p001!.avgDurationMs).toBeCloseTo(1.5, 1) // (1.5+2.0+1.0)/3 ≈ 1.5
    expect(p001!.hitCount).toBe(2) // 2 hit, 1 miss
    expect(p001!.hitRate).toBeCloseTo(0.6667, 3)
  })

  it('最慢规则排在 slowestRules 前列', () => {
    const analyzer = new PerformanceAnalyzer()
    analyzer.recordExecution('S001', 10.0, true)
    analyzer.recordExecution('S002', 1.0, true)
    analyzer.recordExecution('S003', 0.5, true)

    const report = analyzer.generateReport([
      { ...testRules[0], id: 'S001', name: '慢规则' },
      { ...testRules[1], id: 'S002', name: '中规则', dependencies: [] },
      { ...testRules[2], id: 'S003', name: '快规则', dependencies: [] },
    ])

    expect(report.slowestRules[0].ruleId).toBe('S001')
    expect(report.fastestRules[0].ruleId).toBe('S003')
  })

  it('阈值建议合理', () => {
    const analyzer = new PerformanceAnalyzer()
    analyzer.recordExecution('T001', 1.0, true)
    analyzer.recordExecution('T001', 2.0, true)
    analyzer.recordExecution('T001', 3.0, true)
    analyzer.recordExecution('T001', 4.0, true)
    analyzer.recordExecution('T001', 5.0, true)

    const report = analyzer.generateReport([
      { ...testRules[0], id: 'T001', name: '阈值测试' },
    ])

    expect(report.thresholdSuggestion.timeoutMs).toBeGreaterThan(0)
    expect(report.thresholdSuggestion.totalTimeoutMs).toBeGreaterThan(0)
  })
})
