/**
 * C5 命理知识图谱（Knowledge Graph）
 *
 * 知识图谱节点 = 命理知识点
 * 知识图谱边 = 知识点之间的关系
 *
 * 示例：
 *   乙木 → [喜] → 丙火
 *   原因：寒木向阳
 *   来源：《穷通宝鉴》
 */

/** 知识节点类型 */
export type KGNodeType =
  | 'tiangan'      // 天干
  | 'dizhi'        // 地支
  | 'wuxing'       // 五行
  | 'shishen'      // 十神
  | 'shensha'      // 神煞
  | 'geju'         // 格局
  | 'xiyong'       // 喜用神
  | 'tiaohou'      // 调候
  | 'concept'      // 命理概念
  | 'classic'      // 典籍

/** 知识边类型（关系） */
export type KGEdgeType =
  | 'likes'        // 喜（如 乙木 喜 丙火）
  | 'dislikes'     // 忌（如 乙木 忌 庚金）
  | 'generates'    // 生（木生火）
  | 'overcomes'    // 克（木克土）
  | 'combines'     // 合（甲己合）
  | 'clashes'      // 冲（子午冲）
  | 'punishes'     // 刑
  | 'harms'        // 害
  | 'destroys'     // 破
  | 'depends_on'   // 依赖（如 格局 依赖 月令）
  | 'explains'     // 解释（如 典籍 解释 规则）
  | 'leads_to'     // 导致（如 伤官见官 导致 官非）
  | 'mitigates'    // 化解（如 印星 化解 七杀）

/** 知识节点 */
export interface KGNode {
  id: string
  type: KGNodeType
  name: string
  /** 五行属性（如 '木'） */
  wuxing?: string
  /** 阴阳 */
  yinYang?: 'yin' | 'yang'
  /** 描述 */
  description?: string
  /** 元数据 */
  meta?: Record<string, any>
}

/** 知识边 */
export interface KGEdge {
  id: string
  from: string  // source node id
  to: string    // target node id
  type: KGEdgeType
  /** 关系原因（如 "寒木向阳"） */
  reason?: string
  /** 引用典籍 */
  classicSource?: string
  /** 典籍篇章 */
  chapter?: string
  /** 原文引用 */
  originalText?: string
  /** 条件（该关系成立的前提） */
  condition?: string
  /** 权重 0~1 */
  weight?: number
}

/** 完整知识图谱 */
export interface KnowledgeGraph {
  nodes: KGNode[]
  edges: KGEdge[]
  /** 统计 */
  stats: {
    totalNodes: number
    totalEdges: number
    nodesByType: Record<string, number>
    edgesByType: Record<string, number>
  }
}

/** 查询结果 */
export interface KGQueryResult {
  /** 查询的起点节点 */
  source: KGNode
  /** 关联的边+目标节点 */
  relations: Array<{
    edge: KGEdge
    target: KGNode
  }>
  /** 查询路径（用于追溯） */
  path: string[]
}
