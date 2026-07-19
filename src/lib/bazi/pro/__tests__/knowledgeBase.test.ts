import { describe, it, expect } from 'vitest'
import {
  KNOWLEDGE_BASE,
  getKnowledgeByCategory,
  getKnowledgeBySource,
  getKnowledgeById,
  getAllKnowledge,
} from '../knowledgeBaseDatabase'

describe('KNOWLEDGE_BASE', () => {
  it('should have at least 76 entries', () => {
    expect(KNOWLEDGE_BASE.length).toBeGreaterThanOrEqual(76)
  })

  it('should have sequential IDs from KB-001 to KB-076', () => {
    const ids = KNOWLEDGE_BASE.map((e) => e.id)
    for (let i = 1; i <= 76; i++) {
      const id = `KB-${String(i).padStart(3, '0')}`
      expect(ids).toContain(id)
    }
  })

  it('should have no duplicate IDs', () => {
    const ids = KNOWLEDGE_BASE.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('should have valid categories for all entries', () => {
    const validCategories = [
      '四柱', '神煞', '十神', '格局', '喜用神',
      '大运', '流年', '命局总论', '五行', '调候',
      '合化', '冲刑', '事业', '财运', '婚姻',
      '健康', '学业', '风水', '其他',
    ]
    for (const entry of KNOWLEDGE_BASE) {
      expect(validCategories).toContain(entry.category)
    }
  })

  it('should have valid sources for all entries', () => {
    const validSources = [
      '滴天髓', '子平真诠', '三命通会', '穷通宝鉴',
      '渊海子平', '神峰通考', '协纪辨方书',
    ]
    for (const entry of KNOWLEDGE_BASE) {
      expect(validSources).toContain(entry.source)
    }
  })

  it('should have valid citation levels', () => {
    const validLevels = ['primary', 'secondary', 'tertiary']
    for (const entry of KNOWLEDGE_BASE) {
      expect(validLevels).toContain(entry.citationLevel)
    }
  })

  it('should have confidence values between 0 and 1', () => {
    for (const entry of KNOWLEDGE_BASE) {
      expect(entry.confidence).toBeGreaterThanOrEqual(0)
      expect(entry.confidence).toBeLessThanOrEqual(1)
    }
  })

  it('should have non-empty originalText and modernExplanation', () => {
    for (const entry of KNOWLEDGE_BASE) {
      expect(entry.originalText.length).toBeGreaterThan(0)
      expect(entry.modernExplanation.length).toBeGreaterThan(0)
    }
  })

  it('should have non-empty keywords array', () => {
    for (const entry of KNOWLEDGE_BASE) {
      expect(entry.keywords.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('should have valid association types', () => {
    const validTypes = ['十神', '格局', '喜用神', '神煞', '五行', '大运', '流年', '章节']
    for (const entry of KNOWLEDGE_BASE) {
      for (const assoc of entry.associations) {
        expect(validTypes).toContain(assoc.type)
        expect(assoc.value.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('Query functions', () => {
  it('getKnowledgeByCategory returns correct entries', () => {
    const shiShen = getKnowledgeByCategory('十神')
    expect(shiShen.length).toBeGreaterThanOrEqual(1)
    shiShen.forEach((e) => expect(e.category).toBe('十神'))
  })

  it('getKnowledgeBySource returns correct entries', () => {
    const diTianSui = getKnowledgeBySource('滴天髓')
    expect(diTianSui.length).toBeGreaterThanOrEqual(1)
    diTianSui.forEach((e) => expect(e.source).toBe('滴天髓'))
  })

  it('getKnowledgeById returns the correct entry', () => {
    const entry = getKnowledgeById('KB-001')
    expect(entry).toBeDefined()
    expect(entry!.id).toBe('KB-001')
  })

  it('getKnowledgeById returns undefined for non-existent ID', () => {
    const entry = getKnowledgeById('KB-999')
    expect(entry).toBeUndefined()
  })

  it('getAllKnowledge returns a copy of the knowledge base', () => {
    const all = getAllKnowledge()
    expect(all.length).toBe(KNOWLEDGE_BASE.length)
    // Verify it's a copy, not the same reference
    expect(all).not.toBe(KNOWLEDGE_BASE)
  })
})

describe('Phase 4 expansion coverage', () => {
  it('should have entries in all 10 required categories', () => {
    const categories = new Set(KNOWLEDGE_BASE.map((e) => e.category))
    expect(categories.has('十神')).toBe(true)
    expect(categories.has('格局')).toBe(true)
    expect(categories.has('喜用神')).toBe(true)
    expect(categories.has('合化')).toBe(true)
    expect(categories.has('冲刑')).toBe(true)
    expect(categories.has('五行')).toBe(true)
    expect(categories.has('大运')).toBe(true)
    expect(categories.has('流年')).toBe(true)
    expect(categories.has('神煞')).toBe(true)
    expect(categories.has('事业')).toBe(true)
    expect(categories.has('财运')).toBe(true)
    expect(categories.has('婚姻')).toBe(true)
  })

  it('KB-027 to KB-076 should be new entries (Phase 4)', () => {
    for (let i = 27; i <= 76; i++) {
      const id = `KB-${String(i).padStart(3, '0')}`
      const entry = getKnowledgeById(id)
      expect(entry).toBeDefined()
    }
  })
})