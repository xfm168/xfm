/**
 * 风水分析引擎
 * 
 * 复用八字模块的 Rule Engine 架构
 */

import { executeRules } from '../bazi/rules/engine'
import { FENGSHUI_RULES, type FengShuiRule } from './rules/fengshuiRules'
import type {
  FengShuiContext,
  FengShuiResult,
  FengShuiPattern,
  FengShuiExplain,
  FengShuiCategory,
  DirectionAnalysis,
  LayoutAnalysis,
  RoomAnalysis,
  ElementAnalysis,
  Direction,
  FiveElement,
} from './types'

// ============ 辅助函数 ============

function directionToName(dir: Direction): string {
  const names: Record<Direction, string> = {
    north: '北',
    northeast: '东北',
    east: '东',
    southeast: '东南',
    south: '南',
    southwest: '西南',
    west: '西',
    northwest: '西北',
    center: '中',
  }
  return names[dir]
}

function getElementName(elem: FiveElement): string {
  return elem
}

// ============ 主分析函数 ============

export function analyzeFengShui(context: FengShuiContext): FengShuiResult {
  // 1. 执行规则引擎
  const { bestMatch, allMatches } = executeRules(FENGSHUI_RULES as any, context as any, {
    stopOnFirstMatch: false,
    returnAllMatches: true,
  })

  // 2. 计算各项分数
  const directionScore = calculateDirectionScore(context, allMatches)
  const layoutScore = calculateLayoutScore(context, allMatches)
  const roomScore = calculateRoomScore(context, allMatches)
  const elementScore = calculateElementScore(context, allMatches)
  const environmentScore = calculateEnvironmentScore(context, allMatches)
  
  // 3. 计算综合分数
  const overallScore = Math.round(
    directionScore * 0.2 +
    layoutScore * 0.2 +
    roomScore * 0.2 +
    elementScore * 0.15 +
    environmentScore * 0.25
  )

  // 4. 计算Confidence
  const confidence = calculateConfidence(allMatches.length, FENGSHUI_RULES.length, overallScore)
  const confidenceReason = getConfidenceReason(confidence, allMatches.length, context)

  // 5. 生成Explain
  const explain = generateExplain(context, allMatches)

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
    description: m.rule.description || (m.rule.result as any)?.description || '',
    matched: true,
  }))

  const mainPattern: FengShuiPattern = bestMatch ? {
    id: bestMatch.rule.id,
    name: bestMatch.rule.name,
    category: bestMatch.rule.category,
    description: bestMatch.rule.description || (bestMatch.rule.result as any)?.description || '',
    matched: true,
  } : {
    id: 'default',
    name: '普通格局',
    category: '综合' as FengShuiCategory,
    description: '风水格局一般，需注意日常调理',
    matched: false,
  }

  return {
    mainPattern,
    patternScore: overallScore,
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
    overallScore,
    
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

// ============ 分数计算 ============

function calculateDirectionScore(context: FengShuiContext, matches: any[]): number {
  const dirRules = matches.filter(m => m.rule.category === '朝向')
  if (dirRules.length === 0) return 50
  
  const totalScore = dirRules.reduce((sum, m) => {
    const result = m.rule.result as any
    return sum + (result?.score || 50)
  }, 0)
  
  return Math.round(totalScore / dirRules.length)
}

function calculateLayoutScore(context: FengShuiContext, matches: any[]): number {
  const layoutRules = matches.filter(m => m.rule.category === '户型')
  if (layoutRules.length === 0) return context.layout.score
  
  const totalScore = layoutRules.reduce((sum, m) => {
    const result = m.rule.result as any
    return sum + (result?.score || 50)
  }, 0)
  
  return Math.round(totalScore / layoutRules.length)
}

function calculateRoomScore(context: FengShuiContext, matches: any[]): number {
  const roomRules = matches.filter(m => m.rule.category === '房间')
  if (roomRules.length === 0) return 60
  
  const totalScore = roomRules.reduce((sum, m) => {
    const result = m.rule.result as any
    return sum + (result?.score || 50)
  }, 0)
  
  return Math.round(totalScore / roomRules.length)
}

function calculateElementScore(context: FengShuiContext, matches: any[]): number {
  const elementRules = matches.filter(m => m.rule.category === '五行')
  if (elementRules.length === 0) return 60
  
  const totalScore = elementRules.reduce((sum, m) => {
    const result = m.rule.result as any
    return sum + (result?.score || 50)
  }, 0)
  
  return Math.round(totalScore / elementRules.length)
}

function calculateEnvironmentScore(context: FengShuiContext, matches: any[]): number {
  const envRules = matches.filter(m => m.rule.category === '环境')
  if (envRules.length === 0) return 60
  
  const totalScore = envRules.reduce((sum, m) => {
    const result = m.rule.result as any
    return sum + (result?.score || 50)
  }, 0)
  
  return Math.round(totalScore / envRules.length)
}

// ============ Confidence计算 ============

function calculateConfidence(matchedCount: number, totalCount: number, score: number): number {
  // 基础分
  let confidence = 50
  
  // 根据匹配规则数加分
  const matchRate = matchedCount / totalCount
  if (matchRate > 0.3) confidence += 20
  else if (matchRate > 0.2) confidence += 10
  else if (matchRate > 0.1) confidence += 5
  
  // 根据分数调整
  if (score >= 85) confidence += 15
  else if (score >= 70) confidence += 10
  else if (score >= 60) confidence += 5
  else if (score < 40) confidence -= 10
  
  // 限制范围
  return Math.max(20, Math.min(98, confidence))
}

function getConfidenceReason(confidence: number, matchedCount: number, context: FengShuiContext): string {
  if (confidence >= 90) {
    return '风水格局优秀，多项指标符合最佳布局'
  } else if (confidence >= 80) {
    return '风水格局良好，有较好的运势支持'
  } else if (confidence >= 70) {
    return '风水格局中等，部分区域需改善'
  } else if (confidence >= 60) {
    return '风水格局一般，建议针对性调整'
  } else {
    return '风水格局较差，需要全面调理'
  }
}

// ============ Explain生成 ============

function generateExplain(context: FengShuiContext, matches: any[]): FengShuiExplain {
  const whyGood: string[] = []
  const whyBad: string[] = []
  const suggestions: string[] = []
  const warnings: string[] = []
  const tips: string[] = []

  // 分析命中的好规则
  for (const m of matches) {
    const result = m.rule.result as any
    if (result?.score >= 75) {
      whyGood.push(`${m.rule.name}：${result.description || m.rule.description || '符合风水原则'}`)
    } else if (result?.score < 50) {
      whyBad.push(`${m.rule.name}：${result.description || m.rule.description || '需注意改善'}`)
    }
  }

  // 生成建议
  if (context.elementDistribution['木'] <= 1) {
    suggestions.push('建议摆放绿植或木质家具增加木气')
  }
  if (context.elementDistribution['火'] <= 1) {
    suggestions.push('建议使用红色装饰或灯具增加火气')
  }
  if (context.elementDistribution['土'] <= 1) {
    suggestions.push('建议使用黄色装饰或陶瓷摆件增加土气')
  }
  if (context.elementDistribution['金'] <= 1) {
    suggestions.push('建议使用白色金属装饰或圆形物品增加金气')
  }
  if (context.elementDistribution['水'] <= 1) {
    suggestions.push('建议摆放鱼缸或水景增加水气')
  }

  if (context.layout.missingCorners.length > 0) {
    const corners = context.layout.missingCorners.map(d => directionToName(d)).join('、')
    suggestions.push(`户型有缺角（${corners}），建议在缺角处摆放相应五行物品化解`)
  }

  if (context.nearbyTJunction) {
    warnings.push('大门正对T字路，有路冲煞气，建议使用屏风或绿植化解')
  }

  if (context.nearbyPole) {
    warnings.push('附近有电线杆，形成暗煞，建议悬挂凸镜化解')
  }

  // 生成小贴士
  tips.push('保持室内整洁，光线充足，通风良好')
  tips.push('定期清理杂物，保持气场流通')
  tips.push('根据自己的五行喜忌选择适合的颜色和材质')

  return {
    whyGood: [...new Set(whyGood)].slice(0, 10),
    whyBad: [...new Set(whyBad)].slice(0, 10),
    suggestions: [...new Set(suggestions)].slice(0, 10),
    matchedPatterns: matches.slice(0, 10).map(m => m.rule.name),
    warnings: [...new Set(warnings)].slice(0, 5),
    tips: [...new Set(tips)].slice(0, 5),
  }
}

// ============ 详细分析 ============

function generateDirectionAnalysis(context: FengShuiContext, matches: any[]): DirectionAnalysis {
  const dirRules = matches.filter(m => m.rule.category === '朝向')
  const scores = dirRules.map(m => (m.rule.result as any)?.score || 50)
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50
  
  let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'fair'
  if (avgScore >= 85) quality = 'excellent'
  else if (avgScore >= 70) quality = 'good'
  else if (avgScore >= 55) quality = 'fair'
  else quality = 'poor'

  const reasons: string[] = []
  const suggestions: string[] = []

  for (const m of dirRules) {
    const result = m.rule.result as any
    if (result?.score >= 75) {
      reasons.push(`✓ ${m.rule.name}`)
    } else {
      reasons.push(`✗ ${m.rule.name}`)
      if (m.rule.id === 'avoid-north-facing') {
        suggestions.push('建议在北向窗户增加照明')
      }
      if (m.rule.id === 'avoid-west-facing') {
        suggestions.push('建议使用遮光窗帘减少西晒')
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
  const scores = layoutRules.map(m => (m.rule.result as any)?.score || 50)
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 60

  const strengths: string[] = []
  const weaknesses: string[] = []
  const suggestions: string[] = []

  for (const m of layoutRules) {
    const result = m.rule.result as any
    if (result?.score >= 75) {
      strengths.push(m.rule.name)
    } else {
      weaknesses.push(m.rule.name)
      if (m.rule.id.includes('missing')) {
        suggestions.push(`${m.rule.name}，建议在相应方位摆放对应五行物品化解`)
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
    const typeRules = roomRules.filter(m => m.rule.id.includes(roomType) || m.rule.name.includes(roomType))
    const scores = typeRules.map(m => (m.rule.result as any)?.score || 50)
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 60

    const strengths: string[] = []
    const weaknesses: string[] = []
    const suggestions: string[] = []

    for (const m of typeRules) {
      const result = m.rule.result as any
      if (result?.score >= 75) {
        strengths.push(m.rule.name)
      } else {
        weaknesses.push(m.rule.name)
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
  const elements: FiveElement[] = ['木', '火', '土', '金', '水']
  const values = [木, 火, 土, 金, 水]
  const max = Math.max(...values)
  const min = Math.min(...values)
  const balance = 100 - (max - min) * 10

  const dominant = elements[values.indexOf(max)] as FiveElement
  const deficient = elements[values.indexOf(min)] as FiveElement

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

// ============ 导出 ============

export { FENGSHUI_RULES } from './rules/fengshuiRules'
