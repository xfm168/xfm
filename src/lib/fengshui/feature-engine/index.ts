/**
 * Feature Engine - 环境特征引擎
 * 
 * 负责提取环境特征，所有 Rule 都读取 Feature，而不是自己分析。
 * 
 * 特征提取来源：
 * - Vision Engine（视觉识别）
 * - FloorPlan Engine（户型分析）
 * - Spatial Engine（空间关系）
 * - Furniture Engine（家具识别）
 * - Room Engine（房间分析）
 */

import type { EnvironmentalFeatures } from './types'
import type { SpatialAnalysisResult } from '../spatial/types'
import type { HouseRoomAnalysisResult } from '../room-engine/types'

/**
 * 特征引擎输入
 */
export interface FeatureEngineInput {
  spatial?: SpatialAnalysisResult
  rooms?: HouseRoomAnalysisResult
  /** 用户提供的补充信息 */
  userProvided?: {
    houseType?: string
    totalArea?: number
    floor?: number
    totalFloors?: number
    orientation?: string
  }
}

/**
 * 提取所有环境特征
 */
export function extractFeatures(input: FeatureEngineInput): EnvironmentalFeatures {
  return {
    yinYang: extractYinYangFeatures(input),
    fiveElements: extractFiveElementFeatures(input),
    lighting: extractLightingFeatures(input),
    ventilation: extractVentilationFeatures(input),
    spatial: extractSpatialFeatures(input),
    qi: extractQiFeatures(input),
    environment: extractEnvironmentFeatures(input),
    fortune: extractFortuneFeatures(input),
    overall: calculateOverallFeatures(input),
    sources: calculateSourceInfo(input),
  }
}

// ============ 阴阳五行特征 ============

function extractYinYangFeatures(input: FeatureEngineInput): EnvironmentalFeatures['yinYang'] {
  let yang = 50
  let yin = 50
  
  // 采光影响阴阳
  if (input.rooms) {
    const lightingAvg = input.rooms.dimensionSummary.lighting
    yang = 40 + lightingAvg * 0.4
    yin = 100 - yang
  }
  
  // 空间大小影响
  if (input.userProvided?.totalArea) {
    const area = input.userProvided.totalArea
    if (area > 150) {
      yin += 5  // 大房子偏阴
    } else if (area < 60) {
      yang += 5 // 小房子偏阳
    }
  }
  
  // 楼层影响
  if (input.userProvided?.floor && input.userProvided?.totalFloors) {
    const ratio = input.userProvided.floor / input.userProvided.totalFloors
    if (ratio > 0.7) {
      yang += 5 // 高层偏阳
    } else if (ratio < 0.3) {
      yin += 5 // 低层偏阴
    }
  }
  
  // 归一化
  const total = yang + yin
  yang = (yang / total) * 100
  yin = 100 - yang
  
  // 计算平衡度
  const diff = Math.abs(yang - yin)
  const balance = Math.max(0, 100 - diff * 2)
  
  // 判断状态
  let state: EnvironmentalFeatures['yinYang']['state'] = '平衡'
  if (diff < 10) state = '平衡'
  else if (yang > yin && diff < 25) state = '偏阳'
  else if (yin > yang && diff < 25) state = '偏阴'
  else if (yang > yin) state = '阳极'
  else state = '阴极'
  
  return {
    yang: Math.round(yang),
    yin: Math.round(yin),
    balance: Math.round(balance),
    state,
  }
}

function extractFiveElementFeatures(input: FeatureEngineInput): EnvironmentalFeatures['fiveElements'] {
  // 基础五行
  let wood = 30
  let fire = 30
  let earth = 40
  let metal = 30
  let water = 30
  
  // 从采光推断火元素
  if (input.rooms) {
    const lighting = input.rooms.dimensionSummary.lighting
    fire += (lighting - 50) * 0.3
  }
  
  // 从通风推断水元素
  if (input.rooms) {
    const ventilation = input.rooms.dimensionSummary.ventilation
    water += (ventilation - 50) * 0.2
  }
  
  // 从空间感推断土元素
  if (input.rooms) {
    earth += (input.rooms.dimensionSummary.layout - 50) * 0.2
  }
  
  // 从户型方正度推断金元素
  if (input.spatial?.house.shape) {
    const shape = input.spatial.house.shape
    if (shape === 'square') {
      metal += 10
      earth += 10
    } else if (shape === 'rectangle') {
      metal += 5
    } else if (shape === 'irregular') {
      metal -= 10
    }
  }
  
  // 木元素：从植物/采光推断
  if (input.spatial?.furniture.filter(f => f.type === 'plant')) {
    const plantCount = input.spatial.furniture.filter(f => f.type === 'plant').length
    wood += plantCount * 5
  }
  
  // 归一化到 0-100
  const elements = { wood, fire, earth, metal, water }
  const max = Math.max(...Object.values(elements))
  const min = Math.min(...Object.values(elements))
  const range = max - min || 1
  
  for (const key of Object.keys(elements) as (keyof typeof elements)[]) {
    elements[key] = 20 + ((elements[key] - min) / range) * 60
  }
  
  // 找旺/弱
  const entries = Object.entries(elements) as [keyof typeof elements, number][]
  entries.sort((a, b) => b[1] - a[1])
  const dominant = entries[0][0]
  const weakest = entries[entries.length - 1][0]
  
  // 计算平衡度
  const values = Object.values(elements)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
  const balance = Math.max(0, 100 - Math.sqrt(variance) * 2)
  
  return {
    wood: Math.round(wood),
    fire: Math.round(fire),
    earth: Math.round(earth),
    metal: Math.round(metal),
    water: Math.round(water),
    dominant: dominant as any,
    weakest: weakest as any,
    balance: Math.round(balance),
    relations: {
      generating: [],
      controlling: [],
    },
  }
}

// ============ 采光通风特征 ============

function extractLightingFeatures(input: FeatureEngineInput): EnvironmentalFeatures['lighting'] {
  let overall = 60
  let naturalLightRatio = 70
  let uniformity = 70
  let durationHours = 4
  let mainDirection: any = 'south'
  let hasDarkRoom = false
  let darkRooms: string[] = []
  
  if (input.rooms) {
    overall = input.rooms.dimensionSummary.lighting
    
    // 检查暗室
    for (const room of input.rooms.rooms) {
      if (room.dimensionScores.lighting < 40) {
        hasDarkRoom = true
        darkRooms.push(room.roomName)
      }
    }
    
    // 估算光照时长
    if (overall > 80) durationHours = 6
    else if (overall > 60) durationHours = 4
    else durationHours = 2
  }
  
  if (input.userProvided?.orientation) {
    mainDirection = input.userProvided.orientation
  }
  
  return {
    overall: Math.round(overall),
    naturalLightRatio: Math.round(naturalLightRatio),
    uniformity: Math.round(uniformity),
    durationHours,
    mainDirection,
    hasDarkRoom,
    darkRooms,
  }
}

function extractVentilationFeatures(input: FeatureEngineInput): EnvironmentalFeatures['ventilation'] {
  let overall = 60
  let airFlowSpeed: EnvironmentalFeatures['ventilation']['airFlowSpeed'] = '中'
  let hasCrossVentilation = false
  let crossVentilationStrength = 0
  let deadZones = 0
  let humidity = 50
  
  if (input.rooms) {
    overall = input.rooms.dimensionSummary.ventilation
  }
  
  // 穿堂风检测
  if (input.spatial?.spatialSha.some(s => s.type === 'chuan-tang-sha')) {
    hasCrossVentilation = true
    const sha = input.spatial.spatialSha.find(s => s.type === 'chuan-tang-sha')
    crossVentilationStrength = sha?.confidence || 50
    
    if (crossVentilationStrength > 80) {
      airFlowSpeed = '过快'
    } else if (crossVentilationStrength > 60) {
      airFlowSpeed = '快'
    }
  }
  
  // 湿度估算
  if (overall > 80) {
    humidity = 40 // 通风好，湿度低
  } else if (overall < 40) {
    humidity = 70 // 通风差，湿度高
  }
  
  return {
    overall: Math.round(overall),
    airFlowSpeed,
    hasCrossVentilation,
    crossVentilationStrength: Math.round(crossVentilationStrength),
    deadZones,
    humidity: Math.round(humidity),
  }
}

// ============ 空间感特征 ============

function extractSpatialFeatures(input: FeatureEngineInput): EnvironmentalFeatures['spatial'] {
  let overallSpaciousness = 60
  let openness = 65
  let oppression = 30
  let ceilingHeight: EnvironmentalFeatures['spatial']['ceilingHeight'] = '中'
  let shapeRegularity = 70
  let circulationFlow = 65
  let spaceUtilization = 60
  
  if (input.spatial?.house.shape) {
    const shape = input.spatial.house.shape
    if (shape === 'square') {
      shapeRegularity = 95
      overallSpaciousness += 10
    } else if (shape === 'rectangle') {
      shapeRegularity = 85
      overallSpaciousness += 5
    } else if (shape === 'L-shape') {
      shapeRegularity = 60
      overallSpaciousness -= 5
    } else {
      shapeRegularity = 40
      overallSpaciousness -= 10
      oppression += 15
    }
  }
  
  // 缺角影响
  if (input.spatial?.house.missingCorners) {
    const missingCount = input.spatial.house.missingCorners.length
    shapeRegularity -= missingCount * 8
    oppression += missingCount * 5
  }
  
  // 面积影响
  if (input.userProvided?.totalArea) {
    const area = input.userProvided.totalArea
    if (area > 150) {
      overallSpaciousness += 10
      openness += 10
      oppression -= 10
    } else if (area < 60) {
      overallSpaciousness -= 15
      openness -= 15
      oppression += 20
    }
  }
  
  // 楼层影响层高感
  if (input.userProvided?.floor && input.userProvided?.totalFloors) {
    const ratio = input.userProvided.floor / input.userProvided.totalFloors
    if (ratio > 0.7) {
      ceilingHeight = '高'
      openness += 5
    } else if (ratio < 0.3) {
      ceilingHeight = '低'
      oppression += 10
    }
  }
  
  return {
    overallSpaciousness: Math.max(0, Math.min(100, Math.round(overallSpaciousness))),
    openness: Math.max(0, Math.min(100, Math.round(openness))),
    oppression: Math.max(0, Math.min(100, Math.round(oppression))),
    ceilingHeight,
    shapeRegularity: Math.max(0, Math.min(100, Math.round(shapeRegularity))),
    circulationFlow: Math.max(0, Math.min(100, Math.round(circulationFlow))),
    spaceUtilization: Math.max(0, Math.min(100, Math.round(spaceUtilization))),
  }
}

// ============ 聚气藏风特征 ============

function extractQiFeatures(input: FeatureEngineInput): EnvironmentalFeatures['qi'] {
  let gathering = 60
  let storing = 60
  let receiving = 65
  let stability = 65
  let flowState: EnvironmentalFeatures['qi']['flowState'] = '适中'
  let mingTang = 60
  let backing = 55
  
  // 户型方正 → 聚气
  if (input.spatial?.house.shape) {
    if (input.spatial.house.shape === 'square' || input.spatial.house.shape === 'rectangle') {
      gathering += 15
      storing += 15
      stability += 15
    } else {
      gathering -= 10
      stability -= 10
    }
  }
  
  // 缺角 → 气散
  if (input.spatial?.house.missingCorners) {
    const missingCount = input.spatial.house.missingCorners.length
    gathering -= missingCount * 8
    storing -= missingCount * 5
    stability -= missingCount * 10
  }
  
  // 穿堂风 → 气不聚
  if (input.spatial?.spatialSha.some(s => s.type === 'chuan-tang-sha')) {
    gathering -= 20
    storing -= 15
    flowState = '过快'
    mingTang -= 10
  }
  
  // 采光好 → 纳气好
  if (input.rooms?.dimensionSummary.lighting) {
    const lighting = input.rooms.dimensionSummary.lighting
    receiving += (lighting - 50) * 0.2
    if (lighting > 70) mingTang += 10
  }
  
  // 靠山（简化：北方有靠）
  if (input.spatial?.house.sittingDirection === 'north') {
    backing += 20
    storing += 10
  }
  
  // 计算综合状态
  if (gathering < 30) flowState = '散乱'
  else if (gathering < 50) flowState = '过快'
  else if (gathering < 60) flowState = '缓慢'
  else if (gathering > 80) flowState = '停滞'
  
  return {
    gathering: Math.max(0, Math.min(100, Math.round(gathering))),
    storing: Math.max(0, Math.min(100, Math.round(storing))),
    receiving: Math.max(0, Math.min(100, Math.round(receiving))),
    stability: Math.max(0, Math.min(100, Math.round(stability))),
    flowState,
    mingTang: Math.max(0, Math.min(100, Math.round(mingTang))),
    backing: Math.max(0, Math.min(100, Math.round(backing))),
  }
}

// ============ 环境因素特征 ============

function extractEnvironmentFeatures(input: FeatureEngineInput): EnvironmentalFeatures['environment'] {
  return {
    noiseLevel: 40,
    dustLevel: 35,
    temperatureComfort: 70,
    humidityComfort: 65,
    airQuality: 70,
    externalView: '一般',
    buildingDistance: '中',
    hasSkyCutter: false,
    hasWallKnife: false,
    hasRoadChong: !!input.spatial?.spatialSha.some(s => s.type.includes('lu-chong')),
    hasFanGong: !!input.spatial?.spatialSha.some(s => s.type.includes('fan-gong')),
  }
}

// ============ 运势特征 ============

function extractFortuneFeatures(input: FeatureEngineInput): EnvironmentalFeatures['fortune'] {
  // 从各维度推算运势
  let wealth = 60
  let health = 65
  let career = 60
  let relationship = 65
  let study = 60
  let benefactor = 55
  let population = 65
  
  // 聚气 → 财运
  if (input.spatial) {
    // 简化：用空间信息推算
    const shape = input.spatial.house.shape
    if (shape === 'square' || shape === 'rectangle') {
      wealth += 10
      career += 5
      health += 5
    }
  }
  
  // 采光 → 健康、事业
  if (input.rooms?.dimensionSummary.lighting) {
    const lighting = input.rooms.dimensionSummary.lighting
    health += (lighting - 50) * 0.2
    career += (lighting - 50) * 0.15
    study += (lighting - 50) * 0.1
  }
  
  // 通风 → 健康
  if (input.rooms?.dimensionSummary.ventilation) {
    const vent = input.rooms.dimensionSummary.ventilation
    health += (vent - 50) * 0.15
  }
  
  // 缺角 → 影响对应运势
  if (input.spatial?.house.missingCorners) {
    for (const corner of input.spatial.house.missingCorners) {
      switch (corner.direction) {
        case 'northeast':
          study -= 10
          benefactor -= 5
          break
        case 'southeast':
          wealth -= 10
          relationship -= 5
          break
        case 'northwest':
          career -= 10
          benefactor -= 10
          break
        case 'southwest':
          relationship -= 10
          health -= 5
          break
      }
    }
  }
  
  const overall = Math.round((wealth + health + career + relationship + study + benefactor + population) / 7)
  
  return {
    wealth: Math.max(0, Math.min(100, Math.round(wealth))),
    health: Math.max(0, Math.min(100, Math.round(health))),
    career: Math.max(0, Math.min(100, Math.round(career))),
    relationship: Math.max(0, Math.min(100, Math.round(relationship))),
    study: Math.max(0, Math.min(100, Math.round(study))),
    benefactor: Math.max(0, Math.min(100, Math.round(benefactor))),
    population: Math.max(0, Math.min(100, Math.round(population))),
    overall: Math.max(0, Math.min(100, overall)),
  }
}

// ============ 综合特征 ============

function calculateOverallFeatures(input: FeatureEngineInput): EnvironmentalFeatures['overall'] {
  const features = extractFeaturesForOverall(input)
  
  const score = Math.round(
    features.qi.gathering * 0.2 +
    features.lighting.overall * 0.15 +
    features.ventilation.overall * 0.1 +
    features.spatial.shapeRegularity * 0.15 +
    features.yinYang.balance * 0.1 +
    features.fiveElements.balance * 0.1 +
    features.fortune.overall * 0.2
  )
  
  let grade: EnvironmentalFeatures['overall']['grade'] = '平'
  if (score >= 90) grade = '大吉'
  else if (score >= 75) grade = '吉'
  else if (score >= 60) grade = '平'
  else if (score >= 40) grade = '小凶'
  else grade = '凶'
  
  const strengths: string[] = []
  const issues: string[] = []
  
  if (features.qi.gathering > 70) strengths.push('聚气良好，财运稳定')
  if (features.qi.gathering < 40) issues.push('气不聚，财运难守')
  
  if (features.lighting.overall > 80) strengths.push('采光充足，阳气旺盛')
  if (features.lighting.overall < 40) issues.push('采光不足，阴气偏重')
  
  if (features.spatial.shapeRegularity > 80) strengths.push('户型方正，气场稳定')
  if (features.spatial.shapeRegularity < 50) issues.push('户型不方正，气场不稳')
  
  if (features.yinYang.state === '平衡') strengths.push('阴阳平衡')
  if (features.yinYang.state === '阳极' || features.yinYang.state === '阴极') {
    issues.push(`阴阳${features.yinYang.state === '阳极' ? '过旺' : '过盛'}，需调和`)
  }
  
  const summary = generateSummary(score, grade, strengths, issues)
  
  return {
    score,
    grade,
    strengths,
    issues,
    summary,
  }
}

function extractFeaturesForOverall(input: FeatureEngineInput) {
  return {
    qi: extractQiFeatures(input),
    lighting: extractLightingFeatures(input),
    ventilation: extractVentilationFeatures(input),
    spatial: extractSpatialFeatures(input),
    yinYang: extractYinYangFeatures(input),
    fiveElements: extractFiveElementFeatures(input),
    fortune: extractFortuneFeatures(input),
  }
}

function generateSummary(score: number, grade: string, strengths: string[], issues: string[]): string {
  const parts: string[] = []
  parts.push(`综合评分${score}分（${grade}）`)
  
  if (strengths.length > 0) {
    parts.push(`优势：${strengths.slice(0, 2).join('，')}`)
  }
  
  if (issues.length > 0) {
    parts.push(`需注意：${issues.slice(0, 2).join('，')}`)
  }
  
  return parts.join('，') + '。'
}

// ============ 来源信息 ============

function calculateSourceInfo(input: FeatureEngineInput): EnvironmentalFeatures['sources'] {
  return {
    fromVision: !!input.spatial,
    fromFloorPlan: !!input.spatial?.house.outline,
    fromSpatial: !!input.spatial,
    fromFurniture: !!input.spatial?.furniture,
    fromRoom: !!input.rooms,
    confidence: 70, // 基础置信度
  }
}
