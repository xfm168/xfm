/**
 * P0-5B Knowledge Graph — 概念（Concept）模块
 *
 * 命理概念的管理与关系查询。每个 Concept 描述一种命理方法论
 * （如 扶抑 / 调候 / 病药 / 通关 / 格局），并关联：
 *   - relatedClassics  相关典籍
 *   - relatedRules     相关规则
 *   - wuxingImplications 五行含义
 *   - controversyLevel 争议度 0~1
 *
 * 概念之间通过 ConceptRelation 互相关联：
 *   - specializes   特化（子概念）
 *   - contradicts   反驳（流派分歧）
 *   - complements   互补（合并使用）
 *   - evolves_to    演化（旧说→新说）
 *
 * ConceptManager 提供：
 *   - register / get / getByName / listByCategory  注册与查询
 *   - relate / getRelated                          关系管理
 *   - findPath                                     概念路径查找（BFS）
 *   - search                                       关键词搜索
 *   - getControversialConcepts                     高争议概念
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

// ============================================================
// 类型定义
// ============================================================

/** 命理概念 */
export interface Concept {
  /** 概念 ID（如 'cpt:扶抑'） */
  id: string
  /** 概念名称（如 '扶抑'） */
  name: string
  /** 概念分类（如 'balance' / 'climate' / 'medicine' / 'bridge' / 'pattern'） */
  category: string
  /** 概念描述 */
  description: string
  /** 相关典籍列表 */
  relatedClassics: string[]
  /** 相关规则 ID 列表 */
  relatedRules: string[]
  /** 五行含义列表（如 ['木喜丙火', '火喜壬水']） */
  wuxingImplications: string[]
  /** 争议度 0~1（0=无争议，1=高度争议） */
  controversyLevel: number
}

/** 概念关系 */
export interface ConceptRelation {
  /** 起点概念 ID */
  fromId: string
  /** 终点概念 ID */
  toId: string
  /** 关系类型 */
  type: 'specializes' | 'contradicts' | 'complements' | 'evolves_to'
  /** 关系说明 */
  description?: string
}

// ============================================================
// ConceptManager 概念管理器
// ============================================================

/**
 * 概念管理器
 *
 * 维护概念注册表与概念关系图，提供概念级别的查询能力。
 * 与 OntologyManager 的区别：
 *   - OntologyManager 维护所有本体节点（含典籍/五行/流派/规则等）
 *   - ConceptManager 专注于"命理方法论"概念及其相互关系
 */
export class ConceptManager {
  /** 概念表：conceptId → Concept */
  private concepts = new Map<string, Concept>()
  /** 按名称索引：conceptName → conceptId */
  private conceptsByName = new Map<string, string>()
  /** 按分类索引：category → conceptId[] */
  private conceptsByCategory = new Map<string, Set<string>>()
  /** 关系列表 */
  private relations: ConceptRelation[] = []
  /** 按起点索引关系：fromId → ConceptRelation[] */
  private relationsByFrom = new Map<string, ConceptRelation[]>()
  /** 按终点索引关系：toId → ConceptRelation[] */
  private relationsByTo = new Map<string, ConceptRelation[]>()

  constructor() {
    this.loadSeed()
  }

  // ---------- 注册 / 查询 ----------

  /** 注册概念（已存在则更新），返回是否为新增 */
  register(concept: Concept): boolean {
    const isNew = !this.concepts.has(concept.id)
    this.concepts.set(concept.id, concept)
    this.conceptsByName.set(concept.name, concept.id)
    if (!this.conceptsByCategory.has(concept.category)) {
      this.conceptsByCategory.set(concept.category, new Set())
    }
    this.conceptsByCategory.get(concept.category)!.add(concept.id)
    return isNew
  }

  /** 按 ID 获取概念 */
  get(id: string): Concept | undefined {
    return this.concepts.get(id)
  }

  /** 按名称获取概念 */
  getByName(name: string): Concept | undefined {
    const id = this.conceptsByName.get(name)
    return id ? this.concepts.get(id) : undefined
  }

  /** 按分类列出概念 */
  listByCategory(category: string): Concept[] {
    const ids = this.conceptsByCategory.get(category) ?? new Set()
    const out: Concept[] = []
    for (const id of ids) {
      const c = this.concepts.get(id)
      if (c) out.push(c)
    }
    return out
  }

  // ---------- 关系管理 ----------

  /** 关联两个概念 */
  relate(relation: ConceptRelation): void {
    // 去重：相同 from + to + type 的关系只保留一条
    const exists = this.relations.find(
      r => r.fromId === relation.fromId && r.toId === relation.toId && r.type === relation.type,
    )
    if (exists) {
      if (relation.description !== undefined) exists.description = relation.description
      return
    }
    this.relations.push(relation)
    if (!this.relationsByFrom.has(relation.fromId)) this.relationsByFrom.set(relation.fromId, [])
    this.relationsByFrom.get(relation.fromId)!.push(relation)
    if (!this.relationsByTo.has(relation.toId)) this.relationsByTo.set(relation.toId, [])
    this.relationsByTo.get(relation.toId)!.push(relation)
  }

  /** 获取与某概念直接相关的所有概念（双向） */
  getRelated(id: string): Concept[] {
    const result: Concept[] = []
    const seen = new Set<string>()
    // 出边
    for (const r of (this.relationsByFrom.get(id) ?? [])) {
      if (seen.has(r.toId)) continue
      const c = this.concepts.get(r.toId)
      if (c) {
        result.push(c)
        seen.add(r.toId)
      }
    }
    // 入边
    for (const r of (this.relationsByTo.get(id) ?? [])) {
      if (seen.has(r.fromId)) continue
      const c = this.concepts.get(r.fromId)
      if (c) {
        result.push(c)
        seen.add(r.fromId)
      }
    }
    return result
  }

  /**
   * 查找两个概念之间的最短路径（BFS，无向图）
   * @returns 路径上的概念 ID 序列（包含起点与终点）；不可达时返回空数组
   */
  findPath(fromId: string, toId: string): string[] {
    if (fromId === toId) return this.concepts.has(fromId) ? [fromId] : []
    if (!this.concepts.has(fromId) || !this.concepts.has(toId)) return []

    const queue: Array<{ id: string; path: string[] }> = [{ id: fromId, path: [fromId] }]
    const visited = new Set<string>([fromId])

    while (queue.length > 0) {
      const cur = queue.shift()!
      const neighbors = this.getNeighborIds(cur.id)
      for (const next of neighbors) {
        if (visited.has(next)) continue
        visited.add(next)
        const newPath = [...cur.path, next]
        if (next === toId) return newPath
        queue.push({ id: next, path: newPath })
      }
    }
    return []
  }

  /** 获取某概念的所有邻居 ID（出边 + 入边） */
  private getNeighborIds(id: string): string[] {
    const set = new Set<string>()
    for (const r of (this.relationsByFrom.get(id) ?? [])) set.add(r.toId)
    for (const r of (this.relationsByTo.get(id) ?? [])) set.add(r.fromId)
    return Array.from(set)
  }

  /** 关键词搜索（在 name / description / category / wuxingImplications 中匹配） */
  search(keyword: string): Concept[] {
    if (!keyword) return []
    const kw = keyword.toLowerCase()
    const result: Concept[] = []
    for (const c of this.concepts.values()) {
      const haystack = [
        c.name,
        c.description,
        c.category,
        ...c.wuxingImplications,
        ...c.relatedClassics,
      ].join(' ').toLowerCase()
      if (haystack.includes(kw)) result.push(c)
    }
    return result
  }

  /** 获取高争议概念（controversyLevel >= 0.5） */
  getControversialConcepts(): Concept[] {
    return Array.from(this.concepts.values()).filter(c => c.controversyLevel >= 0.5)
  }

  /** 获取统计 */
  getStats(): { totalConcepts: number; totalRelations: number; byCategory: Record<string, number> } {
    const byCategory: Record<string, number> = {}
    for (const [cat, ids] of this.conceptsByCategory) byCategory[cat] = ids.size
    return {
      totalConcepts: this.concepts.size,
      totalRelations: this.relations.length,
      byCategory,
    }
  }

  // ---------- 种子数据 ----------

  /** 加载种子概念 */
  private loadSeed(): void {
    for (const c of SEED_CONCEPTS) this.register(c)
    for (const r of SEED_CONCEPT_RELATIONS) this.relate(r)
  }
}

// ============================================================
// 种子数据：核心命理概念
// ============================================================

const SEED_CONCEPTS: Concept[] = [
  {
    id: 'cpt:扶抑',
    name: '扶抑',
    category: 'balance',
    description: '日主衰则扶之，旺则抑之，平衡为要。身强/身弱 → 用神方向：身强宜泄耗，身弱宜生扶',
    relatedClassics: ['滴天髓', '子平真诠'],
    relatedRules: ['BALANCE-STRONG-001', 'BALANCE-WEAK-001'],
    wuxingImplications: ['身强日主为木取火土为用', '身弱日主为木取水木为用'],
    controversyLevel: 0.1,
  },
  {
    id: 'cpt:调候',
    name: '调候',
    category: 'climate',
    description: '审度月令气候寒暖燥湿以定天干喜忌。寒暖燥湿 → 调候用神：寒需暖（丙火），热需凉（壬水）',
    relatedClassics: ['穷通宝鉴'],
    relatedRules: ['TIAOHOU-WINTER-WOOD-001', 'TIAOHOU-SUMMER-FIRE-001'],
    wuxingImplications: ['冬木喜丙火照暖', '夏火喜壬水润泽', '秋金喜丁火炼', '冬水喜戊土止'],
    controversyLevel: 0.2,
  },
  {
    id: 'cpt:病药',
    name: '病药',
    category: 'medicine',
    description: '以病为忌，以药为喜，去病即安。病因/药因 → 药方：识别命局之病，取能去病者为药',
    relatedClassics: ['神峰通考', '子平真诠'],
    relatedRules: ['BINGYAO-QI-SHA-001', 'BINGYAO-SHA-WANG-001'],
    wuxingImplications: ['七杀为病取食神制之为药', '伤官为病取印星制之为药'],
    controversyLevel: 0.3,
  },
  {
    id: 'cpt:通关',
    name: '通关',
    category: 'bridge',
    description: '两行相争，取中间之行调和。阻塞/流通 → 通关五行：如木土相争取火通关',
    relatedClassics: ['滴天髓'],
    relatedRules: ['TONGGUAN-SHA-E-001', 'TONGGUAN-MU-TU-001'],
    wuxingImplications: ['木土相争取火通关', '水火相争取木通关', '金木相争取水通关'],
    controversyLevel: 0.4,
  },
  {
    id: 'cpt:格局',
    name: '格局',
    category: 'pattern',
    description: '月令所司令之气立格，由天干透出立局。正格/变格 → 格局用神：正官、七杀、财、印、食、伤等格',
    relatedClassics: ['子平真诠', '渊海子平'],
    relatedRules: ['GEJU-ZHENG-GUAN-001', 'GEJU-QI-SHA-001'],
    wuxingImplications: ['正官格取财生官为用', '七杀格取食神制杀或印化杀为用'],
    controversyLevel: 0.6,
  },
  {
    id: 'cpt:从格',
    name: '从格',
    category: 'pattern',
    description: '日主极弱无依，从其势而论，喜忌反转。从格为格局之变格，与扶抑法相反',
    relatedClassics: ['滴天髓'],
    relatedRules: ['GEJU-CONG-001'],
    wuxingImplications: ['从儿格喜食伤', '从财格喜财', '从杀格喜杀'],
    controversyLevel: 0.7,
  },
  {
    id: 'cpt:化气',
    name: '化气',
    category: 'pattern',
    description: '天干五合得令则化，化则从所化之气论。化气格为格局之一种',
    relatedClassics: ['渊海子平', '滴天髓'],
    relatedRules: ['GEJU-HUA-001'],
    wuxingImplications: ['甲己合化土', '乙庚合化金', '丙辛合化水', '丁壬合化木', '戊癸合化火'],
    controversyLevel: 0.6,
  },
  {
    id: 'cpt:旺衰',
    name: '旺衰',
    category: 'balance',
    description: '日主得令得地得势之气盛衰之辨。旺衰为扶抑法之前提，需先辨衰旺方能定扶抑',
    relatedClassics: ['滴天髓', '三命通会'],
    relatedRules: ['BALANCE-STRONG-001', 'BALANCE-WEAK-001'],
    wuxingImplications: ['得令为旺', '失令为衰', '得地得势助旺'],
    controversyLevel: 0.2,
  },
  {
    id: 'cpt:用神',
    name: '用神',
    category: 'core',
    description: '命局所赖以平衡之神。用神之取，不外扶抑、病药、通关、调候四法',
    relatedClassics: ['子平真诠', '渊海子平'],
    relatedRules: [],
    wuxingImplications: ['用神定则喜忌定', '克用者为忌神', '生用者为喜神'],
    controversyLevel: 0.3,
  },
  {
    id: 'cpt:月令',
    name: '月令',
    category: 'core',
    description: '月支所司令之气，格局用神所出。月令为八字之提纲',
    relatedClassics: ['子平真诠'],
    relatedRules: [],
    wuxingImplications: ['月令所司为格局之本', '月令藏干透出立格'],
    controversyLevel: 0.1,
  },
]

// ============================================================
// 种子数据：概念关系
// ============================================================

const SEED_CONCEPT_RELATIONS: ConceptRelation[] = [
  // 特化关系：子概念特化父概念
  { fromId: 'cpt:从格', toId: 'cpt:格局', type: 'specializes', description: '从格是格局之变格' },
  { fromId: 'cpt:化气', toId: 'cpt:格局', type: 'specializes', description: '化气格是格局之一种' },
  { fromId: 'cpt:扶抑', toId: 'cpt:用神', type: 'specializes', description: '扶抑是用神取法之一' },
  { fromId: 'cpt:病药', toId: 'cpt:用神', type: 'specializes', description: '病药是用神取法之一' },
  { fromId: 'cpt:通关', toId: 'cpt:用神', type: 'specializes', description: '通关是用神取法之一' },
  { fromId: 'cpt:调候', toId: 'cpt:用神', type: 'specializes', description: '调候是用神取法之一' },

  // 反驳关系：流派分歧
  { fromId: 'cpt:从格', toId: 'cpt:扶抑', type: 'contradicts', description: '从格喜忌反转，与扶抑法相反' },

  // 互补关系：合并使用
  { fromId: 'cpt:扶抑', toId: 'cpt:调候', type: 'complements', description: '扶抑与调候常合并使用' },
  { fromId: 'cpt:扶抑', toId: 'cpt:病药', type: 'complements', description: '扶抑与病药常合并使用' },
  { fromId: 'cpt:格局', toId: 'cpt:调候', type: 'complements', description: '格局与调候互补' },
  { fromId: 'cpt:旺衰', toId: 'cpt:月令', type: 'complements', description: '旺衰辨需参月令' },

  // 演化关系：旧说→新说
  { fromId: 'cpt:格局', toId: 'cpt:扶抑', type: 'evolves_to', description: '格局法→扶抑法的演进（现代综合）' },
  { fromId: 'cpt:月令', toId: 'cpt:旺衰', type: 'evolves_to', description: '由月令立格→旺衰扶抑的演进' },
]

// ============================================================
// 全局单例
// ============================================================

/** 全局概念管理器单例 */
export const globalConceptManager = new ConceptManager()
