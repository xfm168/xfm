// ══════════════════════════════════════════════════
//  六爻解卦 — 铜钱起卦算法 & 类型
// ══════════════════════════════════════════════════

import type { Hexagram } from './hexagram'

// ── Types ─────────────────────────────────────────

// 铜钱三枚，正面=3，反面=2，三枚之和
// 6=老阴(变)  7=少阳(不变)  8=少阴(不变)  9=老阳(变)
export type RawLine = '老阳' | '少阳' | '老阴' | '少阴'

// 最终展示用的阴阳性质（变爻取反后）
export type LinePolarity = '阳' | '阴'

export type DivinationCategory =
  | 'general'
  | 'career'
  | 'wealth'
  | 'love'
  | 'family'
  | 'study'
  | 'health'

export const CATEGORY_OPTIONS: { value: DivinationCategory; label: string }[] = [
  { value: 'general', label: '综合' },
  { value: 'career',  label: '事业' },
  { value: 'wealth',  label: '财运' },
  { value: 'love',    label: '感情' },
  { value: 'family',  label: '家庭' },
  { value: 'study',   label: '学业' },
  { value: 'health',  label: '健康' },
]

export interface Divination {
  id: string
  visitor_id: string
  question: string
  category: DivinationCategory
  hexagram_id: string
  hexagram_number: number
  changed_hexagram_id: string | null
  changed_hexagram_number: number | null
  raw_lines: RawLine[]          // index 0=初爻(底), 5=上爻(顶)
  changing_lines: number[]      // 变爻位置 1-6
  ai_analysis: string | null
  analysis_status: string
  created_at: string
}

export interface DivinationWithDetail extends Divination {
  hexagram: Hexagram
  changed_hexagram: Hexagram | null
}

// ── 八卦三爻映射 ──────────────────────────────────
// key: 三爻字符串（从下到上），阳=1，阴=0
// e.g. 下爻=阳,中爻=阳,上爻=阴 → '110' → 兑

const TRIGRAM_NUMBER: Record<string, number> = {
  '111': 1, // 乾
  '000': 2, // 坤
  '010': 3, // 坎
  '101': 4, // 离
  '100': 5, // 震
  '001': 6, // 艮
  '110': 7, // 兑
  '011': 8, // 巽
}

// 下卦 + 上卦 → 六十四卦序号
// 使用标准先天八卦顺序：乾1坤2坎3离4震5艮6兑7巽8
const HEXAGRAM_TABLE: number[][] = [
  // 上卦:  乾   坤   坎   离   震   艮   兑   巽
  /* 下乾 */ [1,  11,  5,  14,  34,  26,  43,  9],
  /* 下坤 */ [12,  2,  8,  35,  16,  23,  45, 20],
  /* 下坎 */ [6,   7, 29,  64,  40,  4,  47, 59],
  /* 下离 */ [13,  36, 63, 30,  55,  22,  49, 37],
  /* 下震 */ [25,  24, 3,  21,  51,  27,  17, 42],
  /* 下艮 */ [33,  15, 39, 56,  62,  52,  31, 53],
  /* 下兑 */ [10,  19, 60, 38,  54,  41,  58, 61],
  /* 下巽 */ [44,  46, 48, 50,  32,  18,  28, 57],
]

function trigramIndex(key: number): number {
  // TRIGRAM_NUMBER values 1-8 → array index 0-7
  return key - 1
}

// ── 核心算法 ──────────────────────────────────────

// 模拟三枚铜钱投掷：正面=3，反面=2，随机得出一爻
function throwCoins(): RawLine {
  const total = [0, 1, 2].reduce((sum) => sum + (Math.random() < 0.5 ? 3 : 2), 0)
  if (total === 6) return '老阴'
  if (total === 7) return '少阳'
  if (total === 8) return '少阴'
  return '老阳' // 9
}

// 由原始爻推导阴阳性质
export function rawToPolarity(raw: RawLine): LinePolarity {
  return raw === '老阳' || raw === '少阳' ? '阳' : '阴'
}

// 变爻取反
function changePolarity(p: LinePolarity): LinePolarity {
  return p === '阳' ? '阴' : '阳'
}

// 六爻数组 → 卦号
function linesToHexagramNumber(lines: LinePolarity[]): number {
  // lines[0]=初爻(底), lines[5]=上爻(顶)
  // 下卦=lines[0..2], 上卦=lines[3..5]
  const lowerKey = lines.slice(0, 3).map(p => p === '阳' ? '1' : '0').join('')
  const upperKey = lines.slice(3, 6).map(p => p === '阳' ? '1' : '0').join('')

  const lowerNum = TRIGRAM_NUMBER[lowerKey]
  const upperNum = TRIGRAM_NUMBER[upperKey]

  if (!lowerNum || !upperNum) return 1

  return HEXAGRAM_TABLE[trigramIndex(lowerNum)][trigramIndex(upperNum)]
}

export interface CastResult {
  rawLines: RawLine[]           // index 0=初爻(底)
  changingPositions: number[]   // 1-indexed 变爻位置
  hexagramNumber: number        // 本卦
  changedHexagramNumber: number | null  // 变卦（无变爻=null）
}

export function castHexagram(): CastResult {
  const rawLines: RawLine[] = Array.from({ length: 6 }, throwCoins)

  // 本卦
  const primaryLines = rawLines.map(rawToPolarity)
  const hexagramNumber = linesToHexagramNumber(primaryLines)

  // 变爻位置（1-indexed）
  const changingPositions = rawLines
    .map((r, i) => (r === '老阳' || r === '老阴' ? i + 1 : 0))
    .filter(Boolean)

  // 变卦
  let changedHexagramNumber: number | null = null
  if (changingPositions.length > 0) {
    const changedLines = primaryLines.map((p, i) =>
      changingPositions.includes(i + 1) ? changePolarity(p) : p
    )
    changedHexagramNumber = linesToHexagramNumber(changedLines)
    if (changedHexagramNumber === hexagramNumber) changedHexagramNumber = null
  }

  return { rawLines, changingPositions, hexagramNumber, changedHexagramNumber }
}

// ── 解卦文字 ─────────────────────────────────────

export function buildAnalysis(
  hexagram: Hexagram,
  changedHexagram: Hexagram | null,
  category: DivinationCategory,
  question: string
): string {
  const catMap: Record<DivinationCategory, keyof Pick<Hexagram, 'career'|'wealth'|'love'|'health'|'fortune'>> = {
    career:  'career',
    wealth:  'wealth',
    love:    'love',
    health:  'health',
    general: 'fortune',
    family:  'fortune',
    study:   'career',
  }
  const catText = hexagram[catMap[category]]
  const qPart = question.trim() ? `所问之事「${question.trim()}」，` : ''
  const changePart = changedHexagram
    ? `变卦为${changedHexagram.name}卦，${changedHexagram.fortune}趋势渐显，需留意变化。`
    : ''

  return `${qPart}本卦得${hexagram.name}卦。${hexagram.description}${catText}${changePart ? ' ' + changePart : ''}`
}
