/**
 * Sprint3-5 命理质量控制体系入口
 *
 * 负责注册 DecisionResult Post Processor，
 * 每次 EvidenceFusionEngine decide 完成后自动填充：
 *   - accuracyScore     (AccuracyCenter 三级准确率)
 *   - explainScore      (ExplainScore 6维度评分)
 *   - ruleBenchmark     (单命例 Rule 基准快照)
 *   - caseSimilarity    (与 CaseDatabase Top-N 相似度)
 *   - engineHealthDashboard (EngineDashboard 累计统计)
 *
 * 这样 AI 层只需要读取 DecisionResult，不需要再调用 quality 模块的逻辑。
 */

export * from './types'
export * from './accuracy'
export * from './caseDatabase'
export * from './explainAndClassic'
export * from './dashboard'

import { registerDecisionResultPostProcessor } from '../engines/fusion/evidenceFusionEngine'
import { globalAccuracyCenter } from './accuracy'
import { globalExplainScoreCalculator } from './explainAndClassic'
import { globalCaseSimilarityEngine } from './caseDatabase'
import { globalEngineDashboard } from './dashboard'
import type { SubEngineInput, SubEngineResult } from '../engines/types'
import type { DecisionResult } from '../engines/fusion/types'

/**
 * Quality Enricher: DecisionResult → 注入 V3 字段
 *
 * 每次 engine.decide() 后自动调用，
 * 计算 Accuracy/ExplainScore/RuleBenchmark/CaseSimilarity/Dashboard。
 */
function enrichDecisionResultV3(ctx: {
  result: DecisionResult
  input: SubEngineInput
  subResults: SubEngineResult[]
}): DecisionResult {
  const { result, input, subResults } = ctx

  // 1) AccuracyCenter 三级准确率
  const accuracyReport = globalAccuracyCenter.evaluate(result, subResults)
  result.accuracyScore = accuracyReport.decisionAccuracy
  // ruleBenchmark（单命例规则基准快照，只包含当前命例执行的规则）
  result.ruleBenchmark = buildSingleCaseRuleBenchmark(accuracyReport)

  // 2) ExplainScore（6 维度）
  if (result.explain) {
    result.explainScore = globalExplainScoreCalculator.score(result.explain, result)
  }

  // 3) CaseSimilarity（Top-5 历史命例匹配）
  try {
    result.caseSimilarity = globalCaseSimilarityEngine.findSimilar(input as any, result, 5)
  } catch {
    // Case DB 为空时忽略
  }

  // 4) EngineDashboard（累计运行统计）
  try {
    globalEngineDashboard.recordDecision(result)
    result.engineHealthDashboard = globalEngineDashboard.generateReport()
  } catch {
    // 忽略 Dashboard 错误
  }

  return result
}

/** 把 AccuracyReport 中的规则统计包装成 RuleBenchmarkReport（单命例） */
function buildSingleCaseRuleBenchmark(accuracyReport: ReturnType<typeof globalAccuracyCenter.evaluate>) {
  const entries = accuracyReport.ruleAccuracy
  return {
    entries: Object.fromEntries(
      Object.entries(entries).map(([id, ra]) => [
        id,
        {
          ruleId: id,
          executionCount: ra.runCount,
          hitCount: ra.hitCount,
          misjudgeCount: ra.misjudgeCount,
          hitRate: ra.hitRate,
          misjudgeRate: ra.misjudgeRate,
          conflictRate: 0,
          citationCount: 0,
          contributionRate: ra.contributionRate,
          killRate: 0,
          recommendation: (ra.hitRate >= 0.7 ? 'keep' : ra.hitRate <= 0.3 ? 'review' : 'demote') as any,
          reason: '',
        },
      ]),
    ),
    summary: {
      totalRules: Object.keys(entries).length,
      keepCount: 0, reviewCount: 0, demoteCount: 0, deprecateCount: 0,
      averageHitRate: 0, averageMisjudgeRate: 0,
    },
    generatedAt: Date.now(),
  }
}

// 模块加载时即注册（只要 import 了 quality/index.ts 就会生效）
registerDecisionResultPostProcessor(enrichDecisionResultV3)
