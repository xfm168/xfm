// V5.0 RC Phase 5 Module II: Explain Level Engine — Types
// 三级解释引擎：普通 / 专业 / 大师

export type ExplainLevel = 'normal' | 'professional' | 'master'

export interface ExplainLevelConfig {
  level: ExplainLevel
  targetWordCount: number
  maxDepth: number
  includeClassicalQuote: boolean
  includeExpertOpinion: boolean
  includeTraceChain: boolean
  includeCaseReference: boolean
}

export interface LeveledExplainSection {
  topic: string
  content: string
  depth: number
  wordCount: number
  sources: string[]
  classicalQuotes: string[]
}

export interface ExplainExpansionNode {
  id: string
  topic: string
  depth: number
  expanded: boolean
  children: ExplainExpansionNode[]
}

export interface ExplainLevelOutput {
  level: ExplainLevel
  sections: LeveledExplainSection[]
  totalWordCount: number
  expansionTree: ExplainExpansionNode[]
  config: ExplainLevelConfig
}

export interface ExplainInputTopic {
  id: string
  topic: string
  conclusion: string
  reason: string
  classicalSource: string
  modernExplanation: string
  suggestion: string
  expertOpinion: string
  traceChain: string
}

export const EXPLAIN_LEVEL_CONFIGS: Record<ExplainLevel, ExplainLevelConfig> = {
  normal: {
    level: 'normal',
    targetWordCount: 1000,
    maxDepth: 1,
    includeClassicalQuote: true,
    includeExpertOpinion: false,
    includeTraceChain: false,
    includeCaseReference: false,
  },
  professional: {
    level: 'professional',
    targetWordCount: 3000,
    maxDepth: 2,
    includeClassicalQuote: true,
    includeExpertOpinion: true,
    includeTraceChain: false,
    includeCaseReference: true,
  },
  master: {
    level: 'master',
    targetWordCount: 8000,
    maxDepth: 3,
    includeClassicalQuote: true,
    includeExpertOpinion: true,
    includeTraceChain: true,
    includeCaseReference: true,
  },
}

export const EXPLAIN_LEVEL_VERSION = '1.0.0'
