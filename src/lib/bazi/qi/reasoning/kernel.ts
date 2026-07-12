/**
 * ═══════════════════════════════════════════════════════════════
 * Reasoning Kernel — 玄风门推演内核（API Freeze）
 * Version 2.0.0
 * ═══════════════════════════════════════════════════════════════
 *
 * 冻结日期：2026-07-10
 * 冻结版本：2.0.0
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  此文件及所引用的全部模块进入 API Freeze 状态。
 *  除发现严重 Bug 外，不允许任何人修改 Kernel 内部实现。
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Kernel 边界：
 *   Kernel 内部 = 推理引擎核心（不可修改）
 *   Kernel 外部 = Strategy / Detector / 业务模块（可扩展）
 *
 * Kernel 组成（V2.0.0）：
 *   ├─ types.ts              — 全部核心类型定义
 *   ├─ stateTree.ts          — 命局状态树（Undo/Diff/Merge/Checkpoint）
 *   ├─ explainEngine.ts      — 推演解释引擎（统一格式 / Confidence 分解）
 *   ├─ competitionEngine.ts — 通用竞争引擎（唯一评分中心）
 *   ├─ strategy.ts           — 策略插拔接口
 *   ├─ benchmarkEngine.ts    — 五维 Benchmark 框架
 *   ├─ ruleEngine.ts         — 规则引擎（Rule/Condition/Priority/Source）
 *   ├─ classicalLibrary.ts   — 古籍库（独立管理）
 *   ├─ settlementEngine.ts  — 结算引擎（Pipeline 插件化）
 *   ├─ detectorGuard.ts      — Detector 运行期防护
 *   ├─ kernelValidator.ts    — 内核完整性校验器
 *   ├─ freezeManifest.ts     — 冻结清单
 *   └─ kernel.ts             — 本文件（Kernel 边界声明 + 版本信息）
 */

import { FREEZE_MANIFEST } from './freezeManifest'

// ─── Kernel Version System（Freeze+2） ───

/** Kernel 版本号 */
export const KERNEL_VERSION = '2.0.0'

/** Kernel 构建哈希 */
export const KERNEL_HASH = 'sha256-placeholder'

/** Kernel 构建时间 */
export const KERNEL_BUILD_TIME = '2026-07-10T00:00:00.000Z'

/** Kernel 兼容性版本范围 */
export const KERNEL_COMPATIBILITY = '>=2.0.0'

/** Kernel 包含的模块清单 */
export const KERNEL_MODULES = [
  'types', 'stateTree', 'explainEngine', 'competitionEngine',
  'strategy', 'benchmarkEngine', 'ruleEngine', 'classicalLibrary',
  'settlementEngine', 'detectorGuard', 'kernelValidator', 'freezeManifest',
  'kernel',
] as const

/** Kernel 冻结日期 */
export const KERNEL_FREEZE_DATE = '2026-07-10'

/** 获取 Kernel 完整版本信息 */
export function getKernelInfo(): {
  version: string
  hash: string
  buildTime: string
  compatibility: string
  freezeDate: string
  modules: readonly string[]
} {
  return {
    version: KERNEL_VERSION,
    hash: KERNEL_HASH,
    buildTime: KERNEL_BUILD_TIME,
    compatibility: KERNEL_COMPATIBILITY,
    freezeDate: KERNEL_FREEZE_DATE,
    modules: KERNEL_MODULES,
  }
}

/** 是否处于 Kernel 内部（用于运行时检查） */
export function isKernelModule(moduleName: string): boolean {
  return KERNEL_MODULES.includes(moduleName as typeof KERNEL_MODULES[number])
}

// ─── Kernel Health Check（Freeze+3） ───

export interface KernelHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy'
  kernelVersion: string
  apiVersion: string
  implementation: string
  moduleCount: number
  frozenModuleCount: number
  timestamp: number
}

/**
 * kernelHealth — Kernel 健康检查
 * 
 * 返回 Kernel 版本、Manifest、模块冻结状态等信息。
 * 部署和运维可直接调用。
 */
export function getKernelHealth(): KernelHealthReport {
  const frozenCount = FREEZE_MANIFEST.modules.filter(m => m.frozen).length
  return {
    status: frozenCount === FREEZE_MANIFEST.modules.length ? 'healthy' : 'degraded',
    kernelVersion: KERNEL_VERSION,
    apiVersion: FREEZE_MANIFEST.apiVersion,
    implementation: FREEZE_MANIFEST.implementation,
    moduleCount: FREEZE_MANIFEST.modules.length,
    frozenModuleCount: frozenCount,
    timestamp: Date.now(),
  }
}

// ─── 从 Kernel 统一导出（外部只通过此入口引用） ───

// StateTree
export { createReasoningContext, advancePhase, getStateAtPhase, comparePhases } from './stateTree'
export { rollbackToPhase, diffContexts, mergeExplains } from './stateTree'
export { emitReasoningEvent, summarizeEventTimeline } from './stateTree'
export { createCheckpoint, restoreCheckpoint, listCheckpoints } from './stateTree'
export { resetEventSeq, resetCheckpointCounter } from './stateTree'

// Explain Engine
export { createExplain, appendExplain, appendDecisionNode } from './explainEngine'
export { summarizeExplain, summarizeExplainsByPhase, generateFullReport } from './explainEngine'
export { createDecisionNode, resetExplainCounter, resetDecisionCounter } from './explainEngine'
export { calculateConfidence, formatConfidenceBreakdown } from './explainEngine'
export { createExplainSection, createUnifiedExplain, createStandardExplain } from './explainEngine'

// Competition Engine
export { evaluateUniversalCompetition, evaluateCompetition, calculateUniversalScore } from './competitionEngine'
export { registerCompetitionStrategy, getRegisteredCompetitionStrategies, clearCompetitionStrategies } from './competitionEngine'

// Strategy
export { registerStrategy, getRegisteredStrategies, clearStrategies } from './strategy'

// Benchmark
export { runBenchmark, formatBenchmarkReport } from './benchmarkEngine'

// RuleEngine
export { ruleEngine } from './ruleEngine'
export type { RuleCondition, BaziRule, RulePackage } from './ruleEngine'

// ClassicalLibrary
export { classicalLibrary } from './classicalLibrary'
export type { ClassicalBook, ClassicalReference } from './classicalLibrary'

// SettlementEngine
export { settlementEngine } from './settlementEngine'
export type { SettlementStep, SettlementPipeline, SettlementResult } from './settlementEngine'

// KernelValidator
export { kernelValidator } from './kernelValidator'
export type { KernelValidationResult, ValidationIssue } from './kernelValidator'

// FreezeManifest
export { FREEZE_MANIFEST, isModuleFrozen, getKernelVersion } from './freezeManifest'
export type { FreezeManifest, FreezeManifestEntry, PluginManifest } from './freezeManifest'

// Types
export type {
  ReasoningContext, ChartPhase, ChartStateNode,
  ExplainRecord, ExplainFactor, ExplainConclusion,
  ReasoningStep, DecisionNode, DecisionCandidate, RejectedAlternative,
  DynamicStructure, YongShenInfo, DiseaseInfo, MedicineInfo,
  CompetitionFactors, ConfidenceSource, StructureEvolution,
  ClassicalSource, DecisionLogEntry,
  ReasoningEvent, ReasoningEventType,
  ExplainSection, ExplainSectionType, ExplainTemplate,
  Checkpoint,
} from './types'

// Re-export types from other kernel files
export type { CompetitionStrategy as _CompetitionStrategy } from './competitionEngine'
export type { CompetitionCandidate as _CompetitionCandidate } from './competitionEngine'
export type { CompetitionResult as _CompetitionResult } from './competitionEngine'
export type { EliminationRecord as _EliminationRecord } from './competitionEngine'
export type { WinnerDetail as _WinnerDetail } from './competitionEngine'
export type { ReasoningStrategy as _ReasoningStrategy } from './strategy'
export type { StrategyIntent as _StrategyIntent } from './strategy'
export type { StrategyResult as _StrategyResult } from './strategy'
export type { BenchmarkReport as _BenchmarkReport } from './benchmarkEngine'
export type { BenchmarkDimension as _BenchmarkDimension } from './benchmarkEngine'

export { SOURCE_PRIORITY } from './types'
