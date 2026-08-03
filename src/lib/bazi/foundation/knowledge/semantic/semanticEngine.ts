/**
 * SemanticEngine（语义引擎）
 *
 * 把用户输入的自然语言（古籍原文、术语、口语化表述等），
 * 通过模糊匹配 + 变体权重 + 权威加成，映射到统一的 SemanticMapping 概念。
 *
 * 评分公式：
 *   score = (authoritative ? 1.2 : 1.0) × variant.confidence × textOverlap
 *
 * textOverlap = query 与 variant.originalText / variant.interpretation / unifiedConcept
 *               最大的字符级 Jaccard 系数（共享字符 / 并集字符）
 */

import type {
  SemanticMapping,
  SemanticCategory,
  SemanticResolution,
  SemanticVariant,
} from './types'
import { SEED_SEMANTIC_MAPPINGS } from './types'

/**
 * 字符级 Jaccard 相似度：|A∩B| / |A∪B|
 */
function jaccardChar(a: string, b: string): number {
  if (!a || !b) return 0
  const setA = new Set(a.split(''))
  const setB = new Set(b.split(''))
  let inter = 0
  for (const ch of setA) {
    if (setB.has(ch)) inter++
  }
  const union = setA.size + setB.size - inter
  return union === 0 ? 0 : inter / union
}

/**
 * 对查询文本与单条变体的原始文本、释义、统一概念算最大重叠
 */
function maxTextOverlap(query: string, concept: string, variant: SemanticVariant): number {
  const q = query.trim()
  if (!q) return 0
  const candidates = [
    concept,
    variant.originalText,
    variant.interpretation,
    variant.chapter ?? '',
  ]
  let max = 0
  for (const c of candidates) {
    if (!c) continue
    const sim = jaccardChar(q, c)
    if (sim > max) max = sim
    if (c.includes(q) || q.includes(c)) {
      max = Math.max(max, 0.6 + sim * 0.4)
    }
  }
  return max
}

/**
 * 语义引擎类
 */
export class SemanticEngine {
  /** 已注册的语义映射表 */
  private _mappings: SemanticMapping[] = []

  /** ID → Mapping 的索引 */
  private _byId: Map<string, SemanticMapping> = new Map()

  constructor(initialMappings: SemanticMapping[] = SEED_SEMANTIC_MAPPINGS) {
    for (const m of initialMappings) {
      this.registerMapping(m)
    }
  }

  /**
   * 注册/覆盖一个语义映射
   */
  registerMapping(mapping: SemanticMapping): void {
    const existing = this._byId.get(mapping.id)
    if (existing) {
      const idx = this._mappings.indexOf(existing)
      if (idx !== -1) this._mappings.splice(idx, 1)
    }
    this._mappings.push(mapping)
    this._byId.set(mapping.id, mapping)
  }

  /**
   * 解析文本：在全部或指定类别中寻找最佳匹配
   */
  resolve(text: string, category?: SemanticCategory): SemanticResolution {
    const reasoning: string[] = []
    reasoning.push(`查询文本："${text}"`)
    if (category) reasoning.push(`限定类别：${category}`)

    const pool = category
      ? this._mappings.filter((m) => m.category === category)
      : this._mappings

    const scored: Array<{ mapping: SemanticMapping; score: number; reasoning: string }> = []

    for (const m of pool) {
      let bestVariantScore = 0
      let bestVariantDesc = ''
      for (const v of m.variants) {
        const overlap = maxTextOverlap(text, m.unifiedConcept, v)
        if (overlap <= 0) continue
        const authMul = m.authoritative ? 1.2 : 1.0
        const score = authMul * v.confidence * overlap
        if (score > bestVariantScore) {
          bestVariantScore = score
          bestVariantDesc = `变体《${v.classicName}${v.chapter ? '·' + v.chapter : ''}》overlap=${overlap.toFixed(3)}×conf=${v.confidence}${authMul > 1 ? '×权威1.2' : ''}`
        }
      }
      if (bestVariantScore > 0) {
        scored.push({
          mapping: m,
          score: bestVariantScore,
          reasoning: bestVariantDesc,
        })
      }
    }

    scored.sort((a, b) => b.score - a.score)
    const candidates = scored.map((s) => s.mapping)

    if (scored.length === 0) {
      reasoning.push('未命中任何变体，返回空匹配')
      return {
        queryText: text,
        matched: null,
        candidates: [],
        confidence: 0,
        reasoning,
      }
    }

    for (const s of scored.slice(0, 5)) {
      reasoning.push(`候选 ${s.mapping.unifiedConcept} 得分 ${s.score.toFixed(4)} (${s.reasoning})`)
    }

    const top = scored[0]
    const matched = top.score >= 0.2 ? top.mapping : null

    return {
      queryText: text,
      matched,
      candidates: candidates.slice(0, 10),
      confidence: top.score,
      reasoning,
    }
  }

  /**
   * 针对特定古籍原文解析：优先匹配该古籍下的变体
   */
  resolveForClassic(classicName: string, originalText: string): SemanticResolution {
    const reasoning: string[] = []
    reasoning.push(`限定古籍解析：《${classicName}》原文："${originalText}"`)

    const base = this.resolve(originalText)
    const classicBoosted: Array<{ mapping: SemanticMapping; score: number; reason: string }> = []

    for (const m of this._mappings) {
      for (const v of m.variants) {
        if (v.classicName !== classicName) continue
        const overlap = maxTextOverlap(originalText, m.unifiedConcept, v)
        if (overlap <= 0) continue
        const authMul = m.authoritative ? 1.2 : 1.0
        const classicMul = 1.5
        const score = classicMul * authMul * v.confidence * overlap
        classicBoosted.push({
          mapping: m,
          score,
          reason: `经典加权 1.5×《${v.classicName}》overlap=${overlap.toFixed(3)}×conf=${v.confidence}${authMul > 1 ? '×权威1.2' : ''}`,
        })
      }
    }

    const combined = new Map<string, { mapping: SemanticMapping; score: number; reason: string }>()
    for (let i = 0; i < base.candidates.length; i++) {
      const cand = base.candidates[i]
      combined.set(cand.id, {
        mapping: cand,
        score: Math.max(0, base.confidence - i * 0.05),
        reason: '基础匹配',
      })
    }
    for (const b of classicBoosted) {
      const existing = combined.get(b.mapping.id)
      if (!existing || b.score > existing.score) {
        combined.set(b.mapping.id, b)
      }
    }

    const ranked = Array.from(combined.values()).sort((a, b) => b.score - a.score)
    const candidates = ranked.map((r) => r.mapping)

    for (const r of ranked.slice(0, 5)) {
      reasoning.push(`候选 ${r.mapping.unifiedConcept} 得分 ${r.score.toFixed(4)} (${r.reason})`)
    }

    const top = ranked[0]
    const matched = top && top.score >= 0.2 ? top.mapping : null

    return {
      queryText: originalText,
      matched,
      candidates: candidates.slice(0, 10),
      confidence: top ? top.score : 0,
      reasoning,
    }
  }

  /**
   * 按统一概念名查询映射（模糊包含，返回多个）
   */
  getMappingsByConcept(concept: string): SemanticMapping[] {
    const q = concept.trim()
    const results: Array<{ m: SemanticMapping; sim: number }> = []
    for (const m of this._mappings) {
      let sim = jaccardChar(q, m.unifiedConcept)
      if (m.unifiedConcept.includes(q) || q.includes(m.unifiedConcept)) {
        sim = Math.max(sim, 0.8)
      }
      if (sim > 0) results.push({ m, sim })
    }
    results.sort((a, b) => b.sim - a.sim)
    return results.map((r) => r.m)
  }

  /**
   * 按类别筛选映射
   */
  getMappingsByCategory(category: SemanticCategory): SemanticMapping[] {
    return this._mappings.filter((m) => m.category === category)
  }

  /**
   * 全部映射（返回副本，不暴露内部数组）
   */
  getAllMappings(): SemanticMapping[] {
    return this._mappings.slice()
  }

  /**
   * 取高争议概念（controversyLevel > 0.5）
   */
  getControversial(): SemanticMapping[] {
    return this._mappings.filter((m) => m.controversyLevel > 0.5)
  }
}

/** 全局语义引擎单例 */
export const globalSemanticEngine = new SemanticEngine()
