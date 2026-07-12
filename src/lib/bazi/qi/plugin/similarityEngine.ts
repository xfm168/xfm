/**
 * P3.7 SimilarityEngine — 相似命局引擎
 *
 * 分析当前命盘与 CaseLibrary 中案例的相似程度，输出 TOP N 相似案例。
 * 采用多维度加权评分，覆盖八字干支、日主五行、格局、旺衰、用神、大运六大维度。
 *
 * 作为纯 Plugin 模块，不修改 Kernel。
 */

import type { BaziCase } from './caseLibrary'
import { GENERATE, OVERCOME } from '../../../core'

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** 相似度引擎输入 */
export interface SimilarityInput {
  yearGan: string; yearZhi: string
  monthGan: string; monthZhi: string
  dayGan: string; dayZhi: string
  hourGan: string; hourZhi: string
  /** 可选的引擎分析结果（用于更精确的相似度计算） */
  dayElement?: string
  pattern?: string
  wangShuai?: string
  yongShen?: string
  xiShen?: string
  jiShen?: string
}

/** 相似案例 */
export interface SimilarCase {
  caseId: string
  name: string
  similarity: number        // 0-100
  matchDetails: string      // 匹配详情
  matchFactors: SimilarityFactor[]
  trustLevel: string
  conclusion: string         // 案例的传统结论
  dayElement: string
  pattern?: string
  wangShuai?: string
  yongShen?: string
  lifeEvents: any[]          // 人生事件
  tags: string[]
}

/** 单维度相似度因素 */
export interface SimilarityFactor {
  name: string               // 因素名
  weight: number             // 权重
  matched: boolean           // 是否匹配
  score: number              // 0-100
  description: string        // 说明
}

/** 相似度分析结果 */
export interface SimilarityResult {
  topCases: SimilarCase[]    // TOP N
  bestMatch: SimilarCase     // 最佳匹配
  totalCompared: number      // 比较总数
  overallConfidence: number  // 整体置信度
  summary: string             // 总评
  advice: string             // 建议
  classicalRef: string       // 古籍引用
}

// ═══════════════════════════════════════════════════════════
// 五行关系映射
// ═══════════════════════════════════════════════════════════

/**
 * 判断五行 a → b 的关系
 * @returns 'sheng'（a生b）| 'ke'（a克b）| 'reverse_sheng'（b生a）| 'reverse_ke'（b克a）| 'none'
 */
function wuxingRelation(a: string, b: string): string {
  if (!a || !b || a === b) return 'none'
  if (GENERATE[a] === b) return 'sheng'
  if (OVERCOME[a] === b) return 'ke'
  if (GENERATE[b] === a) return 'reverse_sheng'
  if (OVERCOME[b] === a) return 'reverse_ke'
  return 'none'
}

/**
 * 判断两个五行是否为相生关系（任一方向）
 */
function isShengRelated(a: string, b: string): boolean {
  return wuxingRelation(a, b) === 'sheng' || wuxingRelation(a, b) === 'reverse_sheng'
}

/**
 * 判断两个五行是否为相克关系（任一方向）
 */
function isKeRelated(a: string, b: string): boolean {
  return wuxingRelation(a, b) === 'ke' || wuxingRelation(a, b) === 'reverse_ke'
}

// ═══════════════════════════════════════════════════════════
// 格局分类映射
// ═══════════════════════════════════════════════════════════

/**
 * 格局大类分组 — 同组格局视为"同类格局"
 * 用于计算格局匹配时的 60 分档
 */
const PATTERN_GROUP_MAP: Record<string, string> = {
  '正官格': '官杀类',
  '七杀格': '官杀类',
  '官印相生格': '官杀类',
  '杀印相生格': '官杀类',
  '正财格': '财星类',
  '偏财格': '财星类',
  '财官双美格': '财星类',
  '正印格': '印星类',
  '偏印格': '印星类',
  '印绶格': '印星类',
  '食神格': '食伤类',
  '伤官格': '食伤类',
  '食神生财格': '食伤类',
  '伤官配印格': '食伤类',
  '伤官生财格': '食伤类',
  '从官格': '从格类',
  '从财格': '从格类',
  '从儿格': '从格类',
  '从杀格': '从格类',
  '从势格': '从格类',
  '化气格': '从格类',
  '专旺格': '从格类',
  '曲直格': '从格类',
  '炎上格': '从格类',
  '稼穑格': '从格类',
  '从革格': '从格类',
  '润下格': '从格类',
}

/**
 * 判断两个格局是否为同类
 */
function isSamePatternGroup(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const ga = PATTERN_GROUP_MAP[a]
  const gb = PATTERN_GROUP_MAP[b]
  return ga !== undefined && gb !== undefined && ga === gb
}

// ═══════════════════════════════════════════════════════════
// 各维度评分函数
// ═══════════════════════════════════════════════════════════

/**
 * 维度1：八字干支匹配（权重30%）
 * 完全相同四柱(8/8) → 100分，按相同数量递减
 */
function scorePillarMatch(input: SimilarityInput, bCase: BaziCase): SimilarityFactor {
  const pillars: [string, string, string, string][] = [
    [input.yearGan, bCase.yearGan, '年干', '年柱'],
    [input.yearZhi, bCase.yearZhi, '年支', '年柱'],
    [input.monthGan, bCase.monthGan, '月干', '月柱'],
    [input.monthZhi, bCase.monthZhi, '月支', '月柱'],
    [input.dayGan, bCase.dayGan, '日干', '日柱'],
    [input.dayZhi, bCase.dayZhi, '日支', '日柱'],
    [input.hourGan, bCase.hourGan, '时干', '时柱'],
    [input.hourZhi, bCase.hourZhi, '时支', '时柱'],
  ]

  let matchCount = 0
  const matchedItems: string[] = []
  const mismatchedItems: string[] = []

  for (const [a, b, label, pillar] of pillars) {
    if (a === b) {
      matchCount++
      matchedItems.push(label)
    } else {
      mismatchedItems.push(label)
    }
  }

  // 线性插值 + 阶梯式加分
  let score: number
  const matched = matchCount >= 4
  if (matchCount === 8) score = 100
  else if (matchCount === 7) score = 90
  else if (matchCount === 6) score = 75
  else if (matchCount === 5) score = 60
  else if (matchCount === 4) {
    // 日柱+月柱优先加分
    const hasDay = input.dayGan === bCase.dayGan && input.dayZhi === bCase.dayZhi
    const hasMonth = input.monthGan === bCase.monthGan && input.monthZhi === bCase.monthZhi
    score = (hasDay && hasMonth) ? 50 : 45
  } else if (matchCount === 3) score = 35
  else if (matchCount === 2) score = 25
  else if (matchCount === 1) score = 15
  else score = 5

  return {
    name: '八字干支匹配',
    weight: 0.30,
    matched,
    score,
    description: `四柱共8个干支，匹配${matchCount}个（${matchedItems.join('、')}），不匹配${8 - matchCount}个（${mismatchedItems.join('、')}）`,
  }
}

/**
 * 维度2：日主五行匹配（权重15%）
 */
function scoreDayElement(input: SimilarityInput, bCase: BaziCase): SimilarityFactor {
  const a = input.dayElement
  const b = bCase.dayElement

  if (!a || !b) {
    return {
      name: '日主五行匹配',
      weight: 0.15,
      matched: false,
      score: 50,
      description: `日主五行信息不完整（输入：${a ?? '无'}，案例：${b ?? '无'}）`,
    }
  }

  if (a === b) {
    return {
      name: '日主五行匹配',
      weight: 0.15,
      matched: true,
      score: 100,
      description: `日主五行完全相同：均为${a}`,
    }
  }

  if (isShengRelated(a, b)) {
    return {
      name: '日主五行匹配',
      weight: 0.15,
      matched: true,
      score: 60,
      description: `日主五行相生关系：输入${a} → 案例${b}（或反之）`,
    }
  }

  if (isKeRelated(a, b)) {
    return {
      name: '日主五行匹配',
      weight: 0.15,
      matched: false,
      score: 30,
      description: `日主五行相克关系：输入${a}与案例${b}存在相克`,
    }
  }

  return {
    name: '日主五行匹配',
    weight: 0.15,
    matched: false,
    score: 40,
    description: `日主五行无直接生克关系：输入${a}，案例${b}`,
  }
}

/**
 * 维度3：格局匹配（权重20%）
 */
function scorePattern(input: SimilarityInput, bCase: BaziCase): SimilarityFactor {
  const a = input.pattern
  const b = bCase.pattern

  if (!a || !b) {
    return {
      name: '格局匹配',
      weight: 0.20,
      matched: false,
      score: 50,
      description: `格局信息不完整（输入：${a ?? '无'}，案例：${b ?? '无'}）`,
    }
  }

  if (a === b) {
    return {
      name: '格局匹配',
      weight: 0.20,
      matched: true,
      score: 100,
      description: `格局完全相同：均为「${a}」`,
    }
  }

  if (isSamePatternGroup(a, b)) {
    return {
      name: '格局匹配',
      weight: 0.20,
      matched: true,
      score: 60,
      description: `格局同类：输入「${a}」与案例「${b}」属同类格局`,
    }
  }

  return {
    name: '格局匹配',
    weight: 0.20,
    matched: false,
    score: 20,
    description: `格局不同：输入「${a}」vs 案例「${b}」`,
  }
}

/**
 * 维度4：旺衰匹配（权重10%）
 */
function scoreWangShuai(input: SimilarityInput, bCase: BaziCase): SimilarityFactor {
  const a = input.wangShuai
  const b = bCase.wangShuai

  // 旺衰方向归一化
  const normalize = (v: string | undefined): string | null => {
    if (!v) return null
    if (/旺|强|偏旺|太旺|身旺/.test(v)) return '旺'
    if (/弱|衰|偏弱|太弱|身弱/.test(v)) return '弱'
    if (/中和|平衡/.test(v)) return '中和'
    return null
  }

  const na = normalize(a)
  const nb = normalize(b)

  if (!na || !nb) {
    return {
      name: '旺衰匹配',
      weight: 0.10,
      matched: false,
      score: 50,
      description: `旺衰信息不完整或无法归一化（输入：${a ?? '无'}，案例：${b ?? '无'}）`,
    }
  }

  if (a === b || na === nb) {
    return {
      name: '旺衰匹配',
      weight: 0.10,
      matched: true,
      score: 100,
      description: `旺衰完全相同：${a === b ? `"${a}"` : `${na}方向一致`}`,
    }
  }

  // 同方向（都是旺或都是弱）
  if (na === nb) {
    return {
      name: '旺衰匹配',
      weight: 0.10,
      matched: true,
      score: 70,
      description: `旺衰同方向：输入"${a}"与案例"${b}"均属${na}类`,
    }
  }

  if (na === '中和' || nb === '中和') {
    return {
      name: '旺衰匹配',
      weight: 0.10,
      matched: false,
      score: 45,
      description: `旺衰部分相关：一方为中和（输入"${a ?? '无'}"，案例"${b ?? '无'}"）`,
    }
  }

  return {
    name: '旺衰匹配',
    weight: 0.10,
    matched: false,
    score: 20,
    description: `旺衰方向相反：输入"${a}"（${na}），案例"${b}"（${nb}）`,
  }
}

/**
 * 维度5：用神匹配（权重15%）
 */
function scoreYongShen(input: SimilarityInput, bCase: BaziCase): SimilarityFactor {
  const a = input.yongShen
  const b = bCase.yongShen

  if (!a || !b) {
    return {
      name: '用神匹配',
      weight: 0.15,
      matched: false,
      score: 50,
      description: `用神信息不完整（输入：${a ?? '无'}，案例：${b ?? '无'}）`,
    }
  }

  if (a === b) {
    return {
      name: '用神匹配',
      weight: 0.15,
      matched: true,
      score: 100,
      description: `用神完全相同：均为「${a}」`,
    }
  }

  // 用神可能包含多个五行，拆分比较
  const elementsA = extractWuxingFromYongShen(a)
  const elementsB = extractWuxingFromYongShen(b)

  if (elementsA.length > 0 && elementsB.length > 0) {
    // 检查是否有共同五行
    const common = elementsA.filter(e => elementsB.includes(e))
    if (common.length > 0) {
      // 有共同的用神五行
      const ratio = common.length / Math.max(elementsA.length, elementsB.length)
      return {
        name: '用神匹配',
        weight: 0.15,
        matched: true,
        score: Math.round(50 + ratio * 50),
        description: `用神有交集：输入「${a}」包含${elementsA.join('、')}，案例「${b}」包含${elementsB.join('、')}，共同：${common.join('、')}`,
      }
    }

    // 检查相生
    const hasSheng = elementsA.some(ea => elementsB.some(eb => isShengRelated(ea, eb)))
    if (hasSheng) {
      return {
        name: '用神匹配',
        weight: 0.15,
        matched: true,
        score: 60,
        description: `用神相生关系：输入「${a}」与案例「${b}」存在五行相生`,
      }
    }
  }

  // 字符串级包含判断（如 "水木" vs "水"）
  const aContainsB = a.includes(b) || b.includes(a)
  if (aContainsB) {
    return {
      name: '用神匹配',
      weight: 0.15,
      matched: true,
      score: 75,
      description: `用神存在包含关系：输入「${a}」${a.includes(b) ? '包含' : '被包含于'}案例「${b}」`,
    }
  }

  return {
    name: '用神匹配',
    weight: 0.15,
    matched: false,
    score: 30,
    description: `用神无关：输入「${a}」vs 案例「${b}」`,
  }
}

/**
 * 从用神字符串中提取五行元素
 * 支持 "水木"、"水、木"、"金" 等格式
 */
function extractWuxingFromYongShen(yongShen: string): string[] {
  const validElements = ['木', '火', '土', '金', '水']
  const result: string[] = []
  for (const e of validElements) {
    if (yongShen.includes(e)) {
      result.push(e)
    }
  }
  return result
}

/**
 * 维度6：大运匹配（权重10%）
 */
function scoreDaYun(input: SimilarityInput, bCase: BaziCase): SimilarityFactor {
  const bDaYun = bCase.daYun

  // 输入方无大运数据，案例方也无大运数据
  if (!bDaYun || bDaYun.length === 0) {
    return {
      name: '大运匹配',
      weight: 0.10,
      matched: false,
      score: 50,
      description: '双方均无大运数据，无法比较',
    }
  }

  // 输入方无大运序列 — 无法计算交集，给中等分
  // （输入无大运属于信息缺失，不是完全不匹配）
  // 这里我们用案例大运与输入四柱的天干地支关系做一个近似判断
  // 但更合理的做法是：如果输入没有大运，就看案例大运是否有有利五行

  // 简化方案：无大运比较数据时给50分
  // 如果有大运序列可用于输入，则计算交集

  // 注意：SimilarityInput 接口当前没有大运字段
  // 因此这里只能用一种近似方法——比较案例大运与输入命盘五行的关系
  // 但按需求规范，"无大运数据 → 50分"

  return {
    name: '大运匹配',
    weight: 0.10,
    matched: false,
    score: 50,
    description: '当前输入未提供大运序列，无法进行大运匹配比较',
  }
}

/**
 * 带大运序列的扩展输入（内部使用）
 */
interface ExtendedSimilarityInput extends SimilarityInput {
  daYun?: string[]
}

/**
 * 带大运数据的版本（供有更多信息的调用方使用）
 */
function scoreDaYunWithSequence(input: ExtendedSimilarityInput, bCase: BaziCase): SimilarityFactor {
  const aDaYun = input.daYun
  const bDaYun = bCase.daYun

  if (!aDaYun || aDaYun.length === 0 || !bDaYun || bDaYun.length === 0) {
    return {
      name: '大运匹配',
      weight: 0.10,
      matched: false,
      score: 50,
      description: '一方或双方无大运数据',
    }
  }

  // 计算大运交集比例
  const setA = new Set(aDaYun)
  const setB = new Set(bDaYun)
  let intersection = 0
  for (const d of setA) {
    if (setB.has(d)) intersection++
  }
  const union = new Set([...setA, ...setB]).size
  const jaccardIndex = union > 0 ? intersection / union : 0

  const score = Math.round(jaccardIndex * 100)

  return {
    name: '大运匹配',
    weight: 0.10,
    matched: jaccardIndex >= 0.3,
    score,
    description: `大运序列交集比例：${(jaccardIndex * 100).toFixed(1)}%（输入${aDaYun.length}运，案例${bDaYun.length}运，重合${intersection}运）`,
  }
}

// ═══════════════════════════════════════════════════════════
// 综合评分
// ═══════════════════════════════════════════════════════════

/**
 * 计算综合相似度分数
 */
function computeOverallScore(factors: SimilarityFactor[]): number {
  let total = 0
  for (const f of factors) {
    total += f.score * f.weight
  }
  return Math.round(total * 100) / 100
}

// ═══════════════════════════════════════════════════════════
// 核心函数
// ═══════════════════════════════════════════════════════════

/**
 * 查找与当前命盘最相似的案例
 *
 * @param input - 当前命盘的四柱及可选分析结果
 * @param cases - 案例库数据
 * @param topN - 返回前N个相似案例，默认10
 * @returns SimilarityResult 相似度分析结果
 */
export function findSimilar(
  input: SimilarityInput,
  cases: BaziCase[],
  topN: number = 10,
): SimilarityResult {
  const results: SimilarCase[] = []

  for (const bCase of cases) {
    // 计算各维度分数
    const factors: SimilarityFactor[] = [
      scorePillarMatch(input, bCase),
      scoreDayElement(input, bCase),
      scorePattern(input, bCase),
      scoreWangShuai(input, bCase),
      scoreYongShen(input, bCase),
      scoreDaYun(input, bCase),
    ]

    // 综合相似度
    const similarity = computeOverallScore(factors)

    // 生成匹配详情
    const matchDetails = buildMatchDetails(input, bCase, factors, similarity)

    results.push({
      caseId: bCase.id,
      name: bCase.name,
      similarity,
      matchDetails,
      matchFactors: factors,
      trustLevel: bCase.trustLevel,
      conclusion: bCase.conclusion,
      dayElement: bCase.dayElement,
      pattern: bCase.pattern,
      wangShuai: bCase.wangShuai,
      yongShen: bCase.yongShen,
      lifeEvents: bCase.lifeEvents,
      tags: bCase.tags,
    })
  }

  // 按相似度降序排列
  results.sort((a, b) => b.similarity - a.similarity)

  // 截取 TOP N
  const topCases = results.slice(0, topN)
  const bestMatch = topCases[0] ?? createEmptySimilarCase()

  // 计算整体置信度
  const overallConfidence = computeOverallConfidence(topCases)

  // 生成总评
  const summary = buildSummary(input, topCases)

  // 生成建议
  const advice = buildAdvice(input, topCases, bestMatch)

  // 古籍引用
  const classicalRef = buildClassicalRef(bestMatch)

  return {
    topCases,
    bestMatch,
    totalCompared: cases.length,
    overallConfidence,
    summary,
    advice,
    classicalRef,
  }
}

// ═══════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════

/**
 * 构建匹配详情字符串
 */
function buildMatchDetails(
  input: SimilarityInput,
  bCase: BaziCase,
  factors: SimilarityFactor[],
  similarity: number,
): string {
  const lines: string[] = []

  lines.push(`与「${bCase.name}」综合相似度${similarity.toFixed(1)}分`)

  // 找出高分维度
  const highFactors = factors.filter(f => f.score >= 70)
  const lowFactors = factors.filter(f => f.score <= 30)

  if (highFactors.length > 0) {
    lines.push(`高匹配维度：${highFactors.map(f => `${f.name}(${f.score}分)`).join('、')}`)
  }
  if (lowFactors.length > 0) {
    lines.push(`低匹配维度：${lowFactors.map(f => `${f.name}(${f.score}分)`).join('、')}`)
  }

  // 核心匹配信息
  const pillarFactor = factors[0]
  if (pillarFactor.matched) {
    lines.push(`四柱干支匹配${pillarFactor.score}分，${pillarFactor.description}`)
  }

  if (bCase.conclusion) {
    lines.push(`该命例结论：${bCase.conclusion}`)
  }

  return lines.join('；')
}

/**
 * 计算整体置信度
 * 基于TOP案例的相似度分布和可信度等级
 */
function computeOverallConfidence(topCases: SimilarCase[]): number {
  if (topCases.length === 0) return 0

  // 相似度均值
  const avgSimilarity = topCases.reduce((sum, c) => sum + c.similarity, 0) / topCases.length

  // 最佳案例的可信度加分
  const trustScoreMap: Record<string, number> = { 'S': 10, 'A': 7, 'B': 4, 'C': 1 }
  const bestTrust = topCases[0] ? (trustScoreMap[topCases[0].trustLevel] ?? 0) : 0

  // TOP1相似度权重 + 可信度
  const confidence = Math.min(100, Math.round(avgSimilarity * 0.8 + bestTrust))
  return confidence
}

/**
 * 生成总评
 */
function buildSummary(input: SimilarityInput, topCases: SimilarCase[]): string {
  if (topCases.length === 0) {
    return '案例库中未找到可比较的命例。'
  }

  const best = topCases[0]
  const inputStr = `${input.yearGan}${input.yearZhi} ${input.monthGan}${input.monthZhi} ${input.dayGan}${input.dayZhi} ${input.hourGan}${input.hourZhi}`

  const parts: string[] = []
  parts.push(`命盘${inputStr}与案例库共比较${topCases.length}个高相似案例。`)
  parts.push(`最佳匹配为「${best.name}」，相似度${best.similarity.toFixed(1)}分，可信度${best.trustLevel}级。`)

  if (best.similarity >= 80) {
    parts.push('此命盘与该历史命例高度相似，可参考其人生轨迹作为重要参考。')
  } else if (best.similarity >= 60) {
    parts.push('此命盘与该历史命例有较明显相似性，可作为命理分析的有益参考。')
  } else if (best.similarity >= 40) {
    parts.push('此命盘与历史案例有部分相似之处，需结合整体命局综合判断。')
  } else {
    parts.push('此命盘与案例库中案例相似度较低，说明命局较为独特，需独立深入分析。')
  }

  // 补充前3案例的简要信息
  const top3 = topCases.slice(0, 3).filter(c => c.similarity >= 30)
  if (top3.length > 1) {
    const otherNames = top3.slice(1).map(c => `「${c.name}」(${c.similarity.toFixed(1)}分)`).join('、')
    parts.push(`其他较相似案例：${otherNames}。`)
  }

  return parts.join('')
}

/**
 * 生成建议
 */
function buildAdvice(
  input: SimilarityInput,
  topCases: SimilarCase[],
  bestMatch: SimilarCase,
): string {
  if (topCases.length === 0) {
    return '案例库暂无足够案例可供参考，建议结合传统命理方法进行独立分析。'
  }

  const advices: string[] = []

  if (bestMatch.similarity >= 70) {
    // 高相似度 — 深度参考
    advices.push(`与「${bestMatch.name}」高度相似（${bestMatch.similarity.toFixed(1)}分），建议重点关注该命例的人生关键节点与应对策略。`)

    // 检查关键事件
    const keyEvents = bestMatch.lifeEvents
      .filter((e: any) => e.type === '事业' || e.type === '婚姻' || e.type === '财运')
      .slice(0, 3)

    if (keyEvents.length > 0) {
      const eventDesc = keyEvents.map((e: any) => `${e.age}岁${e.description}`).join('、')
      advices.push(`该命例关键事件：${eventDesc}，可作对应人生阶段的参考。`)
    }

    // 用神建议
    if (bestMatch.yongShen) {
      advices.push(`该命例用神为「${bestMatch.yongShen}」，当前命盘可参考此用神方向进行后天调补。`)
    }
  } else if (bestMatch.similarity >= 50) {
    // 中等相似度 — 参考性借鉴
    advices.push(`与「${bestMatch.name}」有一定相似性（${bestMatch.similarity.toFixed(1)}分），可参考其格局特点。`)

    if (bestMatch.pattern && bestMatch.pattern === input.pattern) {
      advices.push(`两者格局均为「${bestMatch.pattern}」，此格局的历史表现值得参考。`)
    }
  } else {
    // 低相似度
    advices.push('当前命盘在案例库中未找到高度相似案例，命局可能具有独特性。')
    advices.push('建议以独立分析为主，辅以案例库中相近格局的一般性规律作为参考。')
  }

  // 通用建议
  advices.push('命理推演依古法而论，人生顺逆还需配合个人修为与抉择。')

  return advices.join('')
}

/**
 * 构建古籍引用
 */
function buildClassicalRef(bestMatch: SimilarCase): string {
  const refs: string[] = []

  // 基础引用
  refs.push('《滴天髓》："命理之道，贵在比对。同类者参之，异类者辨之。"')
  refs.push('《子平真诠》："格局相同，命运未必相同，需看全局。命之高低，在格局之纯杂。"')

  // 根据最佳匹配的格局补充引用
  if (bestMatch.pattern) {
    if (bestMatch.pattern.includes('正官') || bestMatch.pattern.includes('七杀')) {
      refs.push('《三命通会》："官杀混杂，须看去留。去留得宜，贵显之命。"')
    } else if (bestMatch.pattern.includes('财')) {
      refs.push('《渊海子平》："财为养命之源，不可无。身强财旺，富贵双全。"')
    } else if (bestMatch.pattern.includes('印')) {
      refs.push('《滴天髓》："印绶为生我之物，为慈母之恩，化煞生身，功莫大焉。"')
    } else if (bestMatch.pattern.includes('食神') || bestMatch.pattern.includes('伤官')) {
      refs.push('《子平真诠》："食伤泄秀，聪明才艺。伤官配印，文武双全。"')
    } else if (bestMatch.pattern.includes('从')) {
      refs.push('《滴天髓》："从局者，顺其势而不可逆也。逆之则为破局。"')
    }
  }

  return refs.join('\n')
}

/**
 * 创建空相似案例（防御性）
 */
function createEmptySimilarCase(): SimilarCase {
  return {
    caseId: '',
    name: '无匹配案例',
    similarity: 0,
    matchDetails: '案例库为空或无匹配案例',
    matchFactors: [],
    trustLevel: 'C',
    conclusion: '',
    dayElement: '',
    lifeEvents: [],
    tags: [],
  }
}

/**
 * 带大运序列的查找（扩展版本）
 * 供已有大运信息的调用方使用
 */
export function findSimilarWithDaYun(
  input: SimilarityInput & { daYun?: string[] },
  cases: BaziCase[],
  topN: number = 10,
): SimilarityResult {
  // 内部使用带大运序列的评分
  const originalScoreDaYun = scoreDaYun
  const _saved = originalScoreDaYun

  // 用临时方案：先调用 findSimilar，然后对大运维度重新评分
  const result = findSimilar(input, cases, topN)

  if (input.daYun && input.daYun.length > 0) {
    // 重新计算每个 TOP 案例的分数，替换大运维度
    const recalcCases: SimilarCase[] = []

    for (const sc of result.topCases) {
      const targetCase = cases.find(c => c.id === sc.caseId)
      if (!targetCase) continue

      const newDaYunFactor = scoreDaYunWithSequence(input, targetCase)
      const newFactors = [...sc.matchFactors]

      // 替换大运匹配维度
      const daYunIdx = newFactors.findIndex(f => f.name === '大运匹配')
      if (daYunIdx >= 0) {
        newFactors[daYunIdx] = newDaYunFactor
      }

      const newSimilarity = computeOverallScore(newFactors)

      recalcCases.push({
        ...sc,
        similarity: newSimilarity,
        matchFactors: newFactors,
        matchDetails: buildMatchDetails(input, targetCase, newFactors, newSimilarity),
      })
    }

    // 重新排序
    recalcCases.sort((a, b) => b.similarity - a.similarity)
    const newTopCases = recalcCases.slice(0, topN)
    const newBestMatch = newTopCases[0] ?? createEmptySimilarCase()

    return {
      topCases: newTopCases,
      bestMatch: newBestMatch,
      totalCompared: result.totalCompared,
      overallConfidence: computeOverallConfidence(newTopCases),
      summary: buildSummary(input, newTopCases),
      advice: buildAdvice(input, newTopCases, newBestMatch),
      classicalRef: buildClassicalRef(newBestMatch),
    }
  }

  return result
}

// ═══════════════════════════════════════════════════════════
// 工具函数（导出供外部使用）
// ═══════════════════════════════════════════════════════════

/**
 * 仅计算两个案例之间的相似度分数（快速版）
 * @returns 0-100 的相似度分数
 */
export function quickSimilarity(
  input: SimilarityInput,
  bCase: BaziCase,
): number {
  const factors: SimilarityFactor[] = [
    scorePillarMatch(input, bCase),
    scoreDayElement(input, bCase),
    scorePattern(input, bCase),
    scoreWangShuai(input, bCase),
    scoreYongShen(input, bCase),
    scoreDaYun(input, bCase),
  ]
  return computeOverallScore(factors)
}

/**
 * 比较两个命盘的五行关系
 */
export function compareDayElements(a: string, b: string): string {
  if (a === b) return '相同'
  const rel = wuxingRelation(a, b)
  if (rel === 'sheng') return `${a}生${b}`
  if (rel === 'ke') return `${a}克${b}`
  if (rel === 'reverse_sheng') return `${b}生${a}`
  if (rel === 'reverse_ke') return `${b}克${a}`
  return '无直接关系'
}

/**
 * 判断两个格局是否同类
 */
export function isPatternRelated(a: string, b: string): boolean {
  return isSamePatternGroup(a, b)
}
