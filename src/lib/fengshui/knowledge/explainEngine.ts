/**
 * Explain Engine - 独立的解释生成引擎
 * 
 * 输入：Rule Result + referenceId
 * 输出：三段式 Explain（古籍依据 + 实际解释 + 改善建议）
 * 
 * 所有 Rule 共用，未来支持 RAG
 */

import { 
  KNOWLEDGE_ENTRIES, 
  CLASSIC_BOOKS,
  getEntryById, 
  getEntriesByBook,
  searchEntries,
} from './classic'
import { 
  MODERN_ENTRIES,
  getModernEntryById,
} from './modern'
import { 
  FENGSHUI_CASES, 
  getCaseById, 
  searchCases,
  matchCasesByFeatures,
} from './cases'
import { 
  FENGSHUI_SCHOOLS, 
  getSchoolById,
} from './schools'
import type { 
  KnowledgeEntry, 
  FengShuiCase, 
  ExplainInput, 
  ExplainOutput,
  RAGResult,
  FengShuiSchool,
} from './types'
import type { FengShuiRule } from '../types'

/**
 * 生成三段式 Explain
 */
export function generateExplain(
  rule: FengShuiRule,
  matched: boolean,
  context: any
): ExplainOutput {
  const referenceIds = (rule as any).referenceIds || []
  
  // 1. 从知识库读取古籍依据
  const classicalRefs = getClassicalReferences(referenceIds, rule)
  
  // 2. 生成实际解释
  const practicalExplanation = generatePracticalExplanation(rule, matched, context)
  
  // 3. 生成改善建议
  const suggestions = generateSuggestions(rule, matched, context, referenceIds)
  
  // 4. 匹配相关案例
  const relatedCases = findRelatedCases(rule, context)
  
  // 5. AI解读（预留）
  const aiInterpretation = generateAIInterpretation(rule, classicalRefs, context)
  
  return {
    classicalRefs,
    practicalExplanation,
    suggestions,
    relatedCases,
    aiInterpretation,
  }
}

/**
 * 批量生成 Explain
 */
export function generateBatchExplains(
  matchedRules: FengShuiRule[],
  context: any
): {
  allClassicalRefs: ExplainOutput['classicalRefs']
  allSuggestions: string[]
  allCases: FengShuiCase[]
  goodExplanations: string[]
  badExplanations: string[]
} {
  const allClassicalRefs: ExplainOutput['classicalRefs'] = []
  const allSuggestions: string[] = []
  const allCases: FengShuiCase[] = []
  const goodExplanations: string[] = []
  const badExplanations: string[] = []
  
  for (const rule of matchedRules) {
    const explain = generateExplain(rule, true, context)
    
    allClassicalRefs.push(...explain.classicalRefs)
    allSuggestions.push(...explain.suggestions)
    allCases.push(...explain.relatedCases)
    
    const result = rule.result as any
    if (result?.score >= 75) {
      goodExplanations.push(`${rule.name}：${result.explanation || ''}`)
    } else if (result?.score < 55) {
      badExplanations.push(`${rule.name}：${result.explanation || ''}`)
    }
  }
  
  // 去重
  const uniqueRefs = allClassicalRefs.filter((ref, idx, arr) => 
    arr.findIndex(r => r.quote === ref.quote) === idx
  )
  const uniqueSuggestions = [...new Set(allSuggestions)]
  const uniqueCases = allCases.filter((c, idx, arr) =>
    arr.findIndex(x => x.id === c.id) === idx
  )
  
  return {
    allClassicalRefs: uniqueRefs.slice(0, 8),
    allSuggestions: uniqueSuggestions.slice(0, 10),
    allCases: uniqueCases.slice(0, 5),
    goodExplanations: [...new Set(goodExplanations)].slice(0, 10),
    badExplanations: [...new Set(badExplanations)].slice(0, 10),
  }
}

// ============ 古籍依据 ============

function getClassicalReferences(
  referenceIds: string[],
  rule: FengShuiRule
): ExplainOutput['classicalRefs'] {
  const refs: ExplainOutput['classicalRefs'] = []
  
  // 优先用 referenceId 查找
  for (const refId of referenceIds) {
    const entry = getEntryById(refId)
    if (entry) {
      refs.push({
        book: entry.bookName,
        chapter: entry.chapter,
        quote: entry.original || entry.translation || '',
        translation: entry.translation,
        school: entry.school[0] || 'zangfeng',
      })
    }
  }
  
  // 如果没有 referenceId，用关键词搜索
  if (refs.length === 0) {
    const keywords = extractKeywords(rule)
    const matchedEntries = searchEntries(keywords.join(' '))
    
    for (const entry of matchedEntries.slice(0, 3)) {
      refs.push({
        book: entry.bookName,
        chapter: entry.chapter,
        quote: entry.original || entry.translation || '',
        translation: entry.translation,
        school: entry.school[0] || 'zangfeng',
      })
    }
  }
  
  return refs
}

// ============ 实际解释 ============

function generatePracticalExplanation(
  rule: FengShuiRule,
  matched: boolean,
  context: any
): string {
  const result = rule.result as any
  
  if (matched) {
    return result?.explanation || rule.description || ''
  } else {
    return `当前住宅不满足"${rule.name}"的条件。`
  }
}

// ============ 改善建议 ============

function generateSuggestions(
  rule: FengShuiRule,
  matched: boolean,
  context: any,
  referenceIds: string[]
): string[] {
  const suggestions: string[] = []
  const result = rule.result as any
  
  // 如果是负面规则，添加改善建议
  if (matched && result?.score < 60) {
    // 优先从知识库取 practicalAdvice
    for (const refId of referenceIds) {
      const entry = getEntryById(refId)
      if (entry?.modern) {
        suggestions.push(entry.modern)
      }
    }
    
    // 如果有 practicalAdvice 直接用
    if (result?.practicalAdvice) {
      suggestions.push(result.practicalAdvice)
    }
  }
  
  // 如果是正面规则，保持建议
  if (matched && result?.score >= 75) {
    if (result?.practicalAdvice) {
      suggestions.push(`保持：${result.practicalAdvice}`)
    }
  }
  
  return suggestions
}

// ============ 案例匹配 ============

function findRelatedCases(
  rule: FengShuiRule,
  context: any
): FengShuiCase[] {
  // 用 rule 的 tag 匹配案例
  const features = rule.tags
  return matchCasesByFeatures(features).slice(0, 3)
}

// ============ AI解读 ============

function generateAIInterpretation(
  rule: FengShuiRule,
  refs: ExplainOutput['classicalRefs'],
  context: any
): string | undefined {
  // 预留接口，未来调用真实AI
  // 目前从知识库的 ai 字段取
  const refId = (rule as any).referenceIds?.[0]
  if (refId) {
    const entry = getEntryById(refId)
    if (entry?.ai) {
      return entry.ai
    }
  }
  return undefined
}

// ============ RAG 检索 ============

/**
 * RAG 检索 - 自然语言查询知识库
 */
export function ragQuery(query: string): RAGResult {
  const results: RAGResult['results'] = []
  
  // 提取关键词（中文分词简化版）
  const keywords = extractChineseKeywords(query)
  
  // 搜索古籍
  const classicMatches = searchEntriesByKeywords(keywords)
  for (const { entry, score } of classicMatches.slice(0, 3)) {
    results.push({
      type: 'classic',
      id: entry.id,
      title: entry.topic,
      content: entry.translation || entry.original || '',
      relevance: Math.min(95, score),
      source: entry.bookName,
    })
  }
  
  // 搜索案例
  const caseMatches = searchCasesByKeywords(keywords)
  for (const { caseItem, score } of caseMatches.slice(0, 3)) {
    results.push({
      type: 'case',
      id: caseItem.id,
      title: caseItem.title,
      content: caseItem.description,
      relevance: Math.min(95, score),
      source: '案例库',
    })
  }
  
  // 按相关性排序
  results.sort((a, b) => b.relevance - a.relevance)
  
  // 生成回答
  const answer = generateRAGAnswer(query, results)
  
  return {
    query,
    results: results.slice(0, 10),
    answer,
    confidence: results.length > 0 ? 60 + Math.min(30, results.length * 10) : 30,
  }
}

// ============ 中文关键词提取 ============

function extractChineseKeywords(query: string): string[] {
  const keywords: string[] = []
  
  // 常见风水术语
  const terms = [
    '坐北朝南', '穿堂煞', '横梁', '压床', '压顶', '路冲',
    '开门见灶', '缺角', '中宫', '厕压', '卫生间', '厨房',
    '大门', '朝向', '风水', '吉凶', '化解', '为什么', '怎么办',
    '好不好', '可以吗', '应该', '建议',
    '木', '火', '土', '金', '水', '五行',
    '八宅', '玄空', '三合', '藏风', '聚气',
    '床', '灶', '门', '窗', '镜子',
    '财运', '健康', '事业', '感情', '婚姻',
  ]
  
  for (const term of terms) {
    if (query.includes(term)) {
      keywords.push(term)
    }
  }
  
  // 如果没有提取到术语，用单字（简化处理）
  if (keywords.length === 0) {
    for (let i = 0; i < query.length; i++) {
      const char = query[i]
      if (char.length > 0 && /[\u4e00-\u9fa5]/.test(char)) {
        keywords.push(char)
      }
    }
  }
  
  return [...new Set(keywords)]
}

function searchEntriesByKeywords(keywords: string[]): { entry: KnowledgeEntry; score: number }[] {
  const allEntries = [...KNOWLEDGE_ENTRIES, ...MODERN_ENTRIES]
  const results: { entry: KnowledgeEntry; score: number }[] = []
  
  for (const entry of allEntries) {
    let score = 0
    const text = [
      entry.topic,
      ...(entry.tags || []),
      entry.original || '',
      entry.translation || '',
      entry.modern || '',
      entry.ai || '',
      entry.bookName,
      entry.chapter || '',
      entry.section || '',
    ].join(' ')
    
    for (const kw of keywords) {
      if (text.includes(kw)) {
        score += 20
      }
    }
    
    if (score > 0) {
      results.push({ entry, score })
    }
  }
  
  return results.sort((a, b) => b.score - a.score)
}

function searchCasesByKeywords(keywords: string[]): { caseItem: FengShuiCase; score: number }[] {
  const results: { caseItem: FengShuiCase; score: number }[] = []
  
  for (const caseItem of FENGSHUI_CASES) {
    let score = 0
    const text = [
      caseItem.title,
      caseItem.description,
      ...(caseItem.characteristics || []),
      ...(caseItem.effects || []),
      ...(caseItem.solutions || []),
    ].join(' ')
    
    for (const kw of keywords) {
      if (text.includes(kw)) {
        score += 25
      }
    }
    
    if (score > 0) {
      results.push({ caseItem, score })
    }
  }
  
  return results.sort((a, b) => b.score - a.score)
}

function generateRAGAnswer(query: string, results: RAGResult['results']): string | undefined {
  if (results.length === 0) return undefined
  
  // 简单拼接前几个结果
  const topResults = results.slice(0, 3)
  const summary = topResults.map(r => `【${r.source}】${r.title}：${r.content.slice(0, 100)}...`).join('\n')
  
  return `根据知识库检索，关于"${query}"的相关内容如下：\n\n${summary}\n\n以上信息仅供参考，具体情况建议咨询专业人士。`
}

// ============ 辅助函数 ============

function extractKeywords(rule: FengShuiRule): string[] {
  const keywords: string[] = []
  keywords.push(rule.name)
  keywords.push(...rule.tags)
  keywords.push(rule.category)
  
  // 取 name 中的关键词
  const nameWords = rule.name.split(/[、，。\s]+/).filter(w => w.length > 1)
  keywords.push(...nameWords)
  
  return keywords
}

// ============ 知识库总览 ============

export function getKnowledgeStats() {
  return {
    classicBooks: CLASSIC_BOOKS.length,
    classicEntries: KNOWLEDGE_ENTRIES.length,
    modernEntries: MODERN_ENTRIES.length,
    totalEntries: KNOWLEDGE_ENTRIES.length + MODERN_ENTRIES.length,
    cases: FENGSHUI_CASES.length,
    schools: FENGSHUI_SCHOOLS.length,
  }
}

export function getKnowledgeOverview() {
  const stats = getKnowledgeStats()
  return {
    ...stats,
    classicList: KNOWLEDGE_ENTRIES.slice(0, 5).map(e => ({
      id: e.id,
      book: e.bookName,
      topic: e.topic,
    })),
    modernList: MODERN_ENTRIES.slice(0, 3).map(e => ({
      id: e.id,
      book: e.bookName,
      topic: e.topic,
    })),
    caseList: FENGSHUI_CASES.slice(0, 5).map(c => ({
      id: c.id,
      title: c.title,
      type: c.type,
    })),
    schoolList: FENGSHUI_SCHOOLS.map(s => ({
      id: s.id,
      name: s.name,
    })),
  }
}
