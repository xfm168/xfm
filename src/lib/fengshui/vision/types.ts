/**
 * 风水图片识别模块 - 类型定义
 * 
 * 图片 → AI分析 → FengShuiContext → Rule Engine → Explain Engine → AI Report
 */

import type { Direction, RoomType, FurnitureType, LayoutShape, HouseType, FiveElement } from '../types'

// ============ 图片输入类型 ============

export type ImageInputType = 'floor-plan' | 'room-photo' | 'full-house-photo' | 'site-photo'

export interface VisionInput {
  /** 图片数据（base64 或 URL） */
  imageData: string
  /** 图片类型 */
  imageType: ImageInputType
  /** 可选：用户描述 */
  userDescription?: string
  /** 可选：房屋基本信息 */
  houseInfo?: Partial<HouseBasicInfo>
  /** 可选：分析选项 */
  options?: VisionOptions
}

export interface HouseBasicInfo {
  totalFloors: number
  currentFloor: number
  totalArea: number
  houseType: HouseType
  houseAge: number
}

export interface VisionOptions {
  /** 分析深度 */
  depth: 'quick' | 'standard' | 'detailed'
  /** 是否识别煞气 */
  detectSha: boolean
  /** 是否识别五行 */
  analyzeElements: boolean
  /** 是否生成改造建议 */
  generateSuggestions: boolean
}

// ============ AI 分析结果类型 ============

export interface ImageAnalysisResult {
  /** 识别到的物体 */
  detectedObjects: DetectedObject[]
  /** 房间信息 */
  roomInfo: RoomAnalysisResult | Record<string, any>
  /** 家具列表 */
  furniture: FurnitureAnalysisResult[]
  /** 五行分布 */
  elementDistribution: ElementAnalysisResult
  /** 风水煞气（可选，可由后续步骤添加） */
  detectedSha?: DetectedSha[]
  /** 整体置信度（可选，可由 overallConfidence 映射） */
  confidence?: number
  /** 整体置信度（AI分析返回的原始字段） */
  overallConfidence?: number
  /** 原始AI结果 */
  rawResult?: any
  /** 错误信息 */
  error?: string
}

export interface DetectedObject {
  /** 物体类型 */
  type: DetectedObjectType
  /** 置信度 */
  confidence: number
  /** 位置（左/右/前/后/中） */
  position?: string
  /** 朝向 */
  direction?: Direction
  /** 边界框 */
  boundingBox?: BoundingBox
  /** 附加信息 */
  metadata?: Record<string, any>
}

export type DetectedObjectType = 
  | 'door' | 'window' | 'bed' | 'sofa' | 'desk' | 'stove'
  | 'mirror' | 'beam' | 'corridor' | 'toilet' | 'kitchen'
  | 'living-room' | 'bedroom' | 'bathroom' | 'balcony'
  | 'light' | 'plant' | 'aquarium' | 'television'
  | 'stairs' | 'entrance' | 'wall' | 'corner'

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface RoomAnalysisResult {
  /** 房间类型 */
  type: RoomType | 'unknown'
  /** 房间大小 */
  size: 'small' | 'medium' | 'large'
  /** 是否有自然光 */
  hasNaturalLight: boolean
  /** 主要朝向 */
  mainDirection: Direction
  /** 户型形状 */
  shape: LayoutShape
  /** 缺角情况 */
  missingCorners?: Direction[]
  /** 房间面积估算 */
  estimatedArea?: number
  /** 光照强度 */
  lightIntensity?: 'weak' | 'medium' | 'strong'
  /** 整体评分 */
  overallScore?: number
}

export interface FurnitureAnalysisResult {
  /** 家具类型 */
  type: FurnitureType
  /** 位置 */
  position: string
  /** 朝向 */
  direction: Direction
  /** 材质 */
  material?: FiveElement
  /** 尺寸估算 */
  size?: 'small' | 'medium' | 'large'
  /** 置信度 */
  confidence: number
  /** 是否摆放正确（风水角度） */
  isCorrectlyPlaced?: boolean
}

export interface ElementAnalysisResult {
  wood: number   // 木
  fire: number   // 火
  earth: number  // 土
  metal: number  // 金
  water: number  // 水
  dominant: FiveElement
  deficient: FiveElement
}

export interface DetectedSha {
  /** 煞气类型 */
  type: ShaType
  /** 严重程度 */
  severity: 'mild' | 'moderate' | 'severe'
  /** 置信度 */
  confidence: number
  /** 描述 */
  description: string
  /** 建议 */
  suggestions: string[]
  /** 相关规则ID */
  relatedRules?: string[]
}

export type ShaType = 
  | 'chuan-tang-sha'    // 穿堂煞
  | 'lu-chong-sha'       // 路冲煞
  | 'heng-liang-ya-ding' // 横梁压顶
  | 'kai-men-jian-zao'   // 开门见灶
  | 'ce-ya-zhong-gong'   // 厕压中宫
  | 'fan-gong-sha'       // 反弓煞
  | 'qiang-sha'          // 枪煞
  | 'que-jiao'           // 缺角
  | 'dian-ti-chong-men'  // 电梯冲门
  | 'jing-zi-dui-chuang' // 镜子对床
  | 'jing-zi-dui-men'    // 镜子对门
  | 'chuang-dui-men'     // 床对门
  | 'liang-ya-chuang'    // 横梁压床
  | 'unknown-sha'        // 未知煞气

// ============ Context 转换结果 ============

export interface VisionToContextResult {
  /** 转换后的 FengShuiContext */
  context: any  // FengShuiContext
  /** 原始分析结果 */
  analysis: ImageAnalysisResult
  /** 识别到的煞气 */
  detectedSha: DetectedSha[]
  /** 五行分布 */
  elements: ElementAnalysisResult
  /** 警告信息 */
  warnings: string[]
  /** 置信度 */
  confidence: number
}

// ============ 识别报告类型 ============

export interface VisionReport {
  /** 图片摘要 */
  summary: string
  /** 识别到的物体 */
  detectedObjects: DetectedObject[]
  /** 风水评估 */
  fengShuiAssessment: {
    overallScore: number
    isAuspicious: boolean
    mainIssues: string[]
    mainStrengths: string[]
  }
  /** 识别到的煞气 */
  shaIssues: DetectedSha[]
  /** 五行分析 */
  elementAnalysis: ElementAnalysisResult
  /** 立即可行的建议 */
  immediateSuggestions: string[]
  /** 需要关注的点 */
  concerns: string[]
  /** 置信度 */
  confidence: number
}
