/**
 * P0-5B Knowledge Graph — 本体（Ontology）模块
 *
 * 定义中国命理学的概念层级体系：
 *   - 节点（OntologyNode）：典籍 / 概念 / 规则 / 证据 / 决策 / 五行 / 流派 / 命理模式
 *   - 边（OntologyEdge）：解释 / 支持 / 反驳 / 依赖 / 推论 / 引用 / 出自 / 佐证 / 决定
 *
 * OntologyManager 维护可查询的概念图谱，是知识图谱的概念骨架。
 * 上层 KnowledgeGraph 通过 OntologyManager 获取节点/边的拓扑结构。
 *
 * 设计目标：
 *   1. 概念可扩展：随时 define 新节点、relate 新边
 *   2. 多视角查询：按类型、按邻居方向、按边类型
 *   3. 支持序列化：getDefinitions / loadDefinition 实现完整快照
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

// ============================================================
// 类型定义
// ============================================================

/** 本体节点类型 */
export type OntologyNodeType =
  | 'classic'      // 典籍
  | 'concept'      // 命理概念
  | 'rule'         // 规则
  | 'evidence'     // 证据
  | 'decision'     // 决策
  | 'wuxing'       // 五行
  | 'school'       // 流派
  | 'pattern'      // 命理模式

/** 本体边类型（关系） */
export type OntologyEdgeType =
  | 'explains'      // 解释：典籍/流派 解释 概念/规则
  | 'supports'      // 支持：典籍/概念 支持 规则/五行
  | 'contradicts'   // 反驳：典籍/概念 反驳 规则/五行
  | 'depends_on'    // 依赖：规则/概念 依赖 概念
  | 'leads_to'      // 推论：概念 推论 概念/规则/决策
  | 'cites'         // 引用：规则 引用 典籍
  | 'originates'    // 出自：概念 出自 典籍
  | 'evidences'     // 佐证：证据 佐证 规则/决策
  | 'decides'       // 决定：决策 决定 五行/用神方向

/** 本体节点 */
export interface OntologyNode {
  /** 节点 ID（如 'ont:classic:滴天髓' 'ont:concept:扶抑' 'ont:wuxing:火'） */
  id: string
  /** 节点类型 */
  type: OntologyNodeType
  /** 节点显示名称 */
  label: string
  /** 节点描述 */
  description?: string
  /** 节点附加属性（如 chapters / dynasty / wuxing / school 等） */
  properties?: Record<string, any>
}

/** 本体边 */
export interface OntologyEdge {
  /** 起点 ID */
  from: string
  /** 终点 ID */
  to: string
  /** 边类型 */
  type: OntologyEdgeType
  /** 权重 0~1（用于支持度计算） */
  weight?: number
  /** 关系说明（自然语言） */
  description?: string
}

/** 本体定义（可序列化的完整快照） */
export interface OntologyDefinition {
  /** 本体版本 */
  version: string
  /** 节点列表 */
  nodes: OntologyNode[]
  /** 边列表 */
  edges: OntologyEdge[]
}

// ============================================================
// OntologyManager 本体管理器
// ============================================================

/**
 * 本体管理器
 *
 * 维护命理学概念层级的节点与边，提供：
 *   - define(node)         定义节点
 *   - relate(edge)         关联边
 *   - getNode / getNodesByType / getEdges  查询
 *   - getNeighbors         邻居查询（支持入/出/双向）
 *   - getDefinitions       导出完整快照
 *   - loadDefinition       从快照恢复
 */
export class OntologyManager {
  /** 节点表：nodeId → OntologyNode */
  private nodes = new Map<string, OntologyNode>()
  /** 边列表（按添加顺序） */
  private edges: OntologyEdge[] = []
  /** 按节点类型索引 */
  private nodesByType = new Map<OntologyNodeType, Set<string>>()
  /** 按边类型索引 */
  private edgesByType = new Map<OntologyEdgeType, OntologyEdge[]>()
  /** 按起点索引边（出边） */
  private edgesByFrom = new Map<string, OntologyEdge[]>()
  /** 按终点索引边（入边） */
  private edgesByTo = new Map<string, OntologyEdge[]>()
  /** 本体版本 */
  private version = '1.0.0'

  constructor() {
    this.loadSeed()
  }

  // ---------- 节点 / 边管理 ----------

  /** 定义节点（已存在则覆盖） */
  define(node: OntologyNode): void {
    this.nodes.set(node.id, node)
    if (!this.nodesByType.has(node.type)) {
      this.nodesByType.set(node.type, new Set())
    }
    this.nodesByType.get(node.type)!.add(node.id)
  }

  /** 关联边（同一对节点+类型可重复添加，会去重） */
  relate(edge: OntologyEdge): void {
    // 去重：相同 from + to + type 的边只保留一条（取后者）
    const exists = this.edges.find(
      e => e.from === edge.from && e.to === edge.to && e.type === edge.type,
    )
    if (exists) {
      // 合并 weight / description（后者覆盖）
      if (edge.weight !== undefined) exists.weight = edge.weight
      if (edge.description !== undefined) exists.description = edge.description
      return
    }

    this.edges.push(edge)

    if (!this.edgesByType.has(edge.type)) {
      this.edgesByType.set(edge.type, [])
    }
    this.edgesByType.get(edge.type)!.push(edge)

    if (!this.edgesByFrom.has(edge.from)) this.edgesByFrom.set(edge.from, [])
    this.edgesByFrom.get(edge.from)!.push(edge)

    if (!this.edgesByTo.has(edge.to)) this.edgesByTo.set(edge.to, [])
    this.edgesByTo.get(edge.to)!.push(edge)
  }

  // ---------- 查询 ----------

  /** 按 ID 获取节点 */
  getNode(id: string): OntologyNode | undefined {
    return this.nodes.get(id)
  }

  /** 按类型列出节点 */
  getNodesByType(type: OntologyNodeType): OntologyNode[] {
    const ids = this.nodesByType.get(type) ?? new Set()
    const out: OntologyNode[] = []
    for (const id of ids) {
      const n = this.nodes.get(id)
      if (n) out.push(n)
    }
    return out
  }

  /** 按边类型列出边（不传则返回全部） */
  getEdges(type?: OntologyEdgeType): OntologyEdge[] {
    if (!type) return [...this.edges]
    return [...(this.edgesByType.get(type) ?? [])]
  }

  /**
   * 获取邻居节点
   * @param nodeId 节点 ID
   * @param direction 'in' 入边邻居 / 'out' 出边邻居 / 'both' 双向（默认 'both'）
   */
  getNeighbors(nodeId: string, direction: 'in' | 'out' | 'both' = 'both'): OntologyNode[] {
    const result: OntologyNode[] = []
    const seen = new Set<string>()

    const collect = (edges: OntologyEdge[], useFrom: boolean) => {
      for (const e of edges) {
        const targetId = useFrom ? e.from : e.to
        if (targetId === nodeId) continue
        if (seen.has(targetId)) continue
        const n = this.nodes.get(targetId)
        if (n) {
          result.push(n)
          seen.add(targetId)
        }
      }
    }

    if (direction === 'out' || direction === 'both') {
      collect(this.edgesByFrom.get(nodeId) ?? [], false)
    }
    if (direction === 'in' || direction === 'both') {
      collect(this.edgesByTo.get(nodeId) ?? [], true)
    }

    return result
  }

  // ---------- 序列化 ----------

  /** 导出完整本体定义（快照） */
  getDefinitions(): OntologyDefinition {
    return {
      version: this.version,
      nodes: Array.from(this.nodes.values()),
      edges: this.edges.map(e => ({ ...e })),
    }
  }

  /** 从快照恢复本体（覆盖现有数据） */
  loadDefinition(def: OntologyDefinition): void {
    this.nodes.clear()
    this.edges = []
    this.nodesByType.clear()
    this.edgesByType.clear()
    this.edgesByFrom.clear()
    this.edgesByTo.clear()

    if (def.version) this.version = def.version
    for (const n of def.nodes) this.define(n)
    for (const e of def.edges) this.relate(e)
  }

  /** 获取统计 */
  getStats(): { totalNodes: number; totalEdges: number; nodesByType: Record<string, number>; edgesByType: Record<string, number> } {
    const nodesByType: Record<string, number> = {}
    for (const [type, ids] of this.nodesByType) nodesByType[type] = ids.size
    const edgesByType: Record<string, number> = {}
    for (const [type, list] of this.edgesByType) edgesByType[type] = list.length
    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      nodesByType,
      edgesByType,
    }
  }

  // ---------- 种子数据 ----------

  /** 加载种子本体（核心概念层级） */
  private loadSeed(): void {
    for (const n of SEED_ONTOLOGY_NODES) this.define(n)
    for (const e of SEED_ONTOLOGY_EDGES) this.relate(e)
  }
}

// ============================================================
// 种子数据：节点
// ============================================================

/** 典籍节点（5 部核心典籍） */
const classicNodes: OntologyNode[] = [
  {
    id: 'ont:classic:滴天髓',
    type: 'classic',
    label: '滴天髓',
    description: '相传京图撰、刘伯温注，重日主衰旺与天干喜忌，命理最高经典之一',
    properties: { dynasty: '明', chapters: ['通神论', '天干十论', '地支', '形象', '方局', '八格', '体用', '中和'] },
  },
  {
    id: 'ont:classic:子平真诠',
    type: 'classic',
    label: '子平真诠',
    description: '清沈孝瞻著，重月令格局与用神取法，格局派宗师之作',
    properties: { dynasty: '清', chapters: ['论月令', '论用神', '论用神成败', '论行运', '论十干'] },
  },
  {
    id: 'ont:classic:穷通宝鉴',
    type: 'classic',
    label: '穷通宝鉴',
    description: '调候之宗，按月令论天干喜忌，重气候寒暖燥湿',
    properties: { dynasty: '清', chapters: ['春木', '夏火', '秋金', '冬水', '四季土', '调候'] },
  },
  {
    id: 'ont:classic:三命通会',
    type: 'classic',
    label: '三命通会',
    description: '明万民英著，命理百科全书，集诸家之大成',
    properties: { dynasty: '明', chapters: ['论五行', '论十干', '论地支', '论神煞', '论三刑', '论三合'] },
  },
  {
    id: 'ont:classic:渊海子平',
    type: 'classic',
    label: '渊海子平',
    description: '子平派祖书，徐子平一脉所传，开宗立派之作',
    properties: { dynasty: '宋', chapters: ['论五行生克', '论天干地支', '论用神', '论化合', '论六亲'] },
  },
]

/** 概念节点（核心命理概念） */
const conceptNodes: OntologyNode[] = [
  { id: 'ont:concept:扶抑', type: 'concept', label: '扶抑', description: '日主衰则扶之，旺则抑之，平衡为要' },
  { id: 'ont:concept:调候', type: 'concept', label: '调候', description: '审度月令气候寒暖燥湿以定天干喜忌' },
  { id: 'ont:concept:病药', type: 'concept', label: '病药', description: '以病为忌，以药为喜，去病即安' },
  { id: 'ont:concept:通关', type: 'concept', label: '通关', description: '两行相争，取中间之行调和' },
  { id: 'ont:concept:格局', type: 'concept', label: '格局', description: '月令所司令之气立格，由天干透出立局' },
  { id: 'ont:concept:旺衰', type: 'concept', label: '旺衰', description: '日主得令得地得势之气盛衰之辨' },
  { id: 'ont:concept:用神', type: 'concept', label: '用神', description: '命局所赖以平衡之神' },
  { id: 'ont:concept:喜神', type: 'concept', label: '喜神', description: '辅佐用神、生扶用神之神' },
  { id: 'ont:concept:忌神', type: 'concept', label: '忌神', description: '克损用神、破坏平衡之神' },
]

/** 五行节点 */
const wuxingNodes: OntologyNode[] = [
  { id: 'ont:wuxing:金', type: 'wuxing', label: '金', description: '西方金，主义，生水克木', properties: { direction: '西', virtue: '义' } },
  { id: 'ont:wuxing:木', type: 'wuxing', label: '木', description: '东方木，主仁，生火克土', properties: { direction: '东', virtue: '仁' } },
  { id: 'ont:wuxing:水', type: 'wuxing', label: '水', description: '北方水，主智，生木克火', properties: { direction: '北', virtue: '智' } },
  { id: 'ont:wuxing:火', type: 'wuxing', label: '火', description: '南方火，主礼，生土克金', properties: { direction: '南', virtue: '礼' } },
  { id: 'ont:wuxing:土', type: 'wuxing', label: '土', description: '中央土，主信，生金克水', properties: { direction: '中', virtue: '信' } },
]

/** 决策节点（命理决策方向） */
const decisionNodes: OntologyNode[] = [
  { id: 'ont:decision:身强宜泄', type: 'decision', label: '身强宜泄', description: '日主身强，取克泄耗为用，宜食伤泄秀、财星耗身', properties: { direction: '泄耗' } },
  { id: 'ont:decision:身弱宜扶', type: 'decision', label: '身弱宜扶', description: '日主身弱，取生扶为用，宜印星生身、比劫助身', properties: { direction: '生扶' } },
  { id: 'ont:decision:寒需暖', type: 'decision', label: '寒需暖', description: '命局寒冷，需丙火照暖，调候用神取火', properties: { direction: '调候-暖' } },
  { id: 'ont:decision:热需凉', type: 'decision', label: '热需凉', description: '命局炎热，需壬水润泽，调候用神取水', properties: { direction: '调候-凉' } },
]

/** 流派节点 */
const schoolNodes: OntologyNode[] = [
  { id: 'ont:school:子平', type: 'school', label: '子平', description: '子平派祖，宗渊海子平与子平真诠，重格局用神' },
  { id: 'ont:school:滴天髓派', type: 'school', label: '滴天髓派', description: '宗滴天髓，重日主衰旺与扶抑' },
  { id: 'ont:school:穷通派', type: 'school', label: '穷通派', description: '宗穷通宝鉴，重月令气候调候' },
  { id: 'ont:school:现代', type: 'school', label: '现代', description: '现代命理综合派，融合格局、调候、旺衰诸法' },
]

/** 全部种子节点 */
const SEED_ONTOLOGY_NODES: OntologyNode[] = [
  ...classicNodes,
  ...conceptNodes,
  ...wuxingNodes,
  ...decisionNodes,
  ...schoolNodes,
]

// ============================================================
// 种子数据：边（概念知识链）
// ============================================================

const SEED_ONTOLOGY_EDGES: OntologyEdge[] = [
  // ---------- 知识链：滴天髓 →explains→ 扶抑 →leads_to→ 身强宜泄 →decides→ 火 ----------
  { from: 'ont:classic:滴天髓', to: 'ont:concept:扶抑', type: 'explains', weight: 0.9, description: '滴天髓论日主衰旺，为扶抑法之理论根基' },
  { from: 'ont:concept:扶抑', to: 'ont:decision:身强宜泄', type: 'leads_to', weight: 0.95, description: '扶抑法推论：身强则宜泄耗' },
  { from: 'ont:concept:扶抑', to: 'ont:decision:身弱宜扶', type: 'leads_to', weight: 0.95, description: '扶抑法推论：身弱则宜生扶' },
  { from: 'ont:decision:身强宜泄', to: 'ont:wuxing:火', type: 'decides', weight: 0.8, description: '身强宜泄：日主为木时取食伤火为用' },
  { from: 'ont:decision:身弱宜扶', to: 'ont:wuxing:水', type: 'decides', weight: 0.8, description: '身弱宜扶：日主为木时取印星水为用' },

  // ---------- 典籍 解释 概念 ----------
  { from: 'ont:classic:子平真诠', to: 'ont:concept:格局', type: 'explains', weight: 1.0, description: '子平真诠专论月令格局' },
  { from: 'ont:classic:子平真诠', to: 'ont:concept:用神', type: 'explains', weight: 1.0, description: '子平真诠用神篇定用神取法' },
  { from: 'ont:classic:穷通宝鉴', to: 'ont:concept:调候', type: 'explains', weight: 1.0, description: '穷通宝鉴为调候法之宗' },
  { from: 'ont:classic:三命通会', to: 'ont:concept:旺衰', type: 'explains', weight: 0.7, description: '三命通会论五行旺衰' },
  { from: 'ont:classic:渊海子平', to: 'ont:concept:用神', type: 'explains', weight: 0.8, description: '渊海子平首立用神之名' },

  // ---------- 概念 出自 典籍 ----------
  { from: 'ont:concept:扶抑', to: 'ont:classic:子平真诠', type: 'originates', weight: 0.95, description: '扶抑法出于子平真诠用神篇' },
  { from: 'ont:concept:调候', to: 'ont:classic:穷通宝鉴', type: 'originates', weight: 1.0, description: '调候法以穷通宝鉴为宗' },
  { from: 'ont:concept:格局', to: 'ont:classic:子平真诠', type: 'originates', weight: 1.0, description: '格局之法出于子平真诠' },
  { from: 'ont:concept:用神', to: 'ont:classic:渊海子平', type: 'originates', weight: 0.8, description: '用神之名出于渊海子平' },

  // ---------- 概念 leads_to 概念（推论链） ----------
  { from: 'ont:concept:旺衰', to: 'ont:concept:扶抑', type: 'leads_to', weight: 0.9, description: '旺衰既辨，扶抑法立' },
  { from: 'ont:concept:格局', to: 'ont:concept:用神', type: 'leads_to', weight: 0.9, description: '格局既立，用神乃定' },
  { from: 'ont:concept:用神', to: 'ont:concept:喜神', type: 'leads_to', weight: 0.9, description: '用神既定，生用者即喜神' },
  { from: 'ont:concept:用神', to: 'ont:concept:忌神', type: 'leads_to', weight: 0.9, description: '用神既定，克用者即忌神' },
  { from: 'ont:concept:病药', to: 'ont:concept:用神', type: 'leads_to', weight: 0.85, description: '以病为忌，以药为用神' },
  { from: 'ont:concept:通关', to: 'ont:concept:用神', type: 'leads_to', weight: 0.85, description: '通关之神即用神之一种' },

  // ---------- 概念 depends_on 概念 ----------
  { from: 'ont:concept:扶抑', to: 'ont:concept:旺衰', type: 'depends_on', weight: 1.0, description: '扶抑法依赖日主衰旺之辨' },
  { from: 'ont:concept:格局', to: 'ont:concept:旺衰', type: 'depends_on', weight: 0.7, description: '格局取用亦参旺衰' },
  { from: 'ont:concept:调候', to: 'ont:concept:旺衰', type: 'depends_on', weight: 0.6, description: '调候参气候亦参旺衰' },

  // ---------- 调候 决策链 ----------
  { from: 'ont:concept:调候', to: 'ont:decision:寒需暖', type: 'leads_to', weight: 0.95, description: '调候法推论：冬寒需丙火照暖' },
  { from: 'ont:concept:调候', to: 'ont:decision:热需凉', type: 'leads_to', weight: 0.95, description: '调候法推论：夏热需壬水润泽' },
  { from: 'ont:decision:寒需暖', to: 'ont:wuxing:火', type: 'decides', weight: 0.95, description: '寒需暖：调候取丙火为用' },
  { from: 'ont:decision:热需凉', to: 'ont:wuxing:水', type: 'decides', weight: 0.95, description: '热需凉：调候取壬水为用' },

  // ---------- 流派 supports 典籍/概念 ----------
  { from: 'ont:school:子平', to: 'ont:classic:子平真诠', type: 'supports', weight: 1.0, description: '子平派宗子平真诠' },
  { from: 'ont:school:子平', to: 'ont:concept:格局', type: 'supports', weight: 1.0, description: '子平派主格局论' },
  { from: 'ont:school:滴天髓派', to: 'ont:classic:滴天髓', type: 'supports', weight: 1.0, description: '滴天髓派宗滴天髓' },
  { from: 'ont:school:滴天髓派', to: 'ont:concept:扶抑', type: 'supports', weight: 1.0, description: '滴天髓派主扶抑论' },
  { from: 'ont:school:穷通派', to: 'ont:classic:穷通宝鉴', type: 'supports', weight: 1.0, description: '穷通派宗穷通宝鉴' },
  { from: 'ont:school:穷通派', to: 'ont:concept:调候', type: 'supports', weight: 1.0, description: '穷通派主调候论' },
  { from: 'ont:school:现代', to: 'ont:concept:扶抑', type: 'supports', weight: 0.7, description: '现代派融合扶抑法' },
  { from: 'ont:school:现代', to: 'ont:concept:调候', type: 'supports', weight: 0.7, description: '现代派融合调候法' },
  { from: 'ont:school:现代', to: 'ont:concept:格局', type: 'supports', weight: 0.7, description: '现代派融合格局法' },

  // ---------- 五行相生（pattern 关系） ----------
  { from: 'ont:wuxing:木', to: 'ont:wuxing:火', type: 'supports', weight: 1.0, description: '木生火' },
  { from: 'ont:wuxing:火', to: 'ont:wuxing:土', type: 'supports', weight: 1.0, description: '火生土' },
  { from: 'ont:wuxing:土', to: 'ont:wuxing:金', type: 'supports', weight: 1.0, description: '土生金' },
  { from: 'ont:wuxing:金', to: 'ont:wuxing:水', type: 'supports', weight: 1.0, description: '金生水' },
  { from: 'ont:wuxing:水', to: 'ont:wuxing:木', type: 'supports', weight: 1.0, description: '水生木' },

  // ---------- 五行相克（contradicts 关系） ----------
  { from: 'ont:wuxing:木', to: 'ont:wuxing:土', type: 'contradicts', weight: 1.0, description: '木克土' },
  { from: 'ont:wuxing:土', to: 'ont:wuxing:水', type: 'contradicts', weight: 1.0, description: '土克水' },
  { from: 'ont:wuxing:水', to: 'ont:wuxing:火', type: 'contradicts', weight: 1.0, description: '水克火' },
  { from: 'ont:wuxing:火', to: 'ont:wuxing:金', type: 'contradicts', weight: 1.0, description: '火克金' },
  { from: 'ont:wuxing:金', to: 'ont:wuxing:木', type: 'contradicts', weight: 1.0, description: '金克木' },
]

// ============================================================
// 全局单例
// ============================================================

/** 全局本体管理器单例 */
export const globalOntology = new OntologyManager()
