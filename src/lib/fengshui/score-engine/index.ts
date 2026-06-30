/**
 * Score Engine - 统一评分引擎
 * 
 * 统一负责所有评分计算，不让 Rule 自己算最终分。
 * 
 * 以后任何模块都走这里。
 */

import type {
  ScoreEngineInput,
  ScoreEngineResult,
  ScoreBreakdown,
} from './types'

/**
 * 执行完整评分
 */
export function calculateScore(input: ScoreEngineInput): ScoreEngineResult {
  const breakdown: ScoreBreakdown[] = []
  
  // 1. 维度评分
  const dimensions = calculateDimensionScores(input, breakdown)
  
  // 2. 空间评分
  const spatial = calculateSpatialScores(input, breakdown)
  
  // 3. 五行评分
  const elements = calculateElementScores(input, breakdown)
  
  // 4. 运势评分
  const fortune = calculateFortuneScores(input, breakdown)
  
  // 5. 房间评分
  const rooms = calculateRoomScores(input, breakdown)
  
  // 6. 综合总分
  const overall = calculateOverallScore(dimensions, spatial, elements, fortune, breakdown)
  
  // 7. 可信度
  const confidence = calculateConfidence(input)
  
  return {
    overall,
    dimensions,
    fortune,
    rooms,
    elements,
    spatial,
    confidence,
    breakdown,
  }
}

// ============ 维度评分 ============

function calculateDimensionScores(input: ScoreEngineInput, breakdown: ScoreBreakdown[]): any {
  let lighting = 60
  let ventilation = 60
  let spaciousness = 60
  let layout = 65
  let fengShui = 60
  let comfort = 60
  let safety = 75
  
  // 从环境特征获取
  if (input.features) {
    lighting = input.features.lighting?.overall || 60
    ventilation = input.features.ventilation?.overall || 60
    spaciousness = input.features.spatial?.overallSpaciousness || 60
    fengShui = input.features.qi?.gathering || 60
    comfort = Math.round((lighting + ventilation + spaciousness) / 3)
  }
  
  // 从房间分析获取
  if (input.rooms) {
    lighting = input.rooms.dimensionSummary.lighting
    ventilation = input.rooms.dimensionSummary.ventilation
    layout = input.rooms.dimensionSummary.layout
    fengShui = input.rooms.dimensionSummary.fengShui
  }
  
  // 从空间分析补充
  if (input.spatial) {
    const shape = input.spatial.house.shape
    if (shape === 'square') {
      layout += 10
      fengShui += 5
    }
    
    const missingCount = input.spatial.house.missingCorners?.length || 0
    if (missingCount > 0) {
      layout -= missingCount * 5
      fengShui -= missingCount * 8
    }
  }
  
  // 上限下限
  lighting = clamp(lighting)
  ventilation = clamp(ventilation)
  spaciousness = clamp(spaciousness)
  layout = clamp(layout)
  fengShui = clamp(fengShui)
  comfort = clamp(comfort)
  safety = clamp(safety)
  
  // 加入明细
  addBreakdown(breakdown, '维度评分', '采光', lighting, 0.15, '整体采光情况')
  addBreakdown(breakdown, '维度评分', '通风', ventilation, 0.1, '整体通风情况')
  addBreakdown(breakdown, '维度评分', '空间感', spaciousness, 0.1, '空间开阔程度')
  addBreakdown(breakdown, '维度评分', '布局', layout, 0.15, '布局合理性')
  addBreakdown(breakdown, '维度评分', '风水', fengShui, 0.25, '风水吉凶程度')
  addBreakdown(breakdown, '维度评分', '舒适度', comfort, 0.15, '居住舒适度')
  addBreakdown(breakdown, '维度评分', '安全性', safety, 0.1, '居住安全性')
  
  return {
    lighting,
    ventilation,
    spaciousness,
    layout,
    fengShui,
    comfort,
    safety,
  }
}

// ============ 空间评分 ============

function calculateSpatialScores(input: ScoreEngineInput, breakdown: ScoreBreakdown[]): any {
  let shapeRegularity = 70
  let missingCornersImpact = 80
  let spaceUtilization = 60
  let circulationFlow = 65
  let qiGathering = 60
  let centerPalace = 70
  
  if (input.spatial) {
    // 户型方正度
    const shape = input.spatial.house.shape
    if (shape === 'square') shapeRegularity = 95
    else if (shape === 'rectangle') shapeRegularity = 85
    else if (shape === 'L-shape') shapeRegularity = 65
    else shapeRegularity = 45
    
    // 缺角影响
    const missingCount = input.spatial.house.missingCorners?.length || 0
    missingCornersImpact = Math.max(0, 100 - missingCount * 20)
    
    // 中宫状态
    if (input.spatial.house.centerArea) {
      centerPalace = 70 // 默认
    }
  }
  
  if (input.features?.qi) {
    qiGathering = input.features.qi.gathering
    circulationFlow = input.features.spatial?.circulationFlow || 65
  }
  
  shapeRegularity = clamp(shapeRegularity)
  missingCornersImpact = clamp(missingCornersImpact)
  spaceUtilization = clamp(spaceUtilization)
  circulationFlow = clamp(circulationFlow)
  qiGathering = clamp(qiGathering)
  centerPalace = clamp(centerPalace)
  
  addBreakdown(breakdown, '空间评分', '户型方正度', shapeRegularity, 0.2, '户型是否方正')
  addBreakdown(breakdown, '空间评分', '缺角影响', missingCornersImpact, 0.2, '缺角带来的影响')
  addBreakdown(breakdown, '空间评分', '空间利用率', spaceUtilization, 0.15, '空间利用效率')
  addBreakdown(breakdown, '空间评分', '动线流畅度', circulationFlow, 0.15, '人流动线是否顺畅')
  addBreakdown(breakdown, '空间评分', '聚气程度', qiGathering, 0.2, '气场是否能聚集')
  addBreakdown(breakdown, '空间评分', '中宫状态', centerPalace, 0.1, '中宫位置状态')
  
  return {
    shapeRegularity,
    missingCornersImpact,
    spaceUtilization,
    circulationFlow,
    qiGathering,
    centerPalace,
  }
}

// ============ 五行评分 ============

function calculateElementScores(input: ScoreEngineInput, breakdown: ScoreBreakdown[]): any {
  let wood = 50
  let fire = 50
  let earth = 50
  let metal = 50
  let water = 50
  let balance = 70
  let dominant: any = '土'
  let weakest: any = '木'
  let state: any = '平衡'
  
  if (input.features?.fiveElements) {
    wood = input.features.fiveElements.wood
    fire = input.features.fiveElements.fire
    earth = input.features.fiveElements.earth
    metal = input.features.fiveElements.metal
    water = input.features.fiveElements.water
    balance = input.features.fiveElements.balance
    dominant = input.features.fiveElements.dominant
    weakest = input.features.fiveElements.weakest
  }
  
  // 判断状态
  if (balance >= 85) state = '平衡'
  else if (balance >= 65) state = '偏旺'
  else if (balance >= 45) state = '偏弱'
  else if (balance >= 25) state = '过旺'
  else state = '过弱'
  
  addBreakdown(breakdown, '五行评分', '木', wood, 0.2, '木元素强弱')
  addBreakdown(breakdown, '五行评分', '火', fire, 0.2, '火元素强弱')
  addBreakdown(breakdown, '五行评分', '土', earth, 0.2, '土元素强弱')
  addBreakdown(breakdown, '五行评分', '金', metal, 0.2, '金元素强弱')
  addBreakdown(breakdown, '五行评分', '水', water, 0.2, '水元素强弱')
  
  return {
    wood,
    fire,
    earth,
    metal,
    water,
    dominant,
    weakest,
    balance,
    state,
  }
}

// ============ 运势评分 ============

function calculateFortuneScores(input: ScoreEngineInput, breakdown: ScoreBreakdown[]): any {
  let wealth = 60
  let career = 60
  let health = 65
  let relationship = 65
  let study = 60
  let benefactor = 55
  let population = 65
  
  if (input.features?.fortune) {
    wealth = input.features.fortune.wealth
    career = input.features.fortune.career
    health = input.features.fortune.health
    relationship = input.features.fortune.relationship
    study = input.features.fortune.study
    benefactor = input.features.fortune.benefactor
    population = input.features.fortune.population
  }
  
  const overall = Math.round(
    wealth * 0.2 + career * 0.15 + health * 0.2 + relationship * 0.15 +
    study * 0.1 + benefactor * 0.1 + population * 0.1
  )
  
  wealth = clamp(wealth)
  career = clamp(career)
  health = clamp(health)
  relationship = clamp(relationship)
  study = clamp(study)
  benefactor = clamp(benefactor)
  population = clamp(population)
  
  addBreakdown(breakdown, '运势评分', '财运', wealth, 0.2, '财运指数')
  addBreakdown(breakdown, '运势评分', '事业运', career, 0.15, '事业运指数')
  addBreakdown(breakdown, '运势评分', '健康运', health, 0.2, '健康运指数')
  addBreakdown(breakdown, '运势评分', '感情运', relationship, 0.15, '感情运指数')
  addBreakdown(breakdown, '运势评分', '学业运', study, 0.1, '学业运指数')
  addBreakdown(breakdown, '运势评分', '贵人运', benefactor, 0.1, '贵人运指数')
  addBreakdown(breakdown, '运势评分', '人丁运', population, 0.1, '人丁兴旺指数')
  
  return {
    wealth,
    career,
    health,
    relationship,
    study,
    benefactor,
    population,
    overall: clamp(overall),
  }
}

// ============ 房间评分 ============

function calculateRoomScores(input: ScoreEngineInput, breakdown: ScoreBreakdown[]): any {
  if (!input.rooms?.rooms || input.rooms.rooms.length === 0) {
    return {
      byRoom: [],
      bestRoom: { roomName: '无', score: 0 },
      worstRoom: { roomName: '无', score: 0 },
      average: 0,
    }
  }
  
  const rooms = input.rooms.rooms
    .map((r: any) => ({
      roomId: r.roomId,
      roomName: r.roomName,
      roomType: r.roomType,
      score: r.overallScore,
      rank: 0,
      isBest: false,
      isWorst: false,
    }))
    .sort((a: any, b: any) => b.score - a.score)
  
  // 设置排名
  rooms.forEach((r: any, i: number) => {
    r.rank = i + 1
  })
  
  if (rooms.length > 0) {
    rooms[0].isBest = true
    rooms[rooms.length - 1].isWorst = true
  }
  
  const bestRoom = rooms[0]
  const worstRoom = rooms[rooms.length - 1]
  const average = Math.round(rooms.reduce((sum: number, r: any) => sum + r.score, 0) / rooms.length)
  
  addBreakdown(breakdown, '房间评分', '房间均分', average, 0.15, '所有房间平均得分')
  addBreakdown(breakdown, '房间评分', '最佳房间', bestRoom.score, 0.05, `最佳：${bestRoom.roomName}`)
  
  return {
    byRoom: rooms,
    bestRoom: { roomName: bestRoom.roomName, score: bestRoom.score },
    worstRoom: { roomName: worstRoom.roomName, score: worstRoom.score },
    average,
  }
}

// ============ 综合总分 ============

function calculateOverallScore(
  dimensions: any,
  spatial: any,
  elements: any,
  fortune: any,
  breakdown: ScoreBreakdown[]
): any {
  const score = Math.round(
    dimensions.fengShui * 0.3 +
    spatial.qiGathering * 0.15 +
    dimensions.layout * 0.15 +
    fortune.overall * 0.2 +
    elements.balance * 0.1 +
    dimensions.comfort * 0.1
  )
  
  let grade: any = '平'
  if (score >= 90) grade = '大吉'
  else if (score >= 75) grade = '吉'
  else if (score >= 60) grade = '平'
  else if (score >= 40) grade = '小凶'
  else grade = '凶'
  
  let comment = ''
  if (score >= 90) comment = '上佳之宅，居住者运势昌隆，诸事顺遂。'
  else if (score >= 80) comment = '吉宅，整体风水良好，居住舒适，财运稳中有升。'
  else if (score >= 70) comment = '较好的住宅，有一定优势，需注意个别方面的改善。'
  else if (score >= 60) comment = '中等水平，有利有弊，可通过调整改善。'
  else if (score >= 50) comment = '稍有不足，存在一些风水问题，建议针对性改善。'
  else if (score >= 40) comment = '问题较多，需要重点改善多个方面。'
  else comment = '问题严重，建议找专业人士全面调整。'
  
  const percentile = Math.min(99, Math.max(1, score + Math.floor(Math.random() * 5) - 2))
  
  return {
    score: clamp(score),
    grade,
    comment,
    percentile,
  }
}

// ============ 可信度 ============

function calculateConfidence(input: ScoreEngineInput): any {
  let overall = 30
  const sources = {
    vision: 0,
    floorPlan: 0,
    spatial: 0,
    furniture: 0,
    room: 0,
    userInput: 0,
  }
  
  let dataCompleteness = 0
  
  if (input.spatial) {
    sources.vision = 70
    sources.floorPlan = 75
    sources.spatial = 80
    overall += 25
    dataCompleteness += 30
    
    if (input.spatial.furniture && input.spatial.furniture.length > 0) {
      sources.furniture = 65
      overall += 10
      dataCompleteness += 20
    }
  }
  
  if (input.rooms) {
    sources.room = 75
    overall += 15
    dataCompleteness += 25
  }
  
  if (input.features) {
    overall += 10
    dataCompleteness += 15
  }
  
  if (input.userProvided) {
    sources.userInput = 90
    overall += 10
    dataCompleteness += 10
  }
  
  overall = clamp(overall)
  dataCompleteness = clamp(dataCompleteness)
  
  let level: any = '中'
  if (overall >= 90) level = '极高'
  else if (overall >= 75) level = '高'
  else if (overall >= 50) level = '中'
  else if (overall >= 30) level = '低'
  else level = '极低'
  
  return {
    overall,
    sources,
    dataCompleteness,
    level,
  }
}

// ============ 工具函数 ============

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function addBreakdown(
  breakdown: ScoreBreakdown[],
  category: string,
  item: string,
  score: number,
  weight: number,
  description: string
) {
  breakdown.push({
    category,
    item,
    score,
    weight,
    weightedScore: Math.round(score * weight),
    description,
    isPositive: score >= 60,
    source: 'score-engine',
  })
}
