import { DivinationPluginImpl, type DivinationPluginConfig } from '@/lib/bazi/foundation/core/plugin/types'
import { globalCapabilityRegistry } from '@/lib/bazi/foundation/core/plugin/capability'
import { AdvancedPatternEngine } from './advancedPatternEngine'
import { PatternClassifier } from './classifier'
import { defaultGejuKnowledgeBase, type GejuKnowledgeEntry, type ClassicCitationFull } from './knowledge'
import { defaultPatternPriorityMatrix, type PatternPriorityMatrix } from './priority'
import { defaultPatternScorer, type PatternScoreResult } from './score'
import { defaultEvidenceBuilder, type StructuredEvidenceBuilder, type StructuredEvidenceReport } from './evidence'
import { defaultPatternExplainBuilder, type PatternExplainBuilder, type PatternExplainResult } from './explain'
import { defaultGejuCitationsDB, type GejuCitationsDB, type CitationEntry } from './citations'
import { defaultPatternRegressionRunner, type PatternRegressionRunner, type RegressionReport } from './regression'
import { defaultPatternBatchEngine, type PatternBatchEngine } from './batch'

export class BaziPatternPlugin extends DivinationPluginImpl {
  readonly id = 'bazi-pattern'
  readonly name = '八字·格局体系 P1.1'
  readonly version = '1.0.0'
  readonly type = 'bazi-extension'
  readonly description = '八字格局判定 10 大类 38 小类（P1.1.1 增强版：优先级矩阵/0-100评分/9类证据链/8部古籍/108命例/批量<5ms）'
  readonly buildNumber = '1.1.1'
  readonly p111Enhanced = true
  readonly dependencies = ['bazi']
  readonly divinationConfig: DivinationPluginConfig = {
    divinationType: 'bazi',
    divinationName: '八字·格局体系 P1.1（P1.1.1 增强版）',
    divinationDescription: '格局判定/优先级矩阵/0-100评分/9类证据链/8部古籍溯源/108命例回归/批量推演',
    supportsFeatures: [
      // 向后兼容：P1.0 简版命名
      '格局判定','格局分类','格局喜忌','格局古籍溯源','格局证据链',
      // P1.1.1 增强版详细
      '格局判定（10大类38小类）',
      '格局知识（成格/破格/假格/真格/转格条件）',
      '格局优先级矩阵（9大类）',
      '格局评分（0~100 7级判定）',
      '结构化证据链（月令/日主/天干/地支/藏干/通根/旺衰/调候/古籍）',
      '8 部古籍溯源（滴天髓/穷通宝鉴/子平真诠/三命通会/渊海子平/神峰通考/千里命稿/御定子平）',
      '格局解释（为什么此格/为什么不是其它/为什么舍弃）',
      '108 古例回归测试（smoke/standard/full）',
      '批量推演（<5ms 预算）',
    ],
    icon: '📐',
  }

  // Core 1.x
  public classifier: PatternClassifier | null = null
  public engine: AdvancedPatternEngine | null = null
  // New 1.1.1 add-ons
  public knowledge = defaultGejuKnowledgeBase
  public priority: PatternPriorityMatrix = defaultPatternPriorityMatrix
  public scorer = defaultPatternScorer
  public evidence: StructuredEvidenceBuilder = defaultEvidenceBuilder
  public explain: PatternExplainBuilder = defaultPatternExplainBuilder
  public citations: GejuCitationsDB = defaultGejuCitationsDB
  public regression: PatternRegressionRunner = defaultPatternRegressionRunner
  public batch: PatternBatchEngine = defaultPatternBatchEngine

  async initialize(): Promise<void> {
    await super.initialize()
    this.classifier = new PatternClassifier()
    this.engine = new AdvancedPatternEngine(this.classifier)
    globalCapabilityRegistry.register({
      pluginId: this.id,
      capabilities: ['bazi', 'knowledge', 'quality', 'rule', 'decision', 'case-db', 'classic-db', 'explain', 'regression', 'batch'],
      details: {
        bazi: { description: '八字格局体系 (10大类38小类)', version: this.version },
        knowledge: { description: '格局知识图谱：成格/破格/假格/真格/转格条件' },
        quality: { description: '格局判定质量控制' },
        decision: { description: 'PatternPriorityMatrix 冲突解决权重（仍经 Unified Decision Core 决策）' },
        'case-db': { description: '108 经典格局命例库' },
        'classic-db': { description: '8 部古籍 84 条引文数据库' },
        explain: { description: '为什么此格局/为什么不是其它/为什么舍弃 + Markdown 全文' },
        regression: { description: 'PatternRegressionRunner: smoke(15)/standard(60)/full(108)' },
        batch: { description: 'PatternBatchEngine: 批量 classify/evaluate + benchmark(<5ms)' },
      } as any,
    })
  }

  async destroy(): Promise<void> {
    globalCapabilityRegistry.unregister(this.id)
    this.classifier = null
    this.engine = null
    await super.destroy()
  }

  classify(input: any) { return this.classifier?.classify(input) }
  evaluate(input: any) { return this.engine?.evaluate(input) }

  /** Knowledge 快捷方式 */
  getKnowledge(name: string): GejuKnowledgeEntry | undefined { return this.knowledge.get(name as any) }
  getKnowledgeCitations(name: string): ClassicCitationFull[] { return this.knowledge.getCitations(name as any) ?? [] }
  getChengGe(name: string): string[] { return this.knowledge.getChengGeConditions(name as any) ?? [] }
  getPoGe(name: string): string[] { return this.knowledge.getPoGeConditions(name as any) ?? [] }

  /** Evidence 快捷方式 */
  buildEvidence(input: any, verdict: any, extra?: any): StructuredEvidenceReport | undefined {
    return this.evidence?.build(input, verdict, extra)
  }

  /** Score 快捷方式 */
  computeScore(verdict: any, signals: any): PatternScoreResult { return this.scorer.compute(verdict, signals) }

  /** Explain 快捷方式 */
  buildExplain(args: any): PatternExplainResult { return this.explain.build(args) }

  /** Citations 快捷方式 */
  citationsByGeju(gejuName: string): CitationEntry[] { return this.citations.byGeju(gejuName) }
  citations8Summary(): any { return this.citations.get8ClassicsSummary() }

  /** Regression 快捷方式 */
  async runRegression(opts?: any): Promise<RegressionReport> { return this.regression.run(opts) }

  /** Batch 快捷方式 */
  classifyBatch(inputs: any[]) { return this.batch.classifyBatch(inputs) }
  evaluateBatch(inputs: any[]) { return this.batch.evaluateBatch(inputs) }
  benchmark(n = 100): any { return this.batch.benchmark(n) }
}
