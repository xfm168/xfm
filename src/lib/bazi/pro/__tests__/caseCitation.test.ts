import { describe, test, expect, beforeEach, vi } from 'vitest'
import { CASE_CITATION_ENGINE_VERSION } from '../caseCitationEngine'
import { registerCases, findRelevantCases, buildInlineCitation, calculateCitationRelevance, extractCitationContext, generateCitationSnippet, getCitationCoverageRate, deduplicateCitations, getCaseById, resetCaseStore } from '../caseCitationEngine'
import { CASE_CITATION_VERSION, DEFAULT_CITATION_RULES, DEFAULT_CITATION_OPTIONS } from '../caseCitationTypes'

describe('Case Citation Engine', () => {
  beforeEach(() => {
    resetCaseStore()
    registerCases([
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
    ])
  })

  test('engine version is 1.0.0', () => {
    expect(CASE_CITATION_ENGINE_VERSION).toBe('1.0.0')
  })

  test('types version is 1.0.0', () => {
    expect(CASE_CITATION_VERSION).toBe('1.0.0')
  })

  test('getCaseById returns case data for existing case', () => {
    const c = getCaseById('CASE-CIT-001')
    expect(c).toBeDefined()
    expect(c!.title).toBe('甲木日主寅月生人')
    expect(c!.category).toBe('classic')
    expect(c!.keywords).toEqual(['甲木', '寅月', '建禄格'])
  })

  test('getCaseById returns undefined for non-existent case', () => {
    expect(getCaseById('NON-EXISTENT')).toBeUndefined()
  })

  test('getCaseById returns all 5 seed cases', () => {
    expect(getCaseById('CASE-CIT-002')).toBeDefined()
    expect(getCaseById('CASE-CIT-003')).toBeDefined()
    expect(getCaseById('CASE-CIT-004')).toBeDefined()
    expect(getCaseById('CASE-CIT-005')).toBeDefined()
  })

  test('registerCases adds new cases to the store', () => {
    registerCases([{
      caseId: 'CASE-CIT-100',
      title: '新案例',
      category: 'new',
      keywords: ['新'],
      tags: ['新'],
      qualityScore: 0.95,
      snippet: '测试新案例',
    }])
    expect(getCaseById('CASE-CIT-100')).toBeDefined()
    expect(getCaseById('CASE-CIT-100')!.title).toBe('新案例')
  })

  test('resetCaseStore clears all cases', () => {
    expect(getCaseById('CASE-CIT-001')).toBeDefined()
    resetCaseStore()
    expect(getCaseById('CASE-CIT-001')).toBeUndefined()
  })

  test('extractCitationContext builds correct context', () => {
    const ctx = extractCitationContext({
      topic: 'classic',
      sourceModule: 'patternEngine',
      confidence: 0.9,
      keywords: ['甲木', '建禄格'],
    })
    expect(ctx.topic).toBe('classic')
    expect(ctx.sourceModules).toEqual(['patternEngine'])
    expect(ctx.confidence).toBe(0.9)
    expect(ctx.keywords).toEqual(['甲木', '建禄格'])
  })

  test('calculateCitationRelevance returns score for category match', () => {
    const score = calculateCitationRelevance(
      { category: 'classic', keywords: ['甲木'], tags: ['木'], qualityScore: 0.9 },
      { topic: 'classic', sourceModules: [], confidence: 1, keywords: [] }
    )
    expect(score).toBeGreaterThan(0)
  })

  test('calculateCitationRelevance returns score for keyword match', () => {
    const score = calculateCitationRelevance(
      { category: 'anonymous', keywords: ['甲木', '建禄格'], tags: [], qualityScore: 0.8 },
      { topic: 'other', sourceModules: [], confidence: 1, keywords: ['甲木'] }
    )
    expect(score).toBeGreaterThan(0)
  })

  test('calculateCitationRelevance returns 0 for no match', () => {
    const score = calculateCitationRelevance(
      { category: 'x', keywords: ['y'], tags: ['z'], qualityScore: 0.1 },
      { topic: 'a', sourceModules: [], confidence: 1, keywords: ['b'] }
    )
    expect(score).toBeLessThan(0.3)
  })

  test('calculateCitationRelevance considers qualityScore', () => {
    const scoreHigh = calculateCitationRelevance(
      { category: 'a', keywords: [], tags: [], qualityScore: 0.95 },
      { topic: 'a', sourceModules: [], confidence: 1, keywords: [] }
    )
    const scoreLow = calculateCitationRelevance(
      { category: 'a', keywords: [], tags: [], qualityScore: 0.3 },
      { topic: 'a', sourceModules: [], confidence: 1, keywords: [] }
    )
    expect(scoreHigh).toBeGreaterThan(scoreLow)
  })

  test('generateCitationSnippet returns short text unchanged', () => {
    expect(generateCitationSnippet('短', 10)).toBe('短')
  })

  test('generateCitationSnippet truncates long text with ellipsis', () => {
    const result = generateCitationSnippet('甲木生于寅月，建禄格，身旺喜克泄，取财官为用。', 15)
    expect(result).toBe('甲木生于寅月，建禄格，身旺喜克...')
    expect(result.endsWith('...')).toBe(true)
  })

  test('buildInlineCitation with citations includes afterText', () => {
    const markup = buildInlineCitation('甲木分析', [
      { caseId: 'CASE-CIT-001', caseTitle: '甲木日主寅月生人', relevanceScore: 0.9, position: 'inline', snippet: '测试', matchedFeatures: ['甲木'] },
    ])
    expect(markup.text).toBe('甲木分析')
    expect(markup.beforeText).toBe('甲木分析')
    expect(markup.afterText).toContain('CASE-CIT-001')
    expect(markup.citations).toHaveLength(1)
  })

  test('buildInlineCitation without citations has empty afterText', () => {
    const markup = buildInlineCitation('测试段落', [])
    expect(markup.afterText).toBe('')
    expect(markup.citations).toHaveLength(0)
  })

  test('buildInlineCitation with multiple citations joins with comma', () => {
    const markup = buildInlineCitation('测试', [
      { caseId: 'A', caseTitle: 'a', relevanceScore: 0.9, position: 'inline', snippet: '', matchedFeatures: [] },
      { caseId: 'B', caseTitle: 'b', relevanceScore: 0.8, position: 'inline', snippet: '', matchedFeatures: [] },
    ])
    expect(markup.afterText).toContain('[A], [B]')
  })

  test('deduplicateCitations removes duplicates', () => {
    const citations = [
      { caseId: 'A', caseTitle: 'a', relevanceScore: 0.9, position: 'inline' as const, snippet: '', matchedFeatures: [] },
      { caseId: 'A', caseTitle: 'a', relevanceScore: 0.8, position: 'inline' as const, snippet: '', matchedFeatures: [] },
      { caseId: 'B', caseTitle: 'b', relevanceScore: 0.7, position: 'inline' as const, snippet: '', matchedFeatures: [] },
    ]
    const deduped = deduplicateCitations(citations)
    expect(deduped).toHaveLength(2)
    expect(deduped[0].caseId).toBe('A')
    expect(deduped[1].caseId).toBe('B')
  })

  test('deduplicateCitations with empty array returns empty', () => {
    expect(deduplicateCitations([])).toHaveLength(0)
  })

  test('getCitationCoverageRate returns correct rate', () => {
    const output = {
      citations: [],
      inlineMarkups: [
        { text: 'a', citations: [{} as never], beforeText: '', afterText: '' },
        { text: 'b', citations: [], beforeText: '', afterText: '' },
        { text: 'c', citations: [{} as never], beforeText: '', afterText: '' },
      ],
      coverageRate: 0,
      totalCasesReferenced: 2,
    }
    expect(getCitationCoverageRate(output, 3)).toBeCloseTo(0.667)
  })

  test('getCitationCoverageRate returns 0 for zero sections', () => {
    const output = { citations: [], inlineMarkups: [], coverageRate: 0, totalCasesReferenced: 0 }
    expect(getCitationCoverageRate(output, 0)).toBe(0)
  })

  test('findRelevantCases returns citations for matching context', () => {
    const result = findRelevantCases([
      { topic: 'classic', sourceModules: ['patternEngine'], confidence: 0.9, keywords: ['甲木', '建禄格'] },
    ])
    expect(result.citations.length).toBeGreaterThan(0)
    expect(result.totalCasesReferenced).toBeGreaterThan(0)
  })

  test('findRelevantCases respects maxCitationsPerSection', () => {
    const result = findRelevantCases(
      [{ topic: 'classic', sourceModules: [], confidence: 1, keywords: ['甲木', '丁火', '庚金'] }],
      { maxCitationsPerSection: 1 }
    )
    expect(result.citations.length).toBeLessThanOrEqual(1)
  })

  test('findRelevantCases respects minRelevanceScore', () => {
    const result = findRelevantCases(
      [{ topic: 'nonexistent', sourceModules: [], confidence: 1, keywords: ['不存在的关键词'] }],
      { minRelevanceScore: 0.9 }
    )
    expect(result.citations).toHaveLength(0)
  })

  test('findRelevantCases with includeSnippets false returns empty snippets', () => {
    const result = findRelevantCases(
      [{ topic: 'classic', sourceModules: [], confidence: 1, keywords: ['甲木'] }],
      { includeSnippets: false }
    )
    for (const c of result.citations) {
      expect(c.snippet).toBe('')
    }
  })

  test('findRelevantCases with no matching context returns empty', () => {
    const result = findRelevantCases([
      { topic: 'nonexistent', sourceModules: [], confidence: 0.1, keywords: ['完全不相关'] },
    ])
    expect(result.citations).toHaveLength(0)
    expect(result.coverageRate).toBe(0)
  })

  test('findRelevantCases with multiple contexts produces multiple markups', () => {
    const result = findRelevantCases([
      { topic: 'classic', sourceModules: [], confidence: 0.9, keywords: ['甲木'] },
      { topic: 'edge', sourceModules: [], confidence: 0.8, keywords: ['壬水'] },
      { topic: 'unknown', sourceModules: [], confidence: 0.5, keywords: ['不存在'] },
    ])
    expect(result.inlineMarkups).toHaveLength(3)
  })

  test('DEFAULT_CITATION_RULES has 4 rules', () => {
    expect(DEFAULT_CITATION_RULES).toHaveLength(4)
    expect(DEFAULT_CITATION_RULES[0].field).toBe('category')
    expect(DEFAULT_CITATION_RULES[1].field).toBe('keywords')
  })

  test('DEFAULT_CITATION_OPTIONS has correct defaults', () => {
    expect(DEFAULT_CITATION_OPTIONS.maxCitationsPerSection).toBe(3)
    expect(DEFAULT_CITATION_OPTIONS.minRelevanceScore).toBe(0.3)
    expect(DEFAULT_CITATION_OPTIONS.defaultPosition).toBe('inline')
    expect(DEFAULT_CITATION_OPTIONS.includeSnippets).toBe(true)
  })

  test('calculateCitationRelevance with partial keyword match', () => {
    const score = calculateCitationRelevance(
      { category: 'classic', keywords: ['甲木', '寅月', '建禄格'], tags: ['木'], qualityScore: 0.9 },
      { topic: 'other', sourceModules: [], confidence: 1, keywords: ['甲'] }
    )
    expect(score).toBeGreaterThan(0)
  })
})