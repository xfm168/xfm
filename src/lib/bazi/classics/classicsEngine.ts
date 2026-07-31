import type { Classic, ClassicChapter, ClassicParagraph, ClassicSentence, ClassicName, ClassicalKnowledgeEngine } from './types'
import { SEED_CLASSICS } from './seedData'

class ClassicsEngine implements ClassicalKnowledgeEngine {
  readonly name = 'ClassicalKnowledgeEngine'
  readonly version = '1.0.0'

  private classics = new Map<string, Classic>()
  private classicsByName = new Map<ClassicName, Classic>()
  private chapters = new Map<string, ClassicChapter>()
  private paragraphs = new Map<string, ClassicParagraph>()
  private sentences = new Map<string, ClassicSentence>()
  /** 概念索引：concept → sentenceId[] */
  private conceptIndex = new Map<string, Set<string>>()
  /** 规则索引：ruleId → sentenceId[] */
  private ruleIndex = new Map<string, Set<string>>()

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
          // 概念索引
          for (const concept of s.concepts) {
            if (!this.conceptIndex.has(concept)) this.conceptIndex.set(concept, new Set())
            this.conceptIndex.get(concept)!.add(s.id)
          }
          // 规则索引
          if (s.ruleIds) {
            for (const rid of s.ruleIds) {
              if (!this.ruleIndex.has(rid)) this.ruleIndex.set(rid, new Set())
              this.ruleIndex.get(rid)!.add(s.id)
            }
          }
        }
      }
    }
  }

  getClassic(id: string): Classic | undefined { return this.classics.get(id) }
  getClassicByName(name: ClassicName): Classic | undefined { return this.classicsByName.get(name) }
  getChapter(id: string): ClassicChapter | undefined { return this.chapters.get(id) }
  getParagraph(id: string): ClassicParagraph | undefined { return this.paragraphs.get(id) }
  getSentence(id: string): ClassicSentence | undefined { return this.sentences.get(id) }

  findChapter(classicName: ClassicName, chapterTitle: string): ClassicChapter | undefined {
    const c = this.classicsByName.get(classicName)
    if (!c) return undefined
    return c.chapters.find(ch => ch.title === chapterTitle || ch.title.includes(chapterTitle))
  }

  searchSentences(keyword: string, classicName?: ClassicName): ClassicSentence[] {
    const results: ClassicSentence[] = []
    const classics = classicName ? [this.classicsByName.get(classicName)].filter(Boolean) as Classic[] : Array.from(this.classics.values())
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

  listClassics(): Classic[] { return Array.from(this.classics.values()) }

  getStats() {
    return {
      totalClassics: this.classics.size,
      totalChapters: this.chapters.size,
      totalParagraphs: this.paragraphs.size,
      totalSentences: this.sentences.size,
    }
  }
}

export const globalClassicsEngine = new ClassicsEngine()
