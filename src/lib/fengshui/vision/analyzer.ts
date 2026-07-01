/**
 * 风水图片分析器
 * 
 * 整合 AI 分析 + 煞气检测 + Context 转换
 */

import { analyzeImage } from '../aiImageAnalyzer'
import { convertToFengShuiContext, detectShaFromAnalysis } from './contextConverter'
import type { VisionInput, VisionReport, VisionToContextResult } from './types'

/**
 * 主分析函数
 * 
 * @param input - 图片输入
 * @returns 完整的分析结果和 FengShuiContext
 */
export async function analyzeFengShuiImage(
  input: VisionInput
): Promise<VisionToContextResult> {
  // 1. 调用 AI 进行图片分析
  const aiResult = await analyzeImage({
    imageData: input.imageData,
    analysisType: mapImageTypeToAnalysisType(input.imageType),
    options: {
      roomType: input.userDescription,
    },
  })
  
  // 2. 从分析结果中检测煞气
  const detectedSha = detectShaFromAnalysis(aiResult)
  
  // 3. 将 AI 结果添加到分析结果
  const enhancedAnalysis = {
    ...aiResult,
    detectedSha,
    confidence: aiResult.overallConfidence,
  }
  
  // 4. 转换为 FengShuiContext
  const result = convertToFengShuiContext(enhancedAnalysis, input.houseInfo)
  
  return result
}

/**
 * 简化的 Context 创建函数
 * 
 * 如果没有图片，只有基本信息
 */
export function createFengShuiContext(
  basicInfo: {
    houseType?: any
    totalArea?: number
    totalFloors?: number
    currentFloor?: number
    mainDirection?: any
    layoutShape?: any
    rooms?: any[]
  }
): any {
  return {
    houseType: basicInfo.houseType || 'apartment',
    houseAge: 5,
    totalFloors: basicInfo.totalFloors || 30,
    currentFloor: basicInfo.currentFloor || 10,
    totalArea: basicInfo.totalArea || 100,
    
    direction: {
      mainDirection: basicInfo.mainDirection || 'south',
      facingDirection: basicInfo.mainDirection || 'south',
      doorDirection: basicInfo.mainDirection || 'south',
    },
    
    layout: {
      shape: basicInfo.layoutShape || 'rectangle',
      score: 80,
      missingCorners: [],
      totalArea: basicInfo.totalArea || 100,
      usableArea: (basicInfo.totalArea || 100) * 0.8,
    },
    
    rooms: basicInfo.rooms || [],
    
    elementDistribution: {
      wood: 2, fire: 2, earth: 2, metal: 2, water: 2,
      dominant: '土' as const,
      deficient: '土' as const,
    },
    
    nearbyRoads: 0,
    nearbyTJunction: false,
    nearbyPole: false,
    nearWater: false,
    nearMountain: false,
  }
}

/**
 * 生成图片分析报告
 */
export async function generateVisionReport(
  input: VisionInput
): Promise<VisionReport> {
  const result = await analyzeFengShuiImage(input)
  
  // 生成报告摘要
  const summary = generateSummary(result)
  
  // 风水评估
  const fengShuiAssessment = {
    overallScore: calculateOverallScore(result),
    isAuspicious: result.detectedSha.some(s => s.severity === 'severe'),
    mainIssues: result.detectedSha
      .filter(s => s.severity === 'severe' || s.severity === 'moderate')
      .map(s => s.description),
    mainStrengths: identifyStrengths(result),
  }
  
  return {
    summary,
    detectedObjects: result.analysis.detectedObjects || [],
    fengShuiAssessment,
    shaIssues: result.detectedSha,
    elementAnalysis: result.elements,
    immediateSuggestions: collectSuggestions(result.detectedSha),
    concerns: result.warnings,
    confidence: result.confidence,
  }
}

// ============ 辅助函数 ============

function mapImageTypeToAnalysisType(type: VisionInput['imageType']): any {
  const mapping: Record<VisionInput['imageType'], string> = {
    'floor-plan': 'layout',
    'room-photo': 'room',
    'full-house-photo': 'full',
    'site-photo': 'full',
  }
  return mapping[type] || 'full'
}

function generateSummary(result: VisionToContextResult): string {
  const { analysis, detectedSha, warnings } = result
  
  const parts: string[] = []
  
  // 房间信息
  if (analysis.roomInfo) {
    parts.push(`户型${analysis.roomInfo.shape}，朝向${analysis.roomInfo.mainDirection}`)
  }
  
  // 煞气信息
  if (detectedSha.length > 0) {
    const severe = detectedSha.filter(s => s.severity === 'severe').length
    const moderate = detectedSha.filter(s => s.severity === 'moderate').length
    const mild = detectedSha.filter(s => s.severity === 'mild').length
    
    parts.push(`检测到${detectedSha.length}种风水问题（严重${severe}个、中度${moderate}个、轻度${mild}个）`)
  } else {
    parts.push('未检测到明显风水煞气')
  }
  
  // 置信度
  parts.push(`分析置信度${Math.round(result.confidence)}%`)
  
  return parts.join('，') + '。'
}

function calculateOverallScore(result: VisionToContextResult): number {
  let score = 100
  
  // 煞气扣分
  for (const sha of result.detectedSha) {
    switch (sha.severity) {
      case 'severe':
        score -= 20
        break
      case 'moderate':
        score -= 10
        break
      case 'mild':
        score -= 5
        break
    }
  }
  
  // 置信度调整
  score = score * (result.confidence / 100)
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

function identifyStrengths(result: VisionToContextResult): string[] {
  const strengths: string[] = []
  const { analysis } = result
  
  // 朝向好
  if (analysis.roomInfo?.mainDirection === 'south') {
    strengths.push('坐北朝南，采光充足')
  }
  
  // 户型方正
  if (analysis.roomInfo?.shape === 'square' || analysis.roomInfo?.shape === 'rectangle') {
    strengths.push('户型方正，气场稳定')
  }
  
  // 无严重煞气
  if (!result.detectedSha.some(s => s.severity === 'severe')) {
    strengths.push('无严重风水问题')
  }
  
  return strengths
}

function collectSuggestions(shaList: any[]): string[] {
  const suggestions: string[] = []
  const seen = new Set<string>()
  
  for (const sha of shaList) {
    for (const suggestion of sha.suggestions || []) {
      if (!seen.has(suggestion)) {
        seen.add(suggestion)
        suggestions.push(suggestion)
      }
    }
  }
  
  return suggestions.slice(0, 5) // 最多返回5个
}
