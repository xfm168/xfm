/**
 * 五行旺衰计算（规则引擎驱动）
 * 综合月令权重、透干、藏干、通根深浅、同党异党、合化冲克
 *
 * 所有规则定义在 rules/wuxingRules.ts
 * 本文件仅负责流程编排和对外暴露接口
 */

import type { FiveElement, GanZhi, WuXingWangShuai, HeHuaResult } from './types'
import {
  calculateStrengthV2,
  type StrengthResult,
  type WuXingContext,
  type StrengthBreakdown,
  WUXING_RULES,
} from './rules/wuxingRules'

export type { WuXingWangShuai, StrengthResult, StrengthBreakdown, HeHuaResult, WuXingContext }
export { WUXING_RULES }

// 地支主气五行
const BRANCH_MAIN_ELEMENT: Record<string, FiveElement> = {
  寅: '木', 卯: '木',
  巳: '火', 午: '火',
  申: '金', 酉: '金',
  亥: '水', 子: '水',
  辰: '土', 丑: '土', 未: '土', 戌: '土',
}

// 旺相休囚死表
const WANG_SHUAI: Record<FiveElement, Record<FiveElement, WuXingWangShuai>> = {
  木: { 木: '旺', 火: '相', 土: '死', 金: '囚', 水: '休' },
  火: { 木: '休', 火: '旺', 土: '相', 金: '死', 水: '囚' },
  土: { 木: '死', 火: '囚', 土: '旺', 金: '相', 水: '休' },
  金: { 木: '囚', 火: '休', 土: '死', 金: '旺', 水: '相' },
  水: { 木: '相', 火: '死', 土: '囚', 金: '休', 水: '旺' },
}

export interface FiveElementScore {
  element: FiveElement
  score: number
  fromStems: number
  fromBranches: number
  fromCangGan: number
  total: number
}

export interface OldStrengthResult {
  dayElement: FiveElement
  wangShuai: WuXingWangShuai
  strengthScore: number
  scores: FiveElementScore[]
  // V3.3.1: 合化前原始分数
  originalScores: FiveElementScore[]
  analysis: string
  heHuaResults: HeHuaResult[]
}

/**
 * 获取某月支的主气五行
 */
export function getMonthMainElement(monthZhi: string): FiveElement {
  return BRANCH_MAIN_ELEMENT[monthZhi] as FiveElement
}

/**
 * 获取五行旺相休囚死
 */
export function getWangShuai(monthElement: FiveElement, dayElement: FiveElement): WuXingWangShuai {
  return WANG_SHUAI[monthElement][dayElement]
}

/**
 * 计算五行旺衰
 * 内部通过规则引擎执行（V2版）
 */
export function calculateStrength(
  sixLines: { year: GanZhi; month: GanZhi; day: GanZhi; hour: GanZhi },
  dayGan: string,
  monthZhi: string,
): OldStrengthResult {
  const dayElement = getDayElement(dayGan)
  const monthElement = getMonthMainElement(monthZhi)
  const wangShuai = getWangShuai(monthElement, dayElement)

  // 构造藏干数据
  const CANG_GAN_TABLE: Record<string, { ben: string; zhong: string | null; yao: string | null }> = {
    '子': { ben: '癸', zhong: null, yao: null },
    '丑': { ben: '己', zhong: '辛', yao: '癸' },
    '寅': { ben: '甲', zhong: '丙', yao: '戊' },
    '卯': { ben: '乙', zhong: null, yao: null },
    '辰': { ben: '戊', zhong: '乙', yao: '癸' },
    '巳': { ben: '丙', zhong: '庚', yao: '戊' },
    '午': { ben: '丁', zhong: '己', yao: null },
    '未': { ben: '己', zhong: '丁', yao: '乙' },
    '申': { ben: '庚', zhong: '壬', yao: '戊' },
    '酉': { ben: '辛', zhong: null, yao: null },
    '戌': { ben: '戊', zhong: '辛', yao: '丁' },
    '亥': { ben: '壬', zhong: '甲', yao: null },
  }
  const cangGanData: Record<string, { ben: string; zhong: string | null; yao: string | null }> = {}
  for (const pillar of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
    cangGanData[pillar.zhi] = CANG_GAN_TABLE[pillar.zhi] || { ben: '', zhong: null, yao: null }
  }

  // 调用 V2 规则引擎版本
  const v2Result = calculateStrengthV2(
    sixLines as any,
    dayGan as any,
    monthZhi as any,
    cangGanData as any,
  )

  // 构造旧版返回格式以保持兼容
  const scores: FiveElementScore[] = (Object.keys(v2Result.fiveElementScores) as FiveElement[]).map(el => ({
    element: el,
    score: v2Result.fiveElementScores[el],
    fromStems: 0,
    fromBranches: 0,
    fromCangGan: 0,
    total: v2Result.fiveElementScores[el],
  }))

  // V3.3.1: 合化前原始分数
  const originalScores: FiveElementScore[] = (Object.keys(v2Result.originalFiveElementScores) as FiveElement[]).map(el => ({
    element: el,
    score: v2Result.originalFiveElementScores[el],
    fromStems: 0,
    fromBranches: 0,
    fromCangGan: 0,
    total: v2Result.originalFiveElementScores[el],
  }))

  return {
    dayElement,
    wangShuai,
    strengthScore: v2Result.strengthScore,
    scores,
    originalScores,
    analysis: v2Result.reasons.join('；'),
    heHuaResults: v2Result.heHuaResults,
  }
}

function getDayElement(gan: string): FiveElement {
  const map: Record<string, FiveElement> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火',
    '戊': '土', '己': '土', '庚': '金', '辛': '金',
    '壬': '水', '癸': '水',
  }
  return map[gan] || '土'
}
