/**
 * P3 CaseLibrary 核心系统
 *
 * 整合并升级 GoldenCase（边界/回归测试用）与 ClassicalCase（古籍经典命例），
 * 提供统一的案例管理、检索、评分与统计能力。
 *
 * 作为纯 Plugin 模块，不修改 Kernel。
 */

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** 案例来源 */
export type CaseSource =
  | '滴天髓'
  | '子平真诠'
  | '穷通宝鉴'
  | '三命通会'
  | '渊海子平'
  | '神峰通考'
  | '穷通秘诀'
  | '命理正宗'
  | '当代名人'
  | '现代案例'
  | '用户授权'
  | '经典命例'
  // P7 扩展来源
  | '企业家案例'
  | '艺术家案例'
  | '政治人物案例'
  | '运动员案例'
  | '特殊命局案例'
  | '普通命例案例'
  | '历史人物案例'
  | '批量生成'

/** 案例分类 */
export type CaseCategory =
  | '帝王将相'
  | '文人学者'
  | '商贾富户'
  | '僧道术士'
  | '贫贱夭折'
  | '从格化格'
  | '特殊格局'
  | '普通命造'
  | '边界验证'
  | '女命'
  | '双胞胎'
  | '同名同命'
  // P7 扩展分类
  | '企业家'
  | '艺术家'
  | '政治人物'
  | '运动员'
  | '特殊命局'
  | '普通命例'
  | '历史人物'
  | '名人命例'

/** 可信度等级 */
export type TrustLevel = 'S' | 'A' | 'B' | 'C'
// S = 确凿史料  A = 名人公认可信  B = 古籍有载待考  C = 口传待考

/** 人生事件 */
export type LifeEvent = {
  age: number
  year: string          // 如 "乾隆三十五年" 或 "1770"
  type: '事业' | '婚姻' | '财运' | '灾祸' | '健康' | '考试' | '生育' | '迁徙' | '死亡' | '其他'
  description: string
  relatedDaYun?: string   // 对应大运
  relatedLiuNian?: string // 对应流年
}

/** 核心：八字案例 */
export interface BaziCase {
  /** 唯一ID 如 CL-滴天髓-001 */
  id: string
  /** 命主名称 */
  name: string
  /** 来源 */
  source: CaseSource
  /** 分类（可多标签） */
  category: CaseCategory[]
  /** 可信度 */
  trustLevel: TrustLevel

  // ── 八字信息 ──
  yearGan: string
  yearZhi: string
  monthGan: string
  monthZhi: string
  dayGan: string
  dayZhi: string
  hourGan: string
  hourZhi: string

  // ── 大运（可选）──
  /** 大运序列 如 ['壬申','癸未','甲申','乙酉',...] */
  daYun?: string[]
  /** 起运年龄 */
  startDaYunAge?: number

  // ── 传统命理分析标签 ──
  /** 日主五行 */
  dayElement: string
  /** 格局 */
  pattern?: string
  /** 旺衰 */
  wangShuai?: string
  /** 用神 */
  yongShen?: string
  /** 喜神 */
  xiShen?: string
  /** 忌神 */
  jiShen?: string
  /** 传统命理结论 */
  conclusion: string
  /** 详细分析过程 */
  analysis?: string

  // ── 真实人生事件 ──
  lifeEvents: LifeEvent[]

  // ── 验证信息 ──
  /** 验证标签 如 ['格局验证通过','旺衰验证通过'] */
  verificationTags: string[]
  /** 已验证的分析维度 */
  verifiedDimensions: {
    geJu?: boolean
    wangShuai?: boolean
    yongShen?: boolean
    marriage?: boolean
    career?: boolean
  }

  // ── 元数据 ──
  /** 出处书名 */
  referenceBook?: string
  /** 出处章节 */
  referenceChapter?: string
  tags: string[]
  /** 案例版本 */
  version: number
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt?: string
}

/** 案例质量评分 */
export interface CaseScore {
  /** 信息完整度 0-100 */
  completeness: number
  /** 验证等级 0-100 */
  verificationLevel: number
  /** 可信度 0-100 */
  trustScore: number
  /** 综合评分 */
  totalScore: number
}

/** 案例库统计 */
export interface CaseLibraryStats {
  totalCases: number
  bySource: Record<string, number>
  byCategory: Record<string, number>
  byTrustLevel: Record<string, number>
  averageScore: number
  verifiedCases: number
}

// ═══════════════════════════════════════════════════════════
// CaseLibrary 类
// ═══════════════════════════════════════════════════════════

export class CaseLibrary {
  private cases: Map<string, BaziCase>

  constructor() {
    this.cases = new Map()
  }

  // ── 案例管理 ──────────────────────────────────────────

  /** 添加单个案例 */
  addCase(caze: BaziCase): void {
    this.cases.set(caze.id, caze)
  }

  /** 批量添加案例 */
  addCases(cases: BaziCase[]): void {
    for (const caze of cases) {
      this.cases.set(caze.id, caze)
    }
  }

  /** 移除案例，返回是否成功 */
  removeCase(id: string): boolean {
    return this.cases.delete(id)
  }

  /** 更新案例（partial merge），返回是否成功 */
  updateCase(id: string, updates: Partial<BaziCase>): boolean {
    const existing = this.cases.get(id)
    if (!existing) return false
    this.cases.set(id, { ...existing, ...updates, updatedAt: new Date().toISOString() })
    return true
  }

  // ── 检索 ──────────────────────────────────────────────

  /**
   * 全文搜索
   * 在 name / tags / conclusion / analysis 中进行模糊匹配（包含关键词即可）
   */
  search(query: string): BaziCase[] {
    const q = query.toLowerCase()
    const results: BaziCase[] = []

    for (const caze of this.cases.values()) {
      const haystack = [
        caze.name,
        ...caze.tags,
        caze.conclusion,
        caze.analysis ?? '',
      ].join(' ').toLowerCase()

      // 支持空格分隔的多关键词：每个关键词都需匹配
      const keywords = q.split(/\s+/).filter(Boolean)
      if (keywords.every((kw) => haystack.includes(kw))) {
        results.push(caze)
      }
    }
    return results
  }

  /** 精确匹配格局名 */
  searchByPattern(pattern: string): BaziCase[] {
    const results: BaziCase[] = []
    for (const caze of this.cases.values()) {
      if (caze.pattern === pattern) {
        results.push(caze)
      }
    }
    return results
  }

  /** 精确匹配来源 */
  searchBySource(source: CaseSource): BaziCase[] {
    const results: BaziCase[] = []
    for (const caze of this.cases.values()) {
      if (caze.source === source) {
        results.push(caze)
      }
    }
    return results
  }

  /** 精确匹配分类 */
  searchByCategory(category: CaseCategory): BaziCase[] {
    const results: BaziCase[] = []
    for (const caze of this.cases.values()) {
      if (caze.category.includes(category)) {
        results.push(caze)
      }
    }
    return results
  }

  /** 精确匹配日主五行 */
  searchByDayElement(element: string): BaziCase[] {
    const results: BaziCase[] = []
    for (const caze of this.cases.values()) {
      if (caze.dayElement === element) {
        results.push(caze)
      }
    }
    return results
  }

  /** 精确匹配可信度等级 */
  searchByTrustLevel(level: TrustLevel): BaziCase[] {
    const results: BaziCase[] = []
    for (const caze of this.cases.values()) {
      if (caze.trustLevel === level) {
        results.push(caze)
      }
    }
    return results
  }

  // ── 评分 ──────────────────────────────────────────────

  /** 评估单个案例质量 */
  scoreCase(id: string): CaseScore {
    const caze = this.cases.get(id)
    if (!caze) {
      return { completeness: 0, verificationLevel: 0, trustScore: 0, totalScore: 0 }
    }

    // ── completeness ──
    let completeness = 0

    if (caze.dayElement) completeness += 10
    if (caze.pattern)   completeness += 10
    if (caze.yongShen)  completeness += 10
    if (caze.xiShen)    completeness += 5
    if (caze.jiShen)    completeness += 5
    if (caze.daYun && caze.daYun.length > 0) completeness += 10
    completeness += Math.min(caze.lifeEvents.length * 3, 15)
    if (caze.analysis)  completeness += 10

    const verifiedCount = this._countVerifiedDimensions(caze)
    completeness += Math.min(verifiedCount * 5, 20)

    // ── verificationLevel ──
    const verificationLevel = verifiedCount * 20

    // ── trustScore ──
    const trustScoreMap: Record<TrustLevel, number> = {
      S: 100,
      A: 80,
      B: 60,
      C: 40,
    }
    const trustScore = trustScoreMap[caze.trustLevel]

    // ── totalScore ──
    const totalScore = completeness * 0.3 + verificationLevel * 0.3 + trustScore * 0.4

    return {
      completeness,
      verificationLevel,
      trustScore,
      totalScore,
    }
  }

  /** 评估所有案例质量 */
  scoreAllCases(): Map<string, CaseScore> {
    const scores = new Map<string, CaseScore>()
    for (const id of this.cases.keys()) {
      scores.set(id, this.scoreCase(id))
    }
    return scores
  }

  // ── 统计 ──────────────────────────────────────────────

  /** 获取案例库统计信息 */
  getStats(): CaseLibraryStats {
    const bySource: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    const byTrustLevel: Record<string, number> = {}
    let totalScore = 0
    let verifiedCases = 0

    for (const caze of this.cases.values()) {
      // source
      bySource[caze.source] = (bySource[caze.source] || 0) + 1
      // category
      for (const cat of caze.category) {
        byCategory[cat] = (byCategory[cat] || 0) + 1
      }
      // trustLevel
      byTrustLevel[caze.trustLevel] = (byTrustLevel[caze.trustLevel] || 0) + 1
      // score
      const score = this.scoreCase(caze.id)
      totalScore += score.totalScore
      // verified — 至少一个维度已验证
      if (this._countVerifiedDimensions(caze) > 0) {
        verifiedCases++
      }
    }

    const total = this.cases.size
    return {
      totalCases: total,
      bySource,
      byCategory,
      byTrustLevel,
      averageScore: total > 0 ? totalScore / total : 0,
      verifiedCases,
    }
  }

  // ── 导入导出 ──────────────────────────────────────────

  /** 导出为 JSON 字符串 */
  exportJSON(): string {
    const data: BaziCase[] = []
    for (const caze of this.cases.values()) {
      data.push(caze)
    }
    return JSON.stringify(data, null, 2)
  }

  /** 从 JSON 字符串导入，返回导入数量 */
  importJSON(json: string): number {
    let data: BaziCase[]
    try {
      data = JSON.parse(json)
    } catch {
      throw new Error('CaseLibrary.importJSON: 无效的 JSON 格式')
    }
    if (!Array.isArray(data)) {
      throw new Error('CaseLibrary.importJSON: JSON 顶层必须是数组')
    }
    let count = 0
    for (const caze of data) {
      if (caze && typeof caze.id === 'string') {
        this.cases.set(caze.id, caze)
        count++
      }
    }
    return count
  }

  // ── 内部工具 ──────────────────────────────────────────

  /** 统计已验证维度数量 */
  private _countVerifiedDimensions(caze: BaziCase): number {
    const dims = caze.verifiedDimensions
    if (!dims) return 0
    let count = 0
    if (dims.geJu)     count++
    if (dims.wangShuai) count++
    if (dims.yongShen)  count++
    if (dims.marriage)  count++
    if (dims.career)    count++
    return count
  }
}
