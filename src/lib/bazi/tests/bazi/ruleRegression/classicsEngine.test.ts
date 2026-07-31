import { describe, it, expect } from 'vitest'
import { globalClassicsEngine } from '../../../classics'

describe('C6-1 古籍知识引擎', () => {
  it('7 部经典全部注册', () => {
    const stats = globalClassicsEngine.getStats()
    expect(stats.totalClassics).toBeGreaterThanOrEqual(7)
    expect(stats.totalChapters).toBeGreaterThanOrEqual(20)
    expect(stats.totalParagraphs).toBeGreaterThanOrEqual(50)
    expect(stats.totalSentences).toBeGreaterThanOrEqual(120)
  })

  it('getSentence 精确定位到句子', () => {
    const s = globalClassicsEngine.getSentence('dts-c1-p1-s1')
    expect(s).toBeDefined()
    expect(s!.originalText).toBeTruthy()
    expect(s!.translation).toBeTruthy()
    expect(s!.concepts.length).toBeGreaterThan(0)
  })

  it('searchSentences 关键词搜索', () => {
    const results = globalClassicsEngine.searchSentences('用神')
    expect(results.length).toBeGreaterThan(0)
  })

  it('findByConcept 按概念查找', () => {
    const results = globalClassicsEngine.findByConcept('月令')
    expect(results.length).toBeGreaterThan(0)
  })

  it('findByRuleId 按规则反查', () => {
    const results = globalClassicsEngine.findByRuleId('GEJU-ZHENG-001')
    expect(results.length).toBeGreaterThan(0)
  })

  it('每部经典有完整的四层结构', () => {
    const classics = globalClassicsEngine.listClassics()
    for (const c of classics) {
      expect(c.chapters.length).toBeGreaterThan(0)
      for (const ch of c.chapters) {
        expect(ch.paragraphs.length).toBeGreaterThan(0)
        for (const p of ch.paragraphs) {
          expect(p.sentences.length).toBeGreaterThan(0)
        }
      }
    }
  })
})
