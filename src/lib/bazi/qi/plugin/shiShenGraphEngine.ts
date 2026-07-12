/**
 * ShiShenGraphEngine — P4.3 十神动态关系图引擎
 *
 * 古籍依据：
 *   《滴天髓》："生克制化，理数自然。" — 十神生克核心
 *   《子平真诠》："十神者，辅佐日干之十位也。" — 十神定义
 *
 * 核心设计：
 *   将十神之间的关系构建为有向图，支持 Graph Data 输出供前端可视化。
 *   十神之间的生克制化形成完整的动态网络，每个节点和边都带有命理权重。
 *
 * 原则：
 *   - 纯 Plugin，不修改 Kernel
 *   - import type 仅导入类型
 *   - 所有文本中文字符串
 *   - 所有注释使用中文
 */

// ─── 类型定义 ───

/** 图节点 */
export interface GraphNode {
  /** 唯一ID，如 'shishen-bijian' */
  id: string
  /** 中文名，如 '比肩' */
  name: string
  /** 类型分类：生扶/泄耗/克制/被克 */
  type: '生扶' | '泄耗' | '克制' | '被克'
  /** 对应五行 */
  element: string
  /** 力量强度 0-100 */
  strength: number
  /** 命理角色描述 */
  role: string
}

/** 图边 */
export interface GraphEdge {
  /** 源节点ID */
  from: string
  /** 目标节点ID */
  to: string
  /** 关系类型 */
  type: '生' | '克' | '合' | '冲' | '刑' | '害'
  /** 关系标签 */
  label: string
  /** 关系强度 0-100 */
  strength: number
  /** 关系描述 */
  description: string
}

/** 十神关系图完整结果 */
export interface ShiShenGraphResult {
  /** 生成时间 */
  generatedAt: string
  /** 节点列表 */
  nodes: GraphNode[]
  /** 边列表 */
  edges: GraphEdge[]
  /** 日主（中心节点）ID */
  centerNode: string
  /** 关系网络总结 */
  summary: string
  /** 关键关系描述列表 */
  keyRelationships: string[]
  /** 古籍引用 */
  classicalRef: string
}

/** 十神基础定义（静态配置） */
interface ShiShenDefinition {
  /** 唯一标识 */
  id: string
  /** 中文名 */
  name: string
  /** 分类：生扶/泄耗/克制/被克 */
  category: '生扶' | '泄耗' | '克制' | '被克'
  /** 对日主的五行关系关键词 */
  elementKeyword: string
  /** 命理角色 */
  defaultRole: string
  /** 五行推导规则：基于日主五行的映射函数 */
  resolveElement: (dayElement: string) => string
}

/** 关系边定义（静态模板） */
interface RelationTemplate {
  /** 源十神ID */
  from: string
  /** 目标十神ID */
  to: string
  /** 关系类型 */
  type: '生' | '克' | '合' | '冲' | '刑' | '害'
  /** 标签模板 */
  labelTemplate: string
  /** 描述模板 */
  descTemplate: string
  /** 基础强度 */
  baseStrength: number
}

// ─── 五行生克常量 ───

/** 五行相生 */
import { GENERATE, OVERCOME } from '../../../core'

/** 全部五行 */
const ALL_ELEMENTS = ['木', '火', '土', '金', '水']

// ─── 十神静态定义（10个主要十神） ───

/**
 * 十神完整定义。
 * resolveElement 根据日主五行，返回该十神实际对应的五行。
 *   - 生我者（印）：生我五行的五行
 *   - 同我者（比劫）：与日主相同五行
 *   - 我生者（食伤）：日主所生五行
 *   - 我克者（财）：日主所克五行
 *   - 克我者（官杀）：克日主的五行
 */
const SHISHEN_DEFINITIONS: ShiShenDefinition[] = [
  {
    id: 'shishen-bijian',
    name: '比肩',
    category: '生扶',
    elementKeyword: '同我',
    defaultRole: '自我力量的映射，代表兄弟、朋友、同辈',
    resolveElement: (dayEl) => dayEl,
  },
  {
    id: 'shishen-jiecai',
    name: '劫财',
    category: '生扶',
    elementKeyword: '同我（异阴阳）',
    defaultRole: '与我争夺之力量，代表竞争者、异性兄弟',
    resolveElement: (dayEl) => dayEl,
  },
  {
    id: 'shishen-shishen',
    name: '食神',
    category: '泄耗',
    elementKeyword: '我生（同性）',
    defaultRole: '才华与福气的体现，代表子女、晚辈、艺术',
    resolveElement: (dayEl) => GENERATE[dayEl],
  },
  {
    id: 'shishen-shangguan',
    name: '伤官',
    category: '泄耗',
    elementKeyword: '我生（异性）',
    defaultRole: '才华外泄、叛逆之力量，代表口才、创造力',
    resolveElement: (dayEl) => GENERATE[dayEl],
  },
  {
    id: 'shishen-zhengcai',
    name: '正财',
    category: '泄耗',
    elementKeyword: '我克（异性）',
    defaultRole: '正当之财源，代表妻子的情分、稳定收入',
    resolveElement: (dayEl) => OVERCOME[dayEl],
  },
  {
    id: 'shishen-piancai',
    name: '偏财',
    category: '泄耗',
    elementKeyword: '我克（同性）',
    defaultRole: '意外之财源，代表父亲、投资、社交',
    resolveElement: (dayEl) => OVERCOME[dayEl],
  },
  {
    id: 'shishen-zhengguan',
    name: '正官',
    category: '克制',
    elementKeyword: '克我（异性）',
    defaultRole: '正当约束之力，代表丈夫的情分、职位、法律',
    resolveElement: (dayEl) => {
      return ALL_ELEMENTS.find(el => OVERCOME[el] === dayEl)!
    },
  },
  {
    id: 'shishen-qisha',
    name: '七杀',
    category: '克制',
    elementKeyword: '克我（同性）',
    defaultRole: '激烈之压力与冲击，代表魄力、小人、武职',
    resolveElement: (dayEl) => {
      return ALL_ELEMENTS.find(el => OVERCOME[el] === dayEl)!
    },
  },
  {
    id: 'shishen-zhengyin',
    name: '正印',
    category: '被克',
    elementKeyword: '生我（异性）',
    defaultRole: '正统庇护之力，代表母亲、学问、贵人',
    resolveElement: (dayEl) => {
      return ALL_ELEMENTS.find(el => GENERATE[el] === dayEl)!
    },
  },
  {
    id: 'shishen-pianyin',
    name: '偏印',
    category: '被克',
    elementKeyword: '生我（同性）',
    defaultRole: '非正统庇护，代表继母、偏门学问、孤独',
    resolveElement: (dayEl) => {
      return ALL_ELEMENTS.find(el => GENERATE[el] === dayEl)!
    },
  },
]

// ─── 十神关系边模板（完整生克链） ───

/**
 * 基于传统子平法构建的十神关系边。
 * 生克关系遵循五行相生相克的自然之理。
 * 合/冲/刑/害关系基于天干地支的特殊作用。
 */
const RELATION_TEMPLATES: RelationTemplate[] = [
  // ── 生关系 ──
  {
    from: 'shishen-bijian', to: 'shishen-shishen',
    type: '生', labelTemplate: '比肩生食神',
    descTemplate: '比肩与日主同气，其力量自然流转至食神，才华得以展现。',
    baseStrength: 60,
  },
  {
    from: 'shishen-shishen', to: 'shishen-zhengcai',
    type: '生', labelTemplate: '食神生财',
    descTemplate: '食神为才华，才华化为财源，食神生财乃自然之理。',
    baseStrength: 70,
  },
  {
    from: 'shishen-shishen', to: 'shishen-piancai',
    type: '生', labelTemplate: '食神生偏财',
    descTemplate: '食神之才华亦可产生偏财，意外之财来源于自身才干。',
    baseStrength: 55,
  },
  {
    from: 'shishen-shangguan', to: 'shishen-zhengcai',
    type: '生', labelTemplate: '伤官生财',
    descTemplate: '伤官虽为叛逆之才，但其能量可以转化为财源。',
    baseStrength: 65,
  },
  {
    from: 'shishen-shangguan', to: 'shishen-piancai',
    type: '生', labelTemplate: '伤官生偏财',
    descTemplate: '伤官之奇思妙想，往往能开辟偏财之路。',
    baseStrength: 50,
  },
  {
    from: 'shishen-zhengguan', to: 'shishen-zhengyin',
    type: '生', labelTemplate: '正官生正印',
    descTemplate: '正官为名位，名位自生印星，职位带来学问与庇护。',
    baseStrength: 70,
  },
  {
    from: 'shishen-qisha', to: 'shishen-pianyin',
    type: '生', labelTemplate: '七杀生偏印',
    descTemplate: '七杀为压力，压力之极反生偏印，所谓"杀印相生"。',
    baseStrength: 75,
  },
  {
    from: 'shishen-zhengyin', to: 'shishen-bijian',
    type: '生', labelTemplate: '正印生比肩',
    descTemplate: '正印为庇护，庇护归于自身，印星生扶日主之比肩。',
    baseStrength: 80,
  },
  {
    from: 'shishen-pianyin', to: 'shishen-jiecai',
    type: '生', labelTemplate: '偏印生劫财',
    descTemplate: '偏印之庇护力偏于劫财，非正统之助。',
    baseStrength: 60,
  },
  // ── 克关系 ──
  {
    from: 'shishen-bijian', to: 'shishen-zhengcai',
    type: '克', labelTemplate: '比肩克正财',
    descTemplate: '比肩力量过旺则夺财，所谓"比肩夺财"，财星受损。',
    baseStrength: 70,
  },
  {
    from: 'shishen-jiecai', to: 'shishen-zhengcai',
    type: '克', labelTemplate: '劫财克正财',
    descTemplate: '劫财克财之力甚于比肩，劫财夺财最为凶险。',
    baseStrength: 85,
  },
  {
    from: 'shishen-jiecai', to: 'shishen-piancai',
    type: '克', labelTemplate: '劫财克偏财',
    descTemplate: '劫财亦克偏财，偏财遇劫财主破财。',
    baseStrength: 75,
  },
  {
    from: 'shishen-shishen', to: 'shishen-qisha',
    type: '克', labelTemplate: '食神制七杀',
    descTemplate: '食神制杀为吉格，以才华化解压力，食神制杀最为稳妥。',
    baseStrength: 80,
  },
  {
    from: 'shishen-shangguan', to: 'shishen-zhengguan',
    type: '克', labelTemplate: '伤官见官',
    descTemplate: '伤官克正官，所谓"伤官见官，为祸百端"，最为忌讳。',
    baseStrength: 90,
  },
  {
    from: 'shishen-shangguan', to: 'shishen-qisha',
    type: '克', labelTemplate: '伤官制七杀',
    descTemplate: '伤官亦可制杀，但不如食神制杀安稳，多有波折。',
    baseStrength: 65,
  },
  {
    from: 'shishen-zhengcai', to: 'shishen-zhengyin',
    type: '克', labelTemplate: '财星坏印',
    descTemplate: '财星克印，所谓"财星坏印"，贪财损学，最为不利。',
    baseStrength: 80,
  },
  {
    from: 'shishen-piancai', to: 'shishen-zhengyin',
    type: '克', labelTemplate: '偏财坏印',
    descTemplate: '偏财克印之力稍弱于正财，但贪图享乐仍损学问。',
    baseStrength: 65,
  },
  {
    from: 'shishen-piancai', to: 'shishen-pianyin',
    type: '克', labelTemplate: '偏财克偏印',
    descTemplate: '偏财克偏印，偏门之财干扰偏门学问。',
    baseStrength: 55,
  },
  {
    from: 'shishen-qisha', to: 'shishen-bijian',
    type: '克', labelTemplate: '七杀克比肩',
    descTemplate: '七杀克身，比肩为日主同类，七杀压制自身力量。',
    baseStrength: 80,
  },
  {
    from: 'shishen-zhengguan', to: 'shishen-bijian',
    type: '克', labelTemplate: '正官克比肩',
    descTemplate: '正官为正当约束，约束比肩之过度膨胀，良性的制约。',
    baseStrength: 65,
  },
  // ── 合关系 ──
  {
    from: 'shishen-bijian', to: 'shishen-bijian',
    type: '合', labelTemplate: '比肩自合',
    descTemplate: '比肩自合，同类相帮，朋友间互助合作。',
    baseStrength: 50,
  },
  {
    from: 'shishen-zhengguan', to: 'shishen-zhengguan',
    type: '合', labelTemplate: '正官自合',
    descTemplate: '正官自合，权力稳固，事业职位安定。',
    baseStrength: 45,
  },
  {
    from: 'shishen-qisha', to: 'shishen-qisha',
    type: '合', labelTemplate: '七杀自合',
    descTemplate: '七杀自合，压力内化，外柔内刚之象。',
    baseStrength: 40,
  },
  // ── 冲关系 ──
  {
    from: 'shishen-shangguan', to: 'shishen-zhengguan',
    type: '冲', labelTemplate: '伤官冲正官',
    descTemplate: '伤官与正官形成冲击，内心追求自由与外部约束对立。',
    baseStrength: 85,
  },
  {
    from: 'shishen-zhengguan', to: 'shishen-shangguan',
    type: '冲', labelTemplate: '正官冲伤官',
    descTemplate: '正官反击伤官，约束力量对抗叛逆力量。',
    baseStrength: 60,
  },
  {
    from: 'shishen-jiecai', to: 'shishen-zhengcai',
    type: '冲', labelTemplate: '劫财冲正财',
    descTemplate: '劫财与正财正面冲突，破财之忧明显。',
    baseStrength: 75,
  },
  // ── 刑关系 ──
  {
    from: 'shishen-qisha', to: 'shishen-zhengguan',
    type: '刑', labelTemplate: '官杀相刑',
    descTemplate: '七杀与正官相刑，正当约束与激烈压力互相纠缠。',
    baseStrength: 70,
  },
  {
    from: 'shishen-shangguan', to: 'shishen-shishen',
    type: '刑', labelTemplate: '伤官刑食神',
    descTemplate: '伤官与食神相刑，才华表达方式产生矛盾。',
    baseStrength: 45,
  },
  // ── 害关系 ──
  {
    from: 'shishen-pianyin', to: 'shishen-zhengyin',
    type: '害', labelTemplate: '偏印害正印',
    descTemplate: '偏印干扰正印，非正统学问侵蚀正统学问。',
    baseStrength: 55,
  },
  {
    from: 'shishen-piancai', to: 'shishen-zhengcai',
    type: '害', labelTemplate: '偏财害正财',
    descTemplate: '偏财干扰正财，投资投机影响稳定收入。',
    baseStrength: 50,
  },
]

// ─── 工具函数 ───

/** 计算加权平均数 */
function weightedAvg(values: number[], weights: number[]): number {
  let sumVal = 0
  let sumW = 0
  for (let i = 0; i < values.length; i++) {
    sumVal += values[i] * weights[i]
    sumW += weights[i]
  }
  return sumW === 0 ? 0 : Math.round(sumVal / sumW)
}

/** 限制数值在范围内 */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

/** 生成 ISO 时间字符串 */
function nowISO(): string {
  return new Date().toISOString()
}

// ─── ShiShenGraphEngine ───

/**
 * 十神动态关系图引擎
 *
 * 将十神关系建模为有向图，根据命盘数据动态计算节点权重和边强度，
 * 输出完整的图数据供前端可视化渲染。
 *
 * 使用方式：
 *   const engine = new ShiShenGraphEngine()
 *   const graph = engine.generate(chartData)
 */
export class ShiShenGraphEngine {
  /** 当前命盘的节点列表 */
  private nodes: GraphNode[] = []
  /** 当前命盘的边列表 */
  private edges: GraphEdge[] = []
  /** 日主中心节点ID */
  private centerNodeId: string = 'shishen-bijian'
  /** 邻接表（用于路径搜索） */
  private adjacency: Map<string, Map<string, GraphEdge>> = new Map()

  // ──────────────────────────── 公共接口 ────────────────────────────

  /**
   * 生成十神关系图
   * @param chartData 命盘数据，需包含 dayMaster（日主天干）、
   *   dayElement（日主五行）、strengths（各十神在命盘中的力量分布）等字段
   * @returns 完整的十神关系图数据
   */
  generate(chartData: Record<string, unknown>): ShiShenGraphResult {
    const dayMaster = (chartData.dayMaster as string) || '甲'
    const dayElement = (chartData.dayElement as string) || '木'
    const isYang = this.isYangStem(dayMaster)
    const strengths = (chartData.strengths as Record<string, number>) || {}

    // 构建节点
    this.buildNodes(dayElement, isYang, strengths)

    // 构建边
    this.buildEdges(dayElement)

    // 构建邻接表
    this.buildAdjacency()

    // 生成总结
    const summary = this.generateSummary(dayMaster, dayElement)
    const keyRelationships = this.extractKeyRelationships()

    return {
      generatedAt: nowISO(),
      nodes: this.nodes,
      edges: this.edges,
      centerNode: this.centerNodeId,
      summary,
      keyRelationships,
      classicalRef: '《滴天髓》："生克制化，理数自然。"；'
        + '《子平真诠》："十神者，辅佐日干之十位也。"',
    }
  }

  /** 获取当前全部节点 */
  getNodes(): GraphNode[] {
    return [...this.nodes]
  }

  /** 获取当前全部边 */
  getEdges(): GraphEdge[] {
    return [...this.edges]
  }

  /**
   * 获取指定节点的所有关系
   * @param nodeId 节点ID
   * @returns 出边（outgoing）和入边（incoming）
   */
  getNodeRelationships(nodeId: string): {
    outgoing: GraphEdge[]
    incoming: GraphEdge[]
  } {
    const outgoing: GraphEdge[] = []
    const incoming: GraphEdge[] = []

    for (const edge of this.edges) {
      if (edge.from === nodeId) {
        outgoing.push(edge)
      }
      if (edge.to === nodeId) {
        incoming.push(edge)
      }
    }

    return { outgoing, incoming }
  }

  /**
   * 获取两个节点之间的最短路径（BFS）
   * @param from 起始节点ID
   * @param to 目标节点ID
   * @returns 路径节点ID列表，不存在路径时返回 null
   */
  getShortestPath(from: string, to: string): string[] | null {
    if (from === to) return [from]

    // 验证节点存在
    if (!this.adjacency.has(from) || !this.adjacency.has(to)) {
      return null
    }

    // BFS 搜索
    const visited = new Set<string>()
    const queue: string[][] = [[from]]
    visited.add(from)

    while (queue.length > 0) {
      const path = queue.shift()!
      const current = path[path.length - 1]

      const neighbors = this.adjacency.get(current)
      if (!neighbors) continue

      for (const [neighborId] of neighbors) {
        if (neighborId === to) {
          return [...path, neighborId]
        }
        if (!visited.has(neighborId)) {
          visited.add(neighborId)
          queue.push([...path, neighborId])
        }
      }
    }

    return null
  }

  // ──────────────────────────── 内部方法 ────────────────────────────

  /** 判断天干是否为阳干 */
  private isYangStem(stem: string): boolean {
    const YANG_STEMS = ['甲', '丙', '戊', '庚', '壬']
    return YANG_STEMS.includes(stem)
  }

  /** 根据命盘数据构建所有节点 */
  private buildNodes(
    dayElement: string,
    isYang: boolean,
    strengths: Record<string, number>,
  ): void {
    this.nodes = SHISHEN_DEFINITIONS.map(def => {
      // 实际五行
      const element = def.resolveElement(dayElement)

      // 力量：优先使用命盘中实际计算值，否则根据分类默认赋值
      let strength = strengths[def.id] ?? strengths[def.name] ?? 50
      strength = clamp(strength, 0, 100)

      // 角色描述：根据日主阴阳细化
      const role = this.enrichRole(def, isYang, dayElement)

      // 类型分类：比劫生扶为日主，印星为被克（被财克），其余根据定义
      const type = this.resolveNodeType(def, dayElement)

      return {
        id: def.id,
        name: def.name,
        type,
        element,
        strength,
        role,
      }
    })

    // 设置日主中心节点为比肩（日主自身的十神映射）
    this.centerNodeId = 'shishen-bijian'
  }

  /** 细化角色描述 */
  private enrichRole(
    def: ShiShenDefinition,
    isYang: boolean,
    dayElement: string,
  ): string {
    const base = def.defaultRole
    switch (def.id) {
      case 'shishen-bijian':
        return isYang
          ? `${base}（阳日主之比肩，力量直率刚猛）`
          : `${base}（阴日主之比肩，力量柔和绵延）`
      case 'shishen-jiecai':
        return isYang
          ? `${base}（阳日主劫财，竞争激烈）`
          : `${base}（阴日主劫财，暗中争夺）`
      case 'shishen-zhengcai':
        return isYang
          ? `${base}（阳日主见正财，财源稳定）`
          : `${base}（阴日主见正财，理财谨慎）`
      case 'shishen-piancai':
        return isYang
          ? `${base}（阳日主见偏财，投机积极）`
          : `${base}（阴日主见偏财，偏财机会隐现）`
      case 'shishen-zhengguan':
        return isYang
          ? `${base}（阳日主见正官，事业正途）`
          : `${base}（阴日主见正官，丈夫缘深）`
      case 'shishen-qisha':
        return isYang
          ? `${base}（阳日主见七杀，魄力非凡）`
          : `${base}（阴日主见七杀，压力内敛）`
      default:
        return base
    }
  }

  /** 确定节点分类类型 */
  private resolveNodeType(
    def: ShiShenDefinition,
    dayElement: string,
  ): '生扶' | '泄耗' | '克制' | '被克' {
    const element = def.resolveElement(dayElement)
    // 生我者 → 被克（被财克）
    if (GENERATE[element] === dayElement) return '被克'
    // 同我者 → 生扶
    if (element === dayElement) return '生扶'
    // 我生者 → 泄耗
    if (GENERATE[dayElement] === element) return '泄耗'
    // 我克者 → 泄耗（克也耗自身）
    if (OVERCOME[dayElement] === element) return '泄耗'
    // 克我者 → 克制
    if (OVERCOME[element] === dayElement) return '克制'
    return def.category
  }

  /** 根据命盘数据构建所有边 */
  private buildEdges(dayElement: string): void {
    // 创建节点ID→节点的映射，方便快速查找
    const nodeMap = new Map<string, GraphNode>()
    for (const n of this.nodes) {
      nodeMap.set(n.id, n)
    }

    this.edges = RELATION_TEMPLATES.map(tpl => {
      const fromNode = nodeMap.get(tpl.from)
      const toNode = nodeMap.get(tpl.to)

      // 根据源节点和目标节点的实际力量调整边强度
      let strength = tpl.baseStrength
      if (fromNode && toNode) {
        // 两端节点力量越强，关系强度越大
        const avgStrength = (fromNode.strength + toNode.strength) / 2
        strength = clamp(
          Math.round(tpl.baseStrength * (avgStrength / 50)),
          10,
          100,
        )
      }

      return {
        from: tpl.from,
        to: tpl.to,
        type: tpl.type,
        label: tpl.labelTemplate,
        strength,
        description: tpl.descTemplate,
      }
    })
  }

  /** 构建邻接表（无向，用于路径搜索） */
  private buildAdjacency(): void {
    this.adjacency.clear()
    for (const node of this.nodes) {
      this.adjacency.set(node.id, new Map())
    }
    for (const edge of this.edges) {
      // 双向邻接（路径搜索需要无向图）
      if (!this.adjacency.has(edge.from)) {
        this.adjacency.set(edge.from, new Map())
      }
      if (!this.adjacency.has(edge.to)) {
        this.adjacency.set(edge.to, new Map())
      }
      this.adjacency.get(edge.from)!.set(edge.to, edge)
      this.adjacency.get(edge.to)!.set(edge.from, edge)
    }
  }

  /** 生成关系网络总结 */
  private generateSummary(dayMaster: string, dayElement: string): string {
    // 统计各类关系的数量和强度
    const typeStats: Record<string, { count: number; totalStrength: number }> = {}
    for (const edge of this.edges) {
      if (!typeStats[edge.type]) {
        typeStats[edge.type] = { count: 0, totalStrength: 0 }
      }
      typeStats[edge.type].count++
      typeStats[edge.type].totalStrength += edge.strength
    }

    // 找出最强和最弱的节点
    let strongestNode = this.nodes[0]
    let weakestNode = this.nodes[0]
    for (const node of this.nodes) {
      if (node.strength > strongestNode.strength) strongestNode = node
      if (node.strength < weakestNode.strength) weakestNode = node
    }

    // 统计关系类型描述
    const relParts: string[] = []
    if (typeStats['生']) {
      relParts.push(`${typeStats['生'].count}条生关系`)
    }
    if (typeStats['克']) {
      relParts.push(`${typeStats['克'].count}条克关系`)
    }
    if (typeStats['合']) {
      relParts.push(`${typeStats['合'].count}条合关系`)
    }
    if (typeStats['冲']) {
      relParts.push(`${typeStats['冲'].count}条冲关系`)
    }
    if (typeStats['刑']) {
      relParts.push(`${typeStats['刑'].count}条刑关系`)
    }
    if (typeStats['害']) {
      relParts.push(`${typeStats['害'].count}条害关系`)
    }

    return [
      `日主${dayMaster}（${dayElement}），`,
      `十神网络包含${this.nodes.length}个节点、${this.edges.length}条关系边（${relParts.join('、')}）。`,
      `当前命盘中，${strongestNode.name}（${strongestNode.element}）力量最强（${strongestNode.strength}），`,
      `${weakestNode.name}（${weakestNode.element}）力量最弱（${weakestNode.strength}）。`,
      `整体关系网络呈现以日主为中心的放射状结构，`,
      `生克制化循环往复，合冲刑害交错纵横，`,
      `体现了"生克制化，理数自然"的命理哲学。`,
    ].join('')
  }

  /** 提取关键关系描述（取强度最高的若干条） */
  private extractKeyRelationships(): string[] {
    // 按强度降序排序，取前8条
    const sorted = [...this.edges].sort((a, b) => b.strength - a.strength)
    const top = sorted.slice(0, 8)

    // 找到节点名映射
    const nodeNames = new Map<string, string>()
    for (const n of this.nodes) {
      nodeNames.set(n.id, n.name)
    }

    return top.map(edge => {
      const fromName = nodeNames.get(edge.from) || edge.from
      const toName = nodeNames.get(edge.to) || edge.to
      return `${fromName} → ${edge.type} → ${toName}（强度${edge.strength}）：${edge.description}`
    })
  }
}
