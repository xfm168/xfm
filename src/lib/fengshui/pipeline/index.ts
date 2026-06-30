/**
 * FengShui Pipeline - 完整分析流程
 * 
 * 串通所有 Engine，形成完整闭环。
 * 
 * 流程：
 * Vision → FloorPlan → Spatial → Furniture → Room → Feature → Rule → Score → Knowledge → Explain → AI Report
 */

import { analyzeSpatial, type SpatialEngineInput } from '../spatial'
import { analyzeHouseRooms, type RoomEngineInput } from '../room-engine'
import { extractFeatures, type FeatureEngineInput } from '../feature-engine'
import { calculateScore, type ScoreEngineInput } from '../score-engine'
import { executeRules, type RuleExecutionInput } from '../rules/executor'
import { knowledgeBase, generateExplain, ragQuery } from '../knowledge'
import type { FengShuiRuleResult } from '../rules/types'

// ============ Pipeline 输入 ============

export interface PipelineInput {
  /** 图片数据（Base64 或 URL） */
  image?: string
  /** 户型图数据 */
  floorPlan?: {
    outline: { x: number; y: number }[]
    rooms?: { id: string; name: string; points: { x: number; y: number }[] }[]
    doors?: { position: { x: number; y: number }; direction: string }[]
    windows?: { position: { x: number; y: number }; direction: string }[]
  }
  /** 用户输入 */
  userInput?: {
    totalArea?: number
    floor?: number
    totalFloors?: number
    orientation?: string
    houseType?: string
    buildingAge?: number
  }
  /** 可选的预设数据（用于测试或直接分析） */
  presetData?: {
    spatial?: SpatialEngineInput
    rooms?: RoomEngineInput[]
  }
}

// ============ Pipeline 输出 ============

export interface PipelineResult {
  /** 处理状态 */
  status: 'success' | 'error' | 'partial'
  /** 处理步骤 */
  steps: PipelineStep[]
  /** 空间分析结果 */
  spatial: SpatialResult | null
  /** 房间分析结果 */
  rooms: RoomsResult | null
  /** 环境特征 */
  features: FeaturesResult | null
  /** 规则执行结果 */
  rules: RulesResult | null
  /** 评分结果 */
  score: ScoreResult | null
  /** 报告 */
  report: FullReport | null
  /** 错误信息 */
  error?: string
  /** 处理时间（毫秒） */
  processingTime: number
}

export interface PipelineStep {
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  startTime?: number
  endTime?: number
  error?: string
}

export interface SpatialResult {
  /** 房屋信息 */
  house: {
    shape: string
    orientation: string
    sittingDirection: string
    totalArea: number
    usableArea: number
    hasMissingCorners: boolean
    missingCorners: string[]
  }
  /** 门数量 */
  doorCount: number
  /** 窗数量 */
  windowCount: number
  /** 家具数量 */
  furnitureCount: number
  /** 空间煞气 */
  shaQi: {
    type: string
    severity: string
    description: string
  }[]
}

export interface RoomsResult {
  /** 房间列表 */
  rooms: {
    roomId: string
    roomName: string
    roomType: string
    score: number
    issues: { type: string; description: string; severity: string }[]
    strengths: string[]
  }[]
  /** 综合评分 */
  overallScore: number
  /** 最佳房间 */
  bestRoom: { name: string; score: number }
  /** 最差房间 */
  worstRoom: { name: string; score: number }
}

export interface FeaturesResult {
  yinYang: { yang: number; yin: number; state: string; balance: number }
  fiveElements: { wood: number; fire: number; earth: number; metal: number; water: number; dominant: string; weakest: string; balance: number }
  lighting: { overall: number; hasDarkRoom: boolean }
  ventilation: { overall: number; hasCrossVentilation: boolean }
  qi: { gathering: number; storing: number; receiving: number; flowState: string }
  fortune: { wealth: number; health: number; career: number; relationship: number; overall: number }
}

export interface RulesResult {
  /** 执行总数 */
  total: number
  /** 通过数 */
  passed: number
  /** 失败数 */
  failed: number
  /** 详情 */
  details: {
    ruleId: string
    ruleName: string
    passed: boolean
    score: number
    explanation: string
  }[]
}

export interface ScoreResult {
  overall: { score: number; grade: string; comment: string; percentile: number }
  dimensions: { lighting: number; ventilation: number; spaciousness: number; layout: number; fengShui: number }
  fortune: { wealth: number; health: number; career: number; relationship: number; overall: number }
  elements: { wood: number; fire: number; earth: number; metal: number; water: number; balance: number }
  confidence: { overall: number; level: string; dataCompleteness: number }
}

export interface FullReport {
  /** 综合评分 */
  summary: {
    score: number
    grade: string
    percentile: number
    title: string
    description: string
  }
  /** 房屋概况 */
  houseOverview: {
    shape: string
    orientation: string
    totalArea: number
    rooms: number
    doors: number
    windows: number
    furniture: number
  }
  /** 房间评分 */
  roomScores: {
    roomName: string
    score: number
    rank: number
    isBest: boolean
    isWorst: boolean
    issues: string[]
  }[]
  /** 家具布局 */
  furnitureLayout: {
    total: number
    issues: { furniture: string; issue: string; suggestion: string }[]
    strengths: string[]
  }
  /** 风险问题 */
  risks: {
    type: string
    severity: string
    description: string
    location: string
    suggestion: string
    reference?: string
  }[]
  /** 古籍依据 */
  classicalReferences: {
    book: string
    chapter: string
    quote: string
    modernExplanation: string
  }[]
  /** AI 解释 */
  aiExplanation: {
    overview: string
    strengths: string[]
    issues: string[]
  }
  /** 改善建议 */
  suggestions: {
    priority: 'urgent' | 'important' | 'minor'
    category: string
    description: string
    expectedEffect: string
  }[]
  /** 可优化方案 */
  optimizations: {
    category: string
    currentState: string
    optimizedState: string
    difficulty: 'easy' | 'medium' | 'hard'
    estimatedCost: 'low' | 'medium' | 'high'
  }[]
}

// ============ Pipeline 执行 ============

/**
 * 执行完整分析流程
 */
export async function executePipeline(input: PipelineInput): Promise<PipelineResult> {
  const startTime = Date.now()
  const steps: PipelineStep[] = []
  
  // 初始化步骤
  const stepNames = [
    'spatial-analysis',
    'room-analysis', 
    'feature-extraction',
    'rule-execution',
    'score-calculation',
    'report-generation',
  ]
  
  for (const name of stepNames) {
    steps.push({ name, status: 'pending' })
  }
  
  let status: PipelineResult['status'] = 'success'
  let spatialResult: SpatialResult | null = null
  let roomsResult: RoomsResult | null = null
  let featuresResult: FeaturesResult | null = null
  let rulesResult: RulesResult | null = null
  let scoreResult: ScoreResult | null = null
  let report: FullReport | null = null
  
  try {
    // ============ Step 1: 空间分析 ============
    steps[0].status = 'running'
    steps[0].startTime = Date.now()
    
    const spatialInput = buildSpatialInput(input)
    const spatialData = analyzeSpatial(spatialInput)
    
    spatialResult = {
      house: {
        shape: spatialData.house.shape as string,
        orientation: spatialData.house.orientation as string,
        sittingDirection: spatialData.house.sittingDirection as string,
        totalArea: spatialData.house.totalArea,
        usableArea: spatialData.house.usableArea,
        hasMissingCorners: spatialData.house.missingCorners.length > 0,
        missingCorners: spatialData.house.missingCorners.map(c => `${c.direction}角(${c.severity})`),
      },
      doorCount: spatialData.doors.length,
      windowCount: spatialData.windows.length,
      furnitureCount: spatialData.furniture.length,
      shaQi: spatialData.spatialSha.map(s => ({
        type: s.type,
        severity: s.severity,
        description: s.description,
      })),
    }
    
    steps[0].status = 'completed'
    steps[0].endTime = Date.now()
    
    // ============ Step 2: 房间分析 ============
    steps[1].status = 'running'
    steps[1].startTime = Date.now()
    
    const roomInputs = buildRoomInputs(spatialData, input)
    const roomData = analyzeHouseRooms(roomInputs)
    
    roomsResult = {
      rooms: roomData.rooms.map(r => ({
        roomId: r.roomId,
        roomName: r.roomName,
        roomType: r.roomType,
        score: r.overallScore,
        issues: r.issues.map(i => ({
          type: i.type,
          description: i.description,
          severity: i.severity,
        })),
        strengths: r.strengths,
      })),
      overallScore: roomData.overallScore,
      bestRoom: roomData.roomRanking[0] || { name: '无', score: 0 },
      worstRoom: roomData.roomRanking[roomData.roomRanking.length - 1] || { name: '无', score: 0 },
    }
    
    steps[1].status = 'completed'
    steps[1].endTime = Date.now()
    
    // ============ Step 3: 特征提取 ============
    steps[2].status = 'running'
    steps[2].startTime = Date.now()
    
    const featuresData = extractFeatures({
      spatial: spatialData,
      rooms: roomData,
      userProvided: input.userInput,
    })
    
    featuresResult = {
      yinYang: {
        yang: featuresData.yinYang.yang,
        yin: featuresData.yinYang.yin,
        state: featuresData.yinYang.state,
        balance: featuresData.yinYang.balance,
      },
      fiveElements: {
        wood: featuresData.fiveElements.wood,
        fire: featuresData.fiveElements.fire,
        earth: featuresData.fiveElements.earth,
        metal: featuresData.fiveElements.metal,
        water: featuresData.fiveElements.water,
        dominant: featuresData.fiveElements.dominant as string,
        weakest: featuresData.fiveElements.weakest as string,
        balance: featuresData.fiveElements.balance,
      },
      lighting: {
        overall: featuresData.lighting.overall,
        hasDarkRoom: featuresData.lighting.hasDarkRoom,
      },
      ventilation: {
        overall: featuresData.ventilation.overall,
        hasCrossVentilation: featuresData.ventilation.hasCrossVentilation,
      },
      qi: {
        gathering: featuresData.qi.gathering,
        storing: featuresData.qi.storing,
        receiving: featuresData.qi.receiving,
        flowState: featuresData.qi.flowState,
      },
      fortune: {
        wealth: featuresData.fortune.wealth,
        health: featuresData.fortune.health,
        career: featuresData.fortune.career,
        relationship: featuresData.fortune.relationship,
        overall: featuresData.fortune.overall,
      },
    }
    
    steps[2].status = 'completed'
    steps[2].endTime = Date.now()
    
    // ============ Step 4: 规则执行 ============
    steps[3].status = 'running'
    steps[3].startTime = Date.now()
    
    const ruleContext = buildRuleContext(spatialData, roomData, featuresData)
    const ruleResults = executeRules({ context: ruleContext })
    
    rulesResult = {
      total: ruleResults.length,
      passed: ruleResults.filter(r => r.matched).length,
      failed: ruleResults.filter(r => !r.matched).length,
      details: ruleResults.map(r => ({
        ruleId: r.ruleId,
        ruleName: r.ruleName,
        passed: r.matched,
        score: r.score,
        explanation: r.explanation || '',
      })),
    }
    
    steps[3].status = 'completed'
    steps[3].endTime = Date.now()
    
    // ============ Step 5: 评分计算 ============
    steps[4].status = 'running'
    steps[4].startTime = Date.now()
    
    const scoreData = calculateScore({
      features: featuresData,
      spatial: spatialData,
      rooms: roomData,
      ruleResults,
      userProvided: input.userInput,
    })
    
    scoreResult = {
      overall: {
        score: scoreData.overall.score,
        grade: scoreData.overall.grade as string,
        comment: scoreData.overall.comment,
        percentile: scoreData.overall.percentile,
      },
      dimensions: {
        lighting: scoreData.dimensions.lighting,
        ventilation: scoreData.dimensions.ventilation,
        spaciousness: scoreData.dimensions.spaciousness,
        layout: scoreData.dimensions.layout,
        fengShui: scoreData.dimensions.fengShui,
      },
      fortune: {
        wealth: scoreData.fortune.wealth,
        health: scoreData.fortune.health,
        career: scoreData.fortune.career,
        relationship: scoreData.fortune.relationship,
        overall: scoreData.fortune.overall,
      },
      elements: {
        wood: scoreData.elements.wood,
        fire: scoreData.elements.fire,
        earth: scoreData.elements.earth,
        metal: scoreData.elements.metal,
        water: scoreData.elements.water,
        balance: scoreData.elements.balance,
      },
      confidence: {
        overall: scoreData.confidence.overall,
        level: scoreData.confidence.level as string,
        dataCompleteness: scoreData.confidence.dataCompleteness,
      },
    }
    
    steps[4].status = 'completed'
    steps[4].endTime = Date.now()
    
    // ============ Step 6: 报告生成 ============
    steps[5].status = 'running'
    steps[5].startTime = Date.now()
    
    report = generateFullReport(
      spatialResult,
      roomsResult,
      featuresResult,
      rulesResult,
      scoreResult
    )
    
    steps[5].status = 'completed'
    steps[5].endTime = Date.now()
    
  } catch (error) {
    status = 'error'
    const currentStep = steps.find(s => s.status === 'running')
    if (currentStep) {
      currentStep.status = 'error'
      currentStep.error = error instanceof Error ? error.message : 'Unknown error'
    }
  }
  
  return {
    status,
    steps,
    spatial: spatialResult,
    rooms: roomsResult,
    features: featuresResult,
    rules: rulesResult,
    score: scoreResult,
    report,
    processingTime: Date.now() - startTime,
  }
}

// ============ 辅助函数 ============

function buildSpatialInput(input: PipelineInput): SpatialEngineInput {
  if (input.presetData?.spatial) {
    return input.presetData.spatial
  }
  
  // 从 floorPlan 构建
  if (input.floorPlan?.outline) {
    return {
      outline: input.floorPlan.outline,
      orientation: input.userInput?.orientation as any || 'south',
      floorInfo: {
        currentFloor: input.userInput?.floor || 1,
        totalFloors: input.userInput?.totalFloors || 1,
        buildingType: input.userInput?.houseType as any || 'apartment',
        houseAge: input.userInput?.buildingAge || 10,
      },
      doors: (input.floorPlan.doors || []).map((d, i) => ({
        id: `door-${i}`,
        type: i === 0 ? 'main-entrance' as const : 'secondary' as const,
        position: d.position,
        direction: d.direction as any,
        width: 1,
        height: 2,
        isOpen: true,
      })),
      windows: (input.floorPlan.windows || []).map((w, i) => ({
        id: `window-${i}`,
        type: 'normal' as const,
        position: w.position,
        direction: w.direction as any,
        width: 1,
        height: 1.5,
        area: 1.5,
      })),
      furniture: [],
    }
  }
  
  // 默认测试数据
  return getDefaultSpatialInput()
}

function buildRoomInputs(spatialData: any, input: PipelineInput): RoomEngineInput[] {
  if (input.presetData?.rooms) {
    return input.presetData.rooms
  }
  
  // 从空间数据推断房间
  const rooms: RoomEngineInput[] = []
  
  // 简单根据朝向和位置推断房间类型
  const mainDoor = spatialData.doors.find((d: any) => d.type === 'main-entrance')
  
  rooms.push({
    roomId: 'living-1',
    roomType: 'living',
    roomName: '客厅',
    spatial: {
      area: 25,
      width: 5,
      depth: 5,
      shape: 'square',
      direction: spatialData.house.orientation,
      position: 'south' as any,
      hasWindow: true,
      hasBalcony: true,
      windowCount: 2,
      doorCount: 1,
    },
    furniture: spatialData.furniture.filter((f: any) => f.roomId === 'living').map((f: any) => ({
      id: f.id,
      type: f.type,
      name: f.name,
      position: { x: f.boundingBox.x / 200, y: f.boundingBox.y / 200 },
      direction: f.direction,
      size: f.size,
      material: f.material,
    })),
    doors: spatialData.doors.filter((d: any) => d.roomTo === 'living').map((d: any) => ({
      id: d.id,
      type: 'main' as const,
      position: d.position,
      direction: d.direction,
      width: d.width,
    })),
    windows: spatialData.windows.filter((w: any) => w.type === 'balcony').map((w: any) => ({
      id: w.id,
      type: 'french' as const,
      position: w.position,
      direction: w.direction,
      width: w.width,
      height: w.height,
    })),
    structural: [],
    relations: [],
  })
  
  rooms.push({
    roomId: 'bedroom-1',
    roomType: 'bedroom',
    roomName: '卧室',
    spatial: {
      area: 15,
      width: 4,
      depth: 3.75,
      shape: 'rectangle',
      direction: 'east' as any,
      position: 'east' as any,
      hasWindow: true,
      hasBalcony: false,
      windowCount: 1,
      doorCount: 1,
    },
    furniture: spatialData.furniture.filter((f: any) => f.roomId === 'bedroom').map((f: any) => ({
      id: f.id,
      type: f.type,
      name: f.name,
      position: { x: f.boundingBox.x / 200, y: f.boundingBox.y / 200 },
      direction: f.direction,
      size: f.size,
      material: f.material,
    })),
    doors: spatialData.doors.filter((d: any) => d.roomTo === 'bedroom').map((d: any) => ({
      id: d.id,
      type: 'main' as const,
      position: d.position,
      direction: d.direction,
      width: d.width,
    })),
    windows: spatialData.windows.filter((w: any) => w.type !== 'balcony').map((w: any) => ({
      id: w.id,
      type: 'normal' as const,
      position: w.position,
      direction: w.direction,
      width: w.width,
      height: w.height,
    })),
    structural: spatialData.furniture.filter((f: any) => f.type === 'beam').map((f: any) => ({
      id: f.id,
      type: 'beam' as const,
      position: { x: f.boundingBox.x / 200, y: f.boundingBox.y / 200 },
      size: { width: f.boundingBox.width / 200, height: f.boundingBox.height / 200 },
    })),
    relations: [],
  })
  
  rooms.push({
    roomId: 'kitchen-1',
    roomType: 'kitchen',
    roomName: '厨房',
    spatial: {
      area: 8,
      width: 3,
      depth: 2.7,
      shape: 'rectangle',
      direction: 'west' as any,
      position: 'west' as any,
      hasWindow: true,
      hasBalcony: false,
      windowCount: 1,
      doorCount: 1,
    },
    furniture: spatialData.furniture.filter((f: any) => f.roomId === 'kitchen').map((f: any) => ({
      id: f.id,
      type: f.type,
      name: f.name,
      position: { x: f.boundingBox.x / 200, y: f.boundingBox.y / 200 },
      direction: f.direction,
      size: f.size,
      material: f.material,
    })),
    doors: spatialData.doors.filter((d: any) => d.roomTo === 'kitchen').map((d: any) => ({
      id: d.id,
      type: 'main' as const,
      position: d.position,
      direction: d.direction,
      width: d.width,
    })),
    windows: spatialData.windows.filter((w: any) => w.roomId === 'kitchen').map((w: any) => ({
      id: w.id,
      type: 'normal' as const,
      position: w.position,
      direction: w.direction,
      width: w.width,
      height: w.height,
    })),
    structural: [],
    relations: [],
  })
  
  rooms.push({
    roomId: 'bathroom-1',
    roomType: 'bathroom',
    roomName: '卫生间',
    spatial: {
      area: 5,
      width: 2.5,
      depth: 2,
      shape: 'rectangle',
      direction: 'north' as any,
      position: 'center' as any,
      hasWindow: false,
      hasBalcony: false,
      windowCount: 0,
      doorCount: 1,
    },
    furniture: spatialData.furniture.filter((f: any) => f.roomId === 'bathroom').map((f: any) => ({
      id: f.id,
      type: f.type,
      name: f.name,
      position: { x: f.boundingBox.x / 200, y: f.boundingBox.y / 200 },
      direction: f.direction,
      size: f.size,
      material: f.material,
    })),
    doors: spatialData.doors.filter((d: any) => d.roomTo === 'bathroom').map((d: any) => ({
      id: d.id,
      type: 'main' as const,
      position: d.position,
      direction: d.direction,
      width: d.width,
    })),
    windows: [],
    structural: [],
    relations: [],
  })
  
  return rooms
}

function buildRuleContext(spatialData: any, roomData: any, featuresData: any): any {
  return {
    direction: {
      mainDirection: spatialData.house.orientation,
      facingDirection: spatialData.house.sittingDirection,
    },
    layout: {
      shape: spatialData.house.shape,
      missingCorners: spatialData.house.missingCorners,
    },
    rooms: roomData.rooms.map((r: any) => ({
      roomId: r.roomId,
      roomType: r.roomType,
      score: r.score,
    })),
    elementDistribution: {
      木: featuresData.fiveElements.wood,
      火: featuresData.fiveElements.fire,
      土: featuresData.fiveElements.earth,
      金: featuresData.fiveElements.metal,
      水: featuresData.fiveElements.water,
    },
    spatial: spatialData,
    features: featuresData,
  }
}

function generateFullReport(
  spatial: SpatialResult,
  rooms: RoomsResult,
  features: FeaturesResult,
  rules: RulesResult,
  score: ScoreResult
): FullReport {
  // 生成风险列表
  const risks: FullReport['risks'] = []
  
  if (spatial.shaQi.length > 0) {
    for (const sha of spatial.shaQi) {
      risks.push({
        type: sha.type,
        severity: sha.severity,
        description: sha.description,
        location: '全屋',
        suggestion: getDefaultSuggestion(sha.type),
        reference: knowledgeBase.search(sha.type)[0]?.id,
      })
    }
  }
  
  for (const room of rooms.rooms) {
    for (const issue of room.issues) {
      risks.push({
        type: issue.type,
        severity: issue.severity,
        description: issue.description,
        location: room.roomName,
        suggestion: getDefaultSuggestion(issue.type),
      })
    }
  }
  
  // 生成古籍依据
  const classicalReferences: FullReport['classicalReferences'] = []
  const uniqueBooks = new Set<string>()
  
  for (const rule of rules.details.slice(0, 5)) {
    if (!rule.ruleName) continue
    const kb = knowledgeBase.search(rule.ruleName)
    for (const item of kb.slice(0, 2)) {
      if (!uniqueBooks.has(item.book)) {
        uniqueBooks.add(item.book)
        classicalReferences.push({
          book: item.book,
          chapter: item.chapter || '',
          quote: item.original || item.translation || '',
          modernExplanation: item.modern || '',
        })
      }
    }
  }
  
  // 生成改善建议
  const suggestions: FullReport['suggestions'] = []
  
  for (const risk of risks) {
    if (risk.severity === 'severe') {
      suggestions.push({
        priority: 'urgent',
        category: risk.type,
        description: risk.suggestion,
        expectedEffect: '化解煞气，提升运势',
      })
    } else if (risk.severity === 'moderate') {
      suggestions.push({
        priority: 'important',
        category: risk.type,
        description: risk.suggestion,
        expectedEffect: '改善风水，减少负面影响',
      })
    } else {
      suggestions.push({
        priority: 'minor',
        category: risk.type,
        description: risk.suggestion,
        expectedEffect: '优化细节，提升舒适度',
      })
    }
  }
  
  // 生成可优化方案
  const optimizations: FullReport['optimizations'] = []
  
  if (features.lighting.overall < 70) {
    optimizations.push({
      category: '采光优化',
      currentState: `当前采光评分 ${features.lighting.overall} 分`,
      optimizedState: '增加自然采光，改善室内光线',
      difficulty: 'medium',
      estimatedCost: 'medium',
    })
  }
  
  if (features.ventilation.hasCrossVentilation) {
    optimizations.push({
      category: '通风优化',
      currentState: '存在穿堂风，财运难聚',
      optimizedState: '设置玄关或屏风，减缓气流',
      difficulty: 'easy',
      estimatedCost: 'low',
    })
  }
  
  if (features.qi.gathering < 60) {
    optimizations.push({
      category: '聚气优化',
      currentState: `聚气评分 ${features.qi.gathering} 分`,
      optimizedState: '增加绿植、摆件，增强气场',
      difficulty: 'easy',
      estimatedCost: 'low',
    })
  }
  
  return {
    summary: {
      score: score.overall.score,
      grade: score.overall.grade,
      percentile: score.overall.percentile,
      title: getGradeTitle(score.overall.grade),
      description: score.overall.comment,
    },
    houseOverview: {
      shape: spatial.house.shape,
      orientation: spatial.house.orientation,
      totalArea: spatial.house.totalArea,
      rooms: rooms.rooms.length,
      doors: spatial.doorCount,
      windows: spatial.windowCount,
      furniture: spatial.furnitureCount,
    },
    roomScores: rooms.rooms.map((r, i) => ({
      roomName: r.roomName,
      score: r.score,
      rank: i + 1,
      isBest: r.roomName === rooms.bestRoom.name,
      isWorst: r.roomName === rooms.worstRoom.name,
      issues: r.issues.map(i => i.description),
    })),
    furnitureLayout: {
      total: spatial.furnitureCount,
      issues: [],
      strengths: rooms.rooms.flatMap(r => r.strengths).slice(0, 5),
    },
    risks: risks.slice(0, 10),
    classicalReferences: classicalReferences.slice(0, 6),
    aiExplanation: {
      overview: `本住宅综合风水评分${score.overall.score}分，属${score.overall.grade}。${score.overall.comment}`,
      strengths: rooms.rooms.flatMap(r => r.strengths).slice(0, 5),
      issues: risks.slice(0, 5).map(r => r.description),
    },
    suggestions: suggestions.slice(0, 8),
    optimizations: optimizations.slice(0, 5),
  }
}

function getDefaultSuggestion(type: string): string {
  const suggestions: Record<string, string> = {
    'chuan-tang-sha': '设置玄关柜或屏风，阻挡气流直冲',
    'men-chong-chuang': '调整床位或设置隔断',
    'liang-ya-ding': '吊顶遮挡横梁',
    'jing-zhao-chuang': '移动镜子或用布帘遮挡',
    'ce-ya-zhong-gong': '保持卫生间清洁干燥，加强排气',
    'lighting': '增加照明设备',
    'ventilation': '加强通风换气',
    'position': '调整家具位置或布局',
  }
  return suggestions[type] || '根据具体情况调整'
}

function getGradeTitle(grade: string): string {
  const titles: Record<string, string> = {
    '大吉': '紫气东来，福泽满堂',
    '吉': '风水宝地，吉祥如意',
    '平': '中规中矩，平稳之宅',
    '小凶': '略有瑕疵，宜加调整',
    '凶': '风水欠佳，需重点改善',
  }
  return titles[grade] || '综合评估'
}

function getDefaultSpatialInput(): SpatialEngineInput {
  return {
    outline: [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 1000 },
      { x: 0, y: 1000 },
    ],
    orientation: 'south',
    floorInfo: {
      currentFloor: 15,
      totalFloors: 30,
      buildingType: 'apartment',
      houseAge: 5,
    },
    doors: [
      { id: 'door-main', type: 'main-entrance', position: { x: 500, y: 0 }, direction: 'south', width: 1.2, height: 2.1, isOpen: true },
      { id: 'door-bedroom', type: 'bedroom-door', position: { x: 200, y: 300 }, direction: 'east', width: 0.9, height: 2.1, isOpen: true, roomFrom: 'living', roomTo: 'bedroom' },
      { id: 'door-kitchen', type: 'kitchen-door', position: { x: 800, y: 300 }, direction: 'west', width: 0.9, height: 2.1, isOpen: true, roomFrom: 'living', roomTo: 'kitchen' },
    ],
    windows: [
      { id: 'window-balcony', type: 'balcony', position: { x: 500, y: 1000 }, direction: 'north', width: 3, height: 2.5, area: 7.5 },
      { id: 'window-bedroom', type: 'normal', position: { x: 100, y: 500 }, direction: 'west', width: 1.5, height: 1.8, area: 2.7 },
    ],
    furniture: [
      { id: 'bed-1', type: 'bed', name: '床', roomId: 'bedroom', boundingBox: { x: 150, y: 400, width: 200, height: 200 }, direction: 'east', size: 'large', material: '木' },
      { id: 'sofa-1', type: 'sofa', name: '沙发', roomId: 'living', boundingBox: { x: 350, y: 600, width: 300, height: 100 }, direction: 'north', size: 'large', material: '木' },
      { id: 'stove-1', type: 'stove', name: '灶台', roomId: 'kitchen', boundingBox: { x: 850, y: 500, width: 80, height: 60 }, direction: 'west', size: 'medium', material: '火' },
      { id: 'sink-1', type: 'sink', name: '水槽', roomId: 'kitchen', boundingBox: { x: 900, y: 600, width: 60, height: 50 }, direction: 'west', size: 'medium', material: '水' },
      { id: 'beam-1', type: 'beam', name: '横梁', roomId: 'bedroom', boundingBox: { x: 100, y: 450, width: 300, height: 30 }, direction: 'north', size: 'large' },
      { id: 'mirror-1', type: 'bedroom-mirror', name: '镜子', roomId: 'bedroom', boundingBox: { x: 300, y: 300, width: 60, height: 100 }, direction: 'west', size: 'medium', material: '金' },
    ],
  }
}
