// 引用管理器 —— 统一注册、查询、验证古籍引用

import {
  type CitationID,
  type CitationRef,
  type ClassicCode,
  formatCitationID,
  parseCitationID,
  isValidCitationID,
  CLASSIC_CODE_MAP,
} from './citationTypes'

// ============================================================
// CitationManager 类
// ============================================================

/**
 * 古籍引用管理器
 *
 * 维护一张 CitationID → CitationRef 的全局表，提供：
 *   - 注册（自动生成 ID 或显式指定 ID）
 *   - 单条 / 按典籍 / 按章节 查询
 *   - 全文搜索（在原文 / 译文 / 诠释中匹配）
 *   - ID 合法性校验
 *   - 列举 / 统计
 */
export class CitationManager {
  /** 引用 ID → CitationRef 注册表 */
  private citations = new Map<CitationID, CitationRef>()

  // ============================================================
  // 注册
  // ============================================================

  /**
   * 注册一条引用 —— 自动生成 citationId
   *
   * @param ref 不含 citationId 的引用对象
   * @returns 注册后包含 citationId 的完整引用
   */
  register(ref: Omit<CitationRef, 'citationId'>): CitationRef {
    const citationId = formatCitationID(
      ref.classicCode,
      ref.chapter,
      ref.section,
      ref.paragraph,
      ref.line,
    )
    const full: CitationRef = { ...ref, citationId }
    this.citations.set(citationId, full)
    return full
  }

  /**
   * 注册一条引用 —— 使用预格式化的 ID
   *
   * 适用于外部已有 ID 体系的场景；ID 不合法时抛错。
   */
  registerWithID(ref: CitationRef): void {
    if (!isValidCitationID(ref.citationId)) {
      throw new Error(`非法引用 ID：${ref.citationId}`)
    }
    this.citations.set(ref.citationId, ref)
  }

  // ============================================================
  // 查询
  // ============================================================

  /**
   * 按 ID 获取引用
   */
  get(id: CitationID): CitationRef | undefined {
    return this.citations.get(id)
  }

  /**
   * 按古籍代号获取全部引用
   */
  getByClassic(code: ClassicCode): CitationRef[] {
    const out: CitationRef[] = []
    for (const ref of this.citations.values()) {
      if (ref.classicCode === code) out.push(ref)
    }
    return out
  }

  /**
   * 按古籍代号 + 章号获取引用
   */
  getByChapter(code: ClassicCode, chapter: number): CitationRef[] {
    const out: CitationRef[] = []
    for (const ref of this.citations.values()) {
      if (ref.classicCode === code && ref.chapter === chapter) out.push(ref)
    }
    return out
  }

  /**
   * 全文搜索 —— 在原文 / 译文 / 诠释中匹配
   *
   * @param query 搜索关键词（大小写不敏感）
   */
  search(query: string): CitationRef[] {
    if (!query) return []
    const q = query.toLowerCase()
    const out: CitationRef[] = []
    for (const ref of this.citations.values()) {
      const inOriginal = ref.originalText?.toLowerCase().includes(q)
      const inTranslation = ref.translation?.toLowerCase().includes(q)
      const inInterp = ref.interpretation?.toLowerCase().includes(q)
      if (inOriginal || inTranslation || inInterp) out.push(ref)
    }
    return out
  }

  // ============================================================
  // 校验
  // ============================================================

  /**
   * 校验某个引用 ID 是否合法且已注册
   *
   * @returns valid=true 且 errors 为空表示合法且已注册
   */
  validate(id: CitationID): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    if (!isValidCitationID(id)) {
      errors.push(`引用 ID 格式非法：${id}`)
      return { valid: false, errors }
    }
    if (!this.citations.has(id)) {
      errors.push(`引用 ID 未在管理器中注册：${id}`)
      return { valid: false, errors }
    }
    // 进一步校验解析后的字段一致性
    const ref = this.citations.get(id)!
    const parsed = parseCitationID(id)
    if (parsed.classicCode !== ref.classicCode) {
      errors.push(
        `古籍代号不一致：ID 解析为 ${parsed.classicCode}，注册为 ${ref.classicCode}`,
      )
    }
    if (parsed.chapter !== ref.chapter) {
      errors.push(`章号不一致：ID 解析为 ${parsed.chapter}，注册为 ${ref.chapter}`)
    }
    if (parsed.section !== ref.section) {
      errors.push(`节号不一致：ID 解析为 ${parsed.section}，注册为 ${ref.section}`)
    }
    if (parsed.paragraph !== ref.paragraph) {
      errors.push(
        `段号不一致：ID 解析为 ${parsed.paragraph}，注册为 ${ref.paragraph}`,
      )
    }
    return { valid: errors.length === 0, errors }
  }

  // ============================================================
  // 列举 / 统计
  // ============================================================

  /**
   * 列举所有引用
   */
  list(): CitationRef[] {
    return Array.from(this.citations.values())
  }

  /**
   * 已注册引用数量
   */
  count(): number {
    return this.citations.size
  }
}

// ============================================================
// 全局单例 + 10+ 种子引用
// ============================================================

export const globalCitationManager = new CitationManager()

// 滴天髓 DTS —— 3 条种子
globalCitationManager.register({
  classicCode: 'DTS',
  classicName: CLASSIC_CODE_MAP.DTS,
  chapter: 1,
  section: 1,
  paragraph: 1,
  originalText: '欲识三元万法宗，先观帝载与神功。',
  translation: '要认识三元万法的根本宗旨，先观察太极元气与造化神功。',
  interpretation: '三元：天元、地元、人元。帝载：太极元气，万物本源。',
})

globalCitationManager.register({
  classicCode: 'DTS',
  classicName: CLASSIC_CODE_MAP.DTS,
  chapter: 1,
  section: 2,
  paragraph: 1,
  originalText: '坤元合德机缄通，五气偏全定吉凶。',
  translation: '地元合天德而机缄相通，五行之气偏全决定吉凶。',
})

globalCitationManager.register({
  classicCode: 'DTS',
  classicName: CLASSIC_CODE_MAP.DTS,
  chapter: 3,
  section: 2,
  paragraph: 15,
  originalText: '阳干从气，阴干从质。',
  translation: '阳干主气之流行，阴干主质之凝聚。',
  interpretation: '阳干主动、主气；阴干主静、主质。',
})

// 穷通宝鉴 QTB —— 3 条种子
globalCitationManager.register({
  classicCode: 'QTB',
  classicName: CLASSIC_CODE_MAP.QTB,
  chapter: 1,
  section: 1,
  paragraph: 1,
  originalText: '春木喜火，夏木喜水，秋金喜水，冬火喜木。',
  translation: '春季木命喜火泄秀，夏季木命喜水润养，秋季金命喜水洗淘，冬季火命喜木生助。',
})

globalCitationManager.register({
  classicCode: 'QTB',
  classicName: CLASSIC_CODE_MAP.QTB,
  chapter: 2,
  section: 1,
  paragraph: 5,
  originalText: '甲木生于春月，喜火发荣，忌金克伐。',
  translation: '甲木生于春季，喜见火来泄秀发荣，忌见金来克伐。',
})

globalCitationManager.register({
  classicCode: 'QTB',
  classicName: CLASSIC_CODE_MAP.QTB,
  chapter: 4,
  section: 2,
  paragraph: 8,
  originalText: '丙火生于夏月，喜壬水既济，忌再添薪。',
  translation: '丙火生于夏季，喜壬水来既济调候，忌再添柴薪。',
})

// 子平真诠 ZYQ —— 2 条种子
globalCitationManager.register({
  classicCode: 'ZYQ',
  classicName: CLASSIC_CODE_MAP.ZYQ,
  chapter: 1,
  section: 1,
  paragraph: 1,
  originalText: '天地之间，一气而已。惟有动静，遂分阴阳。',
  translation: '天地之间本只有一气，因有动静遂分为阴阳。',
})

globalCitationManager.register({
  classicCode: 'ZYQ',
  classicName: CLASSIC_CODE_MAP.ZYQ,
  chapter: 2,
  section: 3,
  paragraph: 4,
  originalText: '用神之取舍，须看月令所藏透干。',
  translation: '取用神之道，须看月令所藏之神透出天干。',
  interpretation: '月令：月支；透干：藏干透出天干。',
})

// 渊海子平 YSX —— 1 条种子
globalCitationManager.register({
  classicCode: 'YSX',
  classicName: CLASSIC_CODE_MAP.YSX,
  chapter: 1,
  section: 1,
  paragraph: 1,
  originalText: '子平之说，以日为主，月令为提纲。',
  translation: '子平之法，以日干为主，月令为提纲。',
})

// 三命通会 QBJ —— 1 条种子
globalCitationManager.register({
  classicCode: 'QBJ',
  classicName: CLASSIC_CODE_MAP.QBJ,
  chapter: 3,
  section: 1,
  paragraph: 2,
  originalText: '十干合化，气聚而化；不化者，气不聚也。',
  translation: '十干相合，需气聚方能化；不化者，因气不聚。',
})

// 神峰通考 SBJ —— 1 条种子
globalCitationManager.register({
  classicCode: 'SBJ',
  classicName: CLASSIC_CODE_MAP.SBJ,
  chapter: 2,
  section: 2,
  paragraph: 6,
  originalText: '盖夫药病之说，有病方为贵，无伤不是奇。',
  translation: '所谓药病之说，八字有病方显其贵，无伤不见其奇。',
  interpretation: '病药：八字格局中的偏枯与救应。',
})

// 珞琭子赋 HYD —— 1 条种子
globalCitationManager.register({
  classicCode: 'HYD',
  classicName: CLASSIC_CODE_MAP.HYD,
  chapter: 1,
  section: 1,
  paragraph: 1,
  originalText: '珞琭子曰：见不见之形，抽不抽之绪。',
  translation: '珞琭子说：要看见看不见的形迹，要抽出难以抽出的头绪。',
})
