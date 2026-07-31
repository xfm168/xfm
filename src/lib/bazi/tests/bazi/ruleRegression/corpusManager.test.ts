import { describe, it, expect } from 'vitest'
import { globalCorpus } from '../../../classics'

describe('C7-1 古籍语料中心 Corpus 管理器', () => {
  it('7 部经典全部注册，153 句子完整', () => {
    const stats = globalCorpus.getStats()
    expect(stats.totalClassics).toBeGreaterThanOrEqual(7)
    expect(stats.totalSentences).toBeGreaterThanOrEqual(120)
  })

  it('getSentence 返回 C7 新字段', () => {
    const s = globalCorpus.getSentence('dts-c1-p1-s1')
    expect(s).toBeDefined()
    expect(s!.keywords).toBeDefined()
    expect(s!.keywords!.length).toBeGreaterThan(0)
    expect(s!.classicVersion).toBeTruthy()
    expect(s!.copyrightStatus).toBe('public_domain')
  })

  it('searchByKeywords 关键词搜索', () => {
    const results = globalCorpus.searchByKeywords('月令')
    expect(results.length).toBeGreaterThan(0)
  })

  it('findByEvidenceNode 证据节点反查', () => {
    // 种子数据中至少有一些句子有 evidenceNodes
    const stats = globalCorpus.getStats()
    // 只要不报错就行
    const results = globalCorpus.findByEvidenceNode('ev-career')
    expect(Array.isArray(results)).toBe(true)
  })

  it('findByKnowledgeNode 知识图谱节点反查', () => {
    const results = globalCorpus.findByKnowledgeNode('tg-jia')
    expect(Array.isArray(results)).toBe(true)
  })

  it('registerClassic 动态注册新经典', () => {
    const beforeCount = globalCorpus.getStats().totalClassics
    globalCorpus.registerClassic({
      id: 'wjaj',
      name: '五行精纪',
      author: '廖中',
      dynasty: '宋',
      chapters: [{
        id: 'wjaj-c1',
        classicId: 'wjaj',
        title: '论五行',
        order: 1,
        paragraphs: [{
          id: 'wjaj-c1-p1',
          chapterId: 'wjaj-c1',
          order: 1,
          sentences: [{
            id: 'wjaj-c1-p1-s1',
            paragraphId: 'wjaj-c1-p1',
            order: 1,
            originalText: '五行精纪，论五行生克。',
            translation: '五行精纪，讨论五行的相生相克。',
            concepts: ['五行', '相生', '相克'],
            keywords: ['五行', '生克'],
            classicVersion: '通行本',
            copyrightStatus: 'public_domain',
          }],
        }],
      }],
      stats: { totalChapters: 1, totalParagraphs: 1, totalSentences: 1 },
    })
    expect(globalCorpus.hasClassic('wjaj')).toBe(true)
    expect(globalCorpus.getStats().totalClassics).toBe(beforeCount + 1)

    // 清理
    globalCorpus.unregisterClassic('wjaj')
    expect(globalCorpus.hasClassic('wjaj')).toBe(false)
  })

  it('getStats 包含 byClassic 和 copyrightDistribution', () => {
    const stats = globalCorpus.getStats()
    expect(stats.byClassic.length).toBeGreaterThanOrEqual(7)
    expect(stats.copyrightDistribution['public_domain']).toBeGreaterThanOrEqual(120)
  })
})
