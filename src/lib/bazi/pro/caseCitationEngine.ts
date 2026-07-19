// V5.0 RC Phase 5 Module III: Case Citation Engine — Engine

import type { CaseCitation } from './caseCitationTypes'
import type { CaseCitationOutput } from './caseCitationTypes'
import type { CitationContext } from './caseCitationTypes'
import type { CitationMatchRule } from './caseCitationTypes'
import type { CitationOptions } from './caseCitationTypes'
import type { InlineCitationMarkup } from './caseCitationTypes'

import { DEFAULT_CITATION_RULES } from './caseCitationTypes'
import { DEFAULT_CITATION_OPTIONS } from './caseCitationTypes'

export const CASE_CITATION_ENGINE_VERSION = '1.0.0'

interface CaseData {
  title: string
  category: string
  keywords: string[]
  tags: string[]
  qualityScore: number
  snippet: string
}

type CaseInput = {
  caseId: string
  title: string
  category: string
  keywords: string[]
  tags: string[]
  qualityScore: number
  snippet: string
}

const caseStore = new Map<string, CaseData>()

const SEED_CASES: CaseInput[] = [
  {
    caseId: 'CASE-CIT-001',
    title: '甲木日主寅月生人',
    category: 'classic',
    keywords: ['甲木', '寅月', '建禄格'],
    tags: ['木', '春', '建禄'],
    qualityScore: 0.9,
    snippet: '甲木生于寅月，建禄格，身旺喜克泄，取财官为用。',
  },
  {
    caseId: 'CASE-CIT-002',
    title: '丁火日主午月生人',
    category: 'classic',
    keywords: ['丁火', '午月', '正印格'],
    tags: ['火', '夏', '正印'],
    qualityScore: 0.85,
    snippet: '丁火生于午月，正印格，印旺身强，取食伤泄秀为用。',
  },
  {
    caseId: 'CASE-CIT-003',
    title: '庚金日主酉月生人',
    category: 'anonymous',
    keywords: ['庚金', '酉月', '食神生财'],
    tags: ['金', '秋', '食神'],
    qualityScore: 0.88,
    snippet: '庚金生于酉月，食神生财格，金白水清，取财星为用。',
  },
  {
    caseId: 'CASE-CIT-004',
    title: '壬水日主亥月生人',
    category: 'edge',
    keywords: ['壬水', '亥月', '专旺格'],
    tags: ['水', '冬', '专旺'],
    qualityScore: 0.78,
    snippet: '壬水生于亥月，专旺格，水势汪洋，取木泄水为用。',
  },
  {
    caseId: 'CASE-CIT-005',
    title: '丙火日主巳月生人',
    category: 'expert',
    keywords: ['丙火', '巳月', '七杀格'],
    tags: ['火', '夏', '七杀'],
    qualityScore: 0.92,
    snippet: '丙火生于巳月，七杀格，杀印相生，取印星化杀为用。',
  },
]

// Initialize seed data
for (const c of SEED_CASES) {
  caseStore.set(c.caseId, {
    title: c.title,
    category: c.category,
    keywords: c.keywords,
    tags: c.tags,
    qualityScore: c.qualityScore,
    snippet: c.snippet,
  })
}

export function registerCases(cases: CaseInput[]): void {
  for (const c of cases) {
    caseStore.set(c.caseId, {
      title: c.title,
      category: c.category,
      keywords: c.keywords,
      tags: c.tags,
      qualityScore: c.qualityScore,
      snippet: c.snippet,
    })
  }
}

export function findRelevantCases(
  contexts: CitationContext[],
  options?: Partial<CitationOptions>
): CaseCitationOutput {
  const opts: CitationOptions = { ...DEFAULT_CITATION_OPTIONS, ...options }
  const allCitations: CaseCitation[] = []
  const inlineMarkups: InlineCitationMarkup[] = []

  for (const ctx of contexts) {
    const scored: CaseCitation[] = []

    caseStore.forEach((data, caseId) => {
      const relevance = calculateCitationRelevance(data, ctx)
      if (relevance >= opts.minRelevanceScore) {
        const matchedFeatures: string[] = []

        const keywordMatches = data.keywords.filter(kw =>
          ctx.keywords.some(ck => kw.includes(ck) || ck.includes(kw))
        )
        matchedFeatures.push(...keywordMatches)

        if (data.category === ctx.topic) {
          matchedFeatures.push(`category:${data.category}`)
        }

        scored.push({
          caseId,
          caseTitle: data.title,
          relevanceScore: Math.round(relevance * 1000) / 1000,
          position: opts.defaultPosition,
          snippet: opts.includeSnippets
            ? generateCitationSnippet(data.snippet, 60)
            : '',
          matchedFeatures,
        })
      }
    })

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore)
    const selected = scored.slice(0, opts.maxCitationsPerSection)
    allCitations.push(...selected)

    inlineMarkups.push(buildInlineCitation(ctx.topic, selected))
  }

  const deduped = deduplicateCitations(allCitations)

  return {
    citations: deduped,
    inlineMarkups,
    coverageRate: getCitationCoverageRate(
      { citations: deduped, inlineMarkups, coverageRate: 0, totalCasesReferenced: deduped.length },
      contexts.length
    ),
    totalCasesReferenced: deduped.length,
  }
}

export function buildInlineCitation(
  text: string,
  citations: CaseCitation[]
): InlineCitationMarkup {
  const beforeText = text
  const citationMarks = citations.length > 0
    ? citations.map(c => `[${c.caseId}]`).join(', ')
    : ''
  const afterText = citations.length > 0
    ? ` (参考案例: ${citationMarks})`
    : ''

  return {
    text,
    citations,
    beforeText,
    afterText,
  }
}

export function calculateCitationRelevance(
  caseData: { category: string; keywords: string[]; tags: string[]; qualityScore: number },
  context: CitationContext
): number {
  const rules: CitationMatchRule[] = DEFAULT_CITATION_RULES
  let totalScore = 0

  for (const rule of rules) {
    let matchScore = 0

    if (rule.field === 'category') {
      matchScore = caseData.category === context.topic ? 1 : 0
    } else if (rule.field === 'keywords') {
      const matched = caseData.keywords.filter(kw =>
        context.keywords.some(ck => kw.includes(ck) || ck.includes(kw))
      )
      matchScore = context.keywords.length > 0
        ? matched.length / context.keywords.length
        : 0
    } else if (rule.field === 'tags') {
      const matched = caseData.tags.filter(tag =>
        context.keywords.some(ck => tag.includes(ck) || ck.includes(tag))
      )
      matchScore = context.keywords.length > 0
        ? matched.length / context.keywords.length
        : 0
    } else if (rule.field === 'qualityScore') {
      matchScore = caseData.qualityScore >= rule.threshold ? 1 : caseData.qualityScore
    }

    totalScore += matchScore * rule.weight
  }

  return Math.min(1, Math.round(totalScore * 1000) / 1000)
}

export function extractCitationContext(paragraph: {
  topic: string
  sourceModule: string
  confidence: number
  keywords: string[]
}): CitationContext {
  return {
    topic: paragraph.topic,
    sourceModules: [paragraph.sourceModule],
    confidence: paragraph.confidence,
    keywords: paragraph.keywords,
  }
}

export function generateCitationSnippet(snippet: string, maxLen: number): string {
  if (snippet.length <= maxLen) return snippet
  return snippet.slice(0, maxLen) + '...'
}

export function getCitationCoverageRate(
  output: CaseCitationOutput,
  totalSections: number
): number {
  if (totalSections === 0) return 0
  const sectionsWithCitations = output.inlineMarkups.filter(
    m => m.citations.length > 0
  ).length
  return Math.round((sectionsWithCitations / totalSections) * 1000) / 1000
}

export function deduplicateCitations(citations: CaseCitation[]): CaseCitation[] {
  const seen = new Set<string>()
  const result: CaseCitation[] = []

  for (const c of citations) {
    if (!seen.has(c.caseId)) {
      seen.add(c.caseId)
      result.push(c)
    }
  }

  return result
}

export function getCaseById(caseId: string): CaseData | undefined {
  return caseStore.get(caseId)
}

export function resetCaseStore(): void {
  caseStore.clear()
}

