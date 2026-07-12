/**
 * WCAG 色彩对比度工具
 *
 * 提供颜色格式转换、相对亮度计算、对比度比率计算，以及 AA/AAA 等级判定。
 * PROJECT_COLORS 列出项目主要前景/背景色对及其对比度评估结果。
 *
 * 对比度算法遵循 WCAG 2.1：
 * https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

/** RGB 颜色 */
export interface Rgb {
  /** 红色通道（0-255） */
  r: number
  /** 绿色通道（0-255） */
  g: number
  /** 蓝色通道（0-255） */
  b: number
}

/** 颜色对及其对比度评估 */
export interface ColorPair {
  /** 颜色对名称 */
  name: string
  /** 前景色（#hex） */
  foreground: string
  /** 背景色（#hex） */
  background: string
  /** 对比度比率（如 12.5） */
  ratio: number
  /** 是否满足 AA（普通文本） */
  meetsAA: boolean
  /** 是否满足 AA（大号文本） */
  meetsAALarge: boolean
  /** 是否满足 AAA（普通文本） */
  meetsAAA: boolean
}

/** AA 标准：普通文本最小对比度 */
const AA_NORMAL: number = 4.5
/** AA 标准：大号文本最小对比度（18pt 或 14pt 粗体） */
const AA_LARGE: number = 3
/** AAA 标准：普通文本最小对比度 */
const AAA_NORMAL: number = 7
/** AAA 标准：大号文本最小对比度 */
const AAA_LARGE: number = 4.5

/**
 * 将十六进制颜色转换为 RGB
 *
 * 支持 #rgb、#rrggbb、#rrggbbaa 格式（忽略 alpha）。
 *
 * @param hex - 十六进制颜色字符串
 * @returns RGB 对象，非法输入返回 { r: 0, g: 0, b: 0 }
 */
export function hexToRgb(hex: string): Rgb {
  if (typeof hex !== 'string' || hex.trim() === '') {
    return { r: 0, g: 0, b: 0 }
  }
  let h = hex.trim()
  if (h.charAt(0) === '#') {
    h = h.substring(1)
  }
  // #rgb -> #rrggbb
  if (h.length === 3) {
    h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2)
  }
  // 截断 alpha
  if (h.length > 6) {
    h = h.substring(0, 6)
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    return { r: 0, g: 0, b: 0 }
  }
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return { r: r, g: g, b: b }
}

/**
 * 计算相对亮度（WCAG 2.1）
 *
 * @param rgb - RGB 颜色对象
 * @returns 相对亮度（0-1）
 */
export function relativeLuminance(rgb: Rgb): number {
  function channel(c: number): number {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const r = channel(rgb.r)
  const g = channel(rgb.g)
  const b = channel(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * 计算两个颜色之间的对比度比率
 *
 * @param color1 - 颜色 1（#hex）
 * @param color2 - 颜色 2（#hex）
 * @returns 对比度比率（1-21）
 */
export function contrastRatio(color1: string, color2: string): number {
  const l1 = relativeLuminance(hexToRgb(color1))
  const l2 = relativeLuminance(hexToRgb(color2))
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * 判断对比度是否满足 WCAG AA 标准
 *
 * @param ratio - 对比度比率
 * @param isLargeText - 是否为大号文本（18pt+ 或 14pt 粗体+）
 */
export function meetsAA(ratio: number, isLargeText: boolean): boolean {
  return ratio >= (isLargeText ? AA_LARGE : AA_NORMAL)
}

/**
 * 判断对比度是否满足 WCAG AAA 标准
 *
 * @param ratio - 对比度比率
 * @param isLargeText - 是否为大号文本
 */
export function meetsAAA(ratio: number, isLargeText: boolean): boolean {
  return ratio >= (isLargeText ? AAA_LARGE : AAA_NORMAL)
}

/** 评估单个颜色对 */
function evaluatePair(name: string, fg: string, bg: string): ColorPair {
  const ratio = contrastRatio(fg, bg)
  return {
    name: name,
    foreground: fg,
    background: bg,
    ratio: Math.round(ratio * 100) / 100,
    meetsAA: meetsAA(ratio, false),
    meetsAALarge: meetsAA(ratio, true),
    meetsAAA: meetsAAA(ratio, false)
  }
}

/**
 * 项目主要颜色对及其对比度
 *
 * 取自 src/design/colors.ts 的设计令牌，覆盖主背景与各类文字、
 * 品牌色、状态色的组合，便于快速排查对比度不达标的组合。
 */
export const PROJECT_COLORS: ColorPair[] = [
  evaluatePair('主背景 / 主文字（米白）', '#F5F1E8', '#071629'),
  evaluatePair('主背景 / 次级文字', '#B8C4D6', '#071629'),
  evaluatePair('主背景 / 弱化文字', '#6B7D94', '#071629'),
  evaluatePair('主背景 / 品牌金', '#D4AF37', '#071629'),
  evaluatePair('主背景 / 金色浅', '#F0E0A8', '#071629'),
  evaluatePair('次级背景 / 主文字', '#F5F1E8', '#0B1F3B'),
  evaluatePair('次级背景 / 次级文字', '#B8C4D6', '#0B1F3B'),
  evaluatePair('第三级背景 / 主文字', '#F5F1E8', '#112845'),
  evaluatePair('品牌金 / 主背景（深色文字在金上）', '#071629', '#D4AF37'),
  evaluatePair('金色浅 / 主背景', '#071629', '#F0E0A8'),
  evaluatePair('主背景 / 成功色', '#6B9E7A', '#071629'),
  evaluatePair('主背景 / 警告色', '#C4A24A', '#071629'),
  evaluatePair('主背景 / 错误色', '#C46060', '#071629'),
  evaluatePair('主背景 / 金色高光', '#E8C56A', '#071629')
]
