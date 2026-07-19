/**
 * V3.1 可信度引擎
 * 基于多维度因子计算分析结果的可信度评分
 */

import type { CredibilityResultV31, CredibilityFactors } from '../types'

/** 可信度计算入参 */
interface CredibilityOptions {
  imageQuality: {
    resolution: { width: number; height: number }
    brightness: number // 0-100
    angleDeviation: number // 角度偏差度数，0 为最佳
  }
  visionResult: {
    objects: Array<{ label: string; confidence: number }>
  }
  ruleMatches: Array<unknown>
  totalRules: number
  modelResults: Array<{ model: string; score: number }>
  duration: number // 分析耗时（毫秒）
}

/** 各因子权重配置 */
const FACTOR_WEIGHTS: Record<keyof CredibilityFactors, number> = {
  imageCompleteness: 0.25,
  recognitionAccuracy: 0.25,
  ruleMatchRate: 0.2,
  elementRecognitionCount: 0.15,
  modelConsistency: 0.15,
}

/**
 * 计算图片完整度（分辨率 + 光线 + 角度）
 * @param quality 图片质量参数
 * @returns 0-100
 */
function calculateImageCompleteness(quality: CredibilityOptions['imageQuality']): number {
  const { width, height } = quality.resolution
  const pixelCount = width * height

  // 分辨率评分：以 1920*1080 为满分基准
  const resolutionScore = Math.min(100, (pixelCount / (1920 * 1080)) * 100)

  // 亮度评分：直接映射
  const brightnessScore = Math.max(0, Math.min(100, quality.brightness))

  // 角度评分：偏差 0 度满分，超过 45 度 0 分
  const angleScore = Math.max(0, 100 - (quality.angleDeviation / 45) * 100)

  return Math.round((resolutionScore * 0.4 + brightnessScore * 0.35 + angleScore * 0.25) * 10) / 10
}

/**
 * 计算识别准确率（AI 置信度平均）
 * @param objects 识别物体列表
 * @returns 0-100
 */
function calculateRecognitionAccuracy(objects: Array<{ confidence: number }>): number {
  if (objects.length === 0) return 0
  const avgConfidence = objects.reduce((sum, o) => sum + o.confidence, 0) / objects.length
  return Math.round(avgConfidence * 100 * 10) / 10
}

/**
 * 计算规则匹配率
 * @param matches 匹配的规则数
 * @param total 总规则数
 * @returns 0-100
 */
function calculateRuleMatchRate(matches: number, total: number): number {
  if (total === 0) return 0
  return Math.round((matches / total) * 100 * 10) / 10
}

/**
 * 计算识别元素数量得分（归一化到 0-100）
 * @param count 识别元素数量
 * @returns 0-100
 */
function calculateElementRecognitionCount(count: number): number {
  // 以 20 个要素为满分基准，超过不额外加分
  return Math.min(100, Math.round((count / 20) * 100 * 10) / 10)
}

/**
 * 计算模型一致性
 * @param modelResults 多模型结果
 * @returns 0-100
 */
function calculateModelConsistency(modelResults: Array<{ score: number }>): number {
  if (modelResults.length === 0) return 50 // 无多模型数据时取中值
  if (modelResults.length === 1) return 80 // 单模型默认较高一致性

  const scores = modelResults.map((m) => m.score)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length
  const stdDev = Math.sqrt(variance)

  // 标准差越小一致性越高：stdDev 0 为 100 分，stdDev >= 30 为 0 分
  const consistency = Math.max(0, 100 - (stdDev / 30) * 100)
  return Math.round(consistency * 10) / 10
}

/**
 * 根据总分判定可信度等级
 * @param score 总分 0-100
 */
function determineLevel(score: number): CredibilityResultV31['level'] {
  if (score >= 90) return 'veryHigh'
  if (score >= 75) return 'high'
  if (score >= 60) return 'medium'
  if (score >= 40) return 'low'
  return 'veryLow'
}

/**
 * 生成可信度说明文字
 * @param factors 各因子得分
 * @param level 等级
 * @param score 总分
 */
function generateExplanation(factors: CredibilityFactors, level: string, score: number): string {
  const parts: string[] = []

  parts.push(`综合分析可信度为 ${score} 分，等级：${levelText(level)}。`)

  if (factors.imageCompleteness >= 80) {
    parts.push('图片质量良好，分辨率高、光线充足、拍摄角度规范，为准确分析奠定基础。')
  } else if (factors.imageCompleteness >= 60) {
    parts.push('图片质量尚可，但存在分辨率不足、光线偏暗或角度偏差等问题，可能影响部分细节判断。')
  } else {
    parts.push('图片质量较差，分辨率低或拍摄条件不佳，分析结果仅供参考。')
  }

  if (factors.recognitionAccuracy >= 80) {
    parts.push('AI 识别置信度高，要素定位准确。')
  } else {
    parts.push('AI 识别置信度一般，建议补充更清晰的图片进行复核。')
  }

  if (factors.ruleMatchRate >= 50) {
    parts.push(`规则匹配率 ${factors.ruleMatchRate}%，触发的风水规则覆盖面较广。`)
  } else {
    parts.push(`规则匹配率 ${factors.ruleMatchRate}%，当前场景触发规则有限，建议提供更多角度照片。`)
  }

  if (factors.modelConsistency >= 80) {
    parts.push('多模型评估结果一致性良好。')
  } else if (factors.modelConsistency >= 60) {
    parts.push('多模型评估结果存在一定分歧，建议结合人工经验综合判断。')
  } else {
    parts.push('多模型评估结果差异较大，本报告可信度受限，请谨慎参考。')
  }

  return parts.join('')
}

function levelText(level: string): string {
  switch (level) {
    case 'veryHigh':
      return '极高'
    case 'high':
      return '高'
    case 'medium':
      return '中等'
    case 'low':
      return '低'
    case 'veryLow':
      return '极低'
    default:
      return '未知'
  }
}

/**
 * 计算 V3.1 可信度评分
 * @param options 可信度计算参数
 * @returns 可信度结果
 */
export function calculateCredibilityV31(options: CredibilityOptions): CredibilityResultV31 {
  const imageCompleteness = calculateImageCompleteness(options.imageQuality)
  const recognitionAccuracy = calculateRecognitionAccuracy(options.visionResult.objects)
  const ruleMatchRate = calculateRuleMatchRate(options.ruleMatches.length, options.totalRules)
  const elementRecognitionCount = calculateElementRecognitionCount(options.visionResult.objects.length)
  const modelConsistency = calculateModelConsistency(options.modelResults)

  const factors: CredibilityFactors = {
    imageCompleteness,
    recognitionAccuracy,
    ruleMatchRate,
    elementRecognitionCount,
    modelConsistency,
  }

  const weightedScore =
    imageCompleteness * FACTOR_WEIGHTS.imageCompleteness +
    recognitionAccuracy * FACTOR_WEIGHTS.recognitionAccuracy +
    ruleMatchRate * FACTOR_WEIGHTS.ruleMatchRate +
    elementRecognitionCount * FACTOR_WEIGHTS.elementRecognitionCount +
    modelConsistency * FACTOR_WEIGHTS.modelConsistency

  const score = Math.round(weightedScore * 10) / 10
  const level = determineLevel(score)
  const explanation = generateExplanation(factors, level, score)

  return {
    score,
    level,
    factors,
    explanation,
  }
}
