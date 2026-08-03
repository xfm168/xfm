/**
 * P0-5B Knowledge Graph — 知识图谱引擎（KnowledgeGraph）
 *
 * 整合 Classic → Concept → Rule → Evidence → Decision 五层概念的统一知识图谱。
 *
 * 依赖三个管理器：
 *   - OntologyManager  本体（节点/边拓扑）
 *   - ConceptManager   概念（命理方法论）
 *   - ClassicManager   典籍（书与原文条目）
 *
 * 提供统一查询接口：
 *   - query                  统一查询（按 type 分发）
 *   - queryByClassic         按典籍查询条目
 *   - queryByConcept         按概念查询
 *   - findEvidenceChain      规则 → 概念 → 典籍 证据链追溯
 *   - findDecisionPath       概念 → 决策 → 五行 决策路径
 *   - getClassicSupport      五行的经典支持度
 *   - getConceptGraph        概念子图（指定深度）
 *   - exportGraph            导出完整图谱
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

import type { OntologyManager, OntologyNode, OntologyEdge } from '../ontology/ontology'
import type { ConceptManager, Concept } from '../concept/concept'
import type { ClassicManager, ClassicEntry } from '../classic/classic'

// ============================================================
// 类型定义
// ============================================================

/** 统一查询请求 */
export interface KGQuery {
  /** 查询类型 */
  type: 'classic' | 'concept' | 'rule' | 'wuxing' | 'path'
  /** 查询目标（典籍名/概念名/规则ID/五行名） */
  target: string
  /** 额外选项（如 depth / direction / from 等） */
  options?: Record<string, any>
}

/** 统一查询结果 */
export interface KGQueryResult {
  /** 是否成功 */
  success: boolean
  /** 返回数据（具体结构依查询类型而定） */
  data: any
  /** 查询调用链（用于审计） */
  trace?: string[]
}

/** 证据链（规则 → 概念 → 典籍） */
export interface EvidenceChain {
  /** 规则 ID */
  ruleId: string
  /** 规则名称 */
  ruleName: string
  /** 关联概念 */
  concept: string
  /** 典籍名 */
  classic: string
  /** 章节 */
  chapter: string
  /** 引用原文 */
  quote: string
  /** 调用路径（人类可读） */
  path: string[]
}

/** 决策路径（概念 → 决策 → 五行） */
export interface DecisionPath {
  /** 起点（概念名） */
  from: string
  /** 终点（五行名） */
  to: string
  /** 路径节点 ID 序列 */
  path: string[]
  /** 路径上的证据链 */
  evidence: EvidenceChain[]
}

/** 五行的经典支持 */
export interface ClassicSupport {
  /** 五行 */
  wuxing: string
  /** 支持该五行的典籍列表 */
  classics: string[]
  /** 支持该五行的典籍条目 */
  entries: ClassicEntry[]
  /** 支持度 0~1 */
  supportLevel: number
}

/** 概念子图 */
export interface ConceptGraph {
  /** 根概念 ID */
  root: string
  /** 子图节点 */
  nodes: OntologyNode[]
  /** 子图边 */
  edges: OntologyEdge[]
  /** 子图深度 */
  depth: number
}

// ============================================================
// KnowledgeGraph 引擎
// ============================================================

/**
 * 知识图谱引擎
 *
 * 通过组合 OntologyManager + ConceptManager + ClassicManager 三个底层管理器，
 * 提供跨层级的统一查询能力。
 */
export class KnowledgeGraph {
  /** 本体管理器 */
  private ontology: OntologyManager
  /** 概念管理器 */
  private concept: ConceptManager
  /** 典籍管理器 */
  private classic: ClassicManager

  constructor(ontology: OntologyManager, concept: ConceptManager, classic: ClassicManager) {
    this.ontology = ontology
    this.concept = concept
    this.classic = classic
  }

  // ---------- 统一查询 ----------

  /**
   * 统一查询接口
   * 按 query.type 分发到具体查询方法
   */
  query(query: KGQuery): KGQueryResult {
    const trace: string[] = [`query(${query.type}, target=${query.target})`]
    try {
      switch (query.type) {
        case 'classic': {
          const entries = this.queryByClassic(query.target)
          trace.push(`queryByClassic → ${entries.length} 条`)
          return { success: true, data: entries, trace }
        }
        case 'concept': {
          const concept = this.queryByConcept(query.target)
          trace.push(`queryByConcept → ${concept ? '命中' : '未命中'}`)
          return { success: true, data: concept, trace }
        }
        case 'rule': {
          const chain = this.findEvidenceChain(query.target)
          trace.push(`findEvidenceChain → ${chain.path.length} 步`)
          return { success: true, data: chain, trace }
        }
        case 'wuxing': {
          const support = this.getClassicSupport(query.target)
          trace.push(`getClassicSupport → 支持度 ${support.supportLevel}`)
          return { success: true, data: support, trace }
        }
        case 'path': {
          const from = query.options?.from
          const to = query.options?.to ?? query.target
          if (!from) {
            return { success: false, data: null, trace: [...trace, '缺少 options.from'] }
          }
          const path = this.findDecisionPath(from, to)
          trace.push(`findDecisionPath → ${path.path.length} 步`)
          return { success: true, data: path, trace }
        }
        default:
          return { success: false, data: null, trace: [...trace, `未知查询类型: ${query.type}`] }
      }
    } catch (err) {
      return {
        success: false,
        data: null,
        trace: [...trace, `错误: ${err instanceof Error ? err.message : String(err)}`],
      }
    }
  }

  // ---------- 具体查询 ----------

  /** 按典籍名查询所有条目 */
  queryByClassic(name: string): ClassicEntry[] {
    return this.classic.listByClassic(name)
  }

  /** 按概念名查询概念详情 */
  queryByConcept(conceptName: string): Concept {
    return this.concept.getByName(conceptName) as Concept
  }

  /**
   * 查找规则的证据链（规则 → 概念 → 典籍）
   *
   * 实现思路：
   *   1. 在 Ontology 中查找 rule 节点（id 含规则 ID）
   *   2. 沿 depends_on / cites 边回溯到概念节点
   *   3. 沿 originates / explains 边回溯到典籍节点
   *   4. 在 ClassicManager 中查找对应原文条目
   */
  findEvidenceChain(ruleId: string): EvidenceChain {
    const empty: EvidenceChain = {
      ruleId,
      ruleName: ruleId,
      concept: '',
      classic: '',
      chapter: '',
      quote: '',
      path: [`rule:${ruleId}`],
    }

    // 在 Ontology 中查找规则节点
    const ruleNodeId = `ont:rule:${ruleId}`
    const ruleNodeIdAlt = `rule:${ruleId}`
    let ruleNode = this.ontology.getNode(ruleNodeId) ?? this.ontology.getNode(ruleNodeIdAlt)
    if (!ruleNode) {
      // 没有显式注册的规则节点，仍尝试通过 concept → classic 链构建空证据
      return empty
    }

    const path: string[] = [ruleNode.id]
    let conceptName = ''
    let classicName = ''
    let chapter = ''
    let quote = ''

    // 1. 规则 → 概念（depends_on 或 cites）
    const ruleNeighbors = this.ontology.getNeighbors(ruleNode.id, 'out')
    const conceptNode = ruleNeighbors.find(n => n.type === 'concept')
    if (conceptNode) {
      path.push(conceptNode.id)
      conceptName = conceptNode.label
    }

    // 2. 概念 → 典籍（originates 或 explains）
    if (conceptNode) {
      const conceptNeighbors = this.ontology.getNeighbors(conceptNode.id, 'out')
      const classicNode = conceptNeighbors.find(n => n.type === 'classic')
      if (classicNode) {
        path.push(classicNode.id)
        classicName = classicNode.label
      }
    }

    // 3. 典籍 → 原文条目
    if (conceptName && classicName) {
      const entries = this.classic.listByClassic(classicName)
      const matched = entries.find(e => e.concept === conceptName) ?? entries[0]
      if (matched) {
        chapter = matched.chapter
        quote = matched.text
        path.push(`entry:${matched.id}`)
      }
    } else if (conceptName) {
      // 仅按概念查条目
      const entries = this.classic.listByConcept(conceptName)
      if (entries.length > 0) {
        classicName = entries[0].classicName
        chapter = entries[0].chapter
        quote = entries[0].text
        path.push(`entry:${entries[0].id}`)
      }
    }

    return {
      ruleId,
      ruleName: ruleNode.label,
      concept: conceptName,
      classic: classicName,
      chapter,
      quote,
      path,
    }
  }

  /**
   * 查找概念到五行的决策路径
   * 通过 Ontology 的 leads_to / decides 边查找
   */
  findDecisionPath(fromConcept: string, toWuxing: string): DecisionPath {
    const fromId = `ont:concept:${fromConcept}`
    const toId = `ont:wuxing:${toWuxing}`

    const path = this.bfsPath(fromId, toId, ['leads_to', 'decides', 'supports', 'depends_on'])

    // 收集路径上的证据
    const evidence: EvidenceChain[] = []
    for (const nodeId of path) {
      const node = this.ontology.getNode(nodeId)
      if (!node) continue
      if (node.type === 'classic') {
        const entries = this.classic.listByClassic(node.label)
        if (entries.length > 0) {
          evidence.push({
            ruleId: '',
            ruleName: '',
            concept: fromConcept,
            classic: node.label,
            chapter: entries[0].chapter,
            quote: entries[0].text,
            path: [nodeId],
          })
        }
      }
    }

    return {
      from: fromConcept,
      to: toWuxing,
      path,
      evidence,
    }
  }

  /**
   * 获取某五行的经典支持度
   * 汇总 ClassicManager 中按五行索引的条目，并按条目 supports/opposes 计算支持度
   */
  getClassicSupport(wuxing: string): ClassicSupport {
    const entries = this.classic.listByWuxing(wuxing)
    const classics = new Set<string>()
    let supportCount = 0
    let opposeCount = 0

    for (const e of entries) {
      classics.add(e.classicName)
      if (e.opposes) opposeCount += 1
      else supportCount += 1
    }

    const total = supportCount + opposeCount
    const supportLevel = total > 0 ? Number((supportCount / total).toFixed(4)) : 0.5

    return {
      wuxing,
      classics: Array.from(classics),
      entries,
      supportLevel,
    }
  }

  /**
   * 获取以指定概念为根的子图
   * @param conceptId 概念节点 ID（如 'ont:concept:扶抑'）
   * @param depth 遍历深度（默认 2）
   */
  getConceptGraph(conceptId: string, depth: number): ConceptGraph {
    // 容错：如果传入的是概念名，自动补全 ID
    const normalizedId = conceptId.startsWith('ont:')
      ? conceptId
      : `ont:concept:${conceptId}`

    const visited = new Set<string>()
    const nodes: OntologyNode[] = []
    const edges: OntologyEdge[] = []
    const allEdges = this.ontology.getEdges()

    // BFS 收集 depth 层内的节点
    const queue: Array<{ id: string; d: number }> = [{ id: normalizedId, d: 0 }]
    visited.add(normalizedId)
    while (queue.length > 0) {
      const cur = queue.shift()!
      if (cur.d > depth) continue
      const node = this.ontology.getNode(cur.id)
      if (node) nodes.push(node)
      if (cur.d === depth) continue
      const neighbors = this.ontology.getNeighbors(cur.id, 'both')
      for (const nb of neighbors) {
        if (visited.has(nb.id)) continue
        visited.add(nb.id)
        queue.push({ id: nb.id, d: cur.d + 1 })
      }
    }

    // 收集子图内的边（两端节点都在 visited 中）
    for (const e of allEdges) {
      if (visited.has(e.from) && visited.has(e.to)) {
        edges.push(e)
      }
    }

    return {
      root: normalizedId,
      nodes,
      edges,
      depth,
    }
  }

  /** 导出完整图谱（Ontology 节点 + 边） */
  exportGraph(): { nodes: OntologyNode[]; edges: OntologyEdge[] } {
    const def = this.ontology.getDefinitions()
    return {
      nodes: def.nodes,
      edges: def.edges,
    }
  }

  // ---------- 内部辅助 ----------

  /**
   * BFS 查找从 from 到 to 的最短路径（仅沿指定边类型）
   */
  private bfsPath(from: string, to: string, allowedTypes?: string[]): string[] {
    if (from === to) return this.ontology.getNode(from) ? [from] : []
    if (!this.ontology.getNode(from) || !this.ontology.getNode(to)) return []

    const queue: Array<{ id: string; path: string[] }> = [{ id: from, path: [from] }]
    const visited = new Set<string>([from])
    const allEdges = this.ontology.getEdges()

    while (queue.length > 0) {
      const cur = queue.shift()!
      // 收集从 cur.id 出发的边
      const outEdges = allEdges.filter(e => e.from === cur.id)
      for (const e of outEdges) {
        if (allowedTypes && !allowedTypes.includes(e.type)) continue
        if (visited.has(e.to)) continue
        visited.add(e.to)
        const newPath = [...cur.path, e.to]
        if (e.to === to) return newPath
        queue.push({ id: e.to, path: newPath })
      }
    }
    return []
  }
}

// ============================================================
// 全局单例
// ============================================================

import { globalOntology } from '../ontology/ontology'
import { globalConceptManager } from '../concept/concept'
import { globalClassicManager } from '../classic/classic'

/** 全局知识图谱单例（基于全局 ontology / concept / classic 三个管理器构建） */
export const globalKnowledgeGraph = new KnowledgeGraph(
  globalOntology,
  globalConceptManager,
  globalClassicManager,
)
