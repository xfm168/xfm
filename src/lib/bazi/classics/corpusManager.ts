import type { Classic, ClassicChapter, ClassicParagraph, ClassicSentence, ClassicalCorpusManager, CorpusStats } from './types'
import { SEED_CLASSICS } from './seedData'

/**
 * C7 Classical Corpus（古籍语料中心）
 *
 * 统一管理所有命理经典，支持动态注册新经典。
 * 后续可扩展加入《五行精纪》《命理约言》《子平粹言》等。
 */
class CorpusManager implements ClassicalCorpusManager {
  readonly name = 'ClassicalCorpus'
  readonly version = '1.0.0'

  private classics = new Map<string, Classic>()
  private classicsByName = new Map<string, Classic>()
  private chapters = new Map<string, ClassicChapter>()
  private paragraphs = new Map<string, ClassicParagraph>()
  private sentences = new Map<string, ClassicSentence>()
  private conceptIndex = new Map<string, Set<string>>()
  private ruleIndex = new Map<string, Set<string>>()
  private keywordIndex = new Map<string, Set<string>>()
  private evidenceNodeIndex = new Map<string, Set<string>>()
  private knowledgeNodeIndex = new Map<string, Set<string>>()

  constructor() {
    for (const c of SEED_CLASSICS) {
      this.registerClassic(c)
    }
  }

  registerClassic(c: Classic): void {
    this.classics.set(c.id, c)
    this.classicsByName.set(c.name, c)
    for (const ch of c.chapters) {
      this.chapters.set(ch.id, ch)
      for (const p of ch.paragraphs) {
        this.paragraphs.set(p.id, p)
        for (const s of p.sentences) {
          this.sentences.set(s.id, s)
          for (const concept of (s.concepts ?? [])) {
            if (!this.conceptIndex.has(concept)) this.conceptIndex.set(concept, new Set())
            this.conceptIndex.get(concept)!.add(s.id)
          }
          if (s.ruleIds) {
            for (const rid of s.ruleIds) {
              if (!this.ruleIndex.has(rid)) this.ruleIndex.set(rid, new Set())
              this.ruleIndex.get(rid)!.add(s.id)
            }
          }
          for (const kw of (s.keywords ?? [])) {
            if (!this.keywordIndex.has(kw)) this.keywordIndex.set(kw, new Set())
            this.keywordIndex.get(kw)!.add(s.id)
          }
          for (const en of (s.evidenceNodes ?? [])) {
            if (!this.evidenceNodeIndex.has(en)) this.evidenceNodeIndex.set(en, new Set())
            this.evidenceNodeIndex.get(en)!.add(s.id)
          }
          for (const kn of (s.knowledgeNodes ?? [])) {
            if (!this.knowledgeNodeIndex.has(kn)) this.knowledgeNodeIndex.set(kn, new Set())
            this.knowledgeNodeIndex.get(kn)!.add(s.id)
          }
        }
      }
    }
  }

  unregisterClassic(classicId: string): boolean {
    const c = this.classics.get(classicId)
    if (!c) return false
    this.classics.delete(classicId)
    this.classicsByName.delete(c.name)
    for (const ch of c.chapters) {
      this.chapters.delete(ch.id)
      for (const p of ch.paragraphs) {
        this.paragraphs.delete(p.id)
        for (const s of p.sentences) {
          this.sentences.delete(s.id)
        }
      }
    }
    return true
  }

  getClassic(id: string): Classic | undefined { return this.classics.get(id) }
  getClassicByName(name: string): Classic | undefined { return this.classicsByName.get(name) }
  getSentence(id: string): ClassicSentence | undefined { return this.sentences.get(id) }
  getChapter(id: string): ClassicChapter | undefined { return this.chapters.get(id) }
  getParagraph(id: string): ClassicParagraph | undefined { return this.paragraphs.get(id) }
  hasClassic(classicId: string): boolean { return this.classics.has(classicId) }

  findChapter(classicName: string, chapterTitle: string): ClassicChapter | undefined {
    const c = this.classicsByName.get(classicName)
    if (!c) return undefined
    return c.chapters.find(ch => ch.title === chapterTitle || ch.title.includes(chapterTitle))
  }

  searchSentences(keyword: string, classicName?: string): ClassicSentence[] {
    const results: ClassicSentence[] = []
    const classics = classicName
      ? [this.classicsByName.get(classicName)].filter(Boolean) as Classic[]
      : Array.from(this.classics.values())
    for (const c of classics) {
      for (const ch of c.chapters) {
        for (const p of ch.paragraphs) {
          for (const s of p.sentences) {
            if (s.originalText.includes(keyword) || s.translation.includes(keyword)) {
              results.push(s)
            }
          }
        }
      }
    }
    return results
  }

  searchByKeywords(keyword: string): ClassicSentence[] {
    // 精确匹配 keywords
    const exact = this.keywordIndex.get(keyword)
    if (exact) {
      return Array.from(exact).map(id => this.sentences.get(id)!).filter(Boolean)
    }
    // 模糊匹配 keywords
    const results: ClassicSentence[] = []
    for (const [kw, ids] of this.keywordIndex) {
      if (kw.includes(keyword) || keyword.includes(kw)) {
        for (const id of ids) {
          const s = this.sentences.get(id)
          if (s && !results.includes(s)) results.push(s)
        }
      }
    }
    return results
  }

  findByConcept(concept: string): ClassicSentence[] {
    const ids = this.conceptIndex.get(concept)
    if (!ids) return []
    return Array.from(ids).map(id => this.sentences.get(id)!).filter(Boolean)
  }

  findByRuleId(ruleId: string): ClassicSentence[] {
    const ids = this.ruleIndex.get(ruleId)
    if (!ids) return []
    return Array.from(ids).map(id => this.sentences.get(id)!).filter(Boolean)
  }

  findByEvidenceNode(nodeId: string): ClassicSentence[] {
    const ids = this.evidenceNodeIndex.get(nodeId)
    if (!ids) return []
    return Array.from(ids).map(id => this.sentences.get(id)!).filter(Boolean)
  }

  findByKnowledgeNode(nodeId: string): ClassicSentence[] {
    const ids = this.knowledgeNodeIndex.get(nodeId)
    if (!ids) return []
    return Array.from(ids).map(id => this.sentences.get(id)!).filter(Boolean)
  }

  listClassics(): Classic[] { return Array.from(this.classics.values()) }

  getStats(): CorpusStats {
    const byClassic = Array.from(this.classics.values()).map(c => ({
      id: c.id,
      name: c.name,
      chapters: c.chapters.length,
      paragraphs: c.chapters.reduce((sum, ch) => sum + ch.paragraphs.length, 0),
      sentences: c.chapters.reduce((sum, ch) =>
        sum + ch.paragraphs.reduce((s2, p) => s2 + p.sentences.length, 0), 0),
      version: c.chapters[0]?.paragraphs[0]?.sentences[0]?.classicVersion,
    }))

    const copyrightDistribution: Record<string, number> = {}
    for (const s of this.sentences.values()) {
      const status = s.copyrightStatus ?? 'public_domain'
      copyrightDistribution[status] = (copyrightDistribution[status] ?? 0) + 1
    }

    return {
      totalClassics: this.classics.size,
      totalChapters: this.chapters.size,
      totalParagraphs: this.paragraphs.size,
      totalSentences: this.sentences.size,
      byClassic,
      copyrightDistribution,
    }
  }
}

/** 全局 Corpus 管理器单例 */
export const globalCorpus = new CorpusManager()
