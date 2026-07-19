/**
 * 统一分析中心 (Analysis Center) — 玄风门 V4.4
 *
 * 所有模块必须通过此中心获取基础分析数据。
 * 禁止各模块重复计算日主、旺衰、格局、喜用神、调候、十神、神煞、合化、大运、五行力量等。
 *
 * 设计原则：
 * 1. 单一数据源：同一命盘的所有基础分析只计算一次
 * 2. 不可变结果：返回对象深冻结（Object.freeze），防止下游模块篡改
 * 3. 内置缓存：同一 birthData 哈希命盘共享同一份结果
 *
 * 典籍依据：《子平真诠》《滴天髓》《穷通宝鉴》《三命通会》《渊海子平》
 */

import { logger } from '../../utils/logger'
import { calculateBaZiFromBirthData } from './calculator'
import type { BaZiChart, FiveElement, GanZhi, SixLines } from './types'
import { determineGeJu, type GeJuResult } from './geju'
import { determineXiYongShen, type XiYongShenResult } from './xiyongshen'
import { calculateTiaoHou, type TiaoHouResult } from './tiaohou'
import { analyzeShenShi, type ShenShiAnalysisResult } from './shishenAnalysis'
import { calculateShenSha, type ShenShaCategory } from './shensha'
import { analyzeCombinations, type CombinationResult } from './combinationEngine'
import { analyzeDaYun, type DaYunAnalysisResult } from './dayunAnalysis'
import { calculateFiveElementPower, type FiveElementPowerResult } from './fiveElementPower'
import type { BirthData } from '@/lib/core'

const acLogger = logger.child('AnalysisCenter')

// ========== 类型定义 ==========

/** 日主旺衰摘要 */
export interface DayMasterSummary {
  element: string
  strength: 'strong' | 'weak' | 'balanced'
  strengthScore: number
  description: string
}

/** 格局摘要 */
export interface GeJuSummary {
  name: string
  category: string
  confidence: number
  purity: number
  broken: boolean
  description: string
}

/** 喜用神摘要 */
export interface XiYongShenSummary {
  bestElement: string
  happiness: string[]
  avoidedElements: string[]
  description: string
}

/** 调候摘要 */
export interface TiaoHouSummary {
  element: string
  priority: number
  isDominant: boolean
  description: string
}

/** 十神摘要 */
export interface ShiShenSummary {
  dominant: string
  distribution: Record<string, number>
  description: string
}

/** 神煞摘要 */
export interface ShenShaSummary {
  list: Array<{ name: string; position: string; isAuspicious: boolean }>
  description: string
}

/** 合化摘要 */
export interface CombinationSummary {
  keyCombos: string[]
  impactScore: number
  description: string
}

/** 大运摘要 */
export interface DaYunSummary {
  current: { ganZhi: string; isXi: boolean; age: number }
  upcoming: Array<{ ganZhi: string; isXi: boolean; age: number }>
}

/** 五行摘要 */
export interface FiveElementSummary {
  count: Record<string, number>
  dominant: string
  weakest: string
  isBalanced: boolean
}

/**
 * 统一分析数据
 *
 * 包含两类字段：
 * - 摘要字段（dayMaster/geJu/...）：人类可读的统一数据来源，供所有模块读取
 * - raw 字段：完整原始分析结果，供模块适配器（moduleAdapter）转换为各模块输入，
 *   避免重复调用底层分析函数
 */
export interface UnifiedAnalysisData {
  // 基础数据
  chart: BaZiChart
  /** 原始出生数据（适配器需用到 birthDate/gender/years 等） */
  birthData: BirthData

  // 统一计算结果（只计算一次）
  dayMaster: DayMasterSummary
  geJu: GeJuSummary
  xiYongShen: XiYongShenSummary
  tiaoHou: TiaoHouSummary
  shiShen: ShiShenSummary
  shenSha: ShenShaSummary
  combinations: CombinationSummary
  daYun: DaYunSummary
  fiveElement: FiveElementSummary

  /**
   * 完整原始分析结果。
   * 各分析模块（事业/婚姻/财富/健康/流年等）需要完整的结构化对象，
   * 这里集中保存，模块适配器据此转换，确保“只计算一次、数据同源”。
   */
  raw: {
    geJu: GeJuResult
    xiYongShen: XiYongShenResult
    tiaoHou: TiaoHouResult
    shiShen: ShenShiAnalysisResult
    fiveElementPower: FiveElementPowerResult
    combinations: CombinationResult
    shenSha: ShenShaCategory[]
    daYun: DaYunAnalysisResult | undefined
  }
}

// ========== 缓存 ==========

/** 命盘级缓存：同一 birthData 哈希只计算一次 */
const analysisCache = new Map<string, UnifiedAnalysisData>()

/**
 * 获取缓存键（同一命盘只计算一次）
 * key = 出生年月日时 + 性别 + 时区/地点/真太阳时等排盘相关参数
 */
export function getAnalysisCacheKey(birthData: BirthData): string {
  return [
    birthData.birthday,
    birthData.birthTime,
    birthData.gender,
    birthData.timezone ?? '',
    birthData.location ?? '',
    birthData.longitude ?? '',
    birthData.latitude ?? '',
    birthData.calendarType ?? '',
    birthData.useTrueSolarTime ? 'T' : 'F',
    birthData.childHourStrategy ?? '',
    birthData.birthTimeUnknown ? 'U' : 'K',
  ].join('|')
}

// ========== 内部辅助 ==========

/** 由旺衰等级与分数推导 strong/weak/balanced */
function deriveStrength(level: string, score: number): 'strong' | 'weak' | 'balanced' {
  if (level.includes('旺')) return 'strong'
  if (level.includes('弱')) return 'weak'
  if (score >= 55) return 'strong'
  if (score <= 45) return 'weak'
  return 'balanced'
}

/** 深度冻结对象（含嵌套对象与数组），防止下游模块修改统一数据 */
function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value
  }
  // 跳过不应/不必深冻的内置类型
  if (value instanceof Date || value instanceof RegExp || value instanceof Map || value instanceof Set) {
    return value
  }
  if (Array.isArray(value)) {
    for (const item of value) deepFreeze(item)
  } else {
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v)
  }
  return Object.freeze(value)
}

/** 将大运步骤转换为摘要 */
function summarizeDaYunStep(step: {
  ganZhi: GanZhi
  startAge: number
  isXi: boolean
}): { ganZhi: string; isXi: boolean; age: number } {
  return {
    ganZhi: `${step.ganZhi.gan}${step.ganZhi.zhi}`,
    isXi: step.isXi,
    age: step.startAge,
  }
}

// ========== 核心函数 ==========

/**
 * 统一计算所有基础数据，返回不可变结果。
 *
 * 内部按顺序调用：
 * 1. calculateBaZiFromBirthData → chart
 * 2. determineGeJu → geJu
 * 3. determineXiYongShen → xiYongShen
 * 4. calculateTiaoHou → tiaoHou
 * 5. analyzeShenShi → shiShen
 * 6. calculateShenSha → shenSha
 * 7. analyzeCombinations → combinations
 * 8. analyzeDaYun → daYun
 * 9. calculateFiveElementPower → fiveElement
 */
export function createAnalysisCenter(birthData: BirthData): UnifiedAnalysisData {
  acLogger.debug('开始统一分析', `${birthData.birthday} ${birthData.birthTime} ${birthData.gender}`)

  // 1. 排盘
  const chart: BaZiChart = calculateBaZiFromBirthData(birthData)
  const sixLines: SixLines = chart.sixLines
  const dayGan = chart.dayMaster.dayGan
  const gender = birthData.gender

  // 2. 格局判断
  const geJu: GeJuResult = determineGeJu(
    sixLines,
    chart.dayMaster.relatedShens as unknown as Record<string, any>,
    chart.dayMaster.strengthScore,
    dayGan,
    sixLines.month.zhi,
    chart.fiveElementCount as unknown as Record<FiveElement, number>,
  )

  // 3. 喜用神判定
  const xiYongShen: XiYongShenResult = determineXiYongShen(
    chart.dayMaster.strengthScore,
    chart.dayMaster.wangShuai,
    geJu.name as any,
    chart.dayMaster.dayGanElement,
  )

  // 4. 调候用神
  const tiaoHou: TiaoHouResult = calculateTiaoHou(chart)

  // 5. 十神分析
  const shiShen: ShenShiAnalysisResult = analyzeShenShi(sixLines, dayGan, gender)

  // 6. 神煞
  const shenSha: ShenShaCategory[] = calculateShenSha(sixLines, dayGan, gender)

  // 7. 合化组合
  const combinations: CombinationResult = analyzeCombinations(chart)

  // 8. 大运推演（可能因日期解析失败而不可用）
  let daYun: DaYunAnalysisResult | undefined
  try {
    const birthDate = new Date(birthData.birthday)
    const xiElements: FiveElement[] = [
      xiYongShen.firstHappy,
      xiYongShen.secondHappy,
      xiYongShen.thirdHappy,
    ].filter(Boolean) as FiveElement[]
    const jiElements: FiveElement[] = xiYongShen.avoidedElements
    daYun = analyzeDaYun(sixLines, birthDate, dayGan, gender, xiElements, jiElements)
  } catch (err: any) {
    acLogger.warn('大运推演失败，统一数据中大运将为空', err?.message)
    daYun = undefined
  }

  // 9. 五行力量
  const fiveElementPower: FiveElementPowerResult = calculateFiveElementPower(sixLines, dayGan)

  // ---------- 构建摘要 ----------

  const wangLevel = fiveElementPower.wangShuaiLevel
  const strength = deriveStrength(wangLevel, chart.dayMaster.strengthScore)

  const dayMaster: DayMasterSummary = {
    element: String(chart.dayMaster.dayGanElement),
    strength,
    strengthScore: chart.dayMaster.strengthScore,
    description:
      `日主${dayGan}（${chart.dayMaster.dayGanElement}），${wangLevel}，` +
      `${strength === 'strong' ? '身旺喜克泄' : strength === 'weak' ? '身弱喜生扶' : '中和平衡'}之命。`,
  }

  const geJuSummary: GeJuSummary = {
    name: String(geJu.name),
    category: String(geJu.category),
    confidence: geJu.confidence,
    purity: geJu.score,
    broken: geJu.poGe,
    description: geJu.description,
  }

  const xiYongSummary: XiYongShenSummary = {
    bestElement: String(xiYongShen.bestElement),
    happiness: [
      xiYongShen.firstHappy,
      xiYongShen.secondHappy,
      xiYongShen.thirdHappy,
    ].filter(Boolean) as string[],
    avoidedElements: xiYongShen.avoidedElements.map(String),
    description: xiYongShen.description,
  }

  const tiaoHouSummary: TiaoHouSummary = {
    element: String(tiaoHou.tiaoHouElement),
    priority: tiaoHou.priority,
    isDominant: tiaoHou.isTiaoHouDominant,
    description: tiaoHou.description,
  }

  const distribution: Record<string, number> = {}
  for (const d of shiShen.details) {
    distribution[d.name] = d.power
  }
  const shiShenSummary: ShiShenSummary = {
    dominant: String(shiShen.dominantShenShi[0] ?? shiShen.sortedByPower[0] ?? ''),
    distribution,
    description: shiShen.personality,
  }

  const shenShaList = shenSha.flatMap(cat =>
    cat.items.map(item => ({
      name: item.name,
      position: item.position,
      isAuspicious: cat.name !== '凶煞',
    })),
  )
  const shenShaSummary: ShenShaSummary = {
    list: shenShaList,
    description: shenShaList.length
      ? `命带${shenShaList.map(s => s.name).join('、')}等神煞`
      : '命局神煞平平，无显著吉凶神煞',
  }

  const combinationSummary: CombinationSummary = {
    keyCombos: combinations.keyCombinations,
    impactScore: combinations.impactScore,
    description: combinations.description,
  }

  const dySteps = daYun?.steps ?? []
  const curIdx = daYun?.currentStepIndex ?? -1
  const currentStep = curIdx >= 0 && curIdx < dySteps.length ? dySteps[curIdx] : undefined
  const daYunSummary: DaYunSummary = {
    current: currentStep
      ? summarizeDaYunStep(currentStep)
      : { ganZhi: '', isXi: false, age: 0 },
    upcoming: dySteps.slice(curIdx + 1, curIdx + 6).map(summarizeDaYunStep),
  }

  const feCount: Record<string, number> = { ...chart.fiveElementCount }
  const feVals = Object.values(chart.fiveElementCount) as number[]
  const feMax = Math.max(...feVals)
  const feMin = Math.min(...feVals)
  const feBalance = feMax > 0 ? feMin / feMax : 0
  const fiveElementSummary: FiveElementSummary = {
    count: feCount,
    dominant: String(fiveElementPower.dominant),
    weakest: String(fiveElementPower.weakest),
    isBalanced: wangLevel === '中和' || feBalance > 0.5,
  }

  const data: UnifiedAnalysisData = {
    chart,
    birthData,
    dayMaster,
    geJu: geJuSummary,
    xiYongShen: xiYongSummary,
    tiaoHou: tiaoHouSummary,
    shiShen: shiShenSummary,
    shenSha: shenShaSummary,
    combinations: combinationSummary,
    daYun: daYunSummary,
    fiveElement: fiveElementSummary,
    raw: {
      geJu,
      xiYongShen,
      tiaoHou,
      shiShen,
      fiveElementPower,
      combinations,
      shenSha,
      daYun,
    },
  }

  acLogger.debug('统一分析完成', `格局:${geJuSummary.name} 用神:${xiYongSummary.bestElement}`)

  // 深冻结，防止下游模块篡改统一数据
  return deepFreeze(data)
}

/**
 * 带缓存的获取函数。
 * 同一 birthData 哈希只计算一次，后续直接返回缓存的不可变结果。
 */
export function getAnalysis(birthData: BirthData): UnifiedAnalysisData {
  const key = getAnalysisCacheKey(birthData)
  const cached = analysisCache.get(key)
  if (cached) {
    return cached
  }
  const result = createAnalysisCenter(birthData)
  analysisCache.set(key, result)
  return result
}

/** 清空分析缓存（测试/调试图使用） */
export function clearAnalysisCache(): void {
  analysisCache.clear()
}

export default getAnalysis
