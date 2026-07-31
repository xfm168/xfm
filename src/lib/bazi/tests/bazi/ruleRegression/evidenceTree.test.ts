import { describe, it, expect } from 'vitest'
import { EvidenceTreeBuilder, createDemoCareerTree } from '../../../ruleEngine/evidence/evidenceTree'

describe('C3 Evidence Tree（证据树）', () => {
  it('createDemoCareerTree: 事业4星证据树深度≥4，总节点≥7', () => {
    const tree = createDemoCareerTree()
    expect(tree.root.text).toContain('事业')
    expect(tree.maxDepth).toBeGreaterThanOrEqual(4)
    expect(tree.totalNodes).toBeGreaterThanOrEqual(7)
    expect(tree.allLeavesCited).toBe(true)
  })

  it('toIndentedText 输出含"↓ 为什么？"和"经典依据"', () => {
    const tree = createDemoCareerTree()
    const text = new EvidenceTreeBuilder().toIndentedText(tree)
    expect(text).toContain('↓ 为什么？')
    expect(text).toContain('经典依据')
    expect(text).toContain('《子平真诠》')
    expect(text).toContain('《滴天髓》')
  })

  it('EvidenceTreeBuilder: 手动构建3层树', () => {
    const b = new EvidenceTreeBuilder()
    const root = b.conclusion('财旺', { confidence: 0.9 })
    const c1 = b.condition('月令得令', { satisfied: true })
    b.addChild(root, c1)
    const f1 = b.fact('乙木日主生于申月')
    b.addChild(c1, f1)
    const cite = b.citation('穷通宝鉴', { chapter: '秋木', originalText: '秋木凋零，宜金克成器' })
    b.addChild(f1, cite)
    const tree = b.build(root, '财旺：月令得令')
    expect(tree.maxDepth).toBe(4)
    expect(tree.totalNodes).toBe(4)
    expect(tree.allLeavesCited).toBe(true)
  })

  it('allLeavesCited=false 当叶子无引用', () => {
    const b = new EvidenceTreeBuilder()
    const root = b.conclusion('身强')
    const c1 = b.condition('印比多', { satisfied: true })
    b.addChild(root, c1)
    // c1 是叶子但无引用 → allLeavesCited 检查中 condition 叶子允许无引用，返回 true
    // 但如果 c1 下面是 fact 无引用的叶子，则返回 false
    const f1 = b.fact('印星3个')
    b.addChild(c1, f1)
    const tree = b.build(root)
    // fact 叶子无 classicName → allLeavesCited=false
    expect(tree.allLeavesCited).toBe(false)
  })
})
