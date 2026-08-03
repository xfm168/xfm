/**
 * P0-5B Knowledge Graph — 典籍（Classic）模块
 *
 * 经典典籍源与典籍条目的管理。升级自既有 classicGraph.ts 的典籍部分：
 *   - ClassicSource  典籍源（书名 / 作者 / 朝代 / 篇章 / 可信度 / 版本）
 *   - ClassicEntry   典籍条目（章节 / 原文 / 关联概念 / 关联五行 / 上下文 / 支持/反对）
 *
 * ClassicManager 提供：
 *   - registerClassic / registerEntry   注册
 *   - getClassic / getEntry             查询
 *   - listByClassic / listByConcept / listByWuxing   多维列表
 *   - search                            原文搜索
 *   - validateQuote                     引用校验（核对原文是否真出自某典籍）
 *   - getStats                          统计
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

// ============================================================
// 类型定义
// ============================================================

/** 典籍源（一部书的元信息） */
export interface ClassicSource {
  /** 典籍 ID（如 'ck:滴天髓'） */
  id: string
  /** 典籍名称（如 '滴天髓'） */
  name: string
  /** 作者（如 '京图撰、刘伯温注'） */
  author?: string
  /** 朝代（如 '明'） */
  dynasty?: string
  /** 主要篇章列表 */
  chapters: string[]
  /** 可信度 0~1（学术公认度） */
  reliability: number
  /** 版本（如 '通行本' / '明刻本'） */
  version: string
}

/** 典籍条目（一段原文引用） */
export interface ClassicEntry {
  /** 条目 ID（如 'ce:dts-tongshen-001'） */
  id: string
  /** 所属典籍 ID */
  classicId: string
  /** 所属典籍名称（冗余字段，便于查询） */
  classicName: string
  /** 章节名（如 '通神论'） */
  chapter: string
  /** 原文 */
  text: string
  /** 关联概念（如 '扶抑'） */
  concept?: string
  /** 关联五行（如 '木'） */
  wuxing?: string
  /** 上下文说明 */
  context?: string
  /** 该条文支持什么（如 '身强宜泄'） */
  supports?: string
  /** 该条文反对什么（如 '格局之说不必泥于月令'） */
  opposes?: string
}

// ============================================================
// ClassicManager 典籍管理器
// ============================================================

/**
 * 典籍管理器
 *
 * 维护典籍源（ClassicSource）与典籍条目（ClassicEntry），
 * 提供典籍级别的检索、原文搜索、引用校验能力。
 */
export class ClassicManager {
  /** 典籍源表：classicId → ClassicSource */
  private classics = new Map<string, ClassicSource>()
  /** 典籍条目表：entryId → ClassicEntry */
  private entries = new Map<string, ClassicEntry>()
  /** 按典籍名索引条目 */
  private entriesByClassicName = new Map<string, Set<string>>()
  /** 按概念索引条目 */
  private entriesByConcept = new Map<string, Set<string>>()
  /** 按五行索引条目 */
  private entriesByWuxing = new Map<string, Set<string>>()
  /** 典籍名 → classicId */
  private classicIdByName = new Map<string, string>()

  constructor() {
    this.loadSeed()
  }

  // ---------- 注册 ----------

  /** 注册典籍源（已存在则更新），返回是否为新增 */
  registerClassic(source: ClassicSource): boolean {
    const isNew = !this.classics.has(source.id)
    this.classics.set(source.id, source)
    this.classicIdByName.set(source.name, source.id)
    return isNew
  }

  /** 注册典籍条目（已存在则更新），返回是否为新增 */
  registerEntry(entry: ClassicEntry): boolean {
    const isNew = !this.entries.has(entry.id)
    this.entries.set(entry.id, entry)

    if (!this.entriesByClassicName.has(entry.classicName)) {
      this.entriesByClassicName.set(entry.classicName, new Set())
    }
    this.entriesByClassicName.get(entry.classicName)!.add(entry.id)

    if (entry.concept) {
      if (!this.entriesByConcept.has(entry.concept)) this.entriesByConcept.set(entry.concept, new Set())
      this.entriesByConcept.get(entry.concept)!.add(entry.id)
    }
    if (entry.wuxing) {
      if (!this.entriesByWuxing.has(entry.wuxing)) this.entriesByWuxing.set(entry.wuxing, new Set())
      this.entriesByWuxing.get(entry.wuxing)!.add(entry.id)
    }
    return isNew
  }

  // ---------- 查询 ----------

  /** 按典籍 ID 获取典籍源 */
  getClassic(id: string): ClassicSource | undefined {
    return this.classics.get(id)
  }

  /** 按条目 ID 获取典籍条目 */
  getEntry(id: string): ClassicEntry | undefined {
    return this.entries.get(id)
  }

  /** 列出某典籍的所有条目 */
  listByClassic(name: string): ClassicEntry[] {
    const ids = this.entriesByClassicName.get(name) ?? new Set()
    const out: ClassicEntry[] = []
    for (const id of ids) {
      const e = this.entries.get(id)
      if (e) out.push(e)
    }
    return out
  }

  /** 列出某概念相关的所有典籍条目 */
  listByConcept(concept: string): ClassicEntry[] {
    const ids = this.entriesByConcept.get(concept) ?? new Set()
    const out: ClassicEntry[] = []
    for (const id of ids) {
      const e = this.entries.get(id)
      if (e) out.push(e)
    }
    return out
  }

  /** 列出某五行相关的所有典籍条目 */
  listByWuxing(wuxing: string): ClassicEntry[] {
    const ids = this.entriesByWuxing.get(wuxing) ?? new Set()
    const out: ClassicEntry[] = []
    for (const id of ids) {
      const e = this.entries.get(id)
      if (e) out.push(e)
    }
    return out
  }

  /** 原文搜索（在 text / context / supports / opposes 中匹配） */
  search(text: string): ClassicEntry[] {
    if (!text) return []
    const kw = text.toLowerCase()
    const result: ClassicEntry[] = []
    for (const e of this.entries.values()) {
      const haystack = [e.text, e.context ?? '', e.supports ?? '', e.opposes ?? ''].join(' ').toLowerCase()
      if (haystack.includes(kw)) result.push(e)
    }
    return result
  }

  /**
   * 校验某段引用是否真出自指定典籍
   * 匹配策略：完全匹配 / 包含匹配（引用是某条目 text 的子串，或反之）
   * @returns valid 是否有效；matched 匹配到的条目；reason 失败原因
   */
  validateQuote(classicName: string, quote: string): { valid: boolean; matched?: ClassicEntry; reason?: string } {
    if (!quote || !classicName) {
      return { valid: false, reason: '典籍名与引用原文均不能为空' }
    }

    const entries = this.listByClassic(classicName)
    if (entries.length === 0) {
      return { valid: false, reason: `典籍 ${classicName} 不存在或无任何条目` }
    }

    const q = quote.trim()
    // 完全匹配
    for (const e of entries) {
      if (e.text.trim() === q) return { valid: true, matched: e }
    }
    // 包含匹配（引用是条目原文的子串，或条目原文是引用的子串）
    for (const e of entries) {
      if (e.text.includes(q) || q.includes(e.text.trim())) return { valid: true, matched: e }
    }
    return { valid: false, reason: `在 ${classicName} 中未找到匹配的原文条目` }
  }

  /** 获取统计 */
  getStats(): { totalClassics: number; totalEntries: number } {
    return {
      totalClassics: this.classics.size,
      totalEntries: this.entries.size,
    }
  }

  // ---------- 种子数据 ----------

  /** 加载种子典籍与条目 */
  private loadSeed(): void {
    for (const c of SEED_CLASSIC_SOURCES) this.registerClassic(c)
    for (const e of SEED_CLASSIC_ENTRIES) this.registerEntry(e)
  }
}

// ============================================================
// 种子数据：典籍源（5 部核心典籍）
// ============================================================

const SEED_CLASSIC_SOURCES: ClassicSource[] = [
  {
    id: 'ck:滴天髓',
    name: '滴天髓',
    author: '京图撰、刘伯温注',
    dynasty: '明',
    chapters: ['通神论', '天干十论', '地支', '形象', '方局', '八格', '体用', '中和'],
    reliability: 0.95,
    version: '通行本',
  },
  {
    id: 'ck:子平真诠',
    name: '子平真诠',
    author: '沈孝瞻',
    dynasty: '清',
    chapters: ['论月令', '论用神', '论用神成败', '论用神配六亲', '论行运', '论十干'],
    reliability: 0.95,
    version: '通行本',
  },
  {
    id: 'ck:穷通宝鉴',
    name: '穷通宝鉴',
    author: '余春台',
    dynasty: '清',
    chapters: ['春木', '夏火', '秋金', '冬水', '四季土', '调候'],
    reliability: 0.9,
    version: '通行本',
  },
  {
    id: 'ck:三命通会',
    name: '三命通会',
    author: '万民英',
    dynasty: '明',
    chapters: ['论五行', '论十干', '论地支', '论神煞', '论三刑', '论三合'],
    reliability: 0.85,
    version: '通行本',
  },
  {
    id: 'ck:渊海子平',
    name: '渊海子平',
    author: '徐子平',
    dynasty: '宋',
    chapters: ['论五行生克', '论天干地支', '论用神', '论化合', '论六亲'],
    reliability: 0.85,
    version: '通行本',
  },
]

// ============================================================
// 种子数据：典籍条目（≥ 20 条）
// ============================================================

const SEED_CLASSIC_ENTRIES: ClassicEntry[] = [
  // ---------- 滴天髓 ----------
  {
    id: 'ce:dts-tongshen-001',
    classicId: 'ck:滴天髓', classicName: '滴天髓', chapter: '通神论',
    text: '旺则损之，衰则益之',
    concept: '扶抑', wuxing: '木',
    context: '论日主衰旺之辨',
    supports: '身强宜泄，身弱宜扶',
  },
  {
    id: 'ce:dts-tongshen-002',
    classicId: 'ck:滴天髓', classicName: '滴天髓', chapter: '通神论',
    text: '通关之气，乃中和之道',
    concept: '通关',
    context: '论两行相争需通关调和',
    supports: '通关法',
  },
  {
    id: 'ce:dts-tiangan-001',
    classicId: 'ck:滴天髓', classicName: '滴天髓', chapter: '天干十论',
    text: '甲木参天，脱胎要火',
    concept: '调候', wuxing: '木',
    context: '论甲木春生喜丙火',
    supports: '春木喜丙火',
  },
  {
    id: 'ce:dts-tiangan-002',
    classicId: 'ck:滴天髓', classicName: '滴天髓', chapter: '天干十论',
    text: '乙木虽柔，刲羊解牛',
    concept: '旺衰', wuxing: '木',
    context: '论乙木之性',
    supports: '乙木柔而能制未丑',
  },
  {
    id: 'ce:dts-tiangan-003',
    classicId: 'ck:滴天髓', classicName: '滴天髓', chapter: '天干十论',
    text: '丙火猛烈，欺霜侮雪',
    concept: '旺衰', wuxing: '火',
    context: '论丙火之性',
    supports: '丙火猛烈不畏水',
  },
  {
    id: 'ce:dts-tiangan-004',
    classicId: 'ck:滴天髓', classicName: '滴天髓', chapter: '天干十论',
    text: '壬水通河，能泄金气',
    concept: '旺衰', wuxing: '水',
    context: '论壬水之性',
    supports: '壬水通河能泄金',
  },
  {
    id: 'ce:dts-xingxiang-001',
    classicId: 'ck:滴天髓', classicName: '滴天髓', chapter: '形象',
    text: '一成不可变，从其势而论',
    concept: '从格',
    context: '论从格之取',
    supports: '从格从势而论',
  },

  // ---------- 子平真诠 ----------
  {
    id: 'ce:zpzq-yueling-001',
    classicId: 'ck:子平真诠', classicName: '子平真诠', chapter: '论月令',
    text: '八字用神，专凭月令',
    concept: '格局', wuxing: '木',
    context: '论月令为格局用神之提纲',
    supports: '月令为用神之本',
  },
  {
    id: 'ce:zpzq-yueling-002',
    classicId: 'ck:子平真诠', classicName: '子平真诠', chapter: '论月令',
    text: '月令乃用神之提纲',
    concept: '月令',
    context: '论月令之重要',
    supports: '月令为八字提纲',
  },
  {
    id: 'ce:zpzq-yongshen-001',
    classicId: 'ck:子平真诠', classicName: '子平真诠', chapter: '论用神',
    text: '用神之取，不外扶抑、病药、通关、调候',
    concept: '用神',
    context: '论用神取法四端',
    supports: '用神四法：扶抑、病药、通关、调候',
  },
  {
    id: 'ce:zpzq-yongshen-002',
    classicId: 'ck:子平真诠', classicName: '子平真诠', chapter: '论用神',
    text: '身强则宜泄之耗之，身弱则宜生之扶之',
    concept: '扶抑',
    context: '论扶抑法',
    supports: '身强宜泄耗，身弱宜生扶',
  },
  {
    id: 'ce:zpzq-yongshen-003',
    classicId: 'ck:子平真诠', classicName: '子平真诠', chapter: '论用神',
    text: '七杀有制，化为权柄',
    concept: '病药', wuxing: '金',
    context: '论七杀有制为权',
    supports: '七杀有制为权',
  },
  {
    id: 'ce:zpzq-yongshen-004',
    classicId: 'ck:子平真诠', classicName: '子平真诠', chapter: '论用神',
    text: '忌神者，害用之神也',
    concept: '忌神',
    context: '论忌神之定义',
    supports: '克用之神为忌神',
  },
  {
    id: 'ce:zpzq-shigan-001',
    classicId: 'ck:子平真诠', classicName: '子平真诠', chapter: '论十干',
    text: '甲木生春，旺而喜火',
    concept: '调候', wuxing: '木',
    context: '论甲木春生',
    supports: '春木喜火泄秀',
  },

  // ---------- 穷通宝鉴 ----------
  {
    id: 'ce:qgbj-chunmu-001',
    classicId: 'ck:穷通宝鉴', classicName: '穷通宝鉴', chapter: '春木',
    text: '春木先用丙火后用癸水',
    concept: '调候', wuxing: '木',
    context: '论春木调候',
    supports: '春木喜丙火泄秀、癸水滋润',
  },
  {
    id: 'ce:qgbj-xiahuo-001',
    classicId: 'ck:穷通宝鉴', classicName: '穷通宝鉴', chapter: '夏火',
    text: '夏火先用壬水后用庚金',
    concept: '调候', wuxing: '火',
    context: '论夏火调候',
    supports: '夏火喜壬水制火、庚金助水',
  },
  {
    id: 'ce:qgbj-qiujin-001',
    classicId: 'ck:穷通宝鉴', classicName: '穷通宝鉴', chapter: '秋金',
    text: '秋金先用丁火后用甲木',
    concept: '调候', wuxing: '金',
    context: '论秋金调候',
    supports: '秋金喜丁火炼金、甲木生火',
  },
  {
    id: 'ce:qgbj-dongshui-001',
    classicId: 'ck:穷通宝鉴', classicName: '穷通宝鉴', chapter: '冬水',
    text: '冬水先用戊土后用丙火',
    concept: '调候', wuxing: '水',
    context: '论冬水调候',
    supports: '冬水喜戊土止水、丙火暖局',
  },
  {
    id: 'ce:qgbj-dongmu-001',
    classicId: 'ck:穷通宝鉴', classicName: '穷通宝鉴', chapter: '春木',
    text: '冬木寒冷，先用丙火照暖',
    concept: '调候', wuxing: '木',
    context: '论冬木调候（寒木向阳）',
    supports: '寒木向阳，冬木喜丙火',
  },
  {
    id: 'ce:qgbj-tiaohou-001',
    classicId: 'ck:穷通宝鉴', classicName: '穷通宝鉴', chapter: '调候',
    text: '调候在月令，气候定喜忌',
    concept: '调候',
    context: '调候总论',
    supports: '调候以月令气候为本',
  },

  // ---------- 三命通会 ----------
  {
    id: 'ce:smth-wuxing-001',
    classicId: 'ck:三命通会', classicName: '三命通会', chapter: '论五行',
    text: '木主仁，其性直，其情和',
    concept: '旺衰', wuxing: '木',
    context: '论木之性',
    supports: '木主仁',
  },
  {
    id: 'ce:smth-wuxing-002',
    classicId: 'ck:三命通会', classicName: '三命通会', chapter: '论五行',
    text: '火主礼，其性急，其情恭',
    concept: '旺衰', wuxing: '火',
    context: '论火之性',
    supports: '火主礼',
  },
  {
    id: 'ce:smth-wuxing-003',
    classicId: 'ck:三命通会', classicName: '三命通会', chapter: '论五行',
    text: '土主信，其性重，其情厚',
    concept: '旺衰', wuxing: '土',
    context: '论土之性',
    supports: '土主信',
  },
  {
    id: 'ce:smth-wuxing-004',
    classicId: 'ck:三命通会', classicName: '三命通会', chapter: '论五行',
    text: '金主义，其性刚，其情烈',
    concept: '旺衰', wuxing: '金',
    context: '论金之性',
    supports: '金主义',
  },
  {
    id: 'ce:smth-wuxing-005',
    classicId: 'ck:三命通会', classicName: '三命通会', chapter: '论五行',
    text: '水主智，其性聪，其情善',
    concept: '旺衰', wuxing: '水',
    context: '论水之性',
    supports: '水主智',
  },
  {
    id: 'ce:smth-shigan-001',
    classicId: 'ck:三命通会', classicName: '三命通会', chapter: '论十干',
    text: '甲木为阳木，栋梁之材',
    concept: '旺衰', wuxing: '木',
    context: '论甲木',
    supports: '甲木为阳，可作栋梁',
  },
  {
    id: 'ce:smth-dizhi-001',
    classicId: 'ck:三命通会', classicName: '三命通会', chapter: '论地支',
    text: '寅为阳木，初春之木',
    concept: '旺衰', wuxing: '木',
    context: '论寅木',
    supports: '寅为阳木',
  },

  // ---------- 渊海子平 ----------
  {
    id: 'ce:yhqp-yongshen-001',
    classicId: 'ck:渊海子平', classicName: '渊海子平', chapter: '论用神',
    text: '用神者，命局之枢纽',
    concept: '用神',
    context: '论用神之重要',
    supports: '用神为命局枢纽',
  },
  {
    id: 'ce:yhqp-yongshen-002',
    classicId: 'ck:渊海子平', classicName: '渊海子平', chapter: '论用神',
    text: '正官者，六格之首',
    concept: '格局',
    context: '论正官格',
    supports: '正官为六格之首',
  },
  {
    id: 'ce:yhqp-huahe-001',
    classicId: 'ck:渊海子平', classicName: '渊海子平', chapter: '论化合',
    text: '甲己合化土，乙庚合化金',
    concept: '化气', wuxing: '土',
    context: '论天干五合化气',
    supports: '甲己化土，乙庚化金',
  },
  {
    id: 'ce:yhqp-wuxing-001',
    classicId: 'ck:渊海子平', classicName: '渊海子平', chapter: '论五行生克',
    text: '木生火，火生土，土生金，金生水，水生木',
    concept: '旺衰',
    context: '论五行相生',
    supports: '五行相生之序',
  },
  {
    id: 'ce:yhqp-wuxing-002',
    classicId: 'ck:渊海子平', classicName: '渊海子平', chapter: '论五行生克',
    text: '木克土，土克水，水克火，火克金，金克木',
    concept: '旺衰',
    context: '论五行相克',
    supports: '五行相克之序',
  },
]

// ============================================================
// 全局单例
// ============================================================

/** 全局典籍管理器单例 */
export const globalClassicManager = new ClassicManager()
