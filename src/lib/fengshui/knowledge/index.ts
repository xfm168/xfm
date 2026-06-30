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
}

export default knowledgeBase
