// V5.0 RC Phase 5 Module III: Case Citation Engine — Types

export type CitationPosition = 'inline' | 'footnote' | 'appendix'

export interface CaseCitation {
  caseId: string
  caseTitle: string
  relevanceScore: number     // 0~1
  position: CitationPosition
  snippet: string
  matchedFeatures: string[]
}

export interface InlineCitationMarkup {
  text: string
  citations: CaseCitation[]
  beforeText: string
  afterText: string
}

export interface CitationContext {
  topic: string
  sourceModules: string[]
  confidence: number
  keywords: string[]
}

export interface CitationMatchRule {
  field: string
  weight: number
  threshold: number
}

export interface CaseCitationOutput {
  citations: CaseCitation[]
  inlineMarkups: InlineCitationMarkup[]
  coverageRate: number
  totalCasesReferenced: number
}

export interface CitationOptions {
  maxCitationsPerSection: number
  minRelevanceScore: number
  defaultPosition: CitationPosition
  includeSnippets: boolean
}

export const CASE_CITATION_VERSION = '1.0.0'

export const DEFAULT_CITATION_RULES: CitationMatchRule[] = [
  { field: 'category', weight: 0.3, threshold: 0.5 },
  { field: 'keywords', weight: 0.4, threshold: 0.3 },
  { field: 'tags', weight: 0.2, threshold: 0.2 },
  { field: 'qualityScore', weight: 0.1, threshold: 0.6 },
]

export const DEFAULT_CITATION_OPTIONS: CitationOptions = {
  maxCitationsPerSection: 3,
  minRelevanceScore: 0.3,
  defaultPosition: 'inline',
  includeSnippets: true,
}