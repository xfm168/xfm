/**
 * QiEngine V4 统一导出（最终版）
 */

export type {
  QiNode, QiPillar, QiSource, QiState, QiModifierName, QiActionName,
  QiHistory, QiOperation,
  HeHuaCommand, QiDeduction, QiAddition, ConflictCommand,
  QiContext, QiDiffEntry, QiSnapshot,
  QiMetadata, QiPipelineContext,
  PipelineStep, ValidationIssue,
  QiEventType, QiEvent,
  QiEngineResult,
  SeasonStatus, SeasonCommand,
  HuaType,
} from './types'

export { buildQiNodes, resetBuilderSequence, getGlobalSeq } from './builder'
export { detectSeasonOperations } from './modifier'
export { QiExecutor, executeOperations, resetSequence, resetVersion, setSequence } from './executor'
export { aggregateElements, aggregateByPillar, aggregateBySource, takeSnapshot, computeDiff, computeSnapshotHash, resetSnapshotSequence } from './aggregator'
export { QiPipeline } from './pipeline'
export { QiEventBus } from './events'
export { validateStep } from './validator'
export { runQiEngine } from './engine'

// P1 Detectors & Transformer
export { detectConflicts, isChong, isXing, isHai, isPo } from './detector/conflictDetector'
export { detectHeHua, getTianGanHeElement, getDiZhiHeElement } from './detector/heHuaDetector'
export { transformHeHua, transformConflict, transformAll } from './detector/qiTransformer'
export { createP1Steps } from './detector/pipelineSteps'
export { runP1Engine } from './runP1Engine'

// P1 Final Optimizations
export { analyzeSeasonCommand, detectSeasonCommands } from './detector/seasonCommander'
export { transformSeasonCommands } from './detector/seasonTransformer'
// evaluateCompetition 已迁移到 reasoning/competitionEngine（全系统统一入口）

// P2-0 Reasoning Engine
export { runP20Engine } from './runP20Engine'
export type { P20EngineResult } from './runP20Engine'

// StateTree
export {
  createReasoningContext, advancePhase, getStateAtPhase, comparePhases,
  logDecisionNode, logDecision, rollbackToPhase, diffContexts, mergeExplains,
  emitReasoningEvent, summarizeEventTimeline,
  createCheckpoint, restoreCheckpoint, listCheckpoints,
  resetEventSeq, resetCheckpointCounter,
} from './reasoning/stateTree'

// Explain Engine
export {
  createExplain, appendExplain, appendDecisionNode, summarizeExplain,
  summarizeExplainsByPhase, generateFullReport, createDecisionNode,
  resetExplainCounter, resetDecisionCounter,
  calculateConfidence, formatConfidenceBreakdown,
  createExplainSection, createUnifiedExplain, createStandardExplain,
} from './reasoning/explainEngine'

// Competition Engine
export {
  evaluateUniversalCompetition, evaluateCompetition, calculateUniversalScore,
  registerCompetitionStrategy, getRegisteredCompetitionStrategies, clearCompetitionStrategies,
} from './reasoning/competitionEngine'
export type { CompetitionCandidate, CompetitionResult, CompetitionStrategy, EliminationRecord, WinnerDetail } from './reasoning/competitionEngine'

// Strategy
export { registerStrategy, getRegisteredStrategies, clearStrategies } from './reasoning/strategy'
export type { ReasoningStrategy, StrategyIntent, StrategyResult } from './reasoning/strategy'

// Benchmark Engine
export { runBenchmark, formatBenchmarkReport } from './reasoning/benchmarkEngine'
export type { BenchmarkReport, BenchmarkDimension } from './reasoning/benchmarkEngine'

// Kernel (API Freeze 边界)
export { KERNEL_VERSION, KERNEL_FREEZE_DATE, KERNEL_MODULES, isKernelModule, getKernelInfo, KERNEL_HASH, KERNEL_BUILD_TIME, KERNEL_COMPATIBILITY, getKernelHealth } from './reasoning/kernel'
export type { KernelHealthReport } from './reasoning/kernel'
export type {
  _CompetitionStrategy, _CompetitionCandidate, _CompetitionResult,
  _EliminationRecord, _WinnerDetail,
  _ReasoningStrategy, _StrategyIntent, _StrategyResult,
  _BenchmarkReport, _BenchmarkDimension,
} from './reasoning/kernel'

// Detector Guard (运行期防护)
export { guardDetectorExecution, createDetectorResult } from './reasoning/detectorGuard'
export type { DetectorIntent, DetectorEvidence, DetectorResult } from './reasoning/detectorGuard'

// RuleEngine (Freeze+2)
export { ruleEngine } from './reasoning/ruleEngine'
export type { RuleCondition, BaziRule, RulePackage } from './reasoning/ruleEngine'

// ClassicalLibrary (Freeze+2)
export { classicalLibrary } from './reasoning/classicalLibrary'
export type { ClassicalBook, ClassicalReference } from './reasoning/classicalLibrary'

// SettlementEngine (Freeze+2)
export { settlementEngine } from './reasoning/settlementEngine'
export type { SettlementStep, SettlementPipeline, SettlementResult } from './reasoning/settlementEngine'

// KernelValidator (Freeze+2)
export { kernelValidator } from './reasoning/kernelValidator'
export type { KernelValidationResult, ValidationIssue as KernelValidationIssue, ValidationMode } from './reasoning/kernelValidator'

// FreezeManifest (Freeze+2 → Freeze+3)
export { FREEZE_MANIFEST, isModuleFrozen, getKernelVersion, checkPluginCompatibility } from './reasoning/freezeManifest'
export type { FreezeManifest, FreezeManifestEntry, PluginManifest } from './reasoning/freezeManifest'

// Benchmark Performance
export type { PerformanceStats } from './reasoning/benchmarkEngine'

// Competition NestedCompetition type
export type { NestedCompetition } from './reasoning/competitionEngine'

// Types
export type {
  ReasoningContext, ChartPhase, ChartStateNode, ExplainRecord, ExplainFactor, ExplainConclusion,
  ReasoningStep, DecisionNode, DecisionCandidate, RejectedAlternative,
  DynamicStructure, YongShenInfo, DiseaseInfo, MedicineInfo,
  CompetitionFactors as ReasoningCompetitionFactors, ConfidenceSource, StructureEvolution,
  ReasoningEvent, ReasoningEventType, ExplainSection, ExplainSectionType, ExplainTemplate,
  Checkpoint,
} from './reasoning/types'
export type { ClassicalSource, DecisionLogEntry } from './reasoning/types'
export { SOURCE_PRIORITY } from './reasoning/types'

// ═══════════════════════════════════════════════════════════
// P4 Plugin — 15 个专业推演引擎 + 统一推演流水线
// ═══════════════════════════════════════════════════════════

// 流水线引擎（推荐入口）
export { XuanFengPipelineEngine, runMasterAnalysis } from './plugin'
export type { PipelineInput, PipelineReport, PipelineStepResult, MasterReportSection } from './plugin'

// 15 个专业推演引擎
export { ConsensusEngine } from './plugin'
export { DynastySimulationEngine } from './plugin'
export { ShiShenGraphEngine } from './plugin'
export { EnergyFlowEngine } from './plugin'
export { ShenShaFilterEngine } from './plugin'
export { ExplainV4Engine } from './plugin'
export { CaseLearningEngine } from './plugin'
export { ConfidenceEngine } from './plugin'
export { ExplainEvidenceEngine } from './plugin'
export { MasterToneEngine } from './plugin'
export { AccuracyEngine } from './plugin'
export { BenchmarkEngine2 } from './plugin'
export { PerformanceOptEngine } from './plugin'
export { I18nEngine } from './plugin'
export { ReleaseEngine11 } from './plugin'
