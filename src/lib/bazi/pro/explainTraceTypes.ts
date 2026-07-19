// V5.0 RC Phase 5 Batch 2 Module V: Explain Trace Engine — Types

export type TraceNodeType = 'conclusion' | 'source-module' | 'rule' | 'classic' | 'expert' | 'final'
export type TraceDisplayStatus = 'strong' | 'moderate' | 'weak'

export interface TraceStepInput {
  id: string
  name: string
  type?: string
  confidence?: number
  ruleId?: string
  source?: string
  description?: string
  children?: TraceStepInput[]
}

export interface TraceDisplayNode {
  id: string
  type: TraceNodeType
  label: string
  description: string
  confidence: number
  status: TraceDisplayStatus
  children: TraceDisplayNode[]
  depth: number
}

export interface TraceBreadcrumb {
  step: number
  label: string
  nodeId: string
}

export interface TracePathSummary {
  conclusion: string
  modules: string[]
  rulesHit: string[]
  classicsCited: string[]
  expertsReferenced: string[]
  totalSteps: number
  overallConfidence: number
}

export interface ExplainTraceOutput {
  tree: TraceDisplayNode
  breadcrumbs: TraceBreadcrumb[]
  summary: TracePathSummary
  totalNodes: number
}

export interface TraceFilterOptions {
  maxDepth: number
  excludeTypes: TraceNodeType[]
  minConfidence: number
}

export const EXPLAIN_TRACE_VERSION = '1.0.0'

export const DEFAULT_TRACE_FILTER: TraceFilterOptions = {
  maxDepth: 10,
  excludeTypes: [],
  minConfidence: 0,
}
