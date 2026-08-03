/**
 * P0-5 Part 10: 六层架构整合
 *
 * XuanFeng Core OS — 命理操作系统
 *
 * Core         → 核心层（五行/天干地支/十神等基础概念）
 * Knowledge    → 知识层（古籍/规则/知识图谱/版本管理/审核）
 * Engine       → 引擎层（七大子引擎）
 * Decision     → 决策层（Unified Decision Core）
 * Quality      → 质量层（AccuracyCenter/Benchmark/Dashboard）
 * AI           → AI 层（AI Context/Prompt）
 * Application  → 应用层（Web/APP/API）
 *
 * 形成完整的命理推理平台
 */

import { FOUNDATION_VERSION } from './types'
import type { ArchitectureLayer, LayerDependency, ArchitectureConfig } from './types'

// ============================================================
// 六层架构定义
// ============================================================

export const ARCHITECTURE_LAYERS: LayerDependency[] = [
  {
    layer: 'core',
    dependsOn: [],
    consumedBy: ['knowledge', 'engine'],
    description: '核心层：五行/天干地支/十神/纳音/旺衰等基础命理概念与算法',
  },
  {
    layer: 'knowledge',
    dependsOn: ['core'],
    consumedBy: ['engine', 'decision'],
    description: '知识层：古籍知识图谱/RuleDSL/规则版本管理/知识审核/知识基准',
  },
  {
    layer: 'engine',
    dependsOn: ['core', 'knowledge'],
    consumedBy: ['decision'],
    description: '引擎层：七大子引擎（Strength/Pattern/Climate/Balance/Medicine/Bridge/Season）',
  },
  {
    layer: 'decision',
    dependsOn: ['engine', 'knowledge'],
    consumedBy: ['quality', 'ai'],
    description: '决策层：Unified Decision Core V2（PriorityMatrix/Gate/Kill/Voting/ConflictResolver/MetaDecision）',
  },
  {
    layer: 'quality',
    dependsOn: ['decision'],
    consumedBy: ['ai', 'application'],
    description: '质量层：AccuracyCenter/RuleBenchmark/SchoolBenchmark/EngineDashboard/CaseSimilarity',
  },
  {
    layer: 'ai',
    dependsOn: ['decision', 'quality'],
    consumedBy: ['application'],
    description: 'AI 层：AIContextBuilder/PromptBuilder，统一 AI 调用入口',
  },
  {
    layer: 'application',
    dependsOn: ['ai', 'quality'],
    consumedBy: [],
    description: '应用层：Web/APP/小程序/桌面版/API Server',
  },
]

export const ARCHITECTURE_CONFIG: ArchitectureConfig = {
  version: FOUNDATION_VERSION,
  layers: {
    core: { enabled: true, version: '4.4.0', modules: ['wuxing', 'tiangan', 'dizhi', 'shishen', 'nayin', 'wangshuai'] },
    knowledge: { enabled: true, version: '5.0.0', modules: ['classicGraph', 'ruleDSL', 'ruleGraph', 'versionManager', 'reviewCenter', 'knowledgeBenchmark'] },
    engine: { enabled: true, version: '3.5.0', modules: ['strengthEngine', 'patternEngine', 'climateEngine', 'balanceEngine', 'medicineEngine', 'bridgeEngine', 'seasonEngine'] },
    decision: { enabled: true, version: '3.5.0', modules: ['unifiedDecisionCore', 'priorityMatrix', 'ruleGate', 'ruleVoting', 'conflictResolver', 'metaDecision'] },
    quality: { enabled: true, version: '3.5.0', modules: ['accuracyCenter', 'ruleBenchmark', 'schoolBenchmark', 'engineDashboard', 'caseSimilarity', 'explainScore'] },
    ai: { enabled: true, version: '5.0.0', modules: ['aiContextBuilder', 'promptBuilder'] },
    application: { enabled: true, version: '5.0.0', modules: ['decisionAPI', 'ruleAPI', 'caseAPI', 'classicAPI', 'explainAPI', 'qualityAPI'] },
  },
  dependencies: ARCHITECTURE_LAYERS,
}

// ============================================================
// 架构状态检查
// ============================================================

export interface ArchitectureStatus {
  version: string
  layers: Array<{
    layer: ArchitectureLayer
    enabled: boolean
    version: string
    moduleCount: number
    upstreamOk: boolean
    downstreamOk: boolean
  }>
  totalLayers: number
  enabledLayers: number
  healthy: boolean
  issues: string[]
}

/** 检查架构状态 */
export function checkArchitectureStatus(): ArchitectureStatus {
  const issues: string[] = []
  const layerStatus = ARCHITECTURE_LAYERS.map(ld => {
    const config = ARCHITECTURE_CONFIG.layers[ld.layer]
    const enabled = config?.enabled ?? false
    const moduleCount = config?.modules.length ?? 0

    // 检查上游依赖
    const upstreamOk = ld.dependsOn.every(dep => ARCHITECTURE_CONFIG.layers[dep]?.enabled)
    if (enabled && !upstreamOk) {
      issues.push(`层 ${ld.layer} 已启用但上游依赖 ${ld.dependsOn.join(', ')} 未全部启用`)
    }

    // 检查下游消费者
    const downstreamOk = ld.consumedBy.length > 0 || ld.layer === 'application'
    if (enabled && !downstreamOk && ld.layer !== 'application') {
      issues.push(`层 ${ld.layer} 已启用但没有下游消费者`)
    }

    return {
      layer: ld.layer,
      enabled,
      version: config?.version ?? '0.0.0',
      moduleCount,
      upstreamOk,
      downstreamOk,
    }
  })

  const enabledLayers = layerStatus.filter(l => l.enabled).length

  return {
    version: FOUNDATION_VERSION,
    layers: layerStatus,
    totalLayers: ARCHITECTURE_LAYERS.length,
    enabledLayers,
    healthy: issues.length === 0,
    issues,
  }
}

/** 获取层依赖关系图（用于可视化） */
export function getLayerDependencyGraph(): { nodes: ArchitectureLayer[]; edges: Array<{ from: ArchitectureLayer; to: ArchitectureLayer }> } {
  const nodes = ARCHITECTURE_LAYERS.map(l => l.layer)
  const edges: Array<{ from: ArchitectureLayer; to: ArchitectureLayer }> = []
  for (const ld of ARCHITECTURE_LAYERS) {
    for (const dep of ld.dependsOn) {
      edges.push({ from: dep, to: ld.layer })
    }
  }
  return { nodes, edges }
}
