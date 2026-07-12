/**
 * 古籍文献库模块
 *
 * 提供八字命理经典古籍的注册、检索与引用管理。
 * 内置六大标准古籍（滴天髓、子平真诠、穷通宝鉴、三命通会、渊海子平、自研推导），
 * 支持按古籍ID获取、按关键词搜索引用、按优先级排序等功能。
 * 引用ID自动递增生成（ref-001, ref-002, ...）。
 */

// ═══════════════════════════════════════════════════════════════
// 接口定义
// ═══════════════════════════════════════════════════════════════

/**
 * 古籍书籍
 *
 * @example
 * {
 *   id: 'ditiansui',
 *   name: '滴天髓',
 *   author: '任铁樵',
 *   dynasty: '清',
 *   chapters: ['通神论', '六亲论', '从局论'],
 *   priority: 100,
 *   description: '任铁樵注解版，八字命理最高经典'
 * }
 */
export interface ClassicalBook {
  /** 书籍唯一ID */
  id: string
  /** 书名 */
  name: string
  /** 作者 */
  author: string
  /** 朝代 */
  dynasty: string
  /** 章节列表 */
  chapters: string[]
  /** 优先级（数字越大越权威） */
  priority: number
  /** 书籍简介 */
  description: string
}

/**
 * 古籍引用条目
 *
 * @example
 * {
 *   bookId: 'ditiansui',
 *   chapter: '通神论',
 *   section: '天干',
 *   originalText: '甲木参天，脱胎要火',
 *   interpretation: '甲木为阳木，需丙火阳光照耀方可成材',
 *   relevance: 0.95
 * }
 */
export interface ClassicalReference {
  /** 引用唯一ID（自动生成） */
  refId: string
  /** 所属书籍ID */
  bookId: string
  /** 章节名 */
  chapter: string
  /** 小节（可选） */
  section?: string
  /** 原文 */
  originalText: string
  /** 白话解读 */
  interpretation: string
  /** 相关度 0~1（越高越相关） */
  relevance: number
}

// ═══════════════════════════════════════════════════════════════
// ClassicalLibrary 实现
// ═══════════════════════════════════════════════════════════════

/**
 * 古籍文献库
 *
 * 管理经典书籍的注册与引用条目的增删查。
 * 引用ID采用自增计数器自动生成。
 */
export class ClassicalLibrary {
  /** 已注册书籍 */
  private books: Map<string, ClassicalBook> = new Map()
  /** 所有引用条目（跨书籍） */
  private references: Map<string, ClassicalReference> = new Map()
  /** 按书籍分组的引用列表 */
  private bookReferences: Map<string, ClassicalReference[]> = new Map()
  /** 自增计数器（引用ID） */
  private refCounter: number = 0

  constructor() {
    this._registerStandardBooks()
  }

  /**
   * 注册单本古籍
   *
   * @param book - 书籍对象
   */
  registerBook(book: ClassicalBook): void {
    if (this.books.has(book.id)) {
      console.warn(`[ClassicalLibrary] 书籍 "${book.id}" 已存在，将被覆盖`)
    }
    this.books.set(book.id, book)
    // 确保该书有引用分组
    if (!this.bookReferences.has(book.id)) {
      this.bookReferences.set(book.id, [])
    }
  }

  /**
   * 添加一条引用到指定书籍下
   *
   * @param bookId - 目标书籍ID
   * @param ref - 引用对象（无需提供 refId，系统自动生成）
   * @returns 自动生成的完整引用对象（含 refId）
   * @throws 如果目标书籍未注册，返回 null
   */
  addReference(bookId: string, ref: Omit<ClassicalReference, 'refId'>): ClassicalReference | null {
    if (!this.books.has(bookId)) {
      console.warn(`[ClassicalLibrary] 书籍 "${bookId}" 未注册，无法添加引用`)
      return null
    }

    this.refCounter++
    const refId = `ref-${String(this.refCounter).padStart(3, '0')}`
    const fullRef: ClassicalReference = { ...ref, refId }

    this.references.set(refId, fullRef)

    const bookRefs = this.bookReferences.get(bookId)!
    bookRefs.push(fullRef)

    return fullRef
  }

  /**
   * 根据书籍ID获取书籍信息
   *
   * @param bookId - 书籍唯一ID
   * @returns 书籍对象，若未找到返回 undefined
   */
  getBook(bookId: string): ClassicalBook | undefined {
    return this.books.get(bookId)
  }

  /**
   * 按关键词搜索引用
   *
   * 在原文与白话解读中搜索包含指定关键词的所有引用条目。
   *
   * @param query - 搜索关键词
   * @returns 匹配的引用列表，按相关度降序排列
   */
  searchReferences(query: string): ClassicalReference[] {
    const normalized = query.toLowerCase()
    return Array.from(this.references.values())
      .filter(ref =>
        ref.originalText.toLowerCase().includes(normalized) ||
        ref.interpretation.toLowerCase().includes(normalized)
      )
      .sort((a, b) => b.relevance - a.relevance)
  }

  /**
   * 按优先级排序返回所有书籍
   *
   * @returns 书籍列表，优先级从高到低
   */
  getByPriority(): ClassicalBook[] {
    return Array.from(this.books.values()).sort((a, b) => b.priority - a.priority)
  }

  /**
   * 列出所有已注册的书籍
   *
   * @returns 全部书籍列表
   */
  listAllBooks(): ClassicalBook[] {
    return Array.from(this.books.values())
  }

  /**
   * 根据引用ID获取引用条目
   *
   * @param refId - 引用唯一ID（如 ref-001）
   * @returns 引用对象，若未找到返回 undefined
   */
  getReferenceById(refId: string): ClassicalReference | undefined {
    return this.references.get(refId)
  }

  /**
   * 注册六大标准古籍
   * @private
   */
  private _registerStandardBooks(): void {
    this.registerBook({
      id: 'ditiansui',
      name: '滴天髓',
      author: '任铁樵',
      dynasty: '清',
      chapters: [],
      priority: 100,
      description: '任铁樵注解版，八字命理最高经典',
    })

    this.registerBook({
      id: 'zipingzhengquan',
      name: '子平真诠',
      author: '沈孝瞻',
      dynasty: '清',
      chapters: [],
      priority: 90,
      description: '沈孝瞻著，格局理论的经典之作',
    })

    this.registerBook({
      id: 'qiongtongbaojian',
      name: '穷通宝鉴',
      author: '无名氏',
      dynasty: '明',
      chapters: [],
      priority: 80,
      description: '调候用神的权威参考',
    })

    this.registerBook({
      id: 'sanmingtonghui',
      name: '三命通会',
      author: '万民英',
      dynasty: '明',
      chapters: [],
      priority: 70,
      description: '万民英编著，汇集诸家之大成',
    })

    this.registerBook({
      id: 'yuanhaiziping',
      name: '渊海子平',
      author: '徐大升',
      dynasty: '宋',
      chapters: [],
      priority: 60,
      description: '徐大升编著，子平术的奠基之作',
    })

    this.registerBook({
      id: 'ziyan_tuichu',
      name: '自研推导',
      author: '玄风门',
      dynasty: '当代',
      chapters: [],
      priority: 30,
      description: '玄风门自行推导的规则与结论',
    })
  }
}

/** 古籍文献库全局单例 */
export const classicalLibrary = new ClassicalLibrary()
