/**
 * 风水知识库 (Knowledge Base)
 * 
 * 架构：
 * Knowledge Base → Rule Engine → Explain Engine → AI Report → 产品
 * 
 * Rule 只保存 referenceId，Explain 从知识库读取
 * 
 * 目录结构：
 * classic/      - 古籍原文与解释
 * modern/       - 现代住宅风水
 * cases/        - 实战案例库
 * schools/      - 风水流派库
 * plants/       - 植物风水
 * colors/       - 颜色风水
 * materials/    - 材料风水
 * symbols/      - 符号/摆件风水
 * 
 * 未来支持 RAG（向量数据库检索）
 */

export * from './types'
export * from './classic'
export * from './modern'
export * from './cases'
export * from './schools'
export * from './plants'
export * from './colors'
export * from './materials'
export * from './symbols'
export * from './explainEngine'

import { getKnowledgeStats, getKnowledgeOverview } from './explainEngine'
import { KNOWLEDGE_ENTRIES, CLASSIC_BOOKS, getBookById, getEntryById } from './classic'
import { MODERN_ENTRIES, getModernEntryById } from './modern'
import { FENGSHUI_CASES, getCaseById } from './cases'
import { FENGSHUI_SCHOOLS, getSchoolById } from './schools'
import { PLANTS, getPlantById } from './plants'
import { COLORS, getColorByName } from './colors'
import { MATERIALS, getMaterialById } from './materials'
import { SYMBOLS, getSymbolById } from './symbols'

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
  plants: PLANTS,
  colors: COLORS,
  materials: MATERIALS,
  symbols: SYMBOLS,
  
  getBookById,
  getEntryById,
  getModernEntryById,
  getCaseById,
  getSchoolById,
  getPlantById,
  getColorByName,
  getMaterialById,
  getSymbolById,

  /**
   * 搜索知识库（全库搜索）
   */
  search(query: string, limit = 5) {
    const q = query.toLowerCase()
    const results: any[] = []
    
    // 搜索古籍条目
    for (const entry of KNOWLEDGE_ENTRIES) {
      if (results.length >= limit) break
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
    }
    
    // 搜索案例
    if (results.length < limit) {
      for (const c of FENGSHUI_CASES) {
        if (results.length >= limit) break
        if (
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        ) {
          results.push({ ...c, type: 'case', book: '案例库' })
        }
      }
    }

    // 搜索植物
    if (results.length < limit) {
      for (const p of PLANTS) {
        if (results.length >= limit) break
        if (
          p.id.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q)) ||
          p.suitableLocations.some(l => l.toLowerCase().includes(q))
        ) {
          results.push({ ...p, type: 'plant', book: '植物风水' })
        }
      }
    }

    // 搜索颜色
    if (results.length < limit) {
      for (const c of COLORS) {
        if (results.length >= limit) break
        if (
          c.id.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.tags.some(t => t.toLowerCase().includes(q))
        ) {
          results.push({ ...c, type: 'color', book: '颜色风水' })
        }
      }
    }

    // 搜索符号/摆件
    if (results.length < limit) {
      for (const s of SYMBOLS) {
        if (results.length >= limit) break
        if (
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.tags.some(t => t.toLowerCase().includes(q))
        ) {
          results.push({ ...s, type: 'symbol', book: '摆件风水' })
        }
      }
    }
    
    return results
  },

  /**
   * 扩展统计（含植物/颜色/材料/符号）
   */
  getExtendedStats() {
    return {
      classicBooks: CLASSIC_BOOKS.length,
      classicEntries: KNOWLEDGE_ENTRIES.length,
      modernEntries: MODERN_ENTRIES.length,
      cases: FENGSHUI_CASES.length,
      schools: FENGSHUI_SCHOOLS.length,
      plants: PLANTS.length,
      colors: COLORS.length,
      materials: MATERIALS.length,
      symbols: SYMBOLS.length,
      total: 
        CLASSIC_BOOKS.length +
        KNOWLEDGE_ENTRIES.length +
        MODERN_ENTRIES.length +
        FENGSHUI_CASES.length +
        FENGSHUI_SCHOOLS.length +
        PLANTS.length +
        COLORS.length +
        MATERIALS.length +
        SYMBOLS.length,
    }
  },
}

export default knowledgeBase
