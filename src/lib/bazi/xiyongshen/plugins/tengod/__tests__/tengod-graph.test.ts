/**
 * P1.2.1-C2 TenGod Graph Test
 *
 * 验证十神关系图谱完整性：
 *   1) 边数 >= 200
 *   2) 无孤立节点（10 个十神均有出入边）
 *   3) 无重复关系（dedup 生效）
 *   4) 无错误循环（flow 路径有界，不无限递归）
 *   5) 关系种类覆盖：生/克/制化/泄耗/帮扶/转化/冲突/流通
 *   6) 正官关键路径完整：正印→官印相生、伤官→伤官见官、七杀→官杀混杂、财星→财生官
 */
import { describe, it, expect, beforeAll } from 'vitest'
import {
  defaultTenGodPlugin,
  defaultTenGodRelationGraph,
  TenGodName,
} from '..'

const ALL_TEN_GODS: TenGodName[] = [
  '比肩', '劫财', '食神', '伤官', '偏财',
  '正财', '七杀', '正官', '偏印', '正印',
]

const EXPECTED_KINDS = [
  'produce', 'control', 'beControlled', 'drain',
  'help', 'transform', 'conflict', 'combine', 'flow',
]

describe('P1.2.1-C2 TenGod Graph Test', () => {
  beforeAll(async () => {
    await defaultTenGodPlugin.initialize()
  })

  describe('1) 边数与节点', () => {
    it('边数 >= 200', () => {
      const edges = defaultTenGodRelationGraph.getEdges()
      expect(edges.length).toBeGreaterThanOrEqual(200)
    })

    it('节点数 = 10（覆盖全部十神）', () => {
      expect(defaultTenGodRelationGraph.nodes).toHaveLength(10)
      for (const g of ALL_TEN_GODS) {
        expect(defaultTenGodRelationGraph.nodes).toContain(g)
      }
    })
  })

  describe('2) 无孤立节点', () => {
    it('每个十神至少有 1 条出边或入边', () => {
      for (const g of ALL_TEN_GODS) {
        const out = defaultTenGodRelationGraph.getOutgoing(g)
        const inc = defaultTenGodRelationGraph.getIncoming(g)
        expect(out.length + inc.length).toBeGreaterThan(0)
      }
    })

    it('每个十神出边数 >= 3（关系丰富）', () => {
      for (const g of ALL_TEN_GODS) {
        const out = defaultTenGodRelationGraph.getOutgoing(g)
        expect(out.length).toBeGreaterThanOrEqual(3)
      }
    })
  })

  describe('3) 无重复关系', () => {
    it('所有边 from|kind|to 唯一（无重复）', () => {
      const edges = defaultTenGodRelationGraph.getEdges()
      const seen = new Set<string>()
      let dups = 0
      for (const e of edges) {
        const key = `${e.from}|${e.kind}|${e.to}`
        if (seen.has(key)) dups++
        else seen.add(key)
      }
      expect(dups).toBe(0)
    })
  })

  describe('4) 无错误循环', () => {
    it('flow 路径计算不无限递归（getFlows 正常返回）', () => {
      const flows = defaultTenGodRelationGraph.getFlows(7)
      expect(Array.isArray(flows)).toBe(true)
      // 流通路径长度有界（<=6）
      for (const f of flows) {
        expect(f.path.length).toBeLessThanOrEqual(6)
      }
    })

    it('shortestPath 自环返回单节点，非自环返回有界路径或 null', () => {
      for (const g of ALL_TEN_GODS) {
        const self = defaultTenGodRelationGraph.shortestPath(g, g)
        expect(self).toEqual([g])
      }
      // 任意两节点路径要么存在（有界），要么 null
      const p = defaultTenGodRelationGraph.shortestPath('正官', '比肩')
      expect(p === null || (Array.isArray(p) && p.length <= 10)).toBe(true)
    })

    it('getConflicts 不重复列举同一对冲突', () => {
      const conflicts = defaultTenGodRelationGraph.getConflicts(7)
      const seen = new Set<string>()
      for (const c of conflicts) {
        const key = [c.a, c.b].sort().join('|')
        expect(seen.has(key)).toBe(false)
        seen.add(key)
      }
    })
  })

  describe('5) 关系种类覆盖', () => {
    it('覆盖 produce/control/beControlled/drain/help/transform/conflict/combine/flow', () => {
      const edges = defaultTenGodRelationGraph.getEdges()
      const kinds = new Set(edges.map(e => e.kind))
      for (const k of EXPECTED_KINDS) {
        expect(kinds.has(k as any)).toBe(true)
      }
    })

    it('每条边包含必要字段 from/to/kind/weight/description', () => {
      const edges = defaultTenGodRelationGraph.getEdges()
      expect(edges.length).toBeGreaterThan(0)
      for (const e of edges) {
        expect(e.from).toBeTruthy()
        expect(e.to).toBeTruthy()
        expect(e.kind).toBeTruthy()
        expect(typeof e.weight).toBe('number')
        expect(e.description).toBeTruthy()
      }
    })
  })

  describe('6) 正官关键路径完整', () => {
    it('正官与正印存在关系（官印相生路径）', () => {
      const out = defaultTenGodRelationGraph.getOutgoing('正官')
      const inc = defaultTenGodRelationGraph.getIncoming('正官')
      const relatedToYin = [...out, ...inc].some(e => e.from === '正印' || e.to === '正印')
      expect(relatedToYin).toBe(true)
    })

    it('正官与伤官存在关系（伤官见官路径）', () => {
      const out = defaultTenGodRelationGraph.getOutgoing('正官')
      const inc = defaultTenGodRelationGraph.getIncoming('正官')
      const relatedToShang = [...out, ...inc].some(e => e.from === '伤官' || e.to === '伤官')
      expect(relatedToShang).toBe(true)
    })

    it('正官与七杀存在关系（官杀混杂路径）', () => {
      const out = defaultTenGodRelationGraph.getOutgoing('正官')
      const inc = defaultTenGodRelationGraph.getIncoming('正官')
      const relatedToSha = [...out, ...inc].some(e => e.from === '七杀' || e.to === '七杀')
      expect(relatedToSha).toBe(true)
    })

    it('正官与财星（正财/偏财）存在关系（财生官路径）', () => {
      const out = defaultTenGodRelationGraph.getOutgoing('正官')
      const inc = defaultTenGodRelationGraph.getIncoming('正官')
      const relatedToCai = [...out, ...inc].some(e => e.from === '正财' || e.to === '正财' || e.from === '偏财' || e.to === '偏财')
      expect(relatedToCai).toBe(true)
    })
  })

  describe('7) 图谱报告完整性', () => {
    it('report() 返回 nodes/edges/adjacency/flows/conflicts', () => {
      const r = defaultTenGodRelationGraph.report()
      expect(r.nodes).toHaveLength(10)
      expect(r.edges.length).toBeGreaterThanOrEqual(200)
      expect(typeof r.adjacency).toBe('object')
      expect(Array.isArray(r.flows)).toBe(true)
      expect(Array.isArray(r.conflicts)).toBe(true)
    })
  })
})
