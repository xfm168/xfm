import { describe, it, expect } from 'vitest'
import { globalKG } from '../../../knowledgeGraph'

describe('C5 命理知识图谱（Knowledge Graph）', () => {
  it('图谱节点 ≥ 50，边 ≥ 60', () => {
    const stats = globalKG.getStats()
    expect(stats.totalNodes).toBeGreaterThanOrEqual(50)
    expect(stats.totalEdges).toBeGreaterThanOrEqual(60)
  })

  it('10 天干 + 12 地支 + 5 五行 节点齐全', () => {
    const stats = globalKG.getStats()
    expect(stats.nodesByType['tiangan'] ?? 0).toBeGreaterThanOrEqual(10)
    expect(stats.nodesByType['dizhi'] ?? 0).toBeGreaterThanOrEqual(12)
    expect(stats.nodesByType['wuxing'] ?? 0).toBeGreaterThanOrEqual(5)
  })

  it('甲木 喜 丙火（寒木向阳，《穷通宝鉴》）', () => {
    const jia = globalKG.getNodeByName('甲', 'tiangan')
    expect(jia).toBeDefined()
    const rels = globalKG.queryRelations(jia!.id, 'likes')
    expect(rels).not.toBeNull()
    const bingRel = rels!.relations.find(r => r.target.name === '丙')
    expect(bingRel).toBeDefined()
    expect(bingRel!.edge.reason).toContain('寒木向阳')
    expect(bingRel!.edge.classicSource).toContain('穷通宝鉴')
  })

  it('traceToClassic: 乙木 追溯到经典依据', () => {
    const yi = globalKG.getNodeByName('乙', 'tiangan')
    expect(yi).toBeDefined()
    const paths = globalKG.traceToClassic(yi!.id)
    expect(paths.length).toBeGreaterThan(0)
    // 至少有一条路径包含"穷通宝鉴"
    const hasQtbj = paths.some(p => p.some(s => s.includes('穷通宝鉴')))
    expect(hasQtbj).toBe(true)
  })

  it('五行相生相克边存在', () => {
    const mu = globalKG.getNodeByName('木', 'wuxing')
    expect(mu).toBeDefined()
    const genRels = globalKG.queryRelations(mu!.id, 'generates')
    expect(genRels!.relations.find(r => r.target.name === '火')).toBeDefined()
    const ovrRels = globalKG.queryRelations(mu!.id, 'overcomes')
    expect(ovrRels!.relations.find(r => r.target.name === '土')).toBeDefined()
  })

  it('C6-3: 至少 30 条边有 relationWeight/evidenceCount/classicSupport', () => {
    const graph = globalKG.exportGraph()
    const enriched = graph.edges.filter(e =>
      e.relationWeight !== undefined &&
      e.evidenceCount !== undefined &&
      e.classicSupport !== undefined
    )
    expect(enriched.length).toBeGreaterThanOrEqual(30)
  })

  it('C6-3: 五行相生相克边 consensusScore=1.0 且无争议', () => {
    const graph = globalKG.exportGraph()
    const mu = globalKG.getNodeByName('木', 'wuxing')!
    const genRels = globalKG.queryRelations(mu.id, 'generates')
    const fireEdge = genRels.relations.find(r => r.target.name === '火')!
    expect(fireEdge.edge.consensusScore).toBe(1.0)
    expect(fireEdge.edge.conflictOpinion?.hasConflict).toBe(false)
  })

  it('C6-3: 至少有 3 条边存在流派争议（conflictOpinion.hasConflict=true）', () => {
    const graph = globalKG.exportGraph()
    const conflicts = graph.edges.filter(e => e.conflictOpinion?.hasConflict === true)
    expect(conflicts.length).toBeGreaterThanOrEqual(3)
  })

  it('C6-3: classicSupport.count 最大为 5（5部经典全支持）', () => {
    const graph = globalKG.exportGraph()
    const maxSupport = Math.max(...graph.edges
      .filter(e => e.classicSupport)
      .map(e => e.classicSupport!.count))
    expect(maxSupport).toBeLessThanOrEqual(7) // 7部经典
    expect(maxSupport).toBeGreaterThanOrEqual(5) // 至少有一条被5部经典支持
  })
})
