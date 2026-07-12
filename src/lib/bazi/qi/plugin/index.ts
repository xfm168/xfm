/**
 * XuanFeng Core Engine Plugin 统一导出
 *
 * 推演流水线（P5 Integration）：
 *   用户输入 → 排盘 → Kernel → ConsensusEngine → ShenShaFilterEngine →
 *   DynastySimulationEngine → ShiShenGraphEngine → EnergyFlowEngine →
 *   ConfidenceEngine → ExplainEvidenceEngine → MasterToneEngine → ExplainV4 → 最终大师报告
 *
 * P4 专业推演引擎（15个）+ P5 验证引擎（3个）+ 1 个 PipelineEngine
 */

// ─── 流水线引擎 ───
export { XuanFengPipelineEngine, runMasterAnalysis } from './pipelineEngine'
export type { PipelineInput, PipelineReport, PipelineStepResult, MasterReportSection } from './pipelineEngine'

// ─── 15 个专业推演引擎 ───
export { ConsensusEngine } from './consensusEngine'
export { DynastySimulationEngine } from './dynastySimulationEngine'
export { ShiShenGraphEngine } from './shiShenGraphEngine'
export { EnergyFlowEngine } from './energyFlowEngine'
export { ShenShaFilterEngine } from './shenShaFilterEngine'
export { ExplainV4Engine } from './explainV4'
export { CaseLearningEngine } from './caseLearningEngine'
export { ConfidenceEngine } from './confidenceEngine'
export { ExplainEvidenceEngine } from './explainEvidenceEngine'
export { MasterToneEngine } from './masterToneEngine'
export { AccuracyEngine } from './accuracyEngine'
export { BenchmarkEngine2 } from './benchmarkEngine2'
export { PerformanceOptEngine } from './performanceOptEngine'
export { I18nEngine } from './i18nEngine'
export { ReleaseEngine11 } from './releaseEngine11'

// ─── P5 验证引擎 ───
export { ValidationEngine } from './validationEngine'
export type { ValidationCase, DimensionAccuracy, ValidationReport } from './validationEngine'
export { ValidationPerfEngine } from './perfValidationEngine'
export type { PerfBenchmarkResult, PerfValidationReport } from './perfValidationEngine'
export { ReleaseReadinessEngine } from './releaseReadinessEngine'
export type { ReadinessCheckItem, ReleaseReadinessReport } from './releaseReadinessEngine'

// ─── P6 Score 三来源封装 ───
export type { RuleWeight, ConfidenceScore, EvidenceScore, ScoreSource, ScoreContainer } from './scoreTypes'
export { createRuleWeight, createConfidenceScore, createEvidenceScore, RULE_WEIGHT_FROZEN_FILES, RULE_WEIGHT_FREEZE_DECLARATION } from './scoreTypes'

// ─── P6-B Engine Contract ───
export type { IEngine, IAnalysisEngine, IRenderEngine, EngineLayer, EngineContract } from './engineContract'
export { ENGINE_CONTRACTS, GLOBAL_PROHIBITIONS, RENDER_LAYER_PROHIBITIONS, getEngineContract, validateEngineContract } from './engineContract'

// ─── P6-C Pipeline Cache ───
export {
  getMemoryCacheKey,
  getMemoryCachedReport,
  setMemoryCachedReport,
  getRuleCacheKey,
  getCachedRuleResult,
  setCachedRuleResult,
  getClassicCacheKey,
  getCachedClassic,
  setCachedClassic,
  getKnowledgeCacheKey,
  getCachedKnowledge,
  setCachedKnowledge,
  getExplainCacheKey,
  getCachedExplain,
  setCachedExplain,
  getCacheReport,
  clearAllCaches,
  evictExpired,
} from './pipelineCache'
export { runPipelineBenchmark } from './pipelineBenchmark'
