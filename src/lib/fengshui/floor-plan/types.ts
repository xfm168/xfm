/**
 * 户型识别模块 - 类型定义
 */

import type { Direction, LayoutShape } from '../types'

export type { Direction, LayoutShape }

// ============ 户型轮廓类型 ============

export interface FloorPlanOutline {
  /** 外墙边界点（顺时针/逆时针） */
  boundary: Point[]
  /** 总面积 */
  totalArea: number
  /** 可用面积 */
  usableArea: number
  /** 形状类型 */
  shape: LayoutShape
  /** 缺角信息 */
  missingCorners: MissingCorner[]
  /** 置信度 */
  confidence: number
}

export interface Point {
  x: number
  y: number
}

export interface MissingCorner {
  /** 缺角方向 */
  direction: Direction
  /** 缺角严重程度 */
  severity: 'mild' | 'moderate' | 'severe'
  /** 缺角面积占比 */
  areaRatio: number
  /** 缺角位置描述 */
  description: string
}

// ============ 房间分隔类型 ============

export interface RoomDivision {
  /** 房间ID */
  id: string
  /** 房间名称 */
  name: string
  /** 房间类型 */
  type: RoomType
  /** 房间边界 */
  boundary: Point[]
  /** 面积 */
  area: number
  /** 位置 */
  position: Direction
  /** 朝向 */
  direction: Direction
  /** 是否有窗户 */
  hasWindow: boolean
  /** 是否有阳台 */
  hasBalcony: boolean
}

export type RoomType = 
  | 'living'      // 客厅
  | 'master-bedroom'   // 主卧
  | 'secondary-bedroom' // 次卧
  | 'children-bedroom'  // 儿童房
  | 'kitchen'     // 厨房
  | 'dining'      // 餐厅
  | 'bathroom'    // 卫生间
  | 'study'       // 书房
  | 'balcony'     // 阳台
  | 'corridor'    // 走廊
  | 'entrance'    // 玄关

// ============ 中宫类型 ============

export interface CenterPoint {
  /** 中宫坐标 */
  point: Point
  /** 中宫面积 */
  area: number
  /** 中宫功能（如果有） */
  function?: string
  /** 是否被占用 */
  isOccupied: boolean
  /** 风水评估 */
  assessment: {
    isGood: boolean
    reason: string
  }
}

// ============ 户型识别结果 ============

export interface FloorPlanAnalysis {
  /** 原始图像尺寸 */
  imageSize: { width: number; height: number }
  /** 户型轮廓 */
  outline: FloorPlanOutline
  /** 房间分隔 */
  rooms: RoomDivision[]
  /** 中宫信息 */
  centerPoint: CenterPoint
  /** 朝向信息 */
  orientation: OrientationInfo
  /** 风水评估 */
  fengShuiAssessment: FloorPlanAssessment
  /** 识别置信度 */
  confidence: number
}

export interface OrientationInfo {
  /** 主朝向 */
  mainDirection: Direction
  /** 大门朝向 */
  doorDirection: Direction
  /** 阳台朝向 */
  balconyDirection?: Direction
  /** 朝向置信度 */
  confidence: number
}

export interface FloorPlanAssessment {
  /** 综合评分 */
  overallScore: number
  /** 形状评估 */
  shapeAssessment: {
    score: number
    comment: string
  }
  /** 缺角评估 */
  missingCornerAssessment: MissingCornerAssessment[]
  /** 中宫评估 */
  centerAssessment: {
    score: number
    isGood: boolean
    comment: string
  }
  /** 主要问题 */
  mainIssues: AssessmentIssue[]
  /** 主要优点 */
  mainStrengths: string[]
}

export interface MissingCornerAssessment {
  direction: Direction
  severity: 'mild' | 'moderate' | 'severe'
  score: number
  impact: string
  suggestion: string
}

export interface AssessmentIssue {
  type: 'shape' | 'missing-corner' | 'center' | 'room-division'
  severity: 'mild' | 'moderate' | 'severe'
  description: string
  suggestion: string
}

// ============ 分析选项 ============

export interface FloorPlanAnalysisOptions {
  /** 分析深度 */
  depth: 'quick' | 'standard' | 'detailed'
  /** 是否识别房间类型 */
  identifyRoomTypes: boolean
  /** 是否分析朝向 */
  analyzeOrientation: boolean
  /** 是否评估风水 */
  assessFengShui: boolean
}
