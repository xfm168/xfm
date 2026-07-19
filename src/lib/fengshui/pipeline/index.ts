/**
 * FengShui Pipeline V4.1 - 完整分析流程（统一入口）
 * 
 * 严格按照 V4.1 规范，唯一 Pipeline：
 * 图片 → Vision → FloorPlan → Spatial → Furniture → Room → Feature → Rule → Score → Knowledge → Explain → Report
 * 
 * 任何模块禁止绕过 Pipeline。
 * AI 永远不能直接判断。
 */

import type { 
  FengShuiContext, 
  FengShuiResult, 
  ImageQualityCheck,
} from '../types'
import type {
  ImageAnalysisResult,
  FengShuiReport,
} from '../imageAnalyzer'
import { analyzeImage } from '../aiImageAnalyzer'
import { analyzeFloorPlan } from '../floor-plan'
import { analyzeSpatial } from '../spatial'
import { analyzeHouseRooms } from '../room-engine'
import { extractFeatures } from '../feature-engine'
import { executeRules } from '../rules/executor'
import { ALL_RULES } from '../rules'
import { calculateScore, calculateScore8D } from '../score-engine'
import type { Score8DResult } from '../score-engine/types'
import { knowledgeBase, generateExplain } from '../knowledge'
import { buildEvidenceChains } from '../evidenceChain'
import type { EvidenceChain } from '../evidenceChain'
import { checkImageQuality } from '../utils/imageQuality'
import { generateCacheKey, getCache, setCache } from '../utils/cache'
import { buildProfessionalReport, toPipelineReport, calculateAnalysisConfidence } from './professionalReport'
import type { ProfessionalFengShuiReport } from '../types'

// ============ Pipeline 步骤定义 ============

export interface PipelineStep {
  id: string
  name: string
  icon: string
  status: 'pending' | 'running' | 'completed' | 'error'
  progress: number
  startTime?: number
  endTime?: number
  error?: string
}

export const PIPELINE_STEPS: Omit<PipelineStep, 'status' | 'progress'>[] = [
  { id: 'observing-form', name: '正在观形', icon: '👁️' },
  { id: 'observing-layout', name: '正在察势', icon: '📐' },
  { id: 'analyzing-layout', name: '分析空间布局', icon: '🛋️' },
  { id: 'deducing-qi', name: '推演气场', icon: '✨' },
  { id: 'organizing-advice', name: '整理建议', icon: '📊' },
  { id: 'generating-report', name: '生成勘测结果', icon: '📝' },
]

// ============ Pipeline 输入输出 ============

export interface PipelineInput {
  /** 图片数据（Base64） */
  imageData: string
  /** 已加载的 HTMLImageElement（优先使用，避免重复解码） */
  imageElement?: HTMLImageElement
  /** 已加载的 ImageBitmap（最高优先级） */
  imageBitmap?: ImageBitmap
  /** 房间类型（可选） */
  roomType?: string
  /** 用户补充信息 */
  userInfo?: {
    totalArea?: number
    floor?: number
    totalFloors?: number
    orientation?: string
    houseType?: string
    buildingAge?: number
  }
  /** 分析模式 */
  mode?: 'quick' | 'standard' | 'deep'
  /** 进度回调 */
  onProgress?: (step: PipelineStep, overallProgress: number) => void
}

export interface PipelineOutput {
  /** 状态 */
  status: 'success' | 'error' | 'partial'
  /** 总耗时（ms） */
  totalTime: number
  /** 各步骤详情 */
  steps: PipelineStep[]
  /** 图像识别结果 */
  visionResult?: ImageAnalysisResult
  /** 户型分析结果 */
  floorPlanResult?: any
  /** 空间分析结果 */
  spatialResult?: any
  /** 房间分析结果 */
  roomResult?: any
  /** 特征提取结果 */
  featureResult?: any
  /** 规则执行结果 */
  ruleResult?: any
  /** 评分结果 */
  scoreResult?: FengShuiResult
  /** 八维评分结果 */
  score8D?: Score8DResult
  /** 证据链 */
  evidenceChains?: EvidenceChain[]
  /** 完整报告 */
  report?: PipelineReport
  /** 专业报告（V3.0） */
  professionalReport?: ProfessionalFengShuiReport
  /** 图片质量检测结果 */
  imageQuality?: ImageQualityCheck
  /** 错误信息 */
  error?: string
}

export interface PipelineReport {
  /** 报告标题 */
  title: string
  /** 12章节固定模板 */
  sections: ReportSection[]
  /** 综合评分 */
  overallScore: number
  /** 置信度 */
  confidence: number
}

export interface ReportSection {
  id: string
  title: string
  order: number
  type: 'summary' | 'info' | 'analysis' | 'risk' | 'evidence' | 'suggestion' | 'warning'
  content: string
  data?: any
}

// ============ Pipeline 主函数 ============

/**
 * 执行完整 Pipeline（图片 → 报告）
 */
export async function runFullPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const startTime = Date.now()
  const steps: PipelineStep[] = PIPELINE_STEPS.map(s => ({
    ...s,
    status: 'pending' as const,
    progress: 0,
  }))

  let visionResult: ImageAnalysisResult | undefined
  let floorPlanResult: any
  let spatialResult: any
  let roomResult: any
  let featureResult: any
  let ruleResult: any
  let scoreResult: FengShuiResult | undefined
  let score8D: Score8DResult | undefined
  let evidenceChains: EvidenceChain[] | undefined
  let report: PipelineReport | undefined
  let professionalReport: ProfessionalFengShuiReport | undefined
  let imageQuality: ImageQualityCheck | undefined
  let error: string | undefined
  let status: PipelineOutput['status'] = 'success'

  const updateStep = (stepId: string, update: Partial<PipelineStep>) => {
    const step = steps.find(s => s.id === stepId)
    if (step) {
      Object.assign(step, update)
      const overallProgress = calculateOverallProgress(steps)
      input.onProgress?.({ ...step }, overallProgress)
    }
  }

  // ============ V3.0: 缓存检查 ============
  const cacheKey = generateCacheKey(input.imageData, input.roomType || '')
  const cached = getCache<PipelineOutput>(cacheKey)
  if (cached) {
    return {
      ...cached,
      totalTime: Date.now() - startTime,
      status: 'success',
    }
  }

  // ============ V3.0: 图片质量预检 ============
  imageQuality = checkImageQuality(input.imageData)

  try {
    // ============ Step 1: 正在观形 (Vision) ============
    updateStep('observing-form', { status: 'running', progress: 0, startTime: Date.now() })

    visionResult = await runVisionStep(input)

    updateStep('observing-form', { status: 'completed', progress: 100, endTime: Date.now() })

    // ============ Step 2: 正在察势 (FloorPlan + Spatial) ============
    updateStep('observing-layout', { status: 'running', progress: 0, startTime: Date.now() })

    floorPlanResult = await runFloorPlanStep(input, visionResult)
    updateStep('observing-layout', { status: 'running', progress: 50 })

    spatialResult = runSpatialStep(floorPlanResult, visionResult, input)

    updateStep('observing-layout', { status: 'completed', progress: 100, endTime: Date.now() })

    // ============ Step 3: 分析空间布局 (Furniture + Room) ============
    updateStep('analyzing-layout', { status: 'running', progress: 0, startTime: Date.now() })

    const furnitureResult = runFurnitureStep(visionResult)
    updateStep('analyzing-layout', { status: 'running', progress: 50 })

    roomResult = runRoomStep(spatialResult, furnitureResult, visionResult)

    updateStep('analyzing-layout', { status: 'completed', progress: 100, endTime: Date.now() })

    // ============ Step 4: 推演气场 (Feature + Rule) ============
    updateStep('deducing-qi', { status: 'running', progress: 0, startTime: Date.now() })

    featureResult = runFeatureStep(spatialResult, roomResult, input)
    updateStep('deducing-qi', { status: 'running', progress: 50 })

    ruleResult = runRuleStep(featureResult, roomResult, spatialResult)

    updateStep('deducing-qi', { status: 'completed', progress: 100, endTime: Date.now() })

    // ============ Step 5: 整理建议 (Score + Knowledge) ============
    updateStep('organizing-advice', { status: 'running', progress: 0, startTime: Date.now() })

    scoreResult = runScoreStep(ruleResult, featureResult, roomResult, spatialResult)

    // V3.0: 八维评分
    try {
      score8D = calculateScore8D({
        features: featureResult,
        spatial: spatialResult,
        rooms: roomResult,
        ruleResults: ruleResult,
        userProvided: input.userInfo,
      })
    } catch {
      // 降级：使用原有评分映射
      score8D = legacyTo8D(scoreResult)
    }

    updateStep('organizing-advice', { status: 'running', progress: 60 })

    evidenceChains = runKnowledgeStep(ruleResult)

    updateStep('organizing-advice', { status: 'completed', progress: 100, endTime: Date.now() })

    // ============ Step 6: 生成勘测结果 (Report) ============
    updateStep('generating-report', { status: 'running', progress: 0, startTime: Date.now() })

    // V3.0: 计算分析可信度
    const confidence = calculateAnalysisConfidence({
      imageQualityScore: imageQuality?.overallScore ?? 70,
      visionDetectedCount: visionResult?.detectedObjects?.length ?? 0,
      ruleMatchCount: ruleResult?.results?.length ?? 0,
      hasUserInput: !!input.userInfo,
      analysisDurationMs: Date.now() - startTime,
    })

    // V3.0: 生成专业报告
    try {
      professionalReport = buildProfessionalReport({
        scoreResult,
        score8D,
        evidenceChains,
        visionResult,
        roomResult,
        ruleResult,
        confidence,
      })
      // 转换为兼容格式
      report = toPipelineReport(professionalReport, visionResult)
    } catch {
      // 降级到原有报告生成
      report = runReportStep(scoreResult, evidenceChains, visionResult, roomResult, ruleResult)
    }

    updateStep('generating-report', { status: 'completed', progress: 100, endTime: Date.now() })

  } catch (err) {
    status = 'error'
    error = err instanceof Error ? err.message : 'Pipeline execution failed'
    
    // 标记当前运行中的步骤为错误
    const currentStep = steps.find(s => s.status === 'running')
    if (currentStep) {
      currentStep.status = 'error'
      currentStep.error = error
      currentStep.endTime = Date.now()
    }
  }

  const output: PipelineOutput = {
    status,
    totalTime: Date.now() - startTime,
    steps,
    visionResult,
    floorPlanResult,
    spatialResult,
    roomResult,
    featureResult,
    ruleResult,
    scoreResult,
    score8D,
    evidenceChains,
    report,
    professionalReport,
    imageQuality,
    error,
  }

  // V3.0: 写入缓存（仅成功时）
  if (status === 'success' && cacheKey) {
    setCache(cacheKey, output)
  }

  return output
}

// ============ V3.0 降级辅助函数 ============

function legacyTo8D(scoreResult: FengShuiResult | undefined): any {
  const s = scoreResult
  return {
    dimensions: {
      pattern: { score: s?.layoutScore ?? 70, maxScore: 100, weight: 20, weightedScore: 14, level: 'good', description: '基于传统评分映射', factors: [] },
      windGathering: { score: s?.environmentScore ?? 70, maxScore: 100, weight: 15, weightedScore: 10, level: 'good', description: '基于传统评分映射', factors: [] },
      qiGathering: { score: s?.overallScore ?? 70, maxScore: 100, weight: 15, weightedScore: 10, level: 'good', description: '基于传统评分映射', factors: [] },
      mingHall: { score: s?.directionScore ?? 70, maxScore: 100, weight: 10, weightedScore: 7, level: 'good', description: '基于传统评分映射', factors: [] },
      flowPath: { score: s?.roomScore ?? 70, maxScore: 100, weight: 10, weightedScore: 7, level: 'good', description: '基于传统评分映射', factors: [] },
      lighting: { score: s?.environmentScore ?? 70, maxScore: 100, weight: 10, weightedScore: 7, level: 'good', description: '基于传统评分映射', factors: [] },
      elementHarmony: { score: s?.elementScore ?? 70, maxScore: 100, weight: 10, weightedScore: 7, level: 'good', description: '基于传统评分映射', factors: [] },
      advice: { score: s?.overallScore ?? 70, maxScore: 100, weight: 10, weightedScore: 7, level: 'good', description: '基于传统评分映射', factors: [] },
    },
    overallScore: s?.overallScore ?? 70,
    overallLevel: (s?.overallScore ?? 70) >= 85 ? 'excellent' : (s?.overallScore ?? 70) >= 70 ? 'good' : (s?.overallScore ?? 70) >= 50 ? 'fair' : 'poor',
    summary: '基于传统评分的兼容映射。',
  }
}

// ============ 各步骤实现 ============

async function runVisionStep(input: PipelineInput): Promise<ImageAnalysisResult> {
  const result = await analyzeImage({
    imageData: input.imageData,
    analysisType: input.mode === 'quick' ? 'room' : 'full',
    options: {
      roomType: input.roomType,
      includeDirections: true,
      includeElementAnalysis: true,
    },
  })
  
  return result
}

async function runFloorPlanStep(input: PipelineInput, visionResult: ImageAnalysisResult): Promise<any> {
  try {
    // 尝试用 FloorPlan Engine 分析
    const floorPlan = await analyzeFloorPlan(input.imageData, {
      depth: input.mode === 'deep' ? 'detailed' : 'standard',
    })
    return floorPlan
  } catch {
    // 如果 FloorPlan 失败，用 Vision 结果填充
    return {
      outline: [],
      rooms: [],
      centerPoint: { x: 50, y: 50 },
      orientation: visionResult.roomInfo?.mainDirection || 'south',
      confidence: visionResult.overallConfidence || 60,
    }
  }
}

function runSpatialStep(floorPlanResult: any, visionResult: ImageAnalysisResult, input: PipelineInput): any {
  const doors = buildDoorsFromVision(visionResult)
  const windows = buildWindowsFromVision(visionResult)
  const furniture = buildFurnitureFromVision(visionResult)
  
  try {
    return analyzeSpatial({
      outline: floorPlanResult?.outline || [],
      orientation: visionResult.roomInfo?.mainDirection || 'south',
      floorInfo: {
        currentFloor: inputOrDefault(input, i => i.userInfo?.floor, 1),
        totalFloors: inputOrDefault(input, i => i.userInfo?.totalFloors, 30),
        buildingType: 'apartment' as any,
        houseAge: inputOrDefault(input, i => i.userInfo?.buildingAge, 10),
      },
      doors,
      windows,
      furniture,
    })
  } catch {
    return {
      house: {
        shape: visionResult.roomInfo?.shape || 'rectangle',
        orientation: visionResult.roomInfo?.mainDirection || 'south',
        sittingDirection: getOppositeDirection(visionResult.roomInfo?.mainDirection || 'south'),
        totalArea: null,
        usableArea: null,
        missingCorners: [],
      },
      doors,
      windows,
      furniture,
      spatialSha: [],
      spatialJi: [],
    }
  }
}

function runFurnitureStep(visionResult: ImageAnalysisResult): any {
  const furniture = visionResult.furniture || []
  return {
    total: furniture.length,
    items: furniture,
    byType: groupFurnitureByType(furniture),
    byRoom: groupFurnitureByRoom(furniture),
  }
}

function runRoomStep(spatialResult: any, furnitureResult: any, visionResult: ImageAnalysisResult): any {
  try {
    const roomInputs = buildRoomInputs(spatialResult, furnitureResult, visionResult)
    return analyzeHouseRooms(roomInputs)
  } catch {
    // 降级：用 vision 结果构建基础房间信息
    const roomType = visionResult.roomInfo?.type || 'living'
    return {
      rooms: [{
        roomId: 'main',
        roomType,
        roomName: roomTypeToName(roomType),
        overallScore: 70,
        issues: [],
        strengths: [],
      }],
      overallScore: 70,
      roomRanking: [{ name: roomTypeToName(roomType), score: 70 }],
    }
  }
}

function runFeatureStep(spatialResult: any, roomResult: any, input: PipelineInput): any {
  try {
    return extractFeatures({
      spatial: spatialResult,
      rooms: roomResult,
      userProvided: input.userInfo,
    })
  } catch {
    // 降级：返回基础特征
    return {
      yinYang: { yang: 60, yin: 40, state: '偏阳', balance: 80 },
      fiveElements: { wood: 3, fire: 2, earth: 2, metal: 2, water: 2, dominant: 'wood', weakest: 'water', balance: 70 },
      lighting: { overall: 75, hasDarkRoom: false },
      ventilation: { overall: 70, hasCrossVentilation: false },
      qi: { gathering: 70, storing: 65, receiving: 75, flowState: 'balanced' },
      fortune: { wealth: 70, health: 75, career: 70, relationship: 72, overall: 72 },
    }
  }
}

function runRuleStep(featureResult: any, roomResult: any, spatialResult: any): any {
  try {
    // 构建 Rule Engine 输入
    const context = buildRuleContext(spatialResult, roomResult, featureResult)
    const results = executeRules({ context })
    return results
  } catch {
    // 降级：返回空结果
    return []
  }
}

function runScoreStep(
  ruleResult: any, 
  featureResult: any, 
  roomResult: any, 
  spatialResult: any
): FengShuiResult {
  try {
    const result = calculateScore({
      features: featureResult,
      spatial: spatialResult,
      rooms: roomResult,
      ruleResults: ruleResult,
    })
    
    // 转换为 FengShuiResult 格式
    const overallScore = result.overall?.score || 70
    const confidenceVal = typeof result.confidence === 'object' 
      ? (result.confidence as any).overall || 65 
      : (result.confidence as number) || 65
    
    return {
      overallScore,
      confidence: confidenceVal,
      directionScore: result.dimensions?.fengShui || 70,
      layoutScore: result.dimensions?.layout || 70,
      roomScore: result.rooms?.average || 70,
      elementScore: result.elements?.balance || 70,
      environmentScore: result.dimensions?.comfort || 70,
      strengths: [],
      weaknesses: [],
      warnings: [],
      suggestions: [],
      hitRules: [],
      context: {} as any,
    } as any
  } catch {
    // 降级：用特征数据估算分数
    const overallScore = featureResult?.fortune?.overall || 70
    return {
      overallScore,
      confidence: 65,
      directionScore: 70,
      layoutScore: 70,
      roomScore: 70,
      elementScore: 70,
      environmentScore: 70,
      strengths: [],
      weaknesses: [],
      warnings: [],
      suggestions: [],
      hitRules: [],
      context: {} as any,
    } as unknown as FengShuiResult
  }
}

function runKnowledgeStep(ruleResult: any): EvidenceChain[] {
  try {
    const allResults = Array.isArray(ruleResult) 
      ? ruleResult 
      : (ruleResult?.matchedRules || ruleResult?.results || ruleResult?.details || [])
    
    const matchedRules = allResults
      .filter((r: any) => r.matched && r.type !== 'neutral')
      .map((r: any) => {
        const ruleId = r.ruleId || r.id
        const rule = ALL_RULES.find(ru => ru.id === ruleId)
        if (!rule) return null
        return rule
      })
      .filter(Boolean)
    
    return buildEvidenceChains(matchedRules as any[])
  } catch {
    return []
  }
}

function runReportStep(
  scoreResult: FengShuiResult,
  evidenceChains: EvidenceChain[],
  visionResult: ImageAnalysisResult,
  roomResult: any,
  ruleResult: any
): PipelineReport {
  const sections: ReportSection[] = []
  
  // ① 综合评分
  sections.push({
    id: 'overall-score',
    title: '一、综合评分',
    order: 1,
    type: 'summary',
    data: {
      overallScore: scoreResult.overallScore,
      confidence: scoreResult.confidence,
      level: getScoreLevel(scoreResult.overallScore),
      directionScore: scoreResult.directionScore,
      layoutScore: scoreResult.layoutScore,
      roomScore: scoreResult.roomScore,
      elementScore: scoreResult.elementScore,
      environmentScore: scoreResult.environmentScore,
      strengths: scoreResult.strengths?.slice(0, 5) || [],
      weaknesses: scoreResult.weaknesses?.slice(0, 5) || [],
    },
    content: generateOverallScoreContent(scoreResult),
  })
  
  // ② 房屋概况
  sections.push({
    id: 'house-info',
    title: '二、房屋概况',
    order: 2,
    type: 'info',
    data: visionResult?.roomInfo || {},
    content: generateHouseInfoContent(visionResult),
  })
  
  // ③ 户型分析
  sections.push({
    id: 'layout-analysis',
    title: '三、户型分析',
    order: 3,
    type: 'analysis',
    data: { layoutScore: scoreResult.layoutScore },
    content: generateLayoutAnalysisContent(scoreResult, roomResult),
  })
  
  // ④ 房间分析
  sections.push({
    id: 'room-analysis',
    title: '四、房间分析',
    order: 4,
    type: 'analysis',
    data: roomResult,
    content: generateRoomAnalysisContent(roomResult),
  })
  
  // ⑤ 空间分析
  sections.push({
    id: 'spatial-analysis',
    title: '五、空间分析',
    order: 5,
    type: 'analysis',
    data: {},
    content: generateSpatialAnalysisContent(scoreResult),
  })
  
  // ⑥ 家具分析
  sections.push({
    id: 'furniture-analysis',
    title: '六、家具分析',
    order: 6,
    type: 'analysis',
    data: { furniture: visionResult?.furniture || [] },
    content: generateFurnitureAnalysisContent(visionResult),
  })
  
  // ⑦ 风险问题
  sections.push({
    id: 'risk-issues',
    title: '七、风险问题',
    order: 7,
    type: 'risk',
    data: { warnings: scoreResult.warnings || [] },
    content: generateRiskIssuesContent(scoreResult, evidenceChains),
  })
  
  // ⑧ 古籍依据
  sections.push({
    id: 'classical-evidence',
    title: '八、古籍依据',
    order: 8,
    type: 'evidence',
    data: { evidenceChains },
    content: generateClassicalEvidenceContent(evidenceChains),
  })
  
  // ⑨ AI解读
  sections.push({
    id: 'ai-interpretation',
    title: '九、AI解读',
    order: 9,
    type: 'analysis',
    data: {},
    content: generateAIInterpretationContent(scoreResult),
  })
  
  // ⑩ 整改方案
  sections.push({
    id: 'improvement-plan',
    title: '十、整改方案',
    order: 10,
    type: 'suggestion',
    data: { suggestions: scoreResult.suggestions || [] },
    content: generateImprovementPlanContent(scoreResult, evidenceChains),
  })
  
  // ⑪ 预计提升
  sections.push({
    id: 'expected-improvement',
    title: '十一、预计提升',
    order: 11,
    type: 'suggestion',
    data: {},
    content: generateExpectedImprovementContent(scoreResult, evidenceChains),
  })
  
  // ⑫ 注意事项
  sections.push({
    id: 'cautions',
    title: '十二、注意事项',
    order: 12,
    type: 'warning',
    data: {},
    content: generateCautionsContent(),
  })
  
  return {
    title: `${visionResult?.roomInfo?.type || '房屋'}风水分析报告`,
    sections,
    overallScore: scoreResult.overallScore,
    confidence: scoreResult.confidence,
  }
}

// ============ 辅助函数 ============

function calculateOverallProgress(steps: PipelineStep[]): number {
  const completedWeight = steps.reduce((acc, s) => {
    if (s.status === 'completed') return acc + 10
    if (s.status === 'running') return acc + (s.progress / 100) * 10
    return acc
  }, 0)
  return Math.round((completedWeight / (steps.length * 10)) * 100)
}

function buildDoorsFromVision(visionResult: ImageAnalysisResult): any[] {
  const detected = visionResult.detectedObjects?.filter((o: any) => 
    o.type?.includes('door') || o.label?.includes('门')
  ) || []
  
  if (detected.length > 0) {
    return detected.map((d: any, i: number) => ({
      id: `door-${i}`,
      type: i === 0 ? 'main-entrance' as const : 'secondary' as const,
      position: { x: d.bbox?.x || 50, y: d.bbox?.y || 50 },
      direction: 'south' as any,
      width: 1,
      height: 2.1,
      isOpen: true,
    }))
  }
  
  return [
    { id: 'door-main', type: 'main-entrance' as const, position: { x: 50, y: 0 }, direction: 'south' as any, width: 1.2, height: 2.1, isOpen: true },
  ]
}

function buildWindowsFromVision(visionResult: ImageAnalysisResult): any[] {
  const detected = visionResult.detectedObjects?.filter((o: any) => 
    o.type?.includes('window') || o.label?.includes('窗')
  ) || []
  
  if (detected.length > 0) {
    return detected.map((w: any, i: number) => ({
      id: `window-${i}`,
      type: 'normal' as const,
      position: { x: w.bbox?.x || 50, y: w.bbox?.y || 50 },
      direction: 'south' as any,
      width: 1.5,
      height: 1.8,
      area: 2.7,
    }))
  }
  
  if (visionResult.roomInfo?.hasNaturalLight) {
    return [
      { id: 'window-1', type: 'normal' as const, position: { x: 50, y: 100 }, direction: 'south' as any, width: 2, height: 1.8, area: 3.6 },
    ]
  }
  
  return []
}

function buildFurnitureFromVision(visionResult: ImageAnalysisResult): any[] {
  const furniture = visionResult.furniture || []
  return furniture.map((f: any, i: number) => ({
    id: f.id || `furn-${i}`,
    type: f.type || 'other',
    name: f.name || f.type || '家具',
    roomId: f.roomType || 'main',
    boundingBox: {
      x: f.position?.x || 50,
      y: f.position?.y || 50,
      width: f.size || 20,
      height: f.size || 20,
    },
    direction: 'south',
    size: 'medium',
    material: f.material || 'wood',
  }))
}

function buildRoomInputs(spatialResult: any, furnitureResult: any, visionResult: ImageAnalysisResult): any[] {
  const roomType = visionResult.roomInfo?.type || 'living'
  
  return [{
    roomId: 'main',
    roomType,
    roomName: roomTypeToName(roomType),
    spatial: {
      area: 20,
      width: 5,
      depth: 4,
      shape: visionResult.roomInfo?.shape || 'rectangle',
      direction: visionResult.roomInfo?.mainDirection || 'south',
      position: 'south' as any,
      hasWindow: visionResult.roomInfo?.hasNaturalLight || false,
      hasBalcony: false,
      windowCount: spatialResult?.windows?.length || 1,
      doorCount: spatialResult?.doors?.length || 1,
    },
    furniture: furnitureResult?.items?.filter((f: any) => f.roomType === roomType) || [],
    doors: spatialResult?.doors || [],
    windows: spatialResult?.windows || [],
    structural: [],
    relations: [],
  }]
}

function buildRuleContext(spatialData: any, roomData: any, featuresData: any): any {
  return {
    direction: {
      mainDirection: spatialData?.house?.orientation || 'south',
      facingDirection: spatialData?.house?.sittingDirection || 'north',
    },
    layout: {
      shape: spatialData?.house?.shape || 'rectangle',
      missingCorners: spatialData?.house?.missingCorners || [],
    },
    rooms: roomData?.rooms?.map((r: any) => ({
      roomId: r.roomId,
      roomType: r.roomType,
      score: r.overallScore || 70,
    })) || [],
    elementDistribution: {
      '木': featuresData?.fiveElements?.wood || 3,
      '火': featuresData?.fiveElements?.fire || 2,
      '土': featuresData?.fiveElements?.earth || 2,
      '金': featuresData?.fiveElements?.metal || 2,
      '水': featuresData?.fiveElements?.water || 2,
    },
    spatial: spatialData,
    features: featuresData,
  }
}

function groupFurnitureByType(furniture: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {}
  for (const f of furniture) {
    const type = f.type || 'other'
    if (!groups[type]) groups[type] = []
    groups[type].push(f)
  }
  return groups
}

function groupFurnitureByRoom(furniture: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {}
  for (const f of furniture) {
    const room = f.roomType || 'unknown'
    if (!groups[room]) groups[room] = []
    groups[room].push(f)
  }
  return groups
}

function roomTypeToName(type: string): string {
  const map: Record<string, string> = {
    house: '全屋',
    entrance: '玄关',
    'living-room': '客厅',
    living: '客厅',
    'master-bedroom': '主卧',
    bedroom: '卧室',
    study: '书房',
    kitchen: '厨房',
    bathroom: '卫生间',
    'dining-room': '餐厅',
    dining: '餐厅',
    balcony: '阳台',
  }
  return map[type] || type
}

function getScoreLevel(score: number): string {
  if (score >= 90) return '极佳'
  if (score >= 80) return '优秀'
  if (score >= 70) return '良好'
  if (score >= 60) return '中等'
  if (score >= 50) return '一般'
  return '较差'
}

function getOppositeDirection(dir: string): string {
  const map: Record<string, string> = {
    north: 'south', south: 'north', east: 'west', west: 'east',
    northeast: 'southwest', southwest: 'northeast',
    northwest: 'southeast', southeast: 'northwest',
  }
  return map[dir] || 'north'
}

function inputOrDefault<T>(input: PipelineInput, fn: (input: PipelineInput) => T | undefined, defaultValue: T): T {
  try {
    const result = fn(input)
    return result !== undefined && result !== null ? result : defaultValue
  } catch {
    return defaultValue
  }
}

// ========== 报告内容生成 ==========

function generateOverallScoreContent(result: FengShuiResult): string {
  return `## 综合评分：${result.overallScore} 分（${getScoreLevel(result.overallScore)}）

**置信度：** ${result.confidence}%

### 分项评分
| 项目 | 评分 | 等级 |
|------|------|------|
| 朝向 | ${result.directionScore} | ${getScoreLevel(result.directionScore)} |
| 户型 | ${result.layoutScore} | ${getScoreLevel(result.layoutScore)} |
| 房间 | ${result.roomScore} | ${getScoreLevel(result.roomScore)} |
| 五行 | ${result.elementScore} | ${getScoreLevel(result.elementScore)} |
| 环境 | ${result.environmentScore} | ${getScoreLevel(result.environmentScore)} |

### 主要优势
${(result.strengths || []).slice(0, 5).map(s => `✅ ${s}`).join('\n')}

### 主要问题
${(result.weaknesses || []).slice(0, 5).map(w => `⚠️ ${w}`).join('\n')}`
}

function generateHouseInfoContent(visionResult: ImageAnalysisResult): string {
  const info = visionResult.roomInfo
  return `## 房屋基本信息

| 项目 | 信息 |
|------|------|
| 房屋类型 | ${info?.type || '未知'} |
| 空间大小 | ${info?.size || '中等'} |
| 空间形状 | ${info?.shape || '长方形'} |
| 主朝向 | ${directionToChinese(info?.mainDirection || 'south')} |
| 自然采光 | ${info?.hasNaturalLight ? '有' : '无'} |
| 识别家具数 | ${visionResult.furniture?.length || 0} 件 |

### 五行分布
${Object.entries(visionResult.elementDistribution || {}).map(([element, count]) => {
  const bars = '█'.repeat(Math.max(1, Math.min(10, (count as number) * 2)))
  return `- ${element}: ${bars} (${count})`
}).join('\n')}`
}

function generateLayoutAnalysisContent(result: FengShuiResult, roomResult: any): string {
  return `## 户型分析

**户型评分：** ${result.layoutScore} 分（${getScoreLevel(result.layoutScore)}）

### 户型特点
- **户型形状：** ${roomResult?.rooms?.[0]?.spatial?.shape || '长方形'}
- **采光情况：** ${result.environmentScore > 70 ? '良好' : '一般'}
- **通透度：** ${result.directionScore > 70 ? '较好' : '一般'}

### 户型优势
${(result.strengths || []).filter(s => s.includes('户型') || s.includes('朝向')).slice(0, 3).map(s => `✅ ${s}`).join('\n') || '暂无明显优势'}

### 户型问题
${(result.weaknesses || []).filter(w => w.includes('户型') || w.includes('缺角')).slice(0, 3).map(w => `⚠️ ${w}`).join('\n') || '暂无明显问题'}`
}

function generateRoomAnalysisContent(roomResult: any): string {
  const rooms = roomResult?.rooms || []
  return `## 房间分析

共分析 ${rooms.length} 个房间

| 房间 | 评分 | 等级 |
|------|------|------|
${rooms.map((r: any) => `| ${r.roomName || r.roomType} | ${r.overallScore || r.score || '-'} | ${getScoreLevel(r.overallScore || r.score || 70)} |`).join('\n')}`
}

function generateSpatialAnalysisContent(result: FengShuiResult): string {
  return `## 空间分析

**空间评分：** ${result.environmentScore} 分（${getScoreLevel(result.environmentScore)}）

### 空间特点
- **采光：** ${result.environmentScore > 75 ? '充足' : result.environmentScore > 60 ? '中等' : '不足'}
- **通风：** ${result.roomScore > 70 ? '良好' : '一般'}
- **空间感：** ${result.layoutScore > 70 ? '开阔' : '适中'}

### 空间建议
- 保持空间整洁，避免杂乱
- 合理利用空间，提升利用率
- 注意动线流畅`
}

function generateFurnitureAnalysisContent(visionResult: ImageAnalysisResult): string {
  const furniture = visionResult.furniture || []
  return `## 家具分析

**识别家具：** ${furniture.length} 件

### 家具清单
${furniture.length > 0 
  ? furniture.slice(0, 8).map((f: any) => `- ${f.name || f.type || '家具'}（${f.position ? '已定位' : '位置待确认'}）`).join('\n')
  : '暂未识别到具体家具。'
}

### 布局评价
${furniture.length > 5 
  ? '家具布置较为充实，注意保持动线通畅。'
  : furniture.length > 0 
    ? '家具数量适中，布局合理。' 
    : '建议根据房间功能适当布置家具。'
}`
}

function generateRiskIssuesContent(result: FengShuiResult, evidenceChains: EvidenceChain[]): string {
  const inauspicious = evidenceChains.filter(e => e.type === 'inauspicious' || e.type === 'warning')
  
  return `## 风险问题

### 高风险问题
${inauspicious.length > 0 
  ? inauspicious.slice(0, 5).map((e, idx) => {
      return `${idx + 1}. ⚠️ **${e.conclusion}**
   - 影响：${formatImpact(e.impact)}
   - 严重度：${e.severity === 'high' ? '高' : e.severity === 'medium' ? '中' : '低'}
   - 置信度：${e.confidence}%`
    }).join('\n\n')
  : (result.warnings || []).slice(0, 5).map(w => `⚠️ ${w}`).join('\n') || '暂无高风险问题。'
}`
}

function generateClassicalEvidenceContent(evidenceChains: EvidenceChain[]): string {
  const refs = evidenceChains
    .flatMap(e => e.references)
    .filter((r, i, arr) => arr.findIndex(x => x.source === r.source) === i)
    .slice(0, 5)
  
  return `## 古籍依据

本次分析引用 ${refs.length} 部古籍/文献。

${refs.map((ref, idx) => {
  return `### ${idx + 1}. 《${ref.source}》

> ${ref.detail.slice(0, 150)}${ref.detail.length > 150 ? '...' : ''}
`
}).join('\n')}

${evidenceChains.length > 0 ? `\n点击各问题可查看完整证据链。` : ''}`
}

function generateAIInterpretationContent(result: FengShuiResult): string {
  const level = getScoreLevel(result.overallScore)
  
  return `## AI综合解读

根据风水分析结果，您的房屋整体风水**${level}**，综合得分 **${result.overallScore}** 分。

### 整体运势
- **财运：** ${result.elementScore > 70 ? '较旺，有较好的聚财能力' : '一般，建议通过调整布局提升'}
- **事业：** ${result.directionScore > 70 ? '顺利，有助事业发展' : '有提升空间'}
- **健康：** ${result.environmentScore > 70 ? '良好，居住环境有益健康' : '需要注意'}
- **感情：** ${result.roomScore > 70 ? '和睦，家庭关系融洽' : '需用心经营'}

### 建议
建议优先处理主要问题，逐步调整布局，整体运势有望提升。

*本解读由推演引擎自动生成，仅供参考。*`
}

function generateImprovementPlanContent(result: FengShuiResult, evidenceChains: EvidenceChain[]): string {
  const improvements = evidenceChains
    .filter(e => e.type === 'inauspicious' || e.type === 'warning')
    .sort((a, b) => b.hitRule?.priority || 0 - (a.hitRule?.priority || 0))
    .slice(0, 8)
  
  return `## 整改方案

${improvements.length > 0 
  ? improvements.map((item, idx) => {
      return `### ${idx + 1}. ${item.conclusion}

- **优先级：** ${item.severity === 'high' ? '🔴 紧急' : item.severity === 'medium' ? '🟡 重要' : '🟢 一般'}
- **改善建议：** ${item.improvement.suggestion}
- **难度：** ${item.improvement.difficulty === 'easy' ? '简单' : item.improvement.difficulty === 'medium' ? '中等' : '较难'}
- **成本：** ${item.improvement.costLevel === 'low' ? '低' : item.improvement.costLevel === 'medium' ? '中' : '高'}`
    }).join('\n\n')
  : (result.suggestions || []).slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join('\n') || '暂无需要整改的问题，继续保持良好布局！'
}`
}

function generateExpectedImprovementContent(result: FengShuiResult, evidenceChains: EvidenceChain[]): string {
  const totalImprovement = evidenceChains
    .filter(e => e.type === 'inauspicious' || e.type === 'warning')
    .reduce((acc, e) => acc + e.expectedImprovement.overall, 0)
  
  const actualImprovement = Math.min(25, totalImprovement)
  const newScore = Math.min(100, result.overallScore + actualImprovement)
  
  return `## 预计提升

如果按优先顺序完成所有整改，预计提升如下：

| 方面 | 当前 | 预计提升 | 调整后 |
|------|------|----------|--------|
| 综合评分 | ${result.overallScore} | +${actualImprovement} | ${newScore} |
| 健康运 | - | +${Math.round(actualImprovement * 0.6)} | - |
| 财运 | - | +${Math.round(actualImprovement * 0.5)} | - |
| 事业运 | - | +${Math.round(actualImprovement * 0.4)} | - |
| 感情运 | - | +${Math.round(actualImprovement * 0.3)} | - |

### 调整后等级
从 **${getScoreLevel(result.overallScore)}** 提升至 **${getScoreLevel(newScore)}**

*以上为理论最大提升值，实际效果因人而异。*`
}

function generateCautionsContent(): string {
  return `## 注意事项

### 风水调理须知

1. **风水是辅助，不是万能**
   风水是环境心理学的体现，能辅助提升运势，但根本还在于个人努力和行善积德。

2. **调整宜缓不宜急**
   建议一项一项调整，观察效果后再进行下一项，不要一次性大动。

3. **以人为本**
   风水布局应以居住者的舒适感为准，自己觉得舒服最重要。

4. **结合命理**
   最佳布局需结合个人生辰八字，本报告为通用分析，个性化建议请咨询专业人士。

5. **心存善念**
   福人居福地，福地福人居。心存善念，多行善事，自然有福报。

---

*本报告由推演引擎自动生成，仅供参考，不构成任何决策依据。*`
}

function formatImpact(impact: any): string {
  if (!impact) return '综合影响'
  const parts: string[] = []
  if (impact.health) parts.push('健康')
  if (impact.wealth) parts.push('财运')
  if (impact.career) parts.push('事业')
  if (impact.relationship) parts.push('感情')
  if (impact.study) parts.push('学业')
  return parts.length > 0 ? parts.join('、') : '综合影响'
}

function directionToChinese(dir: string): string {
  const map: Record<string, string> = {
    north: '正北', south: '正南', east: '正东', west: '正西',
    northeast: '东北', southeast: '东南', northwest: '西北', southwest: '西南',
  }
  return map[dir] || dir
}
