/**
 * 风水知识库 (Knowledge Base)
 * 
 * 架构：
 * Knowledge Base → Rule Engine → Explain Engine → AI Report → 产品
 * 
 * Rule 只保存 referenceId，Explain 从知识库读取
 * 
 * 目录结构：
 * classic/  - 古籍原文与解释
 * modern/   - 现代住宅风水
 * cases/    - 实战案例库
 * schools/  - 风水流派库
 * 
 * 未来支持 RAG（向量数据库检索）
 */

export * from './types'
export * from './classic'
export * from './modern'
export * from './cases'
export * from './schools'
export * from './explainEngine'

import { getKnowledgeStats, getKnowledgeOverview } from './explainEngine'
import { KNOWLEDGE_ENTRIES, CLASSIC_BOOKS, getBookById, getEntryById } from './classic'
import { MODERN_ENTRIES, getModernEntryById } from './modern'
import { FENGSHUI_CASES, getCaseById } from './cases'
import { FENGSHUI_SCHOOLS, getSchoolById } from './schools'

export const ALL_KNOWLEDGE_ENTRIES = [...KNOWLEDGE_ENTRIES, ...MODERN_ENTRIES]

/**
 * 知识库总览
 */
export const knowledgeBase = {
  stats: getKnowledgeStats(),
  overview: getKnowledgeOverview(),
  books: CLASSIC_BOOKS,
  classicEntries: KNOWLEDGE_ENTRIES,
  modernEntries: MODERN_ENTRIES,
  allEntries: ALL_KNOWLEDGE_ENTRIES,
  cases: FENGSHUI_CASES,
  schools: FENGSHUI_SCHOOLS,
  
  getBookById,
  getEntryById,
  getModernEntryById,
  getCaseById,
  getSchoolById,

  /**
   * 搜索知识库
   */
  search(query: string, limit = 5) {
    const q = query.toLowerCase()
    const results: any[] = []
    
    // 搜索古籍条目
    for (const entry of KNOWLEDGE_ENTRIES) {
      if (
        entry.id.toLowerCase().includes(q) ||
        entry.bookName.toLowerCase().includes(q) ||
        entry.topic.toLowerCase().includes(q) ||
        entry.original?.toLowerCase().includes(q) ||
        entry.translation?.toLowerCase().includes(q) ||
        entry.tags.some((t: string) => t.toLowerCase().includes(q))
      ) {
        results.push({ ...entry, type: 'classic', book: entry.bookName })
      }
      if (results.length >= limit) break
    }
    
    // 搜索案例
    if (results.length < limit) {
      for (const c of FENGSHUI_CASES) {
        if (
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        ) {
          results.push({ ...c, type: 'case', book: '案例库' })
        }
        if (results.length >= limit) break
      }
    }
    
    return results
  },
}

export default knowledgeBase
