/**
 * 八字 Pipeline
 * 
 * 复用风水 Pipeline 架构模式：
 * Input → Analyzer → Rules → Knowledge → Score → AI Report → Output
 * 
 * 八字 Pipeline 流程：
 * 1. 排盘分析（四柱、十神、五行、旺衰、纳音、神煞）
 * 2. 格局判断（正格、从格、化格、调候）
 * 3. 用神判定（喜神、忌神）
 * 4. 运势分析（大运、流年）
 * 5. 知识库引用
 * 6. 评分计算
 * 7. AI 报告生成
 */

import { logger } from '../../../utils/logger'
import { calculateBaZi, calculateBaZiFromBirthData } from '../calculator'
import type { BaZiChart, BirthInfo } from '../types'
import { determineGeJu, type GeJuResult } from '../geju'
import { determineXiYongShen } from '../xiyongshen'
import { default as baziKnowledge } from '../knowledge'

import type {
  BaZiAnalysisOptions,
  BaZiPipelineResult,
  BaZiPipelineStep,
  BaZiPipelineInput,
} from './types'

import type { BirthData, BirthInfoAdapter } from '@/lib/core'

const pipelineLogger = logger.child('BaziPipeline')

/**
 * 八字 Pipeline 执行器（新入口）
 * 
 * @deprecated 使用 runBaZiPipelineFromBirthData 代替
 * 仅为向后兼容保留
 */
export async function runBaZiPipeline(
  birthInfo: BirthInfo,
  options: BaZiAnalysisOptions = {}
): Promise<BaZiPipelineResult> {
  const birthData: BirthData = {
    birthday: birthInfo.birthDate,
    birthTime: birthInfo.birthTime,
    gender: birthInfo.gender,
    timezone: birthInfo.timezone,
    location: birthInfo.region,
    useTrueSolarTime: birthInfo.solarTime,
  }
  return runBaZiPipelineFromBirthData({ birthData, options })
}

/**
 * 八字 Pipeline 执行器（BirthData 入口）
 * 
 * 统一入口，不允许绕过 Pipeline 直接调用底层
 */
export async function runBaZiPipelineFromBirthData(
  input: BaZiPipelineInput
): Promise<BaZiPipelineResult> {
  const { birthData, options = {} } = input
  const { includeAI = false, detailed = false } = options
  const startTime = Date.now()

  pipelineLogger.info('开始八字排盘分析')

  // Step 1: 排盘分析
  pipelineLogger.debug('Step 1: 四柱排盘')
  const chart = calculateBaZiFromBirthData(birthData)

  // Step 2: 格局判断
  pipelineLogger.debug('Step 2: 格局判断')
  const geJuResult = determineGeJu(
    chart.sixLines,
    chart.dayMaster.relatedShens as any,
    chart.dayMaster.strengthScore,
    chart.dayMaster.dayGan,
    chart.sixLines.month.zhi,
    chart.fiveElementCount as any,
  ) as GeJuResult

  // Step 3: 用神判定
  pipelineLogger.debug('Step 3: 喜用神判定')
  const xiYongResult = determineXiYongShen(
    chart.dayMaster.strengthScore,
    chart.dayMaster.wangShuai,
    geJuResult.name as any,
    chart.dayMaster.dayGanElement,
  )

  // Step 4: 知识库引用
  pipelineLogger.debug('Step 4: 知识库引用')
  const relevantKnowledge = baziKnowledge.search(geJuResult.name, 3)

  // Step 5: 综合评分
  pipelineLogger.debug('Step 5: 综合评分')
  const score = calculateBaZiScore(chart, geJuResult, xiYongResult)
  const duration = Date.now() - startTime

  const result: BaZiPipelineResult = {
    success: true,
    birthData,
    chart,
    geJu: geJuResult,
    xiYongShen: xiYongResult,
    score,
    knowledge: relevantKnowledge,
    steps: [
      { name: '排盘分析', status: 'completed', duration: 0 },
      { name: '格局判断', status: 'completed', duration: 0 },
      { name: '用神判定', status: 'completed', duration: 0 },
      { name: '知识库引用', status: 'completed', duration: 0 },
      { name: '综合评分', status: 'completed', duration: 0 },
    ],
    aiReport: null,
    includeAI,
    detailed,
    createdAt: Date.now(),
    version: '4.4.0',
    duration,
  }

  // Step 6: AI 报告（可选）
  if (includeAI) {
    pipelineLogger.debug('Step 6: AI 报告生成')
    result.steps.push({ name: 'AI 报告', status: 'pending', duration: 0 })
  }

  pipelineLogger.info('八字分析完成', `评分: ${score.overall}`)

  return result
}

/**
 * 计算八字综合评分
 */
function calculateBaZiScore(
  chart: BaZiChart,
  geJu: GeJuResult,
  xiYong: { bestElement: string; avoidedElements: string[] }
) {
  let overall = 60

  // 旺衰加分：中和偏旺最佳
  const strength = chart.dayMaster.strengthScore
  if (strength >= 40 && strength <= 60) {
    overall += 15
  } else if (strength >= 30 && strength <= 70) {
    overall += 10
  } else if (strength >= 20 && strength <= 80) {
    overall += 5
  }

  // 格局加分
  if (geJu.confidence && geJu.confidence > 70) {
    overall += 10
  } else if (geJu.confidence && geJu.confidence > 50) {
    overall += 5
  }

  // 五行平衡加分
  const elements = Object.values(chart.fiveElementCount) as number[]
  const max = Math.max(...elements)
  const min = Math.min(...elements)
  const balance = max > 0 ? min / max : 0
  if (balance > 0.5) {
    overall += 10
  } else if (balance > 0.3) {
    overall += 5
  }

  overall = Math.min(100, Math.max(0, Math.round(overall)))

  return {
    overall,
    strength: Math.round(strength),
    balance: Math.round(balance * 100),
    pattern: geJu.confidence || 0,
  }
}

export default runBaZiPipeline
