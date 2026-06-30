/**
 * 风水分析引擎 V1
 * 
 * 三层权重体系：
 * - 古籍核心理论：60%
 * - 实战案例规则：25%
 * - 现代住宅规则：15%
 * 
 * Explain 三段式：
 * 1. 古籍依据
 * 2. 实际住宅解释
 * 3. 改善建议
 */

import { executeRules } from '../bazi/rules/engine'
import { 
  FENGSHUI_RULES_V1, 
  LAYER_WEIGHTS, 
  CLASSICAL_RULES, 
  PRACTICAL_RULES, 
  MODERN_RULES,
  getRuleCountByLayer,
  getRulesBySchool,
} from './rules/fengshuiRulesV1'
import type {
  FengShuiContext,
  FengShuiResult,
  FengShuiPattern,
  FengShuiExplain,
  ClassicalReference,
  FengShuiCategory,
  DirectionAnalysis,
  LayoutAnalysis,
  RoomAnalysis,
  ElementAnalysis,
  FengShuiRule,
  RuleLayer,
  FengShuiSchool,
} from './types'

// ============ 主分析函数 ============

export function analyzeFengShuiV1(context: FengShuiContext): FengShuiResult {
  // 1. 执行规则引擎
  const { bestMatch, allMatches } = executeRules(FENGSHUI_RULES_V1 as any, context as any, {
    stopOnFirstMatch: false,
    returnAllMatches: true,
  })

  // 2. 按层分组计算分数
  const layerScores = calculateLayerScores(allMatches)
  
  // 3. 加权综合分数
  const weightedScore = calculateWeightedScore(layerScores)
  
  // 4. 计算Confidence
  const confidence = calculateConfidence(allMatches.length, FENGSHUI_RULES_V1.length, weightedScore)
  const confidenceReason = getConfidenceReason(confidence, allMatches.length, context)

  // 5. 生成三段式Explain
  const explain = generateThreeStageExplain(context, allMatches, layerScores)

  // 6. 生成详细分析
  const directionAnalysis = generateDirectionAnalysis(context, allMatches)
  const layoutAnalysis = generateLayoutAnalysis(context, allMatches)
  const roomAnalysis = generateRoomAnalysis(context, allMatches)
  const elementAnalysis = generateElementAnalysis(context, allMatches)

  // 7. 构建结果
  const matchedPatterns: FengShuiPattern[] = allMatches.map(m => ({
    id: m.rule.id,
    name: m.rule.name,
    category: m.rule.category,
    description: m.rule.result?.explanation || m.rule.description || '',
    matched: true,
  }))

  const mainPattern: FengShuiPattern = bestMatch ? {
    id: bestMatch.rule.id,
    name: bestMatch.rule.name,
    category: bestMatch.rule.category,
    description: bestMatch.rule.result?.explanation || bestMatch.rule.description || '',
    matched: true,
  } : {
    id: 'default',
    name: '普通格局',
    category: '综合',
    description: '风水格局一般，需注意日常调理',
    matched: false,
  }

  // 计算各维度评分
  const directionScore = calculateCategoryScore(allMatches, '朝向')
  const layoutScore = calculateCategoryScore(allMatches, '户型')
  const roomScore = calculateCategoryScore(allMatches, '房间')
  const elementScore = calculateCategoryScore(allMatches, '五行')
  const environmentScore = calculateCategoryScore(allMatches, '环境')

  return {
    mainPattern,
    patternScore: weightedScore,
    confidence,
    confidenceReason,
    matchedPatterns,
    matchedRuleNames: allMatches.map(m => m.rule.name),
    
    houseScore: Math.round((directionScore + layoutScore + environmentScore) / 3),
    directionScore,
    layoutScore,
    roomScore,
    elementScore,
    environmentScore,
    overallScore: weightedScore,
    
    strengths: explain.whyGood,
    weaknesses: explain.whyBad,
    warnings: explain.warnings,
    suggestions: explain.suggestions,
    explain,
    
    directionAnalysis,
    layoutAnalysis,
    roomAnalysis,
    elementAnalysis,
  }
}

// ============ 三层权重计算 ============

interface LayerScore {
  classical: number
  practical: number
  modern: number
}

function calculateLayerScores(matches: any[]): LayerScore {
  const classicalMatches = matches.filter(m => {
    const rule = m.rule as FengShuiRule
    return rule.layer === 'classical'
  })
  const practicalMatches = matches.filter(m => {
    const rule = m.rule as FengShuiRule
    return rule.layer === 'practical'
  })
  const modernMatches = matches.filter(m => {
    const rule = m.rule as FengShuiRule
    return rule.layer === 'modern'
  })

  const classicalScore = avgScore(classicalMatches)
  const practicalScore = avgScore(practicalMatches)
  const modernScore = avgScore(modernMatches)

  return {
    classical: classicalScore,
    practical: practicalScore,
    modern: modernScore,
  }
}

function avgScore(matches: any[]): number {
  if (matches.length === 0) return 60
  
  const total = matches.reduce((sum, m) => {
    const result = m.rule.result as any
    return sum + (result?.score || 50)
  }, 0)
  
  return Math.round(total / matches.length)
}

function calculateWeightedScore(layerScores: LayerScore): number {
  const weighted = 
    layerScores.classical * LAYER_WEIGHTS.classical +
    layerScores.practical * LAYER_WEIGHTS.practical +
    layerScores.modern * LAYER_WEIGHTS.modern
  
  return Math.round(weighted)
}

// ============ 分类评分 ============

function calculateCategoryScore(matches: any[], category: FengShuiCategory): number {
  const categoryMatches = matches.filter(m => m.rule.category === category)
  return avgScore(categoryMatches)
}

// ============ Confidence计算 ============

function calculateConfidence(matchedCount: number, totalCount: number, score: number): number {
  let confidence = 50
  
  const matchRate = matchedCount / totalCount
  if (matchRate > 0.3) confidence += 20
  else if (matchRate > 0.2) confidence += 10
  else if (matchRate > 0.1) confidence += 5
  
  if (score >= 85) confidence += 15
  else if (score >= 70) confidence += 10
  else if (score >= 60) confidence += 5
  else if (score < 40) confidence -= 10
  
  return Math.max(20, Math.min(98, confidence))
}

function getConfidenceReason(confidence: number, matchedCount: number, context: FengShuiContext): string {
  if (confidence >= 90) {
    return '风水格局优秀，多项古籍理论与实战经验均验证为吉'
  } else if (confidence >= 80) {
    return '风水格局良好，古籍理论支持度高'
  } else if (confidence >= 70) {
    return '风水格局中等，部分区域需改善'
  } else if (confidence >= 60) {
    return '风水格局一般，建议针对性调整'
  } else {
    return '风水格局较差，需要全面调理'
  }
}

// ============ 三段式Explain生成 ============

function generateThreeStageExplain(
  context: FengShuiContext,
  matches: any[],
  layerScores: LayerScore
): FengShuiExplain {
  // 收集古籍引用
  const classicalRefs: ClassicalReference[] = []
  const whyGood: string[] = []
  const whyBad: string[] = []
  const suggestions: string[] = []
  const warnings: string[] = []
  const tips: string[] = []
  const practicalExplanation: string[] = []

  for (const m of matches) {
    const rule = m.rule as FengShuiRule
    const result = rule.result as any
    
    // 收集古籍引用
    if (rule.layer === 'classical' && result?.classicalRef) {
      classicalRefs.push({
        source: rule.source[0] || '古籍',
        quote: result.classicalRef,
        school: rule.schools[0] || 'bzhai',
      })
    }
    
    // 分类好坏
    if (result?.score >= 75) {
      whyGood.push(`${rule.name}：${result.explanation || rule.description || ''}`)
      
      if (result?.classicalRef) {
        practicalExplanation.push(result.classicalRef)
      }
    } else if (result?.score < 55) {
      whyBad.push(`${rule.name}：${result.explanation || rule.description || ''}`)
      warnings.push(`${rule.name}：${result.explanation || rule.description || ''}`)
      
      if (result?.practicalAdvice) {
        suggestions.push(result.practicalAdvice)
      }
    }
  }

  // 添加基础建议
  if (context.elementDistribution['木'] <= 1) {
    suggestions.push('木气不足，建议摆放绿植或木质家具增加木气')
  }
  if (context.elementDistribution['火'] <= 1) {
    suggestions.push('火气不足，建议使用红色装饰或灯具增加火气')
  }
  if (context.elementDistribution['土'] <= 1) {
    suggestions.push('土气不足，建议使用黄色装饰或陶瓷摆件增加土气')
  }
  if (context.elementDistribution['金'] <= 1) {
    suggestions.push('金气不足，建议使用白色金属装饰或圆形物品增加金气')
  }
  if (context.elementDistribution['水'] <= 1) {
    suggestions.push('水气不足，建议摆放鱼缸或水景增加水气')
  }

  // 添加小贴士
  tips.push('保持室内整洁，光线充足，通风良好')
  tips.push('定期清理杂物，保持气场流通')
  tips.push('根据自己的五行喜忌选择适合的颜色和材质')

  return {
    classicalRefs: classicalRefs.slice(0, 5),
    practicalExplanation: [...new Set(practicalExplanation)].slice(0, 5),
    suggestions: [...new Set(suggestions)].slice(0, 10),
    matchedPatterns: matches.slice(0, 10).map(m => m.rule.name),
    warnings: [...new Set(warnings)].slice(0, 5),
    tips: [...new Set(tips)].slice(0, 5),
    whyGood: [...new Set(whyGood)].slice(0, 10),
    whyBad: [...new Set(whyBad)].slice(0, 10),
  }
}

// ============ 详细分析生成 ============

function generateDirectionAnalysis(context: FengShuiContext, matches: any[]): DirectionAnalysis {
  const dirRules = matches.filter(m => m.rule.category === '朝向')
  const scores = dirRules.map(m => {
    const result = (m.rule as FengShuiRule).result as any
    return result?.score || 50
  })
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50

  let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'fair'
  if (avgScore >= 85) quality = 'excellent'
  else if (avgScore >= 70) quality = 'good'
  else if (avgScore >= 55) quality = 'fair'
  else quality = 'poor'

  const reasons: string[] = []
  const suggestions: string[] = []

  for (const m of dirRules) {
    const rule = m.rule as FengShuiRule
    const result = rule.result as any
    if (result?.score >= 75) {
      reasons.push(`✓ ${rule.name}`)
    } else {
      reasons.push(`✗ ${rule.name}`)
      if (result?.practicalAdvice) {
        suggestions.push(result.practicalAdvice)
      }
    }
  }

  return {
    mainDirection: context.direction.mainDirection,
    facingDirection: context.direction.facingDirection,
    quality,
    score: Math.round(avgScore),
    reasons: [...new Set(reasons)],
    suggestions: [...new Set(suggestions)],
  }
}

function generateLayoutAnalysis(context: FengShuiContext, matches: any[]): LayoutAnalysis {
  const layoutRules = matches.filter(m => m.rule.category === '户型')
  const scores = layoutRules.map(m => {
    const result = (m.rule as FengShuiRule).result as any
    return result?.score || 50
  })
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 60

  const strengths: string[] = []
  const weaknesses: string[] = []
  const suggestions: string[] = []

  for (const m of layoutRules) {
    const rule = m.rule as FengShuiRule
    const result = rule.result as any
    if (result?.score >= 75) {
      strengths.push(rule.name)
    } else {
      weaknesses.push(rule.name)
      if (result?.practicalAdvice) {
        suggestions.push(result.practicalAdvice)
      }
    }
  }

  return {
    shape: context.layout.shape,
    score: Math.round(avgScore),
    missingCorners: context.layout.missingCorners.map(dir => ({
      direction: dir,
      severity: 30,
    })),
    strengths: [...new Set(strengths)],
    weaknesses: [...new Set(weaknesses)],
    suggestions: [...new Set(suggestions)],
  }
}

function generateRoomAnalysis(context: FengShuiContext, matches: any[]): RoomAnalysis[] {
  const roomRules = matches.filter(m => m.rule.category === '房间')
  const result: RoomAnalysis[] = []

  const roomTypes = [...new Set(context.rooms.map(r => r.type))]
  
  for (const roomType of roomTypes) {
    const typeRules = roomRules.filter(m => {
      const rule = m.rule as FengShuiRule
      return rule.tags.some(t => t.includes(roomType)) || rule.name.includes(roomType)
    })
    const scores = typeRules.map(m => {
      const result = (m.rule as FengShuiRule).result as any
      return result?.score || 50
    })
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 60

    const strengths: string[] = []
    const weaknesses: string[] = []
    const suggestions: string[] = []

    for (const m of typeRules) {
      const rule = m.rule as FengShuiRule
      const result = rule.result as any
      if (result?.score >= 75) {
        strengths.push(rule.name)
      } else {
        weaknesses.push(rule.name)
        if (result?.practicalAdvice) {
          suggestions.push(result.practicalAdvice)
        }
      }
    }

    result.push({
      roomType,
      name: getRoomTypeName(roomType),
      score: Math.round(avgScore),
      strengths: [...new Set(strengths)],
      weaknesses: [...new Set(weaknesses)],
      suggestions: [...new Set(suggestions)],
      furnitureAnalysis: [],
    })
  }

  return result
}

function getRoomTypeName(type: string): string {
  const names: Record<string, string> = {
    'living': '客厅',
    'master-bedroom': '主卧',
    'secondary-bedroom': '次卧',
    'children-bedroom': '儿童房',
    'kitchen': '厨房',
    'dining': '餐厅',
    'bathroom': '卫生间',
    'study': '书房',
    'balcony': '阳台',
    'entrance': '门厅',
  }
  return names[type] || type
}

function generateElementAnalysis(context: FengShuiContext, matches: any[]): ElementAnalysis {
  const elementRules = matches.filter(m => m.rule.category === '五行')
  const { 木, 火, 土, 金, 水 } = context.elementDistribution
  const elements: ('木' | '火' | '土' | '金' | '水')[] = ['木', '火', '土', '金', '水']
  const values = [木, 火, 土, 金, 水]
  const max = Math.max(...values)
  const min = Math.min(...values)
  const balance = 100 - (max - min) * 10

  const dominant = elements[values.indexOf(max)]
  const deficient = elements[values.indexOf(min)]

  const suggestions: string[] = []

  if (木 === min) suggestions.push('木气不足，建议摆放绿植或木质家具')
  if (火 === min) suggestions.push('火气不足，建议使用红色装饰或灯具')
  if (土 === min) suggestions.push('土气不足，建议使用黄色装饰或陶瓷')
  if (金 === min) suggestions.push('金气不足，建议使用白色金属或圆形物品')
  if (水 === min) suggestions.push('水气不足，建议摆放鱼缸或水景')

  return {
    distribution: context.elementDistribution,
    balance: Math.max(0, Math.min(100, balance)),
    dominant,
    deficient,
    suggestions: [...new Set(suggestions)],
  }
}

// ============ 流派冲突检测 ============

export interface SchoolConflict {
  topic: string
  bzhaiView?: string
  xuankongView?: string
  note: string
}

export function detectSchoolConflicts(matches: any[]): SchoolConflict[] {
  const conflicts: SchoolConflict[] = []
  
  // 这里可以添加不同流派观点冲突的检测逻辑
  // 例如：八宅派和玄空派对某个方位的吉凶判断不同
  
  return conflicts
}

// ============ 导出 ============

export { 
  FENGSHUI_RULES_V1,
  LAYER_WEIGHTS,
  CLASSICAL_RULES,
  PRACTICAL_RULES,
  MODERN_RULES,
} from './rules/fengshuiRulesV1'

export { getRuleCountByLayer, getRulesBySchool, getClassicalReferences } from './rules/fengshuiRulesV1'

// 兼容旧接口
export function analyzeFengShui(context: FengShuiContext): FengShuiResult {
  return analyzeFengShuiV1(context)
}
