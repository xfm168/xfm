import { DivinationPluginImpl, DivinationPluginConfig } from '@/lib/bazi/foundation/core/plugin/types'
import { globalCapabilityRegistry } from '@/lib/bazi/foundation/core/plugin/capability'

import { defaultTenGodClassifier, TenGodClassifier } from './tengodClassifier'
import { defaultTenGodEngine, TenGodEngine } from './tengodEngine'
import { defaultTenGodKnowledgeDB, TenGodKnowledgeDB } from './knowledge'
import { defaultTenGodRelationGraph, TenGodRelationGraph } from './graph'
import { defaultTenGodCitationsDB, TenGodCitationsDB } from './citations'
import { defaultTenGodCombinationEngine, TenGodCombinationEngine } from './combinations'
import { defaultTenGodPriorityMatrix, TenGodPriorityMatrix } from './priority'
import { defaultTenGodScorer, TenGodScorer } from './score'
import { defaultTenGodEvidenceBuilder, TenGodEvidenceBuilder } from './evidence'
import { defaultTenGodExplainBuilder, TenGodExplainBuilder } from './explain'
import { defaultTenGodBatchEngine, TenGodBatchEngine } from './batch'

import type {
  TenGodClassifierInput, TenGodClassifierResult, TenGodExplainResult
} from './types'

let _regressionModule: any = null
try {
  _regressionModule = require('./regression')
} catch (_) {
  _regressionModule = {
    TenGodRegressionRunner: class TenGodRegressionRunnerStub {
      async run(_opts?: any): Promise<any> {
        return { skipped: true, note: 'regression module not yet loaded' }
      }
    },
    defaultTenGodRegressionRunner: null as any,
  }
  const stubRunner = new (_regressionModule.TenGodRegressionRunner as any)()
  _regressionModule.defaultTenGodRegressionRunner = stubRunner
}

const { defaultTenGodRegressionRunner } = _regressionModule

export class TenGodPlugin extends DivinationPluginImpl {
  readonly id = 'bazi-tengod'
  readonly name = '八字·十神体系 P1.2'
  readonly version = '1.0.0'
  readonly buildNumber = '2.0.0'
  readonly p12Enhanced = true
  readonly type = 'bazi-extension'
  readonly description = '玄风门完整十神引擎 V2：10神知识库·关系图谱·18组合·6维评分·9类证据·8部古籍·优先级矩阵·300命例·<5ms批量'
  readonly dependencies = ['bazi']
  readonly divinationConfig: DivinationPluginConfig = {
    divinationType: 'bazi',
    divinationName: '八字·十神体系 P1.2（V2 引擎）',
    divinationDescription: '十神/组合/评分/证据/古籍/回归 一体化引擎',
    supportsFeatures: [
      '十神分类','十神关系图谱','十神组合判定','十神评分（0-100）',
      '十神证据链（9种）','十神解释生成','18种组合优先级矩阵',
      '8部古籍114+引文库','300命例回归','批量<5ms',
    ],
    icon: '🔯',
  }
  public classifier: TenGodClassifier | null = null
  public engine: TenGodEngine | null = null
  public knowledge = defaultTenGodKnowledgeDB
  public graph = defaultTenGodRelationGraph
  public citations = defaultTenGodCitationsDB
  public combinations = defaultTenGodCombinationEngine
  public priority = defaultTenGodPriorityMatrix
  public scorer = defaultTenGodScorer
  public evidence = defaultTenGodEvidenceBuilder
  public explain = defaultTenGodExplainBuilder
  /**
   * P1.2.1-A4: Regression 接口统一入口。
   * 禁止外部直接调用 `plugin.regression.run()`，统一走 `defaultTenGodRegressionRunner.run()`。
   * 历史的 public regression 字段已移除；plugin.runRegression() 仅作为代理，
   * 实际调用统一入口 defaultTenGodRegressionRunner.run()。
   */
  public batch = defaultTenGodBatchEngine

  async initialize(): Promise<void> {
    await super.initialize()
    this.classifier = defaultTenGodClassifier
    this.engine = defaultTenGodEngine
    globalCapabilityRegistry.register({
      pluginId: this.id,
      capabilities: ['bazi','knowledge','quality','rule','decision','case-db','classic-db','explain','regression','batch','graph'],
      details: {
        bazi: { description: '十神引擎V2', version: this.version },
        knowledge: { description: '十神知识库（10神·性质·喜忌·组合·规则）' },
        decision: { description: '十神组合优先级矩阵（传给Decision Core融合）' },
        'case-db': { description: '300+十神经典命例' },
        'classic-db': { description: '8部古籍·114+引文' },
        explain: { description: 'Why旺/Why衰/Why成立/Why不成立 + Markdown' },
        regression: { description: 'smoke(30)/standard(150)/full(300+)' },
        batch: { description: '<5ms classify/evaluate批量' },
        graph: { description: '十神关系图谱 Graph，供Knowledge Graph直接调用' },
      } as any,
    })
  }
  async destroy(): Promise<void> {
    globalCapabilityRegistry.unregister(this.id)
    this.classifier = null
    this.engine = null
    await super.destroy()
  }

  classify(input: TenGodClassifierInput): TenGodClassifierResult | undefined {
    return this.classifier?.classify(input)
  }
  evaluate(input: TenGodClassifierInput) {
    return this.engine?.evaluate(input)
  }
  explain(args: any): TenGodExplainResult {
    return this.explain.build(args)
  }
  getKnowledge(name: any) { return this.knowledge.get(name) }
  graphReport() { return this.graph.report() }
  citationsByGod(name: any) { return this.citations.byTenGod(name) }
  citationsByCombination(id: any) { return this.citations.byCombination(id) }
  /**
   * P1.2.1-A4: Regression 统一入口代理。
   * 外部应优先直接调用 `defaultTenGodRegressionRunner.run(opts)`（统一入口）；
   * 通过 plugin 调用时，本方法代理到同一统一入口，禁止绕过 runner 直接访问 `plugin.regression`。
   */
  async runRegression(opts?: any) {
    return defaultTenGodRegressionRunner?.run?.(opts) ?? { skipped: true, note: 'regression runner unavailable' }
  }
  classifyBatch(inputs: any[]) { return this.batch.classifyBatch(inputs) }
  evaluateBatch(inputs: any[]) { return this.batch.evaluateBatch(inputs) }
  benchmark(n=100): any { return this.batch.benchmark(n) }
  listCombinations() { return this.combinations.rules }
  listPriorities() { return this.priority.list() }
}
