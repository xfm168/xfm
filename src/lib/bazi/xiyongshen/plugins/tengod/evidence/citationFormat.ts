/**
 * P1.2.1-A2 Evidence Citation 适配层
 *
 * 验收规则：
 *   - citation 字段允许为空（undefined / null / 空字符串）
 *   - 若存在，必须包含：古籍名称、原文、来源章节，且格式正确
 *
 * 标准格式：`《古籍名》·章节：原文`
 *   例：`《子平真诠》·论正官：正官者，克我之正神也。`
 *
 * 提供 formatCitation（构造）与 validateCitation（校验）两个工具，
 * 供 evidence builder / engine / 验收测试统一调用。
 */

/** 已收录的 8 部古籍名集合（用于校验古籍名称合法性） */
export const KNOWN_CLASSIC_NAMES: ReadonlySet<string> = new Set<string>([
  '滴天髓',
  '穷通宝鉴',
  '子平真诠',
  '渊海子平',
  '三命通会',
  '神峰通考',
  '千里命稿',
  '御定子平',
  '玉照定真经',
  '八字提要',
  '命理探源',
  '李虚中命书',
])

/** 古籍名匹配正则：形如 《xxx》 或 「xxx」 或 直接中文名（≥2字符） */
const CLASSIC_NAME_RE = /(?:《([^》]+)》|「([^」]+)」|（([^）]+)）)/

/**
 * 构造标准格式 citation 字符串。
 * @param classicName 古籍名称，如「子平真诠」
 * @param chapter 来源章节，如「论正官」
 * @param originalText 原文，如「正官者，克我之正神也。」
 * @returns 形如 `《子平真诠》·论正官：正官者，克我之正神也。`
 */
export function formatCitation(
  classicName: string,
  chapter: string,
  originalText: string,
): string {
  const cn = (classicName || '').trim()
  const ch = (chapter || '').trim()
  const ot = (originalText || '').trim()
  const classicPart = cn ? `《${cn}》` : ''
  const chapterPart = ch ? `·${ch}` : ''
  return `${classicPart}${chapterPart}：${ot}`
}

/**
 * 校验 citation 是否符合验收规则。
 *
 * 规则：
 *   1) citation 为空（undefined / null / 空串）→ 视为合法（允许空）
 *   2) citation 非空 → 必须满足：
 *      a) 含古籍名（《xxx》 / 「xxx」 / 已知古籍名直出）
 *      b) 含原文（：之后存在非空内容）
 *      c) 含来源章节（·xxx 或 #xxx 或 §xxx 标记）
 *
 * @returns valid 是否合法；若非法，reasons 给出原因
 */
export function validateCitation(
  citation?: string | null,
): { valid: boolean; reasons: string[] } {
  const reasons: string[] = []
  if (citation == null || citation === '' || (typeof citation === 'string' && citation.trim() === '')) {
    return { valid: true, reasons: [] }
  }
  const c = citation.trim()

  // a) 古籍名：必须含 《xxx》 / 「xxx」 / （xxx） 或 已知古籍名
  const hasClassicBracket = CLASSIC_NAME_RE.test(c)
  const hasKnownClassic = [...KNOWN_CLASSIC_NAMES].some(name => c.includes(name))
  if (!hasClassicBracket && !hasKnownClassic) {
    reasons.push('缺少古籍名称（应为《古籍名》格式或包含已知古籍名）')
  }

  // b) 原文：必须含 ：或 : 之后存在非空内容
  const colonIdx = c.search(/[：:]/)
  if (colonIdx < 0) {
    reasons.push('缺少原文分隔符（应为中文：或英文:）')
  } else {
    const afterColon = c.slice(colonIdx + 1).trim()
    if (afterColon.length < 2) {
      reasons.push('原文内容过短（：后应至少 2 字符）')
    }
  }

  // c) 来源章节：必须含 ·xxx / #xxx / §xxx / 章节名 之一
  const hasChapter =
    /[·•]\s*[^：:]+/.test(c) ||     // ·章节
    /#\d+/.test(c) ||              // #paragraph
    /§\d+/.test(c) ||              // §paragraph
    /章节|篇|卷|论|篇第|章/.test(c)  // 章节关键词
  if (!hasChapter) {
    reasons.push('缺少来源章节（应为·章节 / #段落号 / §段落号 / 章节关键词）')
  }

  return { valid: reasons.length === 0, reasons }
}

/**
 * 批量校验：对一组 citation 字符串做规则校验，返回所有非法项。
 */
export function validateCitations(
  citations: Array<string | null | undefined>,
): Array<{ index: number; citation: string; reasons: string[] }> {
  const invalids: Array<{ index: number; citation: string; reasons: string[] }> = []
  citations.forEach((c, idx) => {
    const r = validateCitation(c ?? undefined)
    if (!r.valid) {
      invalids.push({ index: idx, citation: c ?? '', reasons: r.reasons })
    }
  })
  return invalids
}
