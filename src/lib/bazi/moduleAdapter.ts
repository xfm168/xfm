/**
 * 模块适配器 (Module Adapter) — 玄风门 V4.4
 *
 * 为现有各分析模块提供统一数据接入。
 * 各模块不再自行计算日主/旺衰/格局/喜用神/调候/十神/五行力量等，
 * 而是从此适配器获取由统一分析中心（analysisCenter）产出的同源数据。
 *
 * 设计要点：
 * - 适配器仅做“数据格式转换”，不包含命理计算逻辑
 * - 输入恒为 UnifiedAnalysisData（单一数据源）
 * - 部分模块依赖运行期才确定的产物（如流年 liuNian、年限 years），
 *   通过可选的 AdapterContext 注入，不破坏 (data) 单参调用约定
 */

import type { UnifiedAnalysisData } from './analysisCenter'
import type {
  DayMasterSummary,
  GeJuSummary,
  XiYongShenSummary,
  TiaoHouSummary,
  ShiShenSummary,
  ShenShaSummary,
  CombinationSummary,
  DaYunSummary,
  FiveElementSummary,
} from './analysisCenter'
import type { BaZiChart, SixLines, HeavenlyStem } from './types'
import type { GeJuResult } from './geju'
import type { XiYongShenResult } from './xiyongshen'
import type { ShenShiAnalysisResult } from './shishenAnalysis'
import type { FiveElementPowerResult } from './fiveElementPower'
import type { LiuNianAnalysisResult } from './liunianAnalysis'
import type { DaYunAnalysisResult } from './dayunAnalysis'
import type { BirthData } from '@/lib/core'

// ========== 运行期上下文 ==========

/**
 * 适配器运行期上下文（可选）。
 * 用于注入统一分析中心不负责、但部分模块需要的运行期产物。
 */
export interface AdapterContext {
  /** 流年推演结果（由 Pipeline 在大运之后计算并注入） */
  liuNian?: LiuNianAnalysisResult
  /** 推演年限 */
  years?: number
}

// ========== 各模块输入类型 ==========

/** 事业分析输入（对应 analyzeCareer 入参） */
export interface CareerAnalysisInput {
  sixLines: SixLines
  dayGan: HeavenlyStem
  gender: string
  shenShiAnalysis: ShenShiAnalysisResult
  geJu: GeJuResult
  fiveElementPower: FiveElementPowerResult
}

/** 婚姻分析输入（对应 analyzeMarriage 入参） */
export interface MarriageAnalysisInput {
  sixLines: SixLines
  dayGan: HeavenlyStem
  gender: string
}

/** 财富分析输入（对应 analyzeWealth 入参） */
export interface WealthAnalysisInput {
  sixLines: SixLines
  dayGan: HeavenlyStem
  shenShiAnalysis: ShenShiAnalysisResult
  liuNian: LiuNianAnalysisResult | undefined
  geJu: GeJuResult
}

/** 健康分析输入（对应 analyzeHealth 入参） */
export interface HealthAnalysisInput {
  sixLines: SixLines
  dayGan: HeavenlyStem
  fiveElementPower: FiveElementPowerResult
}

/** AI 问答输入 */
export interface AskMasterInput {
  chart: BaZiChart
  birthData: BirthData
  dayMaster: DayMasterSummary
  geJu: GeJuSummary
  xiYongShen: XiYongShenSummary
  tiaoHou: TiaoHouSummary
  shiShen: ShiShenSummary
  shenSha: ShenShaSummary
  combinations: CombinationSummary
  daYun: DaYunSummary
  fiveElement: FiveElementSummary
}

/** 年度报告输入 */
export interface AnnualReportInput {
  chart: BaZiChart
  birthData: BirthData
  dayMaster: DayMasterSummary
  geJu: GeJuSummary
  xiYongShen: XiYongShenSummary
  daYun: DaYunAnalysisResult | undefined
  fiveElement: FiveElementSummary
  liuNian?: LiuNianAnalysisResult
}

/** 风水联动输入 */
export interface BaziFengShuiLinkInput {
  dayMasterElement: string
  strength: 'strong' | 'weak' | 'balanced'
  bestElement: string
  happiness: string[]
  avoidedElements: string[]
  fiveElement: FiveElementSummary
  shenSha: ShenShaSummary
  tiaoHou: TiaoHouSummary
}

/** 事件预测输入 */
export interface LifeEventPredictionInput {
  chart: BaZiChart
  birthData: BirthData
  xiYongShen: XiYongShenResult
  geJu: GeJuResult
  daYun: DaYunAnalysisResult | undefined
  combinations: CombinationSummary
  liuNian?: LiuNianAnalysisResult
}

/** 运势预测输入（大运/流年走势） */
export interface FortuneForecastInput {
  chart: BaZiChart
  birthData: BirthData
  daYun: DaYunAnalysisResult | undefined
  xiYongShen: XiYongShenResult
  liuNian?: LiuNianAnalysisResult
  years?: number
}

/** 行业推荐输入 */
export interface CareerRecommendInput {
  shiShen: ShenShiAnalysisResult
  fiveElementPower: FiveElementPowerResult
  geJu: GeJuResult
  xiYongShen: XiYongShenResult
  dayMaster: DayMasterSummary
  gender: string
}

// ========== 适配器函数 ==========

/** 事业分析适配器 */
export function adaptForCareer(data: UnifiedAnalysisData): CareerAnalysisInput {
  return {
    sixLines: data.chart.sixLines,
    dayGan: data.chart.dayMaster.dayGan,
    gender: data.birthData.gender,
    shenShiAnalysis: data.raw.shiShen,
    geJu: data.raw.geJu,
    fiveElementPower: data.raw.fiveElementPower,
  }
}

/** 婚姻分析适配器 */
export function adaptForMarriage(data: UnifiedAnalysisData): MarriageAnalysisInput {
  return {
    sixLines: data.chart.sixLines,
    dayGan: data.chart.dayMaster.dayGan,
    gender: data.birthData.gender,
  }
}

/**
 * 财富分析适配器。
 * 流年结果（liuNian）由 Pipeline 在大运之后计算并经 ctx 注入；
 * 未注入时为 undefined，与原有“流年未执行则不传”行为一致。
 */
export function adaptForWealth(
  data: UnifiedAnalysisData,
  ctx?: AdapterContext,
): WealthAnalysisInput {
  return {
    sixLines: data.chart.sixLines,
    dayGan: data.chart.dayMaster.dayGan,
    shenShiAnalysis: data.raw.shiShen,
    liuNian: ctx?.liuNian,
    geJu: data.raw.geJu,
  }
}

/** 健康分析适配器 */
export function adaptForHealth(data: UnifiedAnalysisData): HealthAnalysisInput {
  return {
    sixLines: data.chart.sixLines,
    dayGan: data.chart.dayMaster.dayGan,
    fiveElementPower: data.raw.fiveElementPower,
  }
}

/** AI 问答适配器 */
export function adaptForAskMaster(data: UnifiedAnalysisData): AskMasterInput {
  return {
    chart: data.chart,
    birthData: data.birthData,
    dayMaster: data.dayMaster,
    geJu: data.geJu,
    xiYongShen: data.xiYongShen,
    tiaoHou: data.tiaoHou,
    shiShen: data.shiShen,
    shenSha: data.shenSha,
    combinations: data.combinations,
    daYun: data.daYun,
    fiveElement: data.fiveElement,
  }
}

/** 年度报告适配器 */
export function adaptForAnnualReport(
  data: UnifiedAnalysisData,
  ctx?: AdapterContext,
): AnnualReportInput {
  return {
    chart: data.chart,
    birthData: data.birthData,
    dayMaster: data.dayMaster,
    geJu: data.geJu,
    xiYongShen: data.xiYongShen,
    daYun: data.raw.daYun,
    fiveElement: data.fiveElement,
    liuNian: ctx?.liuNian,
  }
}

/** 风水联动适配器 */
export function adaptForFengShuiLink(data: UnifiedAnalysisData): BaziFengShuiLinkInput {
  return {
    dayMasterElement: data.dayMaster.element,
    strength: data.dayMaster.strength,
    bestElement: data.xiYongShen.bestElement,
    happiness: data.xiYongShen.happiness,
    avoidedElements: data.xiYongShen.avoidedElements,
    fiveElement: data.fiveElement,
    shenSha: data.shenSha,
    tiaoHou: data.tiaoHou,
  }
}

/** 事件预测适配器 */
export function adaptForLifeEvent(
  data: UnifiedAnalysisData,
  ctx?: AdapterContext,
): LifeEventPredictionInput {
  return {
    chart: data.chart,
    birthData: data.birthData,
    xiYongShen: data.raw.xiYongShen,
    geJu: data.raw.geJu,
    daYun: data.raw.daYun,
    combinations: data.combinations,
    liuNian: ctx?.liuNian,
  }
}

/** 运势预测适配器（大运/流年走势） */
export function adaptForFortuneForecast(
  data: UnifiedAnalysisData,
  ctx?: AdapterContext,
): FortuneForecastInput {
  return {
    chart: data.chart,
    birthData: data.birthData,
    daYun: data.raw.daYun,
    xiYongShen: data.raw.xiYongShen,
    liuNian: ctx?.liuNian,
    years: ctx?.years,
  }
}

/** 行业推荐适配器 */
export function adaptForCareerRecommend(data: UnifiedAnalysisData): CareerRecommendInput {
  return {
    shiShen: data.raw.shiShen,
    fiveElementPower: data.raw.fiveElementPower,
    geJu: data.raw.geJu,
    xiYongShen: data.raw.xiYongShen,
    dayMaster: data.dayMaster,
    gender: data.birthData.gender,
  }
}

export default {
  adaptForCareer,
  adaptForMarriage,
  adaptForWealth,
  adaptForHealth,
  adaptForAskMaster,
  adaptForAnnualReport,
  adaptForFengShuiLink,
  adaptForLifeEvent,
  adaptForFortuneForecast,
  adaptForCareerRecommend,
}
