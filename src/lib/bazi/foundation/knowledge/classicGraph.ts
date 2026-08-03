/**
 * P0-5 Part 2: Classical Knowledge Graph — 古典命理知识图谱
 *
 * 在既有 KnowledgeGraph（基础五行/干支/神煞知识）之上，扩展为可查询的"经典知识图谱"：
 *   - 节点：经典典籍、命理概念、五行、规则
 *   - 边：解释(explains)、支持(supports)、反驳(contradicts)、依赖(depends_on)、推论(leads_to)
 *
 * 主要能力：
 *   1. 按古籍查询知识点（queryByClassic）
 *   2. 按概念查询支撑典籍（queryByConcept）
 *   3. 知识点之间的路径查找（findPath）
 *   4. 规则证据链追溯（getEvidenceChain）
 *   5. 五行的经典支持度（getClassicSupport）
 *
 * 与既有 globalKG（knowledgeGraph/）的区别：
 *   globalKG 侧重干支五行之间的"生克合冲刑"关系
 *   本图谱侧重"规则—概念—典籍—篇章—原文"的论证链路
 */

import type { RuleDSLDefinition } from '../types'

// ============================================================
// 内部类型定义
// ============================================================

/** 经典知识节点类型 */
export type ClassicKGNodeType =
  | 'classic'      // 典籍
  | 'concept'      // 命理概念
  | 'wuxing'       // 五行
  | 'rule'         // 规则
  | 'school'       // 流派

/** 经典知识边类型（关系） */
export type ClassicKGEdgeType =
  | 'explains'      // 解释：典籍 解释 概念/规则
  | 'supports'      // 支持：典籍/概念 支持 规则
  | 'contradicts'   // 反驳：典籍/概念 反驳 规则
  | 'depends_on'    // 依赖：规则/概念 依赖 概念
  | 'leads_to'      // 推论：概念 推论 概念/规则
  | 'cites'         // 引用：规则 引用 典籍
  | 'originates'    // 出自：概念 出自 典籍

/** 经典知识节点 */
export interface ClassicKGNode {
  /** 节点 ID（如 'ck:滴天髓' 'cpt:扶抑' 'rule:BALANCE-001'） */
  id: string
  /** 节点类型 */
  type: ClassicKGNodeType
  /** 节点名称 */
  name: string
  /** 五行属性（仅 wuxing 节点） */
  wuxing?: string
  /** 描述 */
  description?: string
  /** 典籍篇章（仅 classic 节点，列出主要篇章） */
  chapters?: string[]
  /** 流派（仅 school 节点） */
  school?: string
  /** 元数据 */
  meta?: Record<string, any>
}

/** 经典知识边 */
export interface ClassicKGEdge {
  /** 边 ID */
  id: string
  /** 起点 */
  from: string
  /** 终点 */
  to: string
  /** 边类型 */
  type: ClassicKGEdgeType
  /** 关系说明 */
  reason?: string
  /** 典籍篇章引用 */
  chapter?: string
  /** 典籍原文 */
  originalText?: string
  /** 权重 0~1 */
  weight?: number
  /** 共识度 0~1 */
  consensusScore?: number
}

/** 路径查找结果 */
export interface ClassicPathResult {
  /** 起点 ID */
  from: string
  /** 终点 ID */
  to: string
  /** 路径节点序列 */
  nodes: ClassicKGNode[]
  /** 路径边序列 */
  edges: ClassicKGEdge[]
  /** 是否可达 */
  reachable: boolean
  /** 路径描述（人类可读） */
  description: string
}

/** 证据链结果 */
export interface EvidenceChainResult {
  /** 规则 ID */
  ruleId: string
  /** 规则名称 */
  ruleName?: string
  /** 证据链（从规则 → 概念 → 典籍） */
  chain: ClassicKGNode[]
  /** 引用典籍列表 */
  classics: string[]
  /** 原文引用 */
  quotations: Array<{ classic: string; chapter?: string; text: string }>
  /** 支持度评分 0~1 */
  supportScore: number
}

/** 五行经典支持度 */
export interface WuxingClassicSupport {
  /** 五行 */
  wuxing: string
  /** 支持的典籍列表 */
  supportingClassics: string[]
  /** 反对的典籍列表 */
  opposingClassics: string[]
  /** 经典原文引用 */
  quotations: Array<{ classic: string; chapter?: string; text: string; supports: boolean }>
  /** 总体支持度 0~1 */
  supportScore: number
}

// ============================================================
// ClassicKnowledgeGraph 引擎
// ============================================================

/**
 * 古典命理知识图谱引擎
 *
 * 维护"规则—概念—典籍"的可查询图谱，支持按古籍、按概念、按规则查询，
 * 并提供路径查找、证据链追溯、五行支持度评估等核心能力。
 */
export class ClassicKnowledgeGraph {
  /** 节点表 */
  private nodes = new Map<string, ClassicKGNode>()
  /** 边表 */
  private edges = new Map<string, ClassicKGEdge>()
  /** 按类型索引节点 */
  private nodesByType = new Map<ClassicKGNodeType, Set<string>>()
  /** 按名称索引节点（用于按名查询） */
  private nodesByName = new Map<string, string>()
  /** 按 from 索引边 */
  private edgesByFrom = new Map<string, Set<string>>()
  /** 按 to 索引边 */
  private edgesByTo = new Map<string, Set<string>>()

  constructor() {
    this.loadSeed()
  }

  /** 加载种子数据 */
  private loadSeed(): void {
    for (const n of SEED_CLASSIC_NODES) this.addNodeInternal(n)
    for (const e of SEED_CLASSIC_EDGES) this.addEdgeInternal(e)
  }

  // ---------- 节点/边管理 ----------

  private addNodeInternal(node: ClassicKGNode): void {
    this.nodes.set(node.id, node)
    if (!this.nodesByType.has(node.type)) this.nodesByType.set(node.type, new Set())
    this.nodesByType.get(node.type)!.add(node.id)
    this.nodesByName.set(node.name, node.id)
  }

  private addEdgeInternal(edge: ClassicKGEdge): void {
    this.edges.set(edge.id, edge)
    if (!this.edgesByFrom.has(edge.from)) this.edgesByFrom.set(edge.from, new Set())
    this.edgesByFrom.get(edge.from)!.add(edge.id)
    if (!this.edgesByTo.has(edge.to)) this.edgesByTo.set(edge.to, new Set())
    this.edgesByTo.get(edge.to)!.add(edge.id)
  }

  /** 注册节点 */
  registerNode(node: ClassicKGNode): void {
    if (this.nodes.has(node.id)) console.warn(`[ClassicKG] 覆盖已存在节点 ${node.id}`)
    this.addNodeInternal(node)
  }

  /** 注册边 */
  registerEdge(edge: ClassicKGEdge): void {
    if (this.edges.has(edge.id)) console.warn(`[ClassicKG] 覆盖已存在边 ${edge.id}`)
    this.addEdgeInternal(edge)
  }

  /** 注册规则节点（从 RuleDSLDefinition 注册） */
  registerRule(rule: RuleDSLDefinition): void {
    this.registerNode({
      id: `rule:${rule.id}`,
      type: 'rule',
      name: rule.name,
      description: rule.description,
      meta: { version: rule.version, category: rule.category, priority: rule.priority },
    })
    // 规则 → 古籍 引用
    for (const src of rule.source ?? []) {
      const classicId = this.nodesByName.get(src)
      if (classicId) {
        this.registerEdge({
          id: `e:rule-${rule.id}-cite-${src}`,
          from: `rule:${rule.id}`,
          to: classicId,
          type: 'cites',
          reason: `规则 ${rule.id} 引用 ${src}`,
          weight: 1,
        })
      }
    }
    // 规则 → 概念 依赖（基于 rule.dependencies）
    for (const dep of rule.dependencies ?? []) {
      this.registerEdge({
        id: `e:rule-${rule.id}-dep-${dep}`,
        from: `rule:${rule.id}`,
        to: `rule:${dep}`,
        type: 'depends_on',
        reason: `规则 ${rule.id} 依赖规则 ${dep}`,
        weight: 1,
      })
    }
  }

  // ---------- 基础查询 ----------

  /** 按 ID 获取节点 */
  getNode(id: string): ClassicKGNode | undefined {
    return this.nodes.get(id)
  }

  /** 按名称获取节点 */
  getNodeByName(name: string): ClassicKGNode | undefined {
    const id = this.nodesByName.get(name)
    return id ? this.nodes.get(id) : undefined
  }

  /** 按类型列出节点 */
  getNodesByType(type: ClassicKGNodeType): ClassicKGNode[] {
    const ids = this.nodesByType.get(type) ?? new Set()
    const out: ClassicKGNode[] = []
    for (const id of ids) {
      const n = this.nodes.get(id)
      if (n) out.push(n)
    }
    return out
  }

  /** 获取某节点的所有出边 */
  getOutEdges(nodeId: string, edgeType?: ClassicKGEdgeType): ClassicKGEdge[] {
    const ids = this.edgesByFrom.get(nodeId) ?? new Set()
    const out: ClassicKGEdge[] = []
    for (const eid of ids) {
      const e = this.edges.get(eid)!
      if (!edgeType || e.type === edgeType) out.push(e)
    }
    return out
  }

  /** 获取某节点的所有入边 */
  getInEdges(nodeId: string, edgeType?: ClassicKGEdgeType): ClassicKGEdge[] {
    const ids = this.edgesByTo.get(nodeId) ?? new Set()
    const out: ClassicKGEdge[] = []
    for (const eid of ids) {
      const e = this.edges.get(eid)!
      if (!edgeType || e.type === edgeType) out.push(e)
    }
    return out
  }

  // ---------- 核心方法 ----------

  /**
   * 按古籍查询知识点
   * 返回该典籍解释/支持/引用的所有节点（规则、概念、五行）
   */
  queryByClassic(name: string): {
    classic: ClassicKGNode | undefined
    explains: ClassicKGNode[]
    supports: ClassicKGNode[]
    contradicts: ClassicKGNode[]
    citedBy: ClassicKGNode[]
  } {
    const classic = this.getNodeByName(name)
    if (!classic || classic.type !== 'classic') {
      return { classic: undefined, explains: [], supports: [], contradicts: [], citedBy: [] }
    }

    // 典籍被引用（入边：explains/supports/contradicts/cites/originates 指向典籍）
    const explains: ClassicKGNode[] = []
    const supports: ClassicKGNode[] = []
    const contradicts: ClassicKGNode[] = []
    const citedBy: ClassicKGNode[] = []

    for (const e of this.getInEdges(classic.id)) {
      const source = this.nodes.get(e.from)
      if (!source) continue
      if (e.type === 'explains' || e.type === 'originates') explains.push(source)
      else if (e.type === 'supports') supports.push(source)
      else if (e.type === 'contradicts') contradicts.push(source)
      else if (e.type === 'cites') citedBy.push(source)
    }

    return { classic, explains, supports, contradicts, citedBy }
  }

  /**
   * 按概念查询支撑典籍
   * 返回该概念出自/被解释/被支持/被反驳的典籍
   */
  queryByConcept(concept: string): {
    conceptNode: ClassicKGNode | undefined
    explainedBy: ClassicKGNode[]
    supportedBy: ClassicKGNode[]
    contradictedBy: ClassicKGNode[]
    leadsTo: ClassicKGNode[]
    dependsOn: ClassicKGNode[]
  } {
    const conceptNode = this.getNodeByName(concept)
    if (!conceptNode) {
      return {
        conceptNode: undefined,
        explainedBy: [],
        supportedBy: [],
        contradictedBy: [],
        leadsTo: [],
        dependsOn: [],
      }
    }

    const explainedBy: ClassicKGNode[] = []
    const supportedBy: ClassicKGNode[] = []
    const contradictedBy: ClassicKGNode[] = []
    const leadsTo: ClassicKGNode[] = []
    const dependsOn: ClassicKGNode[] = []

    for (const e of this.getInEdges(conceptNode.id)) {
      const source = this.nodes.get(e.from)
      if (!source) continue
      if (e.type === 'explains' || e.type === 'originates') {
        if (source.type === 'classic') explainedBy.push(source)
      } else if (e.type === 'supports') {
        supportedBy.push(source)
      } else if (e.type === 'contradicts') {
        contradictedBy.push(source)
      }
    }

    for (const e of this.getOutEdges(conceptNode.id)) {
      const target = this.nodes.get(e.to)
      if (!target) continue
      if (e.type === 'leads_to') leadsTo.push(target)
      else if (e.type === 'depends_on') dependsOn.push(target)
    }

    return {
      conceptNode,
      explainedBy,
      supportedBy,
      contradictedBy,
      leadsTo,
      dependsOn,
    }
  }

  /**
   * 查找两个节点之间的路径（BFS）
   * 返回所有可达路径中的最短一条
   */
  findPath(from: string, to: string, maxDepth = 6): ClassicPathResult {
    const fromNode = this.getNode(from) ?? this.getNodeByName(from)
    const toNode = this.getNode(to) ?? this.getNodeByName(to)

    if (!fromNode || !toNode) {
      return {
        from,
        to,
        nodes: [],
        edges: [],
        reachable: false,
        description: `未找到节点：${!fromNode ? from : ''} ${!toNode ? to : ''}`.trim(),
      }
    }

    if (fromNode.id === toNode.id) {
      return {
        from: fromNode.id,
        to: toNode.id,
        nodes: [fromNode],
        edges: [],
        reachable: true,
        description: `${fromNode.name}（同节点）`,
      }
    }

    // BFS
    const queue: Array<{ nodeId: string; path: string[]; edges: ClassicKGEdge[] }> = [
      { nodeId: fromNode.id, path: [fromNode.id], edges: [] },
    ]
    const visited = new Set<string>([fromNode.id])

    while (queue.length > 0) {
      const cur = queue.shift()!
      if (cur.path.length - 1 >= maxDepth) continue

      for (const e of this.getOutEdges(cur.nodeId)) {
        if (visited.has(e.to)) continue
        visited.add(e.to)

        const newPath = [...cur.path, e.to]
        const newEdges = [...cur.edges, e]

        if (e.to === toNode.id) {
          const nodes = newPath.map(id => this.nodes.get(id)!).filter(Boolean)
          const desc = nodes
            .map((n, i) => {
              if (i === 0) return n.name
              const ed = newEdges[i - 1]
              return ` --${ed.type}--> ${n.name}`
            })
            .join('')
          return {
            from: fromNode.id,
            to: toNode.id,
            nodes,
            edges: newEdges,
            reachable: true,
            description: desc,
          }
        }

        queue.push({ nodeId: e.to, path: newPath, edges: newEdges })
      }
    }

    return {
      from: fromNode.id,
      to: toNode.id,
      nodes: [],
      edges: [],
      reachable: false,
      description: `${fromNode.name} → ${toNode.name} 不可达（深度限制 ${maxDepth}）`,
    }
  }

  /**
   * 获取规则的证据链
   * 从规则出发，沿 cites/explains/supports/depends_on 边追溯至典籍
   */
  getEvidenceChain(ruleId: string): EvidenceChainResult {
    const ruleNodeId = ruleId.startsWith('rule:') ? ruleId : `rule:${ruleId}`
    const ruleNode = this.nodes.get(ruleNodeId)

    if (!ruleNode) {
      return {
        ruleId,
        ruleName: undefined,
        chain: [],
        classics: [],
        quotations: [],
        supportScore: 0,
      }
    }

    const chain: ClassicKGNode[] = [ruleNode]
    const classics = new Set<string>()
    const quotations: Array<{ classic: string; chapter?: string; text: string }> = []
    const visited = new Set<string>([ruleNodeId])

    // BFS 沿 cites / depends_on / supports 边追溯
    const queue: string[] = [ruleNodeId]
    let supportSum = 0
    let supportCount = 0

    while (queue.length > 0) {
      const curId = queue.shift()!
      for (const e of this.getOutEdges(curId)) {
        if (visited.has(e.to)) continue
        if (!['cites', 'depends_on', 'supports', 'explains'].includes(e.type)) continue
        visited.add(e.to)

        const target = this.nodes.get(e.to)
        if (!target) continue

        chain.push(target)

        if (target.type === 'classic') {
          classics.add(target.name)
          if (e.originalText) {
            quotations.push({
              classic: target.name,
              chapter: e.chapter,
              text: e.originalText,
            })
          }
          supportSum += e.weight ?? 0.5
          supportCount += 1
        }

        queue.push(e.to)
      }
    }

    const supportScore = supportCount > 0 ? Number((supportSum / supportCount).toFixed(4)) : 0

    return {
      ruleId: ruleNode.id.replace('rule:', ''),
      ruleName: ruleNode.name,
      chain,
      classics: Array.from(classics),
      quotations,
      supportScore,
    }
  }

  /**
   * 获取某五行的经典支持度
   * 汇总典籍对该五行的支持/反对情况
   */
  getClassicSupport(wuxing: string): WuxingClassicSupport {
    const wuxingNode = this.nodesByName.get(wuxing)
    const supportingClassics = new Set<string>()
    const opposingClassics = new Set<string>()
    const quotations: Array<{ classic: string; chapter?: string; text: string; supports: boolean }> = []

    // 若五行节点不存在，仍尝试按名称在边中匹配
    const targetIds = new Set<string>()
    if (wuxingNode) targetIds.add(wuxingNode.id)
    // 同时匹配以该五行作为 wuxing 属性的节点
    for (const n of this.nodes.values()) {
      if (n.wuxing === wuxing) targetIds.add(n.id)
    }

    for (const targetId of targetIds) {
      for (const e of this.getInEdges(targetId)) {
        if (e.type !== 'supports' && e.type !== 'contradicts') continue
        const source = this.nodes.get(e.from)
        if (!source || source.type !== 'classic') continue

        if (e.type === 'supports') {
          supportingClassics.add(source.name)
          quotations.push({
            classic: source.name,
            chapter: e.chapter,
            text: e.originalText ?? e.reason ?? '',
            supports: true,
          })
        } else {
          opposingClassics.add(source.name)
          quotations.push({
            classic: source.name,
            chapter: e.chapter,
            text: e.originalText ?? e.reason ?? '',
            supports: false,
          })
        }
      }
    }

    const total = supportingClassics.size + opposingClassics.size
    const supportScore = total > 0
      ? Number((supportingClassics.size / total).toFixed(4))
      : 0.5

    return {
      wuxing,
      supportingClassics: Array.from(supportingClassics),
      opposingClassics: Array.from(opposingClassics),
      quotations,
      supportScore,
    }
  }

  // ---------- 统计与导出 ----------

  /** 获取图谱统计 */
  getStats(): {
    totalNodes: number
    totalEdges: number
    nodesByType: Record<string, number>
    edgesByType: Record<string, number>
  } {
    const nodesByType: Record<string, number> = {}
    for (const [type, ids] of this.nodesByType) nodesByType[type] = ids.size
    const edgesByType: Record<string, number> = {}
    for (const e of this.edges.values()) edgesByType[e.type] = (edgesByType[e.type] || 0) + 1
    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      nodesByType,
      edgesByType,
    }
  }

  /** 导出完整图谱 */
  exportGraph(): { nodes: ClassicKGNode[]; edges: ClassicKGEdge[]; stats: ReturnType<ClassicKnowledgeGraph['getStats']> } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      stats: this.getStats(),
    }
  }
}

// ============================================================
// 种子数据：节点
// ============================================================

/** 典籍节点（5部核心典籍 + 2部辅助典籍） */
const classicNodes: ClassicKGNode[] = [
  {
    id: 'ck:滴天髓',
    type: 'classic',
    name: '滴天髓',
    description: '相传京图撰、刘伯温注，重日主衰旺与天干喜忌，命理最高经典之一',
    chapters: ['通神论', '天干十论', '地支', '形象', '方局', '八格', '体用', '中和'],
  },
  {
    id: 'ck:子平真诠',
    type: 'classic',
    name: '子平真诠',
    description: '清沈孝瞻著，重月令格局与用神取法，格局派宗师之作',
    chapters: ['论月令', '论用神', '论用神成败', '论用神配六亲', '论行运', '论十干'],
  },
  {
    id: 'ck:穷通宝鉴',
    type: 'classic',
    name: '穷通宝鉴',
    description: '调候之宗，按月令论天干喜忌，重气候寒暖燥湿',
    chapters: ['春木', '夏火', '秋金', '冬水', '四季土', '调候'],
  },
  {
    id: 'ck:三命通会',
    type: 'classic',
    name: '三命通会',
    description: '明万民英著，命理百科全书，集诸家之大成',
    chapters: ['论五行', '论十干', '论地支', '论神煞', '论三刑', '论三合'],
  },
  {
    id: 'ck:渊海子平',
    type: 'classic',
    name: '渊海子平',
    description: '子平派祖书，徐子平一脉所传，开宗立派之作',
    chapters: ['论五行生克', '论天干地支', '论用神', '论化合', '论六亲'],
  },
  {
    id: 'ck:神峰通考',
    type: 'classic',
    name: '神峰通考',
    description: '明张神峰著，倡"盖头说""病药说"，多与主流异见',
    chapters: ['盖头说', '病药说', '雕枯旺弱四字说'],
  },
  {
    id: 'ck:命理约言',
    type: 'classic',
    name: '命理约言',
    description: '清陈素庵著，重格局简化与用神归纳',
    chapters: ['论格局', '论用神', '论五行'],
  },
]

/** 概念节点（核心命理概念） */
const conceptNodes: ClassicKGNode[] = [
  { id: 'cpt:扶抑', type: 'concept', name: '扶抑', description: '日主衰则扶之，旺则抑之，平衡为要' },
  { id: 'cpt:调候', type: 'concept', name: '调候', description: '审度月令气候寒暖燥湿以定天干喜忌' },
  { id: 'cpt:病药', type: 'concept', name: '病药', description: '以病为忌，以药为喜，去病即安' },
  { id: 'cpt:通关', type: 'concept', name: '通关', description: '两行相争，取中间之行调和' },
  { id: 'cpt:格局', type: 'concept', name: '格局', description: '月令所司令之气立格，由天干透出立局' },
  { id: 'cpt:月令', type: 'concept', name: '月令', description: '月支所司令之气，格局用神所出' },
  { id: 'cpt:用神', type: 'concept', name: '用神', description: '命局所赖以平衡之神' },
  { id: 'cpt:忌神', type: 'concept', name: '忌神', description: '克损用神、破坏平衡之神' },
  { id: 'cpt:身强', type: 'concept', name: '身强', description: '日主得令得地得势，气盛' },
  { id: 'cpt:身弱', type: 'concept', name: '身弱', description: '日主失令失地，气衰' },
  { id: 'cpt:寒木向阳', type: 'concept', name: '寒木向阳', description: '冬月木气寒冷，需丙火照暖方能生发' },
  { id: 'cpt:化气', type: 'concept', name: '化气', description: '天干五合得令则化，化则从所化之气论' },
  { id: 'cpt:从格', type: 'concept', name: '从格', description: '日主极弱无依，从其势而论，喜忌反转' },
  { id: 'cpt:盖头', type: 'concept', name: '盖头', description: '天干克地支，如戊土盖头于子水' },
]

/** 五行节点 */
const wuxingNodes: ClassicKGNode[] = [
  { id: 'wx:木', type: 'wuxing', name: '木', wuxing: '木', description: '东方木，主仁，生火克土' },
  { id: 'wx:火', type: 'wuxing', name: '火', wuxing: '火', description: '南方火，主礼，生土克金' },
  { id: 'wx:土', type: 'wuxing', name: '土', wuxing: '土', description: '中央土，主信，生金克水' },
  { id: 'wx:金', type: 'wuxing', name: '金', wuxing: '金', description: '西方金，主义，生水克木' },
  { id: 'wx:水', type: 'wuxing', name: '水', wuxing: '水', description: '北方水，主智，生木克火' },
]

/** 流派节点 */
const schoolNodes: ClassicKGNode[] = [
  { id: 'sch:格局派', type: 'school', name: '格局派', school: '格局派', description: '重月令格局与用神取法，宗子平真诠' },
  { id: 'sch:调候派', type: 'school', name: '调候派', school: '调候派', description: '重月令气候寒暖，宗穷通宝鉴' },
  { id: 'sch:旺衰派', type: 'school', name: '旺衰派', school: '旺衰派', description: '重日主衰旺与扶抑，宗滴天髓' },
  { id: 'sch:病药派', type: 'school', name: '病药派', school: '病药派', description: '重病药之说，宗神峰通考' },
]

/** 规则节点（代表性规则，展示规则—典籍链路） */
const ruleNodes: ClassicKGNode[] = [
  {
    id: 'rule:BALANCE-STRONG-001',
    type: 'rule',
    name: '身强用抑规则',
    description: '日主身强，取克泄耗为用，扶抑法核心规则',
    meta: { category: 'fuyi' },
  },
  {
    id: 'rule:BALANCE-WEAK-001',
    type: 'rule',
    name: '身弱用扶规则',
    description: '日主身弱，取生扶为用，扶抑法核心规则',
    meta: { category: 'fuyi' },
  },
  {
    id: 'rule:TIAOHOU-WINTER-WOOD-001',
    type: 'rule',
    name: '冬木调候规则',
    description: '冬月木气寒冷，取丙火照暖为用，调候法核心规则',
    meta: { category: 'tiaohou' },
  },
  {
    id: 'rule:BINGYAO-QI-SHA-001',
    type: 'rule',
    name: '七杀有制为权规则',
    description: '七杀为病，食神制之为药，病药法核心规则',
    meta: { category: 'bingyao' },
  },
  {
    id: 'rule:TONGGUAN-SHA-E-001',
    type: 'rule',
    name: '杀印通关规则',
    description: '杀与日主相争，取印星通关调和，通关法核心规则',
    meta: { category: 'tongguan' },
  },
  {
    id: 'rule:GEJU-ZHENG-GUAN-001',
    type: 'rule',
    name: '正官格取用规则',
    description: '月令透正官，取财生官为用，格局法核心规则',
    meta: { category: 'geju' },
  },
]

/** 全部种子节点（共 33 个） */
const SEED_CLASSIC_NODES: ClassicKGNode[] = [
  ...classicNodes,
  ...conceptNodes,
  ...wuxingNodes,
  ...schoolNodes,
  ...ruleNodes,
]

// ============================================================
// 种子数据：边
// ============================================================

const SEED_CLASSIC_EDGES: ClassicKGEdge[] = [
  // ---------- 典籍 解释 概念（originates） ----------
  { id: 'e:cpt-fuyi-origin-1', from: 'cpt:扶抑', to: 'ck:子平真诠', type: 'originates', reason: '扶抑法出于子平真诠用神篇', chapter: '论用神', originalText: '用神之取，不外扶抑、病药、通关、调候', weight: 0.95, consensusScore: 0.95 },
  { id: 'e:cpt-fuyi-origin-2', from: 'cpt:扶抑', to: 'ck:滴天髓', type: 'originates', reason: '日主衰旺之辨见滴天髓', chapter: '天干十论', originalText: '五阳皆阳丙为最，五阴皆阴癸为至', weight: 0.85, consensusScore: 0.85 },
  { id: 'e:cpt-tiaohou-origin-1', from: 'cpt:调候', to: 'ck:穷通宝鉴', type: 'originates', reason: '调候法以穷通宝鉴为宗', chapter: '调候', originalText: '春木先用丙火后用癸水', weight: 1.0, consensusScore: 1.0 },
  { id: 'e:cpt-bingyao-origin-1', from: 'cpt:病药', to: 'ck:神峰通考', type: 'originates', reason: '病药说出于神峰通考', chapter: '病药说', originalText: '有病方为贵，无伤不是奇', weight: 0.9, consensusScore: 0.9 },
  { id: 'e:cpt-bingyao-origin-2', from: 'cpt:病药', to: 'ck:子平真诠', type: 'originates', reason: '病药之说亦见子平真诠用神篇', chapter: '论用神', originalText: '用神之取，不外扶抑、病药、通关、调候', weight: 0.7, consensusScore: 0.8 },
  { id: 'e:cpt-tongguan-origin-1', from: 'cpt:通关', to: 'ck:滴天髓', type: 'originates', reason: '通关之说见滴天髓', chapter: '通神论', originalText: '通关之气，乃中和之道', weight: 0.85, consensusScore: 0.85 },
  { id: 'e:cpt-geju-origin-1', from: 'cpt:格局', to: 'ck:子平真诠', type: 'originates', reason: '格局之法出于子平真诠', chapter: '论月令', originalText: '八字用神，专凭月令', weight: 1.0, consensusScore: 1.0 },
  { id: 'e:cpt-yueling-origin-1', from: 'cpt:月令', to: 'ck:子平真诠', type: 'originates', reason: '月令为格局所出，子平真诠论之最详', chapter: '论月令', originalText: '月令乃用神之提纲', weight: 1.0, consensusScore: 1.0 },
  { id: 'e:cpt-yongshen-origin-1', from: 'cpt:用神', to: 'ck:子平真诠', type: 'originates', reason: '用神之取法见子平真诠用神篇', chapter: '论用神', originalText: '用神之取，不外扶抑、病药、通关、调候', weight: 1.0, consensusScore: 1.0 },
  { id: 'e:cpt-yongshen-origin-2', from: 'cpt:用神', to: 'ck:渊海子平', type: 'originates', reason: '用神之名出于渊海子平', chapter: '论用神', originalText: '用神者，命局之枢纽', weight: 0.8, consensusScore: 0.8 },
  { id: 'e:cpt-jishen-origin-1', from: 'cpt:忌神', to: 'ck:子平真诠', type: 'originates', reason: '忌神克损用神，子平真诠论之', chapter: '论用神', originalText: '忌神者，害用之神也', weight: 0.95, consensusScore: 0.95 },
  { id: 'e:cpt-shenqiang-origin-1', from: 'cpt:身强', to: 'ck:滴天髓', type: 'originates', reason: '日主衰旺之辨见滴天髓', chapter: '天干十论', originalText: '甲木参天，脱胎要火', weight: 0.9, consensusScore: 0.9 },
  { id: 'e:cpt-shenruo-origin-1', from: 'cpt:身弱', to: 'ck:滴天髓', type: 'originates', reason: '日主衰旺之辨见滴天髓', chapter: '天干十论', originalText: '乙木虽柔，刲羊解牛', weight: 0.9, consensusScore: 0.9 },
  { id: 'e:cpt-hanmuxiangyang-origin-1', from: 'cpt:寒木向阳', to: 'ck:穷通宝鉴', type: 'originates', reason: '寒木向阳之说出于穷通宝鉴调候篇', chapter: '春木', originalText: '冬木寒冷，先用丙火照暖', weight: 1.0, consensusScore: 1.0 },
  { id: 'e:cpt-huaqi-origin-1', from: 'cpt:化气', to: 'ck:渊海子平', type: 'originates', reason: '化气之法出于渊海子平论化合', chapter: '论化合', originalText: '甲己合化土，乙庚合化金', weight: 0.95, consensusScore: 0.85 },
  { id: 'e:cpt-congge-origin-1', from: 'cpt:从格', to: 'ck:滴天髓', type: 'originates', reason: '从格之说见滴天髓', chapter: '形象', originalText: '一成不可变，从其势而论', weight: 0.85, consensusScore: 0.8 },
  { id: 'e:cpt-gaitou-origin-1', from: 'cpt:盖头', to: 'ck:神峰通考', type: 'originates', reason: '盖头说出于神峰通考', chapter: '盖头说', originalText: '盖头者，天干克地支也', weight: 0.9, consensusScore: 0.85 },

  // ---------- 概念 leads_to 概念（推论链） ----------
  { id: 'e:lead-yueling-geju', from: 'cpt:月令', to: 'cpt:格局', type: 'leads_to', reason: '月令所司令之气立格', weight: 0.95, consensusScore: 0.95 },
  { id: 'e:lead-geju-yongshen', from: 'cpt:格局', to: 'cpt:用神', type: 'leads_to', reason: '格局既立，用神乃定', weight: 0.9, consensusScore: 0.9 },
  { id: 'e:lead-yongshen-jishen', from: 'cpt:用神', to: 'cpt:忌神', type: 'leads_to', reason: '用神既定，克用者即忌神', weight: 0.9, consensusScore: 0.9 },
  { id: 'e:lead-shenqiang-fuyi', from: 'cpt:身强', to: 'cpt:扶抑', type: 'leads_to', reason: '身强则抑之，扶抑法立', weight: 0.9, consensusScore: 0.9 },
  { id: 'e:lead-shenruo-fuyi', from: 'cpt:身弱', to: 'cpt:扶抑', type: 'leads_to', reason: '身弱则扶之，扶抑法立', weight: 0.9, consensusScore: 0.9 },
  { id: 'e:lead-hanmuxiangyang-tiaohou', from: 'cpt:寒木向阳', to: 'cpt:调候', type: 'leads_to', reason: '寒木向阳是调候法之具体应用', weight: 0.95, consensusScore: 0.95 },
  { id: 'e:lead-bingyao-yongshen', from: 'cpt:病药', to: 'cpt:用神', type: 'leads_to', reason: '以病为忌，以药为用神', weight: 0.9, consensusScore: 0.9 },
  { id: 'e:lead-tongguan-yongshen', from: 'cpt:通关', to: 'cpt:用神', type: 'leads_to', reason: '通关之神即用神之一种', weight: 0.85, consensusScore: 0.85 },

  // ---------- 概念 depends_on 概念 ----------
  { id: 'e:dep-geju-yueling', from: 'cpt:格局', to: 'cpt:月令', type: 'depends_on', reason: '格局依赖月令所司之气', weight: 1.0, consensusScore: 1.0 },
  { id: 'e:dep-fuyi-shenqiang', from: 'cpt:扶抑', to: 'cpt:身强', type: 'depends_on', reason: '扶抑法依赖日主衰旺之辨', weight: 0.9, consensusScore: 0.9 },
  { id: 'e:dep-fuyi-shenruo', from: 'cpt:扶抑', to: 'cpt:身弱', type: 'depends_on', reason: '扶抑法依赖日主衰旺之辨', weight: 0.9, consensusScore: 0.9 },
  { id: 'e:dep-tiaohou-yueling', from: 'cpt:调候', to: 'cpt:月令', type: 'depends_on', reason: '调候依赖月令气候', weight: 0.95, consensusScore: 0.95 },

  // ---------- 典籍 supports 规则 ----------
  { id: 'e:sup-dts-balance-strong', from: 'ck:滴天髓', to: 'rule:BALANCE-STRONG-001', type: 'supports', reason: '滴天髓论日主衰旺，支持身强用抑', chapter: '通神论', originalText: '旺则损之，衰则益之', weight: 0.95, consensusScore: 0.95 },
  { id: 'e:sup-zpzq-balance-strong', from: 'ck:子平真诠', to: 'rule:BALANCE-STRONG-001', type: 'supports', reason: '子平真诠用神篇扶抑法', chapter: '论用神', originalText: '用神之取，不外扶抑', weight: 0.9, consensusScore: 0.9 },
  { id: 'e:sup-zpzq-balance-weak', from: 'ck:子平真诠', to: 'rule:BALANCE-WEAK-001', type: 'supports', reason: '子平真诠用神篇扶抑法', chapter: '论用神', originalText: '用神之取，不外扶抑', weight: 0.9, consensusScore: 0.9 },
  { id: 'e:sup-dts-balance-weak', from: 'ck:滴天髓', to: 'rule:BALANCE-WEAK-001', type: 'supports', reason: '滴天髓论日主衰旺，支持身弱用扶', chapter: '通神论', originalText: '旺则损之，衰则益之', weight: 0.95, consensusScore: 0.95 },
  { id: 'e:sup-qgbj-tiaohou-winter', from: 'ck:穷通宝鉴', to: 'rule:TIAOHOU-WINTER-WOOD-001', type: 'supports', reason: '穷通宝鉴调候法核心', chapter: '春木', originalText: '冬木寒冷，先用丙火照暖', weight: 1.0, consensusScore: 1.0 },
  { id: 'e:sup-sftk-bingyao', from: 'ck:神峰通考', to: 'rule:BINGYAO-QI-SHA-001', type: 'supports', reason: '病药说核心', chapter: '病药说', originalText: '有病方为贵，无伤不是奇', weight: 1.0, consensusScore: 0.95 },
  { id: 'e:sup-zpzq-bingyao', from: 'ck:子平真诠', to: 'rule:BINGYAO-QI-SHA-001', type: 'supports', reason: '七杀有制为权', chapter: '论用神', originalText: '七杀有制，化为权柄', weight: 0.85, consensusScore: 0.9 },
  { id: 'e:sup-dts-tongguan', from: 'ck:滴天髓', to: 'rule:TONGGUAN-SHA-E-001', type: 'supports', reason: '通关之气见滴天髓', chapter: '通神论', originalText: '通关之气，乃中和之道', weight: 0.9, consensusScore: 0.9 },
  { id: 'e:sup-zpzq-geju-zhengguan', from: 'ck:子平真诠', to: 'rule:GEJU-ZHENG-GUAN-001', type: 'supports', reason: '正官格取用见子平真诠', chapter: '论月令', originalText: '八字用神，专凭月令', weight: 1.0, consensusScore: 1.0 },
  { id: 'e:sup-yhqp-geju-zhengguan', from: 'ck:渊海子平', to: 'rule:GEJU-ZHENG-GUAN-001', type: 'supports', reason: '正官格亦见渊海子平', chapter: '论用神', originalText: '正官者，六格之首', weight: 0.85, consensusScore: 0.9 },

  // ---------- 规则 cites 典籍 ----------
  { id: 'e:cite-balance-strong-dts', from: 'rule:BALANCE-STRONG-001', to: 'ck:滴天髓', type: 'cites', reason: '身强用抑规则引用滴天髓', chapter: '通神论', originalText: '旺则损之，衰则益之', weight: 0.95 },
  { id: 'e:cite-balance-weak-dts', from: 'rule:BALANCE-WEAK-001', to: 'ck:滴天髓', type: 'cites', reason: '身弱用扶规则引用滴天髓', chapter: '通神论', originalText: '旺则损之，衰则益之', weight: 0.95 },
  { id: 'e:cite-tiaohou-qgbj', from: 'rule:TIAOHOU-WINTER-WOOD-001', to: 'ck:穷通宝鉴', type: 'cites', reason: '冬木调候规则引用穷通宝鉴', chapter: '春木', originalText: '冬木寒冷，先用丙火照暖', weight: 1.0 },
  { id: 'e:cite-bingyao-sftk', from: 'rule:BINGYAO-QI-SHA-001', to: 'ck:神峰通考', type: 'cites', reason: '病药规则引用神峰通考', chapter: '病药说', originalText: '有病方为贵，无伤不是奇', weight: 1.0 },
  { id: 'e:cite-tongguan-dts', from: 'rule:TONGGUAN-SHA-E-001', to: 'ck:滴天髓', type: 'cites', reason: '通关规则引用滴天髓', chapter: '通神论', originalText: '通关之气，乃中和之道', weight: 0.9 },
  { id: 'e:cite-geju-zpzq', from: 'rule:GEJU-ZHENG-GUAN-001', to: 'ck:子平真诠', type: 'cites', reason: '正官格规则引用子平真诠', chapter: '论月令', originalText: '八字用神，专凭月令', weight: 1.0 },

  // ---------- 规则 depends_on 概念 ----------
  { id: 'e:dep-balance-strong-fuyi', from: 'rule:BALANCE-STRONG-001', to: 'cpt:扶抑', type: 'depends_on', reason: '身强用抑依赖扶抑概念', weight: 1.0 },
  { id: 'e:dep-balance-weak-fuyi', from: 'rule:BALANCE-WEAK-001', to: 'cpt:扶抑', type: 'depends_on', reason: '身弱用扶依赖扶抑概念', weight: 1.0 },
  { id: 'e:dep-tiaohou-winter-cpt', from: 'rule:TIAOHOU-WINTER-WOOD-001', to: 'cpt:调候', type: 'depends_on', reason: '冬木调候依赖调候概念', weight: 1.0 },
  { id: 'e:dep-bingyao-cpt', from: 'rule:BINGYAO-QI-SHA-001', to: 'cpt:病药', type: 'depends_on', reason: '七杀有制依赖病药概念', weight: 1.0 },
  { id: 'e:dep-tongguan-cpt', from: 'rule:TONGGUAN-SHA-E-001', to: 'cpt:通关', type: 'depends_on', reason: '杀印通关依赖通关概念', weight: 1.0 },
  { id: 'e:dep-geju-zhengguan-cpt', from: 'rule:GEJU-ZHENG-GUAN-001', to: 'cpt:格局', type: 'depends_on', reason: '正官格依赖格局概念', weight: 1.0 },

  // ---------- 典籍 supports 五行（用于 getClassicSupport） ----------
  { id: 'e:sup-qgbj-wood', from: 'ck:穷通宝鉴', to: 'wx:木', type: 'supports', reason: '穷通宝鉴论春木喜丙火', chapter: '春木', originalText: '春木先用丙火后用癸水', weight: 0.95 },
  { id: 'e:sup-qgbj-fire', from: 'ck:穷通宝鉴', to: 'wx:火', type: 'supports', reason: '穷通宝鉴论夏火喜壬水', chapter: '夏火', originalText: '夏火先用壬水后用庚金', weight: 0.95 },
  { id: 'e:sup-qgbj-metal', from: 'ck:穷通宝鉴', to: 'wx:金', type: 'supports', reason: '穷通宝鉴论秋金喜火炼', chapter: '秋金', originalText: '秋金先用丁火后用甲木', weight: 0.95 },
  { id: 'e:sup-qgbj-water', from: 'ck:穷通宝鉴', to: 'wx:水', type: 'supports', reason: '穷通宝鉴论冬水喜戊土', chapter: '冬水', originalText: '冬水先用戊土后用丙火', weight: 0.95 },
  { id: 'e:sup-dts-water', from: 'ck:滴天髓', to: 'wx:水', type: 'supports', reason: '滴天髓论壬水通河', chapter: '天干十论', originalText: '壬水通河，能泄金气', weight: 0.85 },
  { id: 'e:sup-dts-fire', from: 'ck:滴天髓', to: 'wx:火', type: 'supports', reason: '滴天髓论丙火猛烈', chapter: '天干十论', originalText: '丙火猛烈，欺霜侮雪', weight: 0.85 },

  // ---------- 流派 supports 典籍/概念 ----------
  { id: 'e:sup-gejupai-zpzq', from: 'sch:格局派', to: 'ck:子平真诠', type: 'supports', reason: '格局派宗子平真诠', weight: 1.0 },
  { id: 'e:sup-tiaohoupai-qgbj', from: 'sch:调候派', to: 'ck:穷通宝鉴', type: 'supports', reason: '调候派宗穷通宝鉴', weight: 1.0 },
  { id: 'e:sup-wangshuaipai-dts', from: 'sch:旺衰派', to: 'ck:滴天髓', type: 'supports', reason: '旺衰派宗滴天髓', weight: 1.0 },
  { id: 'e:sup-bingyaopai-sftk', from: 'sch:病药派', to: 'ck:神峰通考', type: 'supports', reason: '病药派宗神峰通考', weight: 1.0 },
  { id: 'e:sup-gejupai-cpt', from: 'sch:格局派', to: 'cpt:格局', type: 'supports', reason: '格局派主格局论', weight: 1.0 },
  { id: 'e:sup-tiaohoupai-cpt', from: 'sch:调候派', to: 'cpt:调候', type: 'supports', reason: '调候派主调候论', weight: 1.0 },
  { id: 'e:sup-wangshuaipai-cpt', from: 'sch:旺衰派', to: 'cpt:扶抑', type: 'supports', reason: '旺衰派主扶抑论', weight: 1.0 },
  { id: 'e:sup-bingyaopai-cpt', from: 'sch:病药派', to: 'cpt:病药', type: 'supports', reason: '病药派主病药论', weight: 1.0 },

  // ---------- 典籍 contradicts 典籍（争议关系示例） ----------
  { id: 'e:ctr-sftk-zpzq', from: 'ck:神峰通考', to: 'ck:子平真诠', type: 'contradicts', reason: '神峰通考对子平真诠部分格局取法有异见', originalText: '格局之说不必泥于月令', weight: 0.5, consensusScore: 0.4 },
  { id: 'e:ctr-mlyy-zpzq', from: 'ck:命理约言', to: 'ck:子平真诠', type: 'contradicts', reason: '命理约言主张格局从简，与子平真诠多格不同', originalText: '格局当简，不必立诸名目', weight: 0.6, consensusScore: 0.5 },

  // ---------- 概念 explains 概念（补充论证） ----------
  { id: 'e:exp-hanmu-tiaohou', from: 'cpt:寒木向阳', to: 'cpt:调候', type: 'explains', reason: '寒木向阳是调候法的具体应用例', weight: 0.9 },
  { id: 'e:exp-gaitou-bingyao', from: 'cpt:盖头', to: 'cpt:病药', type: 'explains', reason: '盖头是病药说的一种具体病象', weight: 0.85 },
  { id: 'e:exp-huaqi-geju', from: 'cpt:化气', to: 'cpt:格局', type: 'explains', reason: '化气格是格局之一种', weight: 0.85 },
  { id: 'e:exp-congge-fuyi', from: 'cpt:从格', to: 'cpt:扶抑', type: 'contradicts', reason: '从格喜忌反转，与扶抑法相反', weight: 0.8, consensusScore: 0.85 },

  // ---------- 典籍 explains 五行（具体五行论述） ----------
  { id: 'e:exp-dts-wood', from: 'ck:滴天髓', to: 'wx:木', type: 'explains', reason: '滴天髓论甲乙木', chapter: '天干十论', originalText: '甲木参天，乙木虽柔', weight: 0.95 },
  { id: 'e:exp-dts-fire', from: 'ck:滴天髓', to: 'wx:火', type: 'explains', reason: '滴天髓论丙丁火', chapter: '天干十论', originalText: '丙火猛烈，丁火柔中', weight: 0.95 },
  { id: 'e:exp-dts-earth', from: 'ck:滴天髓', to: 'wx:土', type: 'explains', reason: '滴天髓论戊己土', chapter: '天干十论', originalText: '戊土固重，己土卑湿', weight: 0.95 },
  { id: 'e:exp-dts-metal', from: 'ck:滴天髓', to: 'wx:金', type: 'explains', reason: '滴天髓论庚辛金', chapter: '天干十论', originalText: '庚金带煞，辛金软弱', weight: 0.95 },
  { id: 'e:exp-dts-water', from: 'ck:滴天髓', to: 'wx:水', type: 'explains', reason: '滴天髓论壬癸水', chapter: '天干十论', originalText: '壬水通河，癸水至弱', weight: 0.95 },
  { id: 'e:exp-smth-wood', from: 'ck:三命通会', to: 'wx:木', type: 'explains', reason: '三命通会论木之性', chapter: '论五行', originalText: '木主仁，其性直，其情和', weight: 0.85 },
  { id: 'e:exp-smth-fire', from: 'ck:三命通会', to: 'wx:火', type: 'explains', reason: '三命通会论火之性', chapter: '论五行', originalText: '火主礼，其性急，其情恭', weight: 0.85 },
  { id: 'e:exp-smth-earth', from: 'ck:三命通会', to: 'wx:土', type: 'explains', reason: '三命通会论土之性', chapter: '论五行', originalText: '土主信，其性重，其情厚', weight: 0.85 },
  { id: 'e:exp-smth-metal', from: 'ck:三命通会', to: 'wx:金', type: 'explains', reason: '三命通会论金之性', chapter: '论五行', originalText: '金主义，其性刚，其情烈', weight: 0.85 },
  { id: 'e:exp-smth-water', from: 'ck:三命通会', to: 'wx:水', type: 'explains', reason: '三命通会论水之性', chapter: '论五行', originalText: '水主智，其性聪，其情善', weight: 0.85 },
]

// ============================================================
// 全局单例
// ============================================================

/** 全局古典知识图谱单例 */
export const globalClassicKG = new ClassicKnowledgeGraph()
