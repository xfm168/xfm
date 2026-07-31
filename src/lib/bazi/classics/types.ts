/**
 * C6 古籍知识引擎（Classical Knowledge Engine）
 *
 * 四层结构：
 *   Classic（经典）→ Chapter（章节）→ Paragraph（段落）→ Sentence（句子）
 *
 * 每句原文可被 Rule / Evidence / KnowledgeGraph 精确引用。
 */

/** 经典名称（7部） */
export type ClassicName =
  | '滴天髓'
  | '子平真诠'
  | '三命通会'
  | '渊海子平'
  | '穷通宝鉴'
  | '神峰通考'
  | '千里命稿'

/** 经典层级1：整部书 */
export interface Classic {
  id: string                    // 如 'dts'（滴天髓缩写）
  name: ClassicName
  fullName?: string             // 完整书名
  author?: string               // 作者
  dynasty?: string              // 朝代
  chapters: ClassicChapter[]
  /** 统计 */
  stats: {
    totalChapters: number
    totalParagraphs: number
    totalSentences: number
  }
}

/** 经典层级2：章节 */
export interface ClassicChapter {
  id: string                    // 如 'dts-c3'（滴天髓卷三）
  classicId: string
  title: string                 // 如 "通神论"
  volume?: string               // 卷号，如 "卷三"
  order: number                 // 章节序号
  paragraphs: ClassicParagraph[]
}

/** 经典层级3：段落 */
export interface ClassicParagraph {
  id: string                    // 如 'dts-c3-p4'
  chapterId: string
  order: number                 // 段落序号
  sentences: ClassicSentence[]
}

/** 经典层级4：句子（最小引用单位） */
export interface ClassicSentence {
  id: string                    // 如 'dts-c3-p4-s2'（滴天髓卷三第4段第2句）
  paragraphId: string
  order: number                 // 句子序号
  /** 原文 */
  originalText: string
  /** 现代释义 */
  translation: string
  /** 注解（历代命理家批注） */
  commentary?: string[]
  /** 涉及的命理概念 */
  concepts: string[]
  /** 引用此句的 Rule ID 列表 */
  ruleIds?: string[]
  /** 引用此句的 Evidence ID 列表 */
  evidenceIds?: string[]
  /** 关联的权威命例 ID 列表 */
  relatedCaseIds?: string[]
  /** 页码/出处 */
  referencePage?: string
  /** 是否存在不同流派解释 */
  hasControversy?: boolean
  /** 不同流派观点 */
  controversyNotes?: string[]

  /** C7: 关键词列表（用于搜索和索引） */
  keywords?: string[]
  /** C7: 关联的证据节点 ID 列表（EvidenceTree 节点） */
  evidenceNodes?: string[]
  /** C7: 关联的知识图谱节点 ID 列表 */
  knowledgeNodes?: string[]
  /** C7: 经典版本（如 '明刻本' '清校本' '通行本'） */
  classicVersion?: string
  /** C7: 版权状态（古籍均为 public_domain） */
  copyrightStatus?: 'public_domain' | 'restricted'
}

/** 精确引用定位器（Rule / Evidence / KG 使用） */
export interface ClassicLocator {
  classicId: string             // 如 'dts'
  chapterId: string             // 如 'dts-c3'
  paragraphId: string           // 如 'dts-c3-p4'
  sentenceId: string            // 如 'dts-c3-p4-s2'
  /** 引用原文（冗余存储，避免查找） */
  quotedText: string
  /** 引用方式：direct=直接引用 / paraphrase=转述 */
  citation: 'direct' | 'paraphrase'
}

/** 古籍知识引擎 */
export interface ClassicalKnowledgeEngine {
  readonly name: string
  readonly version: string
  /** 按 ID 查找经典 */
  getClassic(id: string): Classic | undefined
  /** 按名称查找经典 */
  getClassicByName(name: ClassicName): Classic | undefined
  /** 按 ID 查找章节 */
  getChapter(id: string): ClassicChapter | undefined
  /** 按 ID 查找段落 */
  getParagraph(id: string): ClassicParagraph | undefined
  /** 按 ID 查找句子（最小引用单位） */
  getSentence(id: string): ClassicSentence | undefined
  /** 按经典名称+章节标题查找 */
  findChapter(classicName: ClassicName, chapterTitle: string): ClassicChapter | undefined
  /** 全文搜索句子（关键词匹配） */
  searchSentences(keyword: string, classicName?: ClassicName): ClassicSentence[]
  /** 按概念查找句子 */
  findByConcept(concept: string): ClassicSentence[]
  /** 按规则 ID 反查引用的句子 */
  findByRuleId(ruleId: string): ClassicSentence[]
  /** 获取所有经典列表 */
  listClassics(): Classic[]
  /** 统计信息 */
  getStats(): { totalClassics: number; totalChapters: number; totalParagraphs: number; totalSentences: number }
}

/** C7: Corpus 管理器接口（支持动态注册新经典） */
export interface ClassicalCorpusManager {
  readonly name: string
  readonly version: string

  /** 注册新经典（支持后续动态扩展） */
  registerClassic(classic: Classic): void

  /** 注销经典 */
  unregisterClassic(classicId: string): boolean

  /** 按 ID 查找经典 */
  getClassic(id: string): Classic | undefined

  /** 按名称查找经典 */
  getClassicByName(name: string): Classic | undefined

  /** 按 ID 查找句子 */
  getSentence(id: string): ClassicSentence | undefined

  /** 按 ID 查找章节 */
  getChapter(id: string): ClassicChapter | undefined

  /** 按 ID 查找段落 */
  getParagraph(id: string): ClassicParagraph | undefined

  /** 按经典名称+章节标题查找 */
  findChapter(classicName: string, chapterTitle: string): ClassicChapter | undefined

  /** 全文搜索句子 */
  searchSentences(keyword: string, classicName?: string): ClassicSentence[]

  /** 按关键词搜索（使用 keywords[] 字段） */
  searchByKeywords(keyword: string): ClassicSentence[]

  /** 按概念查找 */
  findByConcept(concept: string): ClassicSentence[]

  /** 按规则 ID 反查 */
  findByRuleId(ruleId: string): ClassicSentence[]

  /** 按证据节点 ID 反查 */
  findByEvidenceNode(nodeId: string): ClassicSentence[]

  /** 按知识图谱节点 ID 反查 */
  findByKnowledgeNode(nodeId: string): ClassicSentence[]

  /** 列出所有已注册经典 */
  listClassics(): Classic[]

  /** 检查经典是否已注册 */
  hasClassic(classicId: string): boolean

  /** 统计信息 */
  getStats(): CorpusStats
}

/** C7: Corpus 统计信息 */
export interface CorpusStats {
  totalClassics: number
  totalChapters: number
  totalParagraphs: number
  totalSentences: number
  /** 按经典统计 */
  byClassic: Array<{
    id: string
    name: string
    chapters: number
    paragraphs: number
    sentences: number
    version?: string
  }>
  /** 版权状态分布 */
  copyrightDistribution: Record<string, number>
}
