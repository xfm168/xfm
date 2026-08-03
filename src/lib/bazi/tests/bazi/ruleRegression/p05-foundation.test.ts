/**
 * P0-5 Foundation Layer 端到端验收测试
 *
 * 验证 XuanFeng Core OS 十大部分完整闭环：
 *  ① RuleDSL         — 声明式规则描述语言
 *  ② ClassicKG        — 古籍知识图谱
 *  ③ RuleGraph        — 规则依赖图
 *  ④ VersionManager   — 规则版本管理
 *  ⑤ ReviewCenter     — 知识审核系统
 *  ⑥ KnowledgeBenchmark — 知识基准
 *  ⑦ AI Assistant     — AI 助手框架
 *  ⑧ StandardDB       — 数据库标准化
 *  ⑨ API Contracts    — API 标准
 *  ⑩ Architecture     — 六层架构
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Part 1: RuleDSL
  parseDSLRule, serializeToDSL, loadDSLRules, validateDSLRule,
  evaluateConditionGroup,
  type RuleDSLDefinition,
  // Part 2: ClassicKG
  globalClassicKG,
  // Part 3: RuleGraph
  globalRuleGraph,
  // Part 4: VersionManager
  globalVersionManager,
  // Part 5: ReviewCenter
  globalReviewCenter,
  // Part 6: KnowledgeBenchmark
  globalKnowledgeBenchmark,
  // Part 7: AI Assistant
  globalAIContextBuilder, globalPromptBuilder,
  // Part 8: StandardDB
  globalDBManager,
  // Part 9: API
  ALL_API_CONTRACTS, getAPIContract,
  // Part 10: Architecture
  checkArchitectureStatus, ARCHITECTURE_CONFIG, getLayerDependencyGraph,
  FOUNDATION_VERSION,
} from '../../../xiyongshen/../../bazi/foundation'
import type { SubEngineInput } from '../../../xiyongshen/engines/types'
import {
  EvidenceFusionDecisionEngine,
  getSchoolProfile,
} from '../../../xiyongshen/engines/fusion'

// 测试用 DSL 规则
const TEST_DSL_RULE: RuleDSLDefinition = {
  id: 'BALANCE-STRONG-001',
  name: '身强宜泄',
  version: '1.0.0',
  source: ['子平真诠'],
  priority: 80,
  category: 'fuyi',
  description: '日主身强（dayStrength >= 2），宜用食伤泄秀',
  conditions: {
    logic: 'and',
    conditions: [
      { field: 'dayStrength', operator: '>=', value: 2, description: '日主身强' },
    ],
  },
  support: [
    { wuxing: '火', score: 2, reason: '食伤泄秀' },
    { wuxing: '土', score: 1, reason: '财星耗身' },
  ],
  oppose: [
    { wuxing: '木', score: 2, reason: '比劫助身' },
  ],
  result: '身强宜泄耗，用食伤生财',
  confidence: { components: { xiyongshen: 0.8 }, note: '子平真诠·论用神' },
  dependencies: [],
  conflictStrategy: 'priority-then-vote',
  classicEvidence: [{
    classicName: '子平真诠',
    chapter: '论用神',
    quotedText: '身强则宜泄之耗之，身弱则宜生之扶之',
    supports: '身强宜泄',
  }],
  tags: ['fuyi', 'balance'],
  author: '系统',
  reviewer: '架构师',
}

// 测试命局
const TEST_INPUT: SubEngineInput = {
  dayGan: '甲', dayGanWuxing: '木', monthZhi: '酉', monthZhiWuxing: '金',
  fourPillars: [
    { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
    { gan: '癸', zhi: '酉', ganWx: '水', zhiWx: '金' },
    { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
    { gan: '丙', zhi: '寅', ganWx: '火', zhiWx: '木' },
  ],
  count: { '木': 5, '火': 1, '土': 0, '金': 1, '水': 1 },
  dayStrength: 2, dayRootCount: 3,
  isWinterBorn: false, isSummerBorn: false,
  seasonTag: 'autumn',
  totalElementCount: 8,
  isDayStemSupport: true,
} as any

describe('P0-5 Foundation Layer 端到端验收', () => {

  describe('阶段① RuleDSL 声明式规则描述语言', () => {
    it('validateDSLRule → 格式校验通过', () => {
      const { valid, errors } = validateDSLRule(TEST_DSL_RULE)
      expect(valid).toBe(true)
      expect(errors.length).toBe(0)
    })

    it('parseDSLRule → 声明式规则转为可执行 RuleDefinition', () => {
      const rule = parseDSLRule(TEST_DSL_RULE)
      expect(rule.id).toBe(TEST_DSL_RULE.id)
      expect(rule.name).toBe(TEST_DSL_RULE.name)
      expect(rule.version).toBe(TEST_DSL_RULE.version)
      expect(rule.priority).toBe(TEST_DSL_RULE.priority)
      expect(rule.source).toEqual(TEST_DSL_RULE.source)
      expect(rule.evaluate).toBeDefined()
      expect(typeof rule.evaluate).toBe('function')
    })

    it('evaluate → 运行时评估命局条件', () => {
      const rule = parseDSLRule(TEST_DSL_RULE)
      const result = rule.evaluate(TEST_INPUT)
      expect(result.items.length).toBeGreaterThan(0)
      expect(result.conclusion).toBe('satisfied') // dayStrength=2 >= 2
    })

    it('serializeToDSL → RuleDefinition 序列化回 DSL 格式', () => {
      const rule = parseDSLRule(TEST_DSL_RULE)
      const dsl = serializeToDSL(rule)
      expect(dsl.id).toBe(TEST_DSL_RULE.id)
      expect(dsl.name).toBe(TEST_DSL_RULE.name)
      expect(dsl.source).toEqual(TEST_DSL_RULE.source)
    })

    it('loadDSLRules → 批量加载 DSL 规则', () => {
      const rules = loadDSLRules([TEST_DSL_RULE, {
        ...TEST_DSL_RULE,
        id: 'BALANCE-STRONG-002',
        name: '身弱宜扶',
        conditions: { logic: 'and', conditions: [{ field: 'dayStrength', operator: '<=', value: -1 }] },
      }])
      expect(rules.length).toBe(2)
      expect(rules[0].id).toBe('BALANCE-STRONG-001')
      expect(rules[1].id).toBe('BALANCE-STRONG-002')
    })

    it('evaluateConditionGroup → 条件不满足时返回 false', () => {
      // dayStrength=-2 >= 2 → false
      const falseResult = evaluateConditionGroup(
        { dayStrength: -2 },
        { logic: 'and', conditions: [{ field: 'dayStrength', operator: '>=', value: 2 }] },
      )
      expect(falseResult).toBe(false)
      // dayStrength=3 >= 2 → true
      const trueResult = evaluateConditionGroup(
        { dayStrength: 3 },
        { logic: 'and', conditions: [{ field: 'dayStrength', operator: '>=', value: 2 }] },
      )
      expect(trueResult).toBe(true)
    })
  })

  describe('阶段② Classical Knowledge Graph 古籍知识图谱', () => {
    it('种子数据 → 36+ 节点 + 80+ 边', () => {
      const stats = globalClassicKG.getStats()
      expect(stats.totalNodes).toBeGreaterThanOrEqual(30)
      expect(stats.totalEdges).toBeGreaterThanOrEqual(40)
    })

    it('queryByClassic → 按经典名查询知识链', () => {
      const dts = globalClassicKG.queryByClassic('滴天髓')
      expect(dts).toBeTruthy()
      expect(dts.explains.length + dts.supports.length + dts.contradicts.length + dts.citedBy.length).toBeGreaterThan(0)
      const qt = globalClassicKG.queryByClassic('穷通宝鉴')
      expect(qt).toBeTruthy()
    })

    it('queryByConcept → 按概念查询', () => {
      const fuyi = globalClassicKG.queryByConcept('扶抑')
      expect(fuyi).toBeTruthy()
      expect(fuyi.explainedBy.length + fuyi.supportedBy.length + fuyi.leadsTo.length + fuyi.dependsOn.length).toBeGreaterThanOrEqual(0)
    })

    it('getClassicSupport → 按五行查询经典支持', () => {
      const huo = globalClassicKG.getClassicSupport('火')
      expect(huo).toBeTruthy()
    })
  })

  describe('阶段③ Rule Dependency 规则依赖图', () => {
    it('addRule + topologicalSort → 规则按依赖排序', () => {
      globalRuleGraph.clear()
      globalRuleGraph.addRule(TEST_DSL_RULE)
      globalRuleGraph.addRule({
        ...TEST_DSL_RULE,
        id: 'GEJU-TEST-001',
        name: '格局测试',
        dependencies: ['BALANCE-STRONG-001'],
      })
      const order = globalRuleGraph.topologicalSort()
      expect(order.length).toBe(2)
      // BALANCE-STRONG-001 应该在 GEJU-TEST-001 之前
      expect(order.indexOf('BALANCE-STRONG-001')).toBeLessThan(order.indexOf('GEJU-TEST-001'))
    })

    it('detectCycles → 无循环依赖', () => {
      const cycles = globalRuleGraph.detectCycles()
      expect(cycles.length).toBe(0)
    })

    it('toReport → 生成依赖图报告', () => {
      const report = globalRuleGraph.toReport()
      expect(report.nodes.length).toBeGreaterThan(0)
      expect(report.topologicalOrder.length).toBeGreaterThan(0)
    })
  })

  describe('阶段④ Rule Version 规则版本管理', () => {
    it('registerVersion → 注册版本快照', () => {
      const result = globalVersionManager.registerVersion('BALANCE-STRONG-001', TEST_DSL_RULE)
      expect(result.ruleId).toBe('BALANCE-STRONG-001')
      expect(result.currentVersion).toBe('1.0.0')
    })

    it('getLatestVersion → 获取最新版本号', () => {
      const ver = globalVersionManager.getLatestVersion('BALANCE-STRONG-001')
      expect(ver).toBe('1.0.0')
    })

    it('recordModification + getVersionHistory → 修改历史', () => {
      globalVersionManager.registerVersion('TEST-VER-001', TEST_DSL_RULE)
      globalVersionManager.recordModification('TEST-VER-001', {
        action: 'update',
        operator: '测试',
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        summary: '测试修改',
      })
      const history = globalVersionManager.getVersionHistory('TEST-VER-001')
      expect(history.length).toBeGreaterThan(0)
    })

    it('recordAccuracy + getAccuracyTrend → 准确率趋势', () => {
      globalVersionManager.recordAccuracy('TEST-VER-001', {
        sampleSize: 100,
        hitRate: 0.85,
        misjudgeRate: 0.1,
        accuracyScore: 0.82,
        ruleVersion: '1.0.0',
      })
      const trend = globalVersionManager.getAccuracyTrend('TEST-VER-001')
      expect(trend).toBeTruthy()
    })
  })

  describe('阶段⑤ ReviewCenter 知识审核系统', () => {
    it('review → 五维审核 + 审批结果', () => {
      const report = globalReviewCenter.review(TEST_DSL_RULE, {
        sampleAccuracyScore: 0.8,
      })
      expect(report.dimensions.length).toBe(5) // classic/accuracy/conflict/explain/quality
      expect(['passed', 'failed', 'warning']).toContain(report.overallStatus)
      expect(report.totalScore).toBeGreaterThanOrEqual(0)
      expect(report.totalScore).toBeLessThanOrEqual(100)
      expect(typeof report.approved).toBe('boolean')
    })

    it('审核维度包含 classic/accuracy/conflict/explain/quality', () => {
      const report = globalReviewCenter.review(TEST_DSL_RULE)
      const dims = report.dimensions.map(d => d.dimension)
      expect(dims).toContain('classic')
      expect(dims).toContain('accuracy')
      expect(dims).toContain('conflict')
      expect(dims).toContain('explain')
      expect(dims).toContain('quality')
    })
  })

  describe('阶段⑥ Knowledge Benchmark 知识基准', () => {
    it('assess → 稳定性评估 + 建议操作', () => {
      const bench = globalKnowledgeBenchmark.assess(TEST_DSL_RULE, { hitRate: 0.85 })
      expect(['stable', 'experimental', 'deprecated']).toContain(bench.stability)
      expect(bench.classicConformance).toBeGreaterThanOrEqual(0)
      expect(bench.classicConformance).toBeLessThanOrEqual(1)
      expect(['keep', 'review', 'demote', 'deprecate']).toContain(bench.recommendation)
    })

    it('getStableRules → 返回稳定规则列表', () => {
      globalKnowledgeBenchmark.assess(TEST_DSL_RULE, { hitRate: 0.9 })
      const stable = globalKnowledgeBenchmark.getStableRules()
      expect(Array.isArray(stable)).toBe(true)
    })
  })

  describe('阶段⑦ AI Assistant Framework', () => {
    it('AIContextBuilder → 从 DecisionResult 构建六层上下文', () => {
      const engine = new EvidenceFusionDecisionEngine(getSchoolProfile('modern'))
      const result = engine.decide(TEST_INPUT)
      const ctx = globalAIContextBuilder.build(result)
      expect(ctx.layers.length).toBeGreaterThanOrEqual(4)
      expect(ctx.fullContext.length).toBeGreaterThan(100)
      expect(ctx.estimatedTokens).toBeGreaterThan(0)
    })

    it('PromptBuilder → 生成 AI Prompt', () => {
      const engine = new EvidenceFusionDecisionEngine(getSchoolProfile('modern'))
      const result = engine.decide(TEST_INPUT)
      const ctx = globalAIContextBuilder.build(result)
      const prompt = globalPromptBuilder.build('bazi_full_analysis', ctx)
      expect(prompt.systemMessage.length).toBeGreaterThan(10)
      expect(prompt.userMessage.length).toBeGreaterThan(50)
      expect(prompt.templateType).toBe('bazi_full_analysis')
    })

    it('PromptBuilder → 支持多种模板', () => {
      const templates = globalPromptBuilder.listTemplates()
      expect(templates.length).toBeGreaterThanOrEqual(6)
      expect(templates).toContain('bazi_full_analysis')
      expect(templates).toContain('xiyongshen_explain')
    })
  })

  describe('阶段⑧ StandardDB 数据库标准化', () => {
    it('六大数据库全部可用', () => {
      expect(globalDBManager.classicDB).toBeTruthy()
      expect(globalDBManager.ruleDB).toBeTruthy()
      expect(globalDBManager.caseDB).toBeTruthy()
      expect(globalDBManager.schoolDB).toBeTruthy()
      expect(globalDBManager.engineDB).toBeTruthy()
      expect(globalDBManager.explainDB).toBeTruthy()
    })

    it('RuleDB → 插入 + 查询', () => {
      globalDBManager.ruleDB.insert(TEST_DSL_RULE)
      const rule = globalDBManager.ruleDB.getById(TEST_DSL_RULE.id)
      expect(rule).toBeTruthy()
      expect(rule!.id).toBe(TEST_DSL_RULE.id)
      const byCat = globalDBManager.ruleDB.listByCategory('fuyi')
      expect(byCat.length).toBeGreaterThan(0)
    })

    it('getAllStats → 全库统计', () => {
      const stats = globalDBManager.getAllStats()
      expect(Object.keys(stats).length).toBe(6)
      expect(stats.rule.total).toBeGreaterThan(0)
    })
  })

  describe('阶段⑨ API 标准合约', () => {
    it('6 个 API 合约全部定义', () => {
      expect(ALL_API_CONTRACTS.length).toBe(6)
      const names = ALL_API_CONTRACTS.map(c => c.name)
      expect(names).toContain('Decision API')
      expect(names).toContain('Rule API')
      expect(names).toContain('Case API')
      expect(names).toContain('Classic API')
      expect(names).toContain('Explain API')
      expect(names).toContain('Quality API')
    })

    it('每个合约至少 3 个端点', () => {
      for (const contract of ALL_API_CONTRACTS) {
        expect(contract.endpoints.length).toBeGreaterThanOrEqual(3)
        for (const ep of contract.endpoints) {
          expect(ep.path).toBeTruthy()
          expect(ep.method).toBeTruthy()
          expect(ep.description).toBeTruthy()
        }
      }
    })

    it('getAPIContract → 按名称查询', () => {
      const decision = getAPIContract('Decision API')
      expect(decision).toBeTruthy()
      expect(decision!.basePath).toBe('/api/v5/decision')
    })
  })

  describe('阶段⑩ 六层架构整合', () => {
    it('ARCHITECTURE_CONFIG → 7 层全部启用', () => {
      const layers = Object.keys(ARCHITECTURE_CONFIG.layers)
      expect(layers.length).toBe(7)
      expect(layers).toContain('core')
      expect(layers).toContain('knowledge')
      expect(layers).toContain('engine')
      expect(layers).toContain('decision')
      expect(layers).toContain('quality')
      expect(layers).toContain('ai')
      expect(layers).toContain('application')
      for (const layer of layers) {
        expect(ARCHITECTURE_CONFIG.layers[layer as keyof typeof ARCHITECTURE_CONFIG.layers].enabled).toBe(true)
      }
    })

    it('checkArchitectureStatus → 架构健康', () => {
      const status = checkArchitectureStatus()
      expect(status.version).toBe(FOUNDATION_VERSION)
      expect(status.totalLayers).toBe(7)
      expect(status.enabledLayers).toBe(7)
      expect(status.healthy).toBe(true)
      expect(status.issues.length).toBe(0)
    })

    it('getLayerDependencyGraph → 依赖关系图', () => {
      const graph = getLayerDependencyGraph()
      expect(graph.nodes.length).toBe(7)
      expect(graph.edges.length).toBeGreaterThan(5)
      // core → knowledge, core → engine
      expect(graph.edges.some(e => e.from === 'core' && e.to === 'knowledge')).toBe(true)
      expect(graph.edges.some(e => e.from === 'core' && e.to === 'engine')).toBe(true)
      // engine → decision
      expect(graph.edges.some(e => e.from === 'engine' && e.to === 'decision')).toBe(true)
      // decision → quality, decision → ai
      expect(graph.edges.some(e => e.from === 'decision' && e.to === 'quality')).toBe(true)
      expect(graph.edges.some(e => e.from === 'decision' && e.to === 'ai')).toBe(true)
    })
  })

  describe('端到端：RuleDSL → Decision → AI 全流程', () => {
    it('DSL 规则 → 解析 → 注册 → 版本管理 → 审核 → 基准 → AI 上下文', () => {
      // 1. DSL 解析
      const rule = parseDSLRule(TEST_DSL_RULE)
      expect(rule.evaluate).toBeDefined()

      // 2. 版本管理
      globalVersionManager.registerVersion(TEST_DSL_RULE.id, TEST_DSL_RULE)

      // 3. 审核（传入 DSL 定义）
      const review = globalReviewCenter.review(TEST_DSL_RULE, { sampleAccuracyScore: 0.8 })
      expect(review.dimensions.length).toBe(5)

      // 4. 基准
      const bench = globalKnowledgeBenchmark.assess(TEST_DSL_RULE, { hitRate: 0.85 })
      expect(bench.stability).toBeTruthy()

      // 5. 推演
      const engine = new EvidenceFusionDecisionEngine(getSchoolProfile('modern'))
      const result = engine.decide(TEST_INPUT)
      expect(result.primaryYongShen).toBeTruthy()

      // 6. AI 上下文
      const ctx = globalAIContextBuilder.build(result)
      expect(ctx.layers.length).toBeGreaterThan(0)

      // 7. AI Prompt
      const prompt = globalPromptBuilder.build('xiyongshen_explain', ctx)
      expect(prompt.systemMessage.length).toBeGreaterThan(0)
      expect(prompt.userMessage.length).toBeGreaterThan(0)
    })

    it('架构状态 → 可序列化', () => {
      const status = checkArchitectureStatus()
      const json = JSON.stringify(status)
      expect(json.length).toBeGreaterThan(100)
      const revived = JSON.parse(json)
      expect(revived.totalLayers).toBe(7)
      expect(revived.healthy).toBe(true)
    })
  })
})
