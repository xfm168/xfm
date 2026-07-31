import type { KGNode, KGEdge, KnowledgeGraph, KGQueryResult, KGNodeType, KGEdgeType } from './types'
import { SEED_GRAPH } from './seedData'

export class KnowledgeGraphEngine {
  private nodes = new Map<string, KGNode>()
  private edges = new Map<string, KGEdge>()
  /** 按类型索引节点 */
  private nodesByType = new Map<KGNodeType, Set<string>>()
  /** 按 from 索引边 */
  private edgesByFrom = new Map<string, Set<string>>()
  /** 按 to 索引边 */
  private edgesByTo = new Map<string, Set<string>>()

  constructor() {
    this.loadSeed()
  }

  private loadSeed(): void {
    for (const n of SEED_GRAPH.nodes) this.addNodeInternal(n)
    for (const e of SEED_GRAPH.edges) this.addEdgeInternal(e)
  }

  private addNodeInternal(node: KGNode): void {
    this.nodes.set(node.id, node)
    if (!this.nodesByType.has(node.type)) this.nodesByType.set(node.type, new Set())
    this.nodesByType.get(node.type)!.add(node.id)
  }

  private addEdgeInternal(edge: KGEdge): void {
    this.edges.set(edge.id, edge)
    if (!this.edgesByFrom.has(edge.from)) this.edgesByFrom.set(edge.from, new Set())
    this.edgesByFrom.get(edge.from)!.add(edge.id)
    if (!this.edgesByTo.has(edge.to)) this.edgesByTo.set(edge.to, new Set())
    this.edgesByTo.get(edge.to)!.add(edge.id)
  }

  /** 注册节点 */
  registerNode(node: KGNode): void {
    if (this.nodes.has(node.id)) console.warn(`[KG] 覆盖已存在节点 ${node.id}`)
    this.addNodeInternal(node)
  }

  /** 注册边 */
  registerEdge(edge: KGEdge): void {
    if (this.edges.has(edge.id)) console.warn(`[KG] 覆盖已存在边 ${edge.id}`)
    this.addEdgeInternal(edge)
  }

  /** 查询节点 */
  getNode(id: string): KGNode | undefined {
    return this.nodes.get(id)
  }

  /** 按名称查询 */
  getNodeByName(name: string, type?: KGNodeType): KGNode | undefined {
    for (const node of this.nodes.values()) {
      if (node.name === name && (!type || node.type === type)) return node
    }
    return undefined
  }

  /** 查询某节点的所有出边关系 */
  queryRelations(nodeId: string, edgeType?: KGEdgeType): KGQueryResult | null {
    const source = this.nodes.get(nodeId)
    if (!source) return null
    const edgeIds = this.edgesByFrom.get(nodeId) ?? new Set()
    const relations: KGQueryResult['relations'] = []
    for (const eid of edgeIds) {
      const edge = this.edges.get(eid)!
      if (edgeType && edge.type !== edgeType) continue
      const target = this.nodes.get(edge.to)
      if (target) relations.push({ edge, target })
    }
    return { source, relations, path: [nodeId] }
  }

  /**
   * 追溯查询：从某节点出发，沿着 likes/depends_on/explains 边追溯经典依据
   * 返回追溯路径（节点 id 数组）
   */
  traceToClassic(nodeId: string, maxDepth = 5): string[][] {
    const paths: string[][] = []
    const walk = (curId: string, path: string[], depth: number) => {
      if (depth >= maxDepth) return
      const node = this.nodes.get(curId)
      if (!node) return
      if (node.type === 'classic') {
        paths.push([...path, curId])
        return
      }
      const edgeIds = this.edgesByFrom.get(curId) ?? new Set()
      let hasExplains = false
      for (const eid of edgeIds) {
        const edge = this.edges.get(eid)!
        if (edge.type === 'explains' || edge.type === 'depends_on') {
          hasExplains = true
          walk(edge.to, [...path, curId], depth + 1)
        }
      }
      // 若无 explains 边，也沿 likes/dislikes 追溯
      if (!hasExplains) {
        for (const eid of edgeIds) {
          const edge = this.edges.get(eid)!
          if (edge.classicSource && (edge.type === 'likes' || edge.type === 'dislikes')) {
            // 直接作为经典引用路径终止
            paths.push([...path, curId, `(via ${edge.type}→${edge.to}, 经典:${edge.classicSource})`])
          }
        }
      }
    }
    walk(nodeId, [], 0)
    return paths
  }

  /** 获取完整图谱统计 */
  getStats(): KnowledgeGraph['stats'] {
    const nodesByType: Record<string, number> = {}
    for (const [type, ids] of this.nodesByType) nodesByType[type] = ids.size
    const edgesByType: Record<string, number> = {}
    for (const edge of this.edges.values()) edgesByType[edge.type] = (edgesByType[edge.type] || 0) + 1
    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      nodesByType,
      edgesByType,
    }
  }

  /** 导出完整图谱 */
  exportGraph(): KnowledgeGraph {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      stats: this.getStats(),
    }
  }
}

/** 全局单例 */
export const globalKG = new KnowledgeGraphEngine()
