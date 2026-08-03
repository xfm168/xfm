// 引用 ID 体系 —— 每条古籍引用统一编号
// 格式：CLASSIC_ID-CHAPTER-SECTION-PARAGRAPH-LINE
// 例如：DTS-03-02-015 (滴天髓 第3章 第2节 第15段)

// ============================================================
// 古籍代号 —— 8 部核心命理经典
// ============================================================

/**
 * 古籍代号
 *
 * - DTS   滴天髓
 * - QTB   穷通宝鉴
 * - ZYQ   子平真诠
 * - ZPZQ  子平真诠（备选代号）
 * - YSX   渊海子平
 * - QBJ   三命通会（Q=三命 B=通 J=会，避免与 QTB 冲突）
 * - SBJ   神峰通考
 * - HYD   珞琭子赋
 * - unknown 未知典籍
 */
export type ClassicCode =
  | 'DTS'
  | 'QTB'
  | 'ZYQ'
  | 'ZPZQ'
  | 'YSX'
  | 'QBJ'
  | 'SBJ'
  | 'HYD'
  | 'unknown'

/**
 * 引用 ID 字符串
 *
 * 格式：CODE-CC-SS-PPP[-LLL]
 *   - CODE   3 字母古籍代号
 *   - CC     2 位章号
 *   - SS     2 位节号
 *   - PPP    3 位段号
 *   - LLL    可选 3 位行号
 *
 * 示例：
 *   - DTS-03-02-015      滴天髓 第3章 第2节 第15段
 *   - DTS-03-02-015-007  滴天髓 第3章 第2节 第15段 第7行
 */
export type CitationID = string

/**
 * 引用参考
 *
 * 一条古籍原文引用的完整结构化记录。
 */
export interface CitationRef {
  /** 引用 ID（由 formatCitationID 生成） */
  citationId: CitationID
  /** 古籍代号 */
  classicCode: ClassicCode
  /** 古籍名称（如 '滴天髓'） */
  classicName: string
  /** 章号 */
  chapter: number
  /** 节号 */
  section: number
  /** 段号 */
  paragraph: number
  /** 行号（可选） */
  line?: number
  /** 原文 */
  originalText: string
  /** 译文（可选） */
  translation?: string
  /** 诠释 / 注解（可选） */
  interpretation?: string
}

// ============================================================
// 古籍代号映射表
// ============================================================

/**
 * 古籍代号 → 全称 映射
 */
export const CLASSIC_CODE_MAP: Record<ClassicCode, string> = {
  DTS: '滴天髓',
  QTB: '穷通宝鉴',
  ZYQ: '子平真诠',
  ZPZQ: '子平真诠',
  YSX: '渊海子平',
  QBJ: '三命通会',
  SBJ: '神峰通考',
  HYD: '珞琭子赋',
  unknown: '未知典籍',
}

/**
 * 全称 / 关键词 → 古籍代号 反向映射
 *
 * 包含全称、简称、别名等关键词，用于 fuzzy 匹配。
 */
export const REVERSE_CLASSIC_MAP: Record<string, ClassicCode> = {
  // 滴天髓
  滴天髓: 'DTS',
  滴天: 'DTS',
  DTS: 'DTS',
  dts: 'DTS',
  // 穷通宝鉴
  穷通宝鉴: 'QTB',
  穷通: 'QTB',
  QTB: 'QTB',
  qtb: 'QTB',
  // 子平真诠
  子平真诠: 'ZYQ',
  真诠: 'ZYQ',
  ZYQ: 'ZYQ',
  zyq: 'ZYQ',
  ZPZQ: 'ZPZQ',
  zpzq: 'ZPZQ',
  // 渊海子平
  渊海子平: 'YSX',
  渊海: 'YSX',
  YSX: 'YSX',
  ysx: 'YSX',
  // 三命通会
  三命通会: 'QBJ',
  三命: 'QBJ',
  QBJ: 'QBJ',
  qbj: 'QBJ',
  // 神峰通考
  神峰通考: 'SBJ',
  神峰: 'SBJ',
  SBJ: 'SBJ',
  sbj: 'SBJ',
  // 珞琭子赋
  珞琭子赋: 'HYD',
  珞琭: 'HYD',
  HYD: 'HYD',
  hyd: 'HYD',
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 生成引用 ID
 *
 * @param code      古籍代号
 * @param chapter   章号
 * @param section   节号
 * @param paragraph 段号
 * @param line      行号（可选）
 * @returns 形如 "DTS-03-02-015" 或 "DTS-03-02-015-007"
 */
export function formatCitationID(
  code: ClassicCode,
  chapter: number,
  section: number,
  paragraph: number,
  line?: number,
): CitationID {
  const cc = String(chapter).padStart(2, '0')
  const ss = String(section).padStart(2, '0')
  const pp = String(paragraph).padStart(3, '0')
  const base = `${code}-${cc}-${ss}-${pp}`
  if (line == null) return base
  const ll = String(line).padStart(3, '0')
  return `${base}-${ll}`
}

/**
 * 解析引用 ID
 *
 * @param id 形如 "DTS-03-02-015" 或 "DTS-03-02-015-007"
 * @returns 解析后的字段；解析失败时 classicCode 为 'unknown'
 */
export function parseCitationID(
  id: CitationID,
): {
  classicCode: ClassicCode
  chapter: number
  section: number
  paragraph: number
  line?: number
} {
  const parts = id.split('-')
  // 至少要有 CODE-CC-SS-PPP 四段
  if (parts.length < 4) {
    return {
      classicCode: 'unknown',
      chapter: 0,
      section: 0,
      paragraph: 0,
    }
  }
  const codePart = parts[0] as ClassicCode
  const classicCode: ClassicCode = (CLASSIC_CODE_MAP[codePart] != null)
    ? codePart
    : 'unknown'
  const chapter = Number.parseInt(parts[1], 10) || 0
  const section = Number.parseInt(parts[2], 10) || 0
  const paragraph = Number.parseInt(parts[3], 10) || 0
  const result: {
    classicCode: ClassicCode
    chapter: number
    section: number
    paragraph: number
    line?: number
  } = { classicCode, chapter, section, paragraph }
  if (parts.length >= 5) {
    const line = Number.parseInt(parts[4], 10)
    if (!Number.isNaN(line)) result.line = line
  }
  return result
}

/**
 * 校验引用 ID 是否合法
 *
 * 合法格式：CODE-CC-SS-PPP[-LLL]
 *   - CODE 必须是已知古籍代号
 *   - CC / SS / PPP 为数字
 */
export function isValidCitationID(id: string): boolean {
  if (typeof id !== 'string' || id.length === 0) return false
  const parts = id.split('-')
  if (parts.length < 4 || parts.length > 5) return false
  const [code, cc, ss, pp, ll] = parts
  // 古籍代号必须已知
  if (!(code in CLASSIC_CODE_MAP)) return false
  if (code === 'unknown') return false
  // 章节段必须为数字
  if (!/^\d{2}$/.test(cc)) return false
  if (!/^\d{2}$/.test(ss)) return false
  if (!/^\d{3}$/.test(pp)) return false
  if (ll != null && !/^\d{3}$/.test(ll)) return false
  return true
}

/**
 * 根据名称模糊匹配古籍代号
 *
 * 匹配优先级：
 *   1. 完全匹配（精确等于反向映射 key）
 *   2. 包含匹配（name 包含某个 key）
 *   3. 默认 'unknown'
 *
 * @param name 古籍名称 / 关键词
 */
export function resolveClassicCode(name: string): ClassicCode {
  if (!name || typeof name !== 'string') return 'unknown'
  // 1. 精确匹配
  if (REVERSE_CLASSIC_MAP[name]) return REVERSE_CLASSIC_MAP[name]
  // 2. 包含匹配（优先匹配较长的 key，避免 '子平' 误中 '渊海子平'）
  const keys = Object.keys(REVERSE_CLASSIC_MAP).sort((a, b) => b.length - a.length)
  for (const k of keys) {
    if (name.includes(k)) return REVERSE_CLASSIC_MAP[k]
  }
  return 'unknown'
}
